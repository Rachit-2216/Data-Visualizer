'use client';

import React, { useEffect, useRef, useState } from 'react';
import { motion, useSpring, useTransform } from 'framer-motion';
import { useMousePosition } from '@/hooks/animations/use-mouse-position';
import { useReducedMotion } from '@/hooks/animations/use-reduced-motion';
import { useCursor } from './cursor-provider';

interface CustomCursorProps {
  /**
   * Color of the cursor (CSS color value)
   */
  color?: string;
  /**
   * Whether to show the cursor
   */
  enabled?: boolean;
}

export function CustomCursor({ color = 'rgb(56, 189, 248)', enabled = true }: CustomCursorProps) {
  const { cursorState, cursorScale, cursorText, isVisible } = useCursor();
  const prefersReducedMotion = useReducedMotion();
  const mousePosition = useMousePosition({ trackVelocity: true });
  const [isTouchDevice, setIsTouchDevice] = useState(false);

  // Check for touch device
  useEffect(() => {
    setIsTouchDevice('ontouchstart' in window || navigator.maxTouchPoints > 0);
  }, []);

  // Spring-animated cursor positions
  // Outer ring - slower, more delayed
  const outerX = useSpring(0, { stiffness: 80, damping: 15, mass: 1 });
  const outerY = useSpring(0, { stiffness: 80, damping: 15, mass: 1 });

  // Inner dot - faster, more responsive
  const innerX = useSpring(0, { stiffness: 400, damping: 28, mass: 0.5 });
  const innerY = useSpring(0, { stiffness: 400, damping: 28, mass: 0.5 });

  // Scale animation
  const scale = useSpring(1, { stiffness: 300, damping: 20 });

  // Update cursor positions
  useEffect(() => {
    if (prefersReducedMotion || !enabled || isTouchDevice) return;

    outerX.set(mousePosition.clientX);
    outerY.set(mousePosition.clientY);
    innerX.set(mousePosition.clientX);
    innerY.set(mousePosition.clientY);
  }, [
    mousePosition.clientX,
    mousePosition.clientY,
    outerX,
    outerY,
    innerX,
    innerY,
    prefersReducedMotion,
    enabled,
    isTouchDevice,
  ]);

  // Update scale based on cursor state
  useEffect(() => {
    scale.set(cursorScale);
  }, [cursorScale, scale]);

  // Don't render on touch devices, when disabled, or when reduced motion is preferred
  if (isTouchDevice || !enabled || prefersReducedMotion || !isVisible) {
    return null;
  }

  // Cursor state styles
  const getOuterStyles = () => {
    switch (cursorState) {
      case 'hover':
        return {
          borderColor: color,
          backgroundColor: `${color}20`,
        };
      case 'click':
        return {
          borderColor: color,
          backgroundColor: `${color}40`,
        };
      case 'text':
        return {
          borderColor: color,
          width: '4px',
          height: '24px',
          borderRadius: '2px',
        };
      case 'hidden':
        return {
          opacity: 0,
        };
      default:
        return {
          borderColor: `${color}80`,
          backgroundColor: 'transparent',
        };
    }
  };

  const getInnerStyles = () => {
    switch (cursorState) {
      case 'hover':
      case 'click':
        return {
          backgroundColor: color,
          opacity: 0.8,
        };
      case 'text':
        return {
          opacity: 0,
        };
      case 'hidden':
        return {
          opacity: 0,
        };
      default:
        return {
          backgroundColor: color,
          opacity: 1,
        };
    }
  };

  return (
    <>
      {/* Outer ring */}
      <motion.div
        className="fixed top-0 left-0 pointer-events-none z-[9999] mix-blend-difference"
        style={{
          x: outerX,
          y: outerY,
          scale,
          translateX: '-50%',
          translateY: '-50%',
        }}
      >
        <motion.div
          className="w-10 h-10 rounded-full border-2 transition-colors duration-150"
          style={getOuterStyles()}
          animate={{
            width: cursorState === 'text' ? 4 : 40,
            height: cursorState === 'text' ? 24 : 40,
            borderRadius: cursorState === 'text' ? 2 : 20,
          }}
          transition={{ duration: 0.15 }}
        />
        {cursorText && (
          <motion.span
            className="absolute left-1/2 top-full mt-2 -translate-x-1/2 whitespace-nowrap text-xs font-medium"
            style={{ color }}
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
          >
            {cursorText}
          </motion.span>
        )}
      </motion.div>

      {/* Inner dot */}
      <motion.div
        className="fixed top-0 left-0 w-2 h-2 rounded-full pointer-events-none z-[9999] mix-blend-difference"
        style={{
          x: innerX,
          y: innerY,
          translateX: '-50%',
          translateY: '-50%',
          ...getInnerStyles(),
        }}
      />
    </>
  );
}

/**
 * Simple cursor dot without the outer ring - for minimal effect
 */
export function CursorDot({ color = 'rgb(56, 189, 248)' }: { color?: string }) {
  const prefersReducedMotion = useReducedMotion();
  const mousePosition = useMousePosition();
  const [isTouchDevice, setIsTouchDevice] = useState(false);

  useEffect(() => {
    setIsTouchDevice('ontouchstart' in window || navigator.maxTouchPoints > 0);
  }, []);

  const x = useSpring(0, { stiffness: 500, damping: 28 });
  const y = useSpring(0, { stiffness: 500, damping: 28 });

  useEffect(() => {
    if (prefersReducedMotion || isTouchDevice) return;
    x.set(mousePosition.clientX);
    y.set(mousePosition.clientY);
  }, [mousePosition.clientX, mousePosition.clientY, x, y, prefersReducedMotion, isTouchDevice]);

  if (isTouchDevice || prefersReducedMotion) return null;

  return (
    <motion.div
      className="fixed top-0 left-0 w-3 h-3 rounded-full pointer-events-none z-[9999]"
      style={{
        x,
        y,
        translateX: '-50%',
        translateY: '-50%',
        backgroundColor: color,
        boxShadow: `0 0 10px ${color}, 0 0 20px ${color}50`,
      }}
    />
  );
}
