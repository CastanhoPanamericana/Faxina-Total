"use client";

import React from 'react';
import { TimerIcon } from 'lucide-react';

interface TimerDisplayProps {
  timeLeft: number;
}

const TimerDisplay: React.FC<TimerDisplayProps> = ({ timeLeft }) => {
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  return (
    <div className="flex items-center space-x-2 p-3 bg-secondary text-secondary-foreground rounded-lg shadow-md font-body">
      <TimerIcon className="w-6 h-6 text-primary animate-pulse" />
      <span className="text-xl font-semibold">
        Time: {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
      </span>
    </div>
  );
};

export default TimerDisplay;
