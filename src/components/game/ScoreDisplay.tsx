
"use client";

import React from 'react';
import { PercentIcon } from 'lucide-react';
import { cn } from "@/lib/utils";

interface ScoreDisplayProps {
  score: number;
  className?: string;
}

const ScoreDisplay: React.FC<ScoreDisplayProps> = ({ score, className }) => {
  return (
    <div className={cn(
        "flex items-center justify-center space-x-2 p-3 sm:p-4 bg-secondary text-secondary-foreground rounded-lg shadow-md font-body border-2 border-primary/40",
        "justify-self-stretch", // Ensure it stretches in a grid cell
        className
    )}>
      <PercentIcon className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
      <span className="text-lg sm:text-xl font-semibold whitespace-nowrap">
        Limpou: {Math.round(score)}%
      </span>
    </div>
  );
};

export default ScoreDisplay;
