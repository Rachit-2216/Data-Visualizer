'use client';

import { useState, useRef, useCallback, TouchEvent } from 'react';

export type SwipeDirection = 'left' | 'right' | 'up' | 'down' | null;

interface SwipeState {
  direction: SwipeDirection;
  deltaX: number;
  deltaY: number;
  velocity: number;
  isSwiping: boolean;
}

interface SwipeHandlers {
  onTouchStart: (e: TouchEvent) => void;
  onTouchMove: (e: TouchEvent) => void;
  onTouchEnd: (e: TouchEvent) => void;
}

interface UseSwipeOptions {
  /**
   * Minimum distance to trigger a swipe (in pixels)
   */
  threshold?: number;
  /**
   * Minimum velocity to trigger a swipe (in pixels/ms)
   */
  velocityThreshold?: number;
  /**
   * Callback when swipe is detected
   */
  onSwipe?: (direction: SwipeDirection, velocity: number) => void;
  /**
   * Callback during swipe movement
   */
  onSwipeMove?: (deltaX: number, deltaY: number) => void;
  /**
   * Whether to prevent default touch behavior
   */
  preventDefault?: boolean;
}

/**
 * Hook for detecting swipe gestures on touch devices
 */
export function useSwipe(options: UseSwipeOptions = {}): [SwipeState, SwipeHandlers] {
  const {
    threshold = 50,
    velocityThreshold = 0.3,
    onSwipe,
    onSwipeMove,
    preventDefault = false,
  } = options;

  const [state, setState] = useState<SwipeState>({
    direction: null,
    deltaX: 0,
    deltaY: 0,
    velocity: 0,
    isSwiping: false,
  });

  const startRef = useRef({ x: 0, y: 0, time: 0 });
  const isSwipingRef = useRef(false);

  const onTouchStart = useCallback((e: TouchEvent) => {
    const touch = e.touches[0];
    startRef.current = {
      x: touch.clientX,
      y: touch.clientY,
      time: Date.now(),
    };
    isSwipingRef.current = true;

    setState((prev) => ({
      ...prev,
      isSwiping: true,
      direction: null,
      deltaX: 0,
      deltaY: 0,
    }));
  }, []);

  const onTouchMove = useCallback(
    (e: TouchEvent) => {
      if (!isSwipingRef.current) return;

      if (preventDefault) {
        e.preventDefault();
      }

      const touch = e.touches[0];
      const deltaX = touch.clientX - startRef.current.x;
      const deltaY = touch.clientY - startRef.current.y;

      setState((prev) => ({
        ...prev,
        deltaX,
        deltaY,
      }));

      onSwipeMove?.(deltaX, deltaY);
    },
    [preventDefault, onSwipeMove]
  );

  const onTouchEnd = useCallback(
    (e: TouchEvent) => {
      if (!isSwipingRef.current) return;

      isSwipingRef.current = false;

      const touch = e.changedTouches[0];
      const deltaX = touch.clientX - startRef.current.x;
      const deltaY = touch.clientY - startRef.current.y;
      const deltaTime = Date.now() - startRef.current.time;

      const absX = Math.abs(deltaX);
      const absY = Math.abs(deltaY);
      const velocity = Math.max(absX, absY) / deltaTime;

      let direction: SwipeDirection = null;

      // Determine direction based on which axis has greater movement
      if (absX > absY && absX > threshold) {
        direction = deltaX > 0 ? 'right' : 'left';
      } else if (absY > absX && absY > threshold) {
        direction = deltaY > 0 ? 'down' : 'up';
      }

      // Also trigger if velocity is high enough
      if (!direction && velocity > velocityThreshold) {
        if (absX > absY) {
          direction = deltaX > 0 ? 'right' : 'left';
        } else {
          direction = deltaY > 0 ? 'down' : 'up';
        }
      }

      setState({
        direction,
        deltaX,
        deltaY,
        velocity,
        isSwiping: false,
      });

      if (direction) {
        onSwipe?.(direction, velocity);
      }
    },
    [threshold, velocityThreshold, onSwipe]
  );

  return [state, { onTouchStart, onTouchMove, onTouchEnd }];
}

/**
 * Hook for swipe-to-dismiss functionality
 */
interface UseSwipeToDismissOptions {
  direction?: 'horizontal' | 'vertical' | 'both';
  threshold?: number;
  onDismiss?: (direction: SwipeDirection) => void;
}

export function useSwipeToDismiss(options: UseSwipeToDismissOptions = {}) {
  const { direction = 'horizontal', threshold = 100, onDismiss } = options;

  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDismissing, setIsDismissing] = useState(false);

  const [, handlers] = useSwipe({
    threshold,
    onSwipeMove: (deltaX, deltaY) => {
      if (direction === 'horizontal') {
        setOffset({ x: deltaX, y: 0 });
      } else if (direction === 'vertical') {
        setOffset({ x: 0, y: deltaY });
      } else {
        setOffset({ x: deltaX, y: deltaY });
      }
    },
    onSwipe: (dir, velocity) => {
      const shouldDismiss =
        (direction === 'horizontal' && (dir === 'left' || dir === 'right')) ||
        (direction === 'vertical' && (dir === 'up' || dir === 'down')) ||
        direction === 'both';

      if (shouldDismiss) {
        setIsDismissing(true);
        onDismiss?.(dir);
      } else {
        setOffset({ x: 0, y: 0 });
      }
    },
  });

  const reset = useCallback(() => {
    setOffset({ x: 0, y: 0 });
    setIsDismissing(false);
  }, []);

  return {
    offset,
    isDismissing,
    handlers,
    reset,
  };
}
