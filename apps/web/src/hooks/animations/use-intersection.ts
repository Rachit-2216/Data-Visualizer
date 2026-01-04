'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

interface UseIntersectionOptions {
  /**
   * The threshold(s) at which to trigger the callback (0-1)
   */
  threshold?: number | number[];
  /**
   * Margin around the root element
   */
  rootMargin?: string;
  /**
   * Only trigger once (default: false)
   */
  triggerOnce?: boolean;
  /**
   * Delay before considering element as in view (ms)
   */
  delay?: number;
  /**
   * Custom root element (default: viewport)
   */
  root?: Element | null;
  /**
   * Callback when intersection changes
   */
  onChange?: (inView: boolean, entry: IntersectionObserverEntry) => void;
}

interface UseIntersectionReturn {
  ref: (node: Element | null) => void;
  inView: boolean;
  entry: IntersectionObserverEntry | null;
}

/**
 * Hook for detecting when an element enters or leaves the viewport.
 * Useful for scroll-triggered animations.
 *
 * @param options - Configuration options
 * @returns Object with ref callback, inView boolean, and entry
 */
export function useIntersection(options: UseIntersectionOptions = {}): UseIntersectionReturn {
  const {
    threshold = 0,
    rootMargin = '0px',
    triggerOnce = false,
    delay = 0,
    root = null,
    onChange,
  } = options;

  const [inView, setInView] = useState(false);
  const [entry, setEntry] = useState<IntersectionObserverEntry | null>(null);
  const elementRef = useRef<Element | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const hasTriggeredRef = useRef(false);
  const delayTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const unobserve = useCallback(() => {
    if (observerRef.current && elementRef.current) {
      observerRef.current.unobserve(elementRef.current);
    }
  }, []);

  const ref = useCallback(
    (node: Element | null) => {
      // Cleanup previous observer
      if (observerRef.current) {
        observerRef.current.disconnect();
      }

      if (delayTimeoutRef.current) {
        clearTimeout(delayTimeoutRef.current);
      }

      elementRef.current = node;

      if (!node) return;

      // Skip if already triggered once
      if (triggerOnce && hasTriggeredRef.current) return;

      // Create new observer
      observerRef.current = new IntersectionObserver(
        (entries) => {
          const [observerEntry] = entries;
          setEntry(observerEntry);

          const isIntersecting = observerEntry.isIntersecting;

          if (delay > 0 && isIntersecting) {
            // Delay the inView state
            delayTimeoutRef.current = setTimeout(() => {
              setInView(true);
              hasTriggeredRef.current = true;
              onChange?.(true, observerEntry);

              if (triggerOnce) {
                unobserve();
              }
            }, delay);
          } else {
            if (delayTimeoutRef.current) {
              clearTimeout(delayTimeoutRef.current);
            }

            setInView(isIntersecting);

            if (isIntersecting) {
              hasTriggeredRef.current = true;
              onChange?.(true, observerEntry);

              if (triggerOnce) {
                unobserve();
              }
            } else {
              onChange?.(false, observerEntry);
            }
          }
        },
        {
          threshold,
          rootMargin,
          root,
        }
      );

      observerRef.current.observe(node);
    },
    [threshold, rootMargin, root, triggerOnce, delay, onChange, unobserve]
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
      if (delayTimeoutRef.current) {
        clearTimeout(delayTimeoutRef.current);
      }
    };
  }, []);

  return { ref, inView, entry };
}

/**
 * Hook for scroll progress within an element.
 * Returns a value from 0 to 1 representing how much of the element has been scrolled through.
 *
 * @param options - Configuration options
 * @returns Object with ref, progress (0-1), and inView
 */
export function useScrollProgress(options: { offset?: [string, string] } = {}) {
  const { offset = ['start end', 'end start'] } = options;

  const [progress, setProgress] = useState(0);
  const elementRef = useRef<HTMLElement | null>(null);
  const frameRef = useRef<number | null>(null);

  const ref = useCallback((node: HTMLElement | null) => {
    elementRef.current = node;
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined' || !elementRef.current) return;

    const element = elementRef.current;

    const calculateProgress = () => {
      const rect = element.getBoundingClientRect();
      const windowHeight = window.innerHeight;

      // Calculate progress: 0 when element top is at bottom of viewport
      // 1 when element bottom is at top of viewport
      const start = windowHeight;
      const end = -rect.height;
      const current = rect.top;

      const progressValue = 1 - (current - end) / (start - end);
      setProgress(Math.max(0, Math.min(1, progressValue)));
    };

    const handleScroll = () => {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }
      frameRef.current = requestAnimationFrame(calculateProgress);
    };

    // Initial calculation
    calculateProgress();

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', calculateProgress, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', calculateProgress);
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }
    };
  }, []);

  return { ref, progress };
}

/**
 * Hook for triggering staggered animations on children.
 *
 * @param inView - Whether the parent is in view
 * @param childCount - Number of children to stagger
 * @param staggerDelay - Delay between each child (ms)
 * @returns Array of booleans indicating which children should be visible
 */
export function useStaggeredReveal(
  inView: boolean,
  childCount: number,
  staggerDelay: number = 100
): boolean[] {
  const [visibleChildren, setVisibleChildren] = useState<boolean[]>(
    new Array(childCount).fill(false)
  );
  const timeoutsRef = useRef<NodeJS.Timeout[]>([]);

  useEffect(() => {
    // Clear existing timeouts
    timeoutsRef.current.forEach(clearTimeout);
    timeoutsRef.current = [];

    if (inView) {
      // Reveal children one by one
      for (let i = 0; i < childCount; i++) {
        const timeout = setTimeout(() => {
          setVisibleChildren((prev) => {
            const next = [...prev];
            next[i] = true;
            return next;
          });
        }, i * staggerDelay);
        timeoutsRef.current.push(timeout);
      }
    } else {
      // Hide all children
      setVisibleChildren(new Array(childCount).fill(false));
    }

    return () => {
      timeoutsRef.current.forEach(clearTimeout);
    };
  }, [inView, childCount, staggerDelay]);

  return visibleChildren;
}

/**
 * Hook that returns true only once when element enters view.
 * Simpler version of useIntersection for basic reveal animations.
 *
 * @param threshold - Visibility threshold (0-1)
 * @returns Object with ref and hasAppeared boolean
 */
export function useAppearOnce(threshold: number = 0.1) {
  const { ref, inView } = useIntersection({
    threshold,
    triggerOnce: true,
  });

  return { ref, hasAppeared: inView };
}
