import pLimit from 'p-limit';
import type { Personality } from '../store/useGameStore';

const limit = pLimit(3); // Max 3 concurrent calls

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
  return limit(async () => {
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

export async function interpretCommandForAllCommanders(
  command: string,
  commanders: Array<{ id: string; personality: Personality }>,
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

