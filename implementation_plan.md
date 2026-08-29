# Implementation Plan - AI Couple Compatibility Stall Web App ("Are You Compatible?")

Build a production-ready, visually stunning web application for a college/event stall where two participants register their details separately, staff pairs them, and an AI generates an entertaining compatibility analysis displayed on a live event stall screen.

## User Review Required

> [!IMPORTANT]
> - **Database Setup**: Database migrations are provided as re-usable SQL scripts in `supabase/migrations/`. You will run these in your Supabase SQL Editor.
> - **AI Integration**: The app features a resilient AI service layer (`lib/ai/provider.ts`) supporting **Google Gemini**, **OpenAI**, or an **Automatic Smart Fallback Generator** when no API key is provided. This ensures instant out-of-the-box local testing and zero deployment breakage.
> - **Supabase Auth & Realtime**: Realtime subscriptions allow `/display` to update automatically when staff triggers pairing from `/admin`.

---

## Proposed Architecture & Workflow

```
[ Participant Mobile ]
         │
         ▼ (POST /api/participants)
┌─────────────────────────────────┐
│       Supabase Database         │
│  (participants, sessions, RLS)  │
└─────────────────────────────────┘
         ▲
         │ (Fetch & Select Pair)
[ Staff Admin Dashboard ]
         │
         ▼ (POST /api/compatibility/generate)
┌─────────────────────────────────┐
│     Next.js Server API          │
│  1. Deterministic Scoring Logic │
│  2. AI Model Call & Zod Check   │
│  3. Save to results & queue     │
└─────────────────────────────────┘
         │
         ▼ (Supabase Realtime Event)
[ Live Event Stall Display Screen ]
  - 5-Stage Animated Reveal
  - Queue Management
  - Sound & Confetti Effects
```

---

## Proposed Changes

### 1. Database & Migrations
#### [NEW] [001_initial_schema.sql](file:///home/srujan/Downloads/Club/Dating_App/supabase/migrations/001_initial_schema.sql)
- Tables: `profiles`, `participants`, `compatibility_sessions`, `compatibility_results`, `display_queue`.
- Row Level Security (RLS) policies for anonymous participant submissions, staff admin access, and display queue reading.
- Indexes on `participant_code`, `session_id`, and queue statuses.

---

### 2. Type System & Validation
#### [NEW] [types/database.ts](file:///home/srujan/Downloads/Club/Dating_App/types/database.ts)
- Supabase schema types for Participant, CompatibilitySession, CompatibilityResult, and DisplayQueue.

#### [NEW] [types/compatibility.ts](file:///home/srujan/Downloads/Club/Dating_App/types/compatibility.ts)
- Interfaces for form payloads, score breakdown, AI output schema, and animation states.

#### [NEW] [lib/validation/schemas.ts](file:///home/srujan/Downloads/Club/Dating_App/lib/validation/schemas.ts)
- Zod schema for participant registration form validation.
- Zod schema for AI compatibility response validation (`compatibility_percentage`, `headline`, `summary`, `strengths`, `differences`, `fun_prediction`).

---

### 3. AI & Scoring Engine
#### [NEW] [lib/scoring/compatibility.ts](file:///home/srujan/Downloads/Club/Dating_App/lib/scoring/compatibility.ts)
- Deterministic compatibility algorithm computing score weights:
  - Shared interests (30%)
  - Personality alignment (25%)
  - Lifestyle compatibility (20%)
  - Favorite overlap (15%)
  - Complementary traits (10%)

#### [NEW] [lib/ai/provider.ts](file:///home/srujan/Downloads/Club/Dating_App/lib/ai/provider.ts)
- Universal AI provider abstraction supporting Gemini, OpenAI, or local Mock AI Fallback.

#### [NEW] [lib/ai/compatibility.ts](file:///home/srujan/Downloads/Club/Dating_App/lib/ai/compatibility.ts)
- System prompt builder enforcing strict safety, fun college event tone, zero discrimination/bias, and Zod validation parsing.

---

### 4. Supabase Clients
#### [NEW] [lib/supabase/client.ts](file:///home/srujan/Downloads/Club/Dating_App/lib/supabase/client.ts)
- Browser client for Supabase.

#### [NEW] [lib/supabase/server.ts](file:///home/srujan/Downloads/Club/Dating_App/lib/supabase/server.ts)
- Server-side client using `@supabase/ssr` / `@supabase/supabase-js` with service role key capability for secure API routes.

---

### 5. API Routes
#### [NEW] [app/api/participants/route.ts](file:///home/srujan/Downloads/Club/Dating_App/app/api/participants/route.ts)
- Participant registration endpoint (Generates unique code like `A7K92`, validates input, stores data).

#### [NEW] [app/api/compatibility/generate/route.ts](file:///home/srujan/Downloads/Club/Dating_App/app/api/compatibility/generate/route.ts)
- Staff-triggered pairing generation with idempotency checks, deterministic score computation, AI call, DB storage, and enqueueing to stall display.

#### [NEW] [app/api/display/queue/route.ts](file:///home/srujan/Downloads/Club/Dating_App/app/api/display/queue/route.ts)
- Enqueue, fetch, skip, and status updates for stall display.

#### [NEW] [app/api/admin/reset/route.ts](file:///home/srujan/Downloads/Club/Dating_App/app/api/admin/reset/route.ts)
- Event reset endpoint with passcode/session validation.

#### [NEW] [app/api/admin/demo/route.ts](file:///home/srujan/Downloads/Club/Dating_App/app/api/admin/demo/route.ts)
- Creates mock test participants & triggers demo result for pre-event display testing.

---

### 6. User Interface & Pages

#### [NEW] [app/page.tsx](file:///home/srujan/Downloads/Club/Dating_App/app/page.tsx)
- Landing page with neon event styling, hero section, CTA buttons ("Register Now", "Staff Admin", "Stall Display"), and live feature overview.

#### [NEW] [app/register/page.tsx](file:///home/srujan/Downloads/Club/Dating_App/app/register/page.tsx)
- 5-step interactive mobile-first registration wizard with progress step indicator, back/next navigation, validation, and transition effects.

#### [NEW] [app/waiting/page.tsx](file:///home/srujan/Downloads/Club/Dating_App/app/waiting/page.tsx)
- Post-registration confirmation screen with large participant code display (`A7K92`), event instructions, and optional result lookup link.

#### [NEW] [app/result/[id]/page.tsx](file:///home/srujan/Downloads/Club/Dating_App/app/result/[id]/page.tsx)
- Participant-facing result view.

#### [NEW] [app/display/page.tsx](file:///home/srujan/Downloads/Club/Dating_App/app/display/page.tsx)
- High-impact 16:9 TV stall display with Supabase Realtime subscription, 5-stage dramatic animated sequence (Analyzing -> Pairing -> Score Count Up -> Headline & Summary -> Highlights & Confetti), queue management, audio toggle, and idle waiting screen.

#### [NEW] [app/admin/login/page.tsx](file:///home/srujan/Downloads/Club/Dating_App/app/admin/login/page.tsx)
- Staff authentication page.

#### [NEW] [app/admin/page.tsx](file:///home/srujan/Downloads/Club/Dating_App/app/admin/page.tsx)
- Comprehensive volunteer dashboard:
  - Participant management table with search and filtering by gender/status.
  - Interactive pairing panel (Select Participant A & B -> Generate Compatibility).
  - Quick Demo result generator.
  - Display queue controller (Re-display, Skip, Clear).
  - Safety modal for Event Data Reset.

---

### 7. Styling & Configuration
#### [NEW] [app/globals.css](file:///home/srujan/Downloads/Club/Dating_App/app/globals.css)
- Event design system: vibrant dark mode palette, neon glows, glassmorphism, pulse animations, custom typography, counter animations.

#### [NEW] [.env.example](file:///home/srujan/Downloads/Club/Dating_App/.env.example) & [README.md](file:///home/srujan/Downloads/Club/Dating_App/README.md)
- Complete setup documentation for Supabase, AI Provider, Vercel deployment, and Stall operator handbook.

---

## Verification Plan

### Automated Tests & Code Quality
- Production build validation (`npm run build`).
- Type check with TypeScript compiler (`npx tsc --noEmit`).

### Manual & Realtime Verification
- Test participant registration flow on mobile preview.
- Verify participant code generation (5-char uppercase alphanumeric).
- Test staff pairing panel & mock/AI result generation.
- Test display queue & Realtime state transitions on `/display`.
- Test Event Reset functionality and safety modal.
