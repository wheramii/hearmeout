import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Spotify's OAuth redirect_uri only allows http:// on the 127.0.0.1
  // loopback address (not localhost) since April 2025, so local dev is
  // driven from that origin — the dev server needs to trust it too.
  allowedDevOrigins: ["127.0.0.1"],
};

export default nextConfig;
