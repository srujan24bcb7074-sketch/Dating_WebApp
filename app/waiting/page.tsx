'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Heart, Sparkles, Copy, Check, ArrowRight, UserCheck, RefreshCw } from 'lucide-react';
import { useState, Suspense } from 'react';

function WaitingContent() {
  const searchParams = useSearchParams();
  const code = searchParams.get('code') || 'A7K92';
  const name = searchParams.get('name') || 'Participant';
  const [copied, setCopied] = useState(false);

  const copyCode = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen py-10 px-4 max-w-lg mx-auto flex flex-col justify-center items-center text-center">
      {/* Animated Heart Icon */}
      <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-rose-500 via-pink-500 to-purple-600 flex items-center justify-center shadow-2xl shadow-rose-500/40 mb-6 animate-pulse-glow">
        <Heart className="w-10 h-10 text-white fill-white" />
      </div>

      <div className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold uppercase tracking-wider mb-3">
        <Sparkles className="w-3.5 h-3.5" /> Registration Complete!
      </div>

      <h1 className="font-display text-3xl sm:text-4xl font-black text-white tracking-tight">
        You're All Set, {name}! 🎉
      </h1>
      <p className="text-slate-400 text-xs sm:text-sm mt-2 max-w-sm leading-relaxed">
        Your profile has been saved to the stall database. Give your unique code to the stall staff!
      </p>

      {/* Code Display Card */}
      <div className="my-8 w-full surface-card p-6 sm:p-8 rounded-3xl border border-rose-500/40 shadow-2xl relative glow-border-rose">
        <span className="text-xs uppercase tracking-widest font-extrabold text-rose-400 block mb-2">
          Your Stall Participant Code
        </span>

        <div className="flex items-center justify-center gap-4 my-2">
          <span className="font-mono font-black text-5xl sm:text-6xl tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-white via-rose-200 to-pink-400 glow-text-rose">
            {code}
          </span>
          <button
            onClick={copyCode}
            className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 text-slate-300 hover:text-white hover:border-rose-500 transition"
            title="Copy Code"
          >
            {copied ? <Check className="w-5 h-5 text-emerald-400" /> : <Copy className="w-5 h-5" />}
          </button>
        </div>

        {/* Animated Connection Pulse */}
        <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-center gap-2 text-xs text-rose-300">
          <RefreshCw className="w-3.5 h-3.5 animate-spin" style={{ animationDuration: '6s' }} />
          <span>Waiting for stall operator pairing...</span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="space-y-3 w-full">
        <Link
          href="/register"
          className="w-full py-3.5 rounded-2xl bg-slate-900 border border-slate-800 text-slate-200 font-bold text-xs sm:text-sm hover:border-slate-700 transition flex items-center justify-center gap-2"
        >
          <UserCheck className="w-4 h-4 text-purple-400" /> Register Another Participant
        </Link>

        <Link
          href="/"
          className="w-full py-3 rounded-2xl text-slate-500 text-xs hover:text-slate-300 transition flex items-center justify-center gap-1"
        >
          Return to Home <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
}

export default function WaitingPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center text-rose-400 text-sm">
        Loading confirmation...
      </div>
    }>
      <WaitingContent />
    </Suspense>
  );
}
