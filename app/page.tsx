import Hero from "@/components/Hero";
import Navbar from "@/components/Navbar";
import EventCard from "@/components/EventCard";
import PhotoPreview from "@/components/PhotoPreview";
import {
  getEvents,
  getEventPhotoCount,
  getPhotosForEvent,
  formatEventName,
  EVENT_DETAILS,
} from "@/lib/photos";

function OurStory() {
  return (
    <section id="story" className="py-20 sm:py-28 px-6 bg-warm-white">
      <div className="max-w-3xl mx-auto text-center">
        <p className="text-gold text-2xl mb-4">✦</p>
        <h2 className="text-3xl sm:text-4xl font-heading text-charcoal mb-8">
          Our Story
        </h2>
        <div className="space-y-6 text-charcoal-light font-body text-base sm:text-lg leading-relaxed">
          <p>
            Some love stories are written in the stars, and ours is one of them.
            What started as a simple meeting blossomed into a lifetime of
            togetherness, laughter, and endless love.
          </p>
          <p>
            On <span className="text-gold font-medium">10th February 2026</span>,
            surrounded by our dearest family and friends, Priti &amp; Rupesh
            embarked on their beautiful journey together — a celebration of love
            that will be cherished forever.
          </p>
        </div>
        <div className="mt-10 flex items-center justify-center gap-4">
          <span className="h-px w-16 bg-gold-light" />
          <span className="text-gold text-xl">❦</span>
          <span className="h-px w-16 bg-gold-light" />
        </div>
      </div>
    </section>
  );
}

export default function Home() {
  const events = getEvents();

  return (
    <>
      <Navbar darkHero />
      <Hero />

      {/* Our Story */}
      <OurStory />

      {/* Photo Preview */}
      <PhotoPreview />

      {/* Events Section */}
      <section id="events" className="py-20 sm:py-28 px-6 bg-cream">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-gold text-2xl mb-4">✦</p>
            <h2 className="text-3xl sm:text-4xl font-heading text-charcoal mb-4">
              Wedding Celebrations
            </h2>
            <p className="text-charcoal-light font-body max-w-md mx-auto">
              Browse through the precious moments captured during each
              celebration
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            {events.map((event, index) => {
              const details = EVENT_DETAILS[event] || {
                emoji: "📸",
                tagline: "Beautiful moments",
                color: "#C9A96E",
              };
              const photos = getPhotosForEvent(event);
              const coverPhoto = photos.length > 0 ? photos[0].thumb : null;
              return (
                <EventCard
                  key={event}
                  name={formatEventName(event)}
                  slug={event}
                  tagline={details.tagline}
                  photoCount={getEventPhotoCount(event)}
                  coverPhoto={coverPhoto}
                  index={index}
                />
              );
            })}
          </div>
        </div>
      </section>

      {/* Videos Section */}
      <section className="py-16 sm:py-20 px-6 bg-warm-white">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-gold text-2xl mb-3">✦</p>
          <h2 className="text-3xl sm:text-4xl font-heading text-charcoal mb-3">
            Wedding Videos
          </h2>
          <p className="text-charcoal-light font-body mb-8">
            Relive the beautiful moments captured on camera
          </p>

          <a
            href="https://drive.google.com/drive/folders/1fWlVA5MQzOODI7aoGX7R1XaJqAMeZSTk?usp=sharing"
            target="_blank"
            rel="noopener noreferrer"
            className="group inline-flex items-center gap-3 px-8 py-4 bg-charcoal text-white rounded-2xl hover:bg-charcoal/90 transition-all duration-300 shadow-lg hover:shadow-xl hover:-translate-y-0.5"
          >
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-gold">
              <polygon points="5 3 19 12 5 21 5 3" fill="currentColor" />
            </svg>
            <div className="text-left">
              <span className="block font-heading text-lg tracking-wide">Watch Videos</span>
              <span className="block text-xs text-white/50 font-body tracking-wider">Opens in Google Drive</span>
            </div>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="ml-2 text-white/40 group-hover:text-gold group-hover:translate-x-1 transition-all">
              <path d="M7 17L17 7M17 7H7M17 7v10" />
            </svg>
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 bg-charcoal text-center">
        <p className="font-heading text-2xl text-gold mb-2">
          Priti <span className="text-white/40">&amp;</span> Rupesh
        </p>
        <p className="text-white/40 text-sm font-body tracking-wider">
          10th February 2026
        </p>
        <p className="text-white/20 text-xs font-body mt-6">
          Made with ❤️ for the beautiful couple by Pritesh
        </p>
      </footer>
    </>
  );
}
