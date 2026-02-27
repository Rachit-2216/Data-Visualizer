'use client';

import { useEffect, useRef } from 'react';
import type Lenis from 'lenis';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

type ScrollAcceleratorOptions = {
  triggerRef: React.RefObject<HTMLElement>;
  videoRef?: React.RefObject<HTMLVideoElement>;
  onProgress?: (progress: number, velocity: number) => void;
  lenis?: Lenis | null;
  peakTimeSeconds?: number;
  autoStart?: number;
  autoEnd?: number;
};

export function useScrollAccelerator({
  triggerRef,
  videoRef,
  onProgress,
  lenis,
  peakTimeSeconds = 0.8,
  autoStart = 0.12,
  autoEnd = 1.0,
}: ScrollAcceleratorOptions) {
  const progressRef = useRef(0);
  const velocityRef = useRef(0);
  const targetRef = useRef(0);
  const rafRef = useRef<number | null>(null);
  const triggerRefInternal = useRef<ScrollTrigger | null>(null);
  const autoActiveRef = useRef(false);
  const lastInputRef = useRef(0);
  const directionRef = useRef(1);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    if (!triggerRef.current) return;

    const trigger = ScrollTrigger.create({
      trigger: triggerRef.current,
      start: 'top top',
      end: '+=260%',
      pin: true,
      scrub: false,
      anticipatePin: 1,
      onUpdate: (self) => {
        targetRef.current = self.progress;
        directionRef.current = self.direction || 1;
        lastInputRef.current = performance.now();

        if (!autoActiveRef.current && self.progress >= autoStart && self.direction > 0) {
          autoActiveRef.current = true;
        }

        if (self.progress <= 0.05 && self.direction < 0) {
          autoActiveRef.current = false;
        }
      },
    });
    triggerRefInternal.current = trigger;
    const refreshTimer = setTimeout(() => ScrollTrigger.refresh(), 100);

    let lastTime = performance.now();

    const tick = (time: number) => {
      const delta = Math.min((time - lastTime) / 1000, 0.05);
      lastTime = time;

      const target = targetRef.current;
      let progress = progressRef.current;
      let velocity = velocityRef.current;

      const autoActive = autoActiveRef.current;
      const now = performance.now();
      const userRecent = now - lastInputRef.current < 160;

      if (!autoActive) {
        // Follow user scroll directly; do NOT drive scroll position.
        progress = target;
        velocity = 0;
      } else {
        const maxVelocity = 3.6;
        const ease = 4.2;
        const video = videoRef?.current;
        const duration = video?.duration && Number.isFinite(video.duration) ? video.duration : 4;
        const peakProgress = Math.min(autoEnd - 0.05, Math.max(autoStart + 0.05, peakTimeSeconds / duration));

        const accelWindow = Math.max(0.001, peakProgress - autoStart);
        const decelWindow = Math.max(0.001, autoEnd - peakProgress);

        const normalized = progress < peakProgress
          ? (progress - autoStart) / accelWindow
          : (progress - peakProgress) / decelWindow;

        const targetVelocity = progress < peakProgress
          ? 0.8 + normalized * (maxVelocity - 0.8)
          : maxVelocity - normalized * (maxVelocity - 1.0);

        velocity += (targetVelocity - velocity) * ease * delta;
        velocity = Math.max(velocity, 0);
        progress += velocity * delta;

        if (progress >= autoEnd) {
          progress = autoEnd;
          velocity = 0;
          autoActiveRef.current = false;
          targetRef.current = progress;
        } else {
          targetRef.current = progress;
        }

        if (directionRef.current < 0 && userRecent) {
          autoActiveRef.current = false;
        }
      }

      progress = Math.max(0, Math.min(1, progress));
      progressRef.current = progress;
      velocityRef.current = velocity;

      const triggerInstance = triggerRefInternal.current;
      if (triggerInstance && triggerInstance.isActive && autoActiveRef.current) {
        const scrollTarget = triggerInstance.start + (triggerInstance.end - triggerInstance.start) * progress;
        if (lenis) {
          lenis.scrollTo(scrollTarget, { immediate: true });
        } else {
          window.scrollTo(0, scrollTarget);
        }
      }

      const video = videoRef?.current;
      if (video && video.duration && triggerInstance?.isActive) {
        const targetTime = progress * video.duration;
        if (Math.abs(video.currentTime - targetTime) > 0.45) {
          video.currentTime = targetTime;
        }

        const rate = Math.min(1 + Math.abs(velocity) * 0.7, 3);
        video.playbackRate = rate;
        const shouldPlay = progress > 0.01 && (autoActive || userRecent);
        if (shouldPlay) {
          video.play().catch(() => {});
        } else {
          video.pause();
        }
      } else if (video) {
        video.pause();
      }

      onProgress?.(progress, velocity);
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      clearTimeout(refreshTimer);
      trigger.kill();
      triggerRefInternal.current = null;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [triggerRef, videoRef, onProgress, lenis, peakTimeSeconds, autoStart, autoEnd]);

  return { progressRef, velocityRef };
}
