'use client';

import React, { useRef, useState, useEffect } from 'react';
import { motion, useSpring } from 'framer-motion';
import { useRelativeMousePosition } from '@/hooks/animations/use-mouse-position';
import { useReducedMotion } from '@/hooks/animations/use-reduced-motion';
import { useIntersection } from '@/hooks/animations/use-intersection';

interface FeatureCardProps {
  children: React.ReactNode;
  /**
   * Maximum tilt angle in degrees
   */
  tiltMax?: number;
  /**
   * Whether to add glow effect following cursor
   */
  glowEffect?: boolean;
  /**
   * Color of the glow
   */
  glowColor?: string;
  /**
   * Whether to enable float animation when idle
   */
  float?: boolean;
  /**
   * Stagger delay for reveal animation (in seconds)
   */
  delay?: number;
  /**
   * Additional CSS classes
   */
  className?: string;
}

export function FeatureCard({
  children,
  tiltMax = 8,
  glowEffect = true,
  glowColor = 'rgba(56, 189, 248, 0.4)',
  float = true,
  delay = 0,
  className = '',
}: FeatureCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const prefersReducedMotion = useReducedMotion();
  const mousePosition = useRelativeMousePosition(cardRef as React.RefObject<HTMLElement>);
  const { ref: inViewRef, inView } = useIntersection({ threshold: 0.1, triggerOnce: true });
  const [forceVisible, setForceVisible] = useState(false);

  // Fallback: ensure visibility after a timeout in case IntersectionObserver doesn't trigger
  useEffect(() => {
    const timer = setTimeout(() => setForceVisible(true), 500);
    return () => clearTimeout(timer);
  }, []);

  // Spring-animated tilt values
  const rotateX = useSpring(0, { stiffness: 150, damping: 20 });
  const rotateY = useSpring(0, { stiffness: 150, damping: 20 });
  const scale = useSpring(1, { stiffness: 200, damping: 25 });

  // Glow position
  const [glowPosition, setGlowPosition] = useState({ x: 50, y: 50 });

  useEffect(() => {
    if (prefersReducedMotion || !mousePosition.isOver) {
      rotateX.set(0);
      rotateY.set(0);
      return;
    }

    // Calculate tilt based on mouse position (0-1 range)
    const tiltX = (mousePosition.y - 0.5) * -tiltMax;
    const tiltY = (mousePosition.x - 0.5) * tiltMax;

    rotateX.set(tiltX);
    rotateY.set(tiltY);

    // Update glow position
    setGlowPosition({
      x: mousePosition.x * 100,
      y: mousePosition.y * 100,
    });
  }, [mousePosition.x, mousePosition.y, mousePosition.isOver, tiltMax, prefersReducedMotion, rotateX, rotateY]);

  // Combine refs
  const setRefs = (node: HTMLDivElement | null) => {
    (cardRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
    inViewRef(node);
  };

  // Float animation class
  const floatClass = float && !prefersReducedMotion ? 'animate-float' : '';

  return (
    <motion.div
      ref={setRefs}
      className={`relative ${floatClass} ${className}`}
      style={{
        perspective: 1000,
        transformStyle: 'preserve-3d',
      }}
      initial={{ opacity: 0, y: 30 }}
      animate={(inView || forceVisible) ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
      transition={{
        duration: 0.6,
        delay,
        ease: [0.16, 1, 0.3, 1],
      }}
      onMouseEnter={() => scale.set(1.02)}
      onMouseLeave={() => {
        scale.set(1);
        rotateX.set(0);
        rotateY.set(0);
      }}
    >
      <motion.div
        className="relative rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur overflow-hidden"
        style={{
          rotateX,
          rotateY,
          scale,
          transformStyle: 'preserve-3d',
        }}
      >
        {/* Glow effect */}
        {glowEffect && mousePosition.isOver && !prefersReducedMotion && (
          <div
            className="absolute inset-0 pointer-events-none transition-opacity duration-300"
            style={{
              background: `radial-gradient(600px circle at ${glowPosition.x}% ${glowPosition.y}%, ${glowColor}, transparent 40%)`,
              opacity: mousePosition.isOver ? 1 : 0,
            }}
          />
        )}

        {/* Shimmer effect on hover */}
        {mousePosition.isOver && !prefersReducedMotion && (
          <motion.div
            className="absolute inset-0 pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.05 }}
            style={{
              background: `linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.2) 45%, transparent 50%)`,
              backgroundSize: '200% 200%',
            }}
          />
        )}

        {/* Content with slight depth */}
        <div
          className="relative z-10"
          style={{
            transform: 'translateZ(20px)',
          }}
        >
          {children}
        </div>
      </motion.div>
    </motion.div>
  );
}

/**
 * Simple card with hover lift effect
 */
interface HoverCardProps {
  children: React.ReactNode;
  className?: string;
  lift?: number;
}

export function HoverCard({ children, className = '', lift = 4 }: HoverCardProps) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <motion.div
      className={`rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur transition-colors hover:border-white/20 ${className}`}
      whileHover={
        prefersReducedMotion
          ? {}
          : {
              y: -lift,
              transition: { duration: 0.2, ease: 'easeOut' },
            }
      }
    >
      {children}
    </motion.div>
  );
}

/**
 * Card with border glow on hover
 */
interface GlowCardProps {
  children: React.ReactNode;
  className?: string;
  glowColor?: string;
}

export function GlowCard({
  children,
  className = '',
  glowColor = 'rgba(56, 189, 248, 0.5)',
}: GlowCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const prefersReducedMotion = useReducedMotion();

  return (
    <div
      className={`relative ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Glow border */}
      <motion.div
        className="absolute -inset-[1px] rounded-2xl"
        style={{
          background: `linear-gradient(135deg, ${glowColor}, transparent, ${glowColor})`,
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: isHovered && !prefersReducedMotion ? 1 : 0 }}
        transition={{ duration: 0.3 }}
      />

      {/* Card content */}
      <div className="relative rounded-2xl border border-white/10 bg-[#0a0f1a] p-5 backdrop-blur">
        {children}
      </div>
    </div>
  );
}
