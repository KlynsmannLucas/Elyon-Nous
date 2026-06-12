// app/config/page.tsx — Configurações
'use client'

import { useEffect, useState } from 'react'
import { useAppStore } from '@/lib/store'
import { Icon, Card, Badge, Button, SectionHead } from '@/components/dashboard/v2'

function LoadingState() {
  return (
    <div className="min-h-screen bg-canvas p-4 md:p-6 flex items-center justify-center">
      <div className="text-center">
        <div className="w-12 h-12 rounded-full bg-blue-soft flex items-center justify-center mx-auto mb-4 animate-pulse">
          <span className="text-blue text-2xl">⚙️</span>
        </div>
        <p className="text-ink-2">Carregando...</p>
      </div>
    </div>
  )
}

export default function ConfigPage() {
  const clientData = useAppStore(s => s.clientData)
  const dashboardMode = useAppStore(s => s.dashboardMode)
  const [mounted, setMounted] = useState(false)

  useEffect(() => { setMounted(true) }, [])

  if (!mounted) return <LoadingState />

  return (
    <div className="min-h-screen bg-canvas p-4 md:p-6">
      <header className="mb-6 animate-fade-up">
        <h1 className="text-[23px] font-bold text-ink">Configurações</h1>
        <p className="text-sm text-ink-2 mt-1">Personalize sua experiência</p>
      </header>

      {/* Preferências */}
      <Card className="mb-6 animate-fade-up d2">
        <SectionHead title="Preferências" icon={<Icon name="gear" size={17} />} />
        <div className="space-y-4 mt-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-ink">Modo padrão</div>
              <div className="text-xs text-ink-3">Simplificado ou Avançado</div>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant={dashboardMode === 'simple' ? 'soft' : 'ghost'}>
                Simplificado
              </Button>
              <Button size="sm" variant={dashboardMode === 'pro' ? 'soft' : 'ghost'}>
                Avançado
              </Button>
            </div>
          </div>
          <div className="flex items-center justify-between border-t border-line pt-3">
            <div>
              <div className="text-sm text-ink">Notificações</div>
              <div className="text-xs text-ink-3">Alertas por email</div>
            </div>
            <Badge tone="good">Ativas</Badge>
          </div>
          <div className="flex items-center justify-between border-t border-line pt-3">
            <div>
              <div className="text-sm text-ink">Bulk de dados</div>
              <div className="text-xs text-ink-3">Último: 2025-06-10</div>
            </div>
            <Button size="sm" variant="ghost">Exportar</Button>
          </div>
        </div>
      </Card>

      {/* Perfil */}
      <Card className="mb-6 animate-fade-up d3">
        <SectionHead title="Perfil" icon={<Icon name="users" size={17} />} />
        <div className="space-y-3 mt-3">
          <div className="p-3 bg-canvas-2 rounded-sm">
            <div className="text-xs text-ink-3">Nome</div>
            <div className="text-sm text-ink">{clientData?.clientName || 'Não configurado'}</div>
          </div>
          <div className="p-3 bg-canvas-2 rounded-sm">
            <div className="text-xs text-ink-3">Nichos</div>
            <div className="text-sm text-ink">{clientData?.niche || 'Não definido'}</div>
          </div>
        </div>
      </Card>

      {/* Danger Zone */}
      <Card className="animate-fade-up d4 border-red/20">
        <SectionHead title="Zona de Perigo" icon={<Icon name="alert" size={17} />} />
        <div className="space-y-3 mt-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-ink">Limpar dados locais</div>
              <div className="text-xs text-ink-3">Remove dados do navegador</div>
            </div>
            <Button size="sm" variant="ghost">Limpar</Button>
          </div>
          <div className="flex items-center justify-between border-t border-line pt-3">
            <div>
              <div className="text-sm text-ink">Excluir conta</div>
              <div className="text-xs text-ink-3">Ação irreversível</div>
            </div>
            <Button size="sm" variant="ghost" className="text-red">Excluir</Button>
          </div>
        </div>
      </Card>
    </div>
  )
}
