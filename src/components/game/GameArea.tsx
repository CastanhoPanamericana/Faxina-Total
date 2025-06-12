
// @ts-nocheck
"use client";

import React, { useRef, useEffect, useState, useCallback } from 'react';
import Image from 'next/image';

const SPONGE_RADIUS = 50; 
const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;

interface GameAreaProps {
  onProgressUpdate: (progress: number) => void;
  onCleaningComplete: () => void;
  dirtyImageSrc: string; 
  cleanImageSrc: string; 
  spongeImageSrc: string;
  isGameActive: boolean;
  resetCanvas: boolean; // Sinaliza para recriar o canvas
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
  if (!rgb) return '#323232'; 

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
  resetCanvas, // Usado como key no componente pai para forçar recriação
  currentDirtColor,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const spongeRef = useRef<HTMLImageElement>(null);
  const [isCleaning, setIsCleaning] = useState(false);
  const cleanedPixelsRef = useRef<number>(0); 
  const totalPixelsToCleanRef = useRef<number>(CANVAS_WIDTH * CANVAS_HEIGHT);

  const bubblesRef = useRef<Bubble[]>([]);
  const animationFrameIdRef = useRef<number | null>(null);
  const isFallbackActiveRef = useRef<boolean>(true); // Sempre usar fallback para sujeira

  const drawFallbackBackground = useCallback((ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
    ctx.fillStyle = currentDirtColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }, [currentDirtColor]);

  const initializeBubbles = useCallback((canvas: HTMLCanvasElement) => {
    const newBubbles: Bubble[] = [];
    const numBubbles = 20; 
    for (let i = 0; i < numBubbles; i++) {
      const maxR = (Math.random() * 40 + 120) * 2; // Bolhas 2x maiores
      const minR = (Math.random() * 20 + 60) * 2;  // Bolhas 2x maiores
      newBubbles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        radius: minR,
        maxRadius: maxR,
        minRadius: minR,
        growthSpeed: Math.random() * 0.015 + 0.005, // Mais lento
        opacity: 0,
        opacitySpeed: Math.random() * 0.0015 + 0.00025, // Mais lento
        isGrowing: true,
        isFadingIn: true,
      });
    }
    bubblesRef.current = newBubbles;
  }, []);
  
  const bubbleBaseColorForFill = useRef<string>('#323232');

  useEffect(() => {
    // Deixar as bolhas mais escuras
    bubbleBaseColorForFill.current = darkenColor(currentDirtColor, 75); // Aumentar o percentual de escurecimento
  }, [currentDirtColor]);


  const animateBubbles = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');

    if (!ctx || !canvas || !isFallbackActiveRef.current || isGameActive) {
      if (animationFrameIdRef.current) cancelAnimationFrame(animationFrameIdRef.current);
      animationFrameIdRef.current = null;
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
        if (bubble.opacity >= (Math.random() * 0.3 + 0.6)) { // Opacidade mais alta para mais visibilidade
          bubble.opacity = Math.min(bubble.opacity, 0.9); 
          bubble.isFadingIn = false;
        }
      } else {
        bubble.opacity -= bubble.opacitySpeed;
        if (bubble.opacity <= 0.3) { // Manter um pouco mais visível
          bubble.opacity = 0.3;
          bubble.isFadingIn = true;
        }
      }
      
      if (baseRgb) {
        ctx.fillStyle = `rgba(${baseRgb.r}, ${baseRgb.g}, ${baseRgb.b}, ${bubble.opacity})`;
      } else {
        ctx.fillStyle = `rgba(20, 20, 20, ${bubble.opacity})`; // Cor escura fallback
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

      isFallbackActiveRef.current = true; // Sempre usar fallback
      initializeBubbles(canvas);
      drawFallbackBackground(ctx, canvas);
      if (!isGameActive) { 
        animateBubbles();
      }
    }
  }, [onProgressUpdate, initializeBubbles, animateBubbles, drawFallbackBackground, isGameActive, currentDirtColor]);


  useEffect(() => {
    // Este useEffect é acionado pela key 'resetCanvas' no componente pai (page.tsx)
    // e também quando currentDirtColor muda.
    drawInitialCanvasContent();
    return () => {
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
        animationFrameIdRef.current = null;
      }
    };
  }, [drawInitialCanvasContent, currentDirtColor]); // 'resetCanvas' não é uma prop direta, mas a key que muda


  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');

    if (isFallbackActiveRef.current && !isGameActive && ctx && canvas) {
      if (!animationFrameIdRef.current) { 
        animateBubbles();
      }
    } else if (animationFrameIdRef.current && (isGameActive || !isFallbackActiveRef.current)) {
      cancelAnimationFrame(animationFrameIdRef.current);
      animationFrameIdRef.current = null;
      if (isFallbackActiveRef.current && isGameActive && ctx && canvas) {
        ctx.clearRect(0,0,canvas.width, canvas.height);
        drawFallbackBackground(ctx, canvas); 
      }
    }
  }, [isGameActive, animateBubbles, drawFallbackBackground, currentDirtColor]);


  const handleInteractionStart = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isGameActive) return;
    if (e.cancelable) e.preventDefault();
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
    sponge.style.display = 'block';

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

    // Fator de limpeza ajustado para 0.1
    const cleanedAreaThisStroke = Math.PI * SPONGE_RADIUS * SPONGE_RADIUS; 
    const newCleanedAmount = cleanedPixelsRef.current + cleanedAreaThisStroke * 0.1; 
    cleanedPixelsRef.current = newCleanedAmount;

    // O multiplicador 2.5 ajuda a compensar a área menor em telas mobile,
    // fazendo o progresso parecer mais rápido em relação ao total de pixels.
    const progress = Math.min(100, (newCleanedAmount / totalPixelsToCleanRef.current) * 100 * 2.5); 
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
        style={{ opacity: 0.85, mixBlendMode: 'multiply' }} // Opacidade alterada para 0.85
      />
      <Image
        ref={spongeRef}
        src={spongeImageSrc}
        alt="Esponja"
        width={SPONGE_RADIUS * 2} 
        height={SPONGE_RADIUS * 2} 
        className="absolute pointer-events-none hidden"
        style={{ objectFit: 'contain' }} 
        draggable="false"
        data-ai-hint="kitchen sponge"
        priority
      />
    </div>
  );
};

export default GameArea;

    