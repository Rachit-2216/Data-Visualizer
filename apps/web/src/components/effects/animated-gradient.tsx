'use client';

import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useReducedMotion } from '@/hooks/animations/use-reduced-motion';

interface AnimatedGradientProps {
  /**
   * Duration of one full gradient rotation in seconds
   */
  duration?: number;
  /**
   * Gradient colors
   */
  colors?: string[];
  /**
   * Whether to add noise texture overlay
   */
  noise?: boolean;
  /**
   * Opacity of the gradient (0-1)
   */
  opacity?: number;
  /**
   * Additional CSS classes
   */
  className?: string;
}

export function AnimatedGradient({
  duration = 45,
  colors = ['#1e1b4b', '#0f172a', '#06b6d4', '#3b82f6', '#1e1b4b'],
  noise = true,
  opacity = 0.5,
  className = '',
}: AnimatedGradientProps) {
  const prefersReducedMotion = useReducedMotion();

  const gradientStyle = {
    background: `linear-gradient(135deg, ${colors.join(', ')})`,
    backgroundSize: '400% 400%',
  };

  return (
    <div
      className={`absolute inset-0 overflow-hidden ${className}`}
      style={{ opacity }}
    >
      {/* Main animated gradient */}
      <motion.div
        className="absolute inset-0"
        style={gradientStyle}
        animate={
          prefersReducedMotion
            ? {}
            : {
                backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
              }
        }
        transition={{
          duration,
          repeat: Infinity,
          ease: 'linear',
        }}
      />

      {/* Noise texture overlay */}
      {noise && (
        <div
          className="absolute inset-0 opacity-[0.03] mix-blend-overlay"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          }}
        />
      )}
    </div>
  );
}

/**
 * Aurora borealis-style animated waves
 */
interface AuroraWavesProps {
  className?: string;
  color?: string;
}

export function AuroraWaves({ className = '', color = 'rgba(56, 189, 248, 0.3)' }: AuroraWavesProps) {
  const prefersReducedMotion = useReducedMotion();

  if (prefersReducedMotion) {
    return (
      <div
        className={`absolute inset-0 ${className}`}
        style={{
          background: `radial-gradient(ellipse at 50% 50%, ${color}, transparent 70%)`,
        }}
      />
    );
  }

  return (
    <div className={`absolute inset-0 overflow-hidden ${className}`}>
      {/* Wave 1 */}
      <motion.div
        className="absolute left-1/2 top-0 h-[600px] w-[1200px] -translate-x-1/2 rounded-full blur-[100px]"
        style={{ background: color }}
        animate={{
          y: [0, -30, 0],
          scale: [1, 1.1, 1],
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      {/* Wave 2 */}
      <motion.div
        className="absolute left-1/4 top-20 h-[400px] w-[800px] rounded-full blur-[80px]"
        style={{ background: 'rgba(168, 85, 247, 0.2)' }}
        animate={{
          y: [0, 20, 0],
          x: [-20, 20, -20],
          scale: [1, 1.05, 1],
          opacity: [0.2, 0.4, 0.2],
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: 'easeInOut',
          delay: 1,
        }}
      />

      {/* Wave 3 */}
      <motion.div
        className="absolute right-1/4 top-40 h-[300px] w-[600px] rounded-full blur-[60px]"
        style={{ background: 'rgba(34, 211, 238, 0.2)' }}
        animate={{
          y: [0, -20, 0],
          x: [20, -20, 20],
          scale: [1, 1.08, 1],
          opacity: [0.25, 0.4, 0.25],
        }}
        transition={{
          duration: 12,
          repeat: Infinity,
          ease: 'easeInOut',
          delay: 2,
        }}
      />
    </div>
  );
}

/**
 * Floating particles effect
 */
interface FloatingParticlesProps {
  count?: number;
  color?: string;
  className?: string;
}

export function FloatingParticles({
  count = 30,
  color = 'rgba(56, 189, 248, 0.5)',
  className = '',
}: FloatingParticlesProps) {
  const prefersReducedMotion = useReducedMotion();
  const particles = useRef(
    Array.from({ length: count }, () => ({
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: 1 + Math.random() * 3,
      duration: 10 + Math.random() * 20,
      delay: Math.random() * 10,
    }))
  ).current;

  if (prefersReducedMotion) {
    return null;
  }

  return (
    <div className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}>
      {particles.map((particle, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            width: particle.size,
            height: particle.size,
            backgroundColor: color,
            boxShadow: `0 0 ${particle.size * 2}px ${color}`,
          }}
          animate={{
            y: [0, -100, 0],
            x: [0, Math.random() * 40 - 20, 0],
            opacity: [0, 0.8, 0],
          }}
          transition={{
            duration: particle.duration,
            repeat: Infinity,
            delay: particle.delay,
            ease: 'linear',
          }}
        />
      ))}
    </div>
  );
}
