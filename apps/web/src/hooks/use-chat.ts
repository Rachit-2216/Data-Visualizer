'use client';

import { useCallback, useEffect, useMemo } from 'react';
import { apiClient, ApiError } from '@/lib/api-client';
import { useAuthStore } from '@/store/auth-store';
import { useChatStore, type ChatMessage } from '@/store/chat-store';
import { useProjectStore } from '@/store/project-store';
import { useDatasetStore } from '@/store/dataset-store';
import { isUuid } from '@/lib/utils';
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
  profile?: { stats: Record<string, unknown>; warnings: Array<{ severity: string; message: string }> };
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
  const { user } = useAuthStore();
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
    replaceMessages,
    setSuggestions,
    setStreaming,
    setError,
    setActiveConversation,
    setConversations,
  } = useChatStore();
  const { currentProjectId } = useProjectStore();
  const { datasetsByProject, currentDatasetId, currentDatasetVersionId } = useDatasetStore();

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
    const hasDataset = !!activeDataset;
    const hasWarnings = (activeDataset?.profile?.warnings ?? []).length > 0;
    setSuggestions(buildSuggestions(hasDataset, hasWarnings));
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
      const datasetVersionId =
        currentDatasetVersionId && isUuid(currentDatasetVersionId)
          ? currentDatasetVersionId
          : undefined;

      let conversationId = activeConversationId;
      if (!conversationId) {
        if (user) {
          if (!currentProjectId || !isUuid(currentProjectId)) {
            setError('Select a project to start a conversation.');
            setStreaming(false);
            return;
          }
          try {
            const created = await apiClient.createConversation({
              project_id: currentProjectId,
              dataset_version_id: datasetVersionId,
            });
            conversationId = startConversation(trimmed.slice(0, 60) || 'New chat', created.conversation.id);
          } catch (error) {
            const message =
              error instanceof ApiError ? error.message : 'Failed to start conversation';
            setError(message);
            setStreaming(false);
            return;
          }
        } else {
          conversationId = startConversation('New chat');
        }
      }

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
      let assistantChartSpec: Record<string, unknown> | null = null;
      addMessage(conversationId, {
        id: assistantId,
        role: 'assistant',
        content: '',
        createdAt: new Date().toISOString(),
        status: 'streaming',
      });

      const streamFromLocal = async () => {
        const payload: ChatRequestPayload = {
          message: trimmed,
          datasetContext: toDatasetContext(activeDataset),
          conversationId,
          model: 'llama-3.1-70b-versatile',
          history: (messagesByConversation[conversationId] ?? [])
            .filter((msg) => msg.role !== 'assistant' || msg.content)
            .slice(-8)
            .map((msg) => ({
              role: msg.role,
              content: msg.content,
            })),
        };
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (!response.ok || !response.body) {
          let message = 'Failed to fetch assistant response';
          try {
            const text = await response.text();
            if (text) {
              const parsed = JSON.parse(text) as { error?: string };
              if (parsed?.error) {
                message = parsed.error;
              }
            }
          } catch {
            // ignore parsing errors
          }
          throw new Error(message);
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
            }
            if (event.type === 'done') {
              assistantContent = event.text;
              assistantChartSpec = event.chartSpec ?? null;
              updateMessage(conversationId, assistantId, {
                content: event.text,
                chartSpec: assistantChartSpec,
                status: 'done',
              });
            }
            if (event.type === 'error') {
              updateMessage(conversationId, assistantId, {
                content: event.message,
                status: 'error',
              });
              setError(event.message);
            }
          }
        }
      };

      try {
        if (user) {
          try {
            for await (const chunk of apiClient.chatStream(
              conversationId,
              trimmed,
              datasetVersionId
            )) {
              if (chunk.type === 'text') {
                assistantContent += chunk.content ?? '';
                updateMessage(conversationId, assistantId, {
                  content: assistantContent,
                  status: 'streaming',
                });
              } else if (chunk.type === 'chart') {
                assistantChartSpec = (chunk.spec as Record<string, unknown>) ?? null;
              } else if (chunk.type === 'error') {
                throw new Error(chunk.message ?? 'Failed to stream response');
              }
            }

            updateMessage(conversationId, assistantId, {
              content: assistantContent,
              chartSpec: assistantChartSpec,
              status: 'done',
            });
          } catch (error) {
            if (
              error instanceof ApiError &&
              (error.code === 'NETWORK_ERROR' || error.status === 503 || error.status >= 500)
            ) {
              await streamFromLocal();
            } else {
              throw error;
            }
          }
        } else {
          await streamFromLocal();
        }
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Failed to stream response';
        updateMessage(conversationId, assistantId, {
          content: message,
          status: 'error',
        });
        setError(message);
      } finally {
        setStreaming(false);
        refreshSuggestions();
      }
    },
    [
      activeConversationId,
      addMessage,
      currentDatasetVersionId,
      currentProjectId,
      activeDataset,
      messagesByConversation,
      refreshSuggestions,
      setError,
      setStreaming,
      startConversation,
      updateMessage,
      user,
    ]
  );

  const initializeFromSupabase = useCallback(async () => {
    if (!user) {
      refreshSuggestions();
      return;
    }
    try {
      const response = await apiClient.getConversations();
      const mappedConversations = (response.conversations ?? []).map((conv) => ({
        id: conv.id,
        title: conv.title ?? 'Conversation',
        createdAt: conv.created_at,
      }));
      if (!mappedConversations.length) {
        refreshSuggestions();
        return;
      }
      setConversations(mappedConversations);

      const conv = mappedConversations[0];
      const messagesResponse = await apiClient.getMessages(conv.id);
      const messages = (messagesResponse.messages ?? []).map((msg) => ({
        id: msg.id,
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
        createdAt: msg.created_at,
        chartSpec: msg.chart_spec ?? null,
        status: 'done' as const,
      }));

      replaceMessages(conv.id, messages);
      setActiveConversation(conv.id);
      refreshSuggestions();
    } catch (error) {
      if (
        error instanceof ApiError &&
        (error.code === 'NETWORK_ERROR' || error.status >= 500)
      ) {
        setError('Backend offline. Chat is running in local mode.');
        refreshSuggestions();
        return;
      }
      const message =
        error instanceof ApiError ? error.message : 'Failed to load conversations';
      setError(message);
    }
  }, [
    refreshSuggestions,
    replaceMessages,
    setActiveConversation,
    setConversations,
    setError,
    user,
  ]);

  return {
    conversations,
    activeConversationId,
    messages: activeMessages,
    suggestions,
    isStreaming,
    error,
    sendMessage,
    refreshSuggestions,
    initializeFromSupabase,
    newChat: () => {
      startConversation('New chat');
      refreshSuggestions();
    },
  };
}
