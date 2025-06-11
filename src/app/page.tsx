"use client";

import React, { useState, useEffect, useCallback } from 'react';
import GameArea from '@/components/game/GameArea';
import TimerDisplay from '@/components/game/TimerDisplay';
import ScoreDisplay from '@/components/game/ScoreDisplay';
import GameStatusModal from '@/components/game/MedalModal';
import { Button } from '@/components/ui/button';
import { PlayIcon, RotateCcwIcon } from 'lucide-react';
import Image from 'next/image';


const INITIAL_TIME = 60; // 60 seconds
const CLEAN_THRESHOLD = 99; // 99% to win

type GameState = 'idle' | 'playing' | 'won' | 'lost';

export default function CleanSweepPage() {
  const [gameState, setGameState] = useState<GameState>('idle');
  const [timeLeft, setTimeLeft] = useState(INITIAL_TIME);
  const [score, setScore] = useState(0);
  const [resetCanvasKey, setResetCanvasKey] = useState(0); // Used to trigger canvas reset

  const dirtyImage = "https://placehold.co/800x600/A0522D/FFFFFF.png?text=Dirty+Kitchen\\n(Sink+%26+Stove)";
  const dirtyImageAiHint = "dirty kitchen sink stove cartoon";

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
    setResetCanvasKey(prev => prev + 1); // Trigger canvas reset in GameArea
  };

  const handleProgressUpdate = useCallback((progress: number) => {
    setScore(progress);
    if (progress >= CLEAN_THRESHOLD && gameState === 'playing') {
      setGameState('won');
    }
  }, [gameState]);

  const handleCleaningComplete = useCallback(() => {
     // This is called when GameArea thinks cleaning is 100% visually
     // The final win condition check is handled by handleProgressUpdate
     if (gameState === 'playing' && score >= CLEAN_THRESHOLD) {
       setGameState('won');
     }
  }, [gameState, score]);

  const closeModalAndReset = () => {
    setGameState('idle');
    startGame(); // Or just set to idle and let user click start
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background p-4 sm:p-8 font-body">
      <header className="mb-8 text-center">
        <h1 className="text-5xl font-headline text-primary drop-shadow-md">Clean Sweep Challenge</h1>
        <p className="text-lg text-foreground mt-2">Clean the mess before time runs out!</p>
      </header>

      <main className="w-full max-w-4xl bg-card p-6 rounded-xl shadow-2xl">
        <div className="flex flex-col sm:flex-row justify-around items-center mb-6 space-y-4 sm:space-y-0 sm:space-x-4">
          <TimerDisplay timeLeft={timeLeft} />
          {gameState === 'idle' && (
            <Button onClick={startGame} size="lg" className="bg-accent hover:bg-accent/90 text-accent-foreground shadow-md animate-pulse">
              <PlayIcon className="mr-2 h-6 w-6" /> Start Game
            </Button>
          )}
          { (gameState === 'playing' || gameState === 'won' || gameState === 'lost') && (
             <Button onClick={startGame} size="lg" variant="outline" className="border-primary text-primary hover:bg-primary/10 shadow-md">
              <RotateCcwIcon className="mr-2 h-6 w-6" /> Restart Game
            </Button>
          )}
          <ScoreDisplay score={score} />
        </div>
        
        <GameArea
          key={resetCanvasKey} // Force re-render GameArea to reset canvas
          onProgressUpdate={handleProgressUpdate}
          onCleaningComplete={handleCleaningComplete}
          dirtyImageSrc={dirtyImage}
          isGameActive={gameState === 'playing'}
          resetCanvas={resetCanvasKey > 0} // Signal explicit reset
        />
        {/* Placeholder for the Image component required by the linter. Not visually rendered over game. */}
        <Image src={dirtyImage} alt="Dirty Surface" width={1} height={1} className="hidden" data-ai-hint={dirtyImageAiHint}/>

      </main>

      <GameStatusModal
        isOpen={gameState === 'won'}
        onClose={closeModalAndReset}
        title="Congratulations!"
        description="You're the Top Cleaner! You've earned the Number 1 Cleaner Medal!"
        isWin={true}
      />
      <GameStatusModal
        isOpen={gameState === 'lost'}
        onClose={closeModalAndReset}
        title="Time's Up!"
        description="Oh no, you ran out of time. Better luck next time!"
        isWin={false}
      />
      
      <footer className="mt-12 text-center text-sm text-muted-foreground">
        <p>&copy; {new Date().getFullYear()} Clean Sweep Challenge. Get scrubbing!</p>
      </footer>
    </div>
  );
}
