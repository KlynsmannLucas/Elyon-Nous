import { withSentryConfig } from '@sentry/nextjs'

/** @type {import('next').NextConfig} */
const CSP = [
  "default-src 'self'",
  // Next.js precisa de unsafe-inline para scripts/estilos gerados em build
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com https://accounts.google.com https://*.clerk.com https://*.clerk.accounts.dev https://clerk.elyonnous.com https://accounts.elyonnous.com",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://fonts.gstatic.com",
  // Imagens: self + data URIs + qualquer HTTPS (avatares Clerk, fotos Google, etc.)
  "img-src 'self' data: blob: https:",
  "font-src 'self' data: https://fonts.gstatic.com",
  // Clerk usa web workers para refresh de token
  "worker-src 'self' blob: https://clerk.elyonnous.com",
  // Connect: apenas os serviços reais usados pelo app
  [
    "connect-src 'self'",
    "https://*.supabase.co",
    "wss://*.supabase.co",
    "https://*.clerk.com",
    "https://*.clerk.accounts.dev",
    "https://clerk.elyonnous.com",
    "https://accounts.elyonnous.com",
    "https://accounts.google.com",
    "https://oauth2.googleapis.com",
    "https://api.anthropic.com",
    "https://api.stripe.com",
    "https://*.sentry.io",
    "https://tavily.com",
    "https://*.tavily.com",
    "https://graph.facebook.com",
    "https://googleads.googleapis.com",
  ].join(' '),
  // Stripe usa iframes para o checkout seguro
  "frame-src https://js.stripe.com https://hooks.stripe.com https://*.clerk.com https://*.clerk.accounts.dev https://accounts.google.com https://clerk.elyonnous.com https://accounts.elyonnous.com",
  // Bloqueia plugins (Flash etc.) e previne injeção de base tag
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self' https://*.clerk.com https://*.clerk.accounts.dev https://clerk.elyonnous.com https://accounts.elyonnous.com",
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
  // svix (webhooks Clerk) tem barrel exports que quebram quando o plugin do Sentry
  // mexe no bundling do server — externalizar resolve em runtime (node_modules).
  experimental: { serverComponentsExternalPackages: ['svix'] },
  async headers() {
    return [{ source: '/(.*)', headers: securityHeaders }]
  },
  // Necessário para o @react-pdf/renderer (usa canvas no server)
  webpack: (config) => {
    config.resolve.alias.canvas = false
    return config
  },
}

// Sentry RE-HABILITADO (sem Session Replay — ver instrumentation-client.ts, que
// removeu o replayIntegration causador da tela preta). Source maps só sobem com
// SENTRY_AUTH_TOKEN; sem o token, o upload é pulado e o build NÃO quebra.
export default withSentryConfig(nextConfig, {
  org: 'elyon-nous',
  project: 'javascript-nextjs',
  silent: !process.env.CI,
  widenClientFileUpload: true,
  disableLogger: true,
  automaticVercelMonitors: true,
})
