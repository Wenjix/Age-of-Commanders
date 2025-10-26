export type TurnEventType =
  | 'enemy_spawn'
  | 'enemy_move'
  | 'enemy_distracted'
  | 'building_placed'
  | 'building_failed'
  | 'mine_explosion'
  | 'tower_attack'
  | 'base_damaged'
  | 'enemy_destroyed'
  | 'victory'
  | 'defeat';

export interface TurnLogEntry {
  turn: number;
  type: TurnEventType;
  actorId?: string; // Commander or enemy ID
  actorName?: string; // For display
  targetId?: string;
  targetName?: string;
  position?: [number, number];
  description: string; // Human-readable description
  impact: 'low' | 'medium' | 'high'; // For highlighting important events
  emoji?: string; // Optional emoji for visual flair
}

export interface CommanderThought {
  commanderId: string;
  text: string;
  type: 'building' | 'success' | 'failure' | 'reaction';
  duration: number; // How long to show in ms
}