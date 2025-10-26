import { useEffect, useRef, useState } from 'react';
import { Application, Container, Graphics, Sprite, Texture, Text } from 'pixi.js';
import { useGameStore } from '../store/useGameStore';
import type { Building, BuildingType, Enemy } from '../store/useGameStore';
import {
  TILE_SIZE,
  GRID_SIZE,
  COLORS,
  Z_LAYERS,
  CAMERA_SETTINGS,
  BUILDING_CARDS,
  type BuildingQueueItem
} from '../constants/gameConstants';
import {
  sortCameraChildren,
  getBuildingKey,
  getStyleForType
} from '../utils/gameUtils';
import { getThemeStyles } from '../utils/themeStyles';

export const GameCanvas = () => {
  const canvasRef = useRef<HTMLDivElement>(null);
  const basePosition = useGameStore((state) => state.basePosition);
  const buildings = useGameStore((state) => state.buildings);
  const enemies = useGameStore((state) => state.enemies);
  const baseHealth = useGameStore((state) => state.baseHealth);
  const commanderThoughts = useGameStore((state) => state.commanderThoughts);
  const debriefPanelWidth = useGameStore((state) => state.debriefPanelWidth);
  const setResetZoom = useGameStore((state) => state.setResetZoom);
  const uiTheme = useGameStore((state) => state.uiTheme);
  const appRef = useRef<Application | null>(null);
  const cameraRef = useRef<Container | null>(null);
  const buildingGraphicsRef = useRef<Map<string, { display: Sprite; type: Building['type'] }>>(new Map());
  const buildingTextureCacheRef = useRef<Map<Building['type'], Texture>>(new Map());
  const tileTextureCacheRef = useRef<Map<string, Texture>>(new Map());
  const buildingsRef = useRef<Building[]>([]);
  const enemiesRef = useRef<Enemy[]>([]);
  const enemyGraphicsRef = useRef<Map<string, Container>>(new Map());
  const thoughtBubblesRef = useRef<Map<string, Container>>(new Map());
  const baseEmojiRef = useRef<Text | null>(null);
  const renderBuildingsRef = useRef<(() => void) | null>(null);
  const renderEnemiesRef = useRef<(() => void) | null>(null);
  const renderQueueRef = useRef<BuildingQueueItem[]>([]);
  const tickerHandlerRef = useRef<(() => void) | null>(null);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);

  // State for hover tooltips
  const [hoveredBuilding, setHoveredBuilding] = useState<{
    type: BuildingType;
    mouseX: number;
    mouseY: number;
  } | null>(null);

  const [hoveredEnemy, setHoveredEnemy] = useState<{
    label: string;
    mouseX: number;
    mouseY: number;
    target: string; // "→ Base" or "→ Decoy at [x,y]"
  } | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    let app: Application | null = null;
    let isInitialized = false;
    let camera: Container | null = null;
    let scale = 1;
    let cameraPosition = { x: 0, y: 0 };
    let defaultCameraX = 0;
    let defaultCameraY = 0;
    const buildingGraphicsMap = buildingGraphicsRef.current;
    const textureCache = buildingTextureCacheRef.current;
    const tileTextureCache = tileTextureCacheRef.current;
    let canvasElement: HTMLCanvasElement | null = null;
    let isDragging = false;
    let dragStart = { x: 0, y: 0 };

    // Event handlers (defined at useEffect scope so cleanup can access them)
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      if (!camera) return;
      const delta = e.deltaY > 0 ? CAMERA_SETTINGS.ZOOM_FACTOR.OUT : CAMERA_SETTINGS.ZOOM_FACTOR.IN;
      const newScale = Math.max(CAMERA_SETTINGS.MIN_ZOOM, Math.min(CAMERA_SETTINGS.MAX_ZOOM, scale * delta));
      
      if (newScale !== scale) {
        scale = newScale;
        camera.scale.set(scale);
      }
    };

    const handleMouseDown = (e: MouseEvent) => {
      isDragging = true;
      dragStart = { x: e.clientX - cameraPosition.x, y: e.clientY - cameraPosition.y };
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging && camera) {
        cameraPosition.x = e.clientX - dragStart.x;
        cameraPosition.y = e.clientY - dragStart.y;
        camera.x = cameraPosition.x;
        camera.y = cameraPosition.y;
      }
    };

    const handleMouseUp = () => {
      isDragging = false;
    };

    const handleMouseLeave = () => {
      isDragging = false;
    };

    // Initialize ResizeObserver to watch container dimensions
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;

        // Only proceed if container has non-zero dimensions
        if (width === 0 || height === 0) {
          console.log('[ResizeObserver] Container has zero dimensions, waiting...');
          return;
        }

        console.log(`[ResizeObserver] Container dimensions: ${width}x${height}`);

        // If app exists, resize it
        if (app && isInitialized) {
          console.log('[ResizeObserver] Resizing existing PixiJS renderer');
          app.renderer.resize(width, height);

          // Recenter camera after resize
          if (camera) {
            defaultCameraX = width / 2 - (GRID_SIZE * TILE_SIZE) / 2;
            defaultCameraY = height / 2 - (GRID_SIZE * TILE_SIZE) / 2;
            camera.x = defaultCameraX;
            camera.y = defaultCameraY;
            cameraPosition = { x: camera.x, y: camera.y };
          }
          return;
        }

        // Initialize PixiJS only once when container has valid dimensions
        if (!app && !isInitialized) {
          console.log('[ResizeObserver] Initializing PixiJS with dimensions:', width, height);
          initializePixiApp(width, height);
        }
      }
    });

    // Start observing the canvas container
    if (canvasRef.current) {
      resizeObserver.observe(canvasRef.current);
      resizeObserverRef.current = resizeObserver;
    }

    // Initialize PixiJS Application (called by ResizeObserver)
    const initializePixiApp = async (width: number, height: number) => {
      app = new Application();

      await app.init({
        width,
        height,
        backgroundColor: COLORS.BACKGROUND,
      });
      appRef.current = app;

      if (!canvasRef.current) return;

      canvasRef.current.appendChild(app.canvas);
      isInitialized = true;

      // Create main container for all game objects
      const world = new Container();
      app.stage.addChild(world);

      // Create camera container
      camera = new Container();
      camera.sortableChildren = true;
      world.addChild(camera);
      cameraRef.current = camera;

      const getTileTexture = (type: 'grass' | 'forest' | 'water' | 'base') => {
        if (tileTextureCache.has(type)) {
          return tileTextureCache.get(type)!;
        }

        const graphic = new Graphics();
        if (type === 'grass') {
          graphic
            .rect(0, 0, TILE_SIZE, TILE_SIZE)
            .fill({ color: COLORS.GRASS.FILL })
            .stroke({ width: 1, color: COLORS.GRASS.STROKE });
        } else if (type === 'forest') {
          graphic
            .rect(0, 0, TILE_SIZE, TILE_SIZE)
            .fill({ color: COLORS.FOREST.FILL })
            .stroke({ width: 1, color: COLORS.FOREST.STROKE });
        } else if (type === 'water') {
          graphic
            .rect(0, 0, TILE_SIZE, TILE_SIZE)
            .fill({ color: COLORS.WATER.FILL })
            .stroke({ width: 1, color: COLORS.WATER.STROKE });
        } else {
          graphic
            .rect(0, 0, TILE_SIZE * 2, TILE_SIZE * 2)
            .fill({ color: COLORS.BASE });
        }

        const texture = app!.renderer.generateTexture(graphic);
        tileTextureCache.set(type, texture);
        graphic.destroy();
        return texture;
      };

      const getBuildingTexture = (type: Building['type']) => {
        if (textureCache.has(type)) {
          return textureCache.get(type)!;
        }

        const { fill, stroke } = getStyleForType(type);
        const graphic = new Graphics();

        // Draw based on building type
        if (type === 'wall') {
          // Wall: 3 connected gray rectangles (96×32)
          for (let i = 0; i < 3; i++) {
            graphic
              .rect(i * TILE_SIZE, 0, TILE_SIZE, TILE_SIZE)
              .fill({ color: fill })
              .stroke({ width: 1, color: stroke });
          }
        } else if (type === 'farm') {
          // Farm: 2 stacked green rectangles (32×64)
          for (let i = 0; i < 2; i++) {
            graphic
              .rect(0, i * TILE_SIZE, TILE_SIZE, TILE_SIZE)
              .fill({ color: fill })
              .stroke({ width: 1, color: stroke });
          }
        } else {
          // Standard 1×1 buildings
          graphic
            .rect(0, 0, TILE_SIZE, TILE_SIZE)
            .fill({ color: fill })
            .stroke({ width: 1, color: stroke });
        }

        const texture = app!.renderer.generateTexture(graphic);
        textureCache.set(type, texture);
        graphic.destroy();
        return texture;
      };

      // Render tiles with different textures based on row
      for (let y = 0; y < GRID_SIZE; y++) {
        for (let x = 0; x < GRID_SIZE; x++) {
          // Determine tile type based on row
          let tileType: 'grass' | 'forest' | 'water';
          if (y < 3) {
            tileType = 'forest';
          } else if (y >= GRID_SIZE - 2) {
            tileType = 'water';
          } else {
            tileType = 'grass';
          }

          const texture = getTileTexture(tileType);
          const tile = new Sprite(texture);
          tile.position.set(x * TILE_SIZE, y * TILE_SIZE);
          tile.zIndex = Z_LAYERS.TILES;
          tile.roundPixels = true;
          tile.eventMode = 'none';
          tile.label = 'Tile';
          camera.addChild(tile);
        }
      }

      const baseTexture = getTileTexture('base');
      const base = new Sprite(baseTexture);
      base.position.set(basePosition.x * TILE_SIZE, basePosition.y * TILE_SIZE);
      base.zIndex = Z_LAYERS.BASE;
      base.roundPixels = true;
      base.eventMode = 'none';
      base.label = 'Base';
      camera.addChild(base);

      // Pre-generate all building textures
      const buildingTypes: Building['type'][] = ['wall', 'tower', 'decoy', 'mine', 'farm'];
      buildingTypes.forEach(type => {
        getBuildingTexture(type);
        console.log(`[Init] Pre-generated texture for ${type}`);
      });

      sortCameraChildren(camera);

      // Create ticker handler to process building queue
      const tickerHandler = () => {
        // Use the camera from closure, not ref
        if (!camera) {
          return;
        }

        const queue = renderQueueRef.current;
        if (queue.length === 0) return;

        console.log(`[Ticker] Processing ${queue.length} queued items`);
        const processed = { adds: 0, removes: 0 };

        // Process all queued operations
        while (queue.length > 0) {
          const item = queue.shift();
          if (!item) continue;

          if (item.action === 'add' && item.sprite) {
            // Add sprite to camera during ticker update
            camera.addChild(item.sprite);
            processed.adds++;
          } else if (item.action === 'remove' && item.sprite) {
            // Remove sprite from camera during ticker update
            if (item.sprite.parent) {
              item.sprite.parent.removeChild(item.sprite);
            }
            item.sprite.destroy();
            // The graphics map is now managed by the renderBuildings function
            processed.removes++;
          }
        }

        console.log(`[Ticker] Processed ${processed.adds} adds, ${processed.removes} removes. Camera now has ${camera.children.length} children`);

        // Sort children after processing queue
        sortCameraChildren(camera);
      };

      // Add ticker handler to app - IMPORTANT: ticker starts automatically
      if (app) {
        app.ticker.add(tickerHandler);
        tickerHandlerRef.current = tickerHandler;

        // Ensure ticker is running
        if (!app.ticker.started) {
          app.ticker.start();
        }
      } else {
        console.error("App is not initialized when trying to add ticker handler");
      }

      // Function to render buildings
      const renderBuildings = () => {
        if (!camera || !app) {
          console.warn('[RenderBuildings] Camera or app not available');
          return;
        }

        console.log(`[RenderBuildings] Processing ${buildingsRef.current.length} buildings`);
        const graphicsMap = buildingGraphicsRef.current;
        const activeKeys = new Set<string>();
        let queuedAdds = 0;
        let queuedRemoves = 0;

        buildingsRef.current.forEach((building) => {
          // Skip unrevealed buildings during blind execution
          if (!building.revealed) {
            return;
          }

          const [x, y] = building.position;
          const key = getBuildingKey(x, y);
          activeKeys.add(key);

          const existingEntry = graphicsMap.get(key);

          if (existingEntry && existingEntry.type !== building.type) {
            // Type changed, need to remove and recreate
            // Queue for removal
            renderQueueRef.current.push({
              action: 'remove',
              sprite: existingEntry.display,
              key: key
            });
            graphicsMap.delete(key);
          }

          if (!graphicsMap.has(key)) {
            // Use pre-cached texture
            const textureCache = buildingTextureCacheRef.current;
            const texture = textureCache.get(building.type);

            if (!texture) {
              console.error(`[RenderBuildings] No pre-cached texture for ${building.type}`);
              return;
            }

            console.log(`[RenderBuildings] Using pre-cached texture for ${building.type}`);

            // Create sprite from texture and position it
            const buildingSprite = new Sprite(texture);
            buildingSprite.position.set(x * TILE_SIZE, y * TILE_SIZE);
            buildingSprite.zIndex = Z_LAYERS.BUILDINGS;
            buildingSprite.roundPixels = true;
            buildingSprite.eventMode = 'static';
            buildingSprite.cursor = 'pointer';
            buildingSprite.label = `Building-${building.type}`;

            // Add hover event listeners
            buildingSprite.on('pointerenter', (event) => {
              setHoveredBuilding({
                type: building.type,
                mouseX: event.global.x,
                mouseY: event.global.y,
              });
            });

            buildingSprite.on('pointerleave', () => {
              setHoveredBuilding(null);
            });

            // Scale-in animation with bounce effect (easeOutBack)
            buildingSprite.scale.set(0); // Start invisible
            const startTime = Date.now();
            const duration = 400; // 400ms animation
            const c1 = 1.70158;
            const c3 = c1 + 1;

            const animate = () => {
              const elapsed = Date.now() - startTime;
              const progress = Math.min(elapsed / duration, 1);

              // easeOutBack formula (overshoot then settle)
              const eased = 1 + c3 * Math.pow(progress - 1, 3) + c1 * Math.pow(progress - 1, 2);

              buildingSprite.scale.set(eased);

              if (progress < 1) {
                requestAnimationFrame(animate);
              } else {
                buildingSprite.scale.set(1); // Ensure final scale is exactly 1
              }
            };

            animate();

            graphicsMap.set(key, { display: buildingSprite, type: building.type });

            // Queue the sprite to be added during ticker update
            renderQueueRef.current.push({
              action: 'add',
              sprite: buildingSprite,
              key: key
            });
            queuedAdds++;
          }
        });

        // Queue removal of buildings that are no longer in the state
        for (const [key, entry] of Array.from(graphicsMap.entries())) {
          if (!activeKeys.has(key)) {
            // Queue the sprite to be removed during ticker update
            renderQueueRef.current.push({
              action: 'remove',
              sprite: entry.display,
              key: key
            });
            // Remove from the map immediately after queueing for removal
            graphicsMap.delete(key);
            queuedRemoves++;
          }
        }

        console.log(`[RenderBuildings] Queued ${queuedAdds} adds, ${queuedRemoves} removes. Total in queue: ${renderQueueRef.current.length}`);

        // Don't sort here, let the ticker do it after processing queue
      };

      renderBuildingsRef.current = renderBuildings;

      // Function to render enemies
      const renderEnemies = () => {
        if (!camera || !app) {
          console.warn('[RenderEnemies] Camera or app not available');
          return;
        }

        console.log(`[RenderEnemies] Processing ${enemiesRef.current.length} enemies`);
        const enemyGraphics = enemyGraphicsRef.current;
        const activeIds = new Set<string>();
        let queuedAdds = 0;
        let queuedRemoves = 0;

        enemiesRef.current.forEach((enemy) => {
          activeIds.add(enemy.id);

          if (!enemyGraphics.has(enemy.id)) {
            // Create enemy container
            const enemyContainer = new Container();

            // Create enemy body (red circle)
            const enemyBody = new Graphics();
            enemyBody
              .circle(TILE_SIZE / 2, TILE_SIZE / 2, TILE_SIZE * 0.35)
              .fill({ color: enemy.markedForDeath ? 0x800000 : 0xFF0000 });

            // Add health indicator if damaged
            if (enemy.markedForDeath) {
              const skull = new Text({
                text: '💀',
                style: { fontSize: 14 }
              });
              skull.anchor.set(0.5);
              skull.position.set(TILE_SIZE / 2, TILE_SIZE / 2);
              enemyContainer.addChild(skull);
            }

            enemyContainer.addChild(enemyBody);
            enemyContainer.position.set(enemy.position[0] * TILE_SIZE, enemy.position[1] * TILE_SIZE);
            enemyContainer.zIndex = Z_LAYERS.ENEMIES;
            enemyContainer.label = `Enemy-${enemy.id}`;
            enemyContainer.eventMode = 'static';
            enemyContainer.cursor = 'pointer';

            // Initialize target position tracking for smooth animation
            (enemyContainer as any)._targetX = enemy.position[0] * TILE_SIZE;
            (enemyContainer as any)._targetY = enemy.position[1] * TILE_SIZE;

            // Add hover event listeners
            enemyContainer.on('pointerenter', (event) => {
              // Determine target display text
              const targetText = enemy.isDistracted
                ? `→ Decoy at [${enemy.targetPosition[0]}, ${enemy.targetPosition[1]}]`
                : '→ Base';

              setHoveredEnemy({
                label: enemy.label,
                mouseX: event.global.x,
                mouseY: event.global.y,
                target: targetText,
              });
            });

            enemyContainer.on('pointerleave', () => {
              setHoveredEnemy(null);
            });

            // Queue the container to be added during ticker update
            renderQueueRef.current.push({
              action: 'add',
              sprite: enemyContainer,
              key: enemy.id
            });
            enemyGraphics.set(enemy.id, enemyContainer);
            queuedAdds++;
          } else {
            // Update existing enemy position with smooth animation
            const container = enemyGraphics.get(enemy.id)!;
            const newX = enemy.position[0] * TILE_SIZE;
            const newY = enemy.position[1] * TILE_SIZE;

            // Check if position has changed (use custom property to track)
            const prevX = (container as any)._targetX ?? container.position.x;
            const prevY = (container as any)._targetY ?? container.position.y;

            if (prevX !== newX || prevY !== newY) {
              // Position changed, animate the movement
              const startX = container.position.x;
              const startY = container.position.y;
              const startTime = Date.now();
              const duration = 250; // 250ms smooth slide

              const animate = () => {
                const elapsed = Date.now() - startTime;
                const progress = Math.min(elapsed / duration, 1);

                // Linear interpolation
                container.position.x = startX + (newX - startX) * progress;
                container.position.y = startY + (newY - startY) * progress;

                if (progress < 1) {
                  requestAnimationFrame(animate);
                }
              };

              animate();

              // Store target position for next frame
              (container as any)._targetX = newX;
              (container as any)._targetY = newY;
            }

            // Update appearance if marked for death
            if (enemy.markedForDeath && container.children.length < 3) {
              const skull = new Text({
                text: '💀',
                style: { fontSize: 14 }
              });
              skull.anchor.set(0.5);
              skull.position.set(TILE_SIZE / 2, TILE_SIZE / 2);
              container.addChild(skull);
            }
          }
        });

        // Queue removal of enemies that no longer exist
        enemyGraphics.forEach((container, id) => {
          if (!activeIds.has(id)) {
            // Queue the container to be removed during ticker update
            renderQueueRef.current.push({
              action: 'remove',
              sprite: container,
              key: id
            });
            enemyGraphics.delete(id);
            queuedRemoves++;
          }
        });

        console.log(`[RenderEnemies] Queued ${queuedAdds} adds, ${queuedRemoves} removes. Total in queue: ${renderQueueRef.current.length}`);

        // Don't sort here, let the ticker do it after processing queue
      };

      renderEnemiesRef.current = renderEnemies;

      // Add base health emoji
      const addBaseHealthEmoji = () => {
        if (!camera || !app) return;

        const getBaseEmoji = () => {
          const health = useGameStore.getState().baseHealth;
          if (health === 3) return '😊';
          if (health === 2) return '😬';
          if (health === 1) return '😱';
          return '💀';
        };

        const emojiText = new Text({
          text: getBaseEmoji(),
          style: { fontSize: 24 }
        });
        emojiText.anchor.set(0.5);
        emojiText.position.set(
          basePosition.x * TILE_SIZE + TILE_SIZE,
          basePosition.y * TILE_SIZE - 10
        );
        emojiText.zIndex = Z_LAYERS.ENEMIES;
        emojiText.label = 'BaseEmoji';
        baseEmojiRef.current = emojiText;
        camera.addChild(emojiText);
      };

      addBaseHealthEmoji();

      renderBuildingsRef.current = renderBuildings;
      // Run an initial sync now that Pixi is ready
      const currentBuildings = useGameStore.getState().buildings;
      buildingsRef.current = [...currentBuildings];
      renderBuildings();

      const currentEnemies = useGameStore.getState().enemies;
      enemiesRef.current = [...currentEnemies];
      renderEnemies();

      // Center camera on the grid
      defaultCameraX = app.screen.width / 2 - (GRID_SIZE * TILE_SIZE) / 2;
      defaultCameraY = app.screen.height / 2 - (GRID_SIZE * TILE_SIZE) / 2;
      camera.x = defaultCameraX;
      camera.y = defaultCameraY;
      cameraPosition = { x: camera.x, y: camera.y };

      // Attach event listeners
      canvasElement = app.canvas;
      canvasElement.addEventListener('wheel', handleWheel);
      canvasElement.addEventListener('mousedown', handleMouseDown);
      canvasElement.addEventListener('mousemove', handleMouseMove);
      canvasElement.addEventListener('mouseup', handleMouseUp);
      canvasElement.addEventListener('mouseleave', handleMouseLeave);

      // Reset zoom function - exposed to store
      const resetZoom = () => {
        if (camera) {
          scale = 1;
          camera.scale.set(scale);
          camera.x = defaultCameraX;
          camera.y = defaultCameraY;
          cameraPosition = { x: camera.x, y: camera.y };
        }
      };

      // Expose reset function to store
      setResetZoom(resetZoom);
    };

    // Cleanup on unmount
    return () => {
      setResetZoom(null);

      // Disconnect ResizeObserver
      if (resizeObserverRef.current) {
        resizeObserverRef.current.disconnect();
        resizeObserverRef.current = null;
      }

      // Remove ticker handler if it exists (before nulling appRef)
      if (appRef.current && tickerHandlerRef.current) {
        appRef.current.ticker.remove(tickerHandlerRef.current);
        tickerHandlerRef.current = null;
      }

      cameraRef.current = null;
      appRef.current = null;
      baseEmojiRef.current = null;

      if (canvasElement) {
        canvasElement.removeEventListener('wheel', handleWheel);
        canvasElement.removeEventListener('mousedown', handleMouseDown);
        canvasElement.removeEventListener('mousemove', handleMouseMove);
        canvasElement.removeEventListener('mouseup', handleMouseUp);
        canvasElement.removeEventListener('mouseleave', handleMouseLeave);
      }

      // Clear any pending queue items
      renderQueueRef.current = [];

      buildingGraphicsMap.forEach(({ display }) => {
        display.destroy();
      });
      buildingGraphicsMap.clear();
      textureCache.forEach((texture) => texture.destroy(true));
      textureCache.clear();
      tileTextureCache.forEach((texture) => texture.destroy(true));
      tileTextureCache.clear();

      if (app && isInitialized) {
        try {
          app.destroy(true, { children: true });
        } catch (error) {
          console.error('Error destroying PixiJS app:', error);
        }
      }
    };
  }, [basePosition, setResetZoom]);

  // Handle building changes
  useEffect(() => {
    console.log(`[BuildingSync] useEffect triggered - ${buildings.length} buildings in state`);

    if (!renderBuildingsRef.current) {
      console.warn('[BuildingSync] renderBuildingsRef not ready yet');
      return;
    }

    // React's useEffect already handles dependency comparison correctly
    // It will only run when the buildings array reference changes (which Zustand ensures)
    const previousCount = buildingsRef.current.length;
    buildingsRef.current = [...buildings]; // Store a copy, not the reference
    console.log(`[BuildingSync] Updating from ${previousCount} to ${buildings.length} buildings`);
    renderBuildingsRef.current();
  }, [buildings]);

  // Handle enemy changes
  useEffect(() => {
    if (!renderEnemiesRef.current) {
      return;
    }

    enemiesRef.current = [...enemies];
    renderEnemiesRef.current();
  }, [enemies]);

  // Handle base health changes - update emoji
  useEffect(() => {
    const emojiText = baseEmojiRef.current;
    if (!emojiText) return;

    const getBaseEmoji = () => {
      if (baseHealth === 3) return '😊';
      if (baseHealth === 2) return '😬';
      if (baseHealth === 1) return '😱';
      return '💀';
    };

    emojiText.text = getBaseEmoji();
  }, [baseHealth]);

  const theme = getThemeStyles(uiTheme);

  return (
    <>
      <div
        ref={canvasRef}
        className="w-full h-full transition-all duration-300"
        style={{ paddingLeft: `${debriefPanelWidth}px` }}
      />

      {/* Building Hover Tooltip */}
      {hoveredBuilding && (
        <div
          className={`fixed w-80 p-4 rounded-lg ${theme.cardBackground} ${theme.cardBorder} shadow-xl z-50 pointer-events-none`}
          style={{
            left: `${hoveredBuilding.mouseX + 20}px`,
            top: `${hoveredBuilding.mouseY + 20}px`,
          }}
        >
          <div className="text-xs font-bold mb-2 text-center text-gray-400">
            💬 Commander Reviews: {BUILDING_CARDS[hoveredBuilding.type].icon} {hoveredBuilding.type}
          </div>
          <div className="space-y-2">
            {/* Larry's Quote */}
            <div className="flex items-start gap-2">
              <div className="w-6 h-6 rounded-full bg-gray-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                L
              </div>
              <p className={`text-xs italic ${theme.bodyText}`}>
                "{BUILDING_CARDS[hoveredBuilding.type].commanderQuotes.larry}"
              </p>
            </div>

            {/* Paul's Quote */}
            <div className="flex items-start gap-2">
              <div className="w-6 h-6 rounded-full bg-red-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                P
              </div>
              <p className={`text-xs italic ${theme.bodyText}`}>
                "{BUILDING_CARDS[hoveredBuilding.type].commanderQuotes.paul}"
              </p>
            </div>

            {/* Olivia's Quote */}
            <div className="flex items-start gap-2">
              <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                O
              </div>
              <p className={`text-xs italic ${theme.bodyText}`}>
                "{BUILDING_CARDS[hoveredBuilding.type].commanderQuotes.olivia}"
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Enemy Hover Tooltip */}
      {hoveredEnemy && (
        <div
          className={`fixed px-4 py-2 rounded-lg ${theme.cardBackground} ${theme.cardBorder} shadow-xl z-50 pointer-events-none`}
          style={{
            left: `${hoveredEnemy.mouseX + 20}px`,
            top: `${hoveredEnemy.mouseY + 20}px`,
          }}
        >
          <div className="flex items-center gap-2">
            <span className="text-lg">👹</span>
            <div className="flex flex-col">
              <p className={`text-sm font-semibold ${theme.bodyText}`}>
                {hoveredEnemy.label}
              </p>
              <p className={`text-xs ${theme.mutedText}`}>
                {hoveredEnemy.target}
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
