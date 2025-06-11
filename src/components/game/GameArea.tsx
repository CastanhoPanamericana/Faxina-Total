
// @ts-nocheck
"use client";

import React, { useRef, useEffect, useState, useCallback } from 'react';
import Image from 'next/image';

const SPONGE_RADIUS = 50; // Raio da esponja no sistema de coordenadas do canvas (800x600)
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
    const numBubbles = 30;
    for (let i = 0; i < numBubbles; i++) {
      const maxR = Math.random() * 60 + 20; // Aumentado
      const minR = Math.random() * 15 + 8;  // Aumentado
      newBubbles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        radius: minR,
        maxRadius: maxR,
        minRadius: minR,
        growthSpeed: Math.random() * 0.02 + 0.01, // Mais lento
        opacity: 0,
        opacitySpeed: Math.random() * 0.002 + 0.0005, // Mais lento
        isGrowing: true,
        isFadingIn: true,
      });
    }
    bubblesRef.current = newBubbles;
  }, []);

  const animateBubbles = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');

    if (!ctx || !canvas || !isFallbackActiveRef.current || isGameActive) { // Animação apenas se fallback ativo E jogo não ativo
      if (animationFrameIdRef.current) cancelAnimationFrame(animationFrameIdRef.current);
      animationFrameIdRef.current = null;
      return;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawFallbackBackground(ctx, canvas);

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
        if (bubble.opacity >= (Math.random() * 0.3 + 0.4)) { // Opacidade máxima aumentada
          bubble.opacity = Math.min(bubble.opacity, 0.7);
          bubble.isFadingIn = false;
        }
      } else {
        bubble.opacity -= bubble.opacitySpeed;
        if (bubble.opacity <= 0) {
          bubble.opacity = 0;
          bubble.isFadingIn = true;
          bubble.x = Math.random() * canvas.width;
          bubble.y = Math.random() * canvas.height;
          bubble.radius = bubble.minRadius;
          bubble.isGrowing = true;
        }
      }

      ctx.fillStyle = `rgba(101, 67, 33, ${bubble.opacity})`; // Cor das bolhas um pouco mais escura
      ctx.beginPath();
      ctx.arc(bubble.x, bubble.y, bubble.radius, 0, Math.PI * 2);
      ctx.fill();
    });

    animationFrameIdRef.current = requestAnimationFrame(animateBubbles);

  }, [drawFallbackBackground, isGameActive]);


  const drawDirtyImage = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (ctx && canvas) {
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
        animationFrameIdRef.current = null;
      }
      isFallbackActiveRef.current = false;

      if (!dirtyImageSrc) { // Se dirtyImageSrc for vazio, usa fallback diretamente
        isFallbackActiveRef.current = true;
        initializeBubbles(canvas);
        drawFallbackBackground(ctx,canvas);
        setCleanedPixels(0);
        onProgressUpdate(0);
        if (!isGameActive) { // Inicia animação de bolhas se o jogo não estiver ativo
          animateBubbles();
        }
        return;
      }

      const img = new window.Image();
      img.crossOrigin = "anonymous";
      img.src = dirtyImageSrc;
      img.onload = () => {
        isFallbackActiveRef.current = false;
        if (animationFrameIdRef.current) {
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
        drawFallbackBackground(ctx,canvas);
        setCleanedPixels(0);
        onProgressUpdate(0);
        if (!isGameActive) { // Inicia animação de bolhas se o jogo não estiver ativo
          if (animationFrameIdRef.current) cancelAnimationFrame(animationFrameIdRef.current);
          animateBubbles();
        }
      }
    }
  }, [dirtyImageSrc, onProgressUpdate, initializeBubbles, animateBubbles, drawFallbackBackground, isGameActive]);

  useEffect(() => {
    drawDirtyImage();
    return () => {
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
        animationFrameIdRef.current = null;
      }
    };
  }, [drawDirtyImage, resetCanvas]);


  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');

    if (isFallbackActiveRef.current && !isGameActive && ctx && canvas) {
      if (!animationFrameIdRef.current) { // Só inicia nova animação se não houver uma rodando
        animateBubbles();
      }
    } else if (animationFrameIdRef.current && (isGameActive || !isFallbackActiveRef.current)) {
      // Para a animação se o jogo começar ou se o fallback não estiver mais ativo
      cancelAnimationFrame(animationFrameIdRef.current);
      animationFrameIdRef.current = null;
      if (isFallbackActiveRef.current && isGameActive && ctx && canvas) {
         // Garante que o fundo de fallback seja redesenhado sem bolhas se o jogo começar com fallback
        ctx.clearRect(0,0,canvas.width, canvas.height);
        drawFallbackBackground(ctx, canvas);
      }
    }
  }, [isGameActive, animateBubbles, drawFallbackBackground]);


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

    // Coordenadas relativas ao canvas exibido na tela
    const displayX = clientX - rect.left;
    const displayY = clientY - rect.top;

    // Escala as coordenadas de exibição para o sistema de coordenadas interno do canvas (800x600)
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const canvasX = displayX * scaleX;
    const canvasY = displayY * scaleY;

    // Posiciona o centro da esponja visual no ponto de toque/mouse
    // sponge.offsetWidth e sponge.offsetHeight são os tamanhos renderizados da imagem da esponja
    sponge.style.left = `${displayX - sponge.offsetWidth / 2}px`;
    sponge.style.top = `${displayY - sponge.offsetHeight / 2}px`;
    sponge.style.display = 'block';

    if (isCleaning && isGameActive) {
      cleanArea(canvasX, canvasY); // Usa coordenadas escaladas para a lógica de limpeza
    }
  };

  const cleanArea = (x: number, y: number) => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx || !isGameActive) return;

    const originalCompositeOperation = ctx.globalCompositeOperation;
    ctx.globalCompositeOperation = 'destination-out';
    ctx.beginPath();
    ctx.arc(x, y, SPONGE_RADIUS, 0, Math.PI * 2, false); // SPONGE_RADIUS é no sistema 800x600
    ctx.fill();
    ctx.globalCompositeOperation = originalCompositeOperation;

    // Ajustado para requerer mais limpeza
    const cleanedAreaThisStroke = Math.PI * SPONGE_RADIUS * SPONGE_RADIUS;
    const newCleanedAmount = cleanedPixels + cleanedAreaThisStroke * 0.025; // Ajustado para 0.025
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
       // Para touch, o 'touchend' fora da área já é tratado por handleInteractionEnd.
    }
    return () => {
      if (gameAreaDiv) {
        gameAreaDiv.removeEventListener('mouseleave', handleMouseLeave);
      }
    }
  }, []);

  return (
    <div
      className="relative w-full max-w-4xl aspect-[4/3] mx-auto border-2 border-primary rounded-lg shadow-lg overflow-hidden cursor-none touch-none" // aspect-[4/3] para 800x600, touch-none para evitar scroll em mobile
      style={{ backgroundImage: `url(${cleanImageSrc})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
      onMouseDown={handleInteractionStart}
      onMouseUp={handleInteractionEnd}
      onMouseMove={moveSponge}
      onTouchStart={handleInteractionStart}
      onTouchEnd={handleInteractionEnd}
      onTouchMove={moveSponge}
      onDragStart={(e) => e.preventDefault()} // Evita arrastar a imagem
    >
      <canvas
        ref={canvasRef}
        width={CANVAS_WIDTH} // Mantém a resolução interna
        height={CANVAS_HEIGHT} // Mantém a resolução interna
        className="absolute top-0 left-0 w-full h-full" // Faz o canvas CSS preencher o div pai
      />
      <Image
        ref={spongeRef}
        src={spongeImageSrc}
        alt="Esponja"
        width={SPONGE_RADIUS * 2} // Tamanho da imagem da esponja em pixels (relativo ao canvas 800x600)
        height={SPONGE_RADIUS * 2}
        className="absolute pointer-events-none hidden" // a posição será via style.left/top
        style={{ objectFit: 'contain' }}
        draggable="false"
        data-ai-hint="kitchen sponge"
        priority // Sugere carregamento prioritário para a esponja
      />
    </div>
  );
};

export default GameArea;
