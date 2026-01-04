'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

export interface MousePosition {
  x: number;
  y: number;
  clientX: number;
  clientY: number;
  isActive: boolean;
  velocity: { x: number; y: number };
}

interface UseMousePositionOptions {
  /**
   * Whether to track position relative to an element or the viewport
   */
  relative?: boolean;
  /**
   * Reference element for relative tracking
   */
  elementRef?: React.RefObject<HTMLElement>;
  /**
   * Whether to track velocity
   */
  trackVelocity?: boolean;
  /**
   * Throttle updates to this interval (in ms). 0 = use RAF
   */
  throttle?: number;
}

/**
 * Hook to track mouse position globally or relative to an element.
 * Uses requestAnimationFrame for smooth 60fps updates.
 *
 * @param options - Configuration options
 * @returns MousePosition object with x, y, isActive, and velocity
 */
export function useMousePosition(options: UseMousePositionOptions = {}): MousePosition {
  const { relative = false, elementRef, trackVelocity = false, throttle = 0 } = options;

  const [position, setPosition] = useState<MousePosition>({
    x: 0,
    y: 0,
    clientX: 0,
    clientY: 0,
    isActive: false,
    velocity: { x: 0, y: 0 },
  });

  const frameRef = useRef<number | null>(null);
  const lastPositionRef = useRef({ x: 0, y: 0 });
  const lastTimeRef = useRef(Date.now());
  const throttleTimeRef = useRef(0);

  const updatePosition = useCallback(
    (clientX: number, clientY: number) => {
      const now = Date.now();

      // Throttle check
      if (throttle > 0 && now - throttleTimeRef.current < throttle) {
        return;
      }
      throttleTimeRef.current = now;

      let x = clientX;
      let y = clientY;

      // Calculate relative position if needed
      if (relative && elementRef?.current) {
        const rect = elementRef.current.getBoundingClientRect();
        x = clientX - rect.left;
        y = clientY - rect.top;
      }

      // Calculate velocity if needed
      let velocity = { x: 0, y: 0 };
      if (trackVelocity) {
        const dt = (now - lastTimeRef.current) / 1000; // Convert to seconds
        if (dt > 0) {
          velocity = {
            x: (x - lastPositionRef.current.x) / dt,
            y: (y - lastPositionRef.current.y) / dt,
          };
        }
      }

      lastPositionRef.current = { x, y };
      lastTimeRef.current = now;

      setPosition({
        x,
        y,
        clientX,
        clientY,
        isActive: true,
        velocity,
      });
    },
    [relative, elementRef, trackVelocity, throttle]
  );

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleMouseMove = (event: MouseEvent) => {
      if (throttle === 0) {
        // Use RAF for smooth updates
        if (frameRef.current) {
          cancelAnimationFrame(frameRef.current);
        }
        frameRef.current = requestAnimationFrame(() => {
          updatePosition(event.clientX, event.clientY);
        });
      } else {
        updatePosition(event.clientX, event.clientY);
      }
    };

    const handleMouseLeave = () => {
      setPosition((prev) => ({ ...prev, isActive: false }));
    };

    const handleMouseEnter = () => {
      setPosition((prev) => ({ ...prev, isActive: true }));
    };

    // Add listeners
    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    document.addEventListener('mouseleave', handleMouseLeave);
    document.addEventListener('mouseenter', handleMouseEnter);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
      document.removeEventListener('mouseenter', handleMouseEnter);

      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }
    };
  }, [updatePosition, throttle]);

  return position;
}

/**
 * Hook to track mouse position relative to a specific element.
 * Returns normalized coordinates (0-1) within the element bounds.
 *
 * @param elementRef - Reference to the target element
 * @returns Normalized mouse position (0-1) and whether mouse is over the element
 */
export function useRelativeMousePosition(elementRef: React.RefObject<HTMLElement>) {
  const [position, setPosition] = useState({
    x: 0.5,
    y: 0.5,
    isOver: false,
  });

  const frameRef = useRef<number | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined' || !elementRef.current) return;

    const element = elementRef.current;

    const handleMouseMove = (event: MouseEvent) => {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }

      frameRef.current = requestAnimationFrame(() => {
        const rect = element.getBoundingClientRect();
        const x = (event.clientX - rect.left) / rect.width;
        const y = (event.clientY - rect.top) / rect.height;

        setPosition({
          x: Math.max(0, Math.min(1, x)),
          y: Math.max(0, Math.min(1, y)),
          isOver: x >= 0 && x <= 1 && y >= 0 && y <= 1,
        });
      });
    };

    const handleMouseLeave = () => {
      setPosition((prev) => ({ ...prev, isOver: false }));
    };

    const handleMouseEnter = () => {
      setPosition((prev) => ({ ...prev, isOver: true }));
    };

    element.addEventListener('mousemove', handleMouseMove, { passive: true });
    element.addEventListener('mouseleave', handleMouseLeave);
    element.addEventListener('mouseenter', handleMouseEnter);

    return () => {
      element.removeEventListener('mousemove', handleMouseMove);
      element.removeEventListener('mouseleave', handleMouseLeave);
      element.removeEventListener('mouseenter', handleMouseEnter);

      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }
    };
  }, [elementRef]);

  return position;
}
