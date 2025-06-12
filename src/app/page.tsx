
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import GameArea from '@/components/game/GameArea';
import TimerDisplay from '@/components/game/TimerDisplay';
import ScoreDisplay from '@/components/game/ScoreDisplay';
import GameStatusModal from '@/components/game/MedalModal';
import { Button } from '@/components/ui/button';
import { PlayIcon, RotateCcwIcon } from 'lucide-react';
import Image from 'next/image';

const BASE_INITIAL_TIME = 60; 
const CLEAN_THRESHOLD = 100; 
const LEVEL_TIME_DECREMENT = 5; 
const MIN_TIME_LIMIT = 10; 
const MAX_LEVELS = 3;

const DIRT_COLORS = ['#8B4513', '#7A3D12', '#693310', '#582A0E', '#47210C', '#6B8E23', '#556B2F', '#8FBC8F', '#2E8B57', '#3CB371'];

interface LevelDefinition {
  levelNumber: number;
  cleanImageSrc: string;
  unlockPhrase: string;
  time: number;
  dirtColor: string;
}

const levelDetails: Omit<LevelDefinition, 'time' | 'levelNumber' | 'dirtColor'>[] = [
  { cleanImageSrc: "http://incentivobombril.com.br/imagens/bombrilgame01.jpeg", unlockPhrase: "Não machuca as mãos" },
  { cleanImageSrc: "http://incentivobombril.com.br/imagens/bombrilgame02.jpeg", unlockPhrase: "sinônimo de categoria" },
  { cleanImageSrc: "http://incentivobombril.com.br/imagens/bombrilgame03.jpeg", unlockPhrase: "esponja de aço é bombril" },
];

const calculateTimeForLevel = (level: number): number => {
  if (level === 1) {
    return Math.floor(BASE_INITIAL_TIME * 0.7); // 30% reduction for level 1
  }
  const timeAfterDecrement = Math.floor(BASE_INITIAL_TIME * 0.7) - (level - 1) * LEVEL_TIME_DECREMENT;
  return Math.max(MIN_TIME_LIMIT, timeAfterDecrement);
};

const generateLevelConfigs = (): LevelDefinition[] => {
  return levelDetails.map((detail, index) => {
    const levelNumber = index + 1;
    return {
      ...detail,
      levelNumber,
      time: calculateTimeForLevel(levelNumber),
      dirtColor: DIRT_COLORS[index % DIRT_COLORS.length],
    };
  });
};

const levelConfigs = generateLevelConfigs();

type GameState = 'idle' | 'playing' | 'levelWon' | 'lost' | 'gameOver';

export default function CleanSweepPage() {
  const [gameState, setGameState] = useState<GameState>('idle');
  const [timeLeft, setTimeLeft] = useState(levelConfigs[0].time);
  const [score, setScore] = useState(0);
  const [resetCanvasKey, setResetCanvasKey] = useState(0);
  const [currentLevelIndex, setCurrentLevelIndex] = useState(0);
  
  const [currentDirtColor, setCurrentDirtColor] = useState(levelConfigs[0].dirtColor);
  const [currentCleanImageSrc, setCurrentCleanImageSrc] = useState(levelConfigs[0].cleanImageSrc);
  const [userInputPhrase, setUserInputPhrase] = useState("");
  const [showPhraseError, setShowPhraseError] = useState(false);

  const dirtyImageFallback = ""; // To trigger fallback dirt color
  const [spongeImage, setSpongeImage] = useState("https://bufalloinox.com.br/wp-content/uploads/2021/11/esponja-de-aco-inox.png");

  const dirtyImageAiHint = "fundo sujeira abstrato";
  const cleanImageAiHint = "produto limpeza bombril"; // Generic hint for changing images
  const spongeImageAiHint = "esponja limpeza";


  useEffect(() => {
    const currentLevelConfig = levelConfigs[currentLevelIndex];
    setTimeLeft(currentLevelConfig.time);
    setCurrentDirtColor(currentLevelConfig.dirtColor);
    setCurrentCleanImageSrc(currentLevelConfig.cleanImageSrc);
  }, [currentLevelIndex]);

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

  const handleStartOrRestart = useCallback((targetLevelIndex: number) => {
    setCurrentLevelIndex(targetLevelIndex);
    setScore(0);
    setUserInputPhrase("");
    setShowPhraseError(false);
    setGameState('playing');
    setResetCanvasKey(prev => prev + 1);
    // Time, dirt color, and clean image are set by the useEffect listening to currentLevelIndex
  }, []);

  const handleProgressUpdate = useCallback((progress: number) => {
    setScore(progress);
    if (progress >= CLEAN_THRESHOLD && gameState === 'playing') {
      setGameState('levelWon');
    }
  }, [gameState, CLEAN_THRESHOLD]);
  
  const normalizePhrase = (phrase: string) => phrase.toLowerCase().trim().replace(/\s+/g, ' ');

  const handlePhraseValidation = () => {
    const expectedPhrase = levelConfigs[currentLevelIndex].unlockPhrase;
    if (normalizePhrase(userInputPhrase) === normalizePhrase(expectedPhrase)) {
      setShowPhraseError(false);
      if (currentLevelIndex < MAX_LEVELS - 1) {
        handleStartOrRestart(currentLevelIndex + 1);
      } else {
        setGameState('gameOver');
      }
    } else {
      setShowPhraseError(true);
    }
  };

  const closeModalAndRestartCurrentLevel = () => {
    setGameState('idle'); // Go to idle, then restart
    handleStartOrRestart(currentLevelIndex);
  };

  const closeModalAndGoToIdle = () => {
     setGameState('idle');
     setUserInputPhrase("");
     setShowPhraseError(false);
     // If game over, and user clicks "Jogar Novamente", start from level 0
     if (gameState === 'gameOver') {
        handleStartOrRestart(0);
     }
  };
  
  const initialGameStart = () => {
    handleStartOrRestart(0); 
  };

  const currentLevelNumber = levelConfigs[currentLevelIndex].levelNumber;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background p-4 sm:p-6 md:p-8 font-body">
      <header className="mb-4 md:mb-6 text-center">
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-headline text-primary drop-shadow-md">Desafio Faxina Total</h1>
        {gameState !== 'gameOver' && (
          <p className="text-base sm:text-lg text-foreground mt-1 sm:mt-2">
            Nível: {currentLevelNumber} - Limpe a bagunça antes que o tempo acabe!
          </p>
        )}
      </header>

      <main className="w-full max-w-4xl bg-card p-3 sm:p-6 rounded-xl shadow-2xl">
        <div className="flex flex-col sm:flex-row justify-around items-center mb-4 sm:mb-6 space-y-3 sm:space-y-0 sm:space-x-4">
          <TimerDisplay timeLeft={timeLeft} />
          {gameState === 'idle' && (
            <Button onClick={initialGameStart} size="lg" className="bg-accent hover:bg-accent/90 text-accent-foreground shadow-md animate-pulse w-full sm:w-auto">
              <PlayIcon className="mr-2 h-5 w-5 sm:h-6 sm:w-6" /> Começar Jogo
            </Button>
          )}
          { (gameState === 'playing' || gameState === 'levelWon' || gameState === 'lost' || gameState === 'gameOver') && (
             <Button 
                onClick={() => handleStartOrRestart(gameState === 'gameOver' ? 0 : currentLevelIndex)} 
                size="lg" 
                variant="outline" 
                className="border-primary text-primary hover:bg-primary/10 shadow-md w-full sm:w-auto"
             >
              <RotateCcwIcon className="mr-2 h-5 w-5 sm:h-6 sm:w-6" /> 
              {gameState === 'gameOver' ? 'Jogar Novamente' : `Reiniciar Nível ${currentLevelNumber}`}
            </Button>
          )}
          <ScoreDisplay score={score} />
        </div>

        <GameArea
          key={resetCanvasKey}
          onProgressUpdate={handleProgressUpdate}
          onCleaningComplete={() => { /* Covered by onProgressUpdate */ }}
          dirtyImageSrc={dirtyImageFallback}
          cleanImageSrc={currentCleanImageSrc}
          spongeImageSrc={spongeImage}
          isGameActive={gameState === 'playing'}
          resetCanvas={resetCanvasKey > 0}
          currentDirtColor={currentDirtColor}
        />
        <Image src={dirtyImageFallback || "https://placehold.co/1x1.png"} alt="Superfície Suja Fallback" width={1} height={1} className="hidden" data-ai-hint={dirtyImageAiHint}/>
        <Image src={currentCleanImageSrc} alt="Superfície Limpa Nível Atual" width={1} height={1} className="hidden" data-ai-hint={cleanImageAiHint}/>
        <Image src={spongeImage} alt="Esponja" width={1} height={1} className="hidden" data-ai-hint={spongeImageAiHint}/>

      </main>

      <GameStatusModal
        isOpen={gameState === 'levelWon' || gameState === 'lost' || gameState === 'gameOver'}
        onClose={
          gameState === 'levelWon' ? handlePhraseValidation : 
          gameState === 'lost' ? closeModalAndRestartCurrentLevel : 
          closeModalAndGoToIdle // For Game Over "Jogar Novamente"
        }
        title={
          gameState === 'levelWon' ? `Nível ${currentLevelNumber} Completo!` :
          gameState === 'lost' ? "Tempo Esgotado!" :
          "Parabéns!"
        }
        description={
          gameState === 'levelWon' ? `Digite a frase secreta para desbloquear o próximo nível:` :
          gameState === 'lost' ? `Ah, não! Seu tempo acabou. Tente novamente o nível ${currentLevelNumber}!` :
          "Você sabe tudo de Bombril!"
        }
        status={gameState}
        level={currentLevelNumber}
        userInputPhrase={userInputPhrase}
        onPhraseChange={setUserInputPhrase}
        showPhraseError={showPhraseError}
        expectedPhrase={gameState === 'levelWon' ? levelConfigs[currentLevelIndex].unlockPhrase : null}
      />

      <footer className="mt-6 md:mt-10 text-center text-xs sm:text-sm text-muted-foreground">
        <p>&copy; {new Date().getFullYear()} Desafio Faxina Total. Esfregue com vontade!</p>
      </footer>
    </div>
  );
}
