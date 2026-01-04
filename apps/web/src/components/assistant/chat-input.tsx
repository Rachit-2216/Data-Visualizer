'use client';

import { FormEvent, useState } from 'react';
import { Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export function ChatInput({
  disabled,
  onSend,
}: {
  disabled?: boolean;
  onSend: (value: string) => void;
}) {
  const [input, setInput] = useState('');

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!input.trim()) return;
    onSend(input.trim());
    setInput('');
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <Input
        value={input}
        onChange={(event) => setInput(event.target.value)}
        placeholder="Ask about your data..."
        className="flex-1 bg-black/40 border-white/10 text-white placeholder:text-white/40"
        disabled={disabled}
      />
      <Button type="submit" size="icon" disabled={!input.trim() || disabled}>
        <Send className="h-4 w-4" />
      </Button>
    </form>
  );
}
