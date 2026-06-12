'use client'

type Source = 'meta' | 'google' | 'instagram' | 'tiktok' | 'linkedin' | 'youtube' | 'gmail' | 'chatgpt' | 'perplexity' | 'claude' | ' Nous' | 'internal'

interface SourceBadgeProps {
  source: Source
  className?: string
}

const sourceLabels: Record<Source, string> = {
  meta: 'Meta Ads',
  google: 'Google Ads',
  instagram: 'Instagram',
  tiktok: 'TikTok',
  linkedin: 'LinkedIn',
  youtube: 'YouTube',
  gmail: 'Gmail',
  chatgpt: 'ChatGPT',
  perplexity: 'Perplexity',
  claude: 'Claude',
  Nous: 'Nous AI',
  internal: 'Elyon',
}

const sourceColors: Record<Source, string> = {
  meta: 'bg-blue-soft text-blue',
  google: 'bg-green-soft text-green-600',
  instagram: 'bg-pink-100 text-pink-700',
  tiktok: 'bg-black/10 text-black',
  linkedin: 'bg-blue-100 text-blue-700',
  youtube: 'bg-red-100 text-red-700',
  gmail: 'bg-red-soft text-red',
  chatgpt: 'bg-green-soft text-green-600',
  perplexity: 'bg-blue-soft text-blue',
  claude: 'bg-amber-soft text-amber-600',
  Nous: 'bg-purple-100 text-purple-700',
  internal: 'bg-line-2 text-ink-2',
}

export function SourceBadge({ source, className = '' }: SourceBadgeProps) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${sourceColors[source]} ${className}`}
    >
      {sourceLabels[source]}
    </span>
  )
}
