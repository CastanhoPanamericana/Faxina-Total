
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
        "flex items-center justify-center space-x-1 sm:space-x-2 p-2 sm:p-3 bg-secondary text-secondary-foreground rounded-md shadow-md font-bold border border-yellow-900",
        "h-12 sm:h-14 text-sm sm:text-base", // Match button height and text size
        "justify-self-stretch", 
        className
    )}>
      <PercentIcon className="w-4 h-4 sm:w-5 sm:h-5" />
      <span className="whitespace-nowrap">
        Limpou: {Math.round(score)}%
      </span>
    </div>
  );
};

export default ScoreDisplay;
