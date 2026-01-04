'use client';

import { useCallback, useEffect, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import { apiJson } from '@/lib/api-client';
import { useAuthStore } from '@/store/auth-store';
import { useChatStore, type ChatMessage } from '@/store/chat-store';
import { useProjectStore } from '@/store/project-store';
import { useDatasetStore } from '@/store/dataset-store';
import type { ChatRequestPayload, StreamEvent } from '@/lib/gemini/types';

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
    resetConversation,
    setActiveConversation,
    setConversations,
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
    const hasDataset = !!activeDataset;
    const hasWarnings = (activeDataset?.profile?.warnings ?? []).length > 0;
    setSuggestions(buildSuggestions(hasDataset, hasWarnings));
  }, [activeDataset, setSuggestions]);

  useEffect(() => {
    refreshSuggestions();
  }, [refreshSuggestions]);

  const ensureConversationInSupabase = useCallback(
    async (conversationId: string, title: string) => {
      if (!user) return;
      const supabase = createClient();
      const { data } = await supabase
        .from('conversations')
        .select('id')
        .eq('id', conversationId)
        .maybeSingle();
      if (!data) {
        await supabase.from('conversations').insert({
          id: conversationId,
          user_id: user.id,
          title,
        });
      }
    },
    [user]
  );

  const sendMessage = useCallback(
    async (message: string) => {
      const trimmed = message.trim();
      if (!trimmed) return;

      setError(null);
      setStreaming(true);
      if (!activeConversationId) {
        startConversation('New chat');
      }
      const conversationId = activeConversationId ?? startConversation('New chat');

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

      const payload: ChatRequestPayload = {
        message: trimmed,
        datasetContext: toDatasetContext(activeDataset),
        conversationId,
        model: 'gemini-2.0-flash',
        history: (messagesByConversation[conversationId] ?? [])
          .filter((msg) => msg.role !== 'assistant' || msg.content)
          .slice(-8)
          .map((msg) => ({
            role: msg.role,
            content: msg.content,
          })),
      };

      if (user) {
        await ensureConversationInSupabase(conversationId, trimmed.slice(0, 60));
        const supabase = createClient();
        await supabase.from('messages').insert({
          conversation_id: conversationId,
          user_id: user.id,
          role: 'user',
          content: trimmed,
        });
      }

      try {
        if (user) {
          const backend = await apiJson<{ response: string }>('/api/chat', {
            method: 'POST',
            body: JSON.stringify({
              message: trimmed,
              dataset_context: toDatasetContext(activeDataset),
            }),
          });
          assistantContent = backend.response;
          updateMessage(conversationId, assistantId, {
            content: assistantContent,
            status: 'done',
          });
        } else {
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
        }

        if (user && assistantContent) {
          const supabase = createClient();
          await supabase.from('messages').insert({
            conversation_id: conversationId,
            user_id: user.id,
            role: 'assistant',
            content: assistantContent,
            tool_payload: assistantChartSpec,
          });
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
      activeDataset,
      addMessage,
      ensureConversationInSupabase,
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
    const supabase = createClient();
    const { data: conversationsData } = await supabase
      .from('conversations')
      .select('id, title, created_at')
      .order('created_at', { ascending: false });

    if (!conversationsData?.length) {
      refreshSuggestions();
      return;
    }

    const mappedConversations = conversationsData.map((conv) => ({
      id: conv.id,
      title: conv.title ?? 'Conversation',
      createdAt: conv.created_at,
    }));
    setConversations(mappedConversations);

    const conv = mappedConversations[0];
    const { data: messagesData } = await supabase
      .from('messages')
      .select('id, role, content, created_at, tool_payload, conversation_id')
      .eq('conversation_id', conv.id)
      .order('created_at', { ascending: true });

    const messages = (messagesData ?? []).map((msg) => ({
      id: msg.id,
      role: msg.role as 'user' | 'assistant',
      content: msg.content,
      createdAt: msg.created_at,
      chartSpec: (msg.tool_payload as Record<string, unknown>) ?? null,
      status: 'done' as const,
    }));

    replaceMessages(conv.id, messages);
    setActiveConversation(conv.id);
    refreshSuggestions();
  }, [refreshSuggestions, replaceMessages, setActiveConversation, setConversations, user]);

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
