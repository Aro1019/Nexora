/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@nexora/ui", "@nexora/types", "@nexora/api", "@nexora/storage"],
  serverExternalPackages: ["@prisma/client", "@nexora/db", "@nexora/auth", "better-auth"],
  experimental: {
    optimizePackageImports: ["lucide-react", "@nexora/ui"],
  },
};

export default nextConfig;
