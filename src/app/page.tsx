
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import GameArea from '@/components/game/GameArea';
import TimerDisplay from '@/components/game/TimerDisplay';
import ScoreDisplay from '@/components/game/ScoreDisplay';
import GameStatusModal from '@/components/game/MedalModal';
import { Button } from '@/components/ui/button';
import { PlayIcon, RotateCcwIcon } from 'lucide-react';
import Image from 'next/image';


const INITIAL_TIME = 60; // 60 segundos
const CLEAN_THRESHOLD = 100; // Alterado para 100% para vencer

type GameState = 'idle' | 'playing' | 'won' | 'lost';

export default function CleanSweepPage() {
  const [gameState, setGameState] = useState<GameState>('idle');
  const [timeLeft, setTimeLeft] = useState(INITIAL_TIME);
  const [score, setScore] = useState(0);
  const [resetCanvasKey, setResetCanvasKey] = useState(0);

  // URLs das imagens
  const [dirtyImage, setDirtyImage] = useState(""); // Fundo marrom com bolhas animadas será o fallback
  const [cleanImage, setCleanImage] = useState("https://rodrigocastanho.com/_testes/piaLimpa.jpg");
  const [spongeImage, setSpongeImage] = useState("https://bufalloinox.com.br/wp-content/uploads/2021/11/esponja-de-aco-inox.png");

  const dirtyImageAiHint = "cozinha suja pia";
  const cleanImageAiHint = "pia cozinha limpa";
  const spongeImageAiHint = "esponja limpeza";


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

  const startGame = () => {
    setTimeLeft(INITIAL_TIME);
    setScore(0);
    setGameState('playing');
    setResetCanvasKey(prev => prev + 1);
  };

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

  const closeModalAndReset = () => {
    setGameState('idle');
    startGame();
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background p-4 sm:p-8 font-body">
      <header className="mb-8 text-center">
        <h1 className="text-5xl font-headline text-primary drop-shadow-md">Desafio Faxina Total</h1>
        <p className="text-lg text-foreground mt-2">Limpe a bagunça antes que o tempo acabe!</p>
      </header>

      <main className="w-full max-w-4xl bg-card p-6 rounded-xl shadow-2xl">
        <div className="flex flex-col sm:flex-row justify-around items-center mb-6 space-y-4 sm:space-y-0 sm:space-x-4">
          <TimerDisplay timeLeft={timeLeft} />
          {gameState === 'idle' && (
            <Button onClick={startGame} size="lg" className="bg-accent hover:bg-accent/90 text-accent-foreground shadow-md animate-pulse">
              <PlayIcon className="mr-2 h-6 w-6" /> Começar Jogo
            </Button>
          )}
          { (gameState === 'playing' || gameState === 'won' || gameState === 'lost') && (
             <Button onClick={startGame} size="lg" variant="outline" className="border-primary text-primary hover:bg-primary/10 shadow-md">
              <RotateCcwIcon className="mr-2 h-6 w-6" /> Reiniciar Jogo
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
          resetCanvas={resetCanvasKey > 0} // Usado para forçar o useEffect em GameArea
        />
        {/* Placeholder for the Image components required by the linter. Not visually rendered over game. */}
        <Image src={dirtyImage || "https://placehold.co/1x1.png"} alt="Superfície Suja" width={1} height={1} className="hidden" data-ai-hint={dirtyImageAiHint}/>
        <Image src={cleanImage} alt="Superfície Limpa" width={1} height={1} className="hidden" data-ai-hint={cleanImageAiHint}/>
        <Image src={spongeImage} alt="Esponja" width={1} height={1} className="hidden" data-ai-hint={spongeImageAiHint}/>

      </main>

      <GameStatusModal
        isOpen={gameState === 'won'}
        onClose={closeModalAndReset}
        title="Parabéns!"
        description="Você é o Mestre da Limpeza! Ganhou a Medalha de Limpador Número 1!"
        isWin={true}
      />
      <GameStatusModal
        isOpen={gameState === 'lost'}
        onClose={closeModalAndReset}
        title="Tempo Esgotado!"
        description="Ah, não! Seu tempo acabou. Mais sorte da próxima vez!"
        isWin={false}
      />

      <footer className="mt-12 text-center text-sm text-muted-foreground">
        <p>&copy; {new Date().getFullYear()} Desafio Faxina Total. Esfregue com vontade!</p>
      </footer>
    </div>
  );
}
