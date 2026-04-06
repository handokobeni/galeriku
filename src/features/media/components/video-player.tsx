"use client";

interface VideoPlayerProps {
  src: string;
  className?: string;
}

export function VideoPlayer({ src, className }: VideoPlayerProps) {
  return (
    <video src={src} controls playsInline className={className} preload="metadata">
      Your browser does not support the video element.
    </video>
  );
}
