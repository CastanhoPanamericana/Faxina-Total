// @ts-nocheck
"use client";

import React, { useRef, useEffect, useState, useCallback } from 'react';
import Image from 'next/image';

const SPONGE_RADIUS = 30;
const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;
// For simplicity in this iteration, we won't use a fine-grained grid for progress.
// Progress will be an estimate based on cleaning actions.
// A more robust solution would involve analyzing canvas pixel data or a cleanliness grid.

interface GameAreaProps {
  onProgressUpdate: (progress: number) => void;
  onCleaningComplete: () => void;
  dirtyImageSrc: string;
  isGameActive: boolean;
  resetCanvas: boolean;
}

const GameArea: React.FC<GameAreaProps> = ({
  onProgressUpdate,
  onCleaningComplete,
  dirtyImageSrc,
  isGameActive,
  resetCanvas,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const spongeRef = useRef<HTMLDivElement>(null);
  const [isCleaning, setIsCleaning] = useState(false);
  const [cleanedPixels, setCleanedPixels] = useState(0);
  const totalPixelsToCleanRef = useRef<number>(CANVAS_WIDTH * CANVAS_HEIGHT * 0.8); // Estimate 80% needs cleaning

  const drawDirtyImage = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (ctx && canvas) {
      const img = new window.Image();
      img.crossOrigin = "anonymous"; // Important for placehold.co if it serves with CORS headers
      img.src = dirtyImageSrc;
      img.onload = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        setCleanedPixels(0);
        onProgressUpdate(0); 
      };
      img.onerror = () => {
        // Fallback if image fails to load (e.g. CORS issue without proper headers from placehold.co)
        // Draw a placeholder dirty pattern
        ctx.fillStyle = '#A0522D'; // Brown color for dirt
        ctx.fillRect(0,0, canvas.width, canvas.height);
        // Add some splotches
        for(let i = 0; i < 50; i++) {
            ctx.fillStyle = `rgba(80,40,10,${Math.random()*0.5 + 0.3})`;
            ctx.beginPath();
            ctx.arc(Math.random()*canvas.width, Math.random()*canvas.height, Math.random()*30+10, 0, Math.PI*2);
            ctx.fill();
        }
        setCleanedPixels(0);
        onProgressUpdate(0);
      }
    }
  }, [dirtyImageSrc, onProgressUpdate]);
  
  useEffect(() => {
    drawDirtyImage();
  }, [drawDirtyImage, resetCanvas]);


  const handleInteractionStart = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isGameActive) return;
    setIsCleaning(true);
    moveSponge(e); 
  };

  const handleInteractionEnd = () => {
    if (!isGameActive) return;
    setIsCleaning(false);
  };

  const moveSponge = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    const sponge = spongeRef.current;
    if (!canvas || !sponge) return;

    const rect = canvas.getBoundingClientRect();
    let clientX, clientY;
    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    const x = clientX - rect.left;
    const y = clientY - rect.top;

    sponge.style.left = `${x - SPONGE_RADIUS}px`;
    sponge.style.top = `${y - SPONGE_RADIUS}px`;
    sponge.style.display = 'block';

    if (isCleaning) {
      cleanArea(x, y);
    }
  };
  
  const cleanArea = (x: number, y: number) => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx) return;

    ctx.globalCompositeOperation = 'destination-out';
    ctx.beginPath();
    ctx.arc(x, y, SPONGE_RADIUS, 0, Math.PI * 2, false);
    ctx.fill();
    
    // Simplified progress: count cleaning operations
    // A more accurate method would be to analyze pixel data or use a grid
    const newCleanedAmount = cleanedPixels + Math.PI * SPONGE_RADIUS * SPONGE_RADIUS * 0.1; // Estimate cleaned area
    setCleanedPixels(newCleanedAmount);
    
    const progress = Math.min(100, (newCleanedAmount / totalPixelsToCleanRef.current) * 100);
    onProgressUpdate(progress);

    if (progress >= 99) { // Threshold for completion
      onCleaningComplete();
    }
  };

  useEffect(() => {
    const sponge = spongeRef.current;
    const handleMouseLeave = () => {
      if (sponge) sponge.style.display = 'none';
      setIsCleaning(false);
    }
    const canvas = canvasRef.current;
    if (canvas) {
       canvas.addEventListener('mouseleave', handleMouseLeave);
    }
    return () => {
      if (canvas) {
        canvas.removeEventListener('mouseleave', handleMouseLeave);
      }
    }
  }, []);


  return (
    <div className="relative w-[800px] h-[600px] mx-auto border-2 border-primary rounded-lg shadow-lg overflow-hidden cursor-none"
      onMouseDown={handleInteractionStart}
      onMouseUp={handleInteractionEnd}
      onMouseMove={moveSponge}
      onTouchStart={handleInteractionStart}
      onTouchEnd={handleInteractionEnd}
      onTouchMove={moveSponge}
    >
      <canvas
        ref={canvasRef}
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
        className="absolute top-0 left-0"
      />
      <div
        ref={spongeRef}
        className="absolute bg-gray-500 rounded-full shadow-xl pointer-events-none hidden"
        style={{
          width: `${SPONGE_RADIUS * 2}px`,
          height: `${SPONGE_RADIUS * 2}px`,
          border: '2px solid #A9A9A9' 
        }}
      />
      {/* The clean background is provided by the page's bg-background color */}
    </div>
  );
};

export default GameArea;
