import { withSentryConfig } from '@sentry/nextjs'

/** @type {import('next').NextConfig} */
const CSP = [
  "default-src 'self'",
  // Next.js precisa de unsafe-inline para scripts/estilos gerados em build
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com https://accounts.google.com https://*.clerk.com https://*.clerk.accounts.dev",
  "style-src 'self' 'unsafe-inline'",
  // Imagens: self + data URIs + qualquer HTTPS (avatares Clerk, fotos Google, etc.)
  "img-src 'self' data: blob: https:",
  "font-src 'self' data:",
  // Connect: apenas os serviços reais usados pelo app
  [
    "connect-src 'self'",
    "https://*.supabase.co",
    "wss://*.supabase.co",
    "https://*.clerk.com",
    "https://*.clerk.accounts.dev",
    "https://clerk.elyon-nous.vercel.app",
    "https://api.anthropic.com",
    "https://api.stripe.com",
    "https://*.sentry.io",
    "https://tavily.com",
    "https://*.tavily.com",
    "https://graph.facebook.com",
    "https://googleads.googleapis.com",
  ].join(' '),
  // Stripe usa iframes para o checkout seguro
  "frame-src https://js.stripe.com https://hooks.stripe.com https://*.clerk.com https://*.clerk.accounts.dev",
  // Bloqueia plugins (Flash etc.) e previne injeção de base tag
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  // Previne clickjacking (reforça X-Frame-Options)
  "frame-ancestors 'self'",
  "upgrade-insecure-requests",
].join('; ')

const securityHeaders = [
  { key: 'X-DNS-Prefetch-Control',   value: 'on' },
  { key: 'X-Frame-Options',          value: 'SAMEORIGIN' },
  { key: 'X-Content-Type-Options',   value: 'nosniff' },
  { key: 'Referrer-Policy',          value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy',       value: 'camera=(), microphone=(), geolocation=()' },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  { key: 'Content-Security-Policy',  value: CSP },
]

const nextConfig = {
  typescript: { ignoreBuildErrors: true },
  eslint:     { ignoreDuringBuilds: true },
  async headers() {
    return [{ source: '/(.*)', headers: securityHeaders }]
  },
  // Necessário para o @react-pdf/renderer (usa canvas no server)
  webpack: (config) => {
    config.resolve.alias.canvas = false
    return config
  },
}

export default withSentryConfig(nextConfig, {
  // For all available options, see:
  // https://www.npmjs.com/package/@sentry/webpack-plugin#options

  org: "elyon-nous",

  project: "javascript-nextjs",

  // Only print logs for uploading source maps in CI
  silent: !process.env.CI,

  // For all available options, see:
  // https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/

  widenClientFileUpload: true,

  webpack: {
    // Enables automatic instrumentation of Vercel Cron Monitors. (Does not yet work with App Router route handlers.)
    // See the following for more information:
    // https://docs.sentry.io/product/crons/
    // https://vercel.com/docs/cron-jobs
    automaticVercelMonitors: true,

    // Tree-shaking options for reducing bundle size
    treeshake: {
      // Automatically tree-shake Sentry logger statements to reduce bundle size
      removeDebugLogging: true,
    },
  },
});
