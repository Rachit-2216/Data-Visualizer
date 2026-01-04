'use client';

import React, { useMemo } from 'react';
import { motion, Variants } from 'framer-motion';
import { useIntersection } from '@/hooks/animations/use-intersection';
import { useReducedMotion } from '@/hooks/animations/use-reduced-motion';

type SplitType = 'char' | 'word' | 'line';
type RevealEffect = 'fade-up' | 'fade-down' | 'blur' | 'slide-left' | 'slide-right' | 'scale';

interface SplitTextProps {
  children: string;
  /**
   * How to split the text
   */
  splitBy?: SplitType;
  /**
   * Animation effect for reveal
   */
  effect?: RevealEffect;
  /**
   * Stagger delay between elements (in seconds)
   */
  stagger?: number;
  /**
   * Duration of each element's animation
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
   * Tag to use (h1, h2, p, span, etc.)
   */
  as?: React.ElementType;
  /**
   * Additional CSS classes
   */
  className?: string;
}

export function SplitText({
  children,
  splitBy = 'word',
  effect = 'fade-up',
  stagger = 0.03,
  duration = 0.5,
  delay = 0,
  threshold = 0.2,
  once = true,
  as: Tag = 'span',
  className = '',
}: SplitTextProps) {
  const { ref, inView } = useIntersection({ threshold, triggerOnce: once });
  const prefersReducedMotion = useReducedMotion();

  // Split text based on type
  const elements = useMemo(() => {
    switch (splitBy) {
      case 'char':
        return children.split('').map((char) => (char === ' ' ? '\u00A0' : char));
      case 'word':
        return children.split(' ');
      case 'line':
        return children.split('\n');
      default:
        return [children];
    }
  }, [children, splitBy]);

  // Animation variants based on effect
  const getVariants = (): Variants => {
    switch (effect) {
      case 'fade-up':
        return {
          hidden: { opacity: 0, y: 20 },
          visible: { opacity: 1, y: 0 },
        };
      case 'fade-down':
        return {
          hidden: { opacity: 0, y: -20 },
          visible: { opacity: 1, y: 0 },
        };
      case 'blur':
        return {
          hidden: { opacity: 0, filter: 'blur(10px)' },
          visible: { opacity: 1, filter: 'blur(0px)' },
        };
      case 'slide-left':
        return {
          hidden: { opacity: 0, x: 30 },
          visible: { opacity: 1, x: 0 },
        };
      case 'slide-right':
        return {
          hidden: { opacity: 0, x: -30 },
          visible: { opacity: 1, x: 0 },
        };
      case 'scale':
        return {
          hidden: { opacity: 0, scale: 0.8 },
          visible: { opacity: 1, scale: 1 },
        };
      default:
        return {
          hidden: { opacity: 0 },
          visible: { opacity: 1 },
        };
    }
  };

  const variants = getVariants();

  if (prefersReducedMotion) {
    return <Tag className={className}>{children}</Tag>;
  }

  return (
    <Tag ref={ref} className={`${className}`}>
      {elements.map((element, i) => (
        <motion.span
          key={i}
          className="inline-block"
          initial="hidden"
          animate={inView ? 'visible' : 'hidden'}
          variants={variants}
          transition={{
            duration,
            delay: delay + i * stagger,
            ease: [0.16, 1, 0.3, 1],
          }}
        >
          {element}
          {splitBy === 'word' && i < elements.length - 1 && '\u00A0'}
        </motion.span>
      ))}
    </Tag>
  );
}

/**
 * Typewriter effect for text
 */
interface TypewriterProps {
  children: string;
  speed?: number;
  delay?: number;
  cursor?: boolean;
  className?: string;
}

export function Typewriter({
  children,
  speed = 50,
  delay = 0,
  cursor = true,
  className = '',
}: TypewriterProps) {
  const { ref, inView } = useIntersection({ threshold: 0.5, triggerOnce: true });
  const prefersReducedMotion = useReducedMotion();
  const [displayedText, setDisplayedText] = React.useState('');
  const [showCursor, setShowCursor] = React.useState(true);

  React.useEffect(() => {
    if (!inView || prefersReducedMotion) {
      if (prefersReducedMotion) {
        setDisplayedText(children);
      }
      return;
    }

    let i = 0;
    const timeoutId = setTimeout(() => {
      const intervalId = setInterval(() => {
        if (i < children.length) {
          setDisplayedText(children.slice(0, i + 1));
          i++;
        } else {
          clearInterval(intervalId);
          // Blink cursor after typing is done
          if (cursor) {
            setTimeout(() => setShowCursor(false), 500);
          }
        }
      }, speed);

      return () => clearInterval(intervalId);
    }, delay);

    return () => clearTimeout(timeoutId);
  }, [inView, children, speed, delay, cursor, prefersReducedMotion]);

  return (
    <span ref={ref} className={className}>
      {displayedText}
      {cursor && showCursor && (
        <motion.span
          className="inline-block w-[2px] h-[1em] bg-current ml-1"
          animate={{ opacity: [1, 0] }}
          transition={{ duration: 0.5, repeat: Infinity }}
        />
      )}
    </span>
  );
}

/**
 * Text that reveals from a masked container
 */
interface MaskedRevealProps {
  children: string;
  direction?: 'up' | 'down' | 'left' | 'right';
  duration?: number;
  delay?: number;
  className?: string;
}

export function MaskedReveal({
  children,
  direction = 'up',
  duration = 0.6,
  delay = 0,
  className = '',
}: MaskedRevealProps) {
  const { ref, inView } = useIntersection({ threshold: 0.5, triggerOnce: true });
  const prefersReducedMotion = useReducedMotion();

  const getTransform = () => {
    switch (direction) {
      case 'up':
        return { y: '100%' };
      case 'down':
        return { y: '-100%' };
      case 'left':
        return { x: '100%' };
      case 'right':
        return { x: '-100%' };
    }
  };

  if (prefersReducedMotion) {
    return <span className={className}>{children}</span>;
  }

  return (
    <span ref={ref} className={`inline-block overflow-hidden ${className}`}>
      <motion.span
        className="inline-block"
        initial={getTransform()}
        animate={inView ? { x: 0, y: 0 } : getTransform()}
        transition={{
          duration,
          delay,
          ease: [0.16, 1, 0.3, 1],
        }}
      >
        {children}
      </motion.span>
    </span>
  );
}
