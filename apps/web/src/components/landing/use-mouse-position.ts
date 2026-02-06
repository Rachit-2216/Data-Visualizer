'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

type MousePosition = {
  x: number;
  y: number;
  clientX: number;
  clientY: number;
  isMoving: boolean;
};

export function useMousePosition(smoothing = 0.1): MousePosition {
  const [position, setPosition] = useState<MousePosition>({
    x: 0,
    y: 0,
    clientX: 0,
    clientY: 0,
    isMoving: false,
  });

  const targetRef = useRef({ x: 0, y: 0 });
  const currentRef = useRef({ x: 0, y: 0 });
  const frameRef = useRef<number>();
  const timeoutRef = useRef<NodeJS.Timeout>();

  const handleMouseMove = useCallback((event: MouseEvent) => {
    targetRef.current = {
      x: (event.clientX / window.innerWidth) * 2 - 1,
      y: -(event.clientY / window.innerHeight) * 2 + 1,
    };

    setPosition((prev) => ({
      ...prev,
      clientX: event.clientX,
      clientY: event.clientY,
      isMoving: true,
    }));

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      setPosition((prev) => ({ ...prev, isMoving: false }));
    }, 100);
  }, []);

  useEffect(() => {
    const animate = () => {
      currentRef.current.x += (targetRef.current.x - currentRef.current.x) * smoothing;
      currentRef.current.y += (targetRef.current.y - currentRef.current.y) * smoothing;

      setPosition((prev) => ({
        ...prev,
        x: currentRef.current.x,
        y: currentRef.current.y,
      }));

      frameRef.current = requestAnimationFrame(animate);
    };

    frameRef.current = requestAnimationFrame(animate);

    return () => {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }
    };
  }, [smoothing]);

  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [handleMouseMove]);

  return position;
}
