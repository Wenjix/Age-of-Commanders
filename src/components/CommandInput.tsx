import { useState } from 'react';
import { useGameStore } from '../store/useGameStore';
import { interpretCommandForAllCommanders, generateExecutionPlan } from '../services/llmService';
import toast from 'react-hot-toast';

export const CommandInput = () => {
  const [command, setCommand] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const phase = useGameStore((state) => state.phase);
  const setPhase = useGameStore((state) => state.setPhase);
  const commanders = useGameStore((state) => state.commanders);
  const updateCommanderInterpretation = useGameStore(
    (state) => state.updateCommanderInterpretation
  );
  const updateCommanderExecutionPlan = useGameStore(
    (state) => state.updateCommanderExecutionPlan
  );
  const apiKey = useGameStore((state) => state.apiKey);

  if (phase !== 'teach') return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!command.trim()) {
      toast.error('Please enter a command');
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

      // Update each commander's interpretation and generate execution plans
      interpretations.forEach((interpretation, commanderId) => {
        updateCommanderInterpretation(commanderId, interpretation);

        // Find the commander to get their personality
        const commander = commanders.find((c) => c.id === commanderId);
        if (commander) {
          // Generate execution plan based on interpretation and personality
          const executionPlan = generateExecutionPlan(interpretation, commander.personality);
          updateCommanderExecutionPlan(commanderId, executionPlan);
        }
      });

      toast.success('Commanders have interpreted the command!', { id: 'interpreting' });

      // Move to execute phase
      setPhase('execute');
      
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

        // Generate execution plan from fallback
        const executionPlan = generateExecutionPlan(fallback, commander.personality);
        updateCommanderExecutionPlan(commander.id, executionPlan);
      });

      setPhase('execute');
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
            placeholder="Enter a command for your commanders... (e.g., 'Build more defenses')"
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
          Teaching Phase: Your commanders will interpret this command based on their personalities.
        </p>
      </form>
    </div>
  );
};

