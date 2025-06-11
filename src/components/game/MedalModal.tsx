
"use client";

import React from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { MedalIcon, XCircleIcon } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description: string;
  isWin: boolean;
  level?: number; // Adicionado para lógica de níveis
}

const GameStatusModal: React.FC<ModalProps> = ({ isOpen, onClose, title, description, isWin, level }) => {
  if (!isOpen) return null;

  const buttonText = () => {
    if (isWin) {
      return "Próximo Nível";
    }
    return "Tentar Novamente";
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent className="font-body">
        <AlertDialogHeader>
          <div className="flex justify-center mb-4">
            {isWin ? (
              <MedalIcon className="w-20 h-20 text-accent animate-pop" />
            ) : (
              <XCircleIcon className="w-20 h-20 text-destructive animate-pop" />
            )}
          </div>
          <AlertDialogTitle className="text-center text-2xl font-headline">{title}</AlertDialogTitle>
          <AlertDialogDescription className="text-center text-md">
            {description}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="mt-4">
          <AlertDialogAction asChild>
            <Button onClick={onClose} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
              {buttonText()}
            </Button>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default GameStatusModal;

    