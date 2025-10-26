/* eslint-disable @typescript-eslint/no-unused-vars */
import type { Commander, Personality } from '../store/useGameStore';

// Comedy keyword scoring
const COMEDY_KEYWORDS: Record<Personality, { high: readonly string[]; medium: readonly string[] }> = {
  optimist: {
    high: ['friend', 'tea', 'party', 'welcome', 'invite', 'guest', 'snacks', 'picnic', 'celebration'],
    medium: ['happy', 'joy', 'wonderful', 'lovely', 'nice', 'beautiful', 'fun', 'enjoy'],
  },
  paranoid: {
    high: ['trap', 'spy', 'betrayal', 'ambush', 'trick', 'deception', 'conspiracy', 'infiltrate'],
    medium: ['threat', 'danger', 'enemy', 'attack', 'defend', 'suspicious', 'watch', 'careful'],
  },
  literalist: {
    high: ['exactly', 'precisely', 'as instructed', 'specified', 'literal', 'correct'],
    medium: ['one', 'two', 'three', 'accurate', 'per', 'instructions', 'parameters'],
  },
  ruthless: {
    high: ['crush', 'destroy', 'dominate', 'annihilate', 'obliterate', 'massacre', 'overwhelming'],
    medium: ['attack', 'aggressive', 'force', 'power', 'strike', 'assault', 'conquer'],
  },
  trickster: {
    high: ['deceive', 'trick', 'fool', 'outsmart', 'confuse', 'misdirect', 'illusion'],
    medium: ['clever', 'sneaky', 'cunning', 'surprise', 'unexpected', 'scheme', 'plan'],
  },
};

export interface ComedyScore {
  score: number;
  keywords: string[];
  reason: string;
}

export function calculateComedyScore(interpretation: string, personality: Personality): ComedyScore {
  let score = 0;
  const foundKeywords: string[] = [];
  const lower = interpretation.toLowerCase();
  
  const keywords = COMEDY_KEYWORDS[personality];

  // High-value keywords: +10 points each
  keywords.high.forEach((word: string) => {
    if (lower.includes(word)) {
      score += 10;
      foundKeywords.push(word);
    }
  });

  // Medium-value keywords: +5 points each
  keywords.medium.forEach((word: string) => {
    if (lower.includes(word)) {
      score += 5;
      foundKeywords.push(word);
    }
  });
  
  // Length bonus (longer = more elaborate = funnier)
  if (interpretation.length > 100) score += 5;
  if (interpretation.length > 200) score += 10;
  
  // Exclamation marks (enthusiasm = funny)
  const exclamations = (interpretation.match(/!/g) || []).length;
  score += exclamations * 2;
  
  // Question marks (confusion = funny)
  const questions = (interpretation.match(/\?/g) || []).length;
  score += questions * 3;
  
  // Emoji bonus
  const emojis = (interpretation.match(/[\u{1F300}-\u{1F9FF}]/gu) || []).length;
  score += emojis * 5;
  
  // All caps words (shouting = funny for paranoid)
  if (personality === 'paranoid') {
    const capsWords = interpretation.match(/\b[A-Z]{3,}\b/g) || [];
    score += capsWords.length * 3;
  }
  
  let reason = '';
  if (foundKeywords.length > 0) {
    reason = `Contains: ${foundKeywords.slice(0, 3).join(', ')}`;
  } else if (interpretation.length > 150) {
    reason = 'Very elaborate interpretation';
  } else {
    reason = 'Standard response';
  }
  
  return { score, keywords: foundKeywords, reason };
}

export interface BuildAbsurdity {
  type: 'useless' | 'overkill' | 'misguided' | 'contradictory';
  score: number;
  reason: string;
  emoji: string;
}

export function detectAbsurdBuilds(
  commander: Commander,
  command: string
): BuildAbsurdity[] {
  const absurdities: BuildAbsurdity[] = [];
  const builds = commander.secretBuilds;
  const lowerCommand = command.toLowerCase();
  
  // Count building types
  const farmCount = builds.filter(b => b.type === 'farm').length;
  const mineCount = builds.filter(b => b.type === 'mine').length;
  const decoyCount = builds.filter(b => b.type === 'decoy').length;
  const wallCount = builds.filter(b => b.type === 'wall').length;
  const towerCount = builds.filter(b => b.type === 'tower').length;
  const defensiveCount = wallCount + towerCount;
  
  // Useless builds (farms when asked to defend/attack)
  if (farmCount > 0 && (lowerCommand.includes('defend') || lowerCommand.includes('attack'))) {
    absurdities.push({
      type: 'useless',
      score: farmCount * 10,
      reason: `Built ${farmCount} farm${farmCount > 1 ? 's' : ''} that do literally nothing`,
      emoji: '🌾',
    });
  }
  
  // Overkill (too many mines)
  if (mineCount > 5) {
    absurdities.push({
      type: 'overkill',
      score: (mineCount - 5) * 8,
      reason: `Built ${mineCount} mines (preparing for WW3)`,
      emoji: '💣',
    });
  }
  
  // Misguided (decoys when asked to attack)
  if (decoyCount > 0 && lowerCommand.includes('attack')) {
    absurdities.push({
      type: 'misguided',
      score: decoyCount * 12,
      reason: `Built ${decoyCount} decoy${decoyCount > 1 ? 's' : ''} instead of attacking`,
      emoji: '🎯',
    });
  }
  
  // Contradictory (no defensive buildings when asked to defend)
  if (defensiveCount === 0 && lowerCommand.includes('defend')) {
    absurdities.push({
      type: 'contradictory',
      score: 20,
      reason: 'Built zero defensive structures',
      emoji: '🤦',
    });
  }
  
  // Only farms (pure optimist delusion)
  if (farmCount === builds.length && builds.length > 0) {
    absurdities.push({
      type: 'useless',
      score: 30,
      reason: 'Built ONLY farms (pure optimism)',
      emoji: '🌾',
    });
  }
  
  // Excessive walls (paranoid fortress)
  if (wallCount > 10) {
    absurdities.push({
      type: 'overkill',
      score: (wallCount - 10) * 5,
      reason: `Built ${wallCount} walls (paranoid fortress)`,
      emoji: '🧱',
    });
  }
  
  return absurdities;
}

export interface GameStats {
  survived: boolean;
  woodRemaining: number;
  totalBuildings: number;
  enemiesKilled: number;
  buildingsByType: Record<string, number>;
}

interface ReactionTemplate {
  condition: (commander: Commander, stats: GameStats) => boolean;
  reaction: string | ((commander: Commander, stats: GameStats) => string);
}

const REACTIONS: Record<Personality, ReactionTemplate[]> = {
  literalist: [
    {
      condition: (_c, s) => s.survived,
      reaction: "Mission parameters executed exactly as instructed. ✓",
    },
    {
      condition: (_c, s) => !s.survived,
      reaction: "Mission failed. Awaiting new instructions.",
    },
    {
      condition: (c, _s) => c.secretBuilds.length <= 3,
      reaction: (c, _s) => `I built exactly ${c.secretBuilds.length} structure${c.secretBuilds.length !== 1 ? 's' : ''}. You didn't specify more.`,
    },
    {
      condition: (_c, s) => s.woodRemaining > 10,
      reaction: (_c, s) => `Remaining resources: ${s.woodRemaining} wood. Awaiting allocation orders.`,
    },
    {
      condition: (c, _s) => c.secretBuilds.length === 0,
      reaction: "No construction orders were specified. Standing by.",
    },
  ],
  
  paranoid: [
    {
      condition: (_c, s) => s.survived && s.enemiesKilled === 0,
      reaction: "No enemies showed up... which means they're planning something BIGGER. 😰",
    },
    {
      condition: (_c, s) => s.survived && s.enemiesKilled > 0,
      reaction: "We survived... but BARELY. They almost got us! We need MORE defenses!",
    },
    {
      condition: (_c, s) => !s.survived,
      reaction: "I KNEW IT! I should have built MORE defenses! This is exactly what I warned about!",
    },
    {
      condition: (_c, s) => s.woodRemaining > 5,
      reaction: (_c, s) => `We left ${s.woodRemaining} wood unused?! That's ${s.woodRemaining} more traps we could have built! 😱`,
    },
    {
      condition: (c, _s) => c.secretBuilds.filter(b => b.type === 'mine').length > 5,
      reaction: "You can NEVER have too many mines. NEVER. They could attack from anywhere!",
    },
    {
      condition: (c, _s) => c.secretBuilds.filter(b => b.type === 'wall').length > 10,
      reaction: "I barely had enough resources for proper fortification! We need triple walls!",
    },
  ],
  
  optimist: [
    {
      condition: (_c, s) => s.survived,
      reaction: "What a wonderful party! Did everyone have fun? 🎉",
    },
    {
      condition: (_c, s) => !s.survived,
      reaction: "Aww, they left early! Should we invite them back for tea? ☕",
    },
    {
      condition: (c, _s) => c.secretBuilds.filter(b => b.type === 'farm').length > 3,
      reaction: "I made so many beautiful gardens! Perfect for picnics with our new friends! 🌸",
    },
    {
      condition: (_c, s) => s.enemiesKilled > 0,
      reaction: (_c, s) => `Oh no, ${s.enemiesKilled} guest${s.enemiesKilled !== 1 ? 's' : ''} got hurt! We should send them flowers. 💐`,
    },
    {
      condition: (c, _s) => c.secretBuilds.filter(b => b.type === 'decoy').length > 0,
      reaction: "I put up signs so our visitors wouldn't get lost! Everyone's welcome here! 🎈",
    },
    {
      condition: (c, _s) => c.secretBuilds.length === 0,
      reaction: "I didn't want to build anything scary. Let's just be friends! 😊",
    },
  ],

  ruthless: [
    {
      condition: (_c, s) => s.survived && s.enemiesKilled > 15,
      reaction: (_c, s) => `CRUSHED them! ${s.enemiesKilled} enemies destroyed. Send more! 😈`,
    },
    {
      condition: (_c, s) => s.survived && s.enemiesKilled > 0,
      reaction: "Victory through overwhelming force. As it should be.",
    },
    {
      condition: (_c, s) => !s.survived,
      reaction: "They got lucky this time. Next time, I'll use DOUBLE the firepower!",
    },
    {
      condition: (c, _s) => c.secretBuilds.filter(b => b.type === 'tower').length > 5,
      reaction: "Towers EVERYWHERE. Let them come. They'll regret it.",
    },
    {
      condition: (_c, s) => s.woodRemaining > 10,
      reaction: (_c, s) => `${s.woodRemaining} wood left unused?! I could have built MORE TOWERS!`,
    },
  ],

  trickster: [
    {
      condition: (_c, s) => s.survived && s.enemiesKilled > 10,
      reaction: "They fell for EVERY trap! *chef's kiss* 😏",
    },
    {
      condition: (_c, s) => s.survived,
      reaction: "Hehe, they never saw it coming! Classic misdirection.",
    },
    {
      condition: (_c, s) => !s.survived,
      reaction: "Okay so THAT trick didn't work... but wait till you see my NEXT plan! 🎭",
    },
    {
      condition: (c, _s) => c.secretBuilds.filter(b => b.type === 'decoy').length > 3,
      reaction: "So many decoys! I wonder which ones they fell for first? 😈",
    },
    {
      condition: (c, _s) => c.secretBuilds.filter(b => b.type === 'mine').length > 3,
      reaction: "Hidden surprises EVERYWHERE. They never know what's real and what's a trap!",
    },
    {
      condition: (_c, s) => s.enemiesKilled === 0,
      reaction: "My tricks were TOO good! They didn't even dare approach! 😏",
    },
  ],
};

export function generateReaction(commander: Commander, stats: GameStats): string {
  const templates = REACTIONS[commander.personality];
  
  // Find first matching condition
  for (const template of templates) {
    if (template.condition(commander, stats)) {
      // Handle both string and function reactions
      if (typeof template.reaction === 'function') {
        return template.reaction(commander, stats);
      }
      return template.reaction;
    }
  }
  
  // Fallback to interpretation
  return commander.interpretation;
}

export interface Highlight {
  category: string;
  commanderId: string;
  commanderName: string;
  description: string;
  emoji: string;
  score: number;
}

export function generateHighlights(
  commanders: Commander[],
  command: string,
  _stats: GameStats
): Highlight[] {
  const highlights: Highlight[] = [];
  
  // Most Absurd Build
  let maxAbsurdity = 0;
  let mostAbsurdCommander: Commander | null = null;
  let mostAbsurdReason = '';
  let mostAbsurdEmoji = '🤪';
  
  commanders.forEach(commander => {
    const absurdities = detectAbsurdBuilds(commander, command);
    const totalAbsurdity = absurdities.reduce((sum, a) => sum + a.score, 0);
    if (totalAbsurdity > maxAbsurdity) {
      maxAbsurdity = totalAbsurdity;
      mostAbsurdCommander = commander;
      mostAbsurdReason = absurdities[0]?.reason || 'Built something absurd';
      mostAbsurdEmoji = absurdities[0]?.emoji || '🤪';
    }
  });
  
  if (mostAbsurdCommander !== null) {
    highlights.push({
      category: 'Most Absurd Build',
      commanderId: (mostAbsurdCommander as Commander).id,
      commanderName: (mostAbsurdCommander as Commander).name,
      description: mostAbsurdReason,
      emoji: mostAbsurdEmoji,
      score: maxAbsurdity,
    });
  }
  
  // Most Paranoid Moment (Paul's excessive builds)
  const paul = commanders.find(c => c.personality === 'paranoid') as Commander | undefined;
  if (paul) {
    const mineCount = paul.secretBuilds.filter(b => b.type === 'mine').length;
    const wallCount = paul.secretBuilds.filter(b => b.type === 'wall').length;
    
    if (mineCount > 3 || wallCount > 8) {
      highlights.push({
        category: 'Most Paranoid Moment',
        commanderId: paul.id,
        commanderName: paul.name,
        description: mineCount > wallCount 
          ? `Built ${mineCount} mines (preparing for apocalypse)`
          : `Built ${wallCount} walls (fortress mentality)`,
        emoji: '😰',
        score: mineCount * 10 + wallCount * 5,
      });
    }
  }
  
  // Most Literal Interpretation (Larry's precise builds)
  const larry = commanders.find(c => c.personality === 'literalist') as Commander | undefined;
  if (larry && larry.secretBuilds.length <= 3) {
    highlights.push({
      category: 'Most Literal Interpretation',
      commanderId: larry.id,
      commanderName: larry.name,
      description: `Built exactly ${larry.secretBuilds.length} structure${larry.secretBuilds.length !== 1 ? 's' : ''} (no more, no less)`,
      emoji: '😐',
      score: 50,
    });
  }
  
  // Most Optimistic Delusion (Olivia's useless builds)
  const olivia = commanders.find(c => c.personality === 'optimist') as Commander | undefined;
  if (olivia) {
    const farmCount = olivia.secretBuilds.filter(b => b.type === 'farm').length;
    const decoyCount = olivia.secretBuilds.filter(b => b.type === 'decoy').length;
    
    if (farmCount > 2 || decoyCount > 2) {
      highlights.push({
        category: 'Most Optimistic Delusion',
        commanderId: olivia.id,
        commanderName: olivia.name,
        description: farmCount > decoyCount
          ? `Built ${farmCount} farms (they're just decorative)`
          : `Built ${decoyCount} decoys (to guide "guests")`,
        emoji: '😊',
        score: farmCount * 15 + decoyCount * 10,
      });
    }
  }
  
  // Quote of the Day (highest comedy score)
  let bestQuote = '';
  let bestQuoteCommander: Commander | null = null;
  let bestQuoteScore = 0;
  
  commanders.forEach(commander => {
    const comedyScore = calculateComedyScore(commander.interpretation, commander.personality);
    if (comedyScore.score > bestQuoteScore) {
      bestQuoteScore = comedyScore.score;
      bestQuote = commander.interpretation;
      bestQuoteCommander = commander;
    }
  });
  
  if (bestQuoteCommander !== null && bestQuoteScore > 20) {
    highlights.push({
      category: 'Quote of the Day',
      commanderId: (bestQuoteCommander as Commander).id,
      commanderName: (bestQuoteCommander as Commander).name,
      description: bestQuote,
      emoji: '💬',
      score: bestQuoteScore,
    });
  }
  
  return highlights;
}

export function calculateAbsurdityPercentage(commander: Commander, command: string): number {
  const absurdities = detectAbsurdBuilds(commander, command);
  const comedyScore = calculateComedyScore(commander.interpretation, commander.personality);
  
  const absurdityScore = absurdities.reduce((sum, a) => sum + a.score, 0);
  const totalScore = absurdityScore + comedyScore.score;
  
  // Normalize to 0-100%
  const percentage = Math.min(100, Math.round((totalScore / 100) * 100));
  
  return percentage;
}

