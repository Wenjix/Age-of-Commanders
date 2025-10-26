import { useEffect, useState } from 'react';

interface HeroBannerProps {
  outcome: 'victory' | 'defeat';
  missionTitle: string;
  turnsCompleted: number;
  maxTurns: number;
  woodDelta: number;
  enemiesKilled: number;
}

interface StatBadgeProps {
  icon: string;
  label: string;
  delay?: number;
}

const StatBadge = ({ icon, label, delay = 0 }: StatBadgeProps) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  return (
    <div
      className={`stat-badge ${isVisible ? 'stat-badge-visible' : ''}`}
      style={{ animationDelay: `${delay}ms` }}
    >
      <span className="stat-icon">{icon}</span>
      <span className="stat-label">{label}</span>
    </div>
  );
};

export const HeroBanner = ({
  outcome,
  missionTitle,
  turnsCompleted,
  maxTurns,
  woodDelta,
  enemiesKilled,
}: HeroBannerProps) => {
  const [titleVisible, setTitleVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setTitleVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const isVictory = outcome === 'victory';

  return (
    <div className={`hero-banner ${isVictory ? 'hero-victory' : 'hero-defeat'}`}>
      {/* Animated Background Effect */}
      <div className="hero-background">
        {isVictory && (
          <div className="confetti-container">
            {[...Array(50)].map((_, i) => (
              <div
                key={i}
                className="confetti"
                style={{
                  left: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 2}s`,
                  animationDuration: `${2 + Math.random() * 2}s`,
                }}
              />
            ))}
          </div>
        )}
        {!isVictory && (
          <div className="smoke-container">
            {[...Array(10)].map((_, i) => (
              <div
                key={i}
                className="smoke"
                style={{
                  left: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 1}s`,
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="hero-content">
        {/* Title */}
        <h1 className={`hero-title ${titleVisible ? 'hero-title-visible' : ''}`}>
          {isVictory ? '🎉 VICTORY! 🎉' : '💥 BASE DESTROYED 💥'}
        </h1>

        {/* Mission Subtitle */}
        <div className="mission-subtitle">
          Mission: "{missionTitle}"
        </div>

        {/* Stats Strip */}
        <div className="stats-strip">
          <StatBadge
            icon="⏱️"
            label={`${turnsCompleted}/${maxTurns} turns`}
            delay={200}
          />
          <StatBadge
            icon="🪵"
            label={`${woodDelta > 0 ? '+' : ''}${woodDelta} wood`}
            delay={400}
          />
          <StatBadge
            icon="⚔️"
            label={`${enemiesKilled} enemies`}
            delay={600}
          />
        </div>
      </div>
    </div>
  );
};

