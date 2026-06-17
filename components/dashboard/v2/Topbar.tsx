// components/dashboard/v2/Topbar.tsx
// Redesign v2 — Nova Topbar
'use client'

import { useEffect, useState, ReactNode } from 'react'
import { Icon } from './Icon'
import { Badge } from './Badge'
import { DropdownMenu, MenuItem, MenuLabel, MenuDivider } from './Overlay'

export interface NotifItem { id: string; tone: 'good' | 'bad' | 'warn' | 'blue'; title: string; body?: string; when?: string; area?: string; read?: boolean }

interface TopbarProps {
  title: string
  subtitle?: string
  mode: 'simplified' | 'advanced'
  onModeChange: (mode: 'simplified' | 'advanced') => void
  period: string
  showPeriod?: boolean
  onPeriodChange: (period: string) => void
  onSelectPeriod?: (p: { label: string; preset: string }) => void
  clients?: { id: string; name: string }[]
  activeClient?: string
  onClientChange?: (clientId: string) => void
  onNewClient?: () => void
  credits?: number
  onOpenCredits?: () => void
  onOpenNous?: () => void
  notifications?: NotifItem[]
  onNavigate?: (area: string) => void
  syncPlatforms?: string[]
}

const MODE_INFO: Record<'simplified' | 'advanced', { label: string; icon: string; desc: string }> = {
  simplified: { label: 'Simplificada', icon: 'eye', desc: 'Só os números e ações que importam, em linguagem direta. Ideal para o dia a dia e para apresentar a clientes.' },
  advanced: { label: 'Avançada', icon: 'grid', desc: 'Todos os indicadores, tabelas, drill-down e ferramentas de IA. Ideal para analisar e otimizar a fundo.' },
}

function ModeSwitch({ mode, onModeChange }: { mode: 'simplified' | 'advanced'; onModeChange: (m: 'simplified' | 'advanced') => void }) {
  const [help, setHelp] = useState(false)
  return (
    <div className="flex items-center gap-2">
      <div className="inline-flex bg-canvas-2 rounded-sm p-[3px] gap-0.5 border border-line">
        {(['simplified', 'advanced'] as const).map(k => {
          const active = k === mode; const m = MODE_INFO[k]
          return (
            <button key={k} onClick={() => onModeChange(k)} title={m.label}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-[13px] rounded-[6px] transition-all ${active ? 'bg-paper text-ink font-semibold shadow-sm' : 'text-ink-3 font-medium hover:text-ink'}`}>
              <Icon name={m.icon} size={15} w={active ? 2 : 1.7} />{m.label}
            </button>
          )
        })}
      </div>
      <div className="tb-md relative flex" onMouseEnter={() => setHelp(true)} onMouseLeave={() => setHelp(false)}>
        <button aria-label="O que muda entre os modos" className="w-[30px] h-[30px] rounded-full border border-line bg-paper text-ink-3 flex items-center justify-center text-[13px] font-bold hover:border-line-strong">?</button>
        {help && (
          <div className="scale-in absolute top-[calc(100%+8px)] right-0 w-[320px] bg-paper border border-line rounded-md shadow-pop p-3.5 z-[160]">
            <div className="text-[10.5px] font-mono uppercase tracking-[0.14em] text-ink-3 mb-2.5">Como ver seus dados</div>
            {(['simplified', 'advanced'] as const).map(k => {
              const m = MODE_INFO[k]; const active = k === mode
              return (
                <div key={k} className={`flex gap-2.5 py-2.5 ${k === 'advanced' ? 'border-t border-line-2' : ''}`}>
                  <span className={`w-[30px] h-[30px] rounded-lg shrink-0 flex items-center justify-center ${active ? 'bg-blue-soft text-blue-600' : 'bg-canvas-2 text-ink-2'}`}><Icon name={m.icon} size={16} /></span>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2"><span className="text-[13px] font-bold text-ink">{m.label}</span>{active && <Badge tone="blue">Atual</Badge>}</div>
                    <div className="text-xs text-ink-2 leading-snug mt-0.5">{m.desc}</div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

function LiveSync({ platforms }: { platforms?: string[] }) {
  const [open, setOpen] = useState(false)
  const list = (platforms && platforms.length ? platforms : ['Meta Ads', 'Google Ads'])
  return (
    <div className="tb-md relative" onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}>
      <div className="inline-flex items-center gap-2 pl-2.5 pr-3 py-1.5 rounded-pill bg-green-soft border border-green-line cursor-default">
        <span className="live-dot" /><span className="font-mono text-[11px] font-semibold text-green-600 tracking-wide">AO VIVO</span>
      </div>
      {open && (
        <div className="scale-in absolute top-[calc(100%+8px)] right-0 w-[232px] bg-paper border border-line rounded-md shadow-pop p-3 z-[150]">
          <div className="flex items-center gap-2 mb-2"><span className="live-dot" /><span className="text-[12.5px] font-bold text-ink">Dados sincronizados</span></div>
          {list.map((p) => (
            <div key={p} className="flex justify-between items-center py-1 text-xs"><span className="text-ink-2">{p}</span><span className="font-mono text-[10.5px] text-ink-3">conectado</span></div>
          ))}
        </div>
      )}
    </div>
  )
}

const PERIODS: { label: string; preset: string }[] = [
  { label: 'Hoje', preset: 'today' },
  { label: 'Últimos 7 dias', preset: 'last_7d' },
  { label: 'Últimos 14 dias', preset: 'last_14d' },
  { label: 'Últimos 30 dias', preset: 'last_30d' },
  { label: 'Mês atual', preset: 'this_month' },
  { label: 'Mês anterior', preset: 'last_month' },
  { label: 'Últimos 90 dias', preset: 'last_90d' },
]
const TONE_BG: Record<string, { bg: string; c: string; icon: string }> = {
  good: { bg: '#E4F6EE', c: '#0E9E6E', icon: 'check' },
  bad:  { bg: '#FCEBEA', c: '#E1483F', icon: 'alert' },
  warn: { bg: '#FCF1DC', c: '#E08B0B', icon: 'flag' },
  blue: { bg: '#EAF0FE', c: '#2C5FE0', icon: 'sparkle2' },
}

export function TopbarV2({
  title,
  subtitle,
  mode,
  onModeChange,
  period,
  showPeriod = false,
  onPeriodChange,
  onSelectPeriod,
  clients,
  activeClient,
  onClientChange,
  onNewClient,
  credits,
  onOpenCredits,
  onOpenNous,
  notifications = [],
  onNavigate,
  syncPlatforms,
}: TopbarProps) {
  const [showClientMenu, setShowClientMenu] = useState(false)
  const [notifs, setNotifs] = useState<NotifItem[]>(notifications)
  const sig = notifications.map(n => n.id).join('|')
  useEffect(() => { setNotifs(notifications) }, [sig]) // re-seed quando o layout recalcula
  const unread = notifs.filter(n => !n.read).length

  const activeClientData = clients?.find(c => c.id === activeClient)

  return (
    <header className="sticky top-0 z-40 h-16 glass border-b border-line flex items-center px-4 gap-4">
      {/* Title */}
      <div className="flex flex-col min-w-0 overflow-hidden">
        <h1 className="text-[17px] font-bold text-ink leading-tight truncate" style={{ letterSpacing: '-0.02em' }}>{title}</h1>
        {subtitle && <p className="text-xs text-ink-3 truncate">{subtitle}</p>}
      </div>

      <div className="flex-1 min-w-3" />


      {/* AO VIVO */}
      <LiveSync platforms={syncPlatforms} />

      {/* Mode Switch (ícones + ajuda) */}
      <ModeSwitch mode={mode} onModeChange={onModeChange} />

      {/* Period Selector — só onde realmente controla os dados (Diagnóstico) */}
      {showPeriod && (
      <div className="tb-md">
        <DropdownMenu align="left" minWidth={210} trigger={
          <button className="inline-flex items-center gap-1.5 px-3 py-2 bg-paper border border-line rounded-sm text-sm text-ink-2 font-medium hover:border-line-strong transition-colors">
            <Icon name="calendar" size={15} /><span>{period}</span><Icon name="chevD" size={13} />
          </button>
        }>
          <MenuLabel>Período</MenuLabel>
          {PERIODS.map(p => (
            <MenuItem key={p.preset} active={p.label === period}
              onClick={() => { onPeriodChange(p.label); onSelectPeriod?.(p) }}>{p.label}</MenuItem>
          ))}
          <MenuDivider />
          <MenuItem icon="calendar" onClick={() => window.toast?.({ tone: 'blue', title: 'Período personalizado', body: 'Seletor de datas em breve.' })}>Personalizado…</MenuItem>
        </DropdownMenu>
      </div>
      )}

      {/* Multi-Client Selector */}
      {((clients && clients.length > 0) || onNewClient) && (
        <div className="relative">
          <button
            onClick={() => setShowClientMenu(!showClientMenu)}
            className="flex items-center gap-2 px-3 py-2 bg-paper border border-line rounded-sm text-sm text-ink hover:border-blue"
          >
            <span className="w-6 h-6 rounded-full bg-blue flex items-center justify-center text-white text-xs">
              {activeClientData?.name?.charAt(0) || '+'}
            </span>
            <span>{activeClientData?.name || 'Novo cliente'}</span>
            <Icon name="chevD" size={13} className="text-ink-3" />
          </button>
          {showClientMenu && (
            <div className="absolute top-full right-0 mt-1 w-52 bg-paper border border-line rounded-sm shadow-pop z-50 overflow-hidden">
              {clients?.map(c => (
                <button
                  key={c.id}
                  onClick={() => { onClientChange?.(c.id); setShowClientMenu(false) }}
                  className={`w-full px-3 py-2 text-left text-sm hover:bg-canvas-2 ${
                    activeClient === c.id ? 'text-blue font-medium' : 'text-ink'
                  }`}
                >
                  {c.name}
                </button>
              ))}
              {onNewClient && (
                <button
                  onClick={() => { onNewClient(); setShowClientMenu(false) }}
                  className="w-full px-3 py-2 text-left text-sm text-blue font-medium hover:bg-blue-soft border-t border-line flex items-center gap-2"
                >
                  <span className="w-5 h-5 rounded-md bg-blue-soft flex items-center justify-center text-blue text-xs">+</span>
                  Novo cliente
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Credits */}
      {credits !== undefined && (
        <button
          onClick={onOpenCredits}
          className="flex items-center gap-1.5 px-3 py-2 bg-blue-soft text-blue rounded-sm text-sm font-medium hover:bg-blue-line/40"
          title="Créditos de IA"
        >
          <Icon name="gem" size={15} />
          <span className="font-mono">{credits}</span>
        </button>
      )}

      {/* NOUS Button (dark, como no prototype) */}
      <button
        onClick={onOpenNous}
        className="flex items-center gap-2 px-4 py-2 rounded-sm text-sm font-semibold text-white hover:opacity-90 transition-opacity shrink-0"
        style={{ background: '#161B26' }}
      >
        <Icon name="sparkle2" size={16} />
        <span>Perguntar ao NOUS</span>
      </button>

      {/* Notifications */}
      <DropdownMenu align="right" minWidth={340} trigger={
        <button title="Notificações" className="relative w-9 h-9 rounded-sm border border-line bg-paper text-ink-2 flex items-center justify-center hover:border-line-strong">
          <Icon name="bell" size={18} />
          {unread > 0 && (
            <span className="absolute top-1.5 right-2 min-w-[14px] h-[14px] px-1 rounded-full bg-red text-white text-[9px] font-bold font-mono flex items-center justify-center border-[1.5px] border-paper">{unread}</span>
          )}
        </button>
      }>
        <div className="flex justify-between items-center px-2.5 pt-1.5 pb-2">
          <span className="text-[13px] font-bold text-ink">Notificações</span>
          <button onClick={(e) => { e.stopPropagation(); setNotifs(s => s.map(x => ({ ...x, read: true }))) }}
            className="text-[11.5px] font-semibold text-blue-600 hover:underline">Marcar todas como lidas</button>
        </div>
        <div className="h-px bg-line mx-1 mb-1" />
        <div className="max-h-[360px] overflow-y-auto">
          {list_empty(notifs) ? (
            <div className="px-3 py-8 text-center text-ink-3 text-xs">Sem notificações.</div>
          ) : notifs.map(n => {
            const t = TONE_BG[n.tone] || TONE_BG.blue
            return (
              <button key={n.id} onClick={() => { setNotifs(s => s.map(x => x.id === n.id ? { ...x, read: true } : x)); if (n.area) onNavigate?.(n.area) }}
                className="flex gap-2.5 px-2.5 py-2.5 rounded-sm w-full text-left hover:bg-canvas-2 transition-colors">
                <span className="w-7 h-7 rounded-sm shrink-0 flex items-center justify-center" style={{ background: t.bg, color: t.c }}><Icon name={t.icon} size={15} /></span>
                <div className="flex-1 min-w-0">
                  <div className={`flex items-center gap-1.5 text-[12.5px] ${n.read ? 'font-medium' : 'font-bold'} text-ink`}>
                    {!n.read && <span className="w-1.5 h-1.5 rounded-full bg-blue shrink-0" />}<span className="truncate">{n.title}</span>
                  </div>
                  {n.body && <div className="text-[11.5px] text-ink-3 mt-0.5 truncate">{n.body}</div>}
                  {n.when && <div className="text-[10px] font-mono text-ink-4 mt-0.5">{n.when}</div>}
                </div>
              </button>
            )
          })}
        </div>
      </DropdownMenu>
    </header>
  )
}

function list_empty(arr: unknown[]) { return !arr || arr.length === 0 }
