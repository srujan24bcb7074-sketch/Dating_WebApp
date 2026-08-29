import { Participant, CompatibilityResult } from './database';

export interface ParticipantRegistrationInput {
  displayName: string;
  gender: string;
  ageRange: string;
  personality: {
    energy: 'Introvert' | 'Extrovert' | 'Ambivert';
    vibe: 'Calm' | 'Energetic' | 'Balanced';
    humor: 'Playful' | 'Serious' | 'Witty';
    spontaneity: 'Planner' | 'Spontaneous' | 'Flexible';
  };
  interests: string[];
  favorites: {
    favoriteMovie?: string;
    favoriteAnime?: string;
    favoriteMusic?: string;
    favoriteFood?: string;
    favoriteHobby?: string;
  };
  lifestyle: {
    rhythm: 'Morning person' | 'Night owl' | 'Anytime';
    weekend: 'Going out' | 'Staying in' | 'Mix of both';
    style: 'Adventure' | 'Comfort' | 'Balanced';
    focus: 'Study/Work focused' | 'Leisure focused' | 'Balanced';
    relationshipPreferences: string[];
  };
}

export interface ScoreBreakdown {
  interestsScore: number;
  personalityScore: number;
  lifestyleScore: number;
  favoritesScore: number;
  complementaryScore: number;
  finalScore: number;
}

export interface CompatibilityPayload {
  session_id: string;
  participantA: Participant;
  participantB: Participant;
  calculatedScore: ScoreBreakdown;
  result: CompatibilityResult;
}

export type DisplayStage =
  | 'idle'
  | 'analyzing'
  | 'names_reveal'
  | 'score_counting'
  | 'headline_reveal'
  | 'summary_highlights'
  | 'celebration';
