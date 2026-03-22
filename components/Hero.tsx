"use client";

import { motion } from "framer-motion";

export default function Hero() {
  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden">
      {/* Background image */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="https://res.cloudinary.com/dwcrdvkzz/image/upload/f_auto,q_auto,w_1920/shaadi-gallery/wedding/DSC_0593"
        alt="Priti & Rupesh"
        className="absolute inset-0 w-full h-full object-cover object-center"
        fetchPriority="high"
      />

      {/* Dark overlay for text readability */}
      <div className="absolute inset-0 bg-black/50" />

      {/* Top ornamental line */}
      <motion.div
        className="absolute top-0 left-0 right-0 h-1 bg-linear-to-r from-transparent via-gold to-transparent z-20"
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ duration: 1.5, ease: "easeOut" }}
      />

      <div className="relative z-10 text-center px-6 max-w-3xl">
        {/* Ornament */}
        <motion.div
          className="text-gold text-3xl mb-6"
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.3 }}
        >
          ✦
        </motion.div>

        {/* Couple names */}
        <motion.h1
          className="text-6xl sm:text-8xl md:text-9xl font-heading text-white leading-tight tracking-wide drop-shadow-lg"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.5 }}
        >
          Priti
          <motion.span
            className="block text-3xl sm:text-4xl text-gold font-body font-light italic my-4 tracking-[0.3em]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 1 }}
          >
            &amp;
          </motion.span>
          Rupesh
        </motion.h1>

        {/* Date */}
        <motion.div
          className="mt-8 flex items-center justify-center gap-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1.2 }}
        >
          <span className="h-px w-12 bg-gold-light" />
          <p className="text-white/80 tracking-[0.25em] font-body text-base uppercase">
            10th February 2026
          </p>
          <span className="h-px w-12 bg-gold-light" />
        </motion.div>

        {/* Tagline */}
        <motion.p
          className="mt-6 text-xl text-gold-light font-heading italic drop-shadow-md"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 1.5 }}
        >
          &ldquo;Two souls, one beautiful journey&rdquo;
        </motion.p>

        {/* Scroll indicator */}
        <motion.div
          className="mt-16"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 2 }}
        >
          <motion.div
            className="flex flex-col items-center gap-2 text-gold cursor-pointer"
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            onClick={() => {
              document
                .getElementById("events")
                ?.scrollIntoView({ behavior: "smooth" });
            }}
          >
            <span className="text-xs tracking-[0.2em] uppercase font-body text-white/60">
              Explore
            </span>
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <path d="M12 5v14M5 12l7 7 7-7" />
            </svg>
          </motion.div>
        </motion.div>
      </div>

      {/* Bottom gradient fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-linear-to-t from-warm-white to-transparent z-10" />
    </section>
  );
}
