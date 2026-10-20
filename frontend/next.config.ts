import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Self-contained server bundle (.next/standalone) for the Docker image only; the Dockerfile
  // sets NEXT_STANDALONE. Locally, `npm start` (next start) needs the regular output.
  output: process.env.NEXT_STANDALONE === "true" ? "standalone" : undefined,
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    // This app lives in /frontend of a monorepo; pin the root so Turbopack doesn't pick up
    // lockfiles from parent folders (npm scripts always run from /frontend).
    root: path.resolve(),
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
