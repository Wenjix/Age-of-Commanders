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
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-gray-900 border-2 border-gray-700 rounded-lg p-6 max-w-md w-full mx-4">
        <h2 className="text-white text-xl font-bold mb-4">Gemini API Key</h2>
        <p className="text-gray-300 text-sm mb-4">
          Enter your Gemini API key to enable LLM-powered commander interpretations.
          The key is stored in memory only and never saved.
        </p>
        <form onSubmit={handleSubmit}>
          <input
            type="password"
            value={key}
            onChange={(e) => setKey(e.target.value)}
            placeholder="Enter Gemini API key..."
            className="w-full bg-gray-800 text-white border border-gray-600 rounded px-3 py-2 mb-4 focus:outline-none focus:border-blue-500"
            autoFocus
          />
          <div className="flex gap-2">
            <button
              type="submit"
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded transition-colors"
            >
              Save Key
            </button>
            <button
              type="button"
              onClick={handleSkip}
              className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-semibold py-2 px-4 rounded transition-colors"
            >
              Skip (Use Fallbacks)
            </button>
          </div>
        </form>
        <p className="text-gray-500 text-xs mt-3">
          Get a free API key at{' '}
          <a
            href="https://aistudio.google.com/apikey"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-400 hover:underline"
          >
            Google AI Studio
          </a>
        </p>
      </div>
    </div>
  );
};

