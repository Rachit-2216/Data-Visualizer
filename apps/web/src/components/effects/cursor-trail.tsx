'use client';

import React, { useEffect, useRef, useState } from 'react';
import { motion, useSpring } from 'framer-motion';
import { useMousePosition } from '@/hooks/animations/use-mouse-position';
import { useReducedMotion } from '@/hooks/animations/use-reduced-motion';

interface TrailPoint {
  x: number;
  y: number;
  timestamp: number;
}

interface CursorTrailProps {
  /**
   * Number of trail points
   */
  trailLength?: number;
  /**
   * Color of the trail
   */
  color?: string;
  /**
   * Size of trail dots (in pixels)
   */
  dotSize?: number;
  /**
   * Whether the trail is enabled
   */
  enabled?: boolean;
  /**
   * Decay rate for opacity (0-1, higher = faster fade)
   */
  decay?: number;
}

export function CursorTrail({
  trailLength = 8,
  color = 'rgb(56, 189, 248)',
  dotSize = 6,
  enabled = true,
  decay = 0.15,
}: CursorTrailProps) {
  const prefersReducedMotion = useReducedMotion();
  const mousePosition = useMousePosition({ trackVelocity: true });
  const [trail, setTrail] = useState<TrailPoint[]>([]);
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  const frameRef = useRef<number | null>(null);
  const lastPositionRef = useRef({ x: 0, y: 0 });

  // Check for touch device
  useEffect(() => {
    setIsTouchDevice('ontouchstart' in window || navigator.maxTouchPoints > 0);
  }, []);

  useEffect(() => {
    if (!enabled || prefersReducedMotion || isTouchDevice) return;

    const updateTrail = () => {
      const { clientX, clientY, velocity } = mousePosition;
      const speed = Math.sqrt(velocity.x * velocity.x + velocity.y * velocity.y);

      // Only add point if cursor has moved significantly
      const dx = clientX - lastPositionRef.current.x;
      const dy = clientY - lastPositionRef.current.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance > 5 || speed > 100) {
        lastPositionRef.current = { x: clientX, y: clientY };

        setTrail((prev) => {
          const newTrail = [
            { x: clientX, y: clientY, timestamp: Date.now() },
            ...prev.slice(0, trailLength - 1),
          ];
          return newTrail;
        });
      }

      frameRef.current = requestAnimationFrame(updateTrail);
    };

    frameRef.current = requestAnimationFrame(updateTrail);

    return () => {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }
    };
  }, [enabled, prefersReducedMotion, isTouchDevice, mousePosition, trailLength]);

  // Decay trail points over time
  useEffect(() => {
    if (!enabled || prefersReducedMotion || isTouchDevice) return;

    const decayInterval = setInterval(() => {
      const now = Date.now();
      setTrail((prev) => prev.filter((point) => now - point.timestamp < 500));
    }, 50);

    return () => clearInterval(decayInterval);
  }, [enabled, prefersReducedMotion, isTouchDevice]);

  if (!enabled || prefersReducedMotion || isTouchDevice || !mousePosition.isActive) {
    return null;
  }

  return (
    <div className="fixed inset-0 pointer-events-none z-[9998]">
      {trail.map((point, index) => {
        const age = (Date.now() - point.timestamp) / 500; // 0 to 1 over 500ms
        const opacity = Math.max(0, 1 - age) * (1 - index * decay);
        const size = dotSize * (1 - index * 0.1);

        return (
          <motion.div
            key={point.timestamp}
            className="absolute rounded-full"
            style={{
              left: point.x,
              top: point.y,
              width: size,
              height: size,
              backgroundColor: color,
              opacity,
              transform: 'translate(-50%, -50%)',
              boxShadow: `0 0 ${size}px ${color}50`,
            }}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.1 }}
          />
        );
      })}
    </div>
  );
}

/**
 * Particle burst effect on click
 */
interface ParticleBurstProps {
  x: number;
  y: number;
  color?: string;
  particleCount?: number;
  onComplete?: () => void;
}

export function ParticleBurst({
  x,
  y,
  color = 'rgb(56, 189, 248)',
  particleCount = 12,
  onComplete,
}: ParticleBurstProps) {
  const [particles, setParticles] = useState<Array<{ id: number; angle: number; distance: number }>>([]);

  useEffect(() => {
    const newParticles = Array.from({ length: particleCount }, (_, i) => ({
      id: i,
      angle: (i / particleCount) * Math.PI * 2,
      distance: 30 + Math.random() * 30,
    }));
    setParticles(newParticles);

    const timer = setTimeout(() => {
      onComplete?.();
    }, 600);

    return () => clearTimeout(timer);
  }, [particleCount, onComplete]);

  return (
    <div className="fixed pointer-events-none z-[9999]" style={{ left: x, top: y }}>
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          className="absolute w-2 h-2 rounded-full"
          style={{
            backgroundColor: color,
            boxShadow: `0 0 6px ${color}`,
          }}
          initial={{
            x: 0,
            y: 0,
            scale: 1,
            opacity: 1,
          }}
          animate={{
            x: Math.cos(particle.angle) * particle.distance,
            y: Math.sin(particle.angle) * particle.distance,
            scale: 0,
            opacity: 0,
          }}
          transition={{
            duration: 0.5,
            ease: 'easeOut',
          }}
        />
      ))}
    </div>
  );
}

/**
 * Hook to trigger particle bursts on click
 */
export function useParticleBurst() {
  const [bursts, setBursts] = useState<Array<{ id: number; x: number; y: number }>>([]);

  const trigger = (x: number, y: number) => {
    const id = Date.now();
    setBursts((prev) => [...prev, { id, x, y }]);
  };

  const removeBurst = (id: number) => {
    setBursts((prev) => prev.filter((burst) => burst.id !== id));
  };

  const BurstContainer = () => (
    <>
      {bursts.map((burst) => (
        <ParticleBurst key={burst.id} x={burst.x} y={burst.y} onComplete={() => removeBurst(burst.id)} />
      ))}
    </>
  );

  return { trigger, BurstContainer };
}
