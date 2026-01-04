'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useReducedMotion } from '@/hooks/animations/use-reduced-motion';

interface ChromaticTextProps {
  children: string;
  /**
   * Intensity of the RGB split effect (in pixels)
   */
  intensity?: number;
  /**
   * Whether to always show the effect or only on hover
   */
  alwaysOn?: boolean;
  /**
   * Additional CSS classes
   */
  className?: string;
  /**
   * Tag to use
   */
  as?: React.ElementType;
}

export function ChromaticText({
  children,
  intensity = 2,
  alwaysOn = false,
  className = '',
  as: Tag = 'span',
}: ChromaticTextProps) {
  const [isHovered, setIsHovered] = useState(false);
  const prefersReducedMotion = useReducedMotion();

  const showEffect = alwaysOn || isHovered;

  if (prefersReducedMotion) {
    return <Tag className={className}>{children}</Tag>;
  }

  return (
    <Tag
      className={`relative inline-block ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Base text */}
      <span className="relative z-10">{children}</span>

      {/* Red channel */}
      <motion.span
        className="absolute inset-0 pointer-events-none"
        style={{ color: '#ff0000', mixBlendMode: 'screen' }}
        initial={{ x: 0, opacity: 0 }}
        animate={{
          x: showEffect ? -intensity : 0,
          opacity: showEffect ? 0.5 : 0,
        }}
        transition={{ duration: 0.15 }}
        aria-hidden
      >
        {children}
      </motion.span>

      {/* Cyan channel */}
      <motion.span
        className="absolute inset-0 pointer-events-none"
        style={{ color: '#00ffff', mixBlendMode: 'screen' }}
        initial={{ x: 0, opacity: 0 }}
        animate={{
          x: showEffect ? intensity : 0,
          opacity: showEffect ? 0.5 : 0,
        }}
        transition={{ duration: 0.15 }}
        aria-hidden
      >
        {children}
      </motion.span>
    </Tag>
  );
}

/**
 * Glitch effect text
 */
interface GlitchTextProps {
  children: string;
  /**
   * Whether to always show the effect or only on hover
   */
  alwaysOn?: boolean;
  /**
   * Glitch intensity
   */
  intensity?: 'low' | 'medium' | 'high';
  /**
   * Additional CSS classes
   */
  className?: string;
}

export function GlitchText({
  children,
  alwaysOn = false,
  intensity = 'medium',
  className = '',
}: GlitchTextProps) {
  const [isHovered, setIsHovered] = useState(false);
  const prefersReducedMotion = useReducedMotion();

  const showEffect = alwaysOn || isHovered;

  const intensityValues = {
    low: { offset: 2, duration: 0.1 },
    medium: { offset: 4, duration: 0.08 },
    high: { offset: 6, duration: 0.05 },
  };

  const { offset, duration } = intensityValues[intensity];

  if (prefersReducedMotion) {
    return <span className={className}>{children}</span>;
  }

  return (
    <span
      className={`relative inline-block ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <span className="relative z-10">{children}</span>

      {showEffect && (
        <>
          {/* Glitch layer 1 */}
          <motion.span
            className="absolute inset-0 pointer-events-none text-cyan-400"
            style={{ clipPath: 'inset(10% 0 60% 0)' }}
            animate={{
              x: [0, -offset, offset, 0],
              opacity: [0, 1, 1, 0],
            }}
            transition={{
              duration: duration * 4,
              repeat: Infinity,
              repeatDelay: Math.random() * 2,
            }}
            aria-hidden
          >
            {children}
          </motion.span>

          {/* Glitch layer 2 */}
          <motion.span
            className="absolute inset-0 pointer-events-none text-red-400"
            style={{ clipPath: 'inset(50% 0 20% 0)' }}
            animate={{
              x: [0, offset, -offset, 0],
              opacity: [0, 1, 1, 0],
            }}
            transition={{
              duration: duration * 3,
              repeat: Infinity,
              repeatDelay: Math.random() * 2,
              delay: 0.1,
            }}
            aria-hidden
          >
            {children}
          </motion.span>
        </>
      )}
    </span>
  );
}

/**
 * Gradient text with animated gradient
 */
interface GradientTextProps {
  children: React.ReactNode;
  /**
   * Gradient colors
   */
  colors?: string[];
  /**
   * Animation duration in seconds
   */
  duration?: number;
  /**
   * Whether to animate the gradient
   */
  animate?: boolean;
  /**
   * Additional CSS classes
   */
  className?: string;
}

export function GradientText({
  children,
  colors = ['#38bdf8', '#818cf8', '#c084fc', '#38bdf8'],
  duration = 3,
  animate = true,
  className = '',
}: GradientTextProps) {
  const prefersReducedMotion = useReducedMotion();

  const gradientStyle = {
    backgroundImage: `linear-gradient(90deg, ${colors.join(', ')})`,
    backgroundSize: animate ? '200% auto' : '100% auto',
    WebkitBackgroundClip: 'text',
    backgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
  };

  if (prefersReducedMotion || !animate) {
    return (
      <span className={className} style={gradientStyle}>
        {children}
      </span>
    );
  }

  return (
    <motion.span
      className={className}
      style={gradientStyle}
      animate={{
        backgroundPosition: ['0% center', '200% center'],
      }}
      transition={{
        duration,
        repeat: Infinity,
        ease: 'linear',
      }}
    >
      {children}
    </motion.span>
  );
}
