
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import GameArea from '@/components/game/GameArea';
import TimerDisplay from '@/components/game/TimerDisplay';
import ScoreDisplay from '@/components/game/ScoreDisplay';
import GameStatusModal from '@/components/game/MedalModal';
import { Button } from '@/components/ui/button';
import { RotateCcwIcon, ArrowLeft } from 'lucide-react';
import Image from 'next/image';

const BASE_INITIAL_TIME = 72; 
const CLEAN_THRESHOLD = 100; 
const LEVEL_TIME_DECREMENT = 5; 
const MIN_TIME_LIMIT = 10; 
const MAX_LEVELS = 6; 

const LEVEL_SPECIFIC_DIRT_COLORS = [
  '#8B4513', // Nível 1: Marrom
  '#006400', // Nível 2: Verde
  '#8B0000', // Nível 3: Vermelho Escuro
  '#800080', // Nível 4: Roxo
  '#FFA500', // Nível 5: Laranja
  '#00008B', // Nível 6: Azul Escuro
];

interface LevelDefinition {
  levelNumber: number;
  cleanImageSrc: string;
  unlockPhrase: string;
  time: number;
  dirtColor: string;
}

const levelDetails: Omit<LevelDefinition, 'time' | 'levelNumber' | 'dirtColor'>[] = [
  { cleanImageSrc: "https://incentivobombril.com.br/imagens/tela1.png", unlockPhrase: "não machuca as mãos" },
  { cleanImageSrc: "https://incentivobombril.com.br/imagens/tela2.png", unlockPhrase: "sinônimo de categoria" },
  { cleanImageSrc: "https://incentivobombril.com.br/imagens/tela3.png", unlockPhrase: "esponja de aço é bombril" },
  { cleanImageSrc: "http://incentivobombril.com.br/imagens/limpadores1.png", unlockPhrase: "Limpa, perfuma e dá brilho" },
  { cleanImageSrc: "http://incentivobombril.com.br/imagens/limpadores2.png", unlockPhrase: "5 fragrâncias exclusivas" },
  { cleanImageSrc: "http://incentivobombril.com.br/imagens/limpadores3.png", unlockPhrase: "Embalagem inspirada em um diamante" },
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
  const [spongeImage, setSpongeImage] = useState("https://bufalloinox.com.br/wp-content/uploads/2021/11/esponja-de-aco-inox.png");

  const dirtyImageFallback = ""; 

  const dirtyImageAiHint = "fundo sujeira abstrato";
  const cleanImageAiHint = "produto limpeza bombril"; 
  const spongeImageAiHint = "esponja limpeza";

  useEffect(() => {
    if (currentLevelIndex >= 3) { // Níveis 4, 5, 6 (índice 3, 4, 5)
      setSpongeImage("http://incentivobombril.com.br/imagens/limpol.png");
    } else {
      setSpongeImage("https://bufalloinox.com.br/wp-content/uploads/2021/11/esponja-de-aco-inox.png");
    }
  }, [currentLevelIndex]);


  useEffect(() => {
    const currentLevelConfig = levelConfigs[currentLevelIndex];
    setTimeLeft(currentLevelConfig.time);
    setCurrentDirtColor(currentLevelConfig.dirtColor);
    setCurrentCleanImageSrc(currentLevelConfig.cleanImageSrc);
    setResetCanvasKey(prev => prev + 1); 
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
    setGameState('playing');
  }, []);

  const handleProgressUpdate = useCallback((progress: number) => {
    setScore(progress);
    if (progress >= CLEAN_THRESHOLD && gameState === 'playing') {
      setGameState('levelWon');
    }
  }, [gameState]);
  
  const goToNextLevelOrEndGame = () => {
    if (currentLevelIndex < MAX_LEVELS - 1) {
      setCurrentLevelIndex(currentLevelIndex + 1);
      setGameState('playing'); 
    } else {
      setGameState('gameOver');
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
      <header className="w-full max-w-2xl mb-4 md:mb-6 grid grid-cols-[1fr_auto_1fr] gap-4 items-center">
        <div className="justify-self-start">
            <Button asChild variant="default" className="bg-accent hover:bg-accent/90 text-accent-foreground">
              <a href="https://incentivobombril.com.br/course/view.php?id=2" className="flex items-center">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  <span>Voltar</span>
              </a>
            </Button>
        </div>
        <div className="flex flex-col items-center text-center">
          <Image 
            src="https://incentivobombril.com.br/imagens/logoGema01.png" 
            alt="Logo Game Desafio Faxina Total" 
            width={250 * 1.5} 
            height={100 * 1.5}
            className="h-auto w-auto max-h-[150px] sm:max-h-[180px] object-contain" 
            priority
            data-ai-hint="game logo bombril"
          />
          {gameState !== 'gameOver' && gameState !== 'idle' && (
            <p className="text-base sm:text-lg text-foreground mt-2 sm:mt-3">
              Nível: {currentLevelNumber} - Limpe a bagunça antes que o tempo acabe!
            </p>
          )}
        </div>
        <div /> {/* Spacer for the grid to keep the logo centered */}
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
                  variant="secondary" 
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
          gameState === 'levelWon' ? goToNextLevelOrEndGame : 
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
          gameState === 'levelWon' ? "Parabéns, você limpou a sujeira e descobriu a frase secreta:" :
          gameState === 'lost' ? `Ah, não! Seu tempo acabou. Tente novamente o nível ${currentLevelNumber}!` :
          "Você sabe tudo de Bombril!"
        }
        status={gameState}
        level={currentLevelNumber}
        secretPhrase={gameState === 'levelWon' ? levelConfigs[currentLevelIndex].unlockPhrase : null}
      />

      <footer className="mt-6 md:mt-10 text-center text-xs sm:text-sm text-muted-foreground flex flex-col items-center gap-4">
        <Button asChild variant="default" className="bg-accent hover:bg-accent/90 text-accent-foreground">
          <a href="https://incentivobombril.com.br/course/view.php?id=2">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </a>
        </Button>
        <p>&copy; {new Date().getFullYear()} Desafio Faxina Total. Esfregue com vontade!</p>
      </footer>
    </div>
  );
}
