import Link from 'next/link';
import { Heart, Sparkles, Tv, ShieldCheck, UserCheck, Flame, ArrowRight, Zap, CheckCircle2 } from 'lucide-react';
import HeroTeaserAnimation from '@/components/HeroTeaserAnimation';

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col justify-between p-4 sm:p-8 max-w-6xl mx-auto">
      {/* Navigation Header */}
      <header className="flex justify-between items-center py-4 border-b border-slate-800/80">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-rose-500 to-purple-600 flex items-center justify-center shadow-lg shadow-rose-500/25">
            <Heart className="w-5 h-5 text-white fill-white animate-pulse" />
          </div>
          <div>
            <span className="font-display font-bold text-xl tracking-tight text-white block">
              Are You Compatible?
            </span>
            <span className="text-[11px] text-rose-400 font-semibold uppercase tracking-wider">AI Event Stall Experience</span>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <Link
            href="/admin/login"
            className="text-xs sm:text-sm text-slate-300 hover:text-white px-3.5 py-2 rounded-xl bg-slate-900/90 border border-slate-800 transition flex items-center gap-1.5"
          >
            <ShieldCheck className="w-4 h-4 text-purple-400" />
            <span>Staff Portal</span>
          </Link>
          <Link
            href="/display"
            className="text-xs sm:text-sm text-rose-300 hover:text-white px-4 py-2 rounded-xl bg-rose-950/40 border border-rose-800/60 transition flex items-center gap-1.5 glow-border-rose"
          >
            <Tv className="w-4 h-4 text-rose-400" />
            <span>Stall Display</span>
          </Link>
        </div>
      </header>

      {/* Hero Main Content */}
      <main className="my-auto py-12 flex flex-col items-center text-center">
        {/* Live Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-bold uppercase tracking-wider mb-6 animate-pulse">
          <Sparkles className="w-4 h-4 text-rose-400" />
          <span>Live Festival & Event Attraction</span>
        </div>

        {/* Main Display Headline */}
        <h1 className="font-display text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-white max-w-4xl leading-[1.1]">
          Discover What Happens When <span className="gradient-text-shimmer">Two Personalities</span> Meet AI
        </h1>

        <p className="mt-6 text-slate-400 text-base sm:text-lg max-w-2xl leading-relaxed">
          Two participants enter their quirks separately. Our AI calculates a hilarious, custom compatibility analysis displayed live on the stall screen!
        </p>

        {/* Hero Interactive Motion Teaser */}
        <HeroTeaserAnimation />

        {/* Action Buttons */}
        <div className="mt-4 flex flex-col sm:flex-row gap-4 w-full max-w-md justify-center">
          <Link
            href="/register"
            className="group relative inline-flex items-center justify-center px-8 py-4 rounded-2xl bg-gradient-to-r from-rose-500 via-pink-500 to-purple-600 text-white font-extrabold text-base shadow-xl shadow-rose-500/30 hover:shadow-rose-500/50 hover:scale-[1.02] active:scale-[0.98] transition duration-200"
          >
            <span className="flex items-center gap-2">
              <UserCheck className="w-5 h-5" />
              Register Profile
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </span>
          </Link>

          <Link
            href="/display"
            className="inline-flex items-center justify-center px-8 py-4 rounded-2xl bg-slate-900/90 border border-slate-800 text-slate-200 font-bold text-base hover:border-slate-700 hover:bg-slate-800/80 transition"
          >
            <span className="flex items-center gap-2">
              <Tv className="w-5 h-5 text-rose-400" />
              Open Display Screen
            </span>
          </Link>
        </div>

        {/* Feature Cards Matrix */}
        <div className="mt-16 grid grid-cols-1 sm:grid-cols-3 gap-6 w-full text-left">
          <div className="surface-card p-6 rounded-3xl border border-slate-800/80 surface-card-hover">
            <div className="w-10 h-10 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mb-4 text-rose-400">
              <UserCheck className="w-5 h-5" />
            </div>
            <h3 className="font-display text-white font-bold text-lg mb-1">Mobile Registration</h3>
            <p className="text-slate-400 text-xs sm:text-sm leading-relaxed">
              60-second mobile form wizard. Receive your unique code to present at the counter.
            </p>
          </div>

          <div className="surface-card p-6 rounded-3xl border border-slate-800/80 surface-card-hover">
            <div className="w-10 h-10 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center mb-4 text-purple-400">
              <Flame className="w-5 h-5" />
            </div>
            <h3 className="font-display text-white font-bold text-lg mb-1">AI Matrix & Scoring</h3>
            <p className="text-slate-400 text-xs sm:text-sm leading-relaxed">
              Combines interest overlaps, personality traits, and lifestyle choices into a custom narrative.
            </p>
          </div>

          <div className="surface-card p-6 rounded-3xl border border-slate-800/80 surface-card-hover">
            <div className="w-10 h-10 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center mb-4 text-cyan-400">
              <Tv className="w-5 h-5" />
            </div>
            <h3 className="font-display text-white font-bold text-lg mb-1">16:9 Stall Display</h3>
            <p className="text-slate-400 text-xs sm:text-sm leading-relaxed">
              Real-time automatic reveals with dramatic percentage counters, sound fanfare, and confetti!
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-6 border-t border-slate-800/80 text-center text-xs text-slate-500 flex flex-col sm:flex-row justify-between items-center gap-3">
        <p>© 2026 Are You Compatible? — Event & Festival AI Experience</p>
        <div className="flex gap-4">
          <Link href="/register" className="hover:text-slate-300">Register</Link>
          <Link href="/admin" className="hover:text-slate-300">Staff Portal</Link>
          <Link href="/display" className="hover:text-slate-300">Display Screen</Link>
        </div>
      </footer>
    </div>
  );
}
