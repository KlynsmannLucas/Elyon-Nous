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
  users: 'M16 19v-1a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v1M9 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7ZM22 19v-1a4 4 0 0 0-3-3.8M16 4.2a3.5 3.5 0 0 1 0 6.6',
  calendar:'M7 3v3M17 3v3M3 8h18M5 6h14v15H5V6Z',
  megaphone:'M3 11v2l3 1 2 5h2l-1-4 8 3V5L9 9H4a1 1 0 0 0-1 1ZM18 8a3 3 0 0 1 0 8',
  download:'M12 3v12M7 11l5 5 5-5M5 21h14',
  rocket:'M5 15c-1 1-1 4-1 4s3 0 4-1m6.5-6.5a8 8 0 0 0 2-7 8 8 0 0 0-7 2C7 9 6 12 6 12l6 6s3-1 3.5-3.5ZM14 10a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z',
  link:  'M10 13a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1.5 1.5M14 11a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1.5-1.5',
  grid:  'M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z',
  chevD: 'M6 9l6 6 6-6',
  chevR: 'M9 6l6 6-6 6',
  x:     'M6 6l12 12M18 6 6 18',
  plus:  'M12 5v14M5 12h14',
  filter:'M3 5h18l-7 8v6l-4-2v-4L3 5Z',
  share: 'M4 12v8h16v-8M12 3v13M8 7l4-4 4 4',
  sparkle2: 'M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3Z',
  gem:   'M6 3h12l3 6-9 12L3 9l3-6ZM3 9h18M9 3 6 9l6 12 6-12-3-6M9.5 9 12 4l2.5 5',
  search:'M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14ZM20 20l-4-4',
  scale: 'M12 3v18M7 7 3 14h8L7 7ZM17 7l-4 7h8l-4-7ZM5 21h14',
  send:  'M4 12 21 4l-7 17-2-7-8-2Z',
  arrowUp:  'M12 19V5M5 12l7-7 7 7',
  arrowDown:'M12 5v14M19 12l-7 7-7-7',
  arrowR:   'M5 12h14M13 6l6 6-6 6',
  logout:'M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9',
  eye:   'M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12ZM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z',
  trophy:'M7 4h10v4a5 5 0 0 1-10 0V4ZM7 6H4v1a3 3 0 0 0 3 3M17 6h3v1a3 3 0 0 1-3 3M9 14h6M10 18h4M9 21h6',
  image: 'M4 4h16v16H4V4ZM4 15l4.5-4.5 4 4L16 11l4 4M9 9a1.4 1.4 0 1 1-2.8 0 1.4 1.4 0 0 1 2.8 0Z',
  spark: 'M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M18 6l-2.5 2.5M8.5 15.5 6 18',
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
