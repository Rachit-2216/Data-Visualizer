'use client';

import { useEffect, useRef } from 'react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

type PinnedSectionProps = {
  children: React.ReactNode;
  pinnedContent: React.ReactNode;
  scrollingContent: React.ReactNode;
  scrollHeight?: string;
  pinnedOnLeft?: boolean;
  id: string;
  background?: string;
  onProgress?: (progress: number) => void;
};

export function PinnedSection({
  children,
  pinnedContent,
  scrollingContent,
  scrollHeight = '300vh',
  pinnedOnLeft = true,
  id,
  background = 'transparent',
  onProgress,
}: PinnedSectionProps) {
  const sectionRef = useRef<HTMLDivElement>(null);
  const pinnedRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!sectionRef.current || !pinnedRef.current) return;

    const trigger = ScrollTrigger.create({
      trigger: sectionRef.current,
      start: 'top top',
      end: 'bottom bottom',
      pin: pinnedRef.current,
      pinSpacing: false,
      scrub: 1,
      onUpdate: (self) => {
        onProgress?.(self.progress);
      },
    });

    return () => {
      trigger.kill();
    };
  }, [onProgress]);

  return (
    <section ref={sectionRef} id={id} className="relative" style={{ height: scrollHeight, background }}>
      <div className="sticky top-0 h-screen flex">
        <div
          ref={pinnedRef}
          className={`w-1/2 h-screen flex items-center justify-center ${pinnedOnLeft ? 'order-1' : 'order-2'}`}
        >
          {pinnedContent}
        </div>

        <div className={`w-1/2 h-auto ${pinnedOnLeft ? 'order-2' : 'order-1'}`}>{scrollingContent}</div>
      </div>

      {children}
    </section>
  );
}
