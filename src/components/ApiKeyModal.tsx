import { useState } from 'react';
import { useGameStore } from '../store/useGameStore';

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ApiKeyModal = ({ isOpen, onClose }: ApiKeyModalProps) => {
  const [key, setKey] = useState('');
  const setApiKey = useGameStore((state) => state.setApiKey);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (key.trim()) {
      setApiKey(key.trim());
      onClose();
    }
  };

  const handleSkip = () => {
    setApiKey(''); // Set empty string to indicate user skipped
    onClose();
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 p-4" style={{ backgroundColor: 'rgba(0, 0, 0, 0.85)' }}>
      <div className="rounded-xl shadow-2xl p-8 max-w-lg w-full" style={{ backgroundColor: '#ffffff' }}>
        <div className="mb-6">
          <h2 className="text-2xl font-bold mb-3" style={{ color: '#1a1a1a' }}>🔑 Gemini API Key</h2>
          <p className="text-base leading-relaxed mb-2" style={{ color: '#2d2d2d' }}>
            Enter your <strong>Google Gemini API key</strong> to enable AI-powered commander interpretations.
          </p>
          <p className="text-sm" style={{ color: '#4a4a4a' }}>
            Your key is stored in memory only and never saved to disk.
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-6">
            <label htmlFor="api-key" className="block text-sm font-semibold mb-2" style={{ color: '#1a1a1a' }}>
              API Key
            </label>
            <input
              id="api-key"
              type="password"
              value={key}
              onChange={(e) => setKey(e.target.value)}
              placeholder="AIza..."
              className="w-full rounded-lg px-4 py-3 focus:outline-none transition-all"
              style={{
                backgroundColor: '#f5f5f5',
                color: '#1a1a1a',
                border: '2px solid #d1d5db',
                fontSize: '16px'
              }}
              autoFocus
            />
          </div>

          <div className="flex gap-3 mb-4">
            <button
              type="submit"
              className="flex-1 font-bold py-3 px-6 rounded-lg transition-colors shadow-md hover:shadow-lg"
              style={{
                backgroundColor: '#2563eb',
                color: '#ffffff'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#1d4ed8'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#2563eb'}
            >
              Save Key
            </button>
            <button
              type="button"
              onClick={handleSkip}
              className="flex-1 font-bold py-3 px-6 rounded-lg transition-colors"
              style={{
                backgroundColor: '#e5e7eb',
                color: '#1f2937'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#d1d5db'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#e5e7eb'}
            >
              Skip (Use Fallbacks)
            </button>
          </div>
        </form>

        <div className="rounded-lg p-4" style={{ backgroundColor: '#eff6ff', border: '1px solid #bfdbfe' }}>
          <p className="text-sm mb-2" style={{ color: '#1a1a1a' }}>
            <strong>Don't have an API key?</strong>
          </p>
          <p className="text-sm" style={{ color: '#2d2d2d' }}>
            Get a free key at{' '}
            <a
              href="https://aistudio.google.com/apikey"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold underline"
              style={{ color: '#2563eb' }}
            >
              Google AI Studio
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

