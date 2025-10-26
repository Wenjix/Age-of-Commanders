import { Toaster } from 'react-hot-toast';
import { TopBar } from './components/TopBar';
import { PhaseIndicator } from './components/PhaseIndicator';
import { GameCanvas } from './components/GameCanvas';
import { CommanderPanel } from './components/CommanderPanel';
import { CommandInput } from './components/CommandInput';
import { ExecutionController } from './components/ExecutionController';
import { ExecutionHUD } from './components/ExecutionHUD';
import { ExecutionScreen } from './components/ExecutionScreen';
import { BuildingCuration } from './components/BuildingCuration';
import { BuildingCodex } from './components/BuildingCodex';
import { DebriefScreen } from './components/DebriefScreen';
import { CommanderIntroduction } from './components/CommanderIntroduction';

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
      <CommanderIntroduction />
      <BuildingCuration />
      <DebriefScreen />
      <ExecutionScreen />
      <ExecutionController />
      <ExecutionHUD />
      <BuildingCodex />
      <TopBar />
      <PhaseIndicator />
      <div className="flex-1 overflow-hidden">
        <GameCanvas />
      </div>
      <CommanderPanel />
      <CommandInput />
    </div>
  );
}

export default App;

