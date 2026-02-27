'use client';

import { useMemo } from 'react';

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
  const sectionStyle = useMemo(() => ({ minHeight }), [minHeight]);

  return (
    <section id={id} className="relative" style={sectionStyle}>
      <div className="flex" style={sectionStyle}>
        <div
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
