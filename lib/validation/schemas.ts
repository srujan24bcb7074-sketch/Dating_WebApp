import { z } from 'zod';

export const RegistrationSchema = z.object({
  displayName: z.string().min(2, "Name must be at least 2 characters").max(30, "Name too long"),
  gender: z.string().min(1, "Please select your gender"),
  ageRange: z.string().min(1, "Please select your age range"),
  personality: z.object({
    energy: z.enum(['Introvert', 'Extrovert', 'Ambivert']),
    vibe: z.enum(['Calm', 'Energetic', 'Balanced']),
    humor: z.enum(['Playful', 'Serious', 'Witty']),
    spontaneity: z.enum(['Planner', 'Spontaneous', 'Flexible']),
  }),
  interests: z.array(z.string()).min(1, "Select at least 1 interest").max(10),
  favorites: z.object({
    favoriteMovie: z.string().optional(),
    favoriteAnime: z.string().optional(),
    favoriteMusic: z.string().optional(),
    favoriteFood: z.string().optional(),
    favoriteHobby: z.string().optional(),
  }),
  lifestyle: z.object({
    rhythm: z.enum(['Morning person', 'Night owl', 'Anytime']),
    weekend: z.enum(['Going out', 'Staying in', 'Mix of both']),
    style: z.enum(['Adventure', 'Comfort', 'Balanced']),
    focus: z.enum(['Study/Work focused', 'Leisure focused', 'Balanced']),
    relationshipPreferences: z.array(z.string()).default([]),
  }),
});

export const CompatibilityResultSchema = z.object({
  compatibility_percentage: z.number().min(0).max(100),
  headline: z.string().min(3),
  summary: z.string().min(10),
  strengths: z.array(z.string()).min(2).max(5),
  differences: z.array(z.string()).min(1).max(4),
  fun_prediction: z.string().min(5),
});

export type RegistrationFormData = z.infer<typeof RegistrationSchema>;
export type VerifiedAICompatibilityResult = z.infer<typeof CompatibilityResultSchema>;
