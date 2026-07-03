import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  const deployment = process.env.VERCEL_URL || ''
  const commit = process.env.VERCEL_GIT_COMMIT_SHA || ''
  const manual = process.env.NEXT_PUBLIC_APP_VERSION || ''
  const version = deployment || commit || manual || 'local'

  return NextResponse.json(
    {
      version,
      commit: commit ? commit.slice(0, 7) : null,
      environment: process.env.VERCEL_ENV || process.env.NODE_ENV || 'local',
      deploymentUrl: deployment ? `https://${deployment}` : null,
    },
    {
      headers: {
        'Cache-Control': 'no-store, no-cache, max-age=0, must-revalidate',
      },
    }
  )
}
