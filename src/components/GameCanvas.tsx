import { useEffect, useRef } from 'react';
import { Application, Container, Graphics, Sprite, Texture } from 'pixi.js';
import { useGameStore } from '../store/useGameStore';
import type { Building } from '../store/useGameStore';
import {
  TILE_SIZE,
  GRID_SIZE,
  TOP_BAR_HEIGHT,
  COLORS,
  Z_LAYERS,
  CAMERA_SETTINGS,
  type BuildingQueueItem
} from '../constants/gameConstants';
import {
  sortCameraChildren,
  getBuildingKey,
  getStyleForType
} from '../utils/gameUtils';

export const GameCanvas = () => {
  const canvasRef = useRef<HTMLDivElement>(null);
  const basePosition = useGameStore((state) => state.basePosition);
  const buildings = useGameStore((state) => state.buildings);
  const setResetZoom = useGameStore((state) => state.setResetZoom);
  const appRef = useRef<Application | null>(null);
  const cameraRef = useRef<Container | null>(null);
  const buildingGraphicsRef = useRef<Map<string, { display: Sprite; type: Building['type'] }>>(new Map());
  const buildingTextureCacheRef = useRef<Map<Building['type'], Texture>>(new Map());
  const tileTextureCacheRef = useRef<Map<string, Texture>>(new Map());
  const buildingsRef = useRef<Building[]>([]);
  const renderBuildingsRef = useRef<(() => void) | null>(null);
  const buildingQueueRef = useRef<BuildingQueueItem[]>([]);
  const tickerHandlerRef = useRef<(() => void) | null>(null);

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

    // Initialize PixiJS Application
    (async () => {
      app = new Application();
      
      await app.init({
        width: window.innerWidth,
        height: window.innerHeight - TOP_BAR_HEIGHT,
        backgroundColor: COLORS.BACKGROUND,
        resizeTo: canvasRef.current!,
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

      // Camera state
      let isDragging = false;
      let dragStart = { x: 0, y: 0 };

      const getTileTexture = (type: 'grass' | 'base') => {
        if (tileTextureCache.has(type)) {
          return tileTextureCache.get(type)!;
        }

        const graphic = new Graphics();
        if (type === 'grass') {
          graphic
            .rect(0, 0, TILE_SIZE, TILE_SIZE)
            .fill({ color: COLORS.GRASS.FILL })
            .stroke({ width: 1, color: COLORS.GRASS.STROKE });
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

      const grassTexture = getTileTexture('grass');
      for (let y = 0; y < GRID_SIZE; y++) {
        for (let x = 0; x < GRID_SIZE; x++) {
          const tile = new Sprite(grassTexture);
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

      sortCameraChildren(camera);

      // Create ticker handler to process building queue
      const tickerHandler = () => {
        // Use the camera from closure, not ref
        if (!camera) {
          return;
        }

        const queue = buildingQueueRef.current;
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
          const [x, y] = building.position;
          const key = getBuildingKey(x, y);
          activeKeys.add(key);

          const existingEntry = graphicsMap.get(key);

          if (existingEntry && existingEntry.type !== building.type) {
            // Type changed, need to remove and recreate
            // Queue for removal
            buildingQueueRef.current.push({
              action: 'remove',
              sprite: existingEntry.display,
              key: key
            });
            graphicsMap.delete(key);
          }

          if (!graphicsMap.has(key)) {
            const { fill, stroke } = getStyleForType(building.type);

            // Create texture if not cached
            const textureCache = buildingTextureCacheRef.current;
            let texture = textureCache.get(building.type);
            if (!texture && app) {
              const graphic = new Graphics();
              graphic
                .rect(0, 0, TILE_SIZE, TILE_SIZE)
                .fill({ color: fill })
                .stroke({ width: 1, color: stroke });

              texture = app.renderer.generateTexture(graphic);
              textureCache.set(building.type, texture);
              console.log(`[RenderBuildings] Created new texture for ${building.type}`);
              graphic.destroy();
            } else if (texture) {
              console.log(`[RenderBuildings] Using cached texture for ${building.type}`);
            }

            if (!texture) {
              console.error(`[renderBuildings] Failed to create texture for ${building.type}`);
              return;
            }

            // Create sprite from texture and position it
            const buildingSprite = new Sprite(texture);
            buildingSprite.position.set(x * TILE_SIZE, y * TILE_SIZE);
            buildingSprite.zIndex = Z_LAYERS.BUILDINGS;
            buildingSprite.roundPixels = true;
            buildingSprite.eventMode = 'none';
            buildingSprite.label = `Building-${building.type}`;

            graphicsMap.set(key, { display: buildingSprite, type: building.type });

            // Queue the sprite to be added during ticker update
            buildingQueueRef.current.push({
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
            buildingQueueRef.current.push({
              action: 'remove',
              sprite: entry.display,
              key: key
            });
            // Remove from the map immediately after queueing for removal
            graphicsMap.delete(key);
            queuedRemoves++;
          }
        }

        console.log(`[RenderBuildings] Queued ${queuedAdds} adds, ${queuedRemoves} removes. Total in queue: ${buildingQueueRef.current.length}`);

        // Don't sort here, let the ticker do it after processing queue
      };

      renderBuildingsRef.current = renderBuildings;

      // Don't render buildings here - let the effect handle it
      // This prevents double initialization
      buildingsRef.current = [];

      // Center camera on the grid
      defaultCameraX = app.screen.width / 2 - (GRID_SIZE * TILE_SIZE) / 2;
      defaultCameraY = app.screen.height / 2 - (GRID_SIZE * TILE_SIZE) / 2;
      camera.x = defaultCameraX;
      camera.y = defaultCameraY;
      cameraPosition = { x: camera.x, y: camera.y };

      // Mouse wheel zoom
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
      app.canvas.addEventListener('wheel', handleWheel);

      // Mouse drag to pan
      const handleMouseDown = (e: MouseEvent) => {
        isDragging = true;
        dragStart = { x: e.clientX - cameraPosition.x, y: e.clientY - cameraPosition.y };
      };
      app.canvas.addEventListener('mousedown', handleMouseDown);

      const handleMouseMove = (e: MouseEvent) => {
        if (isDragging && camera) {
          cameraPosition.x = e.clientX - dragStart.x;
          cameraPosition.y = e.clientY - dragStart.y;
          camera.x = cameraPosition.x;
          camera.y = cameraPosition.y;
        }
      };
      app.canvas.addEventListener('mousemove', handleMouseMove);

      const handleMouseUp = () => {
        isDragging = false;
      };
      app.canvas.addEventListener('mouseup', handleMouseUp);

      const handleMouseLeave = () => {
        isDragging = false;
      };
      app.canvas.addEventListener('mouseleave', handleMouseLeave);
    })();

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

    // Expose reset function to store immediately
    setResetZoom(resetZoom);

    // Cleanup on unmount
    return () => {
      setResetZoom(null);

      // Remove ticker handler if it exists (before nulling appRef)
      if (appRef.current && tickerHandlerRef.current) {
        appRef.current.ticker.remove(tickerHandlerRef.current);
        tickerHandlerRef.current = null;
      }

      cameraRef.current = null;
      appRef.current = null;

      // Clear any pending queue items
      buildingQueueRef.current = [];

      buildingGraphicsMap.forEach(({ display }) => {
        display.destroy();
      });
      buildingGraphicsMap.clear();
      textureCache.forEach((texture) => texture.destroy(true));
      textureCache.clear();

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

  return <div ref={canvasRef} className="w-full h-full" />;
};
