import { useEffect, useState } from 'react';
import { Toaster } from 'react-hot-toast';
import { TopBar } from './components/TopBar';
import { GameCanvas } from './components/GameCanvas';
import { CommanderPanel } from './components/CommanderPanel';
import { CommandInput } from './components/CommandInput';
import { ApiKeyModal } from './components/ApiKeyModal';
import { useGameStore } from './store/useGameStore';

function App() {
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const apiKey = useGameStore((state) => state.apiKey);

  useEffect(() => {
    // Show API key modal on first load if not set
    if (apiKey === null) {
      setShowApiKeyModal(true);
    }
  }, [apiKey]);

  return (
    <div className="w-screen h-screen flex flex-col overflow-hidden">
      <Toaster
        position="top-center"
        toastOptions={{
          style: {
            background: '#1F2937',
            color: '#fff',
            border: '1px solid #374151',
          },
        }}
      />
      <ApiKeyModal
        isOpen={showApiKeyModal}
        onClose={() => setShowApiKeyModal(false)}
      />
      <TopBar />
      <div className="flex-1 overflow-hidden">
        <GameCanvas />
      </div>
      <CommanderPanel />
      <CommandInput />
    </div>
  );
}

export default App;

