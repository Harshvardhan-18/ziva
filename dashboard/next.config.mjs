/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['lucide-react'],
  // output: 'standalone' is disabled — causes /_error static page conflicts
  // with App Router <html> layout. Use 'next start' in production (Dockerfile updated).
};

export default nextConfig;
