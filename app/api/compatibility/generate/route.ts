import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import { calculateDeterministicScore } from '@/lib/scoring/compatibility';
import { processCompatibilityForPair } from '@/lib/ai/compatibility';
import { Participant } from '@/types/database';

export async function POST(req: NextRequest) {
  try {
    const { participantAId, participantBId, forceRegenerate } = await req.json();

    if (!participantAId || !participantBId) {
      return NextResponse.json({ success: false, error: "Both participant IDs are required" }, { status: 400 });
    }

    if (participantAId === participantBId) {
      return NextResponse.json({ success: false, error: "Cannot pair a participant with themselves" }, { status: 400 });
    }

    const supabase = getSupabaseServerClient();

    // 1. Fetch participants
    const { data: partA, error: errA } = await supabase.from('participants').select('*').eq('id', participantAId).maybeSingle();
    const { data: partB, error: errB } = await supabase.from('participants').select('*').eq('id', participantBId).maybeSingle();

    let pA: Participant = partA;
    let pB: Participant = partB;

    // Handle mock test IDs when operating in local test mode without persistent DB records
    if (!pA || !pB) {
      if (participantAId.startsWith('mock-') || participantBId.startsWith('mock-')) {
        pA = pA || {
          id: participantAId,
          session_id: null,
          display_name: "Rahul",
          gender: "Male",
          age_range: "18-21",
          personality_data: { energy: "Extrovert", vibe: "Energetic", humor: "Playful", spontaneity: "Spontaneous", socialEnergy: "High" },
          interests: ["Anime", "Gaming", "Music", "Coding"],
          favorites: { favoriteAnime: "Naruto", favoriteFood: "Pizza" },
          lifestyle_data: { rhythm: "Night owl", weekend: "Going out", style: "Adventure", focus: "Leisure focused", relationshipPreferences: ["Likes spontaneous plans"] },
          participant_code: "A7K92",
          created_at: new Date().toISOString()
        };

        pB = pB || {
          id: participantBId,
          session_id: null,
          display_name: "Priya",
          gender: "Female",
          age_range: "18-21",
          personality_data: { energy: "Introvert", vibe: "Calm", humor: "Witty", spontaneity: "Planner", socialEnergy: "Medium" },
          interests: ["Music", "Reading", "Anime", "Travel"],
          favorites: { favoriteAnime: "Your Name", favoriteFood: "Pasta" },
          lifestyle_data: { rhythm: "Night owl", weekend: "Mix of both", style: "Comfort", focus: "Study/Work focused", relationshipPreferences: ["Likes spontaneous plans"] },
          participant_code: "B8L21",
          created_at: new Date().toISOString()
        };
      } else {
        return NextResponse.json({ success: false, error: "One or both participants were not found" }, { status: 404 });
      }
    }

    // 2. Check for existing session (Idempotency)
    let sessionId: string | null = null;

    const { data: existingSession } = await supabase
      .from('compatibility_sessions')
      .select('id, status')
      .or(`and(participant_a_id.eq.${pA.id},participant_b_id.eq.${pB.id}),and(participant_a_id.eq.${pB.id},participant_b_id.eq.${pA.id})`)
      .maybeSingle();

    if (existingSession && existingSession.status === 'completed' && !forceRegenerate) {
      // Return existing result
      const { data: existingResult } = await supabase
        .from('compatibility_results')
        .select('*')
        .eq('session_id', existingSession.id)
        .maybeSingle();

      if (existingResult) {
        return NextResponse.json({
          success: true,
          sessionId: existingSession.id,
          result: existingResult,
          isCached: true
        });
      }
    }

    // Create or update session
    if (existingSession) {
      sessionId = existingSession.id;
      await supabase.from('compatibility_sessions').update({ status: 'processing', started_at: new Date().toISOString() }).eq('id', sessionId);
    } else {
      const { data: newSession } = await supabase
        .from('compatibility_sessions')
        .insert([{ participant_a_id: pA.id, participant_b_id: pB.id, status: 'processing', started_at: new Date().toISOString() }])
        .select()
        .single();
      sessionId = newSession?.id || `session-${Date.now()}`;
    }

    // 3. Calculate Deterministic Compatibility Score
    const scoreBreakdown = calculateDeterministicScore(pA, pB);

    // 4. Generate AI Compatibility Analysis Narrative
    const aiResponse = await processCompatibilityForPair(pA, pB, scoreBreakdown);
    const aiResult = aiResponse.result;

    // 5. Store result in DB
    const resultRecord = {
      session_id: sessionId,
      compatibility_percentage: aiResult.compatibility_percentage,
      headline: aiResult.headline,
      summary: aiResult.summary,
      strengths: aiResult.strengths,
      differences: aiResult.differences,
      fun_prediction: aiResult.fun_prediction,
      raw_ai_response: {
        provider_used: aiResponse.providerUsed,
        is_fallback: aiResponse.isFallback,
        error_message: aiResponse.errorMessage || null,
        timestamp: new Date().toISOString()
      } as any
    };

    const { data: savedResult } = await supabase
      .from('compatibility_results')
      .upsert([resultRecord], { onConflict: 'session_id' })
      .select()
      .single();

    const finalResult = savedResult || {
      id: `res-${Date.now()}`,
      ...resultRecord,
      created_at: new Date().toISOString()
    };

    // 6. Update session status
    await supabase
      .from('compatibility_sessions')
      .update({ status: 'completed', completed_at: new Date().toISOString() })
      .eq('id', sessionId);

    // 7. Enqueue into display_queue
    const { data: maxOrderData } = await supabase
      .from('display_queue')
      .select('display_order')
      .order('display_order', { ascending: false })
      .limit(1)
      .maybeSingle();

    const nextOrder = (maxOrderData?.display_order || 0) + 1;

    await supabase.from('display_queue').insert([{
      session_id: sessionId,
      result_id: finalResult.id,
      status: 'queued',
      display_order: nextOrder
    }]);

    return NextResponse.json({
      success: true,
      sessionId,
      result: finalResult,
      providerUsed: aiResponse.providerUsed,
      isFallback: aiResponse.isFallback,
      errorMessage: aiResponse.errorMessage,
      scoreBreakdown
    });
  } catch (err: any) {
    console.error("Generate compatibility error:", err);
    return NextResponse.json({ success: false, error: err.message || "Failed to generate compatibility" }, { status: 500 });
  }
}
