'use client';

import React, { useEffect, useState } from 'react';
import { motion, useSpring, useScroll, useTransform } from 'framer-motion';
import { useReducedMotion } from '@/hooks/animations/use-reduced-motion';

interface ScrollProgressProps {
  /**
   * Color of the progress bar
   */
  color?: string;
  /**
   * Height of the bar in pixels
   */
  height?: number;
  /**
   * Position of the bar
   */
  position?: 'top' | 'bottom';
  /**
   * Whether to show a glow effect
   */
  glow?: boolean;
  /**
   * Z-index of the bar
   */
  zIndex?: number;
}

export function ScrollProgress({
  color = 'rgb(56, 189, 248)',
  height = 3,
  position = 'top',
  glow = true,
  zIndex = 9999,
}: ScrollProgressProps) {
  const prefersReducedMotion = useReducedMotion();
  const { scrollYProgress } = useScroll();

  // Spring-animate the progress for smoother feel
  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001,
  });

  // Transform to percentage for scaleX
  const scaleX = useTransform(smoothProgress, [0, 1], [0, 1]);

  if (prefersReducedMotion) {
    return null;
  }

  return (
    <div
      className="fixed left-0 right-0 pointer-events-none"
      style={{
        [position]: 0,
        height,
        zIndex,
      }}
    >
      <motion.div
        className="h-full origin-left"
        style={{
          scaleX,
          background: color,
          boxShadow: glow ? `0 0 10px ${color}, 0 0 20px ${color}50` : 'none',
        }}
      />
    </div>
  );
}

/**
 * Circular scroll progress indicator
 */
interface CircularProgressProps {
  size?: number;
  strokeWidth?: number;
  color?: string;
  backgroundColor?: string;
  showPercentage?: boolean;
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
}

export function CircularScrollProgress({
  size = 48,
  strokeWidth = 3,
  color = 'rgb(56, 189, 248)',
  backgroundColor = 'rgba(255, 255, 255, 0.1)',
  showPercentage = true,
  position = 'bottom-right',
}: CircularProgressProps) {
  const prefersReducedMotion = useReducedMotion();
  const { scrollYProgress } = useScroll();
  const [percentage, setPercentage] = useState(0);

  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
  });

  // Calculate circle properties
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;

  // Transform progress to stroke offset
  const strokeDashoffset = useTransform(
    smoothProgress,
    [0, 1],
    [circumference, 0]
  );

  useEffect(() => {
    return smoothProgress.on('change', (latest) => {
      setPercentage(Math.round(latest * 100));
    });
  }, [smoothProgress]);

  // Position styles
  const positionStyles: Record<string, React.CSSProperties> = {
    'bottom-right': { bottom: 24, right: 24 },
    'bottom-left': { bottom: 24, left: 24 },
    'top-right': { top: 24, right: 24 },
    'top-left': { top: 24, left: 24 },
  };

  if (prefersReducedMotion) {
    return null;
  }

  return (
    <motion.div
      className="fixed z-50"
      style={positionStyles[position]}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.5 }}
    >
      <div className="relative" style={{ width: size, height: size }}>
        <svg
          className="transform -rotate-90"
          width={size}
          height={size}
        >
          {/* Background circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={backgroundColor}
            strokeWidth={strokeWidth}
          />
          {/* Progress circle */}
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            style={{ strokeDashoffset }}
          />
        </svg>
        {showPercentage && (
          <div
            className="absolute inset-0 flex items-center justify-center text-xs font-medium"
            style={{ color }}
          >
            {percentage}%
          </div>
        )}
      </div>
    </motion.div>
  );
}

/**
 * Dot-based scroll progress indicator
 */
interface DotProgressProps {
  sections?: number;
  color?: string;
  activeColor?: string;
  size?: number;
  gap?: number;
  position?: 'right' | 'left';
}

export function DotScrollProgress({
  sections = 5,
  color = 'rgba(255, 255, 255, 0.2)',
  activeColor = 'rgb(56, 189, 248)',
  size = 8,
  gap = 12,
  position = 'right',
}: DotProgressProps) {
  const prefersReducedMotion = useReducedMotion();
  const { scrollYProgress } = useScroll();
  const [activeSection, setActiveSection] = useState(0);

  useEffect(() => {
    return scrollYProgress.on('change', (latest) => {
      setActiveSection(Math.min(sections - 1, Math.floor(latest * sections)));
    });
  }, [scrollYProgress, sections]);

  if (prefersReducedMotion) {
    return null;
  }

  return (
    <div
      className="fixed top-1/2 -translate-y-1/2 z-50 flex flex-col"
      style={{
        [position]: 24,
        gap,
      }}
    >
      {Array.from({ length: sections }).map((_, index) => (
        <motion.div
          key={index}
          className="rounded-full transition-colors duration-300"
          style={{
            width: size,
            height: size,
            backgroundColor: index <= activeSection ? activeColor : color,
            boxShadow: index <= activeSection ? `0 0 8px ${activeColor}` : 'none',
          }}
          animate={{
            scale: index === activeSection ? 1.3 : 1,
          }}
          transition={{ duration: 0.2 }}
        />
      ))}
    </div>
  );
}
