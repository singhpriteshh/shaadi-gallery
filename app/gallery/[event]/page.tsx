import { notFound } from "next/navigation";
import Link from "next/link";
import {
  getPhotosForEvent,
  formatEventName,
  EVENT_DETAILS,
  getEvents,
} from "@/lib/photos";
import Navbar from "@/components/Navbar";
import GalleryClient from "./GalleryClient";
import type { Metadata } from "next";

interface PageProps {
  params: Promise<{ event: string }>;
}

export async function generateStaticParams() {
  const events = getEvents();
  return events.map((event) => ({ event }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { event } = await params;
  const name = formatEventName(event);
  return {
    title: `${name} — Priti & Rupesh Wedding Gallery`,
    description: `Browse ${name} photos from Priti & Rupesh's wedding celebration.`,
  };
}

export default async function GalleryPage({ params }: PageProps) {
  const { event } = await params;
  const validEvents = getEvents();

  if (!validEvents.includes(event)) {
    notFound();
  }

  const photos = getPhotosForEvent(event);
  const details = EVENT_DETAILS[event] || {
    emoji: "📸",
    tagline: "Beautiful moments",
    color: "#C9A96E",
  };
  const eventName = formatEventName(event);

  return (
    <>
      <Navbar />

      {/* Gallery Header */}
      <section className="pt-20 pb-6 px-4 bg-cream text-center">
        <Link
          href="/#events"
          className="inline-flex items-center gap-2 text-xs text-charcoal-light hover:text-gold transition-colors font-body tracking-wider uppercase mb-4"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          Back
        </Link>

        <p className="text-3xl mb-2">{details.emoji}</p>
        <h1 className="text-3xl sm:text-4xl font-heading text-charcoal mb-2">
          {eventName}
        </h1>
        <p className="text-charcoal-light font-body italic text-sm">
          {details.tagline}
        </p>
        <p className="mt-2 text-xs text-charcoal-light/60 font-body tracking-wider">
          {photos.length} {photos.length === 1 ? "photo" : "photos"}
        </p>
      </section>

      {/* Gallery Grid - Full width */}
      <section className="px-1 sm:px-2 pb-8 bg-warm-white">
        <GalleryClient photos={photos} />
      </section>

      {/* Event Navigation */}
      <section className="py-6 px-4 bg-cream border-t border-gold-light/20">
        <div className="flex flex-wrap justify-center gap-3">
          {validEvents.map((e) => (
            <Link
              key={e}
              href={`/gallery/${e}`}
              className={`px-4 py-1.5 rounded-full text-xs font-body tracking-wider transition-all ${
                e === event
                  ? "bg-gold text-white"
                  : "bg-white text-charcoal-light hover:bg-gold-light hover:text-charcoal border border-gold-light/30"
              }`}
            >
              {formatEventName(e)}
            </Link>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 bg-charcoal text-center">
        <Link href="/" className="font-heading text-lg text-gold hover:text-gold-light transition-colors">
          Priti <span className="text-white/40">&amp;</span> Rupesh
        </Link>
      </footer>
    </>
  );
}
