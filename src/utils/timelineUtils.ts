import type { TurnLogEntry } from '../types/turnLog';
import type { TimelineEvent, TurnCluster } from '../components/debrief/BattleTimeline';

/**
 * Convert turn logs to timeline events
 */
export function convertTurnLogsToEvents(turnLogs: TurnLogEntry[]): TimelineEvent[] {
  const events: TimelineEvent[] = [];

  turnLogs.forEach((entry, index) => {
    events.push({
      id: `turn-${entry.turn}-event-${index}`,
      type: entry.type as unknown as TimelineEvent['type'],
      icon: entry.emoji || getEventIcon(entry.type),
      description: entry.description,
      turn: entry.turn,
    });
  });

  return events;
}

/**
 * Get icon for event type
 */
function getEventIcon(type: string): string {
  const iconMap: Record<string, string> = {
    build: '🏗️',
    enemy_spawn: '⚔️',
    enemy_killed: '💀',
    mine_exploded: '💣',
    base_damaged: '💥',
    tower_attack: '🗼',
  };
  return iconMap[type] || '📌';
}

/**
 * Cluster turns into groups
 */
export function clusterTurns(turnLogs: TurnLogEntry[], clusterSize: number = 3): TurnCluster[] {
  const clusters: TurnCluster[] = [];

  for (let i = 0; i < turnLogs.length; i += clusterSize) {
    const turns = turnLogs.slice(i, i + clusterSize);
    if (turns.length === 0) continue;

    const events = convertTurnLogsToEvents(turns);
    const title = getClusterTitle(turns);
    const isKeyMoment = hasKeyMoment(turns);

    clusters.push({
      start: turns[0].turn,
      end: turns[turns.length - 1].turn,
      title,
      events,
      isKeyMoment,
    });
  }

  return clusters;
}

/**
 * Determine cluster title based on events
 */
function getClusterTitle(turns: TurnLogEntry[]): string {
  const hasExplosion = turns.some(t => t.type === 'mine_explosion');
  const baseDamaged = turns.some(t => t.type === 'base_damaged');
  const hasTowerAttack = turns.some(t => t.type === 'tower_attack');
  const totalKills = turns.filter(t => t.type === 'enemy_destroyed').length;

  if (baseDamaged) return 'Critical Defense';
  if (hasExplosion) return 'Major Engagement';
  if (totalKills > 5) return 'Heavy Combat';
  if (hasTowerAttack || totalKills > 0) return 'Early Combat';
  return 'Setup Phase';
}

/**
 * Check if turns contain a key moment
 */
function hasKeyMoment(turns: TurnLogEntry[]): boolean {
  return turns.some(t => 
    t.type === 'mine_explosion' || 
    t.type === 'base_damaged'
  );
}

/**
 * Select top N moments from turn logs
 */
export function selectTopMoments(turnLogs: TurnLogEntry[], count: number = 3): TimelineEvent[] {
  const allEvents = convertTurnLogsToEvents(turnLogs);

  // Score each event
  const scoredEvents = allEvents.map(event => ({
    event,
    score: calculateEventScore(event),
  }));

  // Sort by score and take top N
  return scoredEvents
    .sort((a, b) => b.score - a.score)
    .slice(0, count)
    .map(({ event }) => event);
}

/**
 * Calculate importance score for an event
 */
function calculateEventScore(event: TimelineEvent): number {
  let score = 0;

  // High-impact events
  if (event.type === 'mine_exploded') score += 50;
  if (event.type === 'base_damaged') score += 100;
  if (event.type === 'tower_attack') score += 20;
  if (event.type === 'enemy_killed') score += 10;

  return score;
}

/**
 * Extract best moment from turn logs
 */
export function extractBestMoment(turnLogs: TurnLogEntry[]): { turn: number; description: string } | null {
  const topMoments = selectTopMoments(turnLogs, 1);
  if (topMoments.length === 0) return null;

  const best = topMoments[0];
  return {
    turn: best.turn,
    description: best.description,
  };
}

