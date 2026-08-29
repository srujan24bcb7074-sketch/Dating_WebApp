import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  try {
    const { confirm } = await req.json();

    if (!confirm || confirm !== 'RESET_ALL_EVENT_DATA') {
      return NextResponse.json({ success: false, error: "Invalid confirmation passphrase" }, { status: 400 });
    }

    const supabase = getSupabaseServerClient();

    // Delete in cascade order
    await supabase.from('display_queue').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('compatibility_results').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('compatibility_sessions').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('participants').delete().neq('id', '00000000-0000-0000-0000-000000000000');

    return NextResponse.json({
      success: true,
      message: "Event database reset successfully."
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
