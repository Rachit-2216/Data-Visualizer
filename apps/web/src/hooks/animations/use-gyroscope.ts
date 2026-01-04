'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useReducedMotion } from './use-reduced-motion';

interface GyroscopeState {
  alpha: number; // Z-axis rotation (0-360)
  beta: number;  // X-axis rotation (-180 to 180)
  gamma: number; // Y-axis rotation (-90 to 90)
  absolute: boolean;
}

interface UseGyroscopeOptions {
  /**
   * Whether gyroscope is enabled
   */
  enabled?: boolean;
  /**
   * Smoothing factor (0-1, higher = smoother but more lag)
   */
  smoothing?: number;
  /**
   * Callback when orientation changes
   */
  onOrientationChange?: (state: GyroscopeState) => void;
}

/**
 * Hook for accessing device gyroscope/orientation data
 * Useful for parallax effects on mobile devices
 */
export function useGyroscope(options: UseGyroscopeOptions = {}) {
  const { enabled = true, smoothing = 0.3, onOrientationChange } = options;
  const prefersReducedMotion = useReducedMotion();

  const [state, setState] = useState<GyroscopeState>({
    alpha: 0,
    beta: 0,
    gamma: 0,
    absolute: false,
  });

  const [isSupported, setIsSupported] = useState(false);
  const [isPermissionGranted, setIsPermissionGranted] = useState(false);
  const previousState = useRef<GyroscopeState>(state);

  // Check for DeviceOrientationEvent support
  useEffect(() => {
    const supported = typeof window !== 'undefined' && 'DeviceOrientationEvent' in window;
    setIsSupported(supported);
  }, []);

  // Request permission (required on iOS 13+)
  const requestPermission = useCallback(async () => {
    if (typeof window === 'undefined') return false;

    // Check if permission API exists (iOS 13+)
    const DeviceOrientationEvent = window.DeviceOrientationEvent as typeof window.DeviceOrientationEvent & {
      requestPermission?: () => Promise<'granted' | 'denied'>;
    };

    if (typeof DeviceOrientationEvent.requestPermission === 'function') {
      try {
        const permission = await DeviceOrientationEvent.requestPermission();
        const granted = permission === 'granted';
        setIsPermissionGranted(granted);
        return granted;
      } catch {
        setIsPermissionGranted(false);
        return false;
      }
    }

    // No permission needed (Android, older iOS)
    setIsPermissionGranted(true);
    return true;
  }, []);

  // Handle orientation change
  useEffect(() => {
    if (!enabled || !isSupported || prefersReducedMotion) return;

    const handleOrientation = (event: DeviceOrientationEvent) => {
      const alpha = event.alpha ?? 0;
      const beta = event.beta ?? 0;
      const gamma = event.gamma ?? 0;
      const absolute = event.absolute;

      // Apply smoothing
      const smoothedAlpha = previousState.current.alpha + (alpha - previousState.current.alpha) * (1 - smoothing);
      const smoothedBeta = previousState.current.beta + (beta - previousState.current.beta) * (1 - smoothing);
      const smoothedGamma = previousState.current.gamma + (gamma - previousState.current.gamma) * (1 - smoothing);

      const newState: GyroscopeState = {
        alpha: smoothedAlpha,
        beta: smoothedBeta,
        gamma: smoothedGamma,
        absolute,
      };

      previousState.current = newState;
      setState(newState);
      onOrientationChange?.(newState);
    };

    window.addEventListener('deviceorientation', handleOrientation);

    return () => {
      window.removeEventListener('deviceorientation', handleOrientation);
    };
  }, [enabled, isSupported, smoothing, onOrientationChange, prefersReducedMotion]);

  return {
    ...state,
    isSupported,
    isPermissionGranted,
    requestPermission,
  };
}

/**
 * Hook that converts gyroscope data to normalized parallax values
 */
interface UseGyroscopeParallaxOptions {
  enabled?: boolean;
  /**
   * Maximum tilt angle to consider (degrees)
   */
  maxTilt?: number;
  /**
   * Parallax intensity (multiplier)
   */
  intensity?: number;
  /**
   * Invert the effect
   */
  invert?: boolean;
}

export function useGyroscopeParallax(options: UseGyroscopeParallaxOptions = {}) {
  const { enabled = true, maxTilt = 30, intensity = 1, invert = false } = options;
  const prefersReducedMotion = useReducedMotion();

  const gyroscope = useGyroscope({ enabled: enabled && !prefersReducedMotion });

  // Normalize beta and gamma to -1 to 1 range based on maxTilt
  const normalizeAngle = (angle: number, max: number) => {
    const clamped = Math.max(-max, Math.min(max, angle));
    return clamped / max;
  };

  const x = normalizeAngle(gyroscope.gamma, maxTilt) * intensity * (invert ? -1 : 1);
  const y = normalizeAngle(gyroscope.beta, maxTilt) * intensity * (invert ? -1 : 1);

  return {
    x,
    y,
    isSupported: gyroscope.isSupported,
    isPermissionGranted: gyroscope.isPermissionGranted,
    requestPermission: gyroscope.requestPermission,
  };
}

/**
 * Hook for device motion (acceleration)
 */
interface MotionState {
  acceleration: {
    x: number;
    y: number;
    z: number;
  };
  accelerationIncludingGravity: {
    x: number;
    y: number;
    z: number;
  };
  rotationRate: {
    alpha: number;
    beta: number;
    gamma: number;
  };
  interval: number;
}

export function useDeviceMotion(enabled = true) {
  const prefersReducedMotion = useReducedMotion();
  const [state, setState] = useState<MotionState>({
    acceleration: { x: 0, y: 0, z: 0 },
    accelerationIncludingGravity: { x: 0, y: 0, z: 0 },
    rotationRate: { alpha: 0, beta: 0, gamma: 0 },
    interval: 0,
  });

  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    const supported = typeof window !== 'undefined' && 'DeviceMotionEvent' in window;
    setIsSupported(supported);
  }, []);

  useEffect(() => {
    if (!enabled || !isSupported || prefersReducedMotion) return;

    const handleMotion = (event: DeviceMotionEvent) => {
      setState({
        acceleration: {
          x: event.acceleration?.x ?? 0,
          y: event.acceleration?.y ?? 0,
          z: event.acceleration?.z ?? 0,
        },
        accelerationIncludingGravity: {
          x: event.accelerationIncludingGravity?.x ?? 0,
          y: event.accelerationIncludingGravity?.y ?? 0,
          z: event.accelerationIncludingGravity?.z ?? 0,
        },
        rotationRate: {
          alpha: event.rotationRate?.alpha ?? 0,
          beta: event.rotationRate?.beta ?? 0,
          gamma: event.rotationRate?.gamma ?? 0,
        },
        interval: event.interval,
      });
    };

    window.addEventListener('devicemotion', handleMotion);

    return () => {
      window.removeEventListener('devicemotion', handleMotion);
    };
  }, [enabled, isSupported, prefersReducedMotion]);

  return {
    ...state,
    isSupported,
  };
}

/**
 * Hook for detecting device shake
 */
interface UseShakeOptions {
  threshold?: number;
  timeout?: number;
  onShake?: () => void;
}

export function useShake(options: UseShakeOptions = {}) {
  const { threshold = 15, timeout = 1000, onShake } = options;
  const prefersReducedMotion = useReducedMotion();
  const motion = useDeviceMotion(!prefersReducedMotion);
  const lastShake = useRef(0);

  useEffect(() => {
    if (prefersReducedMotion) return;

    const { x, y, z } = motion.accelerationIncludingGravity;
    const total = Math.sqrt(x * x + y * y + z * z);

    if (total > threshold) {
      const now = Date.now();
      if (now - lastShake.current > timeout) {
        lastShake.current = now;
        onShake?.();
      }
    }
  }, [motion, threshold, timeout, onShake, prefersReducedMotion]);

  return {
    isSupported: motion.isSupported,
  };
}
