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
  serverExternalPackages: ['@supabase/supabase-js', 'sequelize', 'sqlite3', 'openai', '@opentelemetry/api'],
};

export default nextConfig;
