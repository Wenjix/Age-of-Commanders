import { useState, useEffect } from 'react';
import type { Commander, Building } from '../../store/useGameStore';

interface CommanderCardProps {
  commander: Commander;
  buildings: Building[];
  reaction: string;
  absurdityPercent: number;
  delay?: number;
}

const PERSONALITY_EMOJIS: Record<string, string> = {
  literalist: '😐',
  paranoid: '😰',
  optimist: '😊',
  ruthless: '😠',
  trickster: '😏',
};

const BUILDING_ICONS: Record<string, string> = {
  wall: '🧱',
  tower: '🗼',
  mine: '💣',
  decoy: '🎯',
  farm: '🌾',
};

export const CommanderCard = ({
  commander,
  buildings,
  reaction,
  absurdityPercent,
  delay = 0,
}: CommanderCardProps) => {
  const [isVisible, setIsVisible] = useState(false);
  const [progressWidth, setProgressWidth] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => setProgressWidth(absurdityPercent), 100);
      return () => clearTimeout(timer);
    }
  }, [isVisible, absurdityPercent]);

  // Count buildings by type
  const buildingCounts: Record<string, number> = {};
  buildings.forEach((building) => {
    buildingCounts[building.type] = (buildingCounts[building.type] || 0) + 1;
  });

  const emoji = PERSONALITY_EMOJIS[commander.personality] || '🤖';
  const personalityLabel = commander.personality.charAt(0).toUpperCase() + commander.personality.slice(1);

  return (
    <div
      className={`commander-card ${isVisible ? 'commander-card-visible' : ''}`}
      style={{ animationDelay: `${delay}ms` }}
    >
      {/* Header */}
      <div className="commander-header">
        <div className="commander-avatar">{emoji}</div>
        <div className="commander-info">
          <h3 className="commander-name">{commander.name}</h3>
          <span className="personality-badge">{personalityLabel}</span>
        </div>
      </div>

      {/* Interpretation */}
      <div className="commander-section interpretation-box">
        <label className="section-label">💬 They heard:</label>
        <p className="interpretation-text">"{commander.interpretation}"</p>
      </div>

      {/* Buildings */}
      <div className="commander-section buildings-box">
        <label className="section-label">🏗️ What they built:</label>
        <div className="building-chips">
          {Object.entries(buildingCounts).length > 0 ? (
            Object.entries(buildingCounts).map(([type, count]) => (
              <div key={type} className="building-chip">
                <span>{BUILDING_ICONS[type]}</span>
                <span>{type} x{count}</span>
              </div>
            ))
          ) : (
            <span className="no-buildings">Nothing (stood by)</span>
          )}
        </div>
      </div>

      {/* Reaction */}
      <div className="commander-section reaction-box">
        <label className="section-label">💭 Reaction:</label>
        <p className="reaction-text">{reaction}</p>
      </div>

      {/* Absurdity Meter */}
      <div className="commander-section absurdity-section">
        <div className="absurdity-header">
          <label className="section-label">📊 Absurdity:</label>
          <span className="absurdity-value">{absurdityPercent}%</span>
        </div>
        <div className="progress-bar">
          <div
            className="progress-fill"
            style={{ width: `${progressWidth}%` }}
          />
        </div>
      </div>
    </div>
  );
};

