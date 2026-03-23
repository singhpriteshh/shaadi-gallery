/**
 * Shared constants and utilities that can be used in both server and client components.
 * (Extracted from lib/photos.ts which uses Node.js fs module)
 */

export const EVENT_DETAILS: Record<
  string,
  { emoji: string; tagline: string; color: string }
> = {
  tilak: {
    emoji: "🪷",
    tagline: "Blessings & sacred rituals",
    color: "#D4A0A0",
  },
  haldi: {
    emoji: "✨",
    tagline: "Drenched in turmeric & love",
    color: "#F5C563",
  },
  mehndi: {
    emoji: "🌿",
    tagline: "Adorned with henna & happiness",
    color: "#8B6F47",
  },
  wedding: {
    emoji: "💍",
    tagline: "Where two hearts became one",
    color: "#C9A96E",
  },
};

export function formatEventName(slug: string): string {
  return slug.charAt(0).toUpperCase() + slug.slice(1);
}
