import fs from "fs";
import path from "path";
import { formatEventName } from "./shared";

export interface Photo {
  src: string;
  thumb: string;
  alt: string;
  event: string;
  filename: string;
}

const CLOUD_NAME = "dwcrdvkzz";

// Build Cloudinary URL with transforms
function cloudinaryUrl(publicId: string, width?: number): string {
  const transforms = width
    ? `f_auto,q_auto,w_${width}`
    : "f_auto,q_auto";
  return `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/${transforms}/${publicId}`;
}

// Load manifest
function loadManifest(): Record<string, string[]> {
  try {
    const manifestPath = path.join(process.cwd(), "lib", "cloudinary-manifest.json");
    const data = fs.readFileSync(manifestPath, "utf-8");
    return JSON.parse(data);
  } catch {
    return {};
  }
}

const manifest = loadManifest();

export function getEvents(): string[] {
  return Object.keys(manifest).filter((key) => manifest[key].length > 0);
}

export function getPhotosForEvent(event: string): Photo[] {
  const publicIds = manifest[event] || [];
  return publicIds.map((publicId) => {
    const filename = publicId.split("/").pop() || publicId;
    return {
      src: cloudinaryUrl(publicId, 1600),   // Full size for lightbox
      thumb: cloudinaryUrl(publicId, 600),   // Thumbnail for grid
      alt: `${formatEventName(event)} - ${filename}`,
      event,
      filename: `${filename}.webp`,
    };
  });
}

export function getAllPhotos(): Photo[] {
  const events = getEvents();
  return events.flatMap((event) => getPhotosForEvent(event));
}

export { formatEventName, EVENT_DETAILS } from "./shared";

export function getEventPhotoCount(event: string): number {
  return (manifest[event] || []).length;
}
