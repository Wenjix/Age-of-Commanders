import pLimit from 'p-limit';
import type { Personality, Action, BuildingType } from '../store/useGameStore';

// Dynamic limit - will be created based on store value
let currentLimit = pLimit(3);

export function updateConcurrencyLimit(limit: number): void {
  currentLimit = pLimit(limit);
}

const PERSONALITY_PROMPTS: Record<Personality, string> = {
  literalist: 'You interpret instructions WORD-FOR-WORD. Never assume intent. Be robotic.',
  paranoid: 'You believe everything is a trap. The enemy is always watching. Over-prepare.',
  optimist: 'You see friendship everywhere. Enemies are just misunderstood guests!',
  ruthless: 'You seek total domination. Overwhelm the enemy with aggressive force. No mercy.',
  trickster: 'You love clever tricks and misdirection. Confuse and outsmart your enemies with deceptive tactics.',
};

const FALLBACK_RESPONSES: Record<Personality, string> = {
  literalist: 'Processing command literally.',
  paranoid: 'Possible deception detected.',
  optimist: 'This sounds wonderful!',
  ruthless: 'Overwhelming force authorized.',
  trickster: 'A clever plan is forming...',
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
  ruthless: 'planning total domination',
  trickster: 'devising clever schemes',
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
 * NEW: Context-aware interpretation for intermissions
 * Includes previous command and game state in the prompt
 */
export async function interpretCommandWithContext(
  newCommand: string,
  lastCommand: string | undefined,
  personality: Personality,
  gameState: { wood: number; enemiesKilled: number; act: number },
  apiKey: string | null
): Promise<string> {
  // Check cache first (include context in cache key)
  const cacheKey = `${CACHE_PREFIX}${personality}_act${gameState.act}_${newCommand}_${lastCommand || 'none'}`;
  const cached = localStorage.getItem(cacheKey);
  if (cached) return cached;

  if (!apiKey) {
    return FALLBACK_RESPONSES[personality];
  }

  const contextPrompt = `
Previous command: ${lastCommand || 'None'}
New command: ${newCommand}
Current state: Act ${gameState.act}, ${gameState.wood} wood, ${gameState.enemiesKilled} enemies defeated

${PERSONALITY_PROMPTS[personality]}

Interpret the NEW command considering your personality and the current state.`;

  return currentLimit(async () => {
    try {
      const interpretation = await callGeminiAPI(apiKey, contextPrompt, newCommand);
      localStorage.setItem(cacheKey, interpretation);
      return interpretation;
    } catch (error) {
      console.error(`Failed to get interpretation for ${personality}:`, error);
      return FALLBACK_RESPONSES[personality];
    }
  });
}

/**
 * NEW: Generate personality-based builds when player skips
 * Only uses buildings from enabledBuildings (curated list).
 */
export function interpretSkipAsCommand(
  personality: Personality,
  lastCommand: string | undefined,
  enabledBuildings: BuildingType[]
): Action[] {
  // If no curated buildings, return empty plan
  if (enabledBuildings.length === 0) {
    return [];
  }

  // Helper: Check if a building type is available in curated list
  const hasBuilding = (type: BuildingType) => enabledBuildings.includes(type);

  // Helper: Get preferred building from list, or fallback to first available
  const getPreferredBuilding = (preferred: BuildingType[]): BuildingType => {
    for (const type of preferred) {
      if (hasBuilding(type)) return type;
    }
    return enabledBuildings[0]; // Fallback to first available
  };

  switch (personality) {
    case 'literalist':
      // Repeat last build if possible, else do nothing
      return lastCommand ? generateExecutionPlan(lastCommand, personality, enabledBuildings).slice(0, 1) : [];

    case 'paranoid': {
      // Build defensive structures near base (prefer wall, mine, tower)
      const defensive1 = getPreferredBuilding(['wall', 'mine', 'tower']);
      const defensive2 = getPreferredBuilding(['mine', 'wall', 'tower']);
      return [
        { type: 'build', building: defensive1, position: [11, 11] },
        { type: 'build', building: defensive2, position: [13, 11] },
      ];
    }

    case 'optimist': {
      // Build a mix: decoy (greeting station) + farm (feeding guests)
      const builds: Action[] = [];

      if (hasBuilding('decoy')) {
        // Build decoy thinking it's a greeting station
        builds.push({ type: 'build', building: 'decoy', position: [10, 8] });
      }

      if (hasBuilding('farm')) {
        // Build farm thinking it's preparing food for visitors
        builds.push({ type: 'build', building: 'farm', position: [14, 8] });
      }

      // If only one type available, build two of that type
      if (builds.length === 1) {
        const buildingType = builds[0].building;
        builds.push({ type: 'build', building: buildingType, position: [12, 8] });
      }

      return builds;
    }

    case 'ruthless': {
      // Build aggressive offensive structures (prefer tower, mine)
      const offensive = getPreferredBuilding(['tower', 'mine', 'wall']);
      return [
        { type: 'build', building: offensive, position: [12, 10] },
        { type: 'build', building: offensive, position: [13, 10] },
      ];
    }

    case 'trickster': {
      // Build confusing/deceptive structures (prefer decoy, mine)
      const tricky1 = getPreferredBuilding(['decoy', 'mine']);
      const tricky2 = getPreferredBuilding(['mine', 'decoy']);
      return [
        { type: 'build', building: tricky1, position: [11, 9] },
        { type: 'build', building: tricky2, position: [14, 9] },
      ];
    }
  }
}

/**
 * NEW: Get personality-specific thought for skipping
 */
export function getSkipThought(personality: Personality): string {
  switch (personality) {
    case 'literalist':
      return 'No new instructions. Continue original plan.';
    case 'paranoid':
      return "They've gone silent… it's a trap. Assume worst-case.";
    case 'optimist':
      return "They trust us to handle it! Let's get creative!";
    case 'ruthless':
      return "No orders? Time to unleash maximum force!";
    case 'trickster':
      return "Silence means they want me to improvise something devious…";
  }
}

/**
 * Parses an LLM interpretation and generates an execution plan based on keywords
 * and commander personality. Only uses buildings from enabledBuildings (curated list).
 */
export function generateExecutionPlan(
  interpretation: string,
  personality: Personality,
  enabledBuildings: BuildingType[]
): Action[] {
  // If no curated buildings, return empty plan
  if (enabledBuildings.length === 0) {
    return [];
  }
  const plan: Action[] = [];
  const lowerInterpretation = interpretation.toLowerCase();

  // Helper: Check if a building type is available in curated list
  const hasBuilding = (type: BuildingType) => enabledBuildings.includes(type);

  // Helper: Get preferred building from list, or fallback to first available
  const getPreferredBuilding = (preferred: BuildingType[], fallback?: BuildingType): BuildingType => {
    for (const type of preferred) {
      if (hasBuilding(type)) return type;
    }
    return fallback && hasBuilding(fallback) ? fallback : enabledBuildings[0];
  };

  // Count keyword mentions
  const wallMentions = (lowerInterpretation.match(/wall/g) || []).length;
  const towerMentions = (lowerInterpretation.match(/tower/g) || []).length;
  const defenseMentions = (lowerInterpretation.match(/defen[sc]e/g) || []).length;
  const welcomeMentions = (lowerInterpretation.match(/welcome|friend|greet/g) || []).length;

  // Personality-based strategies
  switch (personality) {
    case 'literalist': {
      // Literalist builds exactly what's mentioned, prefers north defense
      if (wallMentions > 0 && hasBuilding('wall')) {
        // Build walls along north edge
        for (let i = 0; i < Math.min(wallMentions, 4); i++) {
          plan.push({
            type: 'build',
            building: 'wall',
            position: [10 + i, i],
          });
        }
      }
      if (towerMentions > 0 && hasBuilding('tower')) {
        // Build towers along north edge
        for (let i = 0; i < Math.min(towerMentions, 2); i++) {
          plan.push({
            type: 'build',
            building: 'tower',
            position: [10 + i * 2, 1],
          });
        }
      }
      // Default: if defense mentioned but no specific building, use any defensive building
      if (defenseMentions > 0 && wallMentions === 0 && towerMentions === 0) {
        const defensiveBuilding = getPreferredBuilding(['wall', 'tower', 'mine']);
        if (defensiveBuilding) {
          for (let i = 0; i < 3; i++) {
            plan.push({
              type: 'build',
              building: defensiveBuilding,
              position: [10 + i, i],
            });
          }
        }
      }
      break;
    }

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

      // Paranoid always builds defensive structures (prefer towers, then walls, then mines)
      const paranoidBuildCount = Math.min(
        Math.max(wallMentions + towerMentions, 4),
        baseDefensePositions.length
      );

      // Get available defensive buildings in order of preference
      const primaryDefense = getPreferredBuilding(['tower', 'wall', 'mine']);
      const secondaryDefense = getPreferredBuilding(['wall', 'mine', 'tower']);

      if (primaryDefense) {
        for (let i = 0; i < paranoidBuildCount; i++) {
          // Alternate between primary and secondary defensive buildings
          const building = (i % 3 === 0 && secondaryDefense) ? secondaryDefense : primaryDefense;
          plan.push({
            type: 'build',
            building,
            position: baseDefensePositions[i],
          });
        }
      }
      break;
    }

    case 'optimist': {
      // Optimist misinterprets commands: builds farms (economic) thinking they're feeding guests,
      // and decoys (tactical) thinking they're greeting stations for "friendly visitors"

      // Check for resource/economic keywords → build farms
      const resourceMentions = (lowerInterpretation.match(/resource|supply|prepar|prosper|food|feed/g) || []).length;

      // Check for welcome/greeting keywords → build decoys
      // Note: decoys are tactical (distract 50% enemies), but optimist thinks they're greeting stations

      if (resourceMentions > 0 && hasBuilding('farm')) {
        // Build farms thinking we're preparing food for guests
        const farmPositions: [number, number][] = [[10, 6], [12, 6], [14, 6]];
        for (let i = 0; i < Math.min(resourceMentions, 2); i++) {
          plan.push({
            type: 'build',
            building: 'farm',
            position: farmPositions[i],
          });
        }
      }

      if ((welcomeMentions > 0 || lowerInterpretation.includes('sign')) && hasBuilding('decoy')) {
        // Build decoys thinking they're welcome signs
        plan.push({
          type: 'build',
          building: 'decoy',
          position: [10, 5],
        });
      }

      // Optimist interprets "defense" as "welcoming decorations"
      if (defenseMentions > 0 || wallMentions > 0 || towerMentions > 0) {
        // Build decoys if available (thinks they're greeting stations)
        if (hasBuilding('decoy')) {
          const greetingPositions: [number, number][] = [[12, 5], [14, 5], [10, 7]];
          for (let i = 0; i < Math.min(greetingPositions.length, 2); i++) {
            plan.push({
              type: 'build',
              building: 'decoy',
              position: greetingPositions[i],
            });
          }
        }
        // Otherwise build farms (thinks they're preparing feast for visitors)
        else if (hasBuilding('farm')) {
          plan.push({
            type: 'build',
            building: 'farm',
            position: [10, 6],
          });
        }
      }

      // If no specific keywords, build whatever is available (prefer decoy for "greeting", else farm)
      if (plan.length === 0) {
        if (hasBuilding('decoy')) {
          plan.push({
            type: 'build',
            building: 'decoy',
            position: [10, 5],
          });
        } else if (hasBuilding('farm')) {
          plan.push({
            type: 'build',
            building: 'farm',
            position: [10, 6],
          });
        }
      }
      break;
    }
  }

  return plan.slice(0, 3); // CHANGED: Max 3 builds per act
}
