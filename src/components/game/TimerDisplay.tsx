
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
        "flex items-center justify-center space-x-1 sm:space-x-2 p-2 sm:p-3 bg-secondary text-secondary-foreground rounded-md shadow-md font-bold border border-yellow-900",
        "h-12 sm:h-14 text-sm sm:text-base", // Match button height and text size
        "justify-self-stretch", 
        className
    )}>
      <TimerIcon className="w-4 h-4 sm:w-5 sm:h-5" />
      <span className="whitespace-nowrap">
        Tempo: {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
      </span>
    </div>
  );
};

export default TimerDisplay;
