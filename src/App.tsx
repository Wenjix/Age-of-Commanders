import { Toaster } from 'react-hot-toast';
import { TopBar } from './components/TopBar';
import { GameCanvas } from './components/GameCanvas';
import { CommanderPanel } from './components/CommanderPanel';
import { CommandInput } from './components/CommandInput';
import { ExecutionController } from './components/ExecutionController';

function App() {
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
      <ExecutionController />
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

