// components/dashboard/v2/ChannelMark.tsx — marca quadrada do canal (do prototype).
'use client'

const MAP: Record<string, { bg: string; t: string }> = {
  Meta:     { bg: '#1877F2', t: 'M' },
  Google:   { bg: '#EA4335', t: 'G' },
  TikTok:   { bg: '#111111', t: 'T' },
  LinkedIn: { bg: '#0A66C2', t: 'in' },
  Outros:   { bg: '#64748B', t: '+' },
}

/** Normaliza um identificador de plataforma (meta/facebook/google/…) para o nome da marca. */
export function platformName(raw?: string): keyof typeof MAP {
  const s = String(raw || '').toLowerCase()
  if (/meta|facebook|instagram|\bfb\b/.test(s)) return 'Meta'
  if (/google|adwords|youtube/.test(s)) return 'Google'
  if (/tiktok/.test(s)) return 'TikTok'
  if (/linkedin/.test(s)) return 'LinkedIn'
  return 'Outros'
}

export function ChannelMark({ name, size = 20 }: { name: string; size?: number }) {
  const m = MAP[name] || MAP.Outros
  return (
    <span className="inline-flex items-center justify-center font-bold shrink-0 text-white"
      style={{ width: size, height: size, borderRadius: size * 0.28, background: m.bg, fontSize: size * 0.5 }}>
      {m.t}
    </span>
  )
}
