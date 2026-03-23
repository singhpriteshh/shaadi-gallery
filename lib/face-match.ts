/**
 * Client-side face matching library using face-api.js
 * Loads models, extracts face descriptors from selfies,
 * and compares against pre-computed gallery descriptors.
 */

import * as faceapi from "face-api.js";

export interface FaceDescriptorEntry {
  descriptor: number[];
}

export type FaceDescriptorMap = Record<string, FaceDescriptorEntry[]>;

export interface MatchResult {
  publicId: string;
  distance: number;
  event: string;
}

let modelsLoaded = false;

/**
 * Load face-api.js models from /models/ directory.
 * Only loads once — subsequent calls are no-ops.
 */
export async function loadModels(): Promise<void> {
  if (modelsLoaded) return;

  const MODEL_URL = "/models";
  await Promise.all([
    faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL),
    faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
    faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
  ]);

  modelsLoaded = true;
}

/**
 * Extract face descriptor(s) from an image element.
 * Returns the descriptor of the largest face found (most likely the selfie subject).
 */
export async function extractDescriptor(
  input: HTMLImageElement | HTMLVideoElement | HTMLCanvasElement
): Promise<Float32Array | null> {
  const detections = await faceapi
    .detectAllFaces(input, new faceapi.SsdMobilenetv1Options({ minConfidence: 0.3 }))
    .withFaceLandmarks()
    .withFaceDescriptors();

  if (detections.length === 0) return null;

  // Return the largest face (by bounding box area)
  const largest = detections.reduce((prev, curr) => {
    const prevArea = prev.detection.box.width * prev.detection.box.height;
    const currArea = curr.detection.box.width * curr.detection.box.height;
    return currArea > prevArea ? curr : prev;
  });

  return largest.descriptor;
}

/**
 * Compare user's face descriptor against all pre-computed descriptors.
 * Returns matching photo publicIds sorted by confidence (lowest distance first).
 */
export function findMatches(
  userDescriptor: Float32Array,
  allDescriptors: FaceDescriptorMap,
  threshold: number = 0.6
): MatchResult[] {
  const matches: MatchResult[] = [];

  for (const [publicId, faces] of Object.entries(allDescriptors)) {
    if (!faces || faces.length === 0) continue;

    // Extract event name from publicId (e.g., "shaadi-gallery/tilak/DSC_0004" → "tilak")
    const parts = publicId.split("/");
    const event = parts.length >= 2 ? parts[parts.length - 2] : "unknown";

    for (const face of faces) {
      const galleryDescriptor = new Float32Array(face.descriptor);
      const distance = faceapi.euclideanDistance(userDescriptor, galleryDescriptor);

      if (distance < threshold) {
        matches.push({ publicId, distance, event });
        break; // One match per photo is enough
      }
    }
  }

  // Sort by distance (best matches first)
  matches.sort((a, b) => a.distance - b.distance);

  return matches;
}

/**
 * Fetch pre-computed face descriptors from the API.
 */
export async function fetchDescriptors(): Promise<FaceDescriptorMap> {
  const response = await fetch("/api/face-descriptors");
  if (!response.ok) throw new Error("Failed to load face descriptors");
  return response.json();
}
