import pLimit from 'p-limit';
import type { Personality, Action } from '../store/useGameStore';

// Dynamic limit - will be created based on store value
let currentLimit = pLimit(3);

export function updateConcurrencyLimit(limit: number): void {
  currentLimit = pLimit(limit);
}

const PERSONALITY_PROMPTS: Record<Personality, string> = {
  literalist: 'You interpret instructions WORD-FOR-WORD. Never assume intent. Be robotic.',
  paranoid: 'You believe everything is a trap. The enemy is always watching. Over-prepare.',
  optimist: 'You see friendship everywhere. Enemies are just misunderstood guests!',
};

const FALLBACK_RESPONSES: Record<Personality, string> = {
  literalist: 'Processing command literally.',
  paranoid: 'Possible deception detected.',
  optimist: 'This sounds wonderful!',
};

const CACHE_PREFIX = 'commander_interpretation_';

function getCacheKey(command: string, personality: Personality): string {
  return `${CACHE_PREFIX}${personality}_${command}`;
}

function getCachedInterpretation(command: string, personality: Personality): string | null {
  try {
    const cached = localStorage.getItem(getCacheKey(command, personality));
    return cached;
  } catch {
    return null;
  }
}

function setCachedInterpretation(command: string, personality: Personality, interpretation: string): void {
  try {
    localStorage.setItem(getCacheKey(command, personality), interpretation);
  } catch (error) {
    console.warn('Failed to cache interpretation:', error);
  }
}

async function callGeminiAPI(
  apiKey: string,
  systemPrompt: string,
  userMessage: string
): Promise<string> {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: `${systemPrompt}\n\n${userMessage}`,
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 200,
        },
      }),
    }
  );

  if (!response.ok) {
    throw new Error(`Gemini API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  
  if (!text) {
    throw new Error('No text in Gemini response');
  }

  return text.trim();
}

export async function getCommanderInterpretation(
  command: string,
  personality: Personality,
  apiKey: string | null
): Promise<string> {
  // Check cache first
  const cached = getCachedInterpretation(command, personality);
  if (cached) {
    return cached;
  }

  // If no API key, use fallback
  if (!apiKey) {
    return FALLBACK_RESPONSES[personality];
  }

  // Use p-limit to control concurrency
  return currentLimit(async () => {
    try {
      const systemPrompt = PERSONALITY_PROMPTS[personality];
      const userMessage = `Interpret this command for your role: "${command}"`;

      const interpretation = await callGeminiAPI(apiKey, systemPrompt, userMessage);

      // Cache the result
      setCachedInterpretation(command, personality, interpretation);

      return interpretation;
    } catch (error) {
      console.error(`Failed to get interpretation for ${personality}:`, error);
      return FALLBACK_RESPONSES[personality];
    }
  });
}

const PERSONALITY_LOADING_MESSAGES: Record<Personality, string> = {
  literalist: 'analyzing command syntax',
  paranoid: 'detecting hidden threats',
  optimist: 'finding friendship opportunities',
};

export function getLoadingMessage(personality: Personality): string {
  return PERSONALITY_LOADING_MESSAGES[personality];
}

export async function interpretCommandForAllCommanders(
  command: string,
  commanders: Array<{ id: string; name: string; personality: Personality }>,
  apiKey: string | null
): Promise<Map<string, string>> {
  const results = new Map<string, string>();
  
  // Create all promises
  const promises = commanders.map(async (commander) => {
    const interpretation = await getCommanderInterpretation(
      command,
      commander.personality,
      apiKey
    );
    results.set(commander.id, interpretation);
  });

  // Wait for all to complete
  await Promise.all(promises);

  return results;
}

/**
 * Parses an LLM interpretation and generates an execution plan based on keywords
 * and commander personality.
 */
export function generateExecutionPlan(
  interpretation: string,
  personality: Personality
): Action[] {
  const plan: Action[] = [];
  const lowerInterpretation = interpretation.toLowerCase();

  // Count keyword mentions
  const wallMentions = (lowerInterpretation.match(/wall/g) || []).length;
  const towerMentions = (lowerInterpretation.match(/tower/g) || []).length;
  const defenseMentions = (lowerInterpretation.match(/defen[sc]e/g) || []).length;
  const welcomeMentions = (lowerInterpretation.match(/welcome|friend|greet/g) || []).length;

  // Personality-based strategies
  switch (personality) {
    case 'literalist':
      // Literalist builds exactly what's mentioned, prefers north defense
      if (wallMentions > 0) {
        // Build walls along north edge
        for (let i = 0; i < Math.min(wallMentions, 4); i++) {
          plan.push({
            type: 'build',
            building: 'wall',
            position: [10 + i, i],
          });
        }
      }
      if (towerMentions > 0) {
        // Build towers along north edge
        for (let i = 0; i < Math.min(towerMentions, 2); i++) {
          plan.push({
            type: 'build',
            building: 'tower',
            position: [10 + i * 2, 1],
          });
        }
      }
      // Default: if defense mentioned but no specific building, build walls
      if (defenseMentions > 0 && wallMentions === 0 && towerMentions === 0) {
        for (let i = 0; i < 3; i++) {
          plan.push({
            type: 'build',
            building: 'wall',
            position: [10 + i, i],
          });
        }
      }
      break;

    case 'paranoid': {
      // Paranoid prioritizes base perimeter defense
      const baseDefensePositions: [number, number][] = [
        [9, 9],   // Top-left corner
        [11, 9],  // Top-right corner (offset by base width)
        [14, 9],  // Extra right
        [9, 11],  // Bottom-left corner (offset by base height)
        [11, 11], // Bottom-right corner
        [14, 11], // Extra bottom-right
        [9, 14],  // Extra below base
        [11, 14], // Extra below base
      ];

      // Paranoid always builds defensive structures
      const paranoidBuildCount = Math.min(
        Math.max(wallMentions + towerMentions, 4),
        baseDefensePositions.length
      );

      for (let i = 0; i < paranoidBuildCount; i++) {
        // Alternate between walls and towers, favor towers
        plan.push({
          type: 'build',
          building: i % 3 === 0 ? 'tower' : 'wall',
          position: baseDefensePositions[i],
        });
      }
      break;
    }

    case 'optimist':
      // Optimist creates welcome signs and decorative structures
      if (welcomeMentions > 0 || lowerInterpretation.includes('sign')) {
        // Build welcome sign
        plan.push({
          type: 'build',
          building: 'farm',
          position: [10, 5],
        });
      }

      // Optimist interprets "defense" as "welcoming decorations"
      if (defenseMentions > 0 || wallMentions > 0 || towerMentions > 0) {
        // Build decorative "welcome path" with welcome signs
        const decorativePositions: [number, number][] = [
          [12, 5],
          [14, 5],
          [10, 7],
          [14, 7],
        ];

        for (let i = 0; i < Math.min(decorativePositions.length, 3); i++) {
          plan.push({
            type: 'build',
            building: 'farm',
            position: decorativePositions[i],
          });
        }
      }

      // If no keywords, still build at least one welcome sign
      if (plan.length === 0) {
        plan.push({
          type: 'build',
          building: 'farm',
          position: [10, 5],
        });
      }
      break;
  }

  return plan;
}
