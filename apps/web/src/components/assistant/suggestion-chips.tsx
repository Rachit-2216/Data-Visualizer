'use client';

import { Button } from '@/components/ui/button';

export function SuggestionChips({
  suggestions,
  onSelect,
}: {
  suggestions: string[];
  onSelect: (value: string) => void;
}) {
  if (!suggestions.length) return null;

  return (
    <div className="flex flex-wrap gap-1.5">
      {suggestions.slice(0, 4).map((suggestion) => (
        <Button
          key={suggestion}
          variant="outline"
          size="sm"
          className="h-7 rounded-full border-white/10 bg-white/5 text-xs text-white/70 hover:bg-white/10"
          onClick={() => onSelect(suggestion)}
        >
          {suggestion}
        </Button>
      ))}
    </div>
  );
}
