const IDENTITY_CSP = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' https://id.bhd-om.com",
  "connect-src 'self' https://id.bhd-om.com https://*.bhd-om.com https:",
  "img-src 'self' data: blob: https://id.bhd-om.com https:",
  "style-src 'self' 'unsafe-inline'",
  "font-src 'self' data:",
  "frame-src https://id.bhd-om.com",
].join("; ");

/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [{ key: "Content-Security-Policy", value: IDENTITY_CSP }],
      },
    ];
  },
};

export default nextConfig;
