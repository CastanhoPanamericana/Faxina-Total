
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
import { Input } from "@/components/ui/input";
import { MedalIcon, XCircleIcon, CheckCircleIcon, HelpCircleIcon, RotateCcwIcon } from 'lucide-react';

type GameStatus = 'levelWon' | 'lost' | 'gameOver' | 'idle' | 'playing';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSecondaryAction?: (status: GameStatus) => void;
  title: string;
  description: string;
  status: GameStatus;
  level?: number;
  userInputPhrase?: string;
  onPhraseChange?: (value: string) => void;
  showPhraseError?: boolean;
  expectedPhrase?: string | null;
}

const GameStatusModal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  onSecondaryAction,
  title,
  description,
  status,
  level,
  userInputPhrase,
  onPhraseChange,
  showPhraseError,
  expectedPhrase
}) => {
  const actionTakenByButtonRef = useRef(false);

  useEffect(() => {
    if (isOpen) {
      actionTakenByButtonRef.current = false; // Reset when modal opens or its state changes while open
    }
  }, [isOpen, status]); // Also reset if status changes while modal is open

  if (!isOpen) return null;

  const getButtonText = () => {
    if (status === 'levelWon') return "Verificar Frase";
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
    if (status === 'levelWon') return <HelpCircleIcon className="w-16 h-16 sm:w-20 sm:h-20 text-blue-500 animate-pop" />;
    if (status === 'lost') return <XCircleIcon className="w-16 h-16 sm:w-20 sm:h-20 text-destructive animate-pop" />;
    if (status === 'gameOver') return <CheckCircleIcon className="w-16 h-16 sm:w-20 sm:h-20 text-green-500 animate-pop" />;
    return <MedalIcon className="w-16 h-16 sm:w-20 sm:h-20 text-accent animate-pop" />;
  };

  const handleModalOpenChange = (openValue: boolean) => {
    if (!openValue) { // Dialog is closing
      if (actionTakenByButtonRef.current) {
        // A button was clicked, its onClick handler already managed the action.
        // The ref is reset when the modal opens/status changes.
      } else if (onSecondaryAction) {
        // No button was clicked, so it's an ESC or Overlay dismissal.
        // Trigger the secondary action.
        if (status === 'levelWon' || status === 'lost' || status === 'gameOver') {
          onSecondaryAction(status);
        } else {
          // Fallback if status is unexpected, or no secondary action for it
          onClose(); // Default close action
        }
      } else {
        // No onSecondaryAction defined, default to onClose for ESC/Overlay.
        onClose();
      }
      // Reset ref after handling close, regardless of how it was initiated, for next modal cycle.
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
            {status === 'levelWon' && expectedPhrase && (
              <p className="mt-2 text-xs text-muted-foreground">
                Dica: A frase é "{expectedPhrase}". Anote para não esquecer!
              </p>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>

        {status === 'levelWon' && onPhraseChange && (
          <div className="my-3 sm:my-4 space-y-2">
            <Input
              type="text"
              placeholder="Digite a frase secreta aqui..."
              value={userInputPhrase}
              onChange={(e) => onPhraseChange(e.target.value)}
              className="text-base"
            />
            {showPhraseError && (
              <p className="text-destructive text-xs sm:text-sm text-center">Frase incorreta. Tente novamente!</p>
            )}
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
