import { TopBar } from './components/TopBar';
import { GameCanvas } from './components/GameCanvas';
import { CommanderPanel } from './components/CommanderPanel';

function App() {
  return (
    <div className="w-screen h-screen flex flex-col overflow-hidden">
      <TopBar />
      <div className="flex-1 overflow-hidden">
        <GameCanvas />
      </div>
      <CommanderPanel />
    </div>
  );
}

export default App;

