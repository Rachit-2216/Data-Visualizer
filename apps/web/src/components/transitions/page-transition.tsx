'use client';

import React from 'react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { usePathname } from 'next/navigation';
import { useReducedMotion } from '@/hooks/animations/use-reduced-motion';
import {
  pageVariants,
  wipeVariants,
  expandVariants,
  sliceVariants,
  flip3DVariants,
  defaultTransition,
  easings,
} from './transition-variants';

type TransitionType =
  | 'fade'
  | 'slideUp'
  | 'slideDown'
  | 'slideLeft'
  | 'slideRight'
  | 'scale'
  | 'scaleDown'
  | 'wipeRight'
  | 'wipeLeft'
  | 'wipeUp'
  | 'wipeDown'
  | 'wipeDiagonal'
  | 'expandFromCenter'
  | 'expandFromTopLeft'
  | 'expandFromBottomRight'
  | 'sliceDiagonal'
  | 'sliceReverse'
  | 'flipX'
  | 'flipY';

interface PageTransitionProps {
  children: React.ReactNode;
  /**
   * Transition type
   */
  type?: TransitionType;
  /**
   * Custom variants override
   */
  variants?: Variants;
  /**
   * Duration of the transition
   */
  duration?: number;
  /**
   * Delay before transition starts
   */
  delay?: number;
  /**
   * Whether to use a unique key for transitions (pathname by default)
   */
  transitionKey?: string;
  /**
   * Additional CSS classes
   */
  className?: string;
}

export function PageTransition({
  children,
  type = 'fade',
  variants: customVariants,
  duration = 0.4,
  delay = 0,
  transitionKey,
  className = '',
}: PageTransitionProps) {
  const pathname = usePathname();
  const prefersReducedMotion = useReducedMotion();

  const key = transitionKey || pathname;

  // Get variants based on type
  const getVariants = (): Variants => {
    if (customVariants) return customVariants;

    const variantMap: Record<TransitionType, Variants> = {
      fade: pageVariants.fade,
      slideUp: pageVariants.slideUp,
      slideDown: pageVariants.slideDown,
      slideLeft: pageVariants.slideLeft,
      slideRight: pageVariants.slideRight,
      scale: pageVariants.scale,
      scaleDown: pageVariants.scaleDown,
      wipeRight: wipeVariants.wipeRight,
      wipeLeft: wipeVariants.wipeLeft,
      wipeUp: wipeVariants.wipeUp,
      wipeDown: wipeVariants.wipeDown,
      wipeDiagonal: wipeVariants.wipeDiagonal,
      expandFromCenter: expandVariants.expandFromCenter,
      expandFromTopLeft: expandVariants.expandFromTopLeft,
      expandFromBottomRight: expandVariants.expandFromBottomRight,
      sliceDiagonal: sliceVariants.sliceDiagonal,
      sliceReverse: sliceVariants.sliceReverse,
      flipX: flip3DVariants.flipX,
      flipY: flip3DVariants.flipY,
    };

    return variantMap[type] || pageVariants.fade;
  };

  const variants = getVariants();

  // If reduced motion, just render children without animation
  if (prefersReducedMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={key}
        className={className}
        initial="initial"
        animate="animate"
        exit="exit"
        variants={variants}
        transition={{
          duration,
          delay,
          ease: easings.easeOutExpo,
        }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}

/**
 * Overlay transition - adds a colored overlay during transition
 */
interface OverlayTransitionProps {
  children: React.ReactNode;
  /**
   * Overlay color
   */
  color?: string;
  /**
   * Duration of the transition
   */
  duration?: number;
  /**
   * Additional CSS classes
   */
  className?: string;
}

export function OverlayTransition({
  children,
  color = '#05080f',
  duration = 0.6,
  className = '',
}: OverlayTransitionProps) {
  const pathname = usePathname();
  const prefersReducedMotion = useReducedMotion();

  if (prefersReducedMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <AnimatePresence mode="wait">
      <div key={pathname} className={`relative ${className}`}>
        {/* Content */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: duration / 2 }}
        >
          {children}
        </motion.div>

        {/* Overlay */}
        <motion.div
          className="fixed inset-0 pointer-events-none z-50"
          style={{ backgroundColor: color }}
          initial={{ scaleY: 0, originY: 0 }}
          animate={{ scaleY: [0, 1, 1, 0], originY: [0, 0, 1, 1] }}
          transition={{
            duration,
            times: [0, 0.4, 0.6, 1],
            ease: easings.easeInOutCirc,
          }}
        />
      </div>
    </AnimatePresence>
  );
}

/**
 * Curtain transition - splits screen and reveals content
 */
interface CurtainTransitionProps {
  children: React.ReactNode;
  /**
   * Direction of curtain
   */
  direction?: 'horizontal' | 'vertical';
  /**
   * Curtain color
   */
  color?: string;
  /**
   * Duration of the transition
   */
  duration?: number;
  /**
   * Additional CSS classes
   */
  className?: string;
}

export function CurtainTransition({
  children,
  direction = 'horizontal',
  color = '#05080f',
  duration = 0.8,
  className = '',
}: CurtainTransitionProps) {
  const pathname = usePathname();
  const prefersReducedMotion = useReducedMotion();

  if (prefersReducedMotion) {
    return <div className={className}>{children}</div>;
  }

  const isHorizontal = direction === 'horizontal';

  return (
    <AnimatePresence mode="wait">
      <div key={pathname} className={`relative ${className}`}>
        {/* Content */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: duration / 4, delay: duration / 2 }}
        >
          {children}
        </motion.div>

        {/* Left/Top curtain */}
        <motion.div
          className="fixed z-50 pointer-events-none"
          style={{
            backgroundColor: color,
            ...(isHorizontal
              ? { top: 0, left: 0, width: '50%', height: '100%' }
              : { top: 0, left: 0, width: '100%', height: '50%' }),
          }}
          initial={{ [isHorizontal ? 'scaleX' : 'scaleY']: 0 }}
          animate={{
            [isHorizontal ? 'scaleX' : 'scaleY']: [0, 1, 1, 0],
            [isHorizontal ? 'originX' : 'originY']: [0, 0, 1, 1],
          }}
          transition={{
            duration,
            times: [0, 0.35, 0.65, 1],
            ease: easings.easeInOutCirc,
          }}
        />

        {/* Right/Bottom curtain */}
        <motion.div
          className="fixed z-50 pointer-events-none"
          style={{
            backgroundColor: color,
            ...(isHorizontal
              ? { top: 0, right: 0, width: '50%', height: '100%' }
              : { bottom: 0, left: 0, width: '100%', height: '50%' }),
          }}
          initial={{ [isHorizontal ? 'scaleX' : 'scaleY']: 0 }}
          animate={{
            [isHorizontal ? 'scaleX' : 'scaleY']: [0, 1, 1, 0],
            [isHorizontal ? 'originX' : 'originY']: [1, 1, 0, 0],
          }}
          transition={{
            duration,
            times: [0, 0.35, 0.65, 1],
            ease: easings.easeInOutCirc,
          }}
        />
      </div>
    </AnimatePresence>
  );
}
