import * as Sentry from '@sentry/nextjs'

// Sentry server/edge — só captura de erros + tracing leve (sem replay, que é client-only).
const DSN = process.env.NEXT_PUBLIC_SENTRY_DSN
  || 'https://4d78606659d9f6ac86d6a1b4fc39b81b@o4511298124382208.ingest.us.sentry.io/4511298129166336'

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    Sentry.init({
      dsn: DSN,
      environment: process.env.NODE_ENV,
      tracesSampleRate: 0.1,
    })
  }

  if (process.env.NEXT_RUNTIME === 'edge') {
    Sentry.init({
      dsn: DSN,
      environment: process.env.NODE_ENV,
      tracesSampleRate: 0.1,
    })
  }
}

export const onRequestError = Sentry.captureRequestError
