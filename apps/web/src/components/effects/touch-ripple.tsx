'use client';

import React, { useState, useCallback, useRef, forwardRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useReducedMotion } from '@/hooks/animations/use-reduced-motion';
import { useHaptic } from '@/hooks/use-haptic';

interface Ripple {
  id: number;
  x: number;
  y: number;
  size: number;
}

interface TouchRippleProps {
  /**
   * Color of the ripple
   */
  color?: string;
  /**
   * Duration of ripple animation (ms)
   */
  duration?: number;
  /**
   * Whether haptic feedback is enabled
   */
  haptic?: boolean;
  /**
   * Children to render
   */
  children: React.ReactNode;
  /**
   * Additional CSS classes
   */
  className?: string;
  /**
   * Click handler
   */
  onClick?: (e: React.MouseEvent | React.TouchEvent) => void;
  /**
   * Whether the component is disabled
   */
  disabled?: boolean;
}

/**
 * Touch ripple effect component for mobile interactions
 */
export const TouchRipple = forwardRef<HTMLDivElement, TouchRippleProps>(
  function TouchRipple(
    {
      color = 'rgba(255, 255, 255, 0.3)',
      duration = 600,
      haptic: enableHaptic = true,
      children,
      className = '',
      onClick,
      disabled = false,
    },
    ref
  ) {
    const [ripples, setRipples] = useState<Ripple[]>([]);
    const containerRef = useRef<HTMLDivElement>(null);
    const nextId = useRef(0);
    const prefersReducedMotion = useReducedMotion();
    const haptic = useHaptic();

    const createRipple = useCallback(
      (e: React.MouseEvent | React.TouchEvent) => {
        if (disabled || prefersReducedMotion) {
          onClick?.(e);
          return;
        }

        const container = containerRef.current;
        if (!container) return;

        const rect = container.getBoundingClientRect();
        let x: number, y: number;

        if ('touches' in e) {
          x = e.touches[0].clientX - rect.left;
          y = e.touches[0].clientY - rect.top;
        } else {
          x = e.clientX - rect.left;
          y = e.clientY - rect.top;
        }

        // Calculate ripple size based on container dimensions
        const size = Math.max(rect.width, rect.height) * 2;

        const ripple: Ripple = {
          id: nextId.current++,
          x,
          y,
          size,
        };

        setRipples((prev) => [...prev, ripple]);

        // Haptic feedback
        if (enableHaptic) {
          haptic.tap();
        }

        // Remove ripple after animation
        setTimeout(() => {
          setRipples((prev) => prev.filter((r) => r.id !== ripple.id));
        }, duration);

        onClick?.(e);
      },
      [disabled, prefersReducedMotion, duration, enableHaptic, haptic, onClick]
    );

    const mergedRef = useCallback(
      (node: HTMLDivElement) => {
        (containerRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
        if (typeof ref === 'function') {
          ref(node);
        } else if (ref) {
          ref.current = node;
        }
      },
      [ref]
    );

    return (
      <div
        ref={mergedRef}
        className={`relative overflow-hidden ${className}`}
        onClick={createRipple}
        onTouchStart={createRipple}
      >
        {children}
        <AnimatePresence>
          {ripples.map((ripple) => (
            <motion.span
              key={ripple.id}
              className="absolute rounded-full pointer-events-none"
              style={{
                left: ripple.x - ripple.size / 2,
                top: ripple.y - ripple.size / 2,
                width: ripple.size,
                height: ripple.size,
                backgroundColor: color,
              }}
              initial={{ scale: 0, opacity: 0.5 }}
              animate={{ scale: 1, opacity: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: duration / 1000, ease: 'easeOut' }}
            />
          ))}
        </AnimatePresence>
      </div>
    );
  }
);

/**
 * Touch-friendly button with ripple effect
 */
interface TouchButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /**
   * Ripple color
   */
  rippleColor?: string;
  /**
   * Button variant
   */
  variant?: 'primary' | 'secondary' | 'ghost';
  /**
   * Button size
   */
  size?: 'sm' | 'md' | 'lg';
  /**
   * Enable haptic feedback
   */
  haptic?: boolean;
}

export function TouchButton({
  children,
  rippleColor,
  variant = 'primary',
  size = 'md',
  haptic = true,
  className = '',
  disabled,
  onClick,
  ...props
}: TouchButtonProps) {
  const [ripples, setRipples] = useState<Ripple[]>([]);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const nextId = useRef(0);
  const prefersReducedMotion = useReducedMotion();
  const hapticFeedback = useHaptic();

  const variantStyles = {
    primary: 'bg-blue-500 hover:bg-blue-600 text-white',
    secondary: 'bg-white/10 hover:bg-white/20 text-white border border-white/20',
    ghost: 'bg-transparent hover:bg-white/10 text-white',
  };

  const sizeStyles = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  };

  const defaultRippleColors = {
    primary: 'rgba(255, 255, 255, 0.4)',
    secondary: 'rgba(255, 255, 255, 0.3)',
    ghost: 'rgba(255, 255, 255, 0.2)',
  };

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      if (disabled) return;

      const button = buttonRef.current;
      if (!button || prefersReducedMotion) {
        onClick?.(e);
        return;
      }

      const rect = button.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const size = Math.max(rect.width, rect.height) * 2;

      const ripple: Ripple = {
        id: nextId.current++,
        x,
        y,
        size,
      };

      setRipples((prev) => [...prev, ripple]);

      if (haptic) {
        hapticFeedback.tap();
      }

      setTimeout(() => {
        setRipples((prev) => prev.filter((r) => r.id !== ripple.id));
      }, 600);

      onClick?.(e);
    },
    [disabled, prefersReducedMotion, haptic, hapticFeedback, onClick]
  );

  return (
    <button
      ref={buttonRef}
      className={`
        relative overflow-hidden rounded-lg font-medium
        transition-colors duration-200
        disabled:opacity-50 disabled:cursor-not-allowed
        ${variantStyles[variant]}
        ${sizeStyles[size]}
        ${className}
      `}
      disabled={disabled}
      onClick={handleClick}
      {...props}
    >
      {children}
      <AnimatePresence>
        {ripples.map((ripple) => (
          <motion.span
            key={ripple.id}
            className="absolute rounded-full pointer-events-none"
            style={{
              left: ripple.x - ripple.size / 2,
              top: ripple.y - ripple.size / 2,
              width: ripple.size,
              height: ripple.size,
              backgroundColor: rippleColor || defaultRippleColors[variant],
            }}
            initial={{ scale: 0, opacity: 0.5 }}
            animate={{ scale: 1, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
          />
        ))}
      </AnimatePresence>
    </button>
  );
}

/**
 * Touch card with press feedback
 */
interface TouchCardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  haptic?: boolean;
}

export function TouchCard({ children, className = '', onClick, haptic = true }: TouchCardProps) {
  const [isPressed, setIsPressed] = useState(false);
  const prefersReducedMotion = useReducedMotion();
  const hapticFeedback = useHaptic();

  const handlePressStart = useCallback(() => {
    setIsPressed(true);
    if (haptic) {
      hapticFeedback.selection();
    }
  }, [haptic, hapticFeedback]);

  const handlePressEnd = useCallback(() => {
    setIsPressed(false);
    onClick?.();
  }, [onClick]);

  if (prefersReducedMotion) {
    return (
      <div className={className} onClick={onClick}>
        {children}
      </div>
    );
  }

  return (
    <motion.div
      className={`cursor-pointer ${className}`}
      animate={{
        scale: isPressed ? 0.98 : 1,
        opacity: isPressed ? 0.9 : 1,
      }}
      transition={{ duration: 0.15 }}
      onMouseDown={handlePressStart}
      onMouseUp={handlePressEnd}
      onMouseLeave={() => isPressed && setIsPressed(false)}
      onTouchStart={handlePressStart}
      onTouchEnd={handlePressEnd}
    >
      {children}
    </motion.div>
  );
}

/**
 * Swipeable card with delete action
 */
interface SwipeableCardProps {
  children: React.ReactNode;
  className?: string;
  onDelete?: () => void;
  deleteThreshold?: number;
  haptic?: boolean;
}

export function SwipeableCard({
  children,
  className = '',
  onDelete,
  deleteThreshold = 100,
  haptic = true,
}: SwipeableCardProps) {
  const [dragX, setDragX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const prefersReducedMotion = useReducedMotion();
  const hapticFeedback = useHaptic();

  if (prefersReducedMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <div className="relative overflow-hidden">
      {/* Delete background */}
      <motion.div
        className="absolute inset-0 bg-red-500 flex items-center justify-end px-4"
        style={{ opacity: Math.min(Math.abs(dragX) / deleteThreshold, 1) }}
      >
        <span className="text-white font-medium">Delete</span>
      </motion.div>

      {/* Card */}
      <motion.div
        className={`relative bg-[#0a0f1a] ${className}`}
        drag="x"
        dragConstraints={{ left: -deleteThreshold * 1.5, right: 0 }}
        dragElastic={0.2}
        onDragStart={() => setIsDragging(true)}
        onDrag={(_, info) => setDragX(info.offset.x)}
        onDragEnd={(_, info) => {
          setIsDragging(false);
          if (Math.abs(info.offset.x) > deleteThreshold) {
            if (haptic) {
              hapticFeedback.warning();
            }
            onDelete?.();
          }
          setDragX(0);
        }}
        animate={{ x: isDragging ? undefined : 0 }}
      >
        {children}
      </motion.div>
    </div>
  );
}

/**
 * Pull to refresh component
 */
interface PullToRefreshProps {
  children: React.ReactNode;
  onRefresh: () => Promise<void>;
  threshold?: number;
  className?: string;
  haptic?: boolean;
}

export function PullToRefresh({
  children,
  onRefresh,
  threshold = 80,
  className = '',
  haptic = true,
}: PullToRefreshProps) {
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const startY = useRef(0);
  const prefersReducedMotion = useReducedMotion();
  const hapticFeedback = useHaptic();

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    startY.current = e.touches[0].clientY;
  }, []);

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (isRefreshing) return;

      const currentY = e.touches[0].clientY;
      const distance = Math.max(0, currentY - startY.current);

      // Apply resistance
      const resistance = 0.4;
      const resistedDistance = distance * resistance;

      setPullDistance(resistedDistance);

      // Haptic feedback at threshold
      if (resistedDistance >= threshold && haptic) {
        hapticFeedback.impact();
      }
    },
    [isRefreshing, threshold, haptic, hapticFeedback]
  );

  const handleTouchEnd = useCallback(async () => {
    if (pullDistance >= threshold && !isRefreshing) {
      setIsRefreshing(true);
      if (haptic) {
        hapticFeedback.success();
      }
      await onRefresh();
      setIsRefreshing(false);
    }
    setPullDistance(0);
  }, [pullDistance, threshold, isRefreshing, onRefresh, haptic, hapticFeedback]);

  return (
    <div
      className={`relative ${className}`}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Pull indicator */}
      <motion.div
        className="absolute top-0 left-0 right-0 flex justify-center items-center"
        style={{ height: pullDistance }}
        animate={{ opacity: pullDistance > 0 ? 1 : 0 }}
      >
        <motion.div
          className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full"
          animate={{
            rotate: isRefreshing ? 360 : (pullDistance / threshold) * 180,
          }}
          transition={
            isRefreshing
              ? { repeat: Infinity, duration: 1, ease: 'linear' }
              : { duration: 0 }
          }
        />
      </motion.div>

      {/* Content */}
      <motion.div
        animate={{ y: prefersReducedMotion ? 0 : pullDistance }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      >
        {children}
      </motion.div>
    </div>
  );
}
