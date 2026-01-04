'use client';

import React from 'react';
import { motion, Variants, Transition } from 'framer-motion';
import { useIntersection } from '@/hooks/animations/use-intersection';
import { useReducedMotion } from '@/hooks/animations/use-reduced-motion';

type RevealAnimation =
  | 'fade'
  | 'fade-up'
  | 'fade-down'
  | 'fade-left'
  | 'fade-right'
  | 'zoom-in'
  | 'zoom-out'
  | 'slide-up'
  | 'slide-down'
  | 'flip'
  | 'rotate';

interface ScrollRevealProps {
  children: React.ReactNode;
  /**
   * Animation type
   */
  animation?: RevealAnimation;
  /**
   * Duration of the animation
   */
  duration?: number;
  /**
   * Delay before animation starts
   */
  delay?: number;
  /**
   * Threshold for triggering (0-1)
   */
  threshold?: number;
  /**
   * Whether to animate only once
   */
  once?: boolean;
  /**
   * Distance for translate animations (in pixels)
   */
  distance?: number;
  /**
   * Additional CSS classes
   */
  className?: string;
  /**
   * Custom variants override
   */
  variants?: Variants;
}

export function ScrollReveal({
  children,
  animation = 'fade-up',
  duration = 0.6,
  delay = 0,
  threshold = 0.2,
  once = true,
  distance = 30,
  className = '',
  variants: customVariants,
}: ScrollRevealProps) {
  const { ref, inView } = useIntersection({ threshold, triggerOnce: once });
  const prefersReducedMotion = useReducedMotion();

  const getVariants = (): Variants => {
    if (customVariants) return customVariants;

    const baseTransition: Transition = {
      duration,
      delay,
      ease: [0.16, 1, 0.3, 1],
    };

    switch (animation) {
      case 'fade':
        return {
          hidden: { opacity: 0 },
          visible: { opacity: 1, transition: baseTransition },
        };
      case 'fade-up':
        return {
          hidden: { opacity: 0, y: distance },
          visible: { opacity: 1, y: 0, transition: baseTransition },
        };
      case 'fade-down':
        return {
          hidden: { opacity: 0, y: -distance },
          visible: { opacity: 1, y: 0, transition: baseTransition },
        };
      case 'fade-left':
        return {
          hidden: { opacity: 0, x: distance },
          visible: { opacity: 1, x: 0, transition: baseTransition },
        };
      case 'fade-right':
        return {
          hidden: { opacity: 0, x: -distance },
          visible: { opacity: 1, x: 0, transition: baseTransition },
        };
      case 'zoom-in':
        return {
          hidden: { opacity: 0, scale: 0.8 },
          visible: { opacity: 1, scale: 1, transition: baseTransition },
        };
      case 'zoom-out':
        return {
          hidden: { opacity: 0, scale: 1.2 },
          visible: { opacity: 1, scale: 1, transition: baseTransition },
        };
      case 'slide-up':
        return {
          hidden: { y: distance },
          visible: { y: 0, transition: baseTransition },
        };
      case 'slide-down':
        return {
          hidden: { y: -distance },
          visible: { y: 0, transition: baseTransition },
        };
      case 'flip':
        return {
          hidden: { opacity: 0, rotateX: 90 },
          visible: { opacity: 1, rotateX: 0, transition: baseTransition },
        };
      case 'rotate':
        return {
          hidden: { opacity: 0, rotate: -10 },
          visible: { opacity: 1, rotate: 0, transition: baseTransition },
        };
      default:
        return {
          hidden: { opacity: 0 },
          visible: { opacity: 1, transition: baseTransition },
        };
    }
  };

  if (prefersReducedMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      ref={ref}
      className={className}
      initial="hidden"
      animate={inView ? 'visible' : 'hidden'}
      variants={getVariants()}
    >
      {children}
    </motion.div>
  );
}

/**
 * Staggered reveal for lists of items
 */
interface StaggerRevealProps {
  children: React.ReactNode[];
  /**
   * Stagger delay between items
   */
  stagger?: number;
  /**
   * Animation type
   */
  animation?: RevealAnimation;
  /**
   * Duration per item
   */
  duration?: number;
  /**
   * Initial delay
   */
  delay?: number;
  /**
   * Threshold for triggering
   */
  threshold?: number;
  /**
   * Whether to animate only once
   */
  once?: boolean;
  /**
   * Additional CSS classes for container
   */
  className?: string;
  /**
   * Additional CSS classes for items
   */
  itemClassName?: string;
}

export function StaggerReveal({
  children,
  stagger = 0.1,
  animation = 'fade-up',
  duration = 0.5,
  delay = 0,
  threshold = 0.1,
  once = true,
  className = '',
  itemClassName = '',
}: StaggerRevealProps) {
  const { ref, inView } = useIntersection({ threshold, triggerOnce: once });
  const prefersReducedMotion = useReducedMotion();

  const containerVariants: Variants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: stagger,
        delayChildren: delay,
      },
    },
  };

  const getItemVariants = (): Variants => {
    switch (animation) {
      case 'fade-up':
        return {
          hidden: { opacity: 0, y: 20 },
          visible: {
            opacity: 1,
            y: 0,
            transition: { duration, ease: [0.16, 1, 0.3, 1] },
          },
        };
      case 'fade-left':
        return {
          hidden: { opacity: 0, x: 20 },
          visible: {
            opacity: 1,
            x: 0,
            transition: { duration, ease: [0.16, 1, 0.3, 1] },
          },
        };
      case 'zoom-in':
        return {
          hidden: { opacity: 0, scale: 0.8 },
          visible: {
            opacity: 1,
            scale: 1,
            transition: { duration, ease: [0.16, 1, 0.3, 1] },
          },
        };
      default:
        return {
          hidden: { opacity: 0 },
          visible: {
            opacity: 1,
            transition: { duration, ease: [0.16, 1, 0.3, 1] },
          },
        };
    }
  };

  if (prefersReducedMotion) {
    return (
      <div className={className}>
        {React.Children.map(children, (child, i) => (
          <div key={i} className={itemClassName}>
            {child}
          </div>
        ))}
      </div>
    );
  }

  return (
    <motion.div
      ref={ref}
      className={className}
      initial="hidden"
      animate={inView ? 'visible' : 'hidden'}
      variants={containerVariants}
    >
      {React.Children.map(children, (child, i) => (
        <motion.div key={i} className={itemClassName} variants={getItemVariants()}>
          {child}
        </motion.div>
      ))}
    </motion.div>
  );
}

/**
 * Reveal on scroll with parallax effect
 */
interface ParallaxRevealProps {
  children: React.ReactNode;
  /**
   * Parallax offset distance
   */
  offset?: number;
  /**
   * Additional CSS classes
   */
  className?: string;
}

export function ParallaxReveal({ children, offset = 50, className = '' }: ParallaxRevealProps) {
  const { ref, inView } = useIntersection({ threshold: 0, triggerOnce: false });
  const prefersReducedMotion = useReducedMotion();

  if (prefersReducedMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      ref={ref}
      className={className}
      initial={{ y: offset, opacity: 0 }}
      animate={inView ? { y: 0, opacity: 1 } : { y: offset, opacity: 0 }}
      transition={{
        duration: 0.8,
        ease: [0.16, 1, 0.3, 1],
      }}
    >
      {children}
    </motion.div>
  );
}
