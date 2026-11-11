'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
export default function InternalSettingsLink() {
  const [allowed, setAllowed] = useState(false)
  useEffect(() => { const controller = new AbortController(); fetch('/api/admin/reportei?status=1', { signal: controller.signal, cache: 'no-store' }).then(response => { if (!controller.signal.aborted) setAllowed(response.ok) }).catch(() => {}); return () => controller.abort() }, [])
  return allowed ? <Link href="/config/integracoes" className="inline-block text-sm text-blue underline mt-4">Administração · Integrações internas</Link> : null
}
