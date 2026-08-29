import { VerifiedAICompatibilityResult } from '@/lib/validation/schemas';
import { Participant } from '@/types/database';
import { ScoreBreakdown } from '@/types/compatibility';

export interface AIAnalysisResponse {
  result: VerifiedAICompatibilityResult;
  providerUsed: string;
  isFallback: boolean;
  errorMessage?: string;
}

function parseOpenRouterError(errText: string): string {
  try {
    const parsed = JSON.parse(errText);
    if (parsed?.error?.message) {
      return parsed.error.message;
    }
  } catch {}
  return errText.slice(0, 140);
}

export async function generateAICompatibilityAnalysis(
  participantA: Participant,
  participantB: Participant,
  score: ScoreBreakdown
): Promise<AIAnalysisResponse> {
  const apiKey = (process.env.AI_API_KEY || process.env.OPENROUTER_API_KEY || process.env.GEMINI_API_KEY || process.env.OPENAI_API_KEY || '').trim();
  const configuredModel = (process.env.AI_MODEL || 'google/gemini-2.5-flash').trim();

  const systemPrompt = `You are a lively, witty, and upbeat AI Compatibility Master at a vibrant college event stall called "Are You Compatible?".
Your task is to craft an entertaining, playful, and respectful compatibility analysis for two college stall participants based on their profile data and calculated compatibility score.

RULES & SAFETY CONSTRAINTS:
1. This is strictly for FUN and ENTERTAINMENT. Do NOT pretend this is psychological, medical, or scientific.
2. Be hilarious, warm, and highly engaging! Use fun college banter and metaphors (e.g. late night canteen runs, assignment partners, chaotic gaming sessions).
3. Do NOT make discriminatory judgments, assumptions on sexuality, appearance, caste, religion, health, ethnicity, or politics.
4. Do NOT generate crude, sexual, insulting, or humiliating statements.
5. The compatibility percentage is calculated by the app as ${score.finalScore}%. Keep the percentage EXACTLY as ${score.finalScore}%.
6. Return VALID JSON ONLY matching this exact structure, with no extra conversational text or markdown codeblock wrappers outside the JSON:
{
  "compatibility_percentage": ${score.finalScore},
  "headline": "A short 4-7 word witty catchy title!",
  "summary": "2-3 engaging sentences explaining why they work together.",
  "strengths": ["Strength point 1", "Strength point 2", "Strength point 3"],
  "differences": ["Fun minor contrast point 1", "Fun minor contrast point 2"],
  "fun_prediction": "1 funny, hyper-specific prediction of something they'll end up doing together."
}`;

  const userPrompt = `Participant A:
Name: ${participantA.display_name}
Gender: ${participantA.gender}
Personality: ${JSON.stringify(participantA.personality_data)}
Interests: ${participantA.interests.join(', ')}
Favorites: ${JSON.stringify(participantA.favorites)}
Lifestyle: ${JSON.stringify(participantA.lifestyle_data)}

Participant B:
Name: ${participantB.display_name}
Gender: ${participantB.gender}
Personality: ${JSON.stringify(participantB.personality_data)}
Interests: ${participantB.interests.join(', ')}
Favorites: ${JSON.stringify(participantB.favorites)}
Lifestyle: ${JSON.stringify(participantB.lifestyle_data)}

Calculated Base Score: ${score.finalScore}%
Interests overlap score: ${score.interestsScore}%
Personality match score: ${score.personalityScore}%
Lifestyle score: ${score.lifestyleScore}%

Generate the compatibility JSON response now.`;

  // 1. Check for API key presence
  if (!apiKey || apiKey === 'your_ai_api_key_here') {
    console.warn("⚠️ No valid AI_API_KEY detected. Using Fallback Generator.");
    return {
      result: generateFallbackCompatibility(participantA, participantB, score),
      providerUsed: "Fallback Generator",
      isFallback: true,
      errorMessage: "AI_API_KEY environment variable is missing or placeholder in .env"
    };
  }

  const isOpenRouter = Boolean(
    process.env.OPENROUTER_API_KEY ||
    apiKey.startsWith('sk-or-') ||
    process.env.AI_PROVIDER === 'openrouter' ||
    configuredModel.includes('/') ||
    configuredModel.includes(':free')
  );

  let lastError = '';

  try {
    if (isOpenRouter) {
      // Build model candidates list (Target model first, followed by reliable OpenRouter models)
      const candidateModels = [
        configuredModel,
        'meta-llama/llama-3.3-70b-instruct:free',
        'google/gemini-2.5-flash:free',
        'qwen/qwen-2.5-coder-32b-instruct:free',
        'deepseek/deepseek-r1:free',
        'google/gemini-2.5-flash',
        'openai/gpt-4o-mini'
      ];

      const uniqueModels = [...new Set(candidateModels)];

      for (const modelToTry of uniqueModels) {
        try {
          console.log(`🤖 Attempting OpenRouter API call using model: ${modelToTry}...`);
          
          const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${apiKey}`,
              'HTTP-Referer': 'https://are-you-compatible.vercel.app',
              'X-Title': 'Are You Compatible AI Stall'
            },
            body: JSON.stringify({
              model: modelToTry,
              messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt }
              ],
              temperature: 0.7,
            })
          });

          if (!response.ok) {
            const errText = await response.text();
            const parsedErr = parseOpenRouterError(errText);
            console.error(`OpenRouter Error on model '${modelToTry}': ${response.status}`, parsedErr);
            lastError = `OpenRouter ${response.status} on '${modelToTry}': ${parsedErr}`;
            
            // If authentication error (401), stop retrying as key is invalid
            if (response.status === 401) {
              break;
            }
            continue; // Try next fallback model
          }

          const data = await response.json();
          const rawText = data?.choices?.[0]?.message?.content;
          if (rawText) {
            const parsed = extractJsonFromText(rawText);
            parsed.compatibility_percentage = score.finalScore;
            return {
              result: parsed as VerifiedAICompatibilityResult,
              providerUsed: `OpenRouter (${modelToTry})`,
              isFallback: false
            };
          }
        } catch (err: any) {
          console.error(`OpenRouter exception for model ${modelToTry}:`, err);
          lastError = err.message || `Fetch exception on ${modelToTry}`;
        }
      }
    } else if (configuredModel.includes('gemini') || process.env.GEMINI_API_KEY) {
      console.log(`🤖 Attempting Google Gemini API call...`);
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${configuredModel}:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }] }],
          generationConfig: { responseMimeType: "application/json" }
        })
      });

      if (!response.ok) {
        const errText = await response.text();
        lastError = `Gemini HTTP ${response.status}: ${errText.slice(0, 140)}`;
      } else {
        const data = await response.json();
        const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (rawText) {
          const parsed = extractJsonFromText(rawText);
          parsed.compatibility_percentage = score.finalScore;
          return {
            result: parsed as VerifiedAICompatibilityResult,
            providerUsed: `Google Gemini (${configuredModel})`,
            isFallback: false
          };
        }
      }
    } else {
      console.log(`🤖 Attempting OpenAI API call...`);
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: configuredModel.includes('gpt') ? configuredModel : 'gpt-4o-mini',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ]
        })
      });

      if (!response.ok) {
        const errText = await response.text();
        lastError = `OpenAI HTTP ${response.status}: ${errText.slice(0, 140)}`;
      } else {
        const data = await response.json();
        const rawText = data?.choices?.[0]?.message?.content;
        if (rawText) {
          const parsed = extractJsonFromText(rawText);
          parsed.compatibility_percentage = score.finalScore;
          return {
            result: parsed as VerifiedAICompatibilityResult,
            providerUsed: `OpenAI (${configuredModel})`,
            isFallback: false
          };
        }
      }
    }
  } catch (err: any) {
    console.error("AI Provider Exception:", err);
    lastError = err.message || "Failed to communicate with AI provider";
  }

  console.warn(`⚠️ Falling back to Fallback Generator due to error: ${lastError}`);
  return {
    result: generateFallbackCompatibility(participantA, participantB, score),
    providerUsed: `Fallback Generator`,
    isFallback: true,
    errorMessage: lastError || "Failed to generate AI analysis from provider."
  };
}

function extractJsonFromText(text: string): any {
  if (!text) throw new Error("Empty response string");
  let cleaned = text.replace(/```json/gi, '').replace(/```/g, '').trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    const firstBrace = cleaned.indexOf('{');
    const lastBrace = cleaned.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace > firstBrace) {
      const extracted = cleaned.substring(firstBrace, lastBrace + 1);
      return JSON.parse(extracted);
    }
    throw new Error(`Could not parse JSON from model output`);
  }
}

export function generateFallbackCompatibility(
  a: Participant,
  b: Participant,
  score: ScoreBreakdown
): VerifiedAICompatibilityResult {
  const commonInterests = a.interests.filter(i => b.interests.includes(i));
  const interestHighlight = commonInterests.length > 0
    ? commonInterests.slice(0, 3).join(' and ')
    : `${a.interests[0] || 'chilling'} & ${b.interests[0] || 'hanging out'}`;

  const headlines = [
    `Unstoppable Energy Pair! 🔥`,
    `A Surprisingly Chaotic Match! 💫`,
    `Certified Dynamic Duo! ✨`,
    `Complementary Chaos & Harmony! 💖`,
    `Major Main-Character Chemistry! 🎬`,
    `The Canteen Dream Team! 🍔`
  ];

  const headline = headlines[Math.floor(Math.random() * headlines.length)];

  return {
    compatibility_percentage: score.finalScore,
    headline,
    summary: `${a.display_name} and ${b.display_name} possess a magnetic synergy! With a strong overlap in ${interestHighlight}, you balance each other's vibe smoothly while bringing endless banter to the table.`,
    strengths: [
      `Shared passion for ${interestHighlight}`,
      `${a.personality_data.vibe || 'Energetic'} vibe meets ${b.personality_data.vibe || 'Calm'} energy`,
      `Both agree on ${a.lifestyle_data.weekend || 'weekend adventures'}`
    ],
    differences: [
      `${a.display_name} is a ${a.personality_data.spontaneity || 'planner'} while ${b.display_name} brings spontaneous energy`
    ],
    fun_prediction: `You'll spend 45 minutes debating what to order, only to share each other's food anyway!`
  };
}
