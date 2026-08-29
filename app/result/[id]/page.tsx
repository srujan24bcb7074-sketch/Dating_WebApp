import Link from 'next/link';
import { Heart, ArrowLeft, Sparkles, CheckCircle2, AlertCircle } from 'lucide-react';
import { getSupabaseServerClient } from '@/lib/supabase/server';

export default async function ResultPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = getSupabaseServerClient();

  const { data: result } = await supabase
    .from('compatibility_results')
    .select(`
      *,
      compatibility_sessions (
        participant_a:participants!participant_a_id (display_name),
        participant_b:participants!participant_b_id (display_name)
      )
    `)
    .eq('id', id)
    .maybeSingle();

  const sessionData = result?.compatibility_sessions as any;
  const nameA = sessionData?.participant_a?.display_name || 'Participant 1';
  const nameB = sessionData?.participant_b?.display_name || 'Participant 2';

  if (!result) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-3xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center mb-4 text-rose-400">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h1 className="font-display text-2xl font-bold text-white">Result Not Found</h1>
        <p className="text-slate-400 text-xs sm:text-sm mt-2 max-w-sm">This compatibility result may still be processing or was cleared during an event reset.</p>
        <Link href="/" className="mt-6 px-6 py-3 rounded-2xl bg-slate-900 border border-slate-700 text-slate-300 text-xs font-bold">
          Return Home
        </Link>
      </div>
    );
  }

  const score = result.compatibility_percentage;
  const scoreCategory = score >= 81 ? 'HIGHLY COMPATIBLE' : score >= 61 ? 'GREAT MATCH' : score >= 31 ? 'INTERESTING MATCH' : 'OPPOSITES ATTRACT';

  return (
    <div className="min-h-screen py-10 px-4 max-w-2xl mx-auto flex flex-col justify-between">
      <header className="flex items-center justify-between pb-6 border-b border-slate-800">
        <Link href="/" className="flex items-center gap-2 text-slate-400 hover:text-white transition text-xs font-semibold">
          <ArrowLeft className="w-4 h-4" />
          <span>Home</span>
        </Link>
        <div className="flex items-center gap-2">
          <Heart className="w-5 h-5 text-rose-500 fill-rose-500" />
          <span className="font-display font-bold text-white text-base">Compatibility Result</span>
        </div>
      </header>

      <main className="my-auto space-y-6 py-6">
        <div className="text-center">
          <h2 className="font-display text-3xl sm:text-4xl font-extrabold text-white">
            {nameA} <span className="text-rose-500">&</span> {nameB}
          </h2>
          <p className="text-rose-400 font-bold text-sm sm:text-base mt-2">"{result.headline}"</p>
        </div>

        {/* Score Ring Card */}
        <div className="flex justify-center my-6">
          <div className="w-44 h-44 rounded-full bg-gradient-to-tr from-rose-500 via-pink-500 to-purple-600 p-1.5 shadow-2xl shadow-rose-500/40 glow-border-rose">
            <div className="w-full h-full bg-slate-950 rounded-full flex flex-col items-center justify-center">
              <span className="font-display font-black text-5xl text-white glow-text-rose">
                {score}%
              </span>
              <span className="text-[10px] uppercase font-extrabold text-rose-400 tracking-widest mt-1">
                {scoreCategory}
              </span>
            </div>
          </div>
        </div>

        {/* Summary Card */}
        <div className="surface-card p-6 sm:p-8 rounded-3xl border border-slate-800 space-y-5">
          <h3 className="font-display text-white font-bold text-base flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-rose-400" /> AI Compatibility Breakdown
          </h3>
          <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">{result.summary}</p>

          <div className="pt-4 border-t border-slate-800 space-y-2">
            <span className="text-xs font-extrabold text-rose-400 uppercase tracking-wider block">Key Highlights</span>
            <ul className="space-y-2">
              {(result.strengths as string[] || []).map((st: string, idx: number) => (
                <li key={idx} className="text-xs sm:text-sm text-slate-300 flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>{st}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="pt-4 border-t border-slate-800">
            <span className="text-xs font-extrabold text-purple-400 uppercase tracking-wider block mb-1">Fun AI Stall Prediction</span>
            <p className="text-xs sm:text-sm italic text-purple-200 bg-purple-950/40 p-4 rounded-2xl border border-purple-800/40">
              "{result.fun_prediction}"
            </p>
          </div>
        </div>
      </main>

      <footer className="mt-8 text-center">
        <Link href="/register" className="text-xs text-slate-500 hover:text-slate-300">
          Register for another compatibility analysis
        </Link>
      </footer>
    </div>
  );
}
