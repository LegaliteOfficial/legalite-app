import type { NextConfig } from "next";
import path from "path";

// Baseline browser protections for every route. A strict script-src CSP
// with per-request nonces is a separate step: it forces dynamic rendering on
// every page and needs each page checked, so it is not switched on here.
const CSP = [
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  // Only our own pages may frame the app (the PDF preview dialogs).
  "frame-ancestors 'self'",
  // Production is HTTPS end to end; in development the API is plain
  // http://localhost and must not be rewritten.
  ...(process.env.NODE_ENV === 'production' ? ['upgrade-insecure-requests'] : []),
].join('; ');

const securityHeaders = [
  { key: 'Content-Security-Policy', value: CSP },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  // Send only our origin to other sites, never paths that carry record ids.
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=(), usb=()' },
  { key: 'Cross-Origin-Opener-Policy', value: 'same-origin-allow-popups' },
];

const nextConfig: NextConfig = {
  turbopack: {
    root: path.resolve(__dirname, '../..'),
  },
  images: {
    qualities: [75, 90],
  },
  poweredByHeader: false,
  async headers() {
    return [{ source: '/:path*', headers: securityHeaders }];
  },
};

export default nextConfig;
