
// @ts-nocheck
"use client";

import React, { useRef, useEffect, useState, useCallback } from 'react';
import Image from 'next/image';
import { InfoIcon } from 'lucide-react';

const SPONGE_RADIUS = 50;
const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;
const CLEANING_DIFFICULTY_FACTOR = 15.0; 

interface GameAreaProps {
  onProgressUpdate: (progress: number) => void;
  onCleaningComplete: () => void;
  dirtyImageSrc: string;
  cleanImageSrc: string;
  spongeImageSrc: string;
  isGameActive: boolean;
  isIdle: boolean; 
  resetCanvas: boolean;
  currentDirtColor: string;
}

interface Bubble {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  minRadius: number;
  growthSpeed: number;
  opacity: number;
  opacitySpeed: number;
  isGrowing: boolean;
  isFadingIn: boolean;
}

const hexToRgb = (hex: string): { r: number; g: number; b: number } | null => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
};

const darkenColor = (hexColor: string, percent: number): string => {
  const rgb = hexToRgb(hexColor);
  if (!rgb) return '#323232'; // Fallback color

  const factor = 1 - percent / 100;
  const r = Math.max(0, Math.floor(rgb.r * factor));
  const g = Math.max(0, Math.floor(rgb.g * factor));
  const b = Math.max(0, Math.floor(rgb.b * factor));

  const componentToHex = (c: number) => {
    const hex = c.toString(16);
    return hex.length === 1 ? "0" + hex : hex;
  };
  return "#" + componentToHex(r) + componentToHex(g) + componentToHex(b);
};


const GameArea: React.FC<GameAreaProps> = ({
  onProgressUpdate,
  onCleaningComplete,
  dirtyImageSrc,
  cleanImageSrc,
  spongeImageSrc,
  isGameActive,
  isIdle,
  resetCanvas,
  currentDirtColor,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const spongeRef = useRef<HTMLImageElement>(null);
  const [isCleaning, setIsCleaning] = useState(false);
  const cleanedPixelsRef = useRef<number>(0);
  const totalPixelsToCleanRef = useRef<number>(CANVAS_WIDTH * CANVAS_HEIGHT);

  const bubblesRef = useRef<Bubble[]>([]);
  const animationFrameIdRef = useRef<number | null>(null);
  const isFallbackActiveRef = useRef<boolean>(true);

  const drawFallbackBackground = useCallback((ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
    ctx.fillStyle = currentDirtColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }, [currentDirtColor]);

  const initializeBubbles = useCallback((canvas: HTMLCanvasElement) => {
    const newBubbles: Bubble[] = [];
    const numBubbles = 20; 
    for (let i = 0; i < numBubbles; i++) {
      const maxR = (Math.random() * 1.0 + 0.5); // Reduced size further
      const minR = (Math.random() * 0.25 + 0.25);  // Reduced size further
      newBubbles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        radius: minR,
        maxRadius: maxR,
        minRadius: minR,
        growthSpeed: Math.random() * 0.005 + 0.0015, // Slower growth
        opacity: 0,
        opacitySpeed: Math.random() * 0.0008 + 0.0002, // Slower opacity change
        isGrowing: true,
        isFadingIn: true,
      });
    }
    bubblesRef.current = newBubbles;
  }, []);

  const bubbleBaseColorForFill = useRef<string>('#323232');

  useEffect(() => {
    bubbleBaseColorForFill.current = darkenColor(currentDirtColor, 75); 
  }, [currentDirtColor]);


  const animateBubbles = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
  
    if (!ctx || !canvas || !isFallbackActiveRef.current) {
      if (animationFrameIdRef.current) cancelAnimationFrame(animationFrameIdRef.current);
      animationFrameIdRef.current = null;
      return;
    }
    // If the game is active, we don't want bubble animations on top of the cleaning layer
    if (isGameActive) {
        if (animationFrameIdRef.current) cancelAnimationFrame(animationFrameIdRef.current);
        animationFrameIdRef.current = null;
        // Ensure the static dirt background is drawn if the game just started
        // ctx.clearRect(0, 0, canvas.width, canvas.height); // This might clear too much if called repeatedly
        // drawFallbackBackground(ctx, canvas); // This could be redundant if drawn elsewhere
        return;
    }
  
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawFallbackBackground(ctx, canvas);
  
    const baseRgb = hexToRgb(bubbleBaseColorForFill.current);
  
    bubblesRef.current.forEach(bubble => {
      if (bubble.isGrowing) {
        bubble.radius += bubble.growthSpeed;
        if (bubble.radius >= bubble.maxRadius) {
          bubble.radius = bubble.maxRadius;
          bubble.isGrowing = false;
        }
      } else {
        bubble.radius -= bubble.growthSpeed;
        if (bubble.radius <= bubble.minRadius) {
          bubble.radius = bubble.minRadius;
          bubble.isGrowing = true;
        }
      }
  
      if (bubble.isFadingIn) {
        bubble.opacity += bubble.opacitySpeed;
        if (bubble.opacity >= (Math.random() * 0.2 + 0.6)) { 
          bubble.opacity = Math.min(bubble.opacity, 0.8); 
          bubble.isFadingIn = false;
        }
      } else {
        bubble.opacity -= bubble.opacitySpeed;
        if (bubble.opacity <= 0.3) { 
          bubble.opacity = 0.3;
          bubble.isFadingIn = true;
        }
      }
  
      if (baseRgb) {
        ctx.fillStyle = `rgba(${baseRgb.r}, ${baseRgb.g}, ${baseRgb.b}, ${bubble.opacity})`;
      } else {
        ctx.fillStyle = `rgba(10, 10, 10, ${bubble.opacity})`; // Fallback bubble color
      }
      ctx.beginPath();
      ctx.arc(bubble.x, bubble.y, bubble.radius, 0, Math.PI * 2);
      ctx.fill();
    });
  
    animationFrameIdRef.current = requestAnimationFrame(animateBubbles);
  
  }, [drawFallbackBackground, isGameActive, bubbleBaseColorForFill]);


  const drawInitialCanvasContent = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (ctx && canvas) {
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
        animationFrameIdRef.current = null;
      }

      cleanedPixelsRef.current = 0;
      onProgressUpdate(0);
      totalPixelsToCleanRef.current = canvas.width * canvas.height;

      isFallbackActiveRef.current = true;
      initializeBubbles(canvas);
      drawFallbackBackground(ctx, canvas);
      
      // Start animations if idle or not actively playing (e.g. initial state)
      // but only if fallback is active.
      if (isFallbackActiveRef.current && (isIdle || !isGameActive)) {
        animateBubbles();
      }
    }
  }, [onProgressUpdate, initializeBubbles, animateBubbles, drawFallbackBackground, isGameActive, isIdle, currentDirtColor]);


  useEffect(() => {
    drawInitialCanvasContent();
    return () => {
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
        animationFrameIdRef.current = null;
      }
    };
  }, [drawInitialCanvasContent, currentDirtColor, resetCanvas]);


  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');

    if (ctx && canvas) {
      if (isFallbackActiveRef.current && (isIdle || (!isGameActive && !isIdle))) { // Animate if idle or in a non-playing state (like level won, lost) with fallback
        if (!animationFrameIdRef.current && !isGameActive) { // Ensure not to start if game is active
            animateBubbles();
        }
      } else if (animationFrameIdRef.current && (isGameActive || !isFallbackActiveRef.current)) { // Stop if game active or fallback not active
        cancelAnimationFrame(animationFrameIdRef.current);
        animationFrameIdRef.current = null;
        if (isFallbackActiveRef.current && isGameActive) { // If game just became active, clear bubbles & draw static
            ctx.clearRect(0,0,canvas.width, canvas.height);
            drawFallbackBackground(ctx, canvas);
        }
      }
    }
  }, [isIdle, isGameActive, animateBubbles, drawFallbackBackground, currentDirtColor]);


  const handleInteractionStart = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isGameActive || isIdle) return;
    if (e.cancelable) e.preventDefault();
    setIsCleaning(true);
    moveSponge(e);
  };

  const handleInteractionEnd = () => {
    if (!isGameActive || isIdle) return;
    setIsCleaning(false);
  };

  const moveSponge = (e: React.MouseEvent | React.TouchEvent) => {
    if (isIdle) return; 
    const canvas = canvasRef.current;
    const sponge = spongeRef.current;
    if (!canvas || !sponge) return;

    if (isCleaning && e.cancelable) e.preventDefault();

    const rect = canvas.getBoundingClientRect();
    let clientX, clientY;
    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = (e as React.MouseEvent).clientX;
      clientY = (e as React.MouseEvent).clientY;
    }

    const displayX = clientX - rect.left;
    const displayY = clientY - rect.top;

    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const canvasX = displayX * scaleX;
    const canvasY = displayY * scaleY;

    const spongeDisplaySize = SPONGE_RADIUS * 2 / Math.min(scaleX, scaleY);

    sponge.style.width = `${spongeDisplaySize}px`;
    sponge.style.height = `${spongeDisplaySize}px`;
    sponge.style.left = `${displayX - spongeDisplaySize / 2}px`;
    sponge.style.top = `${displayY - spongeDisplaySize / 2}px`;
    sponge.style.display = isGameActive ? 'block' : 'none';


    if (isCleaning && isGameActive) {
      cleanArea(canvasX, canvasY);
    }
  };

  const cleanArea = (x: number, y: number) => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx || !isGameActive) return;

    const originalCompositeOperation = ctx.globalCompositeOperation;
    ctx.globalCompositeOperation = 'destination-out';
    ctx.beginPath();
    ctx.arc(x, y, SPONGE_RADIUS, 0, Math.PI * 2, false);
    ctx.fill();
    ctx.globalCompositeOperation = originalCompositeOperation;

    const cleanedAreaThisStroke = Math.PI * SPONGE_RADIUS * SPONGE_RADIUS;
    const newCleanedAmount = cleanedPixelsRef.current + cleanedAreaThisStroke * 1.0; 
    cleanedPixelsRef.current = newCleanedAmount;

    const progress = Math.min(100, (newCleanedAmount / (totalPixelsToCleanRef.current * CLEANING_DIFFICULTY_FACTOR)) * 100);
    onProgressUpdate(progress);

    if (progress >= 100) {
      onCleaningComplete();
    }
  };

  useEffect(() => {
    const sponge = spongeRef.current;
    const gameAreaDiv = canvasRef.current?.parentElement;

    const handleMouseLeave = () => {
      if (sponge) sponge.style.display = 'none';
      setIsCleaning(false);
    }
    if (gameAreaDiv) {
       gameAreaDiv.addEventListener('mouseleave', handleMouseLeave);
    }
    return () => {
      if (gameAreaDiv) {
        gameAreaDiv.removeEventListener('mouseleave', handleMouseLeave);
      }
    }
  }, []);

  return (
    <div
      className="relative w-full max-w-4xl aspect-[4/3] mx-auto border-2 border-primary rounded-lg shadow-lg overflow-hidden cursor-none touch-none"
      style={{ backgroundImage: `url(${cleanImageSrc})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
      onMouseDown={handleInteractionStart}
      onMouseUp={handleInteractionEnd}
      onMouseMove={moveSponge}
      onTouchStart={handleInteractionStart}
      onTouchEnd={handleInteractionEnd}
      onTouchMove={moveSponge}
      onDragStart={(e) => e.preventDefault()}
    >
      <canvas
        ref={canvasRef}
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
        className="absolute top-0 left-0 w-full h-full"
        style={{ opacity: 0.95 }}
      />
      <Image
        ref={spongeRef}
        src={spongeImageSrc}
        alt="Esponja"
        width={SPONGE_RADIUS * 2}
        height={SPONGE_RADIUS * 2}
        className="absolute pointer-events-none" 
        style={{ objectFit: 'contain', display: 'none', zIndex: 5 }} 
        draggable="false"
        data-ai-hint="kitchen sponge"
        priority
      />
      {isIdle && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm p-4 z-20 rounded-lg">
          <div className="bg-card/95 p-4 sm:p-6 rounded-lg shadow-xl max-w-sm sm:max-w-md text-center border border-primary">
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-primary mb-2 sm:mb-3 flex items-center justify-center">
              <InfoIcon className="w-6 h-6 sm:w-7 sm:h-7 mr-2 text-primary" />
              Instruções do Jogo
            </h2>
            <p className="text-xs sm:text-sm text-foreground">
              Limpe a sujeira arrastando a esponja. Ao final de cada nível, digite a{' '}
              <strong className="font-semibold text-accent">frase secreta</strong>{' '}
              para avançar. Anote as frases para não esquecer!
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default GameArea;
