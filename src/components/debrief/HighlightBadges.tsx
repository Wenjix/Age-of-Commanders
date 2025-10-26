import { useState, useEffect } from 'react';

export interface Highlight {
  icon: string;
  title: string;
  content: string;
  subtitle?: string;
  author?: string;
  color: 'yellow' | 'purple' | 'blue';
}

interface HighlightBadgeProps extends Highlight {
  delay?: number;
}

const HighlightBadge = ({ icon, title, content, subtitle, author, color, delay = 0 }: HighlightBadgeProps) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  return (
    <div
      className={`highlight-badge highlight-badge-${color} ${isVisible ? 'highlight-badge-visible' : ''}`}
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="highlight-icon">{icon}</div>
      <div className="highlight-title">{title}</div>
      <div className="highlight-content">{content}</div>
      {subtitle && <div className="highlight-subtitle">{subtitle}</div>}
      {author && <div className="highlight-author">- {author}</div>}
    </div>
  );
};

interface HighlightBadgesProps {
  highlights: {
    quoteOfTheDay?: { text: string; commander: string };
    mostAbsurd?: { commander: string; type: string; count: number; absurdity: number };
    bestReaction?: { commander: string; text: string };
  };
}

export const HighlightBadges = ({ highlights }: HighlightBadgesProps) => {
  const badges: Highlight[] = [];

  // Quote of the Day
  if (highlights.quoteOfTheDay) {
    badges.push({
      icon: '💬',
      title: 'QUOTE OF THE DAY',
      content: `"${highlights.quoteOfTheDay.text}"`,
      author: highlights.quoteOfTheDay.commander,
      color: 'yellow',
    });
  }

  // Most Absurd
  if (highlights.mostAbsurd) {
    badges.push({
      icon: '😂',
      title: 'MOST ABSURD',
      content: `${highlights.mostAbsurd.commander} built ${highlights.mostAbsurd.count} ${highlights.mostAbsurd.type}${highlights.mostAbsurd.count > 1 ? 's' : ''}!`,
      subtitle: `${highlights.mostAbsurd.absurdity}% absurd`,
      color: 'purple',
    });
  }

  // Best Reaction
  if (highlights.bestReaction) {
    badges.push({
      icon: '💬',
      title: 'BEST REACTION',
      content: `"${highlights.bestReaction.text}"`,
      author: highlights.bestReaction.commander,
      color: 'blue',
    });
  }

  if (badges.length === 0) {
    return null;
  }

  return (
    <div className="highlight-badges-container">
      <h3 className="highlight-badges-title">🏆 HIGHLIGHTS</h3>
      <div className="highlight-badges-grid">
        {badges.map((badge, index) => (
          <HighlightBadge key={badge.title} {...badge} delay={index * 150} />
        ))}
      </div>
    </div>
  );
};

