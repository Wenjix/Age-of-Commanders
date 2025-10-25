import { TopBar } from './components/TopBar';
import { GameCanvas } from './components/GameCanvas';

function App() {
  return (
    <div className="w-screen h-screen flex flex-col overflow-hidden">
      <TopBar />
      <div className="flex-1">
        <GameCanvas />
      </div>
    </div>
  );
}

export default App;

