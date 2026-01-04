'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/client';

type AuthState = {
  user: User | null;
  isLoading: boolean;
  demoBannerDismissed: boolean;
  initialize: () => Promise<void>;
  signOut: () => Promise<void>;
  dismissDemoBanner: () => void;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isLoading: true,
      demoBannerDismissed: false,
      initialize: async () => {
        set({ isLoading: true });
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();
        set({ user, isLoading: false });
        supabase.auth.onAuthStateChange((_event, session) => {
          set({ user: session?.user ?? null });
        });
      },
      signOut: async () => {
        const supabase = createClient();
        await supabase.auth.signOut();
        set({ user: null });
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
