"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useCallback, useState, useRef } from "react";
import { Photo } from "@/lib/photos";

interface LightboxProps {
  photos: Photo[];
  currentIndex: number;
  onClose: () => void;
  onNavigate: (index: number) => void;
}

export default function Lightbox({
  photos,
  currentIndex,
  onClose,
  onNavigate,
}: LightboxProps) {
  const [isSlideshow, setIsSlideshow] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [loaded, setLoaded] = useState<Set<number>>(new Set([currentIndex]));
  const containerRef = useRef<HTMLDivElement>(null);

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
  }, []);

  // Sync fullscreen state
  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", handler);
    return () => document.removeEventListener("fullscreenchange", handler);
  }, []);

  const goNext = useCallback(() => {
    onNavigate((currentIndex + 1) % photos.length);
  }, [currentIndex, photos.length, onNavigate]);

  const goPrev = useCallback(() => {
    onNavigate((currentIndex - 1 + photos.length) % photos.length);
  }, [currentIndex, photos.length, onNavigate]);

  // Preload adjacent images (prev, next, and next+1)
  useEffect(() => {
    const toPreload = [
      (currentIndex + 1) % photos.length,
      (currentIndex + 2) % photos.length,
      (currentIndex - 1 + photos.length) % photos.length,
    ];
    toPreload.forEach((i) => {
      if (!loaded.has(i)) {
        const img = new Image();
        img.src = photos[i].src;
        img.onload = () => setLoaded((prev) => new Set(prev).add(i));
      }
    });
  }, [currentIndex, photos, loaded]);

  // Keyboard navigation
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (document.fullscreenElement) {
          document.exitFullscreen?.();
        } else {
          onClose();
        }
      }
      if (e.key === "ArrowRight") goNext();
      if (e.key === "ArrowLeft") goPrev();
      if (e.key === " ") {
        e.preventDefault();
        setIsSlideshow((s) => !s);
      }
      if (e.key === "f" || e.key === "F") toggleFullscreen();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose, goNext, goPrev, toggleFullscreen]);

  // Slideshow autoplay
  useEffect(() => {
    if (!isSlideshow) return;
    const timer = setInterval(goNext, 3000);
    return () => clearInterval(timer);
  }, [isSlideshow, goNext]);

  // Prevent body scroll
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  const currentPhoto = photos[currentIndex];

  return (
    <AnimatePresence>
      <motion.div
        ref={containerRef}
        className="fixed inset-0 z-100 flex items-center justify-center bg-charcoal"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
      >
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-charcoal/95 backdrop-blur-sm"
          onClick={onClose}
        />

        {/* Controls - Top bar */}
        <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between p-4 sm:p-6">
          <span className="text-white/60 text-sm font-body">
            {currentIndex + 1} / {photos.length}
          </span>

          <div className="flex items-center gap-3">
            {/* Slideshow toggle */}
            <button
              onClick={() => setIsSlideshow((s) => !s)}
              className={`p-2 rounded-full transition-colors ${
                isSlideshow
                  ? "bg-gold text-charcoal"
                  : "bg-white/10 text-white hover:bg-white/20"
              }`}
              title={isSlideshow ? "Pause slideshow" : "Start slideshow (Space)"}
            >
              {isSlideshow ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <rect x="6" y="4" width="4" height="16" rx="1" />
                  <rect x="14" y="4" width="4" height="16" rx="1" />
                </svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M8 5v14l11-7z" />
                </svg>
              )}
            </button>

            {/* Fullscreen */}
            <button
              onClick={toggleFullscreen}
              className="p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
              title={isFullscreen ? "Exit fullscreen (F)" : "Fullscreen (F)"}
            >
              {isFullscreen ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M8 3v3a2 2 0 0 1-2 2H3M21 8h-3a2 2 0 0 1-2-2V3M3 16h3a2 2 0 0 1 2 2v3M16 21v-3a2 2 0 0 1 2-2h3" />
                </svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M8 3H5a2 2 0 0 0-2 2v3M21 8V5a2 2 0 0 0-2-2h-3M3 16v3a2 2 0 0 0 2 2h3M16 21h3a2 2 0 0 0 2-2v-3" />
                </svg>
              )}
            </button>

            {/* Close */}
            <button
              onClick={onClose}
              className="p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
              title="Close (Esc)"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Navigation arrows */}
        {photos.length > 1 && (
          <>
            <button
              onClick={goPrev}
              className="absolute left-4 z-10 p-3 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
              title="Previous (←)"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M15 18l-6-6 6-6" />
              </svg>
            </button>
            <button
              onClick={goNext}
              className="absolute right-4 z-10 p-3 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
              title="Next (→)"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 18l6-6-6-6" />
              </svg>
            </button>
          </>
        )}

        {/* Image - using raw img for instant loading (no next/image optimization delay) */}
        <motion.div
          key={currentPhoto.src}
          className="relative z-5 max-w-[90vw] max-h-[85vh] flex items-center justify-center"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.2 }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={currentPhoto.src}
            alt={currentPhoto.alt}
            className="max-w-full max-h-[85vh] w-auto h-auto object-contain rounded-lg"
          />
        </motion.div>

        {/* Slideshow indicator */}
        {isSlideshow && (
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10">
            <div className="bg-gold/80 text-charcoal px-4 py-1.5 rounded-full text-xs font-body tracking-wider uppercase">
              ▶ Slideshow
            </div>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
