"use client";

import React, { useEffect, useRef } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { MedalIcon, XCircleIcon, CheckCircleIcon, TrophyIcon, RotateCcwIcon } from 'lucide-react';

type GameStatus = 'levelWon' | 'lost' | 'gameOver' | 'idle' | 'playing';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSecondaryAction?: (status: GameStatus) => void;
  title: string;
  description: string;
  status: GameStatus;
  level?: number;
  secretPhrase?: string | null;
}

const GameStatusModal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  onSecondaryAction,
  title,
  description,
  status,
  level,
  secretPhrase
}) => {
  const actionTakenByButtonRef = useRef(false);

  useEffect(() => {
    if (isOpen) {
      actionTakenByButtonRef.current = false;
    }
  }, [isOpen, status]); 

  if (!isOpen) return null;

  const getButtonText = () => {
    if (status === 'levelWon') return "Continuar";
    if (status === 'lost') return `Tentar Nível ${level} Novamente`;
    if (status === 'gameOver') return "Jogar Novamente";
    return "Continuar";
  };

  const getSecondaryButtonText = () => {
    if (status === 'levelWon') return "Jogar Nível Novamente";
    if (status === 'lost') return "Sair";
    return "Fechar";
  };

  const IconComponent = () => {
    if (status === 'levelWon') return <TrophyIcon className="w-16 h-16 sm:w-20 sm:h-20 text-accent animate-pop" />;
    if (status === 'lost') return <XCircleIcon className="w-16 h-16 sm:w-20 sm:h-20 text-destructive animate-pop" />;
    if (status === 'gameOver') return <CheckCircleIcon className="w-16 h-16 sm:w-20 sm:h-20 text-green-500 animate-pop" />;
    return <MedalIcon className="w-16 h-16 sm:w-20 sm:h-20 text-accent animate-pop" />;
  };

  const handleModalOpenChange = (openValue: boolean) => {
    if (!openValue) { 
      if (actionTakenByButtonRef.current) {
        // Button handled the action.
      } else if (onSecondaryAction) {
        if (status === 'levelWon' || status === 'lost' || status === 'gameOver') {
          onSecondaryAction(status);
        } else {
          onClose(); 
        }
      } else {
        onClose();
      }
      actionTakenByButtonRef.current = false;
    }
  };


  return (
    <AlertDialog open={isOpen} onOpenChange={handleModalOpenChange}>
      <AlertDialogContent className="font-body w-[90vw] max-w-md">
        <AlertDialogHeader>
          <div className="flex justify-center mb-3 sm:mb-4">
            <IconComponent />
          </div>
          <AlertDialogTitle className="text-center text-xl sm:text-2xl font-headline">{title}</AlertDialogTitle>
          <AlertDialogDescription className="text-center text-sm sm:text-md">
            {description}
          </AlertDialogDescription>
        </AlertDialogHeader>

        {status === 'levelWon' && secretPhrase && (
          <div className="my-3 sm:my-4 p-3 bg-muted rounded-lg text-center">
            <p className="text-base sm:text-lg font-bold text-muted-foreground">
              "{secretPhrase}"
            </p>
          </div>
        )}

        <AlertDialogFooter className="mt-3 sm:mt-4 flex flex-col sm:flex-row sm:justify-center gap-2">
          <AlertDialogAction asChild>
            <Button
              onClick={() => {
                actionTakenByButtonRef.current = true;
                onClose();
              }}
              className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              {getButtonText()}
            </Button>
          </AlertDialogAction>
           {(status === 'levelWon' || status === 'lost') && onSecondaryAction && (
             <AlertDialogCancel asChild>
               <Button
                 variant="outline"
                 onClick={() => {
                   actionTakenByButtonRef.current = true;
                   onSecondaryAction(status);
                 }}
                 className="w-full sm:w-auto"
               >
                 {status === 'levelWon' && <RotateCcwIcon className="mr-2 h-4 w-4" />}
                 {getSecondaryButtonText()}
               </Button>
             </AlertDialogCancel>
           )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default GameStatusModal;
