'use client';

import { useCallback, useMemo } from 'react';
import { useReducedMotion } from './animations/use-reduced-motion';

type HapticPattern = 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error' | 'selection';

interface HapticPatternConfig {
  pattern: number[];
  pause?: number;
}

const HAPTIC_PATTERNS: Record<HapticPattern, HapticPatternConfig> = {
  light: { pattern: [10] },
  medium: { pattern: [25] },
  heavy: { pattern: [50] },
  success: { pattern: [10, 50, 10, 50, 30] },
  warning: { pattern: [30, 100, 30] },
  error: { pattern: [50, 100, 50, 100, 50] },
  selection: { pattern: [5] },
};

interface UseHapticOptions {
  /**
   * Whether haptic feedback is enabled
   */
  enabled?: boolean;
}

/**
 * Hook for providing haptic feedback using the Vibration API
 * Falls back gracefully on unsupported devices
 */
export function useHaptic(options: UseHapticOptions = {}) {
  const { enabled = true } = options;
  const prefersReducedMotion = useReducedMotion();

  const isSupported = useMemo(() => {
    return typeof navigator !== 'undefined' && 'vibrate' in navigator;
  }, []);

  /**
   * Trigger a haptic pattern
   */
  const vibrate = useCallback(
    (pattern: HapticPattern | number | number[]) => {
      if (!enabled || !isSupported || prefersReducedMotion) return false;

      try {
        if (typeof pattern === 'string') {
          const config = HAPTIC_PATTERNS[pattern];
          return navigator.vibrate(config.pattern);
        } else if (typeof pattern === 'number') {
          return navigator.vibrate(pattern);
        } else {
          return navigator.vibrate(pattern);
        }
      } catch {
        return false;
      }
    },
    [enabled, isSupported, prefersReducedMotion]
  );

  /**
   * Stop any ongoing vibration
   */
  const cancel = useCallback(() => {
    if (!isSupported) return;
    try {
      navigator.vibrate(0);
    } catch {
      // Ignore errors
    }
  }, [isSupported]);

  /**
   * Light tap feedback (for buttons, selections)
   */
  const tap = useCallback(() => vibrate('light'), [vibrate]);

  /**
   * Medium feedback (for toggles, switches)
   */
  const impact = useCallback(() => vibrate('medium'), [vibrate]);

  /**
   * Heavy feedback (for destructive actions)
   */
  const heavyImpact = useCallback(() => vibrate('heavy'), [vibrate]);

  /**
   * Success feedback pattern
   */
  const success = useCallback(() => vibrate('success'), [vibrate]);

  /**
   * Warning feedback pattern
   */
  const warning = useCallback(() => vibrate('warning'), [vibrate]);

  /**
   * Error feedback pattern
   */
  const error = useCallback(() => vibrate('error'), [vibrate]);

  /**
   * Selection change feedback
   */
  const selection = useCallback(() => vibrate('selection'), [vibrate]);

  return {
    isSupported,
    vibrate,
    cancel,
    tap,
    impact,
    heavyImpact,
    success,
    warning,
    error,
    selection,
  };
}

/**
 * Hook that provides haptic-enhanced event handlers
 */
export function useHapticHandlers(pattern: HapticPattern = 'light') {
  const haptic = useHaptic();

  const withHaptic = useCallback(
    <T extends (...args: unknown[]) => void>(handler?: T) => {
      return (...args: Parameters<T>) => {
        haptic.vibrate(pattern);
        handler?.(...args);
      };
    },
    [haptic, pattern]
  );

  const onClick = useCallback(
    (handler?: () => void) => withHaptic(handler),
    [withHaptic]
  );

  const onPress = useCallback(
    (handler?: () => void) => withHaptic(handler),
    [withHaptic]
  );

  return {
    withHaptic,
    onClick,
    onPress,
    haptic,
  };
}

/**
 * Hook for creating a haptic button
 */
interface UseHapticButtonOptions {
  onClick?: () => void;
  onPressStart?: () => void;
  onPressEnd?: () => void;
  pattern?: HapticPattern;
  pressPattern?: HapticPattern;
}

export function useHapticButton(options: UseHapticButtonOptions = {}) {
  const {
    onClick,
    onPressStart,
    onPressEnd,
    pattern = 'light',
    pressPattern = 'selection',
  } = options;

  const haptic = useHaptic();

  const handleClick = useCallback(() => {
    haptic.vibrate(pattern);
    onClick?.();
  }, [haptic, pattern, onClick]);

  const handlePressStart = useCallback(() => {
    haptic.vibrate(pressPattern);
    onPressStart?.();
  }, [haptic, pressPattern, onPressStart]);

  const handlePressEnd = useCallback(() => {
    onPressEnd?.();
  }, [onPressEnd]);

  return {
    onClick: handleClick,
    onMouseDown: handlePressStart,
    onMouseUp: handlePressEnd,
    onTouchStart: handlePressStart,
    onTouchEnd: handlePressEnd,
  };
}

/**
 * Hook for scroll-based haptic feedback
 */
interface UseScrollHapticOptions {
  /**
   * Interval in pixels between haptic ticks
   */
  tickInterval?: number;
  /**
   * Pattern to use for each tick
   */
  pattern?: HapticPattern;
  /**
   * Maximum ticks per second to prevent excessive vibration
   */
  maxTicksPerSecond?: number;
}

export function useScrollHaptic(options: UseScrollHapticOptions = {}) {
  const { tickInterval = 100, pattern = 'selection', maxTicksPerSecond = 10 } = options;
  const haptic = useHaptic();

  let lastTick = 0;
  let lastTime = 0;
  const minInterval = 1000 / maxTicksPerSecond;

  const handleScroll = useCallback(
    (scrollPosition: number) => {
      const now = Date.now();
      const tick = Math.floor(scrollPosition / tickInterval);

      if (tick !== lastTick && now - lastTime > minInterval) {
        haptic.vibrate(pattern);
        lastTick = tick;
        lastTime = now;
      }
    },
    [haptic, tickInterval, pattern, minInterval]
  );

  return {
    handleScroll,
    isSupported: haptic.isSupported,
  };
}
