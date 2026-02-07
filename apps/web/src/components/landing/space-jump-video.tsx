'use client';

import { useEffect, useRef } from 'react';

type SpaceJumpVideoProps = {
  className?: string;
  onTimeUpdate?: (currentTime: number, duration: number) => void;
  videoRef?: React.RefObject<HTMLVideoElement>;
};

export function SpaceJumpVideo({ className = '', onTimeUpdate, videoRef }: SpaceJumpVideoProps) {
  const internalRef = useRef<HTMLVideoElement>(null);
  const ref = videoRef ?? internalRef;

  useEffect(() => {
    const video = ref.current;
    if (!video || !onTimeUpdate) return;

    const handleTimeUpdate = () => {
      onTimeUpdate(video.currentTime, video.duration || 0);
    };

    video.addEventListener('timeupdate', handleTimeUpdate);
    return () => video.removeEventListener('timeupdate', handleTimeUpdate);
  }, [onTimeUpdate, ref]);

  return (
    <div className={`absolute inset-0 overflow-hidden ${className}`}>
      <video
        ref={ref}
        className="absolute inset-0 h-full w-full object-cover"
        src="/media/space-jump.mp4"
        playsInline
        muted
        loop
        autoPlay
        preload="auto"
        aria-hidden="true"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/40 to-black/90" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(14,165,233,0.15),transparent_70%)]" />
    </div>
  );
}
