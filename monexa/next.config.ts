import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV !== "production";

/**
 * Content-Security-Policy: the browser may only load scripts, styles, images,
 * fonts and connections from this site itself. It also forbids embedding the
 * app in other sites (clickjacking) and posting forms elsewhere.
 *
 * 'unsafe-inline' is needed for scripts because Next.js and the theme switcher
 * inject small inline scripts; a nonce-based policy would be stricter but makes
 * every page dynamic. External script hosts are still blocked.
 * The dev server additionally needs eval and a websocket for hot reload, so the
 * policy is only sent in production.
 */
const contentSecurityPolicy = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  "connect-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join("; ");

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" }, // older browsers; CSP frame-ancestors covers the rest
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
  ...(isDev
    ? []
    : [
        { key: "Content-Security-Policy", value: contentSecurityPolicy },
        // Tell browsers to use HTTPS only (ignored over plain http).
        { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
      ]),
];

const nextConfig: NextConfig = {
  // Don't advertise the framework in every response.
  poweredByHeader: false,
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
