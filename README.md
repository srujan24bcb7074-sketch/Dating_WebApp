# Are You Compatible? 💕 — AI Couple Compatibility Stall Web App

A production-ready, high-impact web application built for college fests, corporate carnivals, and live event stalls where two participants register their details separately on mobile, and an AI generates an entertaining, animated compatibility breakdown displayed live on a dedicated 16:9 stall display screen.

---

## 🌟 Key Features

* **Separate Participant Registration (`/register`)**: 5-step mobile-first wizard collecting personality, interests, favorites, and lifestyle choices. Generates a unique 5-character participant code (e.g. `A7K92`).
* **Participant Code Confirmation (`/waiting`)**: Displays code badge & instructions for stall volunteers.
* **Deterministic + AI Compatibility Engine (`lib/scoring/compatibility.ts` & `lib/ai/provider.ts`)**:
  * Calculates base score breakdown: Shared Interests (30%), Personality Alignment (25%), Lifestyle Compatibility (20%), Favorite Overlap (15%), Complementary Traits (10%).
  * Prompts AI LLM (Gemini / OpenAI) for witty, entertaining, non-discriminatory narrative output.
  * Includes an **Automatic Smart Fallback Generator** so the app runs out-of-the-box in dev/demo mode even without API keys!
  * Strictly validated with **Zod** schema.
* **Flagship 16:9 Stall Display (`/display`)**:
  * Connected via **Supabase Realtime** & sequential queue manager.
  * 5-Stage Dramatic Reveal Sequence: *Analyzing -> Name Reveal -> Animated Score Counter (0% to target %) -> Headline Reveal -> Highlights & Celebration Confetti*.
  * Synthesized Web Audio sound effects & full-screen presentation mode.
* **Staff Admin Dashboard (`/admin`)**:
  * Search & filter registered participants by name/code/gender.
  * Interactive Pair Selector (Select Participant A + Participant B -> `Generate Compatibility`).
  * **Pre-Event Demo Trigger**: Generates mock test pairs and triggers stall display animations for testing before the crowd arrives.
  * **Display Queue Controls**: Skip current item, re-queue, clear queue.
  * **Event Data Reset Modal**: Safely clears event data with explicit passphrase verification (`RESET_ALL_EVENT_DATA`).

---

## 🛠️ Technology Stack

* **Frontend**: Next.js App Router, TypeScript, React 19, Tailwind CSS, Framer Motion, Lucide Icons, Canvas Confetti.
* **Backend**: Next.js Server API Routes, Deterministic Scoring, Zod Schema Validation.
* **Database & Realtime**: Supabase PostgreSQL + Supabase Realtime subscriptions.
* **AI Provider**: Google Gemini API / OpenAI API with Automatic Fallback.

---

## 🚀 Quick Setup & Local Development

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Fill in your Supabase credentials:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

AI_API_KEY=your_gemini_or_openai_key
AI_MODEL=gemini-1.5-flash
```
*(Note: If `AI_API_KEY` is omitted, the app will automatically use its internal high-quality fallback generator.)*

### 3. Run Supabase Database Migration
Open your **Supabase Dashboard -> SQL Editor** and execute the contents of:
`supabase/migrations/001_initial_schema.sql`

This creates all required tables (`participants`, `compatibility_sessions`, `compatibility_results`, `display_queue`, `profiles`), RLS policies, indexes, and enables Supabase Realtime.

### 4. Start Local Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📱 Stall Operational Workflow

1. **Participant Registration**:
   * Participants open `/register` on their smartphones.
   * Fill out the 5-step form and receive their unique 5-character code (e.g. `A7K92`).

2. **Stall Display Setup**:
   * On the stall TV / Laptop / Projector, open `/display`.
   * Click the Fullscreen icon and toggle sound on.

3. **Volunteer Pairing**:
   * Event staff open `/admin`.
   * Select Participant A and Participant B from the participant table or search by code.
   * Click **`❤️ Generate Compatibility`**.

4. **Live Reveal**:
   * The `/display` screen automatically picks up the result via Supabase Realtime and triggers the dramatic reveal sequence & confetti!

---

## 🌐 Vercel Deployment Instructions

1. Push this repository to GitHub/GitLab.
2. Go to [Vercel Dashboard](https://vercel.com) and click **Add New Project**.
3. Select your repository.
4. Add the following Environment Variables in Vercel:
   * `NEXT_PUBLIC_SUPABASE_URL`
   * `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   * `SUPABASE_SERVICE_ROLE_KEY`
   * `AI_API_KEY` (Optional)
5. Click **Deploy**.

---

## 🧪 Testing Production Build
To verify type safety and build optimization before deploying:
```bash
npm run build
```
