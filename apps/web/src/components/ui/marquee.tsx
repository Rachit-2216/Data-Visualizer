'use client';

import React, { useRef, useEffect, useState } from 'react';
import { motion, useAnimationControls } from 'framer-motion';
import { useReducedMotion } from '@/hooks/animations/use-reduced-motion';

interface MarqueeProps {
  children: React.ReactNode;
  /**
   * Speed of the marquee (pixels per second)
   */
  speed?: number;
  /**
   * Direction of movement
   */
  direction?: 'left' | 'right';
  /**
   * Whether to pause on hover
   */
  pauseOnHover?: boolean;
  /**
   * Gap between repeated items
   */
  gap?: number;
  /**
   * Additional CSS classes
   */
  className?: string;
}

export function Marquee({
  children,
  speed = 50,
  direction = 'left',
  pauseOnHover = true,
  gap = 40,
  className = '',
}: MarqueeProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [contentWidth, setContentWidth] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    if (contentRef.current) {
      setContentWidth(contentRef.current.scrollWidth);
    }
  }, [children]);

  // Calculate animation duration based on content width and speed
  const duration = contentWidth / speed;

  if (prefersReducedMotion) {
    return (
      <div className={`overflow-hidden ${className}`}>
        <div className="flex" style={{ gap }}>
          {children}
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`overflow-hidden ${className}`}
      onMouseEnter={() => pauseOnHover && setIsPaused(true)}
      onMouseLeave={() => pauseOnHover && setIsPaused(false)}
    >
      <motion.div
        className="flex"
        style={{ gap }}
        animate={{
          x: direction === 'left' ? [-contentWidth - gap, 0] : [0, -contentWidth - gap],
        }}
        transition={{
          duration,
          repeat: Infinity,
          ease: 'linear',
          repeatType: 'loop',
        }}
        {...(isPaused && { style: { animationPlayState: 'paused' } })}
      >
        {/* Original content */}
        <div ref={contentRef} className="flex shrink-0" style={{ gap }}>
          {children}
        </div>
        {/* Duplicated content for seamless loop */}
        <div className="flex shrink-0" style={{ gap }}>
          {children}
        </div>
      </motion.div>
    </div>
  );
}

/**
 * Vertical marquee
 */
interface VerticalMarqueeProps {
  children: React.ReactNode;
  speed?: number;
  direction?: 'up' | 'down';
  pauseOnHover?: boolean;
  gap?: number;
  className?: string;
}

export function VerticalMarquee({
  children,
  speed = 30,
  direction = 'up',
  pauseOnHover = true,
  gap = 20,
  className = '',
}: VerticalMarqueeProps) {
  const contentRef = useRef<HTMLDivElement>(null);
  const [contentHeight, setContentHeight] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    if (contentRef.current) {
      setContentHeight(contentRef.current.scrollHeight);
    }
  }, [children]);

  const duration = contentHeight / speed;

  if (prefersReducedMotion) {
    return (
      <div className={`overflow-hidden ${className}`}>
        <div className="flex flex-col" style={{ gap }}>
          {children}
        </div>
      </div>
    );
  }

  return (
    <div
      className={`overflow-hidden ${className}`}
      onMouseEnter={() => pauseOnHover && setIsPaused(true)}
      onMouseLeave={() => pauseOnHover && setIsPaused(false)}
    >
      <motion.div
        className="flex flex-col"
        style={{ gap }}
        animate={{
          y: direction === 'up' ? [-contentHeight - gap, 0] : [0, -contentHeight - gap],
        }}
        transition={{
          duration,
          repeat: Infinity,
          ease: 'linear',
          repeatType: 'loop',
        }}
      >
        <div ref={contentRef} className="flex flex-col shrink-0" style={{ gap }}>
          {children}
        </div>
        <div className="flex flex-col shrink-0" style={{ gap }}>
          {children}
        </div>
      </motion.div>
    </div>
  );
}

/**
 * Logo cloud with marquee
 */
interface LogoCloudProps {
  logos: Array<{
    name: string;
    logo: React.ReactNode;
  }>;
  speed?: number;
  className?: string;
}

export function LogoCloud({ logos, speed = 40, className = '' }: LogoCloudProps) {
  return (
    <Marquee speed={speed} className={className} gap={60}>
      {logos.map((item, index) => (
        <div
          key={index}
          className="flex items-center gap-2 opacity-50 hover:opacity-100 transition-opacity duration-300"
        >
          {item.logo}
          <span className="text-sm text-white/60">{item.name}</span>
        </div>
      ))}
    </Marquee>
  );
}

/**
 * Text ticker with fade edges
 */
interface TextTickerProps {
  items: string[];
  speed?: number;
  separator?: string;
  className?: string;
}

export function TextTicker({
  items,
  speed = 50,
  separator = '•',
  className = '',
}: TextTickerProps) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {/* Fade edges */}
      <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-[#05080f] to-transparent z-10 pointer-events-none" />
      <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-[#05080f] to-transparent z-10 pointer-events-none" />

      <Marquee speed={speed} pauseOnHover={false}>
        {items.map((item, index) => (
          <React.Fragment key={index}>
            <span className="text-white/70">{item}</span>
            {index < items.length - 1 && (
              <span className="text-white/30 mx-4">{separator}</span>
            )}
          </React.Fragment>
        ))}
      </Marquee>
    </div>
  );
}
