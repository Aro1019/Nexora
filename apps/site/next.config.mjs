/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@nexora/types"],
  serverExternalPackages: ["@prisma/client", "@nexora/db"],
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**" },
      { protocol: "http", hostname: "localhost" },
    ],
  },
  experimental: {
    optimizePackageImports: ["lucide-react"],
  },
};

export default nextConfig;
