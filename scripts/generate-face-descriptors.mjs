#!/usr/bin/env node

/**
 * Pre-processing script: Downloads all gallery photos from Cloudinary,
 * runs face detection, and saves face descriptors to lib/face-descriptors.json.
 *
 * Usage: node scripts/generate-face-descriptors.mjs
 */

import * as faceapi from "face-api.js";
import canvas from "canvas";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

// Monkey-patch face-api.js to use node-canvas
const { Canvas, Image, ImageData } = canvas;
faceapi.env.monkeyPatch({ Canvas, Image, ImageData });

const CLOUD_NAME = "dwcrdvkzz";
const CONCURRENCY = 5; // parallel downloads
const PHOTO_WIDTH = 800; // download width for face detection

function cloudinaryUrl(publicId, width) {
  return `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/f_jpg,q_auto,w_${width}/${publicId}`;
}

async function loadModels() {
  const modelsPath = path.join(ROOT, "public", "models");
  console.log("📦 Loading face-api.js models (SSD MobileNet v1 + full landmarks)...");
  await faceapi.nets.ssdMobilenetv1.loadFromDisk(modelsPath);
  await faceapi.nets.faceLandmark68Net.loadFromDisk(modelsPath);
  await faceapi.nets.faceRecognitionNet.loadFromDisk(modelsPath);
  console.log("✅ Models loaded\n");
}

async function downloadImage(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`HTTP ${response.status} for ${url}`);
  const buffer = Buffer.from(await response.arrayBuffer());
  const img = await canvas.loadImage(buffer);
  return img;
}

async function processPhoto(publicId) {
  const url = cloudinaryUrl(publicId, PHOTO_WIDTH);
  try {
    const img = await downloadImage(url);

    // Create a canvas with the image
    const cvs = canvas.createCanvas(img.width, img.height);
    const ctx = cvs.getContext("2d");
    ctx.drawImage(img, 0, 0);

    // Detect all faces with landmarks and descriptors
    const detections = await faceapi
      .detectAllFaces(cvs, new faceapi.SsdMobilenetv1Options({ minConfidence: 0.3 }))
      .withFaceLandmarks() // use full 68-point model
      .withFaceDescriptors();

    if (detections.length === 0) {
      return { publicId, faces: [] };
    }

    const faces = detections.map((d) => ({
      descriptor: Array.from(d.descriptor),
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
  console.log("🎭 Face Descriptor Generator for Shaadi Gallery\n");
  console.log("=".repeat(50));

  // Load manifest
  const manifestPath = path.join(ROOT, "lib", "cloudinary-manifest.json");
  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf-8"));

  const events = Object.keys(manifest);
  const allPublicIds = events.flatMap((event) => manifest[event]);
  console.log(`\n📸 Found ${allPublicIds.length} photos across ${events.length} events`);
  events.forEach((e) => console.log(`   • ${e}: ${manifest[e].length} photos`));

  // Load models
  await loadModels();

  // Check for existing progress
  const outputPath = path.join(ROOT, "lib", "face-descriptors.json");
  let existing = {};
  if (fs.existsSync(outputPath)) {
    existing = JSON.parse(fs.readFileSync(outputPath, "utf-8"));
    const existingCount = Object.keys(existing).length;
    console.log(`📄 Found existing file with ${existingCount} entries, resuming...\n`);
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

  console.log("=".repeat(50));
  console.log("📊 Statistics:");
  console.log(`   • Total photos processed: ${entries.length}`);
  console.log(`   • Photos with faces: ${withFaces.length}`);
  console.log(`   • Photos without faces: ${entries.length - withFaces.length}`);
  console.log(`   • Total faces detected: ${totalFaces}`);
  console.log("=".repeat(50));
}

main().catch(console.error);
