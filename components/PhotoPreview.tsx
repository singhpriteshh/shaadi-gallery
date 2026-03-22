import { getPhotosForEvent, getEvents } from "@/lib/photos";

export default function PhotoPreview() {
  const events = getEvents();

  // Grab photos from each event
  const previewPhotos = events.flatMap((event) =>
    getPhotosForEvent(event).slice(0, 8)
  );

  if (previewPhotos.length === 0) return null;

  const displayPhotos = previewPhotos.slice(0, 15);

  return (
    <section className="py-12 sm:py-16 px-1 sm:px-2 bg-warm-white">
      <div className="text-center mb-8">
        <p className="text-gold text-2xl mb-3">✦</p>
        <h2 className="text-3xl sm:text-4xl font-heading text-charcoal mb-3">
          Glimpses
        </h2>
        <p className="text-charcoal-light font-body text-sm">
          A sneak peek into our celebrations
        </p>
      </div>

      <div className="columns-3 sm:columns-4 lg:columns-5 gap-1.5 sm:gap-2">
        {displayPhotos.map((photo) => (
          <div
            key={photo.src}
            className="break-inside-avoid mb-1.5 sm:mb-2 overflow-hidden rounded-md"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={photo.thumb}
              alt={photo.alt}
              loading="lazy"
              decoding="async"
              className="w-full h-auto object-cover hover:scale-105 transition-transform duration-500"
            />
          </div>
        ))}
      </div>
    </section>
  );
}
