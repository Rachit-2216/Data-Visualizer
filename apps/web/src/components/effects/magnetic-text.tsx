'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { motion, useSpring, useTransform } from 'framer-motion';
import { useMousePosition } from '@/hooks/animations/use-mouse-position';
import { useReducedMotion } from '@/hooks/animations/use-reduced-motion';

interface MagneticTextProps {
  children: string;
  /**
   * How strong the magnetic effect is (0-1)
   */
  strength?: number;
  /**
   * Radius of magnetic influence in pixels
   */
  radius?: number;
  /**
   * Maximum displacement in pixels
   */
  maxDisplacement?: number;
  /**
   * Additional CSS classes for the container
   */
  className?: string;
  /**
   * Tag to use for the text (h1, h2, p, span, etc.)
   */
  as?: React.ElementType;
}

interface LetterPosition {
  x: number;
  y: number;
  width: number;
  height: number;
}

export function MagneticText({
  children,
  strength = 0.15,
  radius = 150,
  maxDisplacement = 15,
  className = '',
  as: Tag = 'h1',
}: MagneticTextProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const prefersReducedMotion = useReducedMotion();
  const mousePosition = useMousePosition();
  const [letterPositions, setLetterPositions] = useState<LetterPosition[]>([]);
  const [isHovered, setIsHovered] = useState(false);

  // Split text into letters, preserving spaces
  const letters = children.split('');

  // Calculate letter positions on mount and resize
  useEffect(() => {
    if (!containerRef.current || prefersReducedMotion) return;

    const updatePositions = () => {
      const container = containerRef.current;
      if (!container) return;

      const letterElements = container.querySelectorAll('[data-letter]');
      const positions: LetterPosition[] = [];

      letterElements.forEach((element) => {
        const rect = element.getBoundingClientRect();
        const containerRect = container.getBoundingClientRect();
        positions.push({
          x: rect.left - containerRect.left + rect.width / 2,
          y: rect.top - containerRect.top + rect.height / 2,
          width: rect.width,
          height: rect.height,
        });
      });

      setLetterPositions(positions);
    };

    updatePositions();
    window.addEventListener('resize', updatePositions);

    return () => {
      window.removeEventListener('resize', updatePositions);
    };
  }, [children, prefersReducedMotion]);

  if (prefersReducedMotion) {
    return (
      <Tag className={className}>
        {children}
      </Tag>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`inline-block ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Tag className="flex flex-wrap">
        {letters.map((letter, index) => (
          <MagneticLetter
            key={index}
            letter={letter}
            index={index}
            position={letterPositions[index]}
            mouseX={mousePosition.clientX}
            mouseY={mousePosition.clientY}
            containerRef={containerRef}
            strength={strength}
            radius={radius}
            maxDisplacement={maxDisplacement}
            isHovered={isHovered}
          />
        ))}
      </Tag>
    </div>
  );
}

interface MagneticLetterProps {
  letter: string;
  index: number;
  position?: LetterPosition;
  mouseX: number;
  mouseY: number;
  containerRef: React.RefObject<HTMLDivElement | null>;
  strength: number;
  radius: number;
  maxDisplacement: number;
  isHovered: boolean;
}

function MagneticLetter({
  letter,
  index,
  position,
  mouseX,
  mouseY,
  containerRef,
  strength,
  radius,
  maxDisplacement,
  isHovered,
}: MagneticLetterProps) {
  const x = useSpring(0, { stiffness: 150, damping: 15 });
  const y = useSpring(0, { stiffness: 150, damping: 15 });
  const rotateZ = useSpring(0, { stiffness: 200, damping: 20 });

  useEffect(() => {
    if (!position || !containerRef.current || !isHovered) {
      x.set(0);
      y.set(0);
      rotateZ.set(0);
      return;
    }

    const containerRect = containerRef.current.getBoundingClientRect();
    const letterCenterX = containerRect.left + position.x;
    const letterCenterY = containerRect.top + position.y;

    const dx = mouseX - letterCenterX;
    const dy = mouseY - letterCenterY;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance < radius) {
      const pullStrength = (1 - distance / radius) * strength;
      const displaceX = Math.min(maxDisplacement, dx * pullStrength);
      const displaceY = Math.min(maxDisplacement, dy * pullStrength);
      const rotate = (dx / radius) * 5 * pullStrength;

      x.set(displaceX);
      y.set(displaceY);
      rotateZ.set(rotate);
    } else {
      x.set(0);
      y.set(0);
      rotateZ.set(0);
    }
  }, [mouseX, mouseY, position, containerRef, strength, radius, maxDisplacement, isHovered, x, y, rotateZ]);

  // Handle spaces
  if (letter === ' ') {
    return <span className="inline-block w-[0.3em]">&nbsp;</span>;
  }

  return (
    <motion.span
      data-letter
      className="inline-block"
      style={{
        x,
        y,
        rotateZ,
        willChange: 'transform',
      }}
    >
      {letter}
    </motion.span>
  );
}

/**
 * Simpler magnetic text that moves as a whole unit
 */
interface MagneticBlockProps {
  children: React.ReactNode;
  strength?: number;
  radius?: number;
  className?: string;
}

export function MagneticBlock({
  children,
  strength = 0.1,
  radius = 200,
  className = '',
}: MagneticBlockProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const prefersReducedMotion = useReducedMotion();
  const mousePosition = useMousePosition();

  const x = useSpring(0, { stiffness: 100, damping: 15 });
  const y = useSpring(0, { stiffness: 100, damping: 15 });

  useEffect(() => {
    if (!containerRef.current || prefersReducedMotion) return;

    const rect = containerRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const dx = mousePosition.clientX - centerX;
    const dy = mousePosition.clientY - centerY;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance < radius) {
      const pullStrength = (1 - distance / radius) * strength;
      x.set(dx * pullStrength);
      y.set(dy * pullStrength);
    } else {
      x.set(0);
      y.set(0);
    }
  }, [mousePosition.clientX, mousePosition.clientY, prefersReducedMotion, strength, radius, x, y]);

  if (prefersReducedMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      ref={containerRef}
      className={className}
      style={{ x, y, willChange: 'transform' }}
    >
      {children}
    </motion.div>
  );
}
