// app/(elyon)/estudio/page.tsx — Estúdio de Criação (hub do grupo Criação).
// Hero escuro com prompt do NOUS + fluxo + cards das 5 ferramentas + sugestão.
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Badge, Button, Icon, NousOrb } from '@/components/dashboard/v2'

interface Tool {
  k: string; n: number; icon: string; title: string; badge?: string
  desc: string; stat: string; verb: string
  c: string; soft: string; line: string; accent: string
}

const TOOLS: Tool[] = [
  { k: 'criar', n: 1, icon: 'rocket', title: 'Criar campanha', badge: 'IA',
    desc: 'Descreva a intenção e o NOUS monta público, verba e criativo — pronto para publicar.',
    stat: '~2 min para publicar', verb: 'Criar agora',
    c: 'var(--blue-600)', soft: 'var(--blue-soft)', line: 'var(--blue-line)', accent: 'var(--blue)' },
  { k: 'biblioteca', n: 2, icon: 'image', title: 'Biblioteca',
    desc: 'Seus criativos em um só lugar, com análise visual por IA e geração de copy.',
    stat: 'Análise visual por IA', verb: 'Abrir biblioteca',
    c: 'var(--teal)', soft: 'rgba(14,156,176,.10)', line: 'rgba(14,156,176,.28)', accent: 'var(--teal)' },
  { k: 'conteudo', n: 3, icon: 'megaphone', title: 'Conteúdo',
    desc: 'Gere posts por plataforma — gancho, legenda, CTA e hashtags em segundos.',
    stat: '6 plataformas', verb: 'Gerar conteúdo',
    c: 'var(--amber)', soft: 'var(--amber-soft)', line: 'rgba(217,135,11,.28)', accent: 'var(--amber)' },
  { k: 'abtest', n: 4, icon: 'scale', title: 'Teste A/B',
    desc: 'Compare variantes de criativo e deixe os dados elegerem o vencedor.',
    stat: 'Compare variantes', verb: 'Ver testes',
    c: '#565862', soft: 'rgba(100,116,139,.10)', line: 'rgba(100,116,139,.28)', accent: '#565862' },
  { k: 'cro', n: 5, icon: 'target', title: 'Otimização (CRO)',
    desc: 'Encontre o gargalo de conversão e aja com impacto estimado no CPL.',
    stat: 'Impacto no CPL', verb: 'Otimizar',
    c: 'var(--green-600)', soft: 'var(--green-soft)', line: 'var(--green-line)', accent: 'var(--green)' },
]

const FLOW: [string, string][] = [
  ['Criar', 'rocket'], ['Guardar', 'image'], ['Produzir', 'megaphone'], ['Testar', 'scale'], ['Otimizar', 'target'],
]

const EXAMPLES = [
  'Quero gerar leads em São Paulo com R$ 150/dia',
  'Campanha de remarketing para quem abandonou o carrinho',
  'Reconhecimento de marca para o público 25-45',
]

function ToolCard({ t, onNav, i }: { t: Tool; onNav: (k: string) => void; i: number }) {
  const [h, setH] = useState(false)
  return (
    <button
      onClick={() => onNav(t.k)} onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
      className="animate-fade-up text-left flex flex-col gap-3 bg-paper rounded-lg p-[18px] transition-all"
      style={{ animationDelay: `${i * 0.05}s`, border: `1px solid ${h ? t.line : 'var(--line)'}`, boxShadow: h ? 'var(--sh-2)' : 'var(--sh-1)', transform: h ? 'translateY(-3px)' : 'none' }}
    >
      <div className="flex items-center justify-between">
        <span className="w-[42px] h-[42px] rounded-md flex items-center justify-center shrink-0" style={{ background: t.soft, color: t.c }}><Icon name={t.icon} size={20} /></span>
        <span className="font-mono text-[11px] font-semibold text-ink-4">0{t.n}</span>
      </div>
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-base font-bold text-ink" style={{ letterSpacing: '-0.02em' }}>{t.title}</span>
          {t.badge && <Badge tone="blue">{t.badge}</Badge>}
        </div>
        <p className="text-[13px] text-ink-2 leading-relaxed m-0">{t.desc}</p>
      </div>
      <div className="mt-auto pt-3 border-t border-line-2 flex items-center justify-between">
        <span className="inline-flex items-center gap-1.5 text-[11.5px] font-semibold" style={{ color: t.c }}>
          <span className="w-1.5 h-1.5 rounded-full" style={{ background: t.accent }} />{t.stat}
        </span>
        <span className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold transition-colors" style={{ color: h ? t.c : 'var(--ink-3)' }}>
          {t.verb} <Icon name="arrowR" size={14} />
        </span>
      </div>
    </button>
  )
}

export default function EstudioPage() {
  const router = useRouter()
  const [intent, setIntent] = useState('')
  const go = (preset?: string) => {
    const q = (preset ?? intent).trim()
    router.push(q ? `/criar?intent=${encodeURIComponent(q)}` : '/criar')
  }

  return (
    <div className="p-4 md:p-6 flex flex-col gap-[18px]">
      {/* Hero escuro — prompt do NOUS */}
      <div className="animate-fade-up rounded-lg overflow-hidden sheen"
        style={{ border: '1px solid var(--ink-line)', boxShadow: 'var(--sh-ink)',
          background: 'radial-gradient(130% 130% at 6% -10%, rgba(43,91,227,.32), transparent 46%), radial-gradient(120% 130% at 102% 120%, rgba(14,156,176,.18), transparent 52%), var(--ink-surface)', padding: '26px 26px 24px' }}>
        <div className="flex items-center gap-3 mb-4">
          <NousOrb size={46} />
          <div>
            <div className="font-mono text-[10.5px] uppercase tracking-[0.14em]" style={{ color: 'var(--blue-500)' }}>Estúdio de Criação · NOUS IA</div>
            <div className="text-[22px] font-bold mt-0.5" style={{ letterSpacing: '-0.025em', color: 'var(--on-ink)' }}>O que você quer criar hoje?</div>
          </div>
        </div>
        <div className="flex items-center gap-2.5 rounded-md" style={{ background: 'rgba(255,255,255,.06)', border: '1px solid var(--ink-line)', padding: '4px 4px 4px 15px' }}>
          <input
            value={intent} onChange={e => setIntent(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') go() }}
            placeholder="Descreva uma campanha, peça um criativo ou um post…"
            className="flex-1 bg-transparent border-none outline-none text-[14px]"
            style={{ color: 'var(--on-ink)' }}
          />
          <Button variant="primary" icon={<Icon name="spark" size={15} />} onClick={() => go()}>Começar</Button>
        </div>
        <div className="flex gap-2 flex-wrap mt-3">
          {EXAMPLES.map((ex, i) => (
            <button key={i} onClick={() => go(ex)} className="text-[11.5px] rounded-pill px-3 py-1.5"
              style={{ color: 'var(--on-ink-2)', background: 'rgba(255,255,255,.05)', border: '1px solid var(--ink-line)' }}>{ex}</button>
          ))}
        </div>
      </div>

      {/* Fluxo de criação */}
      <div>
        <div className="font-mono text-[10.5px] uppercase tracking-[0.14em] text-ink-3 mb-2.5">O fluxo de criação</div>
        <div className="no-sb flex items-center gap-1 overflow-x-auto py-0.5">
          {FLOW.map(([l, ic], i) => (
            <div key={l} className="flex items-center gap-1 shrink-0">
              <div className="inline-flex items-center gap-1.5 rounded-pill px-3 py-1.5 bg-canvas-2 border border-line shrink-0">
                <span className="text-ink-3 flex"><Icon name={ic} size={13} /></span>
                <span className="text-[12px] font-semibold text-ink-2">{l}</span>
              </div>
              {i < FLOW.length - 1 && <span className="text-ink-4 flex shrink-0"><Icon name="arrowR" size={14} /></span>}
            </div>
          ))}
        </div>
      </div>

      {/* Ferramentas */}
      <div className="grid gap-3.5" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(232px, 1fr))' }}>
        {TOOLS.map((t, i) => <ToolCard key={t.k} t={t} onNav={(k) => router.push(`/${k}`)} i={i} />)}
      </div>

      {/* Sugestão do NOUS */}
      <button onClick={() => router.push('/biblioteca')}
        className="text-left bg-paper rounded-md border border-line shadow-card hover-lift hover:shadow-card-hover p-[18px] cursor-pointer flex items-center gap-3.5 flex-wrap">
        <span className="w-10 h-10 rounded-md flex items-center justify-center shrink-0" style={{ background: 'var(--amber-soft)', color: 'var(--amber)' }}><Icon name="bolt" size={19} /></span>
        <div className="flex-1 min-w-[220px]">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-ink" style={{ letterSpacing: '-0.01em' }}>Sugestão do NOUS</span>
            <Badge tone="warn" dot>Ação rápida</Badge>
          </div>
          <div className="text-[13px] text-ink-2 mt-0.5 leading-relaxed">Criativos em fadiga na Biblioteca — gere variações antes que o CTR caia mais.</div>
        </div>
        <span className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-blue-600">Revisar criativos <Icon name="arrowR" size={14} /></span>
      </button>
    </div>
  )
}
