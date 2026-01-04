'use client';

import React, { useRef, useEffect, useState, createContext, useContext } from 'react';
import { motion, useScroll, useTransform, MotionValue } from 'framer-motion';
import { useReducedMotion } from '@/hooks/animations/use-reduced-motion';

interface ParallaxContextType {
  scrollY: MotionValue<number>;
  containerRef: React.RefObject<HTMLDivElement | null>;
}

const ParallaxContext = createContext<ParallaxContextType | null>(null);

interface ParallaxContainerProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * Container that provides parallax scroll context to children
 */
export function ParallaxContainer({ children, className = '' }: ParallaxContainerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollY } = useScroll();

  return (
    <ParallaxContext.Provider value={{ scrollY, containerRef }}>
      <div ref={containerRef} className={`relative ${className}`}>
        {children}
      </div>
    </ParallaxContext.Provider>
  );
}

interface ParallaxLayerProps {
  children: React.ReactNode;
  /**
   * Speed of parallax effect (0 = static, 1 = normal scroll, 0.5 = half speed)
   */
  speed?: number;
  /**
   * Direction of parallax
   */
  direction?: 'vertical' | 'horizontal';
  /**
   * Whether to apply opacity fade based on scroll
   */
  fade?: boolean;
  /**
   * Additional CSS classes
   */
  className?: string;
}

/**
 * Individual parallax layer that moves at a different speed
 */
export function ParallaxLayer({
  children,
  speed = 0.5,
  direction = 'vertical',
  fade = false,
  className = '',
}: ParallaxLayerProps) {
  const context = useContext(ParallaxContext);
  const prefersReducedMotion = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const [elementTop, setElementTop] = useState(0);
  const [clientHeight, setClientHeight] = useState(0);

  const { scrollY } = useScroll();

  useEffect(() => {
    if (!ref.current) return;

    const setValues = () => {
      setElementTop(ref.current?.offsetTop ?? 0);
      setClientHeight(window.innerHeight);
    };

    setValues();
    window.addEventListener('resize', setValues);
    return () => window.removeEventListener('resize', setValues);
  }, []);

  // Calculate parallax range
  const initial = elementTop - clientHeight;
  const final = elementTop + (ref.current?.offsetHeight ?? 0);

  const yRange = useTransform(
    scrollY,
    [initial, final],
    direction === 'vertical'
      ? [speed * 100, -speed * 100]
      : [0, 0]
  );

  const xRange = useTransform(
    scrollY,
    [initial, final],
    direction === 'horizontal'
      ? [speed * 100, -speed * 100]
      : [0, 0]
  );

  const opacity = useTransform(
    scrollY,
    [initial, elementTop, final],
    fade ? [0, 1, 0] : [1, 1, 1]
  );

  if (prefersReducedMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      ref={ref}
      className={`will-change-transform ${className}`}
      style={{
        y: direction === 'vertical' ? yRange : 0,
        x: direction === 'horizontal' ? xRange : 0,
        opacity: fade ? opacity : 1,
      }}
    >
      {children}
    </motion.div>
  );
}

/**
 * Simple parallax background
 */
interface ParallaxBackgroundProps {
  children?: React.ReactNode;
  /**
   * Background image URL
   */
  image?: string;
  /**
   * Parallax speed
   */
  speed?: number;
  /**
   * Overlay color
   */
  overlay?: string;
  /**
   * Additional CSS classes
   */
  className?: string;
}

export function ParallaxBackground({
  children,
  image,
  speed = 0.3,
  overlay,
  className = '',
}: ParallaxBackgroundProps) {
  const prefersReducedMotion = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  });

  const y = useTransform(scrollYProgress, [0, 1], ['0%', `${speed * 100}%`]);

  return (
    <div ref={ref} className={`relative overflow-hidden ${className}`}>
      {image && (
        <motion.div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `url(${image})`,
            y: prefersReducedMotion ? 0 : y,
            scale: 1.2, // Slightly larger to prevent edge gaps
          }}
        />
      )}
      {overlay && (
        <div className="absolute inset-0" style={{ backgroundColor: overlay }} />
      )}
      <div className="relative z-10">{children}</div>
    </div>
  );
}

/**
 * Horizontal scroll section
 */
interface HorizontalScrollProps {
  children: React.ReactNode;
  /**
   * Total width of scrollable content (in viewport widths)
   */
  width?: number;
  /**
   * Additional CSS classes
   */
  className?: string;
}

export function HorizontalScroll({ children, width = 3, className = '' }: HorizontalScrollProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const prefersReducedMotion = useReducedMotion();

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end end'],
  });

  const x = useTransform(scrollYProgress, [0, 1], ['0%', `-${(width - 1) * 100}%`]);

  if (prefersReducedMotion) {
    return (
      <div className={`overflow-x-auto ${className}`}>
        <div className="flex">{children}</div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={className}
      style={{ height: `${width * 100}vh` }}
    >
      <div className="sticky top-0 h-screen overflow-hidden">
        <motion.div className="flex h-full" style={{ x }}>
          {children}
        </motion.div>
      </div>
    </div>
  );
}

/**
 * Sticky scroll section
 */
interface StickyScrollProps {
  children: React.ReactNode;
  /**
   * Height of the sticky scroll section
   */
  height?: string;
  /**
   * Additional CSS classes
   */
  className?: string;
}

export function StickyScroll({ children, height = '200vh', className = '' }: StickyScrollProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end end'],
  });

  return (
    <div ref={containerRef} className={className} style={{ height }}>
      <div className="sticky top-0 h-screen flex items-center justify-center overflow-hidden">
        {typeof children === 'function'
          ? (children as (progress: MotionValue<number>) => React.ReactNode)(scrollYProgress)
          : children}
      </div>
    </div>
  );
}
