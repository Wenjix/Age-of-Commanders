export interface ScoutingReport {
  act: 1 | 2 | 3;
  message: string;
  emoji: string;
  severity: 'low' | 'medium' | 'high';
}

export const SCOUTING_REPORTS: Record<1 | 2 | 3, ScoutingReport> = {
  1: {
    act: 1,
    message: "A small group of invaders approaches from the north. They seem… confused.",
    emoji: "🔍",
    severity: "low",
  },
  2: {
    act: 2,
    message: "A sizable force is marching from the north. They're better organized!",
    emoji: "⚠️",
    severity: "medium",
  },
  3: {
    act: 3,
    message: "A relentless horde descends from the north! They're moving fast—prepare for chaos!",
    emoji: "🚨",
    severity: "high",
  },
};

// Helper to get scouting report for current act
export function getScoutingReport(act: 1 | 2 | 3): ScoutingReport {
  return SCOUTING_REPORTS[act];
}

