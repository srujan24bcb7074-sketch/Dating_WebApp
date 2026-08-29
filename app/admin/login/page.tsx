'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ShieldCheck, ArrowRight, Lock } from 'lucide-react';

export default function AdminLoginPage() {
  const router = useRouter();
  const [passcode, setPasscode] = useState('');
  const [error, setError] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!passcode) {
      setError('Please enter staff passcode');
      return;
    }
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('staff_auth', 'true');
    }
    router.push('/admin');
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md surface-card p-8 sm:p-10 rounded-4xl border border-slate-800 shadow-2xl text-center">
        <div className="w-16 h-16 rounded-3xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center mx-auto mb-4 text-purple-400">
          <ShieldCheck className="w-8 h-8" />
        </div>

        <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-white">Staff Admin Login</h1>
        <p className="text-slate-400 text-xs sm:text-sm mt-1">Stall Operators & Event Organizers Portal</p>

        {error && (
          <div className="mt-4 p-3 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="mt-6 space-y-4 text-left">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Staff Passcode / Key
            </label>
            <div className="relative">
              <input
                type="password"
                value={passcode}
                onChange={e => setPasscode(e.target.value)}
                placeholder="Enter event staff key (or click Login)"
                className="w-full pl-10 pr-4 py-3.5 rounded-2xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-purple-500"
              />
              <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-4" />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-purple-600 via-pink-600 to-rose-600 text-white font-extrabold text-sm shadow-xl shadow-purple-600/20 hover:scale-[1.01] transition flex items-center justify-center gap-2"
          >
            Access Admin Dashboard <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="mt-6 pt-4 border-t border-slate-800/80 text-xs text-slate-500">
          <Link href="/" className="hover:text-slate-300">Back to Landing Page</Link>
        </div>
      </div>
    </div>
  );
}
