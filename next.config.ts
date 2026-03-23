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
      // canvas is a Node.js-only dependency used by face-api.js pre-processing script.
      // In the browser, face-api.js uses the native Canvas API.
      canvas: { browser: "" },
    },
  },
  serverExternalPackages: ["canvas"],
};

export default nextConfig;
