
"use client";

import React from 'react';
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
import { MedalIcon, XCircleIcon, CheckCircleIcon, HelpCircleIcon } from 'lucide-react';

type GameStatus = 'levelWon' | 'lost' | 'gameOver' | 'idle' | 'playing';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void; // Primary action: Verify Phrase / Next Level / Try Again / Play Again
  title: string;
  description: string;
  status: GameStatus; 
  level?: number;
  userInputPhrase?: string;
  onPhraseChange?: (value: string) => void;
  showPhraseError?: boolean;
  expectedPhrase?: string | null; // For display or internal logic if needed
}

const GameStatusModal: React.FC<ModalProps> = ({ 
  isOpen, 
  onClose, 
  title, 
  description, 
  status, 
  level,
  userInputPhrase,
  onPhraseChange,
  showPhraseError,
  expectedPhrase
}) => {
  if (!isOpen) return null;

  const getButtonText = () => {
    if (status === 'levelWon') return "Verificar Frase";
    if (status === 'lost') return `Tentar Nível ${level} Novamente`;
    if (status === 'gameOver') return "Jogar Novamente";
    return "Continuar"; // Default, should ideally not be hit with current logic
  };

  const IconComponent = () => {
    if (status === 'levelWon') return <HelpCircleIcon className="w-16 h-16 sm:w-20 sm:h-20 text-blue-500 animate-pop" />;
    if (status === 'lost') return <XCircleIcon className="w-16 h-16 sm:w-20 sm:h-20 text-destructive animate-pop" />;
    if (status === 'gameOver') return <CheckCircleIcon className="w-16 h-16 sm:w-20 sm:h-20 text-green-500 animate-pop" />;
    return <MedalIcon className="w-16 h-16 sm:w-20 sm:h-20 text-accent animate-pop" />; // Fallback
  };
  

  return (
    <AlertDialog open={isOpen} onOpenChange={(open) => { if (!open && status !== 'levelWon') onClose(); /* Allow programmatic close for levelWon validation */}}>
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
            <Button onClick={onClose} className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-primary-foreground">
              {getButtonText()}
            </Button>
          </AlertDialogAction>
           {(status === 'levelWon' || status === 'lost') && (
             <AlertDialogCancel asChild>
               <Button variant="outline" onClick={() => {
                 if(onPhraseChange) onPhraseChange(""); // Clear phrase input on cancel
                 // For lost, onClose is restart, so this cancel would be "go to idle" or similar.
                 // Let's make cancel close modal without specific action for now
                 // Handled by onOpenChange if user clicks outside or presses Esc
               }} className="w-full sm:w-auto">
                 Fechar
               </Button>
             </AlertDialogCancel>
           )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default GameStatusModal;
