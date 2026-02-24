import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  trailingSlash: true,
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "placehold.co",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "apis.srmarnik.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "http",
        hostname: "apis.srmarnik.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "http",
        hostname: "192.168.29.22",
        port: "9001",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "192.168.29.22",
        port: "9001",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "apis.srmarnik.com",
        port: "5001",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "demoapi.99clinix.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "demo.99clinix.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "apis.99clinix.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "apis.99aitech.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "http",
        hostname: "localhost",
        port: "5002",
        pathname: "/**",
      },
    ],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Content-Security-Policy",
            // NOTE: Adjust 'unsafe-inline' and 'unsafe-eval' as needed for TinyMCE, Tiptap, and other rich editors
            // For production, tighten this policy by removing unsafe-* directives and using nonces/hashes
            // value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.tiny.cloud; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com data:; img-src 'self' data: https: http:; connect-src 'self' https://apis.srmarnik.com http://apis.srmarnik.com http://192.168.29.22:9001 https://192.168.29.22:9001 https://apis.srmarnik.com:5001; object-src 'none'; frame-ancestors 'none'; base-uri 'self'; form-action 'self',localhost;"
            value:
              "default-src 'self' https://translate.googleapis.com https://translate.google.com; " +
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.tiny.cloud https://translate.google.com https://translate.googleapis.com https://translate-pa.googleapis.com https://www.gstatic.com; " +
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://translate.googleapis.com https://www.gstatic.com; " +
              "font-src 'self' https://fonts.gstatic.com data:; " +
              "img-src 'self' data: https: http: https://www.google.com https://www.gstatic.com; " +
              "connect-src 'self' https://apis.srmarnik.com http://apis.srmarnik.com wss://apis.srmarnik.com http://192.168.29.22:9001 https://192.168.29.22:9001 https://apis.srmarnik.com:5001 https://demoapi.99clinix.com https://demo.99clinix.com https://apis.99clinix.com https://apis.99aitech.com http://localhost:3000 http://localhost:3001 http://localhost:5001 http://localhost:5002 https://localhost:3000 https://localhost:3001 https://localhost:5001 https://localhost:5002 ws://localhost:3000 ws://localhost:3001 wss://localhost:3000 wss://localhost:3001 ws://localhost:5002 wss://localhost:5002 https://translate.googleapis.com https://translate.google.com https://translate-pa.googleapis.com https://*.agora.io:* https://*.agoraio.cn:* https://*.sd-rtn.com:* wss://*.agora.io:* wss://*.agoraio.cn:* wss://*.sd-rtn.com:*; " +
              "frame-src 'self' https://translate.google.com https://translate.googleapis.com https://www.google.com; " +
              "object-src 'none'; " +
              "frame-ancestors 'none'; " +
              "base-uri 'self'; " +
              "form-action 'self';",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "X-XSS-Protection",
            value: "1; mode=block",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(self), microphone=(self), geolocation=()",
          },
        ],
      },
    ];
  },
  // async rewrites() {
  //   return [
  //     {
  //       source: "/api/upload/public",
  //       destination: "http://localhost:5002/api/upload/public",
  //     },
  //     {
  //       source: "/api/prescriptions/share",
  //       destination: "http://localhost:5002/api/prescriptions/share",
  //     },
  //     // Fallback for other API routes if needed, or specific ones
  //     {
  //       source: "/api/:path*",
  //       destination: "http://localhost:5002/api/:path*",
  //     },
  //     {
  //       source: "/uploads/:path*",
  //       destination: "http://localhost:5002/uploads/:path*",
  //     },
  //   ];
  // },
};

export default nextConfig;
