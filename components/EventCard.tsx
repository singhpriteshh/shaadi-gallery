"use client";

import Link from "next/link";

interface EventCardProps {
  name: string;
  slug: string;
  tagline: string;
  photoCount: number;
  coverPhoto: string | null;
  index: number;
}

export default function EventCard({
  name,
  slug,
  tagline,
  photoCount,
  coverPhoto,
}: EventCardProps) {
  return (
    <Link href={`/gallery/${slug}`} className="group block">
      <div className="relative overflow-hidden rounded-2xl aspect-16/10 sm:aspect-video">
        {/* Background photo */}
        {coverPhoto ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={coverPhoto}
            alt={name}
            loading="lazy"
            decoding="async"
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
        ) : (
          <div className="absolute inset-0 bg-linear-to-br from-cream-dark to-gold-light/30" />
        )}

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/30 to-black/10 group-hover:from-black/70 transition-all duration-500" />

        {/* Golden shimmer border on hover */}
        <div className="absolute inset-0 rounded-2xl border-2 border-transparent group-hover:border-gold/40 transition-all duration-500" />

        {/* Content overlay */}
        <div className="absolute inset-0 flex flex-col justify-end p-5 sm:p-6">
          <h3 className="text-3xl sm:text-4xl font-heading text-white drop-shadow-lg mb-1">
            {name}
          </h3>
          <p className="text-white/70 font-body text-sm italic mb-3">
            {tagline}
          </p>
          <div className="flex items-center justify-between">
            <span className="text-xs tracking-[0.15em] uppercase text-gold-light font-body">
              {photoCount > 0 ? `${photoCount} photos` : "Coming soon"}
            </span>
            <span className="text-sm text-white/60 group-hover:text-gold font-body tracking-wider transition-colors duration-300 flex items-center gap-1.5">
              View Album →
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
