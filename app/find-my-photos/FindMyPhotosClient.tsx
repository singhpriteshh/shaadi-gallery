"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  loadModels,
  extractDescriptor,
  findMatches,
  fetchDescriptors,
  type FaceDescriptorMap,
  type MatchResult,
} from "@/lib/face-match";
import { formatEventName, EVENT_DETAILS } from "@/lib/shared";
import MasonryGrid from "@/components/MasonryGrid";
import Lightbox from "@/components/Lightbox";
import Link from "next/link";

type Status =
  | "idle"
  | "loading-models"
  | "camera-active"
  | "scanning"
  | "results"
  | "no-results"
  | "error";

const CLOUD_NAME = "dwcrdvkzz";

function cloudinaryUrl(publicId: string, width: number): string {
  return `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/f_auto,q_auto,w_${width}/${publicId}`;
}

export default function FindMyPhotosClient() {
  const [status, setStatus] = useState<Status>("idle");
  const [statusMessage, setStatusMessage] = useState("");
  const [matches, setMatches] = useState<MatchResult[]>([]);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [selfieDataUrl, setSelfieDataUrl] = useState<string | null>(null);
  const [videoReady, setVideoReady] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Callback ref — fires the moment the <video> element is mounted in the DOM.
  // This avoids the race condition with AnimatePresence exit animations.
  const videoCallbackRef = useCallback(
    (node: HTMLVideoElement | null) => {
      videoRef.current = node;
      if (node && streamRef.current) {
        node.srcObject = streamRef.current;

        const onCanPlay = () => {
          node.play().then(() => {
            setVideoReady(true);
          }).catch(console.error);
        };

        // If metadata already loaded (unlikely but safe)
        if (node.readyState >= 2) {
          onCanPlay();
        } else {
          node.addEventListener("canplay", onCanPlay, { once: true });
        }
      }
    },
    [] // stable — streamRef is a ref, not a dependency
  );

  // Cleanup camera on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setVideoReady(false);
  }, []);

  const startCamera = useCallback(async () => {
    try {
      setStatus("loading-models");
      setStatusMessage("Loading AI models...");
      await loadModels();

      setStatusMessage("Starting camera...");
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 480 } },
      });
      streamRef.current = stream;

      // Set status — the useEffect above will attach the stream to the video element
      setStatus("camera-active");
      setStatusMessage("");
    } catch (err) {
      console.error("Camera error:", err);
      setStatus("error");
      setStatusMessage(
        "Could not access camera. Please allow camera permission or use the upload option."
      );
    }
  }, []);

  const captureSelfie = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;

    // Guard against 0-dimension video
    if (video.videoWidth === 0 || video.videoHeight === 0) {
      console.warn("Video not ready, dimensions are 0.");
      return;
    }

    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d")!;
    ctx.drawImage(video, 0, 0);

    // Save selfie preview
    setSelfieDataUrl(canvas.toDataURL("image/jpeg", 0.8));

    // Stop camera
    stopCamera();

    // Process
    await processImage(canvas);
  }, [stopCamera]);

  const handleFileUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      setStatus("loading-models");
      setStatusMessage("Loading AI models...");
      await loadModels();

      setStatusMessage("Processing your photo...");

      const img = new window.Image();
      img.onload = async () => {
        // Draw to canvas
        const canvas = canvasRef.current!;
        const MAX = 640;
        const scale = Math.min(MAX / img.width, MAX / img.height, 1);
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;
        const ctx = canvas.getContext("2d")!;
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        setSelfieDataUrl(canvas.toDataURL("image/jpeg", 0.8));
        await processImage(canvas);
      };
      img.src = URL.createObjectURL(file);
    },
    []
  );

  const processImage = async (canvas: HTMLCanvasElement) => {
    setStatus("scanning");
    setStatusMessage("Detecting your face...");

    try {
      const descriptor = await extractDescriptor(canvas);

      if (!descriptor) {
        setStatus("no-results");
        setStatusMessage(
          "Could not detect a face. Please try again with a clearer photo."
        );
        return;
      }

      setStatusMessage("Searching through all wedding photos...");

      const allDescriptors: FaceDescriptorMap = await fetchDescriptors();
      const matchResults = findMatches(descriptor, allDescriptors, 0.45);

      if (matchResults.length === 0) {
        setStatus("no-results");
        setStatusMessage(
          "No matching photos found. Try a different photo or adjust your angle."
        );
        return;
      }

      setMatches(matchResults);
      setStatus("results");
      setStatusMessage(`Found ${matchResults.length} photos of you!`);
    } catch (err) {
      console.error("Processing error:", err);
      setStatus("error");
      setStatusMessage(
        "Something went wrong. Please try again."
      );
    }
  };

  const reset = useCallback(() => {
    stopCamera();
    setStatus("idle");
    setStatusMessage("");
    setMatches([]);
    setSelfieDataUrl(null);
    setLightboxIndex(null);
  }, [stopCamera]);

  // Convert matches to Photo objects for MasonryGrid/Lightbox
  const matchedPhotos = matches.map((m) => ({
    src: cloudinaryUrl(m.publicId, 1600),
    thumb: cloudinaryUrl(m.publicId, 600),
    alt: `${formatEventName(m.event)} photo`,
    event: m.event,
    filename: `${m.publicId.split("/").pop()}.webp`,
  }));

  // Group matches by event
  const matchesByEvent = matches.reduce(
    (acc, m) => {
      acc[m.event] = (acc[m.event] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  return (
    <>
      <canvas ref={canvasRef} className="hidden" />
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="user"
        className="hidden"
        onChange={handleFileUpload}
      />

      {/* Hero/Header */}
      <section className="pt-24 pb-8 px-4 bg-cream text-center">
        <p className="text-3xl mb-2">🪞</p>
        <h1 className="text-3xl sm:text-4xl font-heading text-charcoal mb-2">
          Find My Photos
        </h1>
        <p className="text-charcoal-light font-body italic text-sm max-w-md mx-auto">
          Take a selfie or upload your photo, and our AI will find all your
          pictures from the wedding
        </p>
      </section>

      {/* Main Content */}
      <section className="px-4 py-10 bg-warm-white min-h-[60vh]">
        <div className="max-w-2xl mx-auto">
          <AnimatePresence mode="wait">
            {/* IDLE STATE */}
            {status === "idle" && (
              <motion.div
                key="idle"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="text-center space-y-6"
              >
                {/* Selfie / Camera button */}
                <div className="bg-white rounded-2xl p-8 shadow-sm border border-gold-light/20">
                  <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-linear-to-br from-gold-light to-gold flex items-center justify-center">
                    <svg
                      width="40"
                      height="40"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="white"
                      strokeWidth="1.5"
                    >
                      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                      <circle cx="12" cy="13" r="4" />
                    </svg>
                  </div>

                  <h2 className="text-xl font-heading text-charcoal mb-2">
                    Ready to find yourself?
                  </h2>
                  <p className="text-charcoal-light font-body text-sm mb-6">
                    We&apos;ll use AI to match your face with photos from the
                    celebration
                  </p>

                  <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <button
                      onClick={startCamera}
                      className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-charcoal text-white rounded-xl font-body text-sm tracking-wider hover:bg-charcoal/90 transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5"
                    >
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                        <circle cx="12" cy="13" r="4" />
                      </svg>
                      Take a Selfie
                    </button>

                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white text-charcoal border border-gold-light/40 rounded-xl font-body text-sm tracking-wider hover:bg-gold-light/10 transition-all"
                    >
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                        <polyline points="17 8 12 3 7 8" />
                        <line x1="12" y1="3" x2="12" y2="15" />
                      </svg>
                      Upload Photo
                    </button>
                  </div>
                </div>

                {/* Privacy note */}
                <p className="text-xs text-charcoal-light/50 font-body flex items-center justify-center gap-1.5">
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <rect
                      x="3"
                      y="11"
                      width="18"
                      height="11"
                      rx="2"
                      ry="2"
                    />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                  Your photo stays on your device — nothing is uploaded to any
                  server
                </p>
              </motion.div>
            )}

            {/* LOADING MODELS / CAMERA STARTING */}
            {status === "loading-models" && (
              <motion.div
                key="loading"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="text-center py-12"
              >
                <div className="w-20 h-20 mx-auto mb-6 rounded-full border-4 border-gold-light border-t-gold animate-spin" />
                <p className="text-charcoal font-heading text-lg">
                  {statusMessage}
                </p>
                <p className="text-charcoal-light/60 font-body text-xs mt-2">
                  This may take a moment on first use
                </p>
              </motion.div>
            )}

            {/* CAMERA ACTIVE */}
            {status === "camera-active" && (
              <motion.div
                key="camera"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="text-center space-y-4"
              >
                <div className="relative max-w-sm mx-auto rounded-2xl overflow-hidden shadow-lg border-2 border-gold/30 bg-charcoal">
                  {/* Scanning overlay */}
                  <div className="absolute inset-0 z-10 pointer-events-none">
                    {/* Corner markers */}
                    <div className="absolute top-4 left-4 w-8 h-8 border-t-2 border-l-2 border-gold rounded-tl-lg" />
                    <div className="absolute top-4 right-4 w-8 h-8 border-t-2 border-r-2 border-gold rounded-tr-lg" />
                    <div className="absolute bottom-4 left-4 w-8 h-8 border-b-2 border-l-2 border-gold rounded-bl-lg" />
                    <div className="absolute bottom-4 right-4 w-8 h-8 border-b-2 border-r-2 border-gold rounded-br-lg" />

                    {/* Animated scan line */}
                    <motion.div
                      className="absolute left-4 right-4 h-0.5 bg-linear-to-r from-transparent via-gold to-transparent"
                      animate={{ top: ["15%", "85%", "15%"] }}
                      transition={{
                        duration: 3,
                        repeat: Infinity,
                        ease: "easeInOut",
                      }}
                    />
                  </div>

                  {/* Loading overlay - show while video is not ready */}
                  {!videoReady && (
                    <div className="absolute inset-0 z-20 flex items-center justify-center bg-charcoal/80">
                      <div className="w-10 h-10 rounded-full border-3 border-gold-light border-t-gold animate-spin" />
                    </div>
                  )}

                  <video
                    ref={videoCallbackRef}
                    className="w-full h-auto min-h-[240px]"
                    style={{ transform: "scaleX(-1)" }}
                    playsInline
                    muted
                    autoPlay
                  />
                </div>

                <p className="text-charcoal-light font-body text-sm">
                  {videoReady ? "Position your face in the frame" : "Connecting to camera..."}
                </p>

                <div className="flex gap-3 justify-center">
                  <button
                    onClick={captureSelfie}
                    disabled={!videoReady}
                    className={`inline-flex items-center gap-2 px-8 py-3 rounded-xl font-body text-sm tracking-wider transition-all shadow-md ${
                      videoReady
                        ? "bg-gold text-white hover:bg-gold/90"
                        : "bg-gold/40 text-white/60 cursor-not-allowed"
                    }`}
                  >
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <circle cx="12" cy="12" r="10" />
                    </svg>
                    {videoReady ? "Capture" : "Loading..."}
                  </button>
                  <button
                    onClick={() => {
                      stopCamera();
                      setStatus("idle");
                    }}
                    className="px-6 py-3 bg-white text-charcoal-light border border-gold-light/30 rounded-xl font-body text-sm tracking-wider hover:bg-gold-light/10 transition-all"
                  >
                    Cancel
                  </button>
                </div>
              </motion.div>
            )}

            {/* SCANNING */}
            {status === "scanning" && (
              <motion.div
                key="scanning"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="text-center py-8 space-y-6"
              >
                {selfieDataUrl && (
                  <div className="w-32 h-32 mx-auto rounded-full overflow-hidden border-4 border-gold shadow-lg">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={selfieDataUrl}
                      alt="Your selfie"
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                <div>
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full border-4 border-gold-light border-t-gold animate-spin" />
                  <p className="text-charcoal font-heading text-lg">
                    {statusMessage}
                  </p>
                  <p className="text-charcoal-light/60 font-body text-xs mt-2">
                    Analyzing faces across all wedding events...
                  </p>
                </div>
              </motion.div>
            )}

            {/* NO RESULTS */}
            {status === "no-results" && (
              <motion.div
                key="no-results"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="text-center py-8 space-y-6"
              >
                {selfieDataUrl && (
                  <div className="w-24 h-24 mx-auto rounded-full overflow-hidden border-3 border-charcoal-light/20 opacity-60">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={selfieDataUrl}
                      alt="Your photo"
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                <div className="bg-white rounded-2xl p-8 shadow-sm border border-gold-light/20">
                  <p className="text-3xl mb-3">😔</p>
                  <h2 className="text-xl font-heading text-charcoal mb-2">
                    No matches found
                  </h2>
                  <p className="text-charcoal-light font-body text-sm mb-6">
                    {statusMessage}
                  </p>
                  <button
                    onClick={reset}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-charcoal text-white rounded-xl font-body text-sm tracking-wider hover:bg-charcoal/90 transition-all"
                  >
                    Try Again
                  </button>
                </div>
              </motion.div>
            )}

            {/* ERROR */}
            {status === "error" && (
              <motion.div
                key="error"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="text-center py-8 space-y-6"
              >
                <div className="bg-white rounded-2xl p-8 shadow-sm border border-red-200">
                  <p className="text-3xl mb-3">⚠️</p>
                  <h2 className="text-xl font-heading text-charcoal mb-2">
                    Oops!
                  </h2>
                  <p className="text-charcoal-light font-body text-sm mb-6">
                    {statusMessage}
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <button
                      onClick={reset}
                      className="inline-flex items-center gap-2 px-6 py-3 bg-charcoal text-white rounded-xl font-body text-sm tracking-wider hover:bg-charcoal/90 transition-all"
                    >
                      Try Again
                    </button>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="px-6 py-3 bg-white text-charcoal border border-gold-light/40 rounded-xl font-body text-sm tracking-wider hover:bg-gold-light/10 transition-all"
                    >
                      Upload Instead
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* RESULTS */}
            {status === "results" && (
              <motion.div
                key="results"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                {/* Results header */}
                <div className="text-center">
                  <div className="flex items-center justify-center gap-3 mb-3">
                    {selfieDataUrl && (
                      <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-gold shadow-md">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={selfieDataUrl}
                          alt="You"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <div>
                      <h2 className="text-2xl font-heading text-charcoal">
                        🎉 {matches.length} Photos Found!
                      </h2>
                    </div>
                  </div>

                  {/* Event breakdown pills */}
                  <div className="flex flex-wrap justify-center gap-2 mb-4">
                    {Object.entries(matchesByEvent).map(([event, count]) => {
                      const details = EVENT_DETAILS[event];
                      return (
                        <span
                          key={event}
                          className="px-3 py-1 rounded-full text-xs font-body bg-white border border-gold-light/30 text-charcoal"
                        >
                          {details?.emoji || "📸"} {formatEventName(event)}: {count}
                        </span>
                      );
                    })}
                  </div>

                  <button
                    onClick={reset}
                    className="text-sm text-charcoal-light hover:text-gold font-body tracking-wider transition-colors"
                  >
                    ← Search again
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>

      {/* Results Gallery — full width */}
      {status === "results" && matchedPhotos.length > 0 && (
        <section className="px-1 sm:px-2 pb-8 bg-warm-white">
          <MasonryGrid
            photos={matchedPhotos}
            onPhotoClick={(index) => setLightboxIndex(index)}
          />
        </section>
      )}

      {/* Lightbox for results */}
      {lightboxIndex !== null && matchedPhotos.length > 0 && (
        <Lightbox
          photos={matchedPhotos}
          currentIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          onNavigate={setLightboxIndex}
        />
      )}

      {/* Footer */}
      <footer className="py-8 px-6 bg-charcoal text-center">
        <Link
          href="/"
          className="font-heading text-lg text-gold hover:text-gold-light transition-colors"
        >
          Priti <span className="text-white/40">&amp;</span> Rupesh
        </Link>
      </footer>
    </>
  );
}
