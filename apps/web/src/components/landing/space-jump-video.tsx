'use client';

import { useEffect, useRef, useState } from 'react';

type SpaceJumpVideoProps = {
  className?: string;
  onTimeUpdate?: (currentTime: number, duration: number) => void;
  videoRef?: React.RefObject<HTMLVideoElement>;
};

export function SpaceJumpVideo({ className = '', onTimeUpdate, videoRef }: SpaceJumpVideoProps) {
  const internalRef = useRef<HTMLVideoElement>(null);
  const ref = videoRef ?? internalRef;
  const [hasVideo, setHasVideo] = useState(true);

  useEffect(() => {
    const video = ref.current;
    if (!video || !onTimeUpdate) return;

    const handleTimeUpdate = () => {
      onTimeUpdate(video.currentTime, video.duration || 0);
    };

    video.addEventListener('timeupdate', handleTimeUpdate);
    return () => video.removeEventListener('timeupdate', handleTimeUpdate);
  }, [onTimeUpdate, ref]);

  useEffect(() => {
    const video = ref.current;
    if (!video) return;
    // Keep paused; scroll handler will scrub the currentTime.
    video.load();
    video.pause();
  }, [ref]);

  return (
    <div className={`absolute inset-0 overflow-hidden ${className}`}>
      {hasVideo && (
        <video
          ref={ref}
          className="absolute inset-0 h-full w-full object-cover"
          src="/media/space-jump.mp4"
          playsInline
          muted
          loop
          preload="metadata"
          onError={() => setHasVideo(false)}
          aria-hidden="true"
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/20 to-black/85" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(14,165,233,0.2),transparent_70%)]" />
      {!hasVideo && (
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,#0ea5e930,transparent_60%),radial-gradient(circle_at_bottom,#14b8a620,transparent_55%)]" />
      )}
    </div>
  );
}
