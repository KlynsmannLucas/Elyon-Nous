'use client'

import { useEffect, useRef, useState } from 'react'
import { Icon } from './Icon'

type VersionPayload = {
  version?: string
  commit?: string | null
  environment?: string
}

const STORAGE_KEY = 'elyon:last_seen_version'
const CHECK_EVERY_MS = 60_000

export function VersionSync() {
  const [available, setAvailable] = useState<VersionPayload | null>(null)
  const checking = useRef(false)

  useEffect(() => {
    let timer: number | undefined
    let active = true

    const checkVersion = async () => {
      if (checking.current) return
      checking.current = true
      try {
        const res = await fetch('/api/version', { cache: 'no-store' })
        if (!res.ok) return
        const data: VersionPayload = await res.json()
        const current = String(data.version || '')
        if (!current) return

        const seen = window.localStorage.getItem(STORAGE_KEY)
        if (!seen) {
          window.localStorage.setItem(STORAGE_KEY, current)
          return
        }
        if (seen !== current && active) setAvailable(data)
      } catch {
        // Verificador silencioso: falha de rede não deve atrapalhar o painel.
      } finally {
        checking.current = false
      }
    }

    const checkWhenVisible = () => {
      if (document.visibilityState === 'visible') checkVersion()
    }

    checkVersion()
    timer = window.setInterval(checkVersion, CHECK_EVERY_MS)
    window.addEventListener('focus', checkVersion)
    document.addEventListener('visibilitychange', checkWhenVisible)

    return () => {
      active = false
      if (timer) window.clearInterval(timer)
      window.removeEventListener('focus', checkVersion)
      document.removeEventListener('visibilitychange', checkWhenVisible)
    }
  }, [])

  if (!available) return null

  const reload = () => {
    if (available.version) window.localStorage.setItem(STORAGE_KEY, String(available.version))
    window.location.reload()
  }

  return (
    <div className="fixed left-3 right-3 bottom-4 md:left-1/2 md:right-auto md:w-[430px] md:-translate-x-1/2 z-[230] rounded-lg bg-ink text-white border border-white/10 shadow-pop overflow-hidden animate-fade-up">
      <div className="absolute inset-x-0 top-0 h-0.5 bg-blue" />
      <div className="flex items-center gap-3 p-3.5">
        <div className="w-9 h-9 rounded-md bg-blue/20 border border-blue/30 flex items-center justify-center shrink-0">
          <Icon name="bolt" size={17} className="text-blue-100" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-[13px] font-semibold leading-tight">Nova versão disponível</div>
          <div className="text-[11.5px] text-white/65 mt-0.5 leading-snug">
            Atualize para ver as últimas mudanças da plataforma{available.commit ? ` · ${available.commit}` : ''}.
          </div>
        </div>
        <button
          onClick={reload}
          className="shrink-0 rounded-sm bg-white text-ink px-3 py-1.5 text-[12px] font-semibold hover:bg-blue-soft transition-colors"
        >
          Atualizar
        </button>
      </div>
    </div>
  )
}
