import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = getSupabaseServerClient();
    const apiKey = process.env.AI_API_KEY || process.env.OPENROUTER_API_KEY || process.env.GEMINI_API_KEY || process.env.OPENAI_API_KEY;
    const modelName = process.env.AI_MODEL || 'google/gemini-2.5-flash';
    const isKeyConfigured = Boolean(apiKey && apiKey.trim() !== '' && apiKey !== 'your_ai_api_key_here');

    const aiStatus = {
      isConfigured: isKeyConfigured,
      modelName: modelName,
      provider: apiKey?.startsWith('sk-or-') || process.env.OPENROUTER_API_KEY || modelName.includes('/') ? 'OpenRouter' : 'Direct API'
    };

    const { data: queueItems, error } = await supabase
      .from('display_queue')
      .select(`
        id,
        session_id,
        result_id,
        status,
        display_order,
        created_at,
        compatibility_results (
          id,
          compatibility_percentage,
          headline,
          summary,
          strengths,
          differences,
          fun_prediction,
          raw_ai_response,
          created_at
        ),
        compatibility_sessions (
          id,
          participant_a:participants!participant_a_id (id, display_name, gender, interests, personality_data),
          participant_b:participants!participant_b_id (id, display_name, gender, interests, personality_data)
        )
      `)
      .order('display_order', { ascending: true })
      .order('created_at', { ascending: true });

    if (error) {
      return NextResponse.json({ success: true, queue: [], aiStatus });
    }

    return NextResponse.json({ success: true, queue: queueItems || [], aiStatus });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { queueId, action } = await req.json();
    const supabase = getSupabaseServerClient();

    if (action === 'clear_all') {
      await supabase.from('display_queue').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      return NextResponse.json({ success: true, message: "Queue cleared" });
    }

    if (!queueId) {
      return NextResponse.json({ success: false, error: "queueId is required" }, { status: 400 });
    }

    if (action === 'set_displaying') {
      await supabase.from('display_queue').update({ status: 'displaying' }).eq('id', queueId);
    } else if (action === 'set_displayed') {
      await supabase.from('display_queue').update({ status: 'displayed' }).eq('id', queueId);
    } else if (action === 'skip') {
      await supabase.from('display_queue').update({ status: 'skipped' }).eq('id', queueId);
    } else if (action === 're_queue') {
      await supabase.from('display_queue').update({ status: 'queued' }).eq('id', queueId);
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
