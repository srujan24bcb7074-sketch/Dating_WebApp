'use client';

import { useState, useEffect } from 'react';
import { Sparkles, Heart } from 'lucide-react';

export default function HeroTeaserAnimation() {
  const [phase, setPhase] = useState<'approaching' | 'meeting' | 'score' | 'pulse'>('approaching');
  const [teaserScore, setTeaserScore] = useState(0);

  useEffect(() => {
    let isMounted = true;

    const runTimeline = async () => {
      while (isMounted) {
        // Phase 1: Approaching (3s)
        setPhase('approaching');
        setTeaserScore(0);
        await new Promise(r => setTimeout(r, 2800));

        if (!isMounted) break;

        // Phase 2: Meeting Spark (1.5s)
        setPhase('meeting');
        await new Promise(r => setTimeout(r, 1200));

        if (!isMounted) break;

        // Phase 3: Score Count Up (2.5s)
        setPhase('score');
        for (let i = 0; i <= 87; i += 3) {
          if (!isMounted) break;
          setTeaserScore(i);
          await new Promise(r => setTimeout(r, 45));
        }

        if (!isMounted) break;

        // Phase 4: Hold & Glow (3.5s)
        setPhase('pulse');
        await new Promise(r => setTimeout(r, 3500));
      }
    };

    runTimeline();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="relative w-full max-w-lg mx-auto h-52 sm:h-60 rounded-3xl bg-slate-950/80 border border-slate-800/80 backdrop-blur-xl flex flex-col items-center justify-center overflow-hidden my-8 shadow-2xl shadow-rose-950/20">
      {/* Background Grid Pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f1f2e_1px,transparent_1px),linear-gradient(to_bottom,#1f1f2e_1px,transparent_1px)] bg-[size:2rem_2rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-30" />

      {/* Floating Orbs Moving Toward Center */}
      <div className="relative w-full flex items-center justify-center px-12 z-10">
        
        {/* Participant A Node (Rose Glow) */}
        <div
          className={`transition-all duration-1000 ease-in-out flex flex-col items-center ${
            phase === 'approaching'
              ? '-translate-x-16 sm:-translate-x-24 opacity-80'
              : 'translate-x-0 opacity-100'
          }`}
        >
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-rose-600 to-pink-500 flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-rose-500/40 glow-border-rose">
            A
          </div>
          <span className="text-[11px] text-rose-300 font-medium mt-1.5 uppercase tracking-wider">Participant A</span>
        </div>

        {/* Center Meeting Point / Spark / Score Reveal */}
        <div className="w-24 h-24 mx-2 sm:mx-6 flex items-center justify-center relative">
          {phase === 'meeting' && (
            <div className="animate-ping absolute inset-0 rounded-full bg-rose-500/30 border border-rose-400" />
          )}

          {phase === 'approaching' && (
            <div className="w-8 h-8 rounded-full border border-dashed border-slate-700 flex items-center justify-center text-slate-600 text-xs font-mono">
              +
            </div>
          )}

          {phase === 'meeting' && (
            <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-rose-500 to-purple-600 flex items-center justify-center shadow-xl shadow-rose-500/50 animate-scaleUp">
              <Sparkles className="w-6 h-6 text-amber-300 animate-spin" style={{ animationDuration: '4s' }} />
            </div>
          )}

          {(phase === 'score' || phase === 'pulse') && (
            <div className="flex flex-col items-center justify-center animate-fadeIn">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-rose-500 via-pink-500 to-purple-600 p-0.5 shadow-xl shadow-rose-500/40 glow-border-rose">
                <div className="w-full h-full bg-slate-950 rounded-[14px] flex flex-col items-center justify-center">
                  <span className="font-display font-black text-xl text-white glow-text-rose">
                    {teaserScore}%
                  </span>
                  <span className="text-[9px] text-rose-400 uppercase font-bold tracking-widest">Matched</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Participant B Node (Purple Glow) */}
        <div
          className={`transition-all duration-1000 ease-in-out flex flex-col items-center ${
            phase === 'approaching'
              ? 'translate-x-16 sm:translate-x-24 opacity-80'
              : 'translate-x-0 opacity-100'
          }`}
        >
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-600 to-violet-500 flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-purple-500/40 glow-border-purple">
            B
          </div>
          <span className="text-[11px] text-purple-300 font-medium mt-1.5 uppercase tracking-wider">Participant B</span>
        </div>
      </div>

      {/* Subtitle Status */}
      <div className="z-10 mt-4 text-xs text-slate-400 flex items-center gap-1.5">
        <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500 animate-pulse" />
        <span>
          {phase === 'approaching' && 'Connecting two separate profiles...'}
          {phase === 'meeting' && 'Calculating AI Compatibility Matrix...'}
          {(phase === 'score' || phase === 'pulse') && 'Live Stage Match Found! ✨'}
        </span>
      </div>
    </div>
  );
}
