import { useState, useRef, useEffect } from 'react';
import { useGameStore } from '../store/useGameStore';
import { updateConcurrencyLimit } from '../services/llmService';
import type { BuildingType } from '../store/useGameStore';
import toast from 'react-hot-toast';

export const DebugMenu = () => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Use separate selectors to avoid infinite loop
  const apiKey = useGameStore((state) => state.apiKey);
  const setApiKey = useGameStore((state) => state.setApiKey);
  const concurrencyLimit = useGameStore((state) => state.concurrencyLimit);
  const setConcurrencyLimit = useGameStore((state) => state.setConcurrencyLimit);
  const commanders = useGameStore((state) => state.commanders);
  const updateCommanderName = useGameStore((state) => state.updateCommanderName);
  const updateCommanderColor = useGameStore((state) => state.updateCommanderColor);
  const placeBuilding = useGameStore((state) => state.placeBuilding);
  const placeDebugBuilding = useGameStore((state) => state.placeDebugBuilding);
  const buildings = useGameStore((state) => state.buildings);
  const removeBuilding = useGameStore((state) => state.removeBuilding);

  const [localApiKey, setLocalApiKey] = useState(apiKey || '');
  const [localConcurrency, setLocalConcurrency] = useState(concurrencyLimit);

  // Building placement state
  const [buildingType, setBuildingType] = useState<BuildingType>('wall');
  const [buildingOwner, setBuildingOwner] = useState('larry');
  const [buildingX, setBuildingX] = useState(0);
  const [buildingY, setBuildingY] = useState(0);
  const [debugMode, setDebugMode] = useState(true);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleApiKeyChange = (value: string) => {
    setLocalApiKey(value);
    setApiKey(value);
  };

  const handleConcurrencyChange = (value: number) => {
    const clamped = Math.max(1, Math.min(10, value));
    setLocalConcurrency(clamped);
    setConcurrencyLimit(clamped);
    updateConcurrencyLimit(clamped); // Update the LLM service
  };

  const handlePlaceBuilding = () => {
    // Validate coordinates
    if (buildingX < 0 || buildingX > 25 || buildingY < 0 || buildingY > 25) {
      toast.error('Coordinates must be between 0 and 25');
      return;
    }

    const building = {
      position: [buildingX, buildingY] as [number, number],
      type: buildingType,
      ownerId: buildingOwner,
      revealed: true, // Debug buildings are always revealed
    };

    const success = debugMode ? placeDebugBuilding(building) : placeBuilding(building);

    if (success) {
      toast.success(`${buildingType} placed at (${buildingX}, ${buildingY})`);
    } else {
      toast.error('Failed to place building (tile occupied or insufficient resources)');
    }
  };

  const handleRemoveBuilding = (x: number, y: number) => {
    const success = removeBuilding(x, y);
    if (success) {
      toast.success(`Building removed from (${x}, ${y})`);
    } else {
      toast.error('No building found at that location');
    }
  };

  return (
    <div ref={menuRef} className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="font-medium transition-colors px-3 py-1 rounded text-sm"
        style={{
          backgroundColor: isOpen ? '#4B5563' : '#374151',
          color: '#ffffff',
        }}
        onMouseEnter={(e) => {
          if (!isOpen) e.currentTarget.style.backgroundColor = '#4B5563';
        }}
        onMouseLeave={(e) => {
          if (!isOpen) e.currentTarget.style.backgroundColor = '#374151';
        }}
      >
        ⚙️ Debug
      </button>

      {isOpen && (
        <div
          className="absolute mt-2 rounded-lg shadow-xl p-4 z-50"
          style={{
            backgroundColor: '#ffffff',
            width: '400px',
            maxHeight: '600px',
            overflowY: 'auto',
            border: '1px solid #e5e7eb',
            right: 0,
          }}
        >
          <h3 className="font-bold mb-4" style={{ color: '#1a1a1a', fontSize: '16px' }}>
            🛠️ Debug Settings
          </h3>

          {/* API Key Section */}
          <div className="mb-4 pb-4" style={{ borderBottom: '1px solid #e5e7eb' }}>
            <label className="block font-semibold mb-2 text-sm" style={{ color: '#1a1a1a' }}>
              Gemini API Key
            </label>
            <input
              type="password"
              value={localApiKey}
              onChange={(e) => handleApiKeyChange(e.target.value)}
              placeholder="AIza..."
              className="w-full rounded px-3 py-2 text-sm"
              style={{
                backgroundColor: '#f5f5f5',
                color: '#1a1a1a',
                border: '1px solid #d1d5db',
              }}
            />
            <p className="text-xs mt-1" style={{ color: '#6b7280' }}>
              {apiKey ? '✓ Key set' : 'No key set (using fallbacks)'}
            </p>
          </div>

          {/* Concurrency Limit Section */}
          <div className="mb-4 pb-4" style={{ borderBottom: '1px solid #e5e7eb' }}>
            <label className="block font-semibold mb-2 text-sm" style={{ color: '#1a1a1a' }}>
              Concurrency Limit (p-limit)
            </label>
            <input
              type="number"
              min="1"
              max="10"
              value={localConcurrency}
              onChange={(e) => handleConcurrencyChange(parseInt(e.target.value) || 1)}
              className="w-full rounded px-3 py-2 text-sm"
              style={{
                backgroundColor: '#f5f5f5',
                color: '#1a1a1a',
                border: '1px solid #d1d5db',
              }}
            />
            <p className="text-xs mt-1" style={{ color: '#6b7280' }}>
              Max simultaneous LLM calls (1-10)
            </p>
          </div>

          {/* Commanders Section */}
          <div className="mb-4 pb-4" style={{ borderBottom: '1px solid #e5e7eb' }}>
            <h4 className="font-semibold mb-3 text-sm" style={{ color: '#1a1a1a' }}>
              Commander Settings
            </h4>
            {commanders.map((commander) => (
              <div
                key={commander.id}
                className="mb-3 p-3 rounded"
                style={{ backgroundColor: '#f9fafb', border: '1px solid #e5e7eb' }}
              >
                <div className="mb-2">
                  <label className="block text-xs font-semibold mb-1" style={{ color: '#4b5563' }}>
                    Name
                  </label>
                  <input
                    type="text"
                    value={commander.name}
                    onChange={(e) => updateCommanderName(commander.id, e.target.value)}
                    className="w-full rounded px-2 py-1 text-sm"
                    style={{
                      backgroundColor: '#ffffff',
                      color: '#1a1a1a',
                      border: '1px solid #d1d5db',
                    }}
                  />
                </div>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <label className="block text-xs font-semibold mb-1" style={{ color: '#4b5563' }}>
                      Background Color
                    </label>
                    <input
                      type="color"
                      value={commander.colors.bg}
                      onChange={(e) =>
                        updateCommanderColor(commander.id, {
                          ...commander.colors,
                          bg: e.target.value,
                        })
                      }
                      className="w-full rounded"
                      style={{ height: '32px' }}
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs font-semibold mb-1" style={{ color: '#4b5563' }}>
                      Border Color
                    </label>
                    <input
                      type="color"
                      value={commander.colors.border}
                      onChange={(e) =>
                        updateCommanderColor(commander.id, {
                          ...commander.colors,
                          border: e.target.value,
                        })
                      }
                      className="w-full rounded"
                      style={{ height: '32px' }}
                    />
                  </div>
                </div>
                <p className="text-xs mt-1" style={{ color: '#6b7280' }}>
                  Personality: {commander.personality}
                </p>
              </div>
            ))}
          </div>

          {/* Building Placement Section */}
          <div className="mb-4 pb-4" style={{ borderBottom: '1px solid #e5e7eb' }}>
            <h4 className="font-semibold mb-3 text-sm" style={{ color: '#1a1a1a' }}>
              Building Placement
            </h4>

            <div className="mb-3">
              <label className="block text-xs font-semibold mb-1" style={{ color: '#4b5563' }}>
                Building Type
              </label>
              <select
                value={buildingType}
                onChange={(e) => setBuildingType(e.target.value as BuildingType)}
                className="w-full rounded px-2 py-1 text-sm"
                style={{
                  backgroundColor: '#ffffff',
                  color: '#1a1a1a',
                  border: '1px solid #d1d5db',
                }}
              >
                <option value="wall">Wall (Gray)</option>
                <option value="tower">Tower (Blue)</option>
                <option value="welcome-sign">Welcome Sign (Yellow)</option>
              </select>
            </div>

            <div className="mb-3">
              <label className="block text-xs font-semibold mb-1" style={{ color: '#4b5563' }}>
                Owner
              </label>
              <select
                value={buildingOwner}
                onChange={(e) => setBuildingOwner(e.target.value)}
                className="w-full rounded px-2 py-1 text-sm"
                style={{
                  backgroundColor: '#ffffff',
                  color: '#1a1a1a',
                  border: '1px solid #d1d5db',
                }}
              >
                {commanders.map((commander) => (
                  <option key={commander.id} value={commander.id}>
                    {commander.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex gap-2 mb-3">
              <div className="flex-1">
                <label className="block text-xs font-semibold mb-1" style={{ color: '#4b5563' }}>
                  X (0-25)
                </label>
                <input
                  type="number"
                  min="0"
                  max="25"
                  value={buildingX}
                  onChange={(e) => setBuildingX(parseInt(e.target.value) || 0)}
                  className="w-full rounded px-2 py-1 text-sm"
                  style={{
                    backgroundColor: '#ffffff',
                    color: '#1a1a1a',
                    border: '1px solid #d1d5db',
                  }}
                />
              </div>
              <div className="flex-1">
                <label className="block text-xs font-semibold mb-1" style={{ color: '#4b5563' }}>
                  Y (0-25)
                </label>
                <input
                  type="number"
                  min="0"
                  max="25"
                  value={buildingY}
                  onChange={(e) => setBuildingY(parseInt(e.target.value) || 0)}
                  className="w-full rounded px-2 py-1 text-sm"
                  style={{
                    backgroundColor: '#ffffff',
                    color: '#1a1a1a',
                    border: '1px solid #d1d5db',
                  }}
                />
              </div>
            </div>

            <div className="mb-3 flex items-center gap-2">
              <input
                type="checkbox"
                id="debug-mode"
                checked={debugMode}
                onChange={(e) => setDebugMode(e.target.checked)}
                className="rounded"
              />
              <label htmlFor="debug-mode" className="text-xs" style={{ color: '#4b5563' }}>
                Debug Mode (bypass occupancy checks)
              </label>
            </div>

            <button
              onClick={handlePlaceBuilding}
              className="w-full rounded px-3 py-2 text-sm font-semibold"
              style={{
                backgroundColor: '#3b82f6',
                color: '#ffffff',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#2563eb';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#3b82f6';
              }}
            >
              Place Building
            </button>
          </div>

          {/* Current Buildings List */}
          <div>
            <h4 className="font-semibold mb-3 text-sm" style={{ color: '#1a1a1a' }}>
              Current Buildings ({buildings.length})
            </h4>
            <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
              {buildings.length === 0 ? (
                <p className="text-xs" style={{ color: '#6b7280' }}>
                  No buildings placed
                </p>
              ) : (
                buildings.map((building, index) => (
                  <div
                    key={index}
                    className="mb-2 p-2 rounded flex justify-between items-center"
                    style={{ backgroundColor: '#f9fafb', border: '1px solid #e5e7eb' }}
                  >
                    <div className="text-xs" style={{ color: '#1a1a1a' }}>
                      <span className="font-semibold">{building.type}</span> at ({building.position[0]}, {building.position[1]})
                      <br />
                      <span style={{ color: '#6b7280' }}>
                        Owner: {commanders.find(c => c.id === building.ownerId)?.name || building.ownerId}
                      </span>
                    </div>
                    <button
                      onClick={() => handleRemoveBuilding(building.position[0], building.position[1])}
                      className="px-2 py-1 rounded text-xs font-semibold"
                      style={{
                        backgroundColor: '#ef4444',
                        color: '#ffffff',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#dc2626';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = '#ef4444';
                      }}
                    >
                      Remove
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
