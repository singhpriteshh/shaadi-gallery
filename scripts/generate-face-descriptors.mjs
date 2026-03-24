#!/usr/bin/env node

/**
 * Pre-processing script: Downloads all gallery photos from Cloudinary,
 * runs face detection using @vladmandic/human (InsightFace), and saves
 * face embeddings to lib/face-descriptors.json.
 *
 * Usage: node scripts/generate-face-descriptors.mjs
 */

import H from "@vladmandic/human";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const Human = H.Human || H.default?.Human || H;

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

const CLOUD_NAME = "dwcrdvkzz";
const CONCURRENCY = 3; // parallel downloads (reduced for stability)
const PHOTO_WIDTH = 800; // download width for face detection

function cloudinaryUrl(publicId, width) {
  return `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/f_jpg,q_auto,w_${width}/${publicId}`;
}

let human;

async function initHuman() {
  console.log("📦 Loading @vladmandic/human models (InsightFace)...");

  const config = {
    modelBasePath: "https://vladmandic.github.io/human-models/models/",
    backend: "tensorflow",
    face: {
      enabled: true,
      detector: { enabled: true, rotation: false, maxDetected: 20, minConfidence: 0.3 },
      mesh: { enabled: false },
      iris: { enabled: false },
      emotion: { enabled: false },
      description: { enabled: true },
    },
    body: { enabled: false },
    hand: { enabled: false },
    gesture: { enabled: false },
    segmentation: { enabled: false },
    object: { enabled: false },
  };

  human = new Human(config);
  await human.load();
  console.log("✅ Models loaded\n");
}

async function downloadImageBuffer(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`HTTP ${response.status} for ${url}`);
  const buffer = Buffer.from(await response.arrayBuffer());
  return buffer;
}

async function processPhoto(publicId) {
  const url = cloudinaryUrl(publicId, PHOTO_WIDTH);
  try {
    const buffer = await downloadImageBuffer(url);

    // Human can accept a raw tensor or we can use its built-in image decoding
    // For Node.js, we pass the buffer and let Human/tf decode it
    const tensor = human.tf.node.decodeImage(buffer, 3);
    const result = await human.detect(tensor);
    human.tf.dispose(tensor);

    if (!result.face || result.face.length === 0) {
      return { publicId, faces: [] };
    }

    const faces = result.face
      .filter((f) => f.embedding && f.embedding.length > 0)
      .map((f) => ({
        descriptor: Array.from(f.embedding),
      }));

    return { publicId, faces };
  } catch (err) {
    console.error(`  ❌ Error processing ${publicId}: ${err.message}`);
    return { publicId, faces: [], error: err.message };
  }
}

async function processInBatches(items, batchSize, fn) {
  const results = [];
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const batchResults = await Promise.all(batch.map(fn));
    results.push(...batchResults);
  }
  return results;
}

async function main() {
  console.log("🎭 Face Descriptor Generator for Shaadi Gallery (InsightFace)\n");
  console.log("=".repeat(50));

  // Load manifest
  const manifestPath = path.join(ROOT, "lib", "cloudinary-manifest.json");
  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf-8"));

  const events = Object.keys(manifest);
  const allPublicIds = events.flatMap((event) => manifest[event]);
  console.log(`\n📸 Found ${allPublicIds.length} photos across ${events.length} events`);
  events.forEach((e) => console.log(`   • ${e}: ${manifest[e].length} photos`));

  // Load models
  await initHuman();

  // Check for existing progress
  const outputPath = path.join(ROOT, "lib", "face-descriptors.json");
  let existing = {};
  if (fs.existsSync(outputPath)) {
    try {
      existing = JSON.parse(fs.readFileSync(outputPath, "utf-8"));
      // Check if existing descriptors use the new 512-dim format
      const firstEntry = Object.values(existing).find((faces) => faces.length > 0);
      if (firstEntry && firstEntry[0]?.descriptor?.length !== 512) {
        console.log("⚠️  Existing descriptors use old format (128-dim). Starting fresh.\n");
        existing = {};
      } else {
        const existingCount = Object.keys(existing).length;
        console.log(`📄 Found existing file with ${existingCount} entries, resuming...\n`);
      }
    } catch {
      existing = {};
    }
  }

  // Filter out already-processed photos
  const remaining = allPublicIds.filter((id) => !existing.hasOwnProperty(id));
  console.log(`🔍 Processing ${remaining.length} remaining photos (${allPublicIds.length - remaining.length} already done)\n`);

  if (remaining.length === 0) {
    console.log("✅ All photos already processed!");
    printStats(existing);
    return;
  }

  let processed = 0;
  const total = remaining.length;
  const startTime = Date.now();

  const results = await processInBatches(remaining, CONCURRENCY, async (publicId) => {
    const result = await processPhoto(publicId);
    processed++;

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    const eta = (((Date.now() - startTime) / processed) * (total - processed) / 1000).toFixed(0);
    const facesFound = result.faces.length;
    const bar = "█".repeat(Math.floor((processed / total) * 30)).padEnd(30, "░");

    process.stdout.write(
      `\r  [${bar}] ${processed}/${total} | ${elapsed}s elapsed | ~${eta}s remaining | Faces: ${facesFound}`
    );

    return result;
  });

  console.log("\n");

  // Merge results
  const descriptors = { ...existing };
  let totalFaces = 0;
  let photosWithFaces = 0;

  for (const result of results) {
    descriptors[result.publicId] = result.faces;
    if (result.faces.length > 0) {
      totalFaces += result.faces.length;
      photosWithFaces++;
    }
  }

  // Save
  fs.writeFileSync(outputPath, JSON.stringify(descriptors, null, 0));
  const fileSizeMB = (fs.statSync(outputPath).size / 1024 / 1024).toFixed(2);
  console.log(`💾 Saved to lib/face-descriptors.json (${fileSizeMB} MB)\n`);

  printStats(descriptors);
}

function printStats(descriptors) {
  const entries = Object.entries(descriptors);
  const withFaces = entries.filter(([, faces]) => faces.length > 0);
  const totalFaces = entries.reduce((sum, [, faces]) => sum + faces.length, 0);

  // Check embedding dimension
  const sampleFace = withFaces.length > 0 ? withFaces[0][1][0] : null;
  const embeddingDim = sampleFace?.descriptor?.length || "N/A";

  console.log("=".repeat(50));
  console.log("📊 Statistics:");
  console.log(`   • Total photos processed: ${entries.length}`);
  console.log(`   • Photos with faces: ${withFaces.length}`);
  console.log(`   • Photos without faces: ${entries.length - withFaces.length}`);
  console.log(`   • Total faces detected: ${totalFaces}`);
  console.log(`   • Embedding dimension: ${embeddingDim}`);
  console.log("=".repeat(50));
}

main().catch(console.error);
