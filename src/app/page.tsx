
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import GameArea from '@/components/game/GameArea';
import TimerDisplay from '@/components/game/TimerDisplay';
import ScoreDisplay from '@/components/game/ScoreDisplay';
import GameStatusModal from '@/components/game/MedalModal';
import { Button } from '@/components/ui/button';
import { PlayIcon, RotateCcwIcon } from 'lucide-react';
import Image from 'next/image';

const BASE_INITIAL_TIME = 60; // 60 segundos base
const CLEAN_THRESHOLD = 100; // Precisa limpar 100% para vencer
const LEVEL_TIME_DECREMENT = 3; // Segundos a menos por nível
const MIN_TIME_LIMIT = 15; // Tempo mínimo para um nível

const DIRT_COLORS = ['#8B4513', '#7A3D12', '#693310', '#582A0E', '#47210C', '#6B8E23', '#556B2F', '#8FBC8F', '#2E8B57', '#3CB371'];


type GameState = 'idle' | 'playing' | 'won' | 'lost';

export default function CleanSweepPage() {
  const [gameState, setGameState] = useState<GameState>('idle');
  const [timeLeft, setTimeLeft] = useState(Math.floor(BASE_INITIAL_TIME * 0.7));
  const [score, setScore] = useState(0);
  const [resetCanvasKey, setResetCanvasKey] = useState(0);
  const [level, setLevel] = useState(1);
  const [currentDirtColor, setCurrentDirtColor] = useState(DIRT_COLORS[0]);

  // URLs das imagens - Mantidas para referência, mas a 'dirtyImage' está vazia para usar o fallback
  const [dirtyImage, setDirtyImage] = useState(""); // Usará o fallback com cor e bolhas
  const [cleanImage, setCleanImage] = useState("https://rodrigocastanho.com/_testes/piaLimpa.jpg");
  const [spongeImage, setSpongeImage] = useState("https://bufalloinox.com.br/wp-content/uploads/2021/11/esponja-de-aco-inox.png");

  const dirtyImageAiHint = "fundo sujeira abstrato"; // Alterado para refletir o fallback
  const cleanImageAiHint = "pia cozinha limpa";
  const spongeImageAiHint = "esponja limpeza";

  const calculateTimeForLevel = useCallback((lvl: number) => {
    if (lvl === 1) {
      return Math.floor(BASE_INITIAL_TIME * 0.7);
    }
    const timeAfterDecrement = Math.floor(BASE_INITIAL_TIME * 0.7) - (lvl - 1) * LEVEL_TIME_DECREMENT;
    return Math.max(MIN_TIME_LIMIT, timeAfterDecrement);
  }, []);

  const getColorForLevel = useCallback((lvl: number) => {
    return DIRT_COLORS[(lvl - 1) % DIRT_COLORS.length];
  }, []);

  useEffect(() => {
    let timerId: NodeJS.Timeout;
    if (gameState === 'playing' && timeLeft > 0) {
      timerId = setInterval(() => {
        setTimeLeft((prevTime) => prevTime - 1);
      }, 1000);
    } else if (timeLeft === 0 && gameState === 'playing') {
      setGameState('lost');
    }
    return () => clearInterval(timerId);
  }, [gameState, timeLeft]);

  const handleStartOrRestart = useCallback((targetLevel: number) => {
    setLevel(targetLevel);
    setTimeLeft(calculateTimeForLevel(targetLevel));
    setCurrentDirtColor(getColorForLevel(targetLevel));
    setScore(0);
    setGameState('playing');
    setResetCanvasKey(prev => prev + 1);
  }, [calculateTimeForLevel, getColorForLevel]);


  const handleProgressUpdate = useCallback((progress: number) => {
    setScore(progress);
    if (progress >= CLEAN_THRESHOLD && gameState === 'playing') {
      setGameState('won');
    }
  }, [gameState, CLEAN_THRESHOLD]);

  const handleCleaningComplete = useCallback(() => {
     if (gameState === 'playing' && score >= CLEAN_THRESHOLD) {
       setGameState('won');
     }
  }, [gameState, score, CLEAN_THRESHOLD]);

  const closeWinModalAndAdvance = () => {
    setGameState('idle');
    handleStartOrRestart(level + 1); // Avança para o próximo nível
  };

  const closeModalAndRestartCurrentLevel = () => {
    setGameState('idle');
    handleStartOrRestart(level); // Reinicia o nível atual
  };
  
  const initialGameStart = () => {
    handleStartOrRestart(1); // Começa sempre do nível 1
  };


  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background p-4 sm:p-6 md:p-8 font-body">
      <header className="mb-4 md:mb-6 text-center">
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-headline text-primary drop-shadow-md">Desafio Faxina Total</h1>
        <p className="text-base sm:text-lg text-foreground mt-1 sm:mt-2">Nível: {level} - Limpe a bagunça antes que o tempo acabe!</p>
      </header>

      <main className="w-full max-w-4xl bg-card p-3 sm:p-6 rounded-xl shadow-2xl">
        <div className="flex flex-col sm:flex-row justify-around items-center mb-4 sm:mb-6 space-y-3 sm:space-y-0 sm:space-x-4">
          <TimerDisplay timeLeft={timeLeft} />
          {gameState === 'idle' && (
            <Button onClick={initialGameStart} size="lg" className="bg-accent hover:bg-accent/90 text-accent-foreground shadow-md animate-pulse w-full sm:w-auto">
              <PlayIcon className="mr-2 h-5 w-5 sm:h-6 sm:w-6" /> Começar Jogo
            </Button>
          )}
          { (gameState === 'playing' || gameState === 'won' || gameState === 'lost') && (
             <Button onClick={() => handleStartOrRestart(level)} size="lg" variant="outline" className="border-primary text-primary hover:bg-primary/10 shadow-md w-full sm:w-auto">
              <RotateCcwIcon className="mr-2 h-5 w-5 sm:h-6 sm:w-6" /> Reiniciar Nível
            </Button>
          )}
          <ScoreDisplay score={score} />
        </div>

        <GameArea
          key={resetCanvasKey}
          onProgressUpdate={handleProgressUpdate}
          onCleaningComplete={handleCleaningComplete}
          dirtyImageSrc={dirtyImage}
          cleanImageSrc={cleanImage}
          spongeImageSrc={spongeImage}
          isGameActive={gameState === 'playing'}
          resetCanvas={resetCanvasKey > 0}
          currentDirtColor={currentDirtColor}
        />
        {/* Placeholder for the Image components. Not visually rendered over game. */}
        <Image src={dirtyImage || "https://placehold.co/1x1.png"} alt="Superfície Suja" width={1} height={1} className="hidden" data-ai-hint={dirtyImageAiHint}/>
        <Image src={cleanImage} alt="Superfície Limpa" width={1} height={1} className="hidden" data-ai-hint={cleanImageAiHint}/>
        <Image src={spongeImage} alt="Esponja" width={1} height={1} className="hidden" data-ai-hint={spongeImageAiHint}/>

      </main>

      <GameStatusModal
        isOpen={gameState === 'won'}
        onClose={closeWinModalAndAdvance}
        title={`Nível ${level} Completo!`}
        description={`Parabéns! Você limpou tudo! Preparado para o Nível ${level + 1}?`}
        isWin={true}
        level={level}
      />
      <GameStatusModal
        isOpen={gameState === 'lost'}
        onClose={closeModalAndRestartCurrentLevel}
        title="Tempo Esgotado!"
        description="Ah, não! Seu tempo acabou. Tente novamente este nível!"
        isWin={false}
        level={level}
      />

      <footer className="mt-6 md:mt-10 text-center text-xs sm:text-sm text-muted-foreground">
        <p>&copy; {new Date().getFullYear()} Desafio Faxina Total. Esfregue com vontade!</p>
      </footer>
    </div>
  );
}

    