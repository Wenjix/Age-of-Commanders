import { useEffect, useRef } from 'react';
import { Application, Container, Graphics } from 'pixi.js';
import { useGameStore } from '../store/useGameStore';

const TILE_SIZE = 32;
const GRID_SIZE = 26;

export const GameCanvas = () => {
  const canvasRef = useRef<HTMLDivElement>(null);
  const basePosition = useGameStore((state) => state.basePosition);
  const setResetZoom = useGameStore((state) => state.setResetZoom);

  useEffect(() => {
    if (!canvasRef.current) return;

    let app: Application | null = null;
    let isInitialized = false;

    // Initialize PixiJS Application
    (async () => {
      app = new Application();
      
      await app.init({
        width: window.innerWidth,
        height: window.innerHeight - 40, // Subtract top bar height
        backgroundColor: 0x1a1a1a,
        resizeTo: canvasRef.current!,
      });

      if (!canvasRef.current) return;
      
      canvasRef.current.appendChild(app.canvas);
      isInitialized = true;

      // Create main container for all game objects
      const world = new Container();
      app.stage.addChild(world);

      // Create camera container
      const camera = new Container();
      world.addChild(camera);

      // Camera state
      let scale = 1;
      let isDragging = false;
      let dragStart = { x: 0, y: 0 };
      let cameraPosition = { x: 0, y: 0 };

      // Draw grid of grass tiles
      for (let y = 0; y < GRID_SIZE; y++) {
        for (let x = 0; x < GRID_SIZE; x++) {
          const tile = new Graphics();
          tile.rect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
          tile.fill(0x228b22); // Green
          tile.stroke({ width: 1, color: 0x1a5a1a }); // Dark green border
          camera.addChild(tile);
        }
      }

      // Draw base building at center (2x2 tiles)
      const base = new Graphics();
      base.rect(
        basePosition.x * TILE_SIZE,
        basePosition.y * TILE_SIZE,
        TILE_SIZE * 2,
        TILE_SIZE * 2
      );
      base.fill(0xff0000); // Red
      camera.addChild(base);

      // Center camera on the grid
      const defaultCameraX = app.screen.width / 2 - (GRID_SIZE * TILE_SIZE) / 2;
      const defaultCameraY = app.screen.height / 2 - (GRID_SIZE * TILE_SIZE) / 2;
      camera.x = defaultCameraX;
      camera.y = defaultCameraY;
      cameraPosition = { x: camera.x, y: camera.y };

      // Reset zoom function
      const resetZoom = () => {
        scale = 1;
        camera.scale.set(scale);
        camera.x = defaultCameraX;
        camera.y = defaultCameraY;
        cameraPosition = { x: camera.x, y: camera.y };
      };

      // Expose reset function to store
      setResetZoom(resetZoom);

      // Mouse wheel zoom
      const handleWheel = (e: WheelEvent) => {
        e.preventDefault();
        const delta = e.deltaY > 0 ? 0.9 : 1.1;
        const newScale = Math.max(0.5, Math.min(2, scale * delta));
        
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
        if (isDragging) {
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

    // Cleanup on unmount
    return () => {
      setResetZoom(null);
      if (app && isInitialized) {
        try {
          app.destroy(true, { children: true });
        } catch (error) {
          console.error('Error destroying PixiJS app:', error);
        }
      }
    };
  }, [basePosition, setResetZoom]);

  return <div ref={canvasRef} className="w-full h-full" />;
};

