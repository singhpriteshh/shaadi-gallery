import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    formats: ["image/webp", "image/avif"],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
        pathname: "/dwcrdvkzz/**",
      },
    ],
  },
  turbopack: {
    resolveAlias: {
      // Force @vladmandic/human to use the browser ESM build even during SSR.
      // The Node.js build requires @tensorflow/tfjs-node which is not available.
      // This library is only used client-side ("use client" component).
      "@vladmandic/human": "@vladmandic/human/dist/human.esm.js",
    },
  },
  serverExternalPackages: ["@vladmandic/human"],
};

export default nextConfig;
