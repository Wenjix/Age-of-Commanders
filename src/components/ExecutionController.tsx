import { useEffect, useState } from 'react';
import { useGameStore } from '../store/useGameStore';
import { BUILDING_COSTS } from '../constants/gameConstants';
import toast from 'react-hot-toast';

export const ExecutionController = () => {
  const phase = useGameStore((state) => state.phase);
  const commanders = useGameStore((state) => state.commanders);
  const placeBuilding = useGameStore((state) => state.placeBuilding);
  const setPhase = useGameStore((state) => state.setPhase);
  const wood = useGameStore((state) => state.wood);
  const deductWood = useGameStore((state) => state.deductWood);
  
  const [executionStarted, setExecutionStarted] = useState(false);

  useEffect(() => {
    if (phase !== 'execute' || executionStarted) return;

    setExecutionStarted(true);

    // Place all secret builds immediately (but they remain hidden)
    let totalWoodUsed = 0;
    let totalBuildings = 0;

    commanders.forEach((commander) => {
      commander.secretBuilds.forEach((building) => {
        const cost = BUILDING_COSTS[building.type];
        
        // Check if we can afford it
        if (wood - totalWoodUsed >= cost) {
          // Place the building (it's marked as revealed: false)
          const placed = placeBuilding(building);
          
          if (placed) {
            totalWoodUsed += cost;
            totalBuildings++;
          }
        }
      });
    });

    // Deduct all the wood at once
    if (totalWoodUsed > 0) {
      deductWood(totalWoodUsed);
    }

    toast.success(
      `Execution started! ${totalBuildings} buildings planned (${totalWoodUsed} wood)`,
      { duration: 3000 }
    );

    // Simulate wave duration (5 seconds for demo, would be 5 minutes in real game)
    const waveDuration = 5000; // 5 seconds
    
    toast.loading('Enemy wave incoming...', { id: 'wave', duration: waveDuration });

    setTimeout(() => {
      toast.success('Wave complete! Revealing builds...', { id: 'wave' });
      setPhase('debrief');
      setExecutionStarted(false);
    }, waveDuration);

  }, [phase, executionStarted, commanders, placeBuilding, setPhase, wood, deductWood]);

  // Reset execution started when phase changes away from execute
  useEffect(() => {
    if (phase !== 'execute') {
      setExecutionStarted(false);
    }
  }, [phase]);

  return null;
};

