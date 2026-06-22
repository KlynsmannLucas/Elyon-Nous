// components/dashboard/v2/OnboardingChecklist.tsx
// Onboarding guiado: primeiros passos até o primeiro "aha" (conta conectada +
// auditoria rodada). Detecta progresso pelo estado real do store e some sozinho
// quando completo. Não aparece para quem já está configurado.
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAppStore } from '@/lib/store'
import { Icon } from './Icon'
import { Card } from './Card'

const DISMISS_KEY = 'elyon_onboarding_dismissed_v1'

export function OnboardingChecklist() {
  const router = useRouter()
  const savedClients = useAppStore(s => s.savedClients)
  const clientData = useAppStore(s => s.clientData)
  const connectedAccounts = useAppStore(s => s.connectedAccounts)
  const auditCache = useAppStore(s => s.auditCache)

  const [dismissed, setDismissed] = useState(false)
  useEffect(() => { try { if (localStorage.getItem(DISMISS_KEY) === '1') setDismissed(true) } catch {} }, [])

  const key = clientData?.clientName || savedClients?.[0]?.clientData?.clientName || ''
  const steps = [
    { done: !!key, title: 'Criar seu primeiro cliente', desc: 'Cadastre o negócio que você vai gerenciar.', cta: 'Criar cliente', href: '/novo', icon: 'plus' },
    { done: connectedAccounts.length > 0, title: 'Conectar Meta ou Google Ads', desc: 'Conecte a conta de anúncios para análises com dados reais.', cta: 'Conectar conta', href: '/integracoes', icon: 'plug' },
    { done: !!(key && auditCache[key]?.[0]?.audit), title: 'Rodar a Análise Profunda', desc: 'O NOUS audita a conta e aponta gargalos, desperdício e o que fazer.', cta: 'Rodar análise', href: '/diagnostico', icon: 'search' },
  ]
  const doneCount = steps.filter(s => s.done).length
  const allDone = doneCount === steps.length
  const nextIdx = steps.findIndex(s => !s.done)

  if (allDone || dismissed) return null

  const dismiss = () => { try { localStorage.setItem(DISMISS_KEY, '1') } catch {}; setDismissed(true) }

  return (
    <section className="mb-4 animate-fade-up">
      <Card className="bg-gradient-to-br from-blue-soft to-paper border-blue-line">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-start gap-3">
            <span className="w-10 h-10 rounded-lg bg-blue flex items-center justify-center text-white shrink-0"><Icon name="rocket" size={20} /></span>
            <div>
              <div className="text-[15px] font-bold text-ink" style={{ letterSpacing: '-0.01em' }}>Comece por aqui</div>
              <p className="text-[12.5px] text-ink-2 mt-0.5">3 passos até o NOUS trabalhar com os dados reais da sua conta.</p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-[11px] font-mono text-ink-3">{doneCount}/{steps.length}</span>
            <button onClick={dismiss} aria-label="Dispensar" className="text-ink-3 hover:text-ink p-1"><Icon name="x" size={15} /></button>
          </div>
        </div>

        <div className="h-1.5 rounded-full bg-canvas-2 overflow-hidden mb-3">
          <div className="h-full bg-blue transition-all" style={{ width: `${(doneCount / steps.length) * 100}%` }} />
        </div>

        <div className="divide-y divide-line-2">
          {steps.map((s, i) => {
            const isNext = i === nextIdx
            return (
              <div key={i} className="flex items-center gap-3 py-2.5">
                <span className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-[11px] font-bold ${s.done ? 'bg-green text-white' : isNext ? 'bg-blue text-white' : 'bg-canvas-2 text-ink-3 border border-line'}`}>
                  {s.done ? <Icon name="check" size={13} w={3} /> : i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <div className={`text-sm font-medium ${s.done ? 'text-ink-3 line-through' : 'text-ink'}`}>{s.title}</div>
                  {!s.done && <div className="text-[12px] text-ink-3 mt-0.5">{s.desc}</div>}
                </div>
                {!s.done && (
                  <button onClick={() => router.push(s.href)}
                    className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-[12.5px] font-semibold shrink-0 transition-colors ${isNext ? 'bg-blue text-white hover:bg-blue-600' : 'bg-paper border border-line text-ink hover:border-blue-line'}`}>
                    {s.cta} <Icon name="arrowR" size={13} />
                  </button>
                )}
              </div>
            )
          })}
        </div>
      </Card>
    </section>
  )
}
