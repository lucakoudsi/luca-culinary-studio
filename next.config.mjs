/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['sequelize', 'sqlite3', 'openai', '@opentelemetry/api'],
  },
};

export default nextConfig;
