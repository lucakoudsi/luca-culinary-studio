/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        '@opentelemetry/api': false,
      };
    }
    return config;
  },
  experimental: {
    serverComponentsExternalPackages: ['@supabase/supabase-js', '@opentelemetry/api'],
  },
};

export default nextConfig;
