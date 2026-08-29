import { NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import { calculateDeterministicScore } from '@/lib/scoring/compatibility';
import { processCompatibilityForPair } from '@/lib/ai/compatibility';
import { Participant } from '@/types/database';

export async function POST() {
  try {
    const supabase = getSupabaseServerClient();
    const ts = Date.now().toString().slice(-4);

    const demoA: Partial<Participant> = {
      display_name: `Alex (Demo ${ts})`,
      gender: "Male",
      age_range: "18-21",
      personality_data: { energy: "Extrovert", vibe: "Energetic", humor: "Playful", spontaneity: "Spontaneous", socialEnergy: "High" },
      interests: ["Gaming", "Anime", "Movies", "Coding", "Music"],
      favorites: { favoriteMovie: "Interstellar", favoriteAnime: "Cyberpunk: Edgerunners", favoriteMusic: "Lo-Fi / Synthwave", favoriteFood: "Ramen" },
      lifestyle_data: { rhythm: "Night owl", weekend: "Going out", style: "Adventure", focus: "Balanced", relationshipPreferences: ["Likes spontaneous plans", "Likes sharing hobbies"] },
      participant_code: `DEMO${ts}A`
    };

    const demoB: Partial<Participant> = {
      display_name: `Taylor (Demo ${ts})`,
      gender: "Female",
      age_range: "18-21",
      personality_data: { energy: "Ambivert", vibe: "Calm", humor: "Witty", spontaneity: "Flexible", socialEnergy: "Medium" },
      interests: ["Movies", "Music", "Photography", "Travel", "Anime"],
      favorites: { favoriteMovie: "Inception", favoriteAnime: "Your Name", favoriteMusic: "Indie Pop", favoriteFood: "Sushi" },
      lifestyle_data: { rhythm: "Night owl", weekend: "Mix of both", style: "Balanced", focus: "Leisure focused", relationshipPreferences: ["Likes spontaneous plans", "Likes meaningful conversations"] },
      participant_code: `DEMO${ts}B`
    };

    const { data: pA } = await supabase.from('participants').insert([demoA]).select().single();
    const { data: pB } = await supabase.from('participants').insert([demoB]).select().single();

    const partA = pA || { id: `demo-a-${ts}`, ...demoA } as Participant;
    const partB = pB || { id: `demo-b-${ts}`, ...demoB } as Participant;

    // Create session
    const { data: session } = await supabase.from('compatibility_sessions').insert([{
      participant_a_id: partA.id,
      participant_b_id: partB.id,
      status: 'processing',
      started_at: new Date().toISOString()
    }]).select().single();

    const sessionId = session?.id || `demo-session-${ts}`;

    // Score & AI Analysis
    const score = calculateDeterministicScore(partA, partB);
    const aiResponse = await processCompatibilityForPair(partA, partB, score);
    const aiResult = aiResponse.result;

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

    const { data: savedResult } = await supabase.from('compatibility_results').insert([resultRecord]).select().single();
    const resId = savedResult?.id || `demo-res-${ts}`;

    // Complete session
    await supabase.from('compatibility_sessions').update({ status: 'completed', completed_at: new Date().toISOString() }).eq('id', sessionId);

    // Enqueue for display
    const { data: queueData } = await supabase.from('display_queue').insert([{
      session_id: sessionId,
      result_id: resId,
      status: 'queued',
      display_order: 999
    }]).select().single();

    return NextResponse.json({
      success: true,
      demoA: partA,
      demoB: partB,
      result: aiResult,
      providerUsed: aiResponse.providerUsed,
      isFallback: aiResponse.isFallback,
      queueItem: queueData
    });
  } catch (err: any) {
    console.error("Demo generation error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
