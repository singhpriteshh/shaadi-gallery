"use client";

import { motion } from "framer-motion";
import { useState, useRef, useEffect } from "react";
import { Photo } from "@/lib/photos";

interface MasonryGridProps {
  photos: Photo[];
  onPhotoClick: (index: number) => void;
}

function LazyPhoto({
  photo,
  index,
  onClick,
}: {
  photo: Photo;
  index: number;
  onClick: () => void;
}) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { rootMargin: "300px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <motion.div
      ref={ref}
      className="break-inside-avoid mb-2 sm:mb-3 group cursor-pointer"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3, delay: Math.min(index * 0.015, 0.3) }}
      onClick={onClick}
    >
      <div className="relative overflow-hidden rounded-lg bg-cream-dark">
        {!isLoaded && (
          <div className="w-full aspect-3/4 animate-pulse bg-linear-to-br from-cream-dark via-gold-light/20 to-cream-dark" />
        )}

        {isInView && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={photo.thumb}
            alt={photo.alt}
            loading="lazy"
            decoding="async"
            className={`w-full h-auto object-cover transition-all duration-500 group-hover:scale-[1.03] ${
              isLoaded ? "opacity-100" : "opacity-0 absolute inset-0"
            }`}
            onLoad={() => setIsLoaded(true)}
          />
        )}

        {isLoaded && (
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />
        )}
      </div>
    </motion.div>
  );
}

export default function MasonryGrid({ photos, onPhotoClick }: MasonryGridProps) {
  if (photos.length === 0) {
    return (
      <div className="text-center py-20">
        <p className="text-4xl mb-4">📸</p>
        <p className="text-charcoal-light font-heading text-xl italic">
          Photos coming soon...
        </p>
        <p className="text-sm text-charcoal-light/60 font-body mt-2">
          Check back after the celebration!
        </p>
      </div>
    );
  }

  return (
    <div className="columns-2 sm:columns-3 lg:columns-4 xl:columns-5 gap-2 sm:gap-3">
      {photos.map((photo, index) => (
        <LazyPhoto
          key={photo.src}
          photo={photo}
          index={index}
          onClick={() => onPhotoClick(index)}
        />
      ))}
    </div>
  );
}
