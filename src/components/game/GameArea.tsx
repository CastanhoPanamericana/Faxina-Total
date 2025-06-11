
// @ts-nocheck
"use client";

import React, { useRef, useEffect, useState, useCallback } from 'react';
import Image from 'next/image';

const SPONGE_RADIUS = 50; // Aumentado de 30 para 50
const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;

interface GameAreaProps {
  onProgressUpdate: (progress: number) => void;
  onCleaningComplete: () => void;
  dirtyImageSrc: string;
  cleanImageSrc: string;
  spongeImageSrc: string;
  isGameActive: boolean;
  resetCanvas: boolean;
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

const GameArea: React.FC<GameAreaProps> = ({
  onProgressUpdate,
  onCleaningComplete,
  dirtyImageSrc,
  cleanImageSrc,
  spongeImageSrc,
  isGameActive,
  resetCanvas,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const spongeRef = useRef<HTMLImageElement>(null);
  const [isCleaning, setIsCleaning] = useState(false);
  const [cleanedPixels, setCleanedPixels] = useState(0);
  const totalPixelsToCleanRef = useRef<number>(CANVAS_WIDTH * CANVAS_HEIGHT); 

  const bubblesRef = useRef<Bubble[]>([]);
  const animationFrameIdRef = useRef<number | null>(null);
  const isFallbackActiveRef = useRef<boolean>(false);

  const drawFallbackBackground = useCallback((ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
    ctx.fillStyle = '#8B4513'; // Saddle brown
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }, []);

  const initializeBubbles = useCallback((canvas: HTMLCanvasElement) => {
    const newBubbles: Bubble[] = [];
    const numBubbles = 30; // Reduzido para performance e estética
    for (let i = 0; i < numBubbles; i++) {
      const maxR = Math.random() * 15 + 8; 
      const minR = Math.random() * 4 + 2;   
      newBubbles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        radius: minR,
        maxRadius: maxR,
        minRadius: minR,
        growthSpeed: Math.random() * 0.04 + 0.01, // Mais lento: 0.01 a 0.05
        opacity: 0,
        opacitySpeed: Math.random() * 0.004 + 0.001, // Mais lento: 0.001 a 0.005
        isGrowing: true,
        isFadingIn: true,
      });
    }
    bubblesRef.current = newBubbles;
  }, []);

  const animateBubbles = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');

    if (!ctx || !canvas || !isFallbackActiveRef.current) {
      if (animationFrameIdRef.current) cancelAnimationFrame(animationFrameIdRef.current);
      animationFrameIdRef.current = null;
      return;
    }

    // Limpa apenas a área do canvas de sujeira
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawFallbackBackground(ctx, canvas); // Redesenha o fundo marrom

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
        if (bubble.opacity >= (Math.random() * 0.2 + 0.15)) { 
          bubble.opacity = Math.min(bubble.opacity, 0.35);
          bubble.isFadingIn = false;
        }
      } else {
        bubble.opacity -= bubble.opacitySpeed;
        if (bubble.opacity <= 0) {
          bubble.opacity = 0;
          bubble.isFadingIn = true;
          // Reposiciona a bolha para um novo ciclo
          bubble.x = Math.random() * canvas.width;
          bubble.y = Math.random() * canvas.height;
          bubble.radius = bubble.minRadius;
          bubble.isGrowing = true;
        }
      }
      
      ctx.fillStyle = `rgba(101, 67, 33, ${bubble.opacity})`; // Cor da bolha um pouco mais escura/diferente
      ctx.beginPath();
      ctx.arc(bubble.x, bubble.y, bubble.radius, 0, Math.PI * 2);
      ctx.fill();
    });
    
    // Continua a animação apenas se o fallback estiver ativo E o jogo não estiver ativo
    if (isFallbackActiveRef.current && !isGameActive) {
        animationFrameIdRef.current = requestAnimationFrame(animateBubbles);
    } else {
        if (animationFrameIdRef.current) {
            cancelAnimationFrame(animationFrameIdRef.current);
            animationFrameIdRef.current = null;
        }
    }
  }, [drawFallbackBackground, isGameActive, initializeBubbles]); // Adicionado initializeBubbles e isGameActive

  const drawDirtyImage = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (ctx && canvas) {
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
        animationFrameIdRef.current = null;
      }
      isFallbackActiveRef.current = false; // Reseta o fallback

      const img = new window.Image();
      img.crossOrigin = "anonymous";
      img.src = dirtyImageSrc;
      img.onload = () => {
        isFallbackActiveRef.current = false;
        if (animationFrameIdRef.current) { // Para animação se uma imagem real carregar
            cancelAnimationFrame(animationFrameIdRef.current);
            animationFrameIdRef.current = null;
        }
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        setCleanedPixels(0);
        onProgressUpdate(0); 
      };
      img.onerror = () => {
        isFallbackActiveRef.current = true;
        initializeBubbles(canvas);
        drawFallbackBackground(ctx,canvas); // Desenha o fundo estático uma vez
        if (!isGameActive) { // Inicia a animação apenas se o jogo não estiver ativo
          animateBubbles(); 
        }
        setCleanedPixels(0);
        onProgressUpdate(0);
      }
    }
  }, [dirtyImageSrc, onProgressUpdate, initializeBubbles, animateBubbles, drawFallbackBackground, isGameActive]);
  
  useEffect(() => {
    drawDirtyImage(); // Esta função agora lida com o início da animação condicionalmente

    // Cleanup para parar a animação se o componente for desmontado ou as dependências mudarem
    return () => {
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
        animationFrameIdRef.current = null;
      }
    };
  }, [drawDirtyImage, resetCanvas]); // A dependência de isGameActive foi movida para dentro da lógica de animateBubbles e drawDirtyImage


  useEffect(() => {
    // Lógica para iniciar/parar a animação baseada em isGameActive e isFallbackActiveRef
    if (isFallbackActiveRef.current && !isGameActive) {
      if (!animationFrameIdRef.current) { // Evita múltiplas chamadas se já estiver animando
        animateBubbles();
      }
    } else if (animationFrameIdRef.current) {
      // Se o jogo começou ou o fallback não está ativo, para a animação
      cancelAnimationFrame(animationFrameIdRef.current);
      animationFrameIdRef.current = null;
    }
  }, [isGameActive, animateBubbles]); // isFallbackActiveRef.current não é um estado, não precisa estar aqui. animateBubbles é memoizado.


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

    const x = clientX - rect.left;
    const y = clientY - rect.top;

    sponge.style.left = `${x - SPONGE_RADIUS}px`;
    sponge.style.top = `${y - SPONGE_RADIUS}px`;
    sponge.style.display = 'block';

    if (isCleaning && isGameActive) { 
      cleanArea(x, y);
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
    // Reduzido o fator para exigir mais limpeza para progredir
    const newCleanedAmount = cleanedPixels + cleanedAreaThisStroke * 0.02; 
    setCleanedPixels(newCleanedAmount);
    
    const progress = Math.min(100, (newCleanedAmount / totalPixelsToCleanRef.current) * 100);
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
      className="relative w-[800px] h-[600px] mx-auto border-2 border-primary rounded-lg shadow-lg overflow-hidden cursor-none"
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
        className="absolute top-0 left-0"
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
      />
    </div>
  );
};

export default GameArea;

    