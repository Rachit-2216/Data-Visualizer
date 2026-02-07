'use client';

import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

type ScrollAcceleratorOptions = {
  triggerRef: React.RefObject<HTMLElement>;
  videoRef?: React.RefObject<HTMLVideoElement>;
  onProgress?: (progress: number, velocity: number) => void;
};

export function useScrollAccelerator({ triggerRef, videoRef, onProgress }: ScrollAcceleratorOptions) {
  const progressRef = useRef(0);
  const velocityRef = useRef(0);
  const targetRef = useRef(0);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    if (!triggerRef.current) return;

    const trigger = ScrollTrigger.create({
      trigger: triggerRef.current,
      start: 'top top',
      end: '+=200%',
      pin: true,
      scrub: false,
      anticipatePin: 1,
      onUpdate: (self) => {
        targetRef.current = self.progress;
      },
    });
    const refreshTimer = setTimeout(() => ScrollTrigger.refresh(), 100);

    let lastTime = performance.now();

    const tick = (time: number) => {
      const delta = Math.min((time - lastTime) / 1000, 0.05);
      lastTime = time;

      const target = targetRef.current;
      const progress = progressRef.current;
      const velocity = velocityRef.current;

      const accel = target > progress ? 2.5 : -1.8;
      let nextVelocity = velocity + accel * delta;
      nextVelocity = Math.max(Math.min(nextVelocity, 3), -2);

      let nextProgress = progress + nextVelocity * delta;

      if ((nextVelocity >= 0 && nextProgress > target) || (nextVelocity <= 0 && nextProgress < target)) {
        nextProgress = target;
        nextVelocity = 0;
      }

      progressRef.current = nextProgress;
      velocityRef.current = nextVelocity;

      const video = videoRef?.current;
      if (video && video.duration) {
        const targetTime = nextProgress * video.duration;
        if (Math.abs(video.currentTime - targetTime) > 0.4) {
          video.currentTime = targetTime;
        }

        const rate = Math.min(1 + Math.abs(nextVelocity) * 0.6, 3);
        video.playbackRate = rate;
      }

      onProgress?.(nextProgress, nextVelocity);
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      clearTimeout(refreshTimer);
      trigger.kill();
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [triggerRef, videoRef, onProgress]);

  return { progressRef, velocityRef };
}
