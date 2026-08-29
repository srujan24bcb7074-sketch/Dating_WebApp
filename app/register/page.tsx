'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Heart, ArrowLeft, ArrowRight, CheckCircle2, Sparkles, User, Sparkle, Film, Compass, Check } from 'lucide-react';
import { RegistrationFormData } from '@/lib/validation/schemas';

const INTEREST_ITEMS = [
  { label: "Gaming", emoji: "🎮" },
  { label: "Anime", emoji: "⛩️" },
  { label: "Movies", emoji: "🎬" },
  { label: "Music", emoji: "🎵" },
  { label: "Sports", emoji: "⚽" },
  { label: "Technology", emoji: "💻" },
  { label: "Art", emoji: "🎨" },
  { label: "Travel", emoji: "✈️" },
  { label: "Food", emoji: "🍜" },
  { label: "Reading", emoji: "📚" },
  { label: "Photography", emoji: "📸" },
  { label: "Coding", emoji: "⚡" },
  { label: "Fitness", emoji: "🏋️" },
  { label: "Fashion", emoji: "✨" },
  { label: "Memes", emoji: "🔥" },
  { label: "Stand-Up Comedy", emoji: "🎤" },
  { label: "Coffee", emoji: "☕" }
];

const REL_PREFERENCES = [
  "Likes meaningful conversations",
  "Likes spontaneous plans",
  "Likes sharing hobbies",
  "Likes teasing & banter",
  "Likes quiet companionship",
  "Likes trying new things together"
];

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Form State
  const [formData, setFormData] = useState<RegistrationFormData>({
    displayName: '',
    gender: '',
    ageRange: '18-21',
    personality: {
      energy: 'Ambivert',
      vibe: 'Balanced',
      humor: 'Playful',
      spontaneity: 'Flexible',
    },
    interests: [],
    favorites: {
      favoriteMovie: '',
      favoriteAnime: '',
      favoriteMusic: '',
      favoriteFood: '',
      favoriteHobby: '',
    },
    lifestyle: {
      rhythm: 'Night owl',
      weekend: 'Mix of both',
      style: 'Balanced',
      focus: 'Balanced',
      relationshipPreferences: ['Likes spontaneous plans', 'Likes sharing hobbies'],
    },
  });

  const toggleInterest = (interest: string) => {
    setFormData(prev => {
      const exists = prev.interests.includes(interest);
      const updated = exists
        ? prev.interests.filter(i => i !== interest)
        : [...prev.interests, interest];
      return { ...prev, interests: updated };
    });
  };

  const toggleRelPreference = (pref: string) => {
    setFormData(prev => {
      const exists = prev.lifestyle.relationshipPreferences.includes(pref);
      const updated = exists
        ? prev.lifestyle.relationshipPreferences.filter(p => p !== pref)
        : [...prev.lifestyle.relationshipPreferences, pref];
      return {
        ...prev,
        lifestyle: { ...prev.lifestyle, relationshipPreferences: updated }
      };
    });
  };

  const validateCurrentStep = (): boolean => {
    setErrorMsg('');
    if (step === 1) {
      if (!formData.displayName.trim() || formData.displayName.length < 2) {
        setErrorMsg("Please enter your name or nickname (min 2 characters).");
        return false;
      }
      if (!formData.gender) {
        setErrorMsg("Please select your gender.");
        return false;
      }
    } else if (step === 3) {
      if (formData.interests.length === 0) {
        setErrorMsg("Please select at least 1 interest!");
        return false;
      }
    }
    return true;
  };

  const handleNext = () => {
    if (validateCurrentStep()) {
      setStep(prev => Math.min(5, prev + 1));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleBack = () => {
    setErrorMsg('');
    setStep(prev => Math.max(1, prev - 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async () => {
    if (!validateCurrentStep()) return;
    setIsSubmitting(true);
    setErrorMsg('');

    try {
      const res = await fetch('/api/participants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || "Failed to submit registration");
      }

      router.push(`/waiting?code=${data.code}&name=${encodeURIComponent(formData.displayName)}`);
    } catch (err: any) {
      setErrorMsg(err.message || "Something went wrong. Please try again.");
      setIsSubmitting(false);
    }
  };

  const stepTitles = ["Basic Details", "Personality Vibe", "Interests", "Favorites", "Review"];

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 max-w-xl mx-auto flex flex-col justify-between">
      {/* Navigation Header */}
      <header className="flex items-center justify-between pb-4 border-b border-slate-800/80">
        <Link href="/" className="flex items-center gap-2 text-slate-400 hover:text-white transition text-xs font-semibold">
          <ArrowLeft className="w-4 h-4" />
          <span>Home</span>
        </Link>

        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-rose-500 to-purple-600 flex items-center justify-center shadow-md">
            <Heart className="w-4 h-4 text-white fill-white" />
          </div>
          <span className="font-display font-bold text-white text-base">Stall Entry</span>
        </div>

        <div className="text-xs text-rose-400 font-bold px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/20">
          0{step} / 05
        </div>
      </header>

      {/* Visual Step Progress Bar & Indicators */}
      <div className="my-6 space-y-2">
        <div className="flex justify-between items-center text-xs">
          <span className="font-display font-bold text-white text-sm">
            {stepTitles[step - 1]}
          </span>
          <span className="text-slate-400 text-xs">{Math.round((step / 5) * 100)}% Completed</span>
        </div>

        <div className="w-full bg-slate-900 h-2.5 rounded-full overflow-hidden border border-slate-800">
          <div
            className="bg-gradient-to-r from-rose-500 via-pink-500 to-purple-600 h-full transition-all duration-400 ease-out"
            style={{ width: `${(step / 5) * 100}%` }}
          />
        </div>

        <div className="flex justify-between gap-1 pt-1">
          {[1, 2, 3, 4, 5].map(s => (
            <div
              key={s}
              className={`h-1 flex-1 rounded-full transition ${
                s <= step ? 'bg-rose-500/60' : 'bg-slate-800'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Main Form Container */}
      <main className="my-auto surface-card p-6 sm:p-8 rounded-3xl border border-slate-800/80 shadow-2xl relative">
        {errorMsg && (
          <div className="mb-6 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs sm:text-sm text-center font-medium animate-pulse">
            ⚠️ {errorMsg}
          </div>
        )}

        {/* STEP 1: BASIC DETAILS */}
        {step === 1 && (
          <div className="space-y-6 animate-fadeIn">
            <div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/10 text-rose-400 text-xs font-bold uppercase tracking-wider mb-2">
                <User className="w-3.5 h-3.5" /> Step 1: Basic Details
              </span>
              <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-white">Who are you?</h2>
              <p className="text-slate-400 text-xs sm:text-sm mt-1">Enter your nickname to show on the live stall screen!</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Name or Nickname *
              </label>
              <input
                type="text"
                value={formData.displayName}
                onChange={e => setFormData({ ...formData, displayName: e.target.value })}
                placeholder="e.g. Rahul, Priya, Alex"
                className="w-full px-4 py-3.5 rounded-2xl bg-slate-950 border border-slate-800 text-white placeholder-slate-600 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 text-sm font-medium transition"
                maxLength={30}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Gender *
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  { key: 'Female', label: 'Female', symbol: '♀' },
                  { key: 'Male', label: 'Male', symbol: '♂' },
                  { key: 'Non-Binary / Other', label: 'Non-Binary', symbol: '✨' }
                ].map(g => {
                  const isSelected = formData.gender === g.key;
                  return (
                    <button
                      key={g.key}
                      type="button"
                      onClick={() => setFormData({ ...formData, gender: g.key })}
                      className={`p-4 rounded-2xl border text-sm font-bold transition flex items-center justify-between ${
                        isSelected
                          ? 'bg-gradient-to-r from-rose-500 to-purple-600 border-rose-400 text-white shadow-lg shadow-rose-500/25 glow-border-rose'
                          : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-900/60'
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <span>{g.symbol}</span>
                        <span>{g.label}</span>
                      </span>
                      {isSelected && <Check className="w-4 h-4 text-white" />}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Age Category
              </label>
              <div className="grid grid-cols-3 gap-3">
                {['Under 18', '18-21', '22+'].map(age => {
                  const isSelected = formData.ageRange === age;
                  return (
                    <button
                      key={age}
                      type="button"
                      onClick={() => setFormData({ ...formData, ageRange: age })}
                      className={`py-3 px-3 rounded-2xl border text-xs font-bold transition ${
                        isSelected
                          ? 'bg-rose-500/20 border-rose-500 text-rose-300'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      {age}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: PERSONALITY VIBE */}
        {step === 2 && (
          <div className="space-y-6 animate-fadeIn">
            <div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/10 text-purple-400 text-xs font-bold uppercase tracking-wider mb-2">
                <Sparkle className="w-3.5 h-3.5" /> Step 2: Personality Vibe
              </span>
              <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-white">Your Social Vibe</h2>
              <p className="text-slate-400 text-xs sm:text-sm mt-1">Help our AI understand your social energy!</p>
            </div>

            {/* Energy */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Social Energy
              </label>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { key: 'Introvert', icon: '🌙' },
                  { key: 'Extrovert', icon: '☀️' },
                  { key: 'Ambivert', icon: '✨' }
                ].map(item => {
                  const isSelected = formData.personality.energy === item.key;
                  return (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() => setFormData({
                        ...formData,
                        personality: { ...formData.personality, energy: item.key as any }
                      })}
                      className={`p-3.5 rounded-2xl border text-xs font-bold transition flex flex-col items-center gap-1 ${
                        isSelected
                          ? 'bg-gradient-to-tr from-purple-600 to-rose-500 border-purple-400 text-white shadow-lg glow-border-purple'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <span className="text-lg">{item.icon}</span>
                      <span>{item.key}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* General Vibe */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                General Vibe
              </label>
              <div className="grid grid-cols-3 gap-3">
                {(['Calm', 'Energetic', 'Balanced'] as const).map(v => {
                  const isSelected = formData.personality.vibe === v;
                  return (
                    <button
                      key={v}
                      type="button"
                      onClick={() => setFormData({
                        ...formData,
                        personality: { ...formData.personality, vibe: v }
                      })}
                      className={`py-3 px-2 rounded-2xl border text-xs font-bold transition ${
                        isSelected
                          ? 'bg-purple-500/20 border-purple-500 text-purple-300'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      {v}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Humor */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Humor Style
              </label>
              <div className="grid grid-cols-3 gap-3">
                {(['Playful', 'Serious', 'Witty'] as const).map(h => {
                  const isSelected = formData.personality.humor === h;
                  return (
                    <button
                      key={h}
                      type="button"
                      onClick={() => setFormData({
                        ...formData,
                        personality: { ...formData.personality, humor: h }
                      })}
                      className={`py-3 px-2 rounded-2xl border text-xs font-bold transition ${
                        isSelected
                          ? 'bg-rose-500/20 border-rose-500 text-rose-300'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      {h}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Spontaneity */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Planning Style
              </label>
              <div className="grid grid-cols-3 gap-3">
                {(['Planner', 'Spontaneous', 'Flexible'] as const).map(s => {
                  const isSelected = formData.personality.spontaneity === s;
                  return (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setFormData({
                        ...formData,
                        personality: { ...formData.personality, spontaneity: s }
                      })}
                      className={`py-3 px-2 rounded-2xl border text-xs font-bold transition ${
                        isSelected
                          ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      {s}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: INTERESTS & HOBBIES */}
        {step === 3 && (
          <div className="space-y-6 animate-fadeIn">
            <div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/10 text-cyan-400 text-xs font-bold uppercase tracking-wider mb-2">
                <Compass className="w-3.5 h-3.5" /> Step 3: Passions & Hobbies
              </span>
              <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-white">What do you love?</h2>
              <p className="text-slate-400 text-xs sm:text-sm mt-1">Select all topics you enjoy (Pick at least 1):</p>
            </div>

            <div className="flex flex-wrap gap-2.5 max-h-72 overflow-y-auto pr-1">
              {INTEREST_ITEMS.map(item => {
                const isSelected = formData.interests.includes(item.label);
                return (
                  <button
                    key={item.label}
                    type="button"
                    onClick={() => toggleInterest(item.label)}
                    className={`px-4 py-2.5 rounded-2xl border text-xs sm:text-sm font-bold transition flex items-center gap-2 ${
                      isSelected
                        ? 'bg-gradient-to-r from-rose-500 to-purple-600 border-rose-400 text-white shadow-lg shadow-rose-500/20 glow-border-rose'
                        : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-900/60'
                    }`}
                  >
                    <span>{item.emoji}</span>
                    <span>{item.label}</span>
                    {isSelected && <Check className="w-3.5 h-3.5 ml-1 text-white" />}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* STEP 4: FAVORITES & LIFESTYLE */}
        {step === 4 && (
          <div className="space-y-6 animate-fadeIn">
            <div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-pink-500/10 text-pink-400 text-xs font-bold uppercase tracking-wider mb-2">
                <Film className="w-3.5 h-3.5" /> Step 4: Favorites & Lifestyle
              </span>
              <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-white">Quirks & Preferences</h2>
              <p className="text-slate-400 text-xs sm:text-sm mt-1">Tell us a few quick favorites for fun AI banter!</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Favorite Movie / Anime</label>
                <input
                  type="text"
                  placeholder="e.g. Naruto, Interstellar"
                  value={formData.favorites.favoriteMovie}
                  onChange={e => setFormData({
                    ...formData,
                    favorites: { ...formData.favorites, favoriteMovie: e.target.value }
                  })}
                  className="w-full px-4 py-3 rounded-2xl bg-slate-950 border border-slate-800 text-white text-xs sm:text-sm placeholder-slate-600 focus:outline-none focus:border-rose-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Favorite Music Artist / Genre</label>
                <input
                  type="text"
                  placeholder="e.g. Lo-Fi, Taylor Swift, Rock"
                  value={formData.favorites.favoriteMusic}
                  onChange={e => setFormData({
                    ...formData,
                    favorites: { ...formData.favorites, favoriteMusic: e.target.value }
                  })}
                  className="w-full px-4 py-3 rounded-2xl bg-slate-950 border border-slate-800 text-white text-xs sm:text-sm placeholder-slate-600 focus:outline-none focus:border-rose-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Daily Rhythm</label>
                <select
                  value={formData.lifestyle.rhythm}
                  onChange={e => setFormData({
                    ...formData,
                    lifestyle: { ...formData.lifestyle, rhythm: e.target.value as any }
                  })}
                  className="w-full px-3 py-3 rounded-2xl bg-slate-950 border border-slate-800 text-white text-xs"
                >
                  <option value="Morning person">Morning person</option>
                  <option value="Night owl">Night owl</option>
                  <option value="Anytime">Anytime</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Weekend Style</label>
                <select
                  value={formData.lifestyle.weekend}
                  onChange={e => setFormData({
                    ...formData,
                    lifestyle: { ...formData.lifestyle, weekend: e.target.value as any }
                  })}
                  className="w-full px-3 py-3 rounded-2xl bg-slate-950 border border-slate-800 text-white text-xs"
                >
                  <option value="Going out">Going out</option>
                  <option value="Staying in">Staying in</option>
                  <option value="Mix of both">Mix of both</option>
                </select>
              </div>
            </div>

            {/* Relationship preferences */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                What do you value in a partner/friend?
              </label>
              <div className="space-y-2 max-h-44 overflow-y-auto">
                {REL_PREFERENCES.map(pref => {
                  const checked = formData.lifestyle.relationshipPreferences.includes(pref);
                  return (
                    <button
                      key={pref}
                      type="button"
                      onClick={() => toggleRelPreference(pref)}
                      className={`w-full text-left px-4 py-2.5 rounded-2xl border text-xs font-bold transition flex items-center justify-between ${
                        checked
                          ? 'bg-rose-500/20 border-rose-500 text-rose-300'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <span>{pref}</span>
                      {checked && <CheckCircle2 className="w-4 h-4 text-rose-400" />}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* STEP 5: REVIEW & SUBMIT */}
        {step === 5 && (
          <div className="space-y-6 animate-fadeIn">
            <div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-bold uppercase tracking-wider mb-2">
                <Sparkles className="w-3.5 h-3.5" /> Step 5: Final Review
              </span>
              <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-white">Ready to Submit!</h2>
              <p className="text-slate-400 text-xs sm:text-sm mt-1">Review your details before generating your stall code.</p>
            </div>

            <div className="space-y-3 bg-slate-950/80 p-5 rounded-2xl border border-slate-800 text-xs sm:text-sm">
              <div className="flex justify-between border-b border-slate-800 pb-2.5">
                <span className="text-slate-400">Name / Nickname</span>
                <span className="font-bold text-white">{formData.displayName}</span>
              </div>
              <div className="flex justify-between border-b border-slate-800 pb-2.5">
                <span className="text-slate-400">Gender</span>
                <span className="font-semibold text-slate-200">{formData.gender}</span>
              </div>
              <div className="flex justify-between border-b border-slate-800 pb-2.5">
                <span className="text-slate-400">Personality</span>
                <span className="font-semibold text-slate-200">{formData.personality.energy} • {formData.personality.vibe}</span>
              </div>
              <div>
                <span className="text-slate-400 block mb-1.5 font-semibold">Selected Interests ({formData.interests.length})</span>
                <div className="flex flex-wrap gap-1.5">
                  {formData.interests.map(i => (
                    <span key={i} className="px-2.5 py-1 rounded-xl bg-rose-500/20 text-rose-300 text-xs font-semibold border border-rose-500/30">
                      {i}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="mt-8 pt-4 border-t border-slate-800 flex items-center justify-between">
          {step > 1 ? (
            <button
              type="button"
              onClick={handleBack}
              disabled={isSubmitting}
              className="px-5 py-3 rounded-2xl bg-slate-950 border border-slate-800 text-slate-300 font-bold text-xs sm:text-sm hover:bg-slate-900 transition flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
          ) : <div />}

          {step < 5 ? (
            <button
              type="button"
              onClick={handleNext}
              className="px-7 py-3.5 rounded-2xl bg-gradient-to-r from-rose-500 via-pink-500 to-purple-600 text-white font-extrabold text-xs sm:text-sm shadow-xl shadow-rose-500/25 hover:shadow-rose-500/40 transition flex items-center gap-2 ml-auto"
            >
              Next Step <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-rose-500 via-pink-500 to-purple-600 text-white font-extrabold text-sm sm:text-base shadow-xl shadow-rose-500/30 hover:scale-[1.01] active:scale-[0.99] transition flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Generating Your Code...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5 text-amber-300" /> Complete Registration
                </>
              )}
            </button>
          )}
        </div>
      </main>

      {/* Footer Disclaimer */}
      <footer className="mt-6 text-center text-xs text-slate-500">
        🔒 Fun event experience only. No private data is published.
      </footer>
    </div>
  );
}
