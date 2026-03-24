/**
 * Client-side face matching library using @vladmandic/human (InsightFace)
 * Uses dynamic import to prevent Next.js from bundling the Node.js build during SSR.
 */

export interface FaceDescriptorEntry {
  descriptor: number[];
}

export type FaceDescriptorMap = Record<string, FaceDescriptorEntry[]>;

export interface MatchResult {
  publicId: string;
  distance: number;
  event: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let humanInstance: any = null;

/**
 * Load Human models. Only loads once — subsequent calls are no-ops.
 * Uses dynamic import to avoid SSR bundling issues.
 */
export async function loadModels(): Promise<void> {
  if (humanInstance) return;

  // Dynamic import avoids Next.js SSR trying to resolve the Node.js build
  const { Human } = await import("@vladmandic/human");

  const config = {
    modelBasePath: "https://vladmandic.github.io/human-models/models/",
    backend: "webgl" as const,
    face: {
      enabled: true,
      detector: { enabled: true, rotation: false },
      mesh: { enabled: false },
      iris: { enabled: false },
      emotion: { enabled: false },
      description: { enabled: true }, // This produces face embeddings
    },
    body: { enabled: false },
    hand: { enabled: false },
    gesture: { enabled: false },
    segmentation: { enabled: false },
    object: { enabled: false },
  };

  humanInstance = new Human(config);
  await humanInstance.load();
  await humanInstance.warmup();
}

/**
 * Extract face embedding(s) from an image element.
 * Returns the embedding of the largest face found (most likely the selfie subject).
 */
export async function extractDescriptor(
  input: HTMLImageElement | HTMLVideoElement | HTMLCanvasElement
): Promise<Float32Array | null> {
  if (!humanInstance) throw new Error("Models not loaded. Call loadModels() first.");

  const result = await humanInstance.detect(input);

  if (!result.face || result.face.length === 0) return null;

  // Return the largest face (by bounding box area)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const largest = result.face.reduce((prev: any, curr: any) => {
    const prevArea = (prev.box?.[2] ?? 0) * (prev.box?.[3] ?? 0);
    const currArea = (curr.box?.[2] ?? 0) * (curr.box?.[3] ?? 0);
    return currArea > prevArea ? curr : prev;
  });

  if (!largest.embedding || largest.embedding.length === 0) return null;

  return new Float32Array(largest.embedding);
}

/**
 * Compute cosine similarity between two vectors.
 */
function cosineSimilarity(a: Float32Array, b: Float32Array): number {
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * Compare user's face embedding against all pre-computed descriptors.
 * Returns matching photo publicIds sorted by confidence (highest similarity first).
 */
export function findMatches(
  userDescriptor: Float32Array,
  allDescriptors: FaceDescriptorMap,
  threshold: number = 0.45
): MatchResult[] {
  const matches: MatchResult[] = [];

  for (const [publicId, faces] of Object.entries(allDescriptors)) {
    if (!faces || faces.length === 0) continue;

    // Extract event name from publicId (e.g., "shaadi-gallery/tilak/DSC_0004" → "tilak")
    const parts = publicId.split("/");
    const event = parts.length >= 2 ? parts[parts.length - 2] : "unknown";

    for (const face of faces) {
      const galleryDescriptor = new Float32Array(face.descriptor);
      const similarity = cosineSimilarity(userDescriptor, galleryDescriptor);

      if (similarity > threshold) {
        // Store as distance (1 - similarity) so lower = better match
        matches.push({ publicId, distance: 1 - similarity, event });
        break; // One match per photo is enough
      }
    }
  }

  // Sort by distance (best matches first — lowest distance)
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
