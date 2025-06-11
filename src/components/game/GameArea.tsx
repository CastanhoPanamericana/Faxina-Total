
// @ts-nocheck
"use client";

import React, { useRef, useEffect, useState, useCallback } from 'react';
import Image from 'next/image'; // Import next/image

const SPONGE_RADIUS = 50; // Aumentado para 50
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
  const spongeRef = useRef<HTMLImageElement>(null); // Alterado para HTMLImageElement
  const [isCleaning, setIsCleaning] = useState(false);
  const [cleanedPixels, setCleanedPixels] = useState(0);
  const totalPixelsToCleanRef = useRef<number>(CANVAS_WIDTH * CANVAS_HEIGHT * 0.8);

  const drawDirtyImage = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (ctx && canvas) {
      const img = new window.Image();
      img.crossOrigin = "anonymous";
      img.src = dirtyImageSrc;
      img.onload = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        setCleanedPixels(0);
        onProgressUpdate(0); 
      };
      img.onerror = () => {
        ctx.fillStyle = '#8B4513'; // Cor de sujeira (marrom sela)
        ctx.fillRect(0,0, canvas.width, canvas.height);
        for(let i = 0; i < 50; i++) {
            ctx.fillStyle = `rgba(101,67,33,${Math.random()*0.5 + 0.3})`; // Marrom mais escuro
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
    // Assegura que o evento padrão de arrastar imagem não ocorra
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

    // Assegura que o evento padrão de arrastar imagem não ocorra durante o movimento
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
    
    const newCleanedAmount = cleanedPixels + Math.PI * SPONGE_RADIUS * SPONGE_RADIUS * 0.1; 
    setCleanedPixels(newCleanedAmount);
    
    const progress = Math.min(100, (newCleanedAmount / totalPixelsToCleanRef.current) * 100);
    onProgressUpdate(progress);

    if (progress >= 99) {
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
      // Prevenir arrastar da imagem de fundo
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
        style={{ objectFit: 'contain' }} // Para manter a proporção da esponja
        draggable="false" // Prevenir arrastar da imagem da esponja
        data-ai-hint="kitchen sponge"
      />
    </div>
  );
};

export default GameArea;
