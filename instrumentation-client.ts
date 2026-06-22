import * as Sentry from '@sentry/nextjs'

// IMPORTANTE: SEM replayIntegration. O Session Replay bloqueava o commit phase do
// React e causava TELA PRETA (ver memória project_sentry_black_screen). Mantemos só
// captura de erros + tracing leve. Não reintroduza replay aqui.
const DSN = process.env.NEXT_PUBLIC_SENTRY_DSN
  || 'https://4d78606659d9f6ac86d6a1b4fc39b81b@o4511298124382208.ingest.us.sentry.io/4511298129166336'

Sentry.init({
  dsn: DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1,
})

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart
