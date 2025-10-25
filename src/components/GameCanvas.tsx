import { useEffect, useRef } from 'react';
import { Application, Container, Graphics } from 'pixi.js';
import { useGameStore } from '../store/useGameStore';

const TILE_SIZE = 32;
const GRID_SIZE = 20;

export const GameCanvas = () => {
  const canvasRef = useRef<HTMLDivElement>(null);
  const appRef = useRef<Application | null>(null);
  const basePosition = useGameStore((state) => state.basePosition);

  useEffect(() => {
    if (!canvasRef.current) return;

    // Initialize PixiJS Application
    const app = new Application();
    appRef.current = app;

    (async () => {
      await app.init({
        width: window.innerWidth,
        height: window.innerHeight - 40, // Subtract top bar height
        backgroundColor: 0x1a1a1a,
        resizeTo: canvasRef.current!,
      });

      canvasRef.current!.appendChild(app.canvas);

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

      // Draw base building at center
      const base = new Graphics();
      base.rect(
        basePosition.x * TILE_SIZE,
        basePosition.y * TILE_SIZE,
        TILE_SIZE,
        TILE_SIZE
      );
      base.fill(0xff0000); // Red
      camera.addChild(base);

      // Center camera on the grid
      camera.x = app.screen.width / 2 - (GRID_SIZE * TILE_SIZE) / 2;
      camera.y = app.screen.height / 2 - (GRID_SIZE * TILE_SIZE) / 2;
      cameraPosition = { x: camera.x, y: camera.y };

      // Mouse wheel zoom
      app.canvas.addEventListener('wheel', (e: WheelEvent) => {
        e.preventDefault();
        const delta = e.deltaY > 0 ? 0.9 : 1.1;
        const newScale = Math.max(0.5, Math.min(2, scale * delta));
        
        if (newScale !== scale) {
          scale = newScale;
          camera.scale.set(scale);
        }
      });

      // Mouse drag to pan
      app.canvas.addEventListener('mousedown', (e: MouseEvent) => {
        isDragging = true;
        dragStart = { x: e.clientX - cameraPosition.x, y: e.clientY - cameraPosition.y };
      });

      app.canvas.addEventListener('mousemove', (e: MouseEvent) => {
        if (isDragging) {
          cameraPosition.x = e.clientX - dragStart.x;
          cameraPosition.y = e.clientY - dragStart.y;
          camera.x = cameraPosition.x;
          camera.y = cameraPosition.y;
        }
      });

      app.canvas.addEventListener('mouseup', () => {
        isDragging = false;
      });

      app.canvas.addEventListener('mouseleave', () => {
        isDragging = false;
      });

      // Handle window resize
      const handleResize = () => {
        app.renderer.resize(window.innerWidth, window.innerHeight - 40);
      };
      window.addEventListener('resize', handleResize);

      // Cleanup
      return () => {
        window.removeEventListener('resize', handleResize);
      };
    })();

    // Cleanup on unmount
    return () => {
      if (appRef.current) {
        appRef.current.destroy(true, { children: true });
      }
    };
  }, [basePosition]);

  return <div ref={canvasRef} className="w-full h-full" />;
};

