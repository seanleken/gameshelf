import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    remotePatterns: [
      new URL('https://lh3.googleusercontent.com/**'), 
      new URL('https://media.rawg.io/**'),
      new URL('https://images.igdb.com/**')
    ]
  }
};

export default nextConfig;
