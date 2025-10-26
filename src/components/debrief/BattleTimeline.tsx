import { useState } from 'react';

export interface TimelineEvent {
  id: string;
  type: 'build' | 'enemy_spawn' | 'enemy_killed' | 'mine_exploded' | 'base_damaged' | 'tower_attack';
  icon: string;
  description: string;
  turn: number;
}

export interface TurnCluster {
  start: number;
  end: number;
  title: string;
  events: TimelineEvent[];
  isKeyMoment: boolean;
}

interface BattleTimelineProps {
  topMoments: TimelineEvent[];
  clusters: TurnCluster[];
}

const TimelineMoment = ({ event }: { event: TimelineEvent }) => {
  return (
    <div className="timeline-moment">
      <span className="moment-icon">{event.icon}</span>
      <span className="moment-description">
        <strong>Turn {event.turn}:</strong> {event.description}
      </span>
    </div>
  );
};

const TurnClusterComponent = ({ cluster }: { cluster: TurnCluster }) => {
  return (
    <div className={`turn-cluster ${cluster.isKeyMoment ? 'key-moment' : ''}`}>
      <div className="cluster-header">
        {cluster.isKeyMoment && <span className="key-star">⭐</span>}
        Turn {cluster.start}-{cluster.end}: {cluster.title}
      </div>
      <div className="cluster-events">
        {cluster.events.map((event) => (
          <div key={event.id} className="timeline-event">
            <span className="event-icon">{event.icon}</span>
            <span className="event-description">{event.description}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export const BattleTimeline = ({ topMoments, clusters }: BattleTimelineProps) => {
  const [isExpanded, setIsExpanded] = useState(false);

  if (topMoments.length === 0 && clusters.length === 0) {
    return null;
  }

  return (
    <div className="battle-timeline">
      <div className="timeline-header">
        <h3 className="timeline-title">📜 BATTLE TIMELINE</h3>
        <button
          className="timeline-toggle"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          {isExpanded ? '▲ Collapse Timeline' : `▼ View Full Timeline (${clusters.reduce((sum, c) => sum + (c.end - c.start + 1), 0)} turns)`}
        </button>
      </div>

      {!isExpanded && topMoments.length > 0 && (
        <div className="top-moments">
          <h4 className="top-moments-title">🌟 Top {topMoments.length} Key Moments:</h4>
          <div className="moments-list">
            {topMoments.map((event) => (
              <TimelineMoment key={event.id} event={event} />
            ))}
          </div>
        </div>
      )}

      {isExpanded && (
        <div className="full-timeline">
          {clusters.map((cluster, index) => (
            <TurnClusterComponent key={`${cluster.start}-${cluster.end}-${index}`} cluster={cluster} />
          ))}
        </div>
      )}
    </div>
  );
};

