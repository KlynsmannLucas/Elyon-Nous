'use client'
import { useEffect, useState } from 'react'
import { useAppStore } from '@/lib/store'

export type StudioAsset = {
  id: string
  name: string
  kind: string
  format?: string
  width: number
  height: number
  url: string
  createdAt: string
  jobId?: string
  metadata?: any
}
export async function studioFetch(url: string, init?: RequestInit) {
  const response = await fetch(url, { cache: 'no-store', ...init })
  const data = await response
    .json()
    .catch(() => ({
      error: 'Não foi possível ler a resposta. Consulte o histórico antes de tentar novamente.',
    }))
  if (!response.ok) throw new Error(data.error || 'Não foi possível concluir.')
  return data
}
export function useStudioClient() {
  const active = useAppStore((s) => s.clientData),
    saved = useAppStore((s) => s.savedClients)
  const name = active?.clientName || saved[0]?.clientData.clientName || ''
  const [state, setState] = useState<{ name: string; client: any; loading: boolean; error: string }>({
    name: '',
    client: null,
    loading: true,
    error: '',
  })
  useEffect(() => {
    const controller = new AbortController()
    setState({ name, client: null, loading: true, error: '' })
    studioFetch('/api/clients', { signal: controller.signal })
      .then((data) => {
        if (controller.signal.aborted) return
        const rows = (data.clients || []).filter((row: any) => row.clientData?.clientName === name)
        setState({
          name,
          client: rows.length === 1 ? rows[0] : null,
          loading: false,
          error:
            rows.length > 1
              ? 'Há clientes com o mesmo nome. Renomeie para identificar o cliente correto.'
              : '',
        })
      })
      .catch((error) => {
        if (!controller.signal.aborted) setState({ name, client: null, loading: false, error: error.message })
      })
    return () => controller.abort()
  }, [name])
  return state.name === name ? state : { name, client: null, loading: true, error: '' }
}
export async function prepareReference(file: File): Promise<File> {
  if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type))
    throw new Error('Use imagens JPG, PNG ou WebP.')
  if (file.size <= 3 * 1024 * 1024) return file
  if (file.size > 20 * 1024 * 1024) throw new Error('A foto pode ter até 20 MB antes da otimização.')
  const bitmap = await createImageBitmap(file)
  try {
    const ratio = Math.min(1, 2048 / Math.max(bitmap.width, bitmap.height)),
      canvas = document.createElement('canvas')
    canvas.width = Math.round(bitmap.width * ratio)
    canvas.height = Math.round(bitmap.height * ratio)
    const context = canvas.getContext('2d')
    if (!context) throw new Error('Não foi possível preparar esta foto.')
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
    const blob = await new Promise<Blob>((resolve, reject) =>
      canvas.toBlob(
        (value) => (value ? resolve(value) : reject(new Error('Não foi possível preparar esta foto.'))),
        'image/webp',
        0.88,
      ),
    )
    if (blob.size > 3 * 1024 * 1024) throw new Error('Reduza esta foto para até 3 MB.')
    return new File([blob], file.name.replace(/\.[^.]+$/, '.webp'), { type: 'image/webp' })
  } finally {
    bitmap.close()
  }
}
export function StudioEmpty({ loading, error }: { loading: boolean; error?: string }) {
  return (
    <div className="rounded-xl border border-line bg-paper p-8 text-center">
      <h2 className="text-lg font-semibold text-ink">
        {loading ? 'Carregando o cliente…' : 'Escolha um cliente para criar'}
      </h2>
      <p className="text-sm text-ink-2 mt-2">
        {error ||
          'Selecione e salve o cliente no menu superior. O briefing, as referências e as criações ficarão organizados para ele.'}
      </p>
    </div>
  )
}
export const fieldClass =
  'w-full rounded-lg border border-line bg-paper px-3 py-2.5 text-sm text-ink outline-none focus:border-blue focus:ring-2 focus:ring-blue/10'
