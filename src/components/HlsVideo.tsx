import { useEffect, useRef } from "react";
import Hls from "hls.js";

export default function HlsVideo({
  src,
  poster,
  autoPlay = true,
}: {
  src: string;
  poster?: string;
  autoPlay?: boolean;
}) {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Safari supports native HLS
    if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = src;
      if (autoPlay) video.play().catch(() => {});
      return;
    }

    if (Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
      });
      hls.loadSource(src);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        if (autoPlay) video.play().catch(() => {});
      });
      return () => hls.destroy();
    }
  }, [src, autoPlay]);

  return (
    <video
      ref={videoRef}
      controls
      playsInline
      poster={poster}
      className="h-full w-full"
      style={{ background: "#000" }}
    />
  );
}
