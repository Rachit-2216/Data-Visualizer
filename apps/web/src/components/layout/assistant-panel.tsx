'use client';

import { useEffect } from 'react';
import { Sparkles, X, Wand2, RotateCcw, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useLayoutStore } from '@/store/layout-store';
import { useChat } from '@/hooks/use-chat';
import { MessageList } from '@/components/assistant/message-list';
import { SuggestionChips } from '@/components/assistant/suggestion-chips';
import { ChatInput } from '@/components/assistant/chat-input';

export function AssistantPanel({ collapsed = false }: { collapsed?: boolean }) {
  const { toggleAssistantPanel, toggleAssistantDrawer } = useLayoutStore();
  const {
    messages,
    suggestions,
    isStreaming,
    error,
    sendMessage,
    refreshSuggestions,
    initializeFromSupabase,
    newChat,
  } = useChat();

  useEffect(() => {
    refreshSuggestions();
    void initializeFromSupabase().catch(() => {});
  }, [initializeFromSupabase, refreshSuggestions]);

  if (collapsed) {
    return (
      <div className="h-full flex flex-col bg-[#060a12] text-white">
        <div className="flex-1 flex items-center px-4">
          <ChatInput disabled={isStreaming} onSend={sendMessage} />
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-[#060a12] text-white">
      <div className="h-10 flex items-center justify-between px-4 border-b border-white/10">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-cyan-300" />
          <span className="text-xs font-semibold uppercase tracking-wide text-white/60">
            Assistant
          </span>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-white/60"
            onClick={newChat}
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-white/60"
            onClick={toggleAssistantDrawer}
          >
            <ChevronDown className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-white/60"
            onClick={toggleAssistantPanel}
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {!collapsed && (
        <>
          <ScrollArea className="flex-1 p-4">
            <MessageList messages={messages} isStreaming={isStreaming} />
          </ScrollArea>

          <div className="px-4 pb-2">
            <SuggestionChips suggestions={suggestions} onSelect={sendMessage} />
          </div>
        </>
      )}

      <div className="p-4 border-t border-white/10 space-y-2">
        {error && (
          <div className="rounded-md bg-red-500/10 px-2 py-1 text-xs text-red-300">
            {error}
          </div>
        )}
        <ChatInput disabled={isStreaming} onSend={sendMessage} />
        {!collapsed && (
          <div className="flex items-center gap-2 text-[10px] text-white/40">
            <Wand2 className="h-3 w-3" />
            Auto-save charts to Visuals
          </div>
        )}
      </div>
    </div>
  );
}
