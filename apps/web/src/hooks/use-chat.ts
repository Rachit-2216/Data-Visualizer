'use client';

import { useCallback, useEffect, useMemo } from 'react';
import { useChatStore, type ChatMessage } from '@/store/chat-store';
import { useProjectStore } from '@/store/project-store';
import { useDatasetStore } from '@/store/dataset-store';
import type { ChatRequestPayload, StreamEvent } from '@/lib/groq/types';

const decoder = new TextDecoder();

const buildSuggestions = (hasDataset: boolean, hasWarnings: boolean) => {
  if (!hasDataset) {
    return [
      'What can you do?',
      'How should I format my dataset?',
      'Suggest charts to explore',
    ];
  }
  if (hasWarnings) {
    return [
      'How should I handle missing values?',
      'Summarize key insights',
      'Show target distribution',
    ];
  }
  return [
    'Tell me about this dataset',
    'Show correlation heatmap',
    'Suggest preprocessing steps',
    'Create a bar chart by category',
  ];
};

const toDatasetContext = (dataset?: {
  name: string;
  rowCount: number;
  columns: Array<{ name: string; type: string }>;
  profile?: {
    stats: Record<string, unknown>;
    warnings: Array<{ severity: string; message: string }>;
  };
  sampleRows: Array<Record<string, unknown>>;
}) => {
  if (!dataset || !dataset.profile) return null;
  return {
    name: dataset.name,
    rowCount: dataset.rowCount,
    columnCount: dataset.columns.length,
    schema: dataset.columns,
    stats: dataset.profile.stats,
    sampleRows: dataset.sampleRows,
    warnings: dataset.profile.warnings ?? [],
  };
};

export function useChat() {
  const {
    conversations,
    activeConversationId,
    messagesByConversation,
    suggestions,
    isStreaming,
    error,
    startConversation,
    addMessage,
    updateMessage,
    setSuggestions,
    setStreaming,
    setError,
  } = useChatStore();
  const { currentProjectId } = useProjectStore();
  const { datasetsByProject, currentDatasetId } = useDatasetStore();

  const activeMessages = activeConversationId
    ? messagesByConversation[activeConversationId] ?? []
    : [];

  const activeDataset = useMemo(() => {
    if (!currentProjectId || !currentDatasetId) return undefined;
    return (datasetsByProject[currentProjectId] ?? []).find(
      (dataset) => dataset.id === currentDatasetId
    );
  }, [currentDatasetId, currentProjectId, datasetsByProject]);

  const refreshSuggestions = useCallback(() => {
    setSuggestions(
      buildSuggestions(
        !!activeDataset,
        (activeDataset?.profile?.warnings ?? []).length > 0
      )
    );
  }, [activeDataset, setSuggestions]);

  useEffect(() => {
    refreshSuggestions();
  }, [refreshSuggestions]);

  const sendMessage = useCallback(
    async (message: string) => {
      const trimmed = message.trim();
      if (!trimmed) return;

      setError(null);
      setStreaming(true);

      const conversationId =
        activeConversationId ?? startConversation('New chat');
      const userMessage: ChatMessage = {
        id: `msg-${Date.now()}`,
        role: 'user',
        content: trimmed,
        createdAt: new Date().toISOString(),
        status: 'done',
      };
      addMessage(conversationId, userMessage);

      const assistantId = `msg-${Date.now() + 1}`;
      let assistantContent = '';
      addMessage(conversationId, {
        id: assistantId,
        role: 'assistant',
        content: '',
        createdAt: new Date().toISOString(),
        status: 'streaming',
      });

      try {
        const payload: ChatRequestPayload = {
          message: trimmed,
          datasetContext: toDatasetContext(activeDataset),
          conversationId,
          model: 'llama-3.1-70b-versatile',
          history: (messagesByConversation[conversationId] ?? [])
            .filter((item) => item.role !== 'assistant' || item.content)
            .slice(-8)
            .map((item) => ({
              role: item.role,
              content: item.content,
            })),
        };
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (!response.ok || !response.body) {
          let errorMessage = 'Failed to fetch assistant response.';
          try {
            const parsed = (await response.json()) as { error?: string };
            errorMessage = parsed.error ?? errorMessage;
          } catch {
            // Preserve the readable fallback message.
          }
          throw new Error(errorMessage);
        }

        const reader = response.body.getReader();
        let buffer = '';

        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() ?? '';

          for (const line of lines) {
            if (!line.trim()) continue;
            const event = JSON.parse(line) as StreamEvent;
            if (event.type === 'delta') {
              assistantContent += event.text;
              updateMessage(conversationId, assistantId, {
                content: assistantContent,
                status: 'streaming',
              });
            } else if (event.type === 'done') {
              assistantContent = event.text;
              updateMessage(conversationId, assistantId, {
                content: event.text,
                chartSpec: event.chartSpec ?? null,
                status: 'done',
              });
            } else if (event.type === 'error') {
              throw new Error(event.message);
            }
          }
        }
      } catch (caught) {
        const errorMessage =
          caught instanceof Error
            ? caught.message
            : 'Failed to stream assistant response.';
        updateMessage(conversationId, assistantId, {
          content: errorMessage,
          status: 'error',
        });
        setError(errorMessage);
      } finally {
        setStreaming(false);
        refreshSuggestions();
      }
    },
    [
      activeConversationId,
      activeDataset,
      addMessage,
      messagesByConversation,
      refreshSuggestions,
      setError,
      setStreaming,
      startConversation,
      updateMessage,
    ]
  );

  const initializeLocalChat = useCallback(async () => {
    refreshSuggestions();
  }, [refreshSuggestions]);

  return {
    conversations,
    activeConversationId,
    messages: activeMessages,
    suggestions,
    isStreaming,
    error,
    sendMessage,
    refreshSuggestions,
    initializeLocalChat,
    newChat: () => {
      startConversation('New chat');
      refreshSuggestions();
    },
  };
}
