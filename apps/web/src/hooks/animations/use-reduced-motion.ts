'use client';

import { useState, useEffect } from 'react';

/**
 * Hook to detect and respect the user's prefers-reduced-motion setting.
 * SSR-safe: returns false on server and initial hydration, then updates on client.
 *
 * @returns boolean - true if reduced motion is preferred
 */
export function useReducedMotion(): boolean {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  return prefersReducedMotion;
}

/**
 * Hook that returns animation properties only if reduced motion is not preferred.
 * Useful for conditionally applying animations.
 *
 * @param animationProps - The animation props to apply when motion is allowed
 * @returns The animation props or empty object
 */
export function useMotionSafe<T extends object>(animationProps: T): T | Record<string, never> {
  const prefersReducedMotion = useReducedMotion();
  return prefersReducedMotion ? {} : animationProps;
}

/**
 * Hook that provides a wrapper for framer-motion's animate prop.
 * Returns static values when reduced motion is preferred.
 *
 * @param animate - The animate prop to use when motion is allowed
 * @param reducedAnimate - The animate prop to use when reduced motion is preferred (defaults to empty)
 */
export function useAnimateSafe<T>(animate: T, reducedAnimate?: T): T {
  const prefersReducedMotion = useReducedMotion();
  return prefersReducedMotion ? (reducedAnimate ?? ({} as T)) : animate;
}
