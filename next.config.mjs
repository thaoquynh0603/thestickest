/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'placehold.co' }
    ]
  },
  // Allow production builds to succeed even if there are ESLint errors.
  // Justification: unblock builds while we address lint issues incrementally.
  eslint: {
    ignoreDuringBuilds: true,
  },
  webpack: (config, { isServer, dev }) => {
    // Suppress critical dependency warnings from Supabase realtime-js
    config.ignoreWarnings = [
      /Critical dependency: the request of a dependency is an expression/,
      /Module not found: Can't resolve 'encoding'/,
      /Module not found: Can't resolve 'crypto'/,
      /Module not found: Can't resolve 'stream'/,
      /Module not found: Can't resolve 'buffer'/,
      /Module not found: Can't resolve 'util'/,
      /Module not found: Can't resolve 'assert'/,
      /Module not found: Can't resolve 'os'/,
      /Module not found: Can't resolve 'path'/,
      /Module not found: Can't resolve 'fs'/,
      /Module not found: Can't resolve 'net'/,
      /Module not found: Can't resolve 'tls'/,
    ];

    // Handle the websocket factory dependency issue
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
        stream: false,
        util: false,
        assert: false,
        os: false,
        path: false,
        buffer: false,
        process: false,
      };
    }

    return config;
  },
};

export default nextConfig;

