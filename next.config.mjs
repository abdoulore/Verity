/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack(config) {
    config.resolve.extensionAlias = { ...config.resolve.extensionAlias, ".js": [".ts", ".tsx", ".js"] };
    return config;
  },
  experimental: {
    outputFileTracingIncludes: {
      "/api/verity": ["./docs/pagination-api.md", "./docs/string-utils.md"],
    },
  },
};

export default nextConfig;
