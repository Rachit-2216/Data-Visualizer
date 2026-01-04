'use client';

import React, { useEffect, useState, useRef } from 'react';
import { motion, useSpring, useTransform, animate } from 'framer-motion';
import { useIntersection } from '@/hooks/animations/use-intersection';
import { useReducedMotion } from '@/hooks/animations/use-reduced-motion';

interface AnimatedCounterProps {
  /**
   * The target number to count to
   */
  value: number;
  /**
   * Duration of the animation in seconds
   */
  duration?: number;
  /**
   * Suffix to display after the number (e.g., 'ms', '%', '+')
   */
  suffix?: string;
  /**
   * Prefix to display before the number (e.g., '$', '+')
   */
  prefix?: string;
  /**
   * Number of decimal places
   */
  decimals?: number;
  /**
   * Whether to use odometer-style animation
   */
  odometer?: boolean;
  /**
   * Additional CSS classes
   */
  className?: string;
  /**
   * Format number with commas
   */
  formatNumber?: boolean;
}

export function AnimatedCounter({
  value,
  duration = 2,
  suffix = '',
  prefix = '',
  decimals = 0,
  odometer = false,
  className = '',
  formatNumber = true,
}: AnimatedCounterProps) {
  const [displayValue, setDisplayValue] = useState(0);
  const prefersReducedMotion = useReducedMotion();
  const { ref, inView } = useIntersection({ threshold: 0.5, triggerOnce: true });
  const hasAnimated = useRef(false);

  useEffect(() => {
    if (!inView || hasAnimated.current || prefersReducedMotion) {
      if (prefersReducedMotion) {
        setDisplayValue(value);
      }
      return;
    }

    hasAnimated.current = true;

    const controls = animate(0, value, {
      duration,
      ease: 'easeOut',
      onUpdate: (latest) => {
        setDisplayValue(latest);
      },
    });

    return () => controls.stop();
  }, [inView, value, duration, prefersReducedMotion]);

  const formattedValue = formatNumber
    ? displayValue.toLocaleString('en-US', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      })
    : displayValue.toFixed(decimals);

  if (odometer) {
    return (
      <span ref={ref} className={className}>
        {prefix}
        <OdometerDisplay value={displayValue} decimals={decimals} inView={inView} />
        {suffix}
      </span>
    );
  }

  return (
    <span ref={ref} className={className}>
      {prefix}
      {formattedValue}
      {suffix}
    </span>
  );
}

/**
 * Odometer-style digit display
 */
interface OdometerDisplayProps {
  value: number;
  decimals?: number;
  inView: boolean;
}

function OdometerDisplay({ value, decimals = 0, inView }: OdometerDisplayProps) {
  const prefersReducedMotion = useReducedMotion();
  const displayValue = value.toFixed(decimals);
  const digits = displayValue.split('');

  if (prefersReducedMotion) {
    return <span>{displayValue}</span>;
  }

  return (
    <span className="inline-flex overflow-hidden">
      {digits.map((digit, index) => (
        <OdometerDigit
          key={index}
          digit={digit}
          delay={index * 0.05}
          inView={inView}
        />
      ))}
    </span>
  );
}

interface OdometerDigitProps {
  digit: string;
  delay: number;
  inView: boolean;
}

function OdometerDigit({ digit, delay, inView }: OdometerDigitProps) {
  const isNumber = !isNaN(parseInt(digit));

  if (!isNumber) {
    return <span>{digit}</span>;
  }

  const targetDigit = parseInt(digit);

  return (
    <span className="relative inline-block h-[1em] w-[0.6em] overflow-hidden">
      <motion.span
        className="absolute flex flex-col"
        initial={{ y: '100%' }}
        animate={inView ? { y: `-${targetDigit * 10}%` } : { y: '100%' }}
        transition={{
          duration: 0.6,
          delay,
          ease: [0.16, 1, 0.3, 1],
        }}
      >
        {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
          <span key={num} className="h-[1em] leading-[1em]">
            {num}
          </span>
        ))}
      </motion.span>
    </span>
  );
}

/**
 * Stat card with animated counter
 */
interface StatCardProps {
  label: string;
  value: number;
  suffix?: string;
  prefix?: string;
  icon?: React.ReactNode;
  className?: string;
}

export function StatCard({
  label,
  value,
  suffix = '',
  prefix = '',
  icon,
  className = '',
}: StatCardProps) {
  const { ref, inView } = useIntersection({ threshold: 0.3, triggerOnce: true });

  return (
    <motion.div
      ref={ref}
      className={`space-y-2 ${className}`}
      initial={{ opacity: 0, y: 20 }}
      animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
    >
      {icon && <div className="text-cyan-300">{icon}</div>}
      <p className="text-sm text-white/60">{label}</p>
      <p className="text-xl font-semibold text-white">
        <AnimatedCounter value={value} suffix={suffix} prefix={prefix} />
      </p>
    </motion.div>
  );
}

/**
 * Progress bar with animated fill
 */
interface AnimatedProgressProps {
  value: number;
  max?: number;
  color?: string;
  backgroundColor?: string;
  height?: number;
  showLabel?: boolean;
  className?: string;
}

export function AnimatedProgress({
  value,
  max = 100,
  color = 'rgb(56, 189, 248)',
  backgroundColor = 'rgba(255, 255, 255, 0.1)',
  height = 8,
  showLabel = false,
  className = '',
}: AnimatedProgressProps) {
  const prefersReducedMotion = useReducedMotion();
  const { ref, inView } = useIntersection({ threshold: 0.5, triggerOnce: true });

  const percentage = Math.min(100, (value / max) * 100);

  return (
    <div ref={ref} className={`relative ${className}`}>
      <div
        className="w-full rounded-full overflow-hidden"
        style={{ height, backgroundColor }}
      >
        <motion.div
          className="h-full rounded-full"
          style={{
            backgroundColor: color,
            boxShadow: `0 0 10px ${color}50`,
          }}
          initial={{ width: 0 }}
          animate={inView ? { width: `${percentage}%` } : { width: 0 }}
          transition={{
            duration: prefersReducedMotion ? 0 : 1,
            ease: [0.16, 1, 0.3, 1],
          }}
        />
      </div>
      {showLabel && (
        <motion.span
          className="absolute right-0 top-full mt-1 text-xs text-white/60"
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : { opacity: 0 }}
          transition={{ delay: 0.5 }}
        >
          {percentage.toFixed(0)}%
        </motion.span>
      )}
    </div>
  );
}
