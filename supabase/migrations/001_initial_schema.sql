-- Supabase Database Schema Migration for AI Couple Compatibility Stall
-- Run this in your Supabase SQL Editor to set up tables, indexes, RLS policies, and Realtime

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. PROFILES TABLE (For Admin/Staff users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    auth_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    display_name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'staff' CHECK (role IN ('admin', 'staff', 'participant', 'display')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. PARTICIPANTS TABLE (For storing participant entries)
CREATE TABLE IF NOT EXISTS public.participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID,
    display_name TEXT NOT NULL,
    gender TEXT NOT NULL,
    age_range TEXT NOT NULL,
    personality_data JSONB NOT NULL DEFAULT '{}'::jsonb,
    interests JSONB NOT NULL DEFAULT '[]'::jsonb,
    favorites JSONB NOT NULL DEFAULT '{}'::jsonb,
    lifestyle_data JSONB NOT NULL DEFAULT '{}'::jsonb,
    participant_code TEXT UNIQUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. COMPATIBILITY SESSIONS TABLE (Pairing participant A & participant B)
CREATE TABLE IF NOT EXISTS public.compatibility_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    participant_a_id UUID NOT NULL REFERENCES public.participants(id) ON DELETE CASCADE,
    participant_b_id UUID NOT NULL REFERENCES public.participants(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'paired' CHECK (status IN ('waiting', 'paired', 'processing', 'completed', 'failed')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    CONSTRAINT unique_pairing UNIQUE (participant_a_id, participant_b_id)
);

-- 4. COMPATIBILITY RESULTS TABLE (AI generated analysis)
CREATE TABLE IF NOT EXISTS public.compatibility_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID UNIQUE NOT NULL REFERENCES public.compatibility_sessions(id) ON DELETE CASCADE,
    compatibility_percentage INT NOT NULL CHECK (compatibility_percentage >= 0 AND compatibility_percentage <= 100),
    headline TEXT NOT NULL,
    summary TEXT NOT NULL,
    strengths JSONB NOT NULL DEFAULT '[]'::jsonb,
    differences JSONB NOT NULL DEFAULT '[]'::jsonb,
    fun_prediction TEXT NOT NULL,
    raw_ai_response JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. DISPLAY QUEUE TABLE (Controls stall display sequence in real-time)
CREATE TABLE IF NOT EXISTS public.display_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES public.compatibility_sessions(id) ON DELETE CASCADE,
    result_id UUID NOT NULL REFERENCES public.compatibility_results(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'displaying', 'displayed', 'skipped')),
    display_order INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- INDEXES for fast lookup
CREATE INDEX IF NOT EXISTS idx_participants_code ON public.participants(participant_code);
CREATE INDEX IF NOT EXISTS idx_participants_created ON public.participants(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sessions_status ON public.compatibility_sessions(status);
CREATE INDEX IF NOT EXISTS idx_display_queue_status ON public.display_queue(status, created_at ASC);

-- ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.compatibility_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.compatibility_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.display_queue ENABLE ROW LEVEL SECURITY;

-- Allow public anonymous participant registration and reading own entry
CREATE POLICY "Allow public insert to participants" ON public.participants FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public select on participants" ON public.participants FOR SELECT USING (true);
CREATE POLICY "Allow public delete on participants for reset" ON public.participants FOR DELETE USING (true);

-- Allow public access to compatibility sessions, results, and display queue for event stall flow
CREATE POLICY "Allow public select compatibility_sessions" ON public.compatibility_sessions FOR SELECT USING (true);
CREATE POLICY "Allow public insert compatibility_sessions" ON public.compatibility_sessions FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update compatibility_sessions" ON public.compatibility_sessions FOR UPDATE USING (true);
CREATE POLICY "Allow public delete compatibility_sessions" ON public.compatibility_sessions FOR DELETE USING (true);

CREATE POLICY "Allow public select compatibility_results" ON public.compatibility_results FOR SELECT USING (true);
CREATE POLICY "Allow public insert compatibility_results" ON public.compatibility_results FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public delete compatibility_results" ON public.compatibility_results FOR DELETE USING (true);

CREATE POLICY "Allow public select display_queue" ON public.display_queue FOR SELECT USING (true);
CREATE POLICY "Allow public insert display_queue" ON public.display_queue FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update display_queue" ON public.display_queue FOR UPDATE USING (true);
CREATE POLICY "Allow public delete display_queue" ON public.display_queue FOR DELETE USING (true);

-- Enable Realtime for display_queue and compatibility_results
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.display_queue;
        ALTER PUBLICATION supabase_realtime ADD TABLE public.compatibility_results;
    END IF;
EXCEPTION WHEN OTHERS THEN
    -- Ignore if already added or publication doesn't exist yet
END $$;
