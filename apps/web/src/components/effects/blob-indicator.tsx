'use client';

import React, { useEffect, useRef, useState } from 'react';
import { motion, useSpring } from 'framer-motion';
import { useReducedMotion } from '@/hooks/animations/use-reduced-motion';

interface BlobIndicatorProps {
  /**
   * Index of the active item
   */
  activeIndex: number;
  /**
   * Array of refs to the nav items
   */
  itemRefs: React.RefObject<HTMLElement>[];
  /**
   * Color of the blob
   */
  color?: string;
  /**
   * Additional CSS classes
   */
  className?: string;
}

export function BlobIndicator({
  activeIndex,
  itemRefs,
  color = 'rgba(56, 189, 248, 0.2)',
  className = '',
}: BlobIndicatorProps) {
  const [position, setPosition] = useState({ x: 0, y: 0, width: 0, height: 0 });
  const prefersReducedMotion = useReducedMotion();

  // Spring-animated values
  const x = useSpring(0, { stiffness: 300, damping: 30 });
  const y = useSpring(0, { stiffness: 300, damping: 30 });
  const width = useSpring(0, { stiffness: 300, damping: 30 });
  const height = useSpring(0, { stiffness: 300, damping: 30 });

  useEffect(() => {
    const activeItem = itemRefs[activeIndex]?.current;
    if (!activeItem) return;

    const rect = activeItem.getBoundingClientRect();
    const parentRect = activeItem.parentElement?.getBoundingClientRect();

    if (parentRect) {
      const newPosition = {
        x: rect.left - parentRect.left,
        y: rect.top - parentRect.top,
        width: rect.width,
        height: rect.height,
      };

      setPosition(newPosition);
      x.set(newPosition.x);
      y.set(newPosition.y);
      width.set(newPosition.width);
      height.set(newPosition.height);
    }
  }, [activeIndex, itemRefs, x, y, width, height]);

  if (prefersReducedMotion) {
    return (
      <div
        className={`absolute rounded-full ${className}`}
        style={{
          left: position.x,
          top: position.y,
          width: position.width,
          height: position.height,
          backgroundColor: color,
        }}
      />
    );
  }

  return (
    <motion.div
      className={`absolute rounded-full ${className}`}
      style={{
        x,
        y,
        width,
        height,
        backgroundColor: color,
      }}
    />
  );
}

/**
 * Morphing blob background
 */
interface MorphingBlobProps {
  /**
   * Size of the blob
   */
  size?: number;
  /**
   * Color of the blob
   */
  color?: string;
  /**
   * Animation duration in seconds
   */
  duration?: number;
  /**
   * Additional CSS classes
   */
  className?: string;
}

export function MorphingBlob({
  size = 200,
  color = 'rgba(56, 189, 248, 0.3)',
  duration = 8,
  className = '',
}: MorphingBlobProps) {
  const prefersReducedMotion = useReducedMotion();

  const blobPaths = [
    '60% 40% 30% 70% / 60% 30% 70% 40%',
    '30% 60% 70% 40% / 50% 60% 30% 60%',
    '50% 50% 50% 50% / 40% 50% 60% 50%',
    '40% 60% 60% 40% / 70% 30% 50% 50%',
  ];

  if (prefersReducedMotion) {
    return (
      <div
        className={className}
        style={{
          width: size,
          height: size,
          backgroundColor: color,
          borderRadius: blobPaths[0],
        }}
      />
    );
  }

  return (
    <motion.div
      className={className}
      style={{
        width: size,
        height: size,
        backgroundColor: color,
      }}
      animate={{
        borderRadius: blobPaths,
      }}
      transition={{
        duration,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
    />
  );
}

/**
 * Liquid underline for navigation items
 */
interface LiquidUnderlineProps {
  /**
   * Whether the item is active
   */
  isActive: boolean;
  /**
   * Color of the underline
   */
  color?: string;
  /**
   * Height of the underline
   */
  height?: number;
  /**
   * Additional CSS classes
   */
  className?: string;
}

export function LiquidUnderline({
  isActive,
  color = 'rgb(56, 189, 248)',
  height = 2,
  className = '',
}: LiquidUnderlineProps) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <motion.div
      className={`absolute bottom-0 left-0 right-0 ${className}`}
      style={{ height, backgroundColor: color }}
      initial={{ scaleX: 0, originX: 0 }}
      animate={{ scaleX: isActive ? 1 : 0 }}
      transition={
        prefersReducedMotion
          ? { duration: 0 }
          : { duration: 0.3, ease: [0.16, 1, 0.3, 1] }
      }
    />
  );
}

/**
 * Nav item wrapper with hover blob
 */
interface NavItemWithBlobProps {
  children: React.ReactNode;
  isActive?: boolean;
  onClick?: () => void;
  className?: string;
}

export function NavItemWithBlob({
  children,
  isActive = false,
  onClick,
  className = '',
}: NavItemWithBlobProps) {
  const [isHovered, setIsHovered] = useState(false);
  const prefersReducedMotion = useReducedMotion();

  return (
    <button
      className={`relative px-4 py-2 ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onClick}
    >
      {/* Hover/active background blob */}
      <motion.div
        className="absolute inset-0 rounded-lg bg-white/5"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{
          opacity: isHovered || isActive ? 1 : 0,
          scale: isHovered || isActive ? 1 : 0.8,
        }}
        transition={
          prefersReducedMotion
            ? { duration: 0 }
            : { duration: 0.2, ease: 'easeOut' }
        }
      />

      {/* Content */}
      <span className="relative z-10">{children}</span>

      {/* Active indicator */}
      {isActive && (
        <motion.div
          className="absolute bottom-0 left-1/2 w-1 h-1 rounded-full bg-cyan-400"
          layoutId="activeIndicator"
          style={{ x: '-50%' }}
          transition={
            prefersReducedMotion
              ? { duration: 0 }
              : { type: 'spring', stiffness: 300, damping: 30 }
          }
        />
      )}
    </button>
  );
}
