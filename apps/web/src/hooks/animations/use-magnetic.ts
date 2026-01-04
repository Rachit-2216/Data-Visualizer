'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
import { useMousePosition } from './use-mouse-position';
import { useReducedMotion } from './use-reduced-motion';

interface MagneticConfig {
  /**
   * How strong the magnetic pull is (0-1)
   */
  strength?: number;
  /**
   * Radius of magnetic influence in pixels
   */
  radius?: number;
  /**
   * Easing function for the animation
   */
  ease?: number;
  /**
   * Whether to scale on hover
   */
  scale?: boolean;
  /**
   * Scale amount when hovered
   */
  scaleAmount?: number;
}

interface MagneticTransform {
  x: number;
  y: number;
  scale: number;
}

/**
 * Hook that creates a magnetic attraction effect toward the cursor.
 * Elements using this hook will subtly move toward the cursor when nearby.
 *
 * @param config - Configuration options
 * @returns Object with ref and transform values
 */
export function useMagnetic(config: MagneticConfig = {}) {
  const {
    strength = 0.3,
    radius = 100,
    ease = 0.15,
    scale = true,
    scaleAmount = 1.05,
  } = config;

  const elementRef = useRef<HTMLElement | null>(null);
  const frameRef = useRef<number | null>(null);
  const prefersReducedMotion = useReducedMotion();

  const [transform, setTransform] = useState<MagneticTransform>({
    x: 0,
    y: 0,
    scale: 1,
  });

  const [isHovered, setIsHovered] = useState(false);

  const currentTransform = useRef<MagneticTransform>({ x: 0, y: 0, scale: 1 });
  const targetTransform = useRef<MagneticTransform>({ x: 0, y: 0, scale: 1 });

  // Animate toward target
  const animate = useCallback(() => {
    const current = currentTransform.current;
    const target = targetTransform.current;

    // Lerp toward target
    current.x += (target.x - current.x) * ease;
    current.y += (target.y - current.y) * ease;
    current.scale += (target.scale - current.scale) * ease;

    // Check if we need to keep animating
    const deltaX = Math.abs(target.x - current.x);
    const deltaY = Math.abs(target.y - current.y);
    const deltaScale = Math.abs(target.scale - current.scale);

    if (deltaX > 0.01 || deltaY > 0.01 || deltaScale > 0.001) {
      setTransform({ ...current });
      frameRef.current = requestAnimationFrame(animate);
    } else {
      // Snap to final values
      current.x = target.x;
      current.y = target.y;
      current.scale = target.scale;
      setTransform({ ...current });
    }
  }, [ease]);

  const handleMouseMove = useCallback(
    (event: MouseEvent) => {
      if (!elementRef.current || prefersReducedMotion) return;

      const rect = elementRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      const distX = event.clientX - centerX;
      const distY = event.clientY - centerY;
      const distance = Math.sqrt(distX * distX + distY * distY);

      if (distance < radius) {
        // Calculate pull based on distance (stronger when closer)
        const pullStrength = (1 - distance / radius) * strength;
        targetTransform.current = {
          x: distX * pullStrength,
          y: distY * pullStrength,
          scale: scale ? 1 + (scaleAmount - 1) * pullStrength : 1,
        };

        if (!frameRef.current) {
          frameRef.current = requestAnimationFrame(animate);
        }
      } else {
        targetTransform.current = { x: 0, y: 0, scale: 1 };
        if (!frameRef.current) {
          frameRef.current = requestAnimationFrame(animate);
        }
      }
    },
    [radius, strength, scale, scaleAmount, prefersReducedMotion, animate]
  );

  const handleMouseLeave = useCallback(() => {
    setIsHovered(false);
    targetTransform.current = { x: 0, y: 0, scale: 1 };
    if (!frameRef.current) {
      frameRef.current = requestAnimationFrame(animate);
    }
  }, [animate]);

  const handleMouseEnter = useCallback(() => {
    setIsHovered(true);
  }, []);

  // Set up ref callback
  const ref = useCallback(
    (node: HTMLElement | null) => {
      // Cleanup previous listeners
      if (elementRef.current) {
        elementRef.current.removeEventListener('mousemove', handleMouseMove);
        elementRef.current.removeEventListener('mouseleave', handleMouseLeave);
        elementRef.current.removeEventListener('mouseenter', handleMouseEnter);
      }

      elementRef.current = node;

      if (node) {
        // Use a larger area for tracking (the entire document)
        document.addEventListener('mousemove', handleMouseMove, { passive: true });
        node.addEventListener('mouseenter', handleMouseEnter, { passive: true });
        node.addEventListener('mouseleave', handleMouseLeave, { passive: true });
      }
    },
    [handleMouseMove, handleMouseLeave, handleMouseEnter]
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }
    };
  }, [handleMouseMove]);

  // Return the style to apply
  const style = prefersReducedMotion
    ? {}
    : {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0) scale(${transform.scale})`,
      };

  return {
    ref,
    style,
    transform,
    isHovered,
  };
}

/**
 * Hook for creating a magnetic snap effect for cursor.
 * The cursor will be "pulled" toward magnetic elements.
 *
 * @returns Cursor adjustment values
 */
export function useMagneticCursor() {
  const [adjustment, setAdjustment] = useState({ x: 0, y: 0, isNearMagnetic: false });
  const mousePosition = useMousePosition();
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    if (typeof window === 'undefined' || prefersReducedMotion) return;

    const magneticElements = document.querySelectorAll('[data-magnetic]');
    let nearestAdjustment = { x: 0, y: 0, isNearMagnetic: false };
    let nearestDistance = Infinity;

    magneticElements.forEach((element) => {
      const rect = element.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      const distX = mousePosition.clientX - centerX;
      const distY = mousePosition.clientY - centerY;
      const distance = Math.sqrt(distX * distX + distY * distY);

      const radius = parseFloat(element.getAttribute('data-magnetic-radius') || '50');
      const strength = parseFloat(element.getAttribute('data-magnetic-strength') || '0.5');

      if (distance < radius && distance < nearestDistance) {
        nearestDistance = distance;
        const pullStrength = (1 - distance / radius) * strength;
        nearestAdjustment = {
          x: distX * pullStrength,
          y: distY * pullStrength,
          isNearMagnetic: true,
        };
      }
    });

    setAdjustment(nearestAdjustment);
  }, [mousePosition.clientX, mousePosition.clientY, prefersReducedMotion]);

  return adjustment;
}
