interface ActionFooterProps {
  onPlayAgain: () => void;
  onShare: () => void;
  onViewStats?: () => void;
}

export const ActionFooter = ({ onPlayAgain, onShare, onViewStats }: ActionFooterProps) => {
  return (
    <div className="action-footer">
      <button className="action-btn action-btn-primary" onClick={onPlayAgain}>
        🎮 Play Again
      </button>
      
      <button className="action-btn action-btn-secondary" onClick={onShare}>
        📤 Share Results
      </button>
      
      {onViewStats && (
        <button className="action-btn action-btn-secondary" onClick={onViewStats}>
          📊 Detailed Stats
        </button>
      )}
    </div>
  );
};

