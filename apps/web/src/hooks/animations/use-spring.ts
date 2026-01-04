'use client';

import { useSpring as useFramerSpring, useTransform, MotionValue } from 'framer-motion';
import { useAnimationStore } from '@/store/animation-store';
import { useReducedMotion } from './use-reduced-motion';

export type SpringPreset = 'snappy' | 'smooth' | 'bouncy' | 'gentle' | 'stiff';

interface SpringConfig {
  stiffness: number;
  damping: number;
  mass?: number;
}

/**
 * Predefined spring configurations for different animation feels
 */
export const SPRING_PRESETS: Record<SpringPreset, SpringConfig> = {
  snappy: { stiffness: 400, damping: 30, mass: 1 },
  smooth: { stiffness: 100, damping: 20, mass: 1 },
  bouncy: { stiffness: 300, damping: 15, mass: 1 },
  gentle: { stiffness: 50, damping: 15, mass: 1 },
  stiff: { stiffness: 500, damping: 40, mass: 1 },
};

/**
 * Hook that wraps framer-motion's useSpring with preset configurations.
 * Respects reduced motion preferences and animation scale.
 *
 * @param initialValue - The initial value for the spring
 * @param preset - The spring preset to use (default: 'smooth')
 * @returns A MotionValue with spring physics
 */
export function useSpring(initialValue: number, preset: SpringPreset = 'smooth'): MotionValue<number> {
  const prefersReducedMotion = useReducedMotion();
  const { animationScale } = useAnimationStore();

  const config = SPRING_PRESETS[preset];

  // If reduced motion, use very stiff spring (effectively instant)
  const springConfig = prefersReducedMotion
    ? { stiffness: 1000, damping: 100 }
    : {
        stiffness: config.stiffness * animationScale,
        damping: config.damping,
        mass: config.mass,
      };

  return useFramerSpring(initialValue, springConfig);
}

/**
 * Hook for creating a 2D spring-animated position.
 *
 * @param x - Initial x value
 * @param y - Initial y value
 * @param preset - Spring preset to use
 * @returns Object with x and y MotionValues
 */
export function useSpringPosition(
  x: number,
  y: number,
  preset: SpringPreset = 'smooth'
): { x: MotionValue<number>; y: MotionValue<number> } {
  const springX = useSpring(x, preset);
  const springY = useSpring(y, preset);

  return { x: springX, y: springY };
}

/**
 * Hook for creating a spring-animated scale value.
 *
 * @param initialScale - Initial scale (default: 1)
 * @param preset - Spring preset to use
 * @returns A MotionValue for scale
 */
export function useSpringScale(initialScale: number = 1, preset: SpringPreset = 'bouncy'): MotionValue<number> {
  return useSpring(initialScale, preset);
}

/**
 * Hook for creating a spring-animated rotation.
 *
 * @param initialRotation - Initial rotation in degrees
 * @param preset - Spring preset to use
 * @returns A MotionValue for rotation
 */
export function useSpringRotation(initialRotation: number = 0, preset: SpringPreset = 'smooth'): MotionValue<number> {
  return useSpring(initialRotation, preset);
}

/**
 * Hook for creating a spring-animated opacity.
 *
 * @param initialOpacity - Initial opacity (0-1)
 * @param preset - Spring preset to use
 * @returns A MotionValue for opacity
 */
export function useSpringOpacity(initialOpacity: number = 1, preset: SpringPreset = 'gentle'): MotionValue<number> {
  return useSpring(initialOpacity, preset);
}

/**
 * Hook that creates a spring value that follows a target value with delay.
 * Useful for creating trailing/following effects.
 *
 * @param targetValue - The value to follow
 * @param preset - Spring preset to use
 * @returns A MotionValue that follows the target
 */
export function useFollowSpring(targetValue: MotionValue<number>, preset: SpringPreset = 'smooth'): MotionValue<number> {
  const prefersReducedMotion = useReducedMotion();
  const { animationScale } = useAnimationStore();

  const config = SPRING_PRESETS[preset];

  const springConfig = prefersReducedMotion
    ? { stiffness: 1000, damping: 100 }
    : {
        stiffness: config.stiffness * animationScale * 0.5, // Slower to create delay
        damping: config.damping,
        mass: config.mass,
      };

  return useFramerSpring(targetValue, springConfig);
}

/**
 * Hook that transforms a value through a spring for smooth interpolation.
 *
 * @param value - The input MotionValue
 * @param inputRange - The input range [min, max]
 * @param outputRange - The output range [min, max]
 * @param preset - Spring preset to use
 * @returns A transformed and spring-animated MotionValue
 */
export function useSpringTransform(
  value: MotionValue<number>,
  inputRange: [number, number],
  outputRange: [number, number],
  preset: SpringPreset = 'smooth'
): MotionValue<number> {
  const transformed = useTransform(value, inputRange, outputRange);
  const prefersReducedMotion = useReducedMotion();
  const { animationScale } = useAnimationStore();

  const config = SPRING_PRESETS[preset];

  const springConfig = prefersReducedMotion
    ? { stiffness: 1000, damping: 100 }
    : {
        stiffness: config.stiffness * animationScale,
        damping: config.damping,
        mass: config.mass,
      };

  return useFramerSpring(transformed, springConfig);
}

/**
 * Get spring configuration without creating a hook.
 * Useful for passing to framer-motion's transition prop.
 *
 * @param preset - The spring preset
 * @param scale - Animation scale override (default: 1)
 * @returns Spring configuration object
 */
export function getSpringConfig(preset: SpringPreset = 'smooth', scale: number = 1): SpringConfig {
  const config = SPRING_PRESETS[preset];
  return {
    stiffness: config.stiffness * scale,
    damping: config.damping,
    mass: config.mass,
  };
}
