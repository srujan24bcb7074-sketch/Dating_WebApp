'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Heart, Search, Tv, Sparkles, RefreshCw, Trash2, CheckCircle2, AlertTriangle, Play, ShieldAlert, Users, Layers, Zap, Cpu, AlertCircle } from 'lucide-react';
import { Participant, DisplayQueueItem } from '@/types/database';

export default function AdminDashboardPage() {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [queue, setQueue] = useState<DisplayQueueItem[]>([]);
  const [aiStatus, setAiStatus] = useState<{ isConfigured: boolean; modelName: string; provider: string } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [genderFilter, setGenderFilter] = useState('All');

  // Pairing State
  const [selectedA, setSelectedA] = useState<Participant | null>(null);
  const [selectedB, setSelectedB] = useState<Participant | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDemoing, setIsDemoing] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string; details?: string } | null>(null);

  // Reset Modal
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetConfirmInput, setResetConfirmInput] = useState('');
  const [isResetting, setIsResetting] = useState(false);

  // Fetch Participants & Queue & AI Status
  const fetchData = useCallback(async () => {
    try {
      const [partRes, queueRes] = await Promise.all([
        fetch('/api/participants'),
        fetch('/api/display/queue')
      ]);

      const partData = await partRes.json();
      const queueData = await queueRes.json();

      if (partData.success) setParticipants(partData.participants || []);
      if (queueData.success) {
        setQueue(queueData.queue || []);
        if (queueData.aiStatus) setAiStatus(queueData.aiStatus);
      }
    } catch (err) {
      console.error("Fetch data error:", err);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 4000);
    return () => clearInterval(interval);
  }, [fetchData]);

  // Generate Compatibility for Selected Pair
  const handleGeneratePair = async () => {
    if (!selectedA || !selectedB) {
      setStatusMsg({ type: 'error', text: 'Please select both Participant A and Participant B!' });
      return;
    }

    if (selectedA.id === selectedB.id) {
      setStatusMsg({ type: 'error', text: 'Cannot pair a participant with themselves!' });
      return;
    }

    setIsGenerating(true);
    setStatusMsg(null);

    try {
      const res = await fetch('/api/compatibility/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          participantAId: selectedA.id,
          participantBId: selectedB.id,
          forceRegenerate: true
        }),
      });

      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Failed to generate compatibility");

      const providerText = data.providerUsed || (data.isFallback ? 'Fallback Generator' : 'AI Engine');
      const isFallback = Boolean(data.isFallback);

      setStatusMsg({
        type: isFallback ? 'error' : 'success',
        text: isFallback
          ? `Paired ${selectedA.display_name} + ${selectedB.display_name} using Fallback Generator.`
          : `Paired ${selectedA.display_name} + ${selectedB.display_name} via ${providerText}! Enqueued for stall display.`,
        details: isFallback ? (data.errorMessage || "Check API key or OpenRouter model availability.") : undefined
      });

      setSelectedA(null);
      setSelectedB(null);
      fetchData();
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: err.message || "Failed to generate pair" });
    } finally {
      setIsGenerating(false);
    }
  };

  // Run Demo Test Pair
  const handleRunDemo = async () => {
    setIsDemoing(true);
    setStatusMsg(null);
    try {
      const res = await fetch('/api/admin/demo', { method: 'POST' });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Failed to generate demo");
      setStatusMsg({ type: 'success', text: 'Demo test pair created & sent to stall display screen!' });
      fetchData();
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: err.message || "Failed to run demo" });
    } finally {
      setIsDemoing(false);
    }
  };

  // Queue Actions
  const handleQueueAction = async (queueId: string, action: string) => {
    try {
      await fetch('/api/display/queue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ queueId, action }),
      });
      fetchData();
    } catch (err) {
      console.error("Queue action error:", err);
    }
  };

  // Clear All Queue Items
  const handleClearQueue = async () => {
    try {
      await fetch('/api/display/queue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'clear_all' }),
      });
      fetchData();
    } catch (err) {
      console.error("Clear queue error:", err);
    }
  };

  // Reset All Event Data
  const handleEventReset = async () => {
    if (resetConfirmInput !== 'RESET_ALL_EVENT_DATA') {
      alert("Confirmation passphrase does not match!");
      return;
    }
    setIsResetting(true);
    try {
      const res = await fetch('/api/admin/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirm: 'RESET_ALL_EVENT_DATA' }),
      });
      const data = await res.json();
      if (data.success) {
        setShowResetModal(false);
        setResetConfirmInput('');
        setSelectedA(null);
        setSelectedB(null);
        setStatusMsg({ type: 'success', text: 'All event participant and session data reset successfully.' });
        fetchData();
      } else {
        alert(data.error || "Reset failed");
      }
    } catch (err: any) {
      alert(err.message || "Failed to reset data");
    } finally {
      setIsResetting(false);
    }
  };

  const filteredParticipants = participants.filter(p => {
    const matchesSearch =
      p.display_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.participant_code.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesGender = genderFilter === 'All' || p.gender === genderFilter;
    return matchesSearch && matchesGender;
  });

  const waitingCount = participants.length;
  const queuedCount = queue.filter(q => q.status === 'queued').length;
  const displayedCount = queue.filter(q => q.status === 'displayed').length;

  return (
    <div className="min-h-screen bg-[#07070a] text-slate-100 p-4 sm:p-8 max-w-7xl mx-auto space-y-8">
      {/* Header Bar */}
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-6 border-b border-slate-800/80">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-600 via-pink-600 to-rose-600 flex items-center justify-center shadow-lg shadow-purple-500/20">
            <Heart className="w-6 h-6 text-white fill-white" />
          </div>
          <div>
            <h1 className="font-display font-bold text-2xl sm:text-3xl text-white">
              Stall Operator Dashboard
            </h1>
            <span className="text-xs text-slate-400 font-medium">Live Event Pairing & Display Queue Control Panel</span>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={handleRunDemo}
            disabled={isDemoing}
            className="px-4 py-2.5 rounded-2xl bg-purple-950/50 border border-purple-800/80 text-purple-300 hover:text-white transition text-xs font-bold flex items-center gap-2"
          >
            <Play className="w-4 h-4 fill-purple-400" />
            {isDemoing ? 'Generating Demo...' : 'Run Pre-Event Demo'}
          </button>

          <Link
            href="/display"
            target="_blank"
            className="px-4 py-2.5 rounded-2xl bg-rose-950/50 border border-rose-800/80 text-rose-300 hover:text-white transition text-xs font-bold flex items-center gap-2 glow-border-rose"
          >
            <Tv className="w-4 h-4 text-rose-400" /> Open Display ↗
          </Link>

          <button
            onClick={() => setShowResetModal(true)}
            className="px-4 py-2.5 rounded-2xl bg-rose-950/30 border border-rose-900/40 text-rose-400 hover:bg-rose-900/50 transition text-xs font-bold flex items-center gap-2"
          >
            <Trash2 className="w-4 h-4" /> Reset Event
          </button>
        </div>
      </header>

      {/* AI ENGINE STATUS BANNER INDICATOR */}
      <div className={`p-4 rounded-2xl border flex items-center justify-between text-xs sm:text-sm font-semibold transition ${
        aiStatus?.isConfigured
          ? 'bg-purple-950/40 border-purple-500/40 text-purple-200'
          : 'bg-amber-950/30 border-amber-500/40 text-amber-300'
      }`}>
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-xl ${aiStatus?.isConfigured ? 'bg-purple-500/20 text-purple-400' : 'bg-amber-500/20 text-amber-400'}`}>
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-white">AI Engine Status:</span>
              {aiStatus?.isConfigured ? (
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold uppercase tracking-wider">
                  🟢 Live AI Configured ({aiStatus.provider})
                </span>
              ) : (
                <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold uppercase tracking-wider">
                  ⚠️ Fallback Generator Active (No API Key)
                </span>
              )}
            </div>
            <p className="text-xs opacity-80 mt-0.5 font-mono">
              Target Model: <strong>{aiStatus?.modelName || 'google/gemini-2.5-flash'}</strong>
            </p>
          </div>
        </div>

        <div className="hidden sm:block text-right text-xs opacity-75">
          {aiStatus?.isConfigured ? 'Direct LLM Responses Enabled' : 'Dynamic Mock Engine Active'}
        </div>
      </div>

      {/* Notifications */}
      {statusMsg && (
        <div className={`p-4 rounded-2xl border text-xs sm:text-sm font-semibold flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 animate-fadeIn ${
          statusMsg.type === 'success'
            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
            : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
        }`}>
          <div>
            <div className="flex items-center gap-2">
              {statusMsg.type === 'success' ? <CheckCircle2 className="w-5 h-5 text-emerald-400" /> : <AlertTriangle className="w-5 h-5 text-rose-400" />}
              <span>{statusMsg.text}</span>
            </div>
            {statusMsg.details && (
              <p className="text-xs opacity-90 mt-1 pl-7 font-mono text-amber-200">{statusMsg.details}</p>
            )}
          </div>
          <button onClick={() => setStatusMsg(null)} className="text-xs opacity-70 hover:opacity-100 shrink-0">Dismiss</button>
        </div>
      )}

      {/* EVENT STATS BAR */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="surface-card p-5 rounded-3xl border border-slate-800 flex items-center gap-4">
          <div className="w-10 h-10 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] text-slate-400 uppercase font-bold tracking-wider block">Registered</span>
            <span className="font-display font-black text-2xl text-white">{waitingCount}</span>
          </div>
        </div>

        <div className="surface-card p-5 rounded-3xl border border-slate-800 flex items-center gap-4">
          <div className="w-10 h-10 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] text-slate-400 uppercase font-bold tracking-wider block">Display Queue</span>
            <span className="font-display font-black text-2xl text-purple-400">{queuedCount}</span>
          </div>
        </div>

        <div className="surface-card p-5 rounded-3xl border border-slate-800 flex items-center gap-4">
          <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] text-slate-400 uppercase font-bold tracking-wider block">Pairs Revealed</span>
            <span className="font-display font-black text-2xl text-emerald-400">{displayedCount}</span>
          </div>
        </div>

        <div className="surface-card p-5 rounded-3xl border border-slate-800 flex items-center gap-4">
          <div className="w-10 h-10 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] text-slate-400 uppercase font-bold tracking-wider block">Total Sessions</span>
            <span className="font-display font-black text-2xl text-cyan-400">{queue.length}</span>
          </div>
        </div>
      </div>

      {/* MAIN DASHBOARD WORKSPACE GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* LEFT COLUMN: PAIRING WORKSPACE PANEL */}
        <div className="space-y-6">
          <div className="surface-card p-6 sm:p-8 rounded-4xl border border-slate-800 shadow-2xl space-y-6 relative overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <h2 className="font-display font-bold text-xl text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-rose-400" /> Pair Matchmaker
              </h2>
              <span className="text-xs text-rose-400 font-extrabold px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 uppercase tracking-wider">
                Operator Action
              </span>
            </div>

            {/* Participant A Slot */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
              <span className="text-xs font-bold text-rose-400 uppercase tracking-wider block">
                Participant A (Slot 1)
              </span>
              {selectedA ? (
                <div className="flex items-center justify-between bg-rose-500/10 p-3.5 rounded-xl border border-rose-500/30">
                  <div>
                    <span className="font-bold text-white block text-sm">{selectedA.display_name}</span>
                    <span className="text-xs text-rose-300 font-mono">Code: {selectedA.participant_code} • {selectedA.gender}</span>
                  </div>
                  <button onClick={() => setSelectedA(null)} className="text-xs text-slate-400 hover:text-white font-semibold">Remove</button>
                </div>
              ) : (
                <div className="p-4 rounded-xl border border-dashed border-slate-800 text-center text-xs text-slate-500 font-medium">
                  Select a participant from the right directory as "Set A"
                </div>
              )}
            </div>

            {/* Participant B Slot */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
              <span className="text-xs font-bold text-purple-400 uppercase tracking-wider block">
                Participant B (Slot 2)
              </span>
              {selectedB ? (
                <div className="flex items-center justify-between bg-purple-500/10 p-3.5 rounded-xl border border-purple-500/30">
                  <div>
                    <span className="font-bold text-white block text-sm">{selectedB.display_name}</span>
                    <span className="text-xs text-purple-300 font-mono">Code: {selectedB.participant_code} • {selectedB.gender}</span>
                  </div>
                  <button onClick={() => setSelectedB(null)} className="text-xs text-slate-400 hover:text-white font-semibold">Remove</button>
                </div>
              ) : (
                <div className="p-4 rounded-xl border border-dashed border-slate-800 text-center text-xs text-slate-500 font-medium">
                  Select a participant from the right directory as "Set B"
                </div>
              )}
            </div>

            {/* Generate Compatibility Button */}
            <button
              onClick={handleGeneratePair}
              disabled={isGenerating || !selectedA || !selectedB}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-rose-500 via-pink-500 to-purple-600 text-white font-extrabold text-base shadow-xl shadow-rose-500/30 hover:shadow-rose-500/50 disabled:opacity-40 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
            >
              {isGenerating ? (
                <>
                  <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Calculating AI Analysis...
                </>
              ) : (
                <>
                  <Heart className="w-5 h-5 text-white fill-white animate-pulse" /> Generate Compatibility
                </>
              )}
            </button>
          </div>

          {/* DISPLAY QUEUE & AI ENGINE INDICATOR */}
          <div className="surface-card p-6 rounded-3xl border border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-display font-bold text-base text-white flex items-center gap-2">
                <Tv className="w-4 h-4 text-cyan-400" /> Display Queue ({queue.length})
              </h3>
              {queue.length > 0 && (
                <button onClick={handleClearQueue} className="text-xs text-rose-400 hover:text-rose-300 font-bold">
                  Clear All
                </button>
              )}
            </div>

            <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
              {queue.length === 0 ? (
                <p className="text-xs text-slate-500 text-center py-6">Queue is empty. Generate a pair to trigger display animation!</p>
              ) : (
                queue.map(item => {
                  const pA = (item.compatibility_sessions as any)?.participant_a?.display_name || 'Part A';
                  const pB = (item.compatibility_sessions as any)?.participant_b?.display_name || 'Part B';
                  const score = item.compatibility_results?.compatibility_percentage;
                  const rawAi = item.compatibility_results?.raw_ai_response as any;
                  const providerUsed = rawAi?.provider_used || 'AI Engine';
                  const isFallback = Boolean(rawAi?.is_fallback);

                  return (
                    <div key={item.id} className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="font-bold text-white text-sm block">{pA} + {pB}</span>
                          <span className="text-xs text-slate-400">Score: <strong className="text-white">{score}%</strong> • Status: <strong className="text-rose-400 uppercase">{item.status}</strong></span>
                        </div>
                        <div className="flex gap-1.5">
                          <button
                            onClick={() => handleQueueAction(item.id, 're_queue')}
                            className="px-2.5 py-1 rounded-xl bg-slate-800 text-slate-300 hover:text-white font-bold text-xs"
                            title="Re-display"
                          >
                            Re-queue
                          </button>
                          <button
                            onClick={() => handleQueueAction(item.id, 'skip')}
                            className="px-2.5 py-1 rounded-xl bg-rose-950 text-rose-300 hover:text-rose-200 font-bold text-xs"
                            title="Skip"
                          >
                            Skip
                          </button>
                        </div>
                      </div>

                      {/* Engine Used Indicator Pill */}
                      <div className="pt-2 border-t border-slate-900 flex items-center justify-between text-[11px]">
                        <span className={`px-2 py-0.5 rounded-md font-bold text-[10px] flex items-center gap-1 ${
                          isFallback
                            ? 'bg-amber-500/10 text-amber-300 border border-amber-500/20'
                            : 'bg-purple-500/10 text-purple-300 border border-purple-500/20'
                        }`}>
                          {isFallback ? '⚡ Fallback Generator' : `🤖 ${providerUsed}`}
                        </span>

                        {rawAi?.error_message && (
                          <span className="text-[10px] text-rose-400 truncate max-w-[180px]" title={rawAi.error_message}>
                            Error: {rawAi.error_message}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: PARTICIPANTS DIRECTORY TABLE */}
        <div className="lg:col-span-2 surface-card p-6 sm:p-8 rounded-4xl border border-slate-800 space-y-5">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-800 pb-4">
            <div>
              <h2 className="font-display font-bold text-xl text-white">Registered Participants ({participants.length})</h2>
              <p className="text-xs text-slate-400 mt-0.5">Assign participants to Pair Slot 1 or Slot 2</p>
            </div>

            <button onClick={fetchData} className="px-3.5 py-2 rounded-2xl bg-slate-950 border border-slate-800 text-slate-300 hover:text-white transition text-xs font-bold flex items-center gap-1.5">
              <RefreshCw className="w-3.5 h-3.5" /> Refresh List
            </button>
          </div>

          {/* Search & Filter Bar */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Search name or participant code (e.g. A7K92)..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-3 rounded-2xl bg-slate-950 border border-slate-800 text-white text-xs sm:text-sm focus:outline-none focus:border-purple-500"
              />
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3.5" />
            </div>

            <div className="flex gap-1 bg-slate-950 p-1.5 rounded-2xl border border-slate-800 text-xs font-bold">
              {['All', 'Female', 'Male'].map(g => (
                <button
                  key={g}
                  onClick={() => setGenderFilter(g)}
                  className={`px-3.5 py-1.5 rounded-xl transition ${
                    genderFilter === g ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>

          {/* Table Container */}
          <div className="overflow-x-auto max-h-[520px] overflow-y-auto pr-1">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="sticky top-0 bg-[#07070a] text-slate-400 text-xs uppercase tracking-wider border-b border-slate-800">
                <tr>
                  <th className="py-3 px-3">Code</th>
                  <th className="py-3 px-3">Name</th>
                  <th className="py-3 px-3">Gender</th>
                  <th className="py-3 px-3">Interests</th>
                  <th className="py-3 px-3 text-right">Assign Pair</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredParticipants.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-slate-500 font-medium">
                      No participants registered yet. Direct participants to /register or click "Run Pre-Event Demo"!
                    </td>
                  </tr>
                ) : (
                  filteredParticipants.map(p => (
                    <tr key={p.id} className="hover:bg-slate-900/50 transition">
                      <td className="py-3.5 px-3 font-mono font-bold text-rose-400">{p.participant_code}</td>
                      <td className="py-3.5 px-3 font-semibold text-white">{p.display_name}</td>
                      <td className="py-3.5 px-3 text-slate-300">{p.gender}</td>
                      <td className="py-3.5 px-3">
                        <div className="flex flex-wrap gap-1">
                          {(p.interests || []).slice(0, 3).map(i => (
                            <span key={i} className="px-2 py-0.5 rounded-md bg-slate-900 border border-slate-800 text-[10px] font-semibold text-slate-300">
                              {i}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="py-3.5 px-3 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => setSelectedA(p)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                              selectedA?.id === p.id
                                ? 'bg-rose-600 text-white shadow-md'
                                : 'bg-rose-950/60 border border-rose-800/60 text-rose-300 hover:bg-rose-900'
                            }`}
                          >
                            Set A
                          </button>
                          <button
                            onClick={() => setSelectedB(p)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                              selectedB?.id === p.id
                                ? 'bg-purple-600 text-white shadow-md'
                                : 'bg-purple-950/60 border border-purple-800/60 text-purple-300 hover:bg-purple-900'
                            }`}
                          >
                            Set B
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* EVENT RESET CONFIRMATION MODAL */}
      {showResetModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="surface-card max-w-md w-full p-8 rounded-4xl border border-rose-500/40 shadow-2xl space-y-5 text-center relative">
            <div className="w-16 h-16 rounded-3xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center mx-auto text-rose-400">
              <ShieldAlert className="w-8 h-8" />
            </div>

            <h3 className="font-display text-2xl font-black text-white">Reset Event Data?</h3>
            <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
              This will permanently delete all registered participants, paired sessions, and generated results for this event batch.
            </p>

            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-left space-y-2">
              <label className="block text-[11px] font-bold text-rose-400 uppercase tracking-wider">
                Type passphrase to confirm: <strong className="text-white font-mono">RESET_ALL_EVENT_DATA</strong>
              </label>
              <input
                type="text"
                value={resetConfirmInput}
                onChange={e => setResetConfirmInput(e.target.value)}
                placeholder="RESET_ALL_EVENT_DATA"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-mono focus:outline-none focus:border-rose-500"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => { setShowResetModal(false); setResetConfirmInput(''); }}
                className="flex-1 py-3 rounded-2xl bg-slate-950 border border-slate-800 text-slate-300 text-xs font-bold"
              >
                Cancel
              </button>

              <button
                onClick={handleEventReset}
                disabled={isResetting || resetConfirmInput !== 'RESET_ALL_EVENT_DATA'}
                className="flex-1 py-3 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-extrabold disabled:opacity-40 transition"
              >
                {isResetting ? 'Resetting...' : 'Confirm Reset'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
