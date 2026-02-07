'use client';

import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

type PinnedSectionProps = {
  id: string;
  pinnedContent: React.ReactNode;
  scrollingContent: React.ReactNode;
  pinnedOnLeft?: boolean;
  minHeight?: string;
};

export function PinnedSectionFixed({
  id,
  pinnedContent,
  scrollingContent,
  pinnedOnLeft = true,
  minHeight = '300vh',
}: PinnedSectionProps) {
  const sectionRef = useRef<HTMLDivElement>(null);
  const pinnedRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!sectionRef.current || !pinnedRef.current) return;
    gsap.registerPlugin(ScrollTrigger);

    const ctx = gsap.context(() => {
      ScrollTrigger.create({
        trigger: sectionRef.current,
        pin: pinnedRef.current,
        start: 'top top',
        end: 'bottom bottom',
        pinSpacing: false,
        anticipatePin: 1,
        markers: typeof window !== 'undefined'
          ? new URLSearchParams(window.location.search).has('debug')
          : false,
      });
    }, sectionRef);

    const timer = setTimeout(() => ScrollTrigger.refresh(), 100);

    return () => {
      clearTimeout(timer);
      ctx.revert();
    };
  }, []);

  return (
    <section ref={sectionRef} id={id} className="relative" style={{ minHeight }}>
      <div className="flex" style={{ minHeight }}>
        <div
          ref={pinnedRef}
          className={`sticky top-0 flex h-screen w-1/2 items-center justify-center ${
            pinnedOnLeft ? 'order-1' : 'order-2'
          }`}
        >
          {pinnedContent}
        </div>
        <div className={`w-1/2 ${pinnedOnLeft ? 'order-2' : 'order-1'}`}>{scrollingContent}</div>
      </div>
    </section>
  );
}
