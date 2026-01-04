'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useReducedMotion } from '@/hooks/animations/use-reduced-motion';

export type CursorState = 'default' | 'hover' | 'click' | 'drag' | 'text' | 'hidden';

interface CursorContextType {
  cursorState: CursorState;
  cursorScale: number;
  cursorText: string;
  magneticTarget: { x: number; y: number } | null;
  isVisible: boolean;
  setCursorState: (state: CursorState) => void;
  setCursorScale: (scale: number) => void;
  setCursorText: (text: string) => void;
  setMagneticTarget: (target: { x: number; y: number } | null) => void;
  setIsVisible: (visible: boolean) => void;
  registerHoverElement: (element: HTMLElement) => void;
  unregisterHoverElement: (element: HTMLElement) => void;
}

const CursorContext = createContext<CursorContextType | null>(null);

interface CursorProviderProps {
  children: React.ReactNode;
  enabled?: boolean;
}

export function CursorProvider({ children, enabled = true }: CursorProviderProps) {
  const [cursorState, setCursorState] = useState<CursorState>('default');
  const [cursorScale, setCursorScale] = useState(1);
  const [cursorText, setCursorText] = useState('');
  const [magneticTarget, setMagneticTarget] = useState<{ x: number; y: number } | null>(null);
  const [isVisible, setIsVisible] = useState(true);
  const prefersReducedMotion = useReducedMotion();

  // Handle hover element registration
  const registerHoverElement = useCallback((element: HTMLElement) => {
    const cursorType = element.getAttribute('data-cursor') || 'hover';
    const cursorScaleAttr = element.getAttribute('data-cursor-scale');
    const cursorTextAttr = element.getAttribute('data-cursor-text');

    const handleEnter = () => {
      setCursorState(cursorType as CursorState);
      if (cursorScaleAttr) {
        setCursorScale(parseFloat(cursorScaleAttr));
      } else {
        setCursorScale(1.5);
      }
      if (cursorTextAttr) {
        setCursorText(cursorTextAttr);
      }
    };

    const handleLeave = () => {
      setCursorState('default');
      setCursorScale(1);
      setCursorText('');
    };

    element.addEventListener('mouseenter', handleEnter);
    element.addEventListener('mouseleave', handleLeave);

    // Store cleanup functions on the element
    (element as HTMLElement & { _cursorCleanup?: () => void })._cursorCleanup = () => {
      element.removeEventListener('mouseenter', handleEnter);
      element.removeEventListener('mouseleave', handleLeave);
    };
  }, []);

  const unregisterHoverElement = useCallback((element: HTMLElement) => {
    const cleanup = (element as HTMLElement & { _cursorCleanup?: () => void })._cursorCleanup;
    if (cleanup) {
      cleanup();
    }
  }, []);

  // Auto-register interactive elements
  useEffect(() => {
    if (!enabled || prefersReducedMotion) return;

    const registerInteractiveElements = () => {
      // Find all elements with data-cursor attribute
      const elements = document.querySelectorAll('[data-cursor]');
      elements.forEach((element) => {
        registerHoverElement(element as HTMLElement);
      });

      // Also register buttons, links, and inputs
      const interactiveElements = document.querySelectorAll(
        'button:not([data-cursor]), a:not([data-cursor]), input:not([data-cursor]), [role="button"]:not([data-cursor])'
      );
      interactiveElements.forEach((element) => {
        (element as HTMLElement).setAttribute('data-cursor', 'hover');
        registerHoverElement(element as HTMLElement);
      });
    };

    // Initial registration
    registerInteractiveElements();

    // Re-register on DOM changes
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node instanceof HTMLElement) {
            if (node.hasAttribute('data-cursor')) {
              registerHoverElement(node);
            }
            const children = node.querySelectorAll('[data-cursor]');
            children.forEach((child) => registerHoverElement(child as HTMLElement));
          }
        });
      });
    });

    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      observer.disconnect();
    };
  }, [enabled, prefersReducedMotion, registerHoverElement]);

  // Add class to body when cursor is active
  useEffect(() => {
    if (enabled && !prefersReducedMotion) {
      document.body.classList.add('custom-cursor-active');
    } else {
      document.body.classList.remove('custom-cursor-active');
    }

    return () => {
      document.body.classList.remove('custom-cursor-active');
    };
  }, [enabled, prefersReducedMotion]);

  const value: CursorContextType = {
    cursorState,
    cursorScale,
    cursorText,
    magneticTarget,
    isVisible,
    setCursorState,
    setCursorScale,
    setCursorText,
    setMagneticTarget,
    setIsVisible,
    registerHoverElement,
    unregisterHoverElement,
  };

  return <CursorContext.Provider value={value}>{children}</CursorContext.Provider>;
}

export function useCursor() {
  const context = useContext(CursorContext);
  if (!context) {
    throw new Error('useCursor must be used within a CursorProvider');
  }
  return context;
}

/**
 * Hook for cursor hover state on a specific element
 */
export function useCursorHover(cursorType: CursorState = 'hover', scale?: number) {
  const { setCursorState, setCursorScale } = useCursor();

  const onMouseEnter = useCallback(() => {
    setCursorState(cursorType);
    if (scale) setCursorScale(scale);
  }, [cursorType, scale, setCursorState, setCursorScale]);

  const onMouseLeave = useCallback(() => {
    setCursorState('default');
    setCursorScale(1);
  }, [setCursorState, setCursorScale]);

  return { onMouseEnter, onMouseLeave };
}
