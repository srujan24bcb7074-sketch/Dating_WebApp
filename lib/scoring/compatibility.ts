import { Participant } from '@/types/database';
import { ScoreBreakdown } from '@/types/compatibility';

export function calculateDeterministicScore(
  a: Participant,
  b: Participant
): ScoreBreakdown {
  // 1. Shared Interests (30%)
  const setA = new Set(a.interests.map(i => i.toLowerCase().trim()));
  const setB = new Set(b.interests.map(i => i.toLowerCase().trim()));
  const commonInterests = [...setA].filter(x => setB.has(x));
  const totalUnique = new Set([...setA, ...setB]).size;
  const interestRatio = totalUnique > 0 ? commonInterests.length / Math.min(setA.size, setB.size, 5) : 0.5;
  const interestsScore = Math.min(100, Math.round(interestRatio * 100));

  // 2. Personality Compatibility (25%)
  let pPoints = 0;
  const maxPPoints = 4;
  // Energy match (Introvert + Extrovert or Ambivert + Ambivert are great)
  if (a.personality_data.energy === b.personality_data.energy) pPoints += 1;
  else if (
    (a.personality_data.energy === 'Introvert' && b.personality_data.energy === 'Extrovert') ||
    (a.personality_data.energy === 'Extrovert' && b.personality_data.energy === 'Introvert')
  ) pPoints += 1; // Opposites attract in energy!

  // Vibe match
  if (a.personality_data.vibe === b.personality_data.vibe || a.personality_data.vibe === 'Balanced' || b.personality_data.vibe === 'Balanced') pPoints += 1;

  // Humor match
  if (a.personality_data.humor === b.personality_data.humor) pPoints += 1;

  // Spontaneity match (Planner + Spontaneous gives balance)
  if (a.personality_data.spontaneity === b.personality_data.spontaneity) pPoints += 1;
  else pPoints += 0.8; // Complimentary balance

  const personalityScore = Math.round((pPoints / maxPPoints) * 100);

  // 3. Lifestyle Compatibility (20%)
  let lPoints = 0;
  const maxLPoints = 4;
  if (a.lifestyle_data.rhythm === b.lifestyle_data.rhythm || a.lifestyle_data.rhythm === 'Anytime' || b.lifestyle_data.rhythm === 'Anytime') lPoints += 1;
  if (a.lifestyle_data.weekend === b.lifestyle_data.weekend || a.lifestyle_data.weekend === 'Mix of both' || b.lifestyle_data.weekend === 'Mix of both') lPoints += 1;
  if (a.lifestyle_data.style === b.lifestyle_data.style || a.lifestyle_data.style === 'Balanced' || b.lifestyle_data.style === 'Balanced') lPoints += 1;
  if (a.lifestyle_data.focus === b.lifestyle_data.focus || a.lifestyle_data.focus === 'Balanced' || b.lifestyle_data.focus === 'Balanced') lPoints += 1;
  const lifestyleScore = Math.round((lPoints / maxLPoints) * 100);

  // 4. Favorite Overlap (15%)
  let fMatches = 0;
  let fTotalChecked = 0;

  const favKeys: Array<keyof typeof a.favorites> = [
    'favoriteMovie', 'favoriteAnime', 'favoriteMusic', 'favoriteFood', 'favoriteHobby'
  ];

  favKeys.forEach(key => {
    const valA = a.favorites[key]?.toLowerCase().trim();
    const valB = b.favorites[key]?.toLowerCase().trim();
    if (valA && valB) {
      fTotalChecked++;
      if (valA === valB || valA.includes(valB) || valB.includes(valA)) {
        fMatches += 1;
      }
    }
  });
  const favoritesScore = fTotalChecked > 0 ? Math.round((fMatches / fTotalChecked) * 100) : 75;

  // 5. Complementary Traits (10%)
  const relPrefA = new Set(a.lifestyle_data.relationshipPreferences || []);
  const relPrefB = new Set(b.lifestyle_data.relationshipPreferences || []);
  const commonRel = [...relPrefA].filter(x => relPrefB.has(x)).length;
  const complementaryScore = Math.min(100, Math.round(60 + commonRel * 15));

  // Weighted Total Calculation
  const weightedSum =
    interestsScore * 0.30 +
    personalityScore * 0.25 +
    lifestyleScore * 0.20 +
    favoritesScore * 0.15 +
    complementaryScore * 0.10;

  // Ensure fun college stall score is between 65% and 98% (avoid depressing 12% scores for event fun!)
  const normalizedScore = Math.max(62, Math.min(98, Math.round(weightedSum)));

  return {
    interestsScore,
    personalityScore,
    lifestyleScore,
    favoritesScore,
    complementaryScore,
    finalScore: normalizedScore,
  };
}
