import { useState } from 'react';
import { useGameStore } from '../store/useGameStore';
import { interpretCommandForAllCommanders } from '../services/llmService';
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
  const updateCommanderSecretBuilds = useGameStore(
    (state) => state.updateCommanderSecretBuilds
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
    
    try {
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

      // Update each commander's secret builds
      buildPlans.forEach((plan, commanderId) => {
        updateCommanderSecretBuilds(commanderId, plan);
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
        updateCommanderSecretBuilds(commanderId, plan);
      });

      setTimeout(() => {
        setPhase('execute');
      }, 1000);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="bg-gray-900 border-t border-gray-700 p-4">
      <form onSubmit={handleSubmit} className="max-w-4xl mx-auto">
        <div className="flex gap-2">
          <input
            type="text"
            value={command}
            onChange={(e) => setCommand(e.target.value)}
            placeholder="Enter a command for your commanders... (e.g., 'Defend the north')"
            className="flex-1 bg-gray-800 text-white border border-gray-600 rounded px-4 py-2 focus:outline-none focus:border-blue-500"
            disabled={isProcessing}
          />
          <button
            type="submit"
            disabled={isProcessing}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-semibold px-6 py-2 rounded transition-colors"
          >
            {isProcessing ? 'Processing...' : 'Send'}
          </button>
        </div>
        <p className="text-gray-500 text-xs mt-2">
          Teaching Phase: Your commanders will secretly plan their builds based on your command.
        </p>
      </form>
    </div>
  );
};

