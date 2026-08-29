export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Profile {
  id: string;
  auth_user_id: string | null;
  display_name: string;
  role: 'admin' | 'staff' | 'participant' | 'display';
  created_at: string;
}

export interface PersonalityData {
  energy: 'Introvert' | 'Extrovert' | 'Ambivert';
  socialEnergy: string;
  vibe: 'Calm' | 'Energetic' | 'Balanced';
  humor: 'Playful' | 'Serious' | 'Witty';
  spontaneity: 'Planner' | 'Spontaneous' | 'Flexible';
}

export interface FavoritesData {
  favoriteMovie?: string;
  favoriteAnime?: string;
  favoriteMusic?: string;
  favoriteFood?: string;
  favoriteHobby?: string;
}

export interface LifestyleData {
  rhythm: 'Morning person' | 'Night owl' | 'Anytime';
  weekend: 'Going out' | 'Staying in' | 'Mix of both';
  style: 'Adventure' | 'Comfort' | 'Balanced';
  focus: 'Study/Work focused' | 'Leisure focused' | 'Balanced';
  relationshipPreferences: string[];
}

export interface Participant {
  id: string;
  session_id: string | null;
  display_name: string;
  gender: string;
  age_range: string;
  personality_data: PersonalityData;
  interests: string[];
  favorites: FavoritesData;
  lifestyle_data: LifestyleData;
  participant_code: string;
  created_at: string;
}

export interface CompatibilitySession {
  id: string;
  participant_a_id: string;
  participant_b_id: string;
  status: 'waiting' | 'paired' | 'processing' | 'completed' | 'failed';
  created_at: string;
  started_at: string | null;
  completed_at: string | null;
  participant_a?: Participant;
  participant_b?: Participant;
}

export interface CompatibilityResult {
  id: string;
  session_id: string;
  compatibility_percentage: number;
  headline: string;
  summary: string;
  strengths: string[];
  differences: string[];
  fun_prediction: string;
  raw_ai_response?: Json;
  created_at: string;
}

export interface DisplayQueueItem {
  id: string;
  session_id: string;
  result_id: string;
  status: 'queued' | 'displaying' | 'displayed' | 'skipped';
  display_order: number;
  created_at: string;
  compatibility_results?: CompatibilityResult;
  compatibility_sessions?: CompatibilitySession;
}
