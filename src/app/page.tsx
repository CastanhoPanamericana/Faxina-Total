
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import GameArea from '@/components/game/GameArea';
import TimerDisplay from '@/components/game/TimerDisplay';
import ScoreDisplay from '@/components/game/ScoreDisplay';
import GameStatusModal from '@/components/game/MedalModal';
import { Button } from '@/components/ui/button';
import { RotateCcwIcon } from 'lucide-react';
import Image from 'next/image';

const BASE_INITIAL_TIME = 60; 
const CLEAN_THRESHOLD = 100; 
const LEVEL_TIME_DECREMENT = 5; 
const MIN_TIME_LIMIT = 10; 
const MAX_LEVELS = 3;

const LEVEL_SPECIFIC_DIRT_COLORS = [
  '#8B4513', // Nível 1: Marrom
  '#006400', // Nível 2: Verde Escuro
  '#8B0000', // Nível 3: Vermelho Escuro
];

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
    return Math.floor(BASE_INITIAL_TIME * 0.7); 
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
      dirtColor: LEVEL_SPECIFIC_DIRT_COLORS[index] || '#8B4513', 
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

  const dirtyImageFallback = ""; 
  const [spongeImage, setSpongeImage] = useState("https://bufalloinox.com.br/wp-content/uploads/2021/11/esponja-de-aco-inox.png");

  const dirtyImageAiHint = "fundo sujeira abstrato";
  const cleanImageAiHint = "produto limpeza bombril"; 
  const spongeImageAiHint = "esponja limpeza";


  useEffect(() => {
    const currentLevelConfig = levelConfigs[currentLevelIndex];
    setTimeLeft(currentLevelConfig.time);
    setCurrentDirtColor(currentLevelConfig.dirtColor);
    setCurrentCleanImageSrc(currentLevelConfig.cleanImageSrc);
    setResetCanvasKey(prev => prev + 1); 
    setUserInputPhrase("");
    setShowPhraseError(false);
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
  }, []);

  const handleProgressUpdate = useCallback((progress: number) => {
    setScore(progress);
    if (progress >= CLEAN_THRESHOLD && gameState === 'playing') {
      setGameState('levelWon');
    }
  }, [gameState]);
  
  const normalizePhrase = (phrase: string) => phrase.toLowerCase().trim().replace(/\s+/g, ' ');

  const handlePhraseValidation = () => {
    const expectedPhrase = levelConfigs[currentLevelIndex].unlockPhrase;
    if (normalizePhrase(userInputPhrase) === normalizePhrase(expectedPhrase)) {
      setShowPhraseError(false);
      if (currentLevelIndex < MAX_LEVELS - 1) {
        setCurrentLevelIndex(currentLevelIndex + 1);
        setGameState('playing'); 
      } else {
        setGameState('gameOver');
      }
    } else {
      setShowPhraseError(true);
    }
  };

  const closeModalAndRestartCurrentLevel = () => {
    handleStartOrRestart(currentLevelIndex);
  };

  const closeModalAndGoToIdle = () => {
     setGameState('idle');
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
        <Image 
          src="https://incentivobombril.com.br/imagens/logoGema01.png" 
          alt="Logo Game Desafio Faxina Total" 
          width={250} // Adjusted size
          height={100} // Adjusted size
          className="mx-auto h-auto w-auto max-h-[100px] sm:max-h-[120px] object-contain" // Adjusted classes for responsiveness
          priority
          data-ai-hint="game logo bombril"
        />
        {gameState !== 'gameOver' && gameState !== 'idle' && (
          <p className="text-base sm:text-lg text-foreground mt-2 sm:mt-3">
            Nível: {currentLevelNumber} - Limpe a bagunça antes que o tempo acabe!
          </p>
        )}
      </header>

      <main className="w-full max-w-2xl bg-card p-3 sm:p-5 rounded-xl shadow-lg border border-border">
        <div className="grid grid-cols-3 gap-2 sm:gap-3 items-center mb-3 sm:mb-4 w-full">
          <TimerDisplay timeLeft={timeLeft} />
          
          <div className="flex justify-center w-full">
            {gameState === 'idle' && (
              <Button 
                onClick={initialGameStart} 
                className="bg-accent hover:bg-accent/90 text-accent-foreground shadow-md w-full h-12 sm:h-14 flex items-center justify-center text-lg sm:text-xl font-bold rounded-md border border-yellow-700"
              >
                PLAY
              </Button>
            )}
            { (gameState === 'playing' || gameState === 'levelWon' || gameState === 'lost' || gameState === 'gameOver') && (
               <Button 
                  onClick={() => {
                    if (gameState === 'gameOver') {
                      handleStartOrRestart(0);
                    } else { 
                       handleStartOrRestart(currentLevelIndex);
                    }
                  }}
                  variant="secondary" // Use secondary for brown style
                  className="shadow-md whitespace-nowrap w-full h-12 sm:h-14 flex items-center justify-center text-sm sm:text-base font-semibold rounded-md border border-yellow-900"
               >
                <RotateCcwIcon className="mr-2 h-4 w-4 sm:h-5 sm:w-5" /> 
                {gameState === 'gameOver' ? 'Jogar Novamente' : `Reiniciar Nível ${currentLevelNumber}`}
              </Button>
            )}
          </div>
          <ScoreDisplay score={score} />
        </div>
        
        <div className="relative w-full max-w-2xl aspect-[4/3] mx-auto rounded-lg overflow-hidden border border-border">
            <GameArea
              key={resetCanvasKey}
              onProgressUpdate={handleProgressUpdate}
              onCleaningComplete={() => { /* Covered by onProgressUpdate */ }}
              dirtyImageSrc={dirtyImageFallback}
              cleanImageSrc={currentCleanImageSrc}
              spongeImageSrc={spongeImage}
              isGameActive={gameState === 'playing'}
              isIdle={gameState === 'idle'}
              resetCanvas={resetCanvasKey > 0} 
              currentDirtColor={currentDirtColor}
            />
        </div>

        <Image src={dirtyImageFallback || "https://placehold.co/1x1.png"} alt="Superfície Suja Fallback" width={1} height={1} className="hidden" data-ai-hint={dirtyImageAiHint}/>
        <Image src={currentCleanImageSrc} alt="Superfície Limpa Nível Atual" width={1} height={1} className="hidden" data-ai-hint={cleanImageAiHint}/>
        <Image src={spongeImage} alt="Esponja" width={1} height={1} className="hidden" data-ai-hint={spongeImageAiHint}/>

      </main>

      <GameStatusModal
        isOpen={gameState === 'levelWon' || gameState === 'lost' || gameState === 'gameOver'}
        onClose={ 
          gameState === 'levelWon' ? handlePhraseValidation : 
          gameState === 'lost' ? closeModalAndRestartCurrentLevel : 
          closeModalAndGoToIdle 
        }
        onSecondaryAction={
          (status) => {
            if (status === 'levelWon') { 
              handleStartOrRestart(currentLevelIndex);
            } else if (status === 'lost') { 
              setGameState('idle'); 
            } else if (status === 'gameOver') {
              setGameState('idle');
              handleStartOrRestart(0);
            }
          }
        }
        title={
          gameState === 'levelWon' ? `Nível ${currentLevelNumber} Completo!` :
          gameState === 'lost' ? "Tempo Esgotado!" :
          "Parabéns!"
        }
        description={
          gameState === 'levelWon' ? `Digite a frase secreta para desbloquear o próximo nível. Anotou a frase?` :
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
