'use client';

import { useState, useEffect } from 'react';

/**
 * Hook that returns true only after the component has hydrated on the client.
 * Useful for preventing hydration mismatches with browser extensions like Dark Reader
 * that modify SVG attributes.
 *
 * @returns boolean - false during SSR and initial render, true after hydration
 */
export function useHydrated(): boolean {
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
  }, []);

  return hydrated;
}

/**
 * Component wrapper that only renders children after hydration.
 * Use this for SVG-heavy components that might be affected by browser extensions.
 */
export function HydratedOnly({ children, fallback = null }: {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) {
  const hydrated = useHydrated();

  if (!hydrated) {
    return fallback;
  }

  return children;
}
