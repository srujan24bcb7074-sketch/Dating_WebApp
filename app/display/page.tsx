'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import confetti from 'canvas-confetti';
import { Heart, Sparkles, Volume2, VolumeX, Maximize, Zap, CheckCircle2, ChevronRight } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { DisplayQueueItem } from '@/types/database';
import { DisplayStage } from '@/types/compatibility';

// Web Audio API Sound Synthesizer for stall sound effects
function playSound(type: 'beep' | 'reveal' | 'fanfare') {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    if (type === 'beep') {
      osc.frequency.setValueAtTime(440, ctx.currentTime);
      gain.gain.setValueAtTime(0.06, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
      osc.start();
      osc.stop(ctx.currentTime + 0.1);
    } else if (type === 'reveal') {
      osc.frequency.setValueAtTime(260, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.45);
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.45);
      osc.start();
      osc.stop(ctx.currentTime + 0.45);
    } else if (type === 'fanfare') {
      const now = ctx.currentTime;
      const notes = [523.25, 659.25, 783.99, 1046.50];
      notes.forEach((freq, i) => {
        const noteOsc = ctx.createOscillator();
        const noteGain = ctx.createGain();
        noteOsc.connect(noteGain);
        noteOsc.frequency.setValueAtTime(freq, now + i * 0.12);
        noteGain.gain.setValueAtTime(0.1, now + i * 0.12);
        noteGain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.12 + 0.35);
        noteOsc.start(now + i * 0.12);
        noteOsc.stop(now + i * 0.12 + 0.35);
      });
    }
  } catch (e) {
    // Audio Context restricted until user click
  }
}

export default function StallDisplayPage() {
  const [queue, setQueue] = useState<DisplayQueueItem[]>([]);
  const [currentItem, setCurrentItem] = useState<DisplayQueueItem | null>(null);
  const [stage, setStage] = useState<DisplayStage>('idle');
  const [animatedScore, setAnimatedScore] = useState(0);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const isProcessingRef = useRef(false);

  // 1. Fetch current queue
  const fetchQueue = useCallback(async () => {
    try {
      const res = await fetch('/api/display/queue');
      const data = await res.json();
      if (data.success && Array.isArray(data.queue)) {
        setQueue(data.queue);
      }
    } catch (err) {
      console.error("Queue fetch error:", err);
    }
  }, []);

  // 2. Realtime subscription to display_queue
  useEffect(() => {
    fetchQueue();

    const channel = supabase
      .channel('public:display_queue')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'display_queue' }, () => {
        fetchQueue();
      })
      .subscribe();

    const interval = setInterval(fetchQueue, 3000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, [fetchQueue]);

  // 3. Process next item in queue
  const processNextInQueue = useCallback(async () => {
    if (isProcessingRef.current) return;

    const nextQueued = queue.find(q => q.status === 'queued');
    if (!nextQueued) {
      if (stage !== 'idle') setStage('idle');
      setCurrentItem(null);
      return;
    }

    isProcessingRef.current = true;
    setCurrentItem(nextQueued);

    // Update status to displaying
    await fetch('/api/display/queue', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ queueId: nextQueued.id, action: 'set_displaying' }),
    });

    const targetScore = nextQueued.compatibility_results?.compatibility_percentage || 85;

    // --- ANIMATION TIMELINE ---
    // Phase 1: Analyzing (0 - 3s)
    setStage('analyzing');
    if (soundEnabled) playSound('beep');
    await new Promise(r => setTimeout(r, 2800));

    // Phase 2: Names Reveal (3 - 6s)
    setStage('names_reveal');
    if (soundEnabled) playSound('reveal');
    await new Promise(r => setTimeout(r, 2600));

    // Phase 3: Score Count Up (6 - 10s)
    setStage('score_counting');
    setAnimatedScore(0);
    const duration = 2500;
    const steps = 40;
    const stepTime = duration / steps;
    for (let i = 1; i <= steps; i++) {
      await new Promise(r => setTimeout(r, stepTime));
      const currentVal = Math.min(targetScore, Math.round((i / steps) * targetScore));
      setAnimatedScore(currentVal);
      if (i % 8 === 0 && soundEnabled) playSound('beep');
    }
    await new Promise(r => setTimeout(r, 800));

    // Phase 4: Headline Reveal (10 - 13s)
    setStage('headline_reveal');
    if (soundEnabled) playSound('reveal');
    await new Promise(r => setTimeout(r, 2200));

    // Phase 5: Highlights & Celebration Confetti (13 - 21s)
    setStage('summary_highlights');
    if (soundEnabled) playSound('fanfare');

    confetti({
      particleCount: 140,
      spread: 100,
      origin: { y: 0.55 },
      colors: ['#f43f5e', '#ec4899', '#a855f7', '#fb7185', '#38bdf8', '#fbbf24']
    });

    await new Promise(r => setTimeout(r, 9000));

    // Mark as displayed
    await fetch('/api/display/queue', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ queueId: nextQueued.id, action: 'set_displayed' }),
    });

    isProcessingRef.current = false;
    fetchQueue();
  }, [queue, stage, soundEnabled, fetchQueue]);

  useEffect(() => {
    if (!isProcessingRef.current && queue.some(q => q.status === 'queued')) {
      processNextInQueue();
    }
  }, [queue, processNextInQueue]);

  const handleSkipCurrent = async () => {
    if (currentItem) {
      await fetch('/api/display/queue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ queueId: currentItem.id, action: 'skip' }),
      });
      isProcessingRef.current = false;
      setStage('idle');
      setCurrentItem(null);
      fetchQueue();
    }
  };

  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
    } else {
      if (document.exitFullscreen) document.exitFullscreen();
    }
  };

  const pA = (currentItem?.compatibility_sessions as any)?.participant_a;
  const pB = (currentItem?.compatibility_sessions as any)?.participant_b;
  const nameA = pA?.display_name || 'Participant A';
  const nameB = pB?.display_name || 'Participant B';
  const result = currentItem?.compatibility_results;

  const scoreVal = animatedScore;
  const scoreCategoryLabel = scoreVal >= 81 ? 'HIGHLY COMPATIBLE 💖' : scoreVal >= 61 ? 'GREAT MATCH 🔥' : scoreVal >= 31 ? 'INTERESTING MATCH 💫' : 'OPPOSITES ATTRACT ⚡';

  return (
    <div className="w-screen h-screen bg-[#07070a] text-white flex flex-col justify-between p-8 sm:p-12 relative overflow-hidden select-none">
      {/* Ambient Lighting Orbs */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[900px] bg-rose-600/10 rounded-full blur-[160px] pointer-events-none animate-pulse-glow" />
      <div className="absolute top-1/4 right-1/4 w-[700px] h-[700px] bg-purple-600/10 rounded-full blur-[140px] pointer-events-none animate-pulse-glow" style={{ animationDelay: '1.5s' }} />

      {/* Header Bar */}
      <header className="flex justify-between items-center z-10 border-b border-slate-800/80 pb-5">
        <div className="flex items-center space-x-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-rose-500 via-pink-500 to-purple-600 flex items-center justify-center shadow-xl shadow-rose-500/40 glow-border-rose">
            <Heart className="w-8 h-8 text-white fill-white animate-pulse" />
          </div>
          <div>
            <h1 className="font-display font-black text-3xl tracking-tight uppercase bg-gradient-to-r from-white via-rose-200 to-pink-400 bg-clip-text text-transparent">
              Are You Compatible?
            </h1>
            <span className="text-xs text-rose-400 font-bold tracking-widest uppercase block mt-0.5">
              Live AI Event Attraction
            </span>
          </div>
        </div>

        {/* Status Indicator & Control Icons */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2.5 px-4 py-2 rounded-full bg-slate-950 border border-slate-800 text-xs font-bold text-slate-300">
            <span className={`w-3 h-3 rounded-full ${stage === 'idle' ? 'bg-amber-400' : 'bg-emerald-400 animate-ping'}`} />
            {stage === 'idle' ? 'Ready for Next Pair' : 'Live Match Analyzing'}
          </div>

          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="p-3 rounded-2xl bg-slate-950 border border-slate-800 text-slate-300 hover:text-white transition"
            title="Toggle Sound Effects"
          >
            {soundEnabled ? <Volume2 className="w-5 h-5 text-rose-400" /> : <VolumeX className="w-5 h-5 text-slate-500" />}
          </button>

          <button
            onClick={toggleFullScreen}
            className="p-3 rounded-2xl bg-slate-950 border border-slate-800 text-slate-300 hover:text-white transition"
            title="Toggle Fullscreen Mode"
          >
            <Maximize className="w-5 h-5 text-purple-400" />
          </button>
        </div>
      </header>

      {/* MAIN DISPLAY STAGE */}
      <main className="my-auto z-10 flex flex-col items-center justify-center text-center py-6">

        {/* STAGE 0: IDLE SCREEN */}
        {stage === 'idle' && (
          <div className="space-y-6 max-w-3xl animate-fadeIn">
            <div className="w-28 h-28 rounded-3xl bg-slate-950 border border-rose-500/40 flex items-center justify-center mx-auto shadow-2xl glow-border-rose">
              <Sparkles className="w-14 h-14 text-rose-500 animate-spin" style={{ animationDuration: '10s' }} />
            </div>

            <h2 className="font-display text-5xl sm:text-7xl font-black text-white tracking-tight">
              Ready for the Next Pair 💕
            </h2>
            <p className="text-slate-400 text-xl sm:text-2xl leading-relaxed max-w-2xl mx-auto">
              Scan the code at the stall to register! Your AI compatibility analysis will reveal live right here.
            </p>

            <div className="inline-flex items-center gap-2.5 px-6 py-3 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-300 font-extrabold text-sm animate-pulse">
              <Zap className="w-4 h-4 text-amber-400" /> Waiting for stall operator pairing...
            </div>
          </div>
        )}

        {/* STAGE 1: ANALYZING */}
        {stage === 'analyzing' && (
          <div className="space-y-8 animate-fadeIn">
            <div className="relative w-40 h-40 mx-auto flex items-center justify-center">
              <div className="absolute inset-0 rounded-full border-4 border-rose-500/20 border-t-rose-500 animate-spin" />
              <Heart className="w-20 h-20 text-rose-500 fill-rose-500 animate-pulse" />
            </div>
            <h2 className="font-display text-5xl sm:text-6xl font-black text-white">
              Connecting Profiles...
            </h2>
            <p className="text-rose-400 text-2xl font-bold tracking-wide animate-pulse">
              AI Calculating Personality & Interest Synergy Matrix
            </p>
          </div>
        )}

        {/* STAGES 2 - 5: PAIR & RESULT REVEAL */}
        {(stage === 'names_reveal' || stage === 'score_counting' || stage === 'headline_reveal' || stage === 'summary_highlights') && (
          <div className="w-full max-w-5xl space-y-8 animate-fadeIn">
            {/* Dual Name Header Cards */}
            <div className="flex items-center justify-center gap-6 sm:gap-12">
              <div className="surface-card px-10 py-6 rounded-3xl border-2 border-rose-500/40 shadow-2xl glow-border-rose">
                <span className="font-display font-black text-4xl sm:text-6xl text-white block">
                  {nameA}
                </span>
                <span className="text-xs text-rose-400 font-extrabold tracking-widest uppercase mt-1 block">Participant A</span>
              </div>

              <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-rose-500 to-purple-600 flex items-center justify-center text-white font-black text-3xl shadow-xl shadow-rose-500/50 animate-pulse">
                +
              </div>

              <div className="surface-card px-10 py-6 rounded-3xl border-2 border-purple-500/40 shadow-2xl glow-border-purple">
                <span className="font-display font-black text-4xl sm:text-6xl text-white block">
                  {nameB}
                </span>
                <span className="text-xs text-purple-400 font-extrabold tracking-widest uppercase mt-1 block">Participant B</span>
              </div>
            </div>

            {/* STAGE 3: SCORE COUNT UP */}
            {(stage === 'score_counting' || stage === 'headline_reveal' || stage === 'summary_highlights') && (
              <div className="my-6 flex flex-col items-center justify-center animate-scaleUp">
                <div className="relative w-56 h-56 sm:w-64 sm:h-64 rounded-full bg-gradient-to-tr from-rose-500 via-pink-500 to-purple-600 p-2 shadow-2xl shadow-rose-500/50 glow-border-rose">
                  <div className="w-full h-full bg-[#07070a] rounded-full flex flex-col items-center justify-center">
                    <span className="font-display font-black text-7xl sm:text-8xl text-white tracking-tight glow-text-rose">
                      {animatedScore}%
                    </span>
                    <span className="text-xs sm:text-sm uppercase font-extrabold tracking-widest text-rose-400 mt-1">
                      {scoreCategoryLabel}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* STAGE 4: HEADLINE REVEAL */}
            {(stage === 'headline_reveal' || stage === 'summary_highlights') && result && (
              <div className="animate-fadeIn">
                <h3 className="font-display text-3xl sm:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-rose-300 via-pink-300 to-purple-300 glow-text-rose">
                  "{result.headline}"
                </h3>
              </div>
            )}

            {/* STAGE 5: SUMMARY & HIGHLIGHTS */}
            {stage === 'summary_highlights' && result && (
              <div className="surface-card p-8 sm:p-10 rounded-4xl border border-slate-800 text-left space-y-6 max-w-4xl mx-auto shadow-2xl animate-fadeIn">
                <p className="text-slate-200 text-lg sm:text-xl leading-relaxed text-center font-medium">
                  {result.summary}
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-6 border-t border-slate-800">
                  <div>
                    <span className="text-xs font-extrabold text-rose-400 uppercase tracking-widest block mb-3">
                      ❤️ Compatibility Highlights
                    </span>
                    <ul className="space-y-2.5">
                      {(result.strengths as string[] || []).map((st: string, idx: number) => (
                        <li key={idx} className="text-sm sm:text-base text-slate-300 flex items-start gap-2.5">
                          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                          <span>{st}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <span className="text-xs font-extrabold text-purple-400 uppercase tracking-widest block mb-3">
                      🔮 AI Stall Prediction
                    </span>
                    <p className="text-sm sm:text-base text-purple-200 bg-purple-950/40 p-4 rounded-2xl border border-purple-800/40 italic leading-relaxed">
                      "{result.fun_prediction}"
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* FOOTER BAR */}
      <footer className="z-10 flex justify-between items-center pt-5 border-t border-slate-800/80 text-xs text-slate-400">
        <div className="flex items-center gap-3">
          <span className="font-bold text-slate-300">Stall Queue: {queue.filter(q => q.status === 'queued').length} waiting</span>
          {currentItem && (
            <button
              onClick={handleSkipCurrent}
              className="px-3.5 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-rose-400 hover:text-rose-300 transition text-xs font-bold"
            >
              Skip Current Pair
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 text-slate-500">
          <span>Powered by Next.js & Supabase Realtime</span>
        </div>
      </footer>
    </div>
  );
}
