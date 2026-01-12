'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ChatMessage = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
  chartSpec?: Record<string, unknown> | null;
  status?: 'streaming' | 'done' | 'error';
};

export type ChatConversation = {
  id: string;
  title: string;
  createdAt: string;
};

type ChatState = {
  conversations: ChatConversation[];
  activeConversationId: string | null;
  messagesByConversation: Record<string, ChatMessage[]>;
  suggestions: string[];
  isStreaming: boolean;
  error: string | null;
  startConversation: (title?: string, id?: string) => string;
  setActiveConversation: (id: string | null) => void;
  addMessage: (conversationId: string, message: ChatMessage) => void;
  updateMessage: (conversationId: string, messageId: string, patch: Partial<ChatMessage>) => void;
  replaceMessages: (conversationId: string, messages: ChatMessage[]) => void;
  setSuggestions: (suggestions: string[]) => void;
  setStreaming: (value: boolean) => void;
  setError: (error: string | null) => void;
  resetConversation: () => void;
  setConversations: (conversations: ChatConversation[]) => void;
};

const generateId = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `chat-${Date.now()}`;

const initialConversationId = generateId();

export const useChatStore = create<ChatState>()(
  persist(
    (set, get) => ({
      conversations: [
        {
          id: initialConversationId,
          title: 'New chat',
          createdAt: new Date().toISOString(),
        },
      ],
      activeConversationId: initialConversationId,
      messagesByConversation: { [initialConversationId]: [] },
      suggestions: [],
      isStreaming: false,
      error: null,
      startConversation: (title = 'New chat', id?: string) => {
        const nextId = id ?? generateId();
        const conversation: ChatConversation = {
          id: nextId,
          title,
          createdAt: new Date().toISOString(),
        };
        set((state) => ({
          conversations: [conversation, ...state.conversations],
          activeConversationId: nextId,
          messagesByConversation: { ...state.messagesByConversation, [nextId]: [] },
        }));
        return nextId;
      },
      setActiveConversation: (id) => set({ activeConversationId: id }),
      addMessage: (conversationId, message) => {
        set((state) => ({
          messagesByConversation: {
            ...state.messagesByConversation,
            [conversationId]: [...(state.messagesByConversation[conversationId] ?? []), message],
          },
        }));
      },
      updateMessage: (conversationId, messageId, patch) => {
        set((state) => ({
          messagesByConversation: {
            ...state.messagesByConversation,
            [conversationId]: (state.messagesByConversation[conversationId] ?? []).map((msg) =>
              msg.id === messageId ? { ...msg, ...patch } : msg
            ),
          },
        }));
      },
      replaceMessages: (conversationId, messages) => {
        set((state) => ({
          messagesByConversation: {
            ...state.messagesByConversation,
            [conversationId]: messages,
          },
        }));
      },
      setSuggestions: (suggestions) => set({ suggestions }),
      setStreaming: (value) => set({ isStreaming: value }),
      setError: (error) => set({ error }),
      resetConversation: () => {
        const id = get().activeConversationId;
        if (!id) return;
        set((state) => ({
          messagesByConversation: { ...state.messagesByConversation, [id]: [] },
          error: null,
        }));
      },
      setConversations: (conversations) => {
        set({ conversations });
      },
    }),
    {
      name: 'datacanvas-chat',
      partialize: (state) => ({
        conversations: state.conversations,
        activeConversationId: state.activeConversationId,
        messagesByConversation: state.messagesByConversation,
      }),
    }
  )
);
