import { generateAICompatibilityAnalysis, AIAnalysisResponse } from './provider';
import { CompatibilityResultSchema, VerifiedAICompatibilityResult } from '@/lib/validation/schemas';
import { Participant } from '@/types/database';
import { ScoreBreakdown } from '@/types/compatibility';

export async function processCompatibilityForPair(
  participantA: Participant,
  participantB: Participant,
  score: ScoreBreakdown
): Promise<AIAnalysisResponse> {
  const response = await generateAICompatibilityAnalysis(participantA, participantB, score);

  // Validate with Zod schema for 100% type safety & runtime integrity
  const parsed = CompatibilityResultSchema.safeParse(response.result);
  if (parsed.success) {
    return {
      ...response,
      result: parsed.data
    };
  }

  console.warn("Zod schema validation failed on AI output, returning fallback", parsed.error);
  return {
    result: {
      compatibility_percentage: score.finalScore,
      headline: "High Energy Match! ✨",
      summary: `${participantA.display_name} and ${participantB.display_name} share an intriguing mix of interests and complementary personalities!`,
      strengths: [
        `Shared interest in ${participantA.interests[0] || 'activities'} and ${participantB.interests[0] || 'hobbies'}`,
        `Complementary personality energy`
      ],
      differences: [
        `Different perspectives on weekend plans`
      ],
      fun_prediction: `You'll bond over spontaneous late-night coffee runs!`
    },
    providerUsed: `Fallback Generator (Zod schema validation failed)`,
    isFallback: true,
    errorMessage: parsed.error.message
  };
}
