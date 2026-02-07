'use client';

import { useEffect, useRef } from 'react';
import type { ChatMessage } from '@/store/chat-store';
import { MessageBubble } from './message-bubble';

function TypingIndicator() {
  return (
    <div className="flex items-center gap-2 text-xs text-white/50">
      <span className="h-2 w-2 rounded-full bg-white/40 animate-pulse" />
      <span className="h-2 w-2 rounded-full bg-white/40 animate-pulse" />
      <span className="h-2 w-2 rounded-full bg-white/40 animate-pulse" />
      <span>Assistant is typing...</span>
    </div>
  );
}

export function MessageList({
  messages,
  isStreaming,
}: {
  messages: ChatMessage[];
  isStreaming: boolean;
}) {
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isStreaming]);

  return (
    <div className="space-y-4">
      {messages.length === 0 && (
        <div className="rounded-lg bg-white/5 p-4 text-sm text-white/70">
          Hi! I&apos;m your data assistant. Ask me to create charts or analyze your dataset.
        </div>
      )}
      {messages.map((message) => (
        <MessageBubble key={message.id} message={message} />
      ))}
      {isStreaming && <TypingIndicator />}
      <div ref={bottomRef} />
    </div>
  );
}
