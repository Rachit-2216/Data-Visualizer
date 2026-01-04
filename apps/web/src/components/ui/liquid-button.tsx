'use client';

import React, { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useReducedMotion } from '@/hooks/animations/use-reduced-motion';
import { useMagnetic } from '@/hooks/animations/use-magnetic';

interface RippleType {
  id: number;
  x: number;
  y: number;
}

interface LiquidButtonProps {
  children: React.ReactNode;
  /**
   * Button variant
   */
  variant?: 'primary' | 'secondary' | 'ghost';
  /**
   * Button size
   */
  size?: 'sm' | 'md' | 'lg';
  /**
   * Whether to enable magnetic effect
   */
  magnetic?: boolean;
  /**
   * Whether to enable ripple effect
   */
  ripple?: boolean;
  /**
   * Whether to enable light sweep on hover
   */
  lightSweep?: boolean;
  /**
   * Whether to enable glow pulse when idle
   */
  glowPulse?: boolean;
  /**
   * Additional CSS classes
   */
  className?: string;
  /**
   * Click handler
   */
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  /**
   * Whether button is disabled
   */
  disabled?: boolean;
  /**
   * Button type
   */
  type?: 'button' | 'submit' | 'reset';
}

export function LiquidButton({
  children,
  variant = 'primary',
  size = 'md',
  magnetic = true,
  ripple = true,
  lightSweep = true,
  glowPulse = false,
  className = '',
  onClick,
  disabled = false,
  type = 'button',
}: LiquidButtonProps) {
  const [ripples, setRipples] = useState<RippleType[]>([]);
  const [isPressed, setIsPressed] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const prefersReducedMotion = useReducedMotion();

  const { ref: magneticRef, style: magneticStyle } = useMagnetic({
    strength: magnetic ? 0.15 : 0,
    radius: 80,
    scale: true,
    scaleAmount: 1.03,
  });

  // Combine refs
  const setRefs = useCallback(
    (node: HTMLButtonElement | null) => {
      (buttonRef as React.MutableRefObject<HTMLButtonElement | null>).current = node;
      magneticRef(node);
    },
    [magneticRef]
  );

  // Variant styles
  const variantStyles = {
    primary: {
      base: 'bg-cyan-400 text-slate-900 border-transparent',
      hover: 'hover:bg-cyan-300',
      shadow: 'shadow-[0_12px_40px_rgba(34,211,238,0.35)]',
      glow: 'rgba(34, 211, 238, 0.5)',
    },
    secondary: {
      base: 'bg-white/5 text-white border-white/10',
      hover: 'hover:border-white/30 hover:bg-white/10',
      shadow: '',
      glow: 'rgba(255, 255, 255, 0.2)',
    },
    ghost: {
      base: 'bg-transparent text-white/80 border-transparent',
      hover: 'hover:bg-white/5 hover:text-white',
      shadow: '',
      glow: 'rgba(255, 255, 255, 0.1)',
    },
  };

  // Size styles
  const sizeStyles = {
    sm: 'px-3 py-1.5 text-sm rounded-lg',
    md: 'px-5 py-3 text-sm rounded-xl',
    lg: 'px-6 py-4 text-base rounded-xl',
  };

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled) return;

    // Add ripple effect
    if (ripple && !prefersReducedMotion) {
      const rect = buttonRef.current?.getBoundingClientRect();
      if (rect) {
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const newRipple = { id: Date.now(), x, y };
        setRipples((prev) => [...prev, newRipple]);

        // Remove ripple after animation
        setTimeout(() => {
          setRipples((prev) => prev.filter((r) => r.id !== newRipple.id));
        }, 600);
      }
    }

    onClick?.(e);
  };

  const styles = variantStyles[variant];

  return (
    <motion.button
      ref={setRefs}
      type={type}
      disabled={disabled}
      onClick={handleClick}
      onMouseDown={() => setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
      onMouseLeave={() => setIsPressed(false)}
      className={`
        relative overflow-hidden
        inline-flex items-center justify-center gap-2
        font-semibold border
        transition-colors duration-200
        ${styles.base}
        ${styles.hover}
        ${styles.shadow}
        ${sizeStyles[size]}
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        ${glowPulse && !prefersReducedMotion ? 'animate-glow-pulse' : ''}
        ${className}
      `}
      style={magnetic && !prefersReducedMotion ? magneticStyle : undefined}
      whileHover={
        prefersReducedMotion
          ? {}
          : { y: -2, transition: { duration: 0.2 } }
      }
      whileTap={
        prefersReducedMotion
          ? {}
          : { scale: 0.98, transition: { duration: 0.1 } }
      }
    >
      {/* Light sweep effect */}
      {lightSweep && !prefersReducedMotion && (
        <motion.div
          className="absolute inset-0 pointer-events-none"
          initial={{ x: '-100%', opacity: 0 }}
          whileHover={{
            x: '100%',
            opacity: [0, 0.3, 0],
            transition: { duration: 0.6, ease: 'easeInOut' },
          }}
          style={{
            background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)',
            transform: 'skewX(-15deg)',
          }}
        />
      )}

      {/* Ripple effects */}
      <AnimatePresence>
        {ripples.map((rip) => (
          <motion.span
            key={rip.id}
            className="absolute rounded-full pointer-events-none"
            style={{
              left: rip.x,
              top: rip.y,
              backgroundColor: styles.glow,
            }}
            initial={{ width: 0, height: 0, x: 0, y: 0, opacity: 0.5 }}
            animate={{
              width: 300,
              height: 300,
              x: -150,
              y: -150,
              opacity: 0,
            }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
          />
        ))}
      </AnimatePresence>

      {/* Button content */}
      <span className="relative z-10 flex items-center gap-2">{children}</span>

      {/* Press effect overlay */}
      {isPressed && !prefersReducedMotion && (
        <motion.div
          className="absolute inset-0 pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.1 }}
          style={{ backgroundColor: 'black' }}
        />
      )}
    </motion.button>
  );
}

/**
 * Icon button with liquid effects
 */
interface LiquidIconButtonProps {
  icon: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  disabled?: boolean;
  'aria-label': string;
}

export function LiquidIconButton({
  icon,
  variant = 'secondary',
  size = 'md',
  className = '',
  onClick,
  disabled = false,
  'aria-label': ariaLabel,
}: LiquidIconButtonProps) {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
  };

  return (
    <LiquidButton
      variant={variant}
      onClick={onClick}
      disabled={disabled}
      className={`!p-0 ${sizeClasses[size]} ${className}`}
      ripple
      magnetic
      lightSweep={false}
      aria-label={ariaLabel}
    >
      {icon}
    </LiquidButton>
  );
}
