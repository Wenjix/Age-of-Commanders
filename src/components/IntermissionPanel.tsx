import { useState, useEffect } from 'react';
import { useGameStore } from '../store/useGameStore';
import { resumeFromIntermission } from '../services/turnManager';
import {
  interpretCommandWithContext,
  interpretSkipAsCommand,
  getSkipThought,
  generateExecutionPlan
} from '../services/llmService';
import toast from 'react-hot-toast';

export const IntermissionPanel = () => {
  const [command, setCommand] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const currentTurn = useGameStore((state) => state.currentTurn);
  const wood = useGameStore((state) => state.wood);
  const act1Bonus = useGameStore((state) => state.act1Bonus);
  const act2Bonus = useGameStore((state) => state.act2Bonus);
  const commanders = useGameStore((state) => state.commanders);
  const apiKey = useGameStore((state) => state.apiKey);
  const enemiesKilledPerAct = useGameStore((state) => state.enemiesKilledPerAct);
  const currentAct = useGameStore((state) => state.currentAct);
  const updateCommanderInterpretation = useGameStore((state) => state.updateCommanderInterpretation);

  const bonus = currentTurn === 8 ? act1Bonus : act2Bonus;
  const nextAct = currentAct + 1;

  const handleSubmit = async () => {
    // Prevent empty submissions
    if (!command.trim()) {
      toast.error('Please enter a command or click Skip');
      return;
    }

    setIsProcessing(true);
    toast.loading('Commanders interpreting new orders...');

    try {
      // Call LLM for each commander with context
      const interpretations = await Promise.all(
        commanders.map(async (commander) => {
          const totalKills = enemiesKilledPerAct.reduce((a, b) => a + b, 0);
          const interpretation = await interpretCommandWithContext(
            command,
            commander.lastCommand,
            commander.personality,
            { wood, enemiesKilled: totalKills, act: nextAct },
            apiKey
          );

          return { commanderId: commander.id, interpretation };
        })
      );

      // Update interpretations and generate builds
      interpretations.forEach(({ commanderId, interpretation }) => {
        updateCommanderInterpretation(commanderId, interpretation);

        // Generate execution plan (max 3 builds)
        const commander = commanders.find(c => c.id === commanderId)!;
        const plan = generateExecutionPlan(interpretation, commander.personality);

        // Convert plan to buildings
        const builds = plan.map(action => ({
          position: action.position,
          type: action.building,
          ownerId: commanderId,
          revealed: false,
        }));

        // Store in appropriate act builds
        if (nextAct === 2) {
          useGameStore.setState((state) => ({
            commanders: state.commanders.map(c =>
              c.id === commanderId ? { ...c, act2Builds: builds, lastCommand: command } : c
            ),
          }));
        } else {
          useGameStore.setState((state) => ({
            commanders: state.commanders.map(c =>
              c.id === commanderId ? { ...c, act3Builds: builds, lastCommand: command } : c
            ),
          }));
        }
      });

      toast.dismiss();
      toast.success('Orders received! Resuming execution...');

      // Resume execution
      setTimeout(() => {
        resumeFromIntermission();
      }, 1000);

    } catch (error) {
      toast.dismiss();
      toast.error('Failed to process command');
      console.error('Intermission command error:', error);
      setIsProcessing(false);
    }
  };

  const handleSkip = () => {
    setIsProcessing(true);
    toast.loading('Commanders thinking independently...');

    // Generate builds using interpretSkipAsCommand()
    commanders.forEach((commander) => {
      const builds = interpretSkipAsCommand(
        commander.personality,
        commander.lastCommand,
        { wood }
      ).map(action => ({
        position: action.position,
        type: action.building,
        ownerId: commander.id,
        revealed: false,
      }));

      // Show personality-specific thought
      const thought = getSkipThought(commander.personality);
      updateCommanderInterpretation(commander.id, thought);

      // Store builds
      if (nextAct === 2) {
        useGameStore.setState((state) => ({
          commanders: state.commanders.map(c =>
            c.id === commander.id ? { ...c, act2Builds: builds } : c
          ),
        }));
      } else {
        useGameStore.setState((state) => ({
          commanders: state.commanders.map(c =>
            c.id === commander.id ? { ...c, act3Builds: builds } : c
          ),
        }));
      }
    });

    toast.dismiss();
    toast.success('Commanders proceeding with own judgment...');

    setTimeout(() => {
      resumeFromIntermission();
    }, 1000);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-slate-800 rounded-lg p-8 max-w-2xl w-full mx-4 border-2 border-amber-500">
        <h2 className="text-3xl font-bold text-amber-400 mb-4">
          🎭 Intermission: Act {nextAct} Approaching
        </h2>

        <div className="bg-slate-700 rounded p-4 mb-6">
          <p className="text-lg text-green-400 font-semibold">
            Act {currentAct} Bonus: {bonus > 0 ? `+${bonus} wood` : 'None'}
          </p>
          <p className="text-lg text-blue-400">
            Current Wood: {wood}
          </p>
          <p className="text-sm text-slate-300 mt-2">
            Total Enemies Defeated: {enemiesKilledPerAct.reduce((a, b) => a + b, 0)}
          </p>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-semibold text-slate-300 mb-2">
            Give your commanders new orders for Act {nextAct}:
          </label>
          <input
            type="text"
            value={command}
            onChange={(e) => setCommand(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !isProcessing) {
                handleSubmit();
              }
            }}
            placeholder="e.g., 'Build more defenses' or 'Focus on farms'"
            className="w-full px-4 py-3 bg-slate-700 text-white rounded border border-slate-600 focus:border-amber-500 focus:outline-none"
            disabled={isProcessing}
          />
        </div>

        <div className="flex gap-4">
          <button
            onClick={handleSubmit}
            disabled={isProcessing}
            className="flex-1 px-6 py-3 bg-amber-600 hover:bg-amber-700 disabled:bg-slate-600 text-white font-semibold rounded transition-colors"
          >
            {isProcessing ? 'Processing...' : 'Submit Command'}
          </button>

          <button
            onClick={handleSkip}
            disabled={isProcessing}
            className="px-6 py-3 bg-slate-600 hover:bg-slate-700 disabled:bg-slate-500 text-white font-semibold rounded transition-colors"
          >
            Skip
          </button>
        </div>

        <p className="text-xs text-slate-400 mt-4 text-center">
          Skipping will let commanders decide their own actions based on their personalities
        </p>
      </div>
    </div>
  );
};
