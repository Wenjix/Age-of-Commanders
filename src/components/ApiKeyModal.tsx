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
    <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl p-8 max-w-lg w-full">
        <div className="mb-6">
          <h2 className="text-gray-900 text-2xl font-bold mb-3">🔑 Gemini API Key</h2>
          <p className="text-gray-700 text-base leading-relaxed mb-2">
            Enter your <strong>Google Gemini API key</strong> to enable AI-powered commander interpretations.
          </p>
          <p className="text-gray-600 text-sm">
            Your key is stored in memory only and never saved to disk.
          </p>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="mb-6">
            <label htmlFor="api-key" className="block text-gray-800 text-sm font-semibold mb-2">
              API Key
            </label>
            <input
              id="api-key"
              type="password"
              value={key}
              onChange={(e) => setKey(e.target.value)}
              placeholder="AIza..."
              className="w-full bg-gray-50 text-gray-900 border-2 border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
              autoFocus
            />
          </div>
          
          <div className="flex gap-3 mb-4">
            <button
              type="submit"
              className="flex-1 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold py-3 px-6 rounded-lg transition-colors shadow-md hover:shadow-lg"
            >
              Save Key
            </button>
            <button
              type="button"
              onClick={handleSkip}
              className="flex-1 bg-gray-200 hover:bg-gray-300 active:bg-gray-400 text-gray-800 font-bold py-3 px-6 rounded-lg transition-colors"
            >
              Skip (Use Fallbacks)
            </button>
          </div>
        </form>
        
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-gray-800 text-sm mb-2">
            <strong>Don't have an API key?</strong>
          </p>
          <p className="text-gray-700 text-sm">
            Get a free key at{' '}
            <a
              href="https://aistudio.google.com/apikey"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 font-semibold underline"
            >
              Google AI Studio
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

