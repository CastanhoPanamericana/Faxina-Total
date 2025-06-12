
"use client";

import React from 'react';
import { TimerIcon } from 'lucide-react';
import { cn } from "@/lib/utils";

interface TimerDisplayProps {
  timeLeft: number;
  className?: string;
}

const TimerDisplay: React.FC<TimerDisplayProps> = ({ timeLeft, className }) => {
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  return (
    <div className={cn(
        "flex items-center justify-center space-x-2 p-3 sm:p-4 bg-secondary text-secondary-foreground rounded-lg shadow-md font-body border-2 border-primary/40",
        className
    )}>
      <TimerIcon className="w-5 h-5 sm:w-6 sm:h-6 text-primary animate-pulse" />
      <span className="text-lg sm:text-xl font-semibold whitespace-nowrap">
        Tempo: {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
      </span>
    </div>
  );
};

export default TimerDisplay;
