// components/dashboard/v2/StudioTabs.tsx
// Barra de sub-abas do Estúdio de Criação — une o hub + as 5 ferramentas.
// Renderizada no topo das rotas estudio/criar/biblioteca/conteudo/abtest/cro.
'use client'

import { usePathname, useRouter } from 'next/navigation'
import { Icon } from './Icon'

const TABS: { k: string; label: string; icon: string }[] = [
  { k: 'estudio',    label: 'Estúdio',          icon: 'spark' },
  { k: 'criar',      label: 'Criar campanha',   icon: 'rocket' },
  { k: 'biblioteca', label: 'Biblioteca',       icon: 'image' },
  { k: 'conteudo',   label: 'Conteúdo',         icon: 'megaphone' },
  { k: 'abtest',     label: 'Teste A/B',        icon: 'scale' },
  { k: 'cro',        label: 'Otimização (CRO)', icon: 'target' },
]

export const STUDIO_ROUTES = TABS.map(t => t.k)

export function StudioTabs() {
  const pathname = usePathname()
  const router = useRouter()
  const active = pathname?.split('/')[1] || 'estudio'

  const Tab = ({ t }: { t: { k: string; label: string; icon: string } }) => {
    const on = active === t.k
    return (
      <button
        onClick={() => router.push(`/${t.k}`)}
        className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-pill border text-[13px] whitespace-nowrap shrink-0 transition-all
          ${on ? 'border-blue-line bg-blue-soft text-blue-600 font-semibold shadow-none' : 'border-line bg-paper text-ink-2 font-medium shadow-sm hover:border-line-strong'}`}
      >
        <Icon name={t.icon} size={15} w={on ? 2 : 1.8} />{t.label}
      </button>
    )
  }

  return (
    <div className="no-sb flex items-center gap-2 overflow-x-auto pb-1 mb-[18px]">
      <Tab t={TABS[0]} />
      <span className="w-px h-[22px] bg-line shrink-0 mx-0.5" />
      {TABS.slice(1).map(t => <Tab key={t.k} t={t} />)}
    </div>
  )
}
