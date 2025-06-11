"use client";

import React from 'react';
import { PercentIcon } from 'lucide-react'; // Changed from StarIcon for better representation of percentage

interface ScoreDisplayProps {
  score: number;
}

const ScoreDisplay: React.FC<ScoreDisplayProps> = ({ score }) => {
  return (
    <div className="flex items-center space-x-2 p-3 bg-secondary text-secondary-foreground rounded-lg shadow-md font-body">
      <PercentIcon className="w-6 h-6 text-primary" />
      <span className="text-xl font-semibold">
        Cleaned: {Math.round(score)}%
      </span>
    </div>
  );
};

export default ScoreDisplay;
