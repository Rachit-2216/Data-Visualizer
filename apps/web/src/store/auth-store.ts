'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/client';
import { apiClient } from '@/lib/api-client';

type AuthState = {
  user: User | null;
  isLoading: boolean;
  isInitialized: boolean;
  error: string | null;
  demoBannerDismissed: boolean;
  initialize: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (
    email: string,
    password: string,
    options?: { name?: string; redirectTo?: string }
  ) => Promise<void>;
  signOut: () => Promise<void>;
  clearError: () => void;
  dismissDemoBanner: () => void;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isLoading: true,
      isInitialized: false,
      error: null,
      demoBannerDismissed: false,
      initialize: async () => {
        set({ isLoading: true });
        const supabase = createClient();
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();
        apiClient.setToken(session?.access_token ?? null);
        set({
          user: session?.user ?? null,
          isLoading: false,
          isInitialized: true,
          error: error?.message ?? null,
        });
        supabase.auth.onAuthStateChange((_event, session) => {
          apiClient.setToken(session?.access_token ?? null);
          set({ user: session?.user ?? null });
        });
      },
      signIn: async (email, password) => {
        set({ isLoading: true, error: null });
        try {
          const supabase = createClient();
          const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
          });
          if (error) {
            throw error;
          }
          apiClient.setToken(data.session?.access_token ?? null);
          set({ user: data.user ?? null, isLoading: false });
        } catch (error: unknown) {
          const message = error instanceof Error ? error.message : 'Failed to sign in';
          set({ error: message, isLoading: false });
          throw error;
        }
      },
      signUp: async (email, password, options) => {
        set({ isLoading: true, error: null });
        try {
          const supabase = createClient();
          const { error } = await supabase.auth.signUp({
            email,
            password,
            options: {
              data: options?.name ? { full_name: options.name } : undefined,
              emailRedirectTo: options?.redirectTo,
            },
          });
          if (error) {
            throw error;
          }
          set({ isLoading: false });
        } catch (error: unknown) {
          const message = error instanceof Error ? error.message : 'Failed to sign up';
          set({ error: message, isLoading: false });
          throw error;
        }
      },
      signOut: async () => {
        set({ isLoading: true });
        const supabase = createClient();
        await supabase.auth.signOut();
        apiClient.setToken(null);
        set({ user: null, isLoading: false });
      },
      clearError: () => {
        set({ error: null });
      },
      dismissDemoBanner: () => {
        set({ demoBannerDismissed: true });
      },
    }),
    {
      name: 'datacanvas-auth',
      partialize: (state) => ({
        demoBannerDismissed: state.demoBannerDismissed,
      }),
    }
  )
);
