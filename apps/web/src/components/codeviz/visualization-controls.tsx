'use client';

import { Pause, Play, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { CodeVizMode } from '@/store/codeviz-store';

type ControlsProps = {
  mode: CodeVizMode;
  isAnimating: boolean;
  onModeChange: (mode: CodeVizMode) => void;
  onToggleAnimation: () => void;
  onReset: () => void;
};

export function VisualizationControls({
  mode,
  isAnimating,
  onModeChange,
  onToggleAnimation,
  onReset,
}: ControlsProps) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-1 rounded-full border border-white/10 bg-white/5 p-1 text-xs">
        {(['graph', 'stack', '3d'] as CodeVizMode[]).map((item) => (
          <button
            key={item}
            className={`px-3 py-1 rounded-full ${
              mode === item ? 'bg-cyan-400/20 text-cyan-100' : 'text-white/60'
            }`}
            onClick={() => onModeChange(item)}
          >
            {item.toUpperCase()}
          </button>
        ))}
      </div>
      <Button
        variant="outline"
        size="icon"
        className="h-9 w-9 border-white/10"
        onClick={onToggleAnimation}
      >
        {isAnimating ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
      </Button>
      <Button
        variant="outline"
        size="icon"
        className="h-9 w-9 border-white/10"
        onClick={onReset}
      >
        <RotateCcw className="h-4 w-4" />
      </Button>
    </div>
  );
}

