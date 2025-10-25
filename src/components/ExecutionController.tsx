import { useEffect } from 'react';
import { useGameStore } from '../store/useGameStore';
import toast from 'react-hot-toast';

const BUILDING_COSTS = {
  wall: 5,
  tower: 10,
  'welcome-sign': 0, // Free (optimist's decorations)
};

export const ExecutionController = () => {
  const phase = useGameStore((state) => state.phase);
  const commanders = useGameStore((state) => state.commanders);
  const updateCommanderActionIndex = useGameStore(
    (state) => state.updateCommanderActionIndex
  );
  const placeBuilding = useGameStore((state) => state.placeBuilding);
  const deductWood = useGameStore((state) => state.deductWood);
  const isTileOccupied = useGameStore((state) => state.isTileOccupied);
  const wood = useGameStore((state) => state.wood);
  const setPhase = useGameStore((state) => state.setPhase);

  useEffect(() => {
    if (phase !== 'execute') return;

    const executeNextActions = () => {
      let allComplete = true;

      commanders.forEach((commander) => {
        const { id, executionPlan, currentActionIndex, name } = commander;

        // Check if this commander has more actions
        if (currentActionIndex < executionPlan.length) {
          allComplete = false;
          const action = executionPlan[currentActionIndex];

          if (action.type === 'build') {
            const [x, y] = action.position;
            const cost = BUILDING_COSTS[action.building];

            // Check if tile is occupied
            if (isTileOccupied(x, y)) {
              toast.error(
                `${name}: Can't build ${action.building} at (${x}, ${y}) - tile occupied!`,
                { duration: 3000 }
              );
              // Skip this action
              updateCommanderActionIndex(id, currentActionIndex + 1);
              return;
            }

            // Check if we have enough wood
            if (cost > 0 && wood < cost) {
              toast.error(
                `${name}: Not enough wood to build ${action.building}! (Need ${cost}, have ${wood})`,
                { duration: 3000 }
              );
              // Skip this action
              updateCommanderActionIndex(id, currentActionIndex + 1);
              return;
            }

            // Deduct wood
            if (cost > 0) {
              const success = deductWood(cost);
              if (!success) {
                // This shouldn't happen if the check above worked, but handle it anyway
                toast.error(`${name}: Failed to deduct wood!`);
                updateCommanderActionIndex(id, currentActionIndex + 1);
                return;
              }
            }

            // Place the building
            const placed = placeBuilding({
              position: action.position,
              type: action.building,
              ownerId: id,
            });

            if (placed) {
              toast.success(
                `${name}: Built ${action.building} at (${x}, ${y})${cost > 0 ? ` (-${cost} wood)` : ''}`,
                { duration: 2000 }
              );
            } else {
              toast.error(`${name}: Failed to build ${action.building}!`);
            }

            // Move to next action
            updateCommanderActionIndex(id, currentActionIndex + 1);
          }
        }
      });

      // If all commanders are done, move to debrief phase
      if (allComplete) {
        window.clearInterval(intervalId);
        toast.success('All commanders have finished executing their plans!');
        setTimeout(() => {
          setPhase('debrief');
        }, 1000);
      }
    };

    // Kick off execution loop
    const intervalId = window.setInterval(executeNextActions, 2000);
    executeNextActions();

    return () => {
      window.clearInterval(intervalId);
    };
  }, [
    phase,
    commanders,
    updateCommanderActionIndex,
    placeBuilding,
    deductWood,
    isTileOccupied,
    wood,
    setPhase,
  ]);

  return null;
};
