"use client";

import Link from "next/link";
import { useState, useEffect } from "react";

interface NavbarProps {
  darkHero?: boolean;
}

export default function Navbar({ darkHero = false }: NavbarProps) {
  const [visible, setVisible] = useState(true);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    let lastY = window.scrollY;

    const handleScroll = () => {
      const currentY = window.scrollY;
      setScrolled(currentY > 50);

      // Hide on scroll down, show on scroll up
      if (currentY > 100) {
        setVisible(currentY < lastY);
      } else {
        setVisible(true);
      }
      lastY = currentY;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Use white text only when over dark hero AND not scrolled yet
  const useWhiteText = darkHero && !scrolled;

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        visible ? "translate-y-0" : "-translate-y-full"
      } ${
        scrolled
          ? "bg-warm-white/90 backdrop-blur-md shadow-sm"
          : "bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <Link
          href="/"
          className={`font-heading text-3xl tracking-wider transition-colors hover:text-gold ${
            useWhiteText ? "text-white" : "text-charcoal"
          }`}
        >
          P <span className="text-gold">&amp;</span> R
        </Link>

        <div className="flex items-center gap-8">
          <Link
            href="/#events"
            className={`text-sm tracking-[0.15em] uppercase hover:text-gold transition-colors font-body ${
              useWhiteText ? "text-white/80" : "text-charcoal-light"
            }`}
          >
            Events
          </Link>
          <Link
            href="/find-my-photos"
            className={`text-sm tracking-[0.15em] uppercase hover:text-gold transition-colors font-body flex items-center gap-1 ${
              useWhiteText ? "text-white/80" : "text-charcoal-light"
            }`}
          >
            Find Me <span className="text-base">✨</span>
          </Link>
          <Link
            href="/#story"
            className={`text-sm tracking-[0.15em] uppercase hover:text-gold transition-colors font-body hidden sm:block ${
              useWhiteText ? "text-white/80" : "text-charcoal-light"
            }`}
          >
            Our Story
          </Link>
        </div>
      </div>
    </nav>
  );
}
