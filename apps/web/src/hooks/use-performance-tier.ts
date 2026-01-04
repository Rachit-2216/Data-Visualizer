'use client';

import { useState, useEffect } from 'react';
import { useAnimationStore, PerformanceTier } from '@/store/animation-store';

interface PerformanceMetrics {
  tier: PerformanceTier;
  cpuCores: number;
  deviceMemory: number | null;
  connectionType: string | null;
  isBatterySaver: boolean;
  isTouchDevice: boolean;
  prefersReducedMotion: boolean;
}

/**
 * Detects device performance capabilities and returns a tier.
 * Also updates the animation store with appropriate settings.
 */
export function usePerformanceTier(): PerformanceMetrics {
  const { setPerformanceTier } = useAnimationStore();
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    tier: 'high',
    cpuCores: 4,
    deviceMemory: null,
    connectionType: null,
    isBatterySaver: false,
    isTouchDevice: false,
    prefersReducedMotion: false,
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const detectPerformance = async () => {
      // CPU cores
      const cpuCores = navigator.hardwareConcurrency || 4;

      // Device memory (Chrome only)
      const deviceMemory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory || null;

      // Connection type (Chrome only)
      const connection = (navigator as Navigator & { connection?: { effectiveType?: string; saveData?: boolean } }).connection;
      const connectionType = connection?.effectiveType || null;
      const isSaveData = connection?.saveData || false;

      // Touch device detection
      const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

      // Reduced motion preference
      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

      // Battery status (if available)
      let isBatterySaver = false;
      try {
        const battery = await (navigator as Navigator & { getBattery?: () => Promise<{ charging: boolean; level: number }> }).getBattery?.();
        if (battery) {
          isBatterySaver = !battery.charging && battery.level < 0.2;
        }
      } catch {
        // Battery API not available
      }

      // Calculate tier based on metrics
      let tier: PerformanceTier = 'high';

      // Factors that lower the tier
      const lowFactors = [
        cpuCores < 4,
        deviceMemory !== null && deviceMemory < 4,
        connectionType === '2g' || connectionType === 'slow-2g',
        isSaveData,
        isBatterySaver,
        prefersReducedMotion,
      ].filter(Boolean).length;

      const mediumFactors = [
        cpuCores < 8,
        deviceMemory !== null && deviceMemory < 8,
        connectionType === '3g',
        isTouchDevice,
      ].filter(Boolean).length;

      if (lowFactors >= 2 || prefersReducedMotion) {
        tier = 'low';
      } else if (mediumFactors >= 2 || lowFactors >= 1) {
        tier = 'medium';
      }

      const newMetrics: PerformanceMetrics = {
        tier,
        cpuCores,
        deviceMemory,
        connectionType,
        isBatterySaver,
        isTouchDevice,
        prefersReducedMotion,
      };

      setMetrics(newMetrics);
      setPerformanceTier(tier);
    };

    detectPerformance();

    // Listen for reduced motion changes
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handleChange = () => {
      detectPerformance();
    };
    mediaQuery.addEventListener('change', handleChange);

    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, [setPerformanceTier]);

  return metrics;
}

/**
 * Hook that returns whether heavy animations should be enabled
 */
export function useCanAnimate(): boolean {
  const { tier } = usePerformanceTier();
  return tier !== 'low';
}

/**
 * Hook that returns whether particle effects should be enabled
 */
export function useCanShowParticles(): boolean {
  const { tier, cpuCores } = usePerformanceTier();
  return tier === 'high' && cpuCores >= 4;
}

/**
 * Hook that returns whether parallax should be enabled
 */
export function useCanShowParallax(): boolean {
  const { tier } = usePerformanceTier();
  return tier !== 'low';
}
