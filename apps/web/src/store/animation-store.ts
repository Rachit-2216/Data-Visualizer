'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type PerformanceTier = 'high' | 'medium' | 'low';

interface AnimationState {
  // User preferences
  reducedMotion: boolean;
  cursorEffectsEnabled: boolean;
  parallaxEnabled: boolean;
  particlesEnabled: boolean;

  // Performance tier (auto-detected or user-set)
  performanceTier: PerformanceTier;

  // Global animation scale (0.0 - 1.0)
  animationScale: number;

  // Cursor state
  cursorState: 'default' | 'hover' | 'click' | 'drag' | 'text' | 'hidden';
  cursorScale: number;

  // Actions
  setReducedMotion: (enabled: boolean) => void;
  setCursorEffectsEnabled: (enabled: boolean) => void;
  setParallaxEnabled: (enabled: boolean) => void;
  setParticlesEnabled: (enabled: boolean) => void;
  setPerformanceTier: (tier: PerformanceTier) => void;
  setAnimationScale: (scale: number) => void;
  setCursorState: (state: AnimationState['cursorState']) => void;
  setCursorScale: (scale: number) => void;

  // Computed helpers
  shouldAnimate: () => boolean;
  getSpringConfig: (preset: 'snappy' | 'smooth' | 'bouncy') => { stiffness: number; damping: number };
}

export const useAnimationStore = create<AnimationState>()(
  persist(
    (set, get) => ({
      // Default values
      reducedMotion: false,
      cursorEffectsEnabled: true,
      parallaxEnabled: true,
      particlesEnabled: true,
      performanceTier: 'high',
      animationScale: 1.0,
      cursorState: 'default',
      cursorScale: 1,

      // Actions
      setReducedMotion: (enabled) => set({ reducedMotion: enabled }),
      setCursorEffectsEnabled: (enabled) => set({ cursorEffectsEnabled: enabled }),
      setParallaxEnabled: (enabled) => set({ parallaxEnabled: enabled }),
      setParticlesEnabled: (enabled) => set({ particlesEnabled: enabled }),
      setPerformanceTier: (tier) => {
        // Automatically adjust settings based on tier
        if (tier === 'low') {
          set({
            performanceTier: tier,
            particlesEnabled: false,
            parallaxEnabled: false,
            animationScale: 0.5,
          });
        } else if (tier === 'medium') {
          set({
            performanceTier: tier,
            particlesEnabled: false,
            parallaxEnabled: true,
            animationScale: 0.75,
          });
        } else {
          set({
            performanceTier: tier,
            particlesEnabled: true,
            parallaxEnabled: true,
            animationScale: 1.0,
          });
        }
      },
      setAnimationScale: (scale) => set({ animationScale: Math.max(0, Math.min(1, scale)) }),
      setCursorState: (state) => set({ cursorState: state }),
      setCursorScale: (scale) => set({ cursorScale: scale }),

      // Computed helpers
      shouldAnimate: () => {
        const state = get();
        return !state.reducedMotion && state.animationScale > 0;
      },

      getSpringConfig: (preset) => {
        const scale = get().animationScale;
        const configs = {
          snappy: { stiffness: 400, damping: 30 },
          smooth: { stiffness: 100, damping: 20 },
          bouncy: { stiffness: 300, damping: 15 },
        };
        const config = configs[preset];
        return {
          stiffness: config.stiffness * scale,
          damping: config.damping,
        };
      },
    }),
    {
      name: 'datacanvas-animation',
      skipHydration: true,
      partialize: (state) => ({
        cursorEffectsEnabled: state.cursorEffectsEnabled,
        parallaxEnabled: state.parallaxEnabled,
        particlesEnabled: state.particlesEnabled,
        animationScale: state.animationScale,
      }),
    }
  )
);
