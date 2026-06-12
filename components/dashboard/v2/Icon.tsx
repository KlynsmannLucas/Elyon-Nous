// components/dashboard/v2/Icon.tsx — ícones SVG stroke (editorial), do protótipo.
'use client'

import React from 'react'

export const ICONS: Record<string, string> = {
  home:  'M3 10.5 12 3l9 7.5M5 9.5V21h14V9.5',
  chart: 'M4 20V4M4 20h16M8 16v-5M13 16V8M18 16v-9',
  pulse: 'M3 12h4l2.5 7 4-15 2.5 8H21',
  globe: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18ZM3 12h18M12 3c2.5 2.5 3.5 6 3.5 9S14.5 18.5 12 21c-2.5-2.5-3.5-6-3.5-9S9.5 5.5 12 3Z',
  check: 'M4 12.5 9 17.5 20 6',
  clipboard: 'M9 3h6v3H9zM7 5H5v16h14V5h-2M9 11h6M9 15h6',
  doc:   'M7 3h7l5 5v13H7V3ZM14 3v5h5M10 13h6M10 17h6',
  plug:  'M9 3v5M15 3v5M7 8h10v3a5 5 0 0 1-10 0V8ZM12 16v5',
  gear:  'M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6ZM19 12a7 7 0 0 0-.1-1l2-1.5-2-3.5-2.4 1a7 7 0 0 0-1.7-1l-.4-2.5h-4l-.4 2.5a7 7 0 0 0-1.7 1l-2.4-1-2 3.5 2 1.5a7 7 0 0 0 0 2l-2 1.5 2 3.5 2.4-1a7 7 0 0 0 1.7 1l.4 2.5h4l.4-2.5a7 7 0 0 0 1.7-1l2.4 1 2-3.5-2-1.5a7 7 0 0 0 .1-1Z',
  target:'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18ZM12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM12 13a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z',
  bolt:  'M13 2 4 14h7l-1 8 9-12h-7l1-8Z',
  bell:  'M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 0 1-3.4 0',
  alert: 'M12 3 2 20h20L12 3ZM12 10v5M12 18h0',
  funnel:'M3 4h18l-7 8v7l-4 2v-9L3 4Z',
  layers:'M12 3 3 8l9 5 9-5-9-5ZM3 13l9 5 9-5M3 18l9 5 9-5',
  money: 'M12 2v20M16 6.5C16 4.6 14.2 4 12 4S8 4.6 8 6.5 9.8 9 12 9.5 16 11.1 16 13s-1.8 2.5-4 2.5-4-.6-4-2.5',
  flag:  'M5 21V4M5 4h11l-1.5 3.5L16 11H5',
}

export function Icon({ name, size = 18, w = 1.8, className }: { name: string; size?: number; w?: number; className?: string }) {
  const d = ICONS[name] || ICONS.home
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" className={className}>
      {d.split('M').filter(Boolean).map((seg, i) => <path key={i} d={'M' + seg} />)}
    </svg>
  )
}
