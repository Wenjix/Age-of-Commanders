import { useState } from 'react';
import { useGameStore } from '../store/useGameStore';
import { interpretCommandForAllCommanders, getLoadingMessage } from '../services/llmService';
import { generateAllBuildPlans } from '../services/buildPlanService';
import toast from 'react-hot-toast';

export const CommandInput = () => {
  const [command, setCommand] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const phase = useGameStore((state) => state.phase);
  const setPhase = useGameStore((state) => state.setPhase);
  const commanders = useGameStore((state) => state.commanders);
  const enabledBuildings = useGameStore((state) => state.enabledBuildings);
  const wood = useGameStore((state) => state.wood);
  const basePosition = useGameStore((state) => state.basePosition);
  const buildings = useGameStore((state) => state.buildings);
  const updateCommanderInterpretation = useGameStore(
    (state) => state.updateCommanderInterpretation
  );
  const apiKey = useGameStore((state) => state.apiKey);

  if (phase !== 'teach') return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!command.trim()) {
      toast.error('Please enter a command');
      return;
    }

    if (enabledBuildings.length === 0) {
      toast.error('No buildings enabled! This should not happen.');
      return;
    }

    setIsProcessing(true);
    
    // Save command for debrief screen
    localStorage.setItem('lastCommand', command.trim());
    
    try {
      // Show personality-based loading messages
      commanders.forEach((commander) => {
        const message = getLoadingMessage(commander.personality);
        toast.loading(`${commander.name} is ${message}...`, { 
          id: `loading-${commander.id}`,
          duration: 3000 
        });
      });
      
      toast.loading('Commanders are interpreting your command...', { id: 'interpreting' });
      
      // Get interpretations for all commanders
      const interpretations = await interpretCommandForAllCommanders(
        command.trim(),
        commanders,
        apiKey
      );

      // Update each commander's interpretation
      interpretations.forEach((interpretation, commanderId) => {
        updateCommanderInterpretation(commanderId, interpretation);
      });

      toast.success('Commanders have interpreted the command!', { id: 'interpreting' });
      
      // Generate secret build plans for all commanders
      toast.loading('Commanders are planning their builds...', { id: 'planning' });
      
      const buildPlans = generateAllBuildPlans(
        commanders,
        enabledBuildings,
        wood,
        basePosition,
        buildings
      );

      // Update each commander's Act 1 builds
      buildPlans.forEach((plan, commanderId) => {
        useGameStore.setState((state) => ({
          commanders: state.commanders.map(c =>
            c.id === commanderId ? { ...c, act1Builds: plan } : c
          ),
        }));
      });

      toast.success('Build plans ready! Starting execution...', { id: 'planning' });

      // Move to execute phase
      setTimeout(() => {
        setPhase('execute');
      }, 1000);
      
    } catch (error) {
      console.error('Failed to process command:', error);
      toast.error('Failed to process command. Using fallback responses.', { id: 'interpreting' });
      
      // Use fallback responses
      commanders.forEach((commander) => {
        const fallback =
          commander.personality === 'literalist' ? 'Processing command literally.' :
          commander.personality === 'paranoid' ? 'Possible deception detected.' :
          'This sounds wonderful!';
        updateCommanderInterpretation(commander.id, fallback);
      });

      // Generate build plans even with fallback
      const buildPlans = generateAllBuildPlans(
        commanders,
        enabledBuildings,
        wood,
        basePosition,
        buildings
      );

      buildPlans.forEach((plan, commanderId) => {
        useGameStore.setState((state) => ({
          commanders: state.commanders.map(c =>
            c.id === commanderId ? { ...c, act1Builds: plan } : c
          ),
        }));
      });

      setTimeout(() => {
        setPhase('execute');
      }, 1000);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="bg-gray-950 border-t-2 border-green-600 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Terminal Header */}
        <div className="bg-gray-900 rounded-t-lg border-2 border-green-600 border-b-0 px-4 py-2 flex items-center gap-2">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
          </div>
          <span className="text-green-400 text-sm font-mono ml-2">COMMAND CONSOLE</span>
        </div>

        {/* Terminal Body */}
        <form onSubmit={handleSubmit}>
          <div className="bg-black rounded-b-lg border-2 border-green-600 border-t-0 p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-green-400 font-mono text-lg">{'>'}</span>
              <input
                type="text"
                value={command}
                onChange={(e) => setCommand(e.target.value)}
                placeholder="Enter command... (e.g., 'Defend the north')"
                className="flex-1 bg-transparent text-green-400 font-mono text-lg focus:outline-none placeholder-green-700 caret-green-400"
                disabled={isProcessing}
                autoFocus
                style={{
                  fontFamily: "'Courier New', monospace",
                }}
              />
            </div>
            
            <div className="flex items-center justify-between mt-4">
              <p className="text-green-700 text-xs font-mono">
                Teaching Phase: Commanders will interpret your command based on their personalities.
              </p>
              <button
                type="submit"
                disabled={isProcessing}
                className="bg-green-600 hover:bg-green-700 active:bg-green-800 disabled:bg-gray-700 disabled:cursor-not-allowed text-black font-bold px-6 py-2 rounded font-mono transition-colors shadow-lg shadow-green-600/50 disabled:shadow-none"
              >
                {isProcessing ? 'PROCESSING...' : 'EXECUTE'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

