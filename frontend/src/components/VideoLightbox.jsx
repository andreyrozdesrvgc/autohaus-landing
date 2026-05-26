import React, { useEffect, useRef } from "react";
import { X } from "lucide-react";
import { resolveMedia } from "@/lib/contentDefaults";

export default function VideoLightbox({ open, src, poster, title, meta, onClose }) {
  const videoRef = useRef(null);

  // Close on Escape, lock body scroll while open
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    // Play with sound when opening
    const v = videoRef.current;
    if (v) {
      v.currentTime = 0;
      v.muted = false;
      v.play().catch(() => {
        // If browser blocks unmuted autoplay, fall back to muted
        v.muted = true;
        v.play().catch(() => {});
      });
    }
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      data-testid="video-lightbox"
      role="dialog"
      aria-modal="true"
      aria-label={title || "Видео"}
      onClick={onClose}
      className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-md flex items-center justify-center animate-[fadeIn_300ms_ease-out]"
    >
      {/* Close */}
      <button
        type="button"
        onClick={onClose}
        aria-label="Закрыть видео"
        data-testid="video-lightbox-close"
        className="absolute top-5 right-5 md:top-8 md:right-8 z-10 w-11 h-11 border border-white/15 bg-black/40 hover:bg-white hover:text-black text-white flex items-center justify-center transition-all"
      >
        <X size={18} strokeWidth={1.5} />
      </button>

      {/* Title (top-left meta) */}
      {(title || meta) && (
        <div className="absolute top-5 left-5 md:top-8 md:left-8 max-w-[70vw]">
          {meta && (
            <div className="text-[10px] tracking-[0.32em] uppercase text-white/55 mb-1">
              {meta}
            </div>
          )}
          {title && (
            <div className="text-base md:text-lg tracking-tight text-white font-medium">
              {title}
            </div>
          )}
        </div>
      )}

      {/* Video — stop propagation so clicking the video itself doesn't close */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full h-full md:w-auto md:h-[88vh] md:aspect-[9/16] md:max-w-[calc(88vh*9/16)] flex items-center justify-center px-4"
      >
        <video
          ref={videoRef}
          src={resolveMedia(src)}
          poster={poster ? resolveMedia(poster) : undefined}
          controls
          playsInline
          autoPlay
          loop
          preload="auto"
          className="w-full h-full md:h-[88vh] object-contain bg-black"
        />
      </div>
    </div>
  );
}
