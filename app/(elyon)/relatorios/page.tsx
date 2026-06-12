// app/relatorios/page.tsx — Relatórios (export, portal)
'use client'

import { useEffect, useState } from 'react'
import { useAppStore } from '@/lib/store'
import { Card, Badge, Button, SectionHead, SourceBadge } from '@/components/dashboard/v2'

function LoadingState() {
  return (
    <div className="min-h-screen bg-canvas p-4 md:p-6 flex items-center justify-center">
      <div className="text-center">
        <div className="w-12 h-12 rounded-full bg-blue-soft flex items-center justify-center mx-auto mb-4 animate-pulse">
          <span className="text-blue text-2xl">📋</span>
        </div>
        <p className="text-ink-2">Carregando...</p>
      </div>
    </div>
  )
}

export default function RelatoriosPage() {
  const clientData = useAppStore(s => s.clientData)
  const savedClients = useAppStore(s => s.savedClients)
  const [mounted, setMounted] = useState(false)

  useEffect(() => { setMounted(true) }, [])

  if (!mounted) return <LoadingState />

  const activeClient = clientData?.clientName || savedClients?.[0]?.clientData?.clientName

  const exports = [
    { type: 'PDF', name: 'Resumo Executivo', last: '2025-06-10', status: 'pronto' },
    { type: 'Excel', name: 'Dados Campanhas', last: '2025-06-08', status: 'pronto' },
    { type: 'Slides', name: 'Apresentação Mensal', last: '2025-06-05', status: 'pronto' },
  ]

  const portalLink = `https://elyon.com.br/portal/${activeClient?.toLowerCase().replace(/\s+/g, '-')}`

  return (
    <div className="min-h-screen bg-canvas p-4 md:p-6">
      <header className="mb-6 animate-fade-up">
        <h1 className="text-[23px] font-bold text-ink">Relatórios</h1>
        <p className="text-sm text-ink-2 mt-1">{activeClient || 'Selecione um cliente'}</p>
      </header>

      {/* NOUS Summary */}
      <Card className="mb-6 bg-gradient-to-br from-blue-soft to-green-soft border-blue-line animate-fade-up d2">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-full bg-blue flex items-center justify-center shrink-0">
            <span className="text-white text-lg">◎</span>
          </div>
          <div>
            <div className="text-sm font-semibold text-ink mb-1">Resumo do NOUS</div>
            <p className="text-sm text-ink-2">
              Seu ROAS melhorou 14% este mês. Continue otimizando os criativos para manter o crecimiento.
            </p>
          </div>
        </div>
      </Card>

      {/* Exports */}
      <Card className="mb-6 animate-fade-up d3">
        <SectionHead title="Exportações" icon={<span>📥</span>} />
        <div className="space-y-2 mt-3">
          {exports.map((exp, i) => (
            <div key={i} className="flex items-center justify-between p-3 bg-canvas-2 rounded-sm">
              <div>
                <div className="text-sm text-ink">{exp.name}</div>
                <div className="text-xs text-ink-3">{exp.last}</div>
              </div>
              <div className="flex gap-2">
                <Badge tone="good">Pronto</Badge>
                <Button size="sm" variant="ghost">Baixar</Button>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 pt-3 border-t border-line text-center">
          <Button variant="soft">Agendar relatório</Button>
        </div>
      </Card>

      {/* Portal do Cliente */}
      <Card className="animate-fade-up d4">
        <SectionHead title="Portal do Cliente" icon={<span>🔗</span>} />
        <p className="text-sm text-ink-2 mt-3">
          Compartilhe um link seguro com seus clientes para acompanharem os resultados.
        </p>
        <div className="mt-4 p-4 bg-canvas-2 rounded-sm">
          <div className="text-xs text-ink-3 mb-1">Link compartilhável</div>
          <div className="flex gap-2">
            <code className="flex-1 text-sm text-ink bg-paper p-2 rounded-sm truncate">{portalLink}</code>
            <Button size="sm" onClick={() => navigator.clipboard.writeText(portalLink)}>Copiar</Button>
          </div>
        </div>
        <div className="mt-4">
          <div className="text-sm font-medium text-ink mb-2">Seções visíveis</div>
          <div className="flex flex-wrap gap-2">
            <Badge tone="good" dot>Resultados</Badge>
            <Badge tone="good" dot>Campanhas</Badge>
            <Badge tone="neutral">Ações</Badge>
            <Badge tone="neutral">Financeiro</Badge>
          </div>
        </div>
      </Card>
    </div>
  )
}
