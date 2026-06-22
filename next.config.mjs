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
    serverComponentsExternalPackages: ['sequelize', 'sqlite3', 'openai', '@opentelemetry/api', '@supabase/supabase-js'],
  },
};

export default nextConfig;
