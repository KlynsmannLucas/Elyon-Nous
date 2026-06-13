// app/(elyon)/novo/page.tsx — Onboarding (criar cliente) dentro do v2.
// Reusa o SetupWizard existente e o fluxo enxuto de geração de estratégia.
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { SetupWizard, type WizardImportData } from '@/components/dashboard/SetupWizard'
import { generateStrategyForActiveClient } from '@/lib/createClientFlow'
import { useAppStore } from '@/lib/store'
import { Card, Button } from '@/components/dashboard/v2'

export default function NovoClientePage() {
  const router = useRouter()
  const clientData = useAppStore(s => s.clientData)
  const [mounted, setMounted] = useState(false)
  const [phase, setPhase] = useState<'wizard' | 'generating' | 'error'>('wizard')
  const [step, setStep] = useState('')
  const [err, setErr] = useState('')
  useEffect(() => { setMounted(true) }, [])
  if (!mounted) return null

  const onComplete = async (importData?: WizardImportData[]) => {
    setPhase('generating'); setErr('')
    const r = await generateStrategyForActiveClient(importData, setStep)
    if (r.ok) router.push('/hoje')
    else { setErr(r.error || 'Falha ao gerar estratégia.'); setPhase('error') }
  }

  if (phase === 'generating') {
    return (
      <div className="p-4 md:p-6 min-h-[70vh] flex items-center justify-center">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 rounded-full bg-blue-soft flex items-center justify-center mx-auto mb-5 animate-pulse">
            <span className="text-blue text-2xl">◎</span>
          </div>
          <h2 className="text-lg font-semibold text-ink mb-1">Criando {clientData?.clientName || 'seu cliente'}…</h2>
          <p className="text-sm text-ink-3">{step || 'O NOUS está montando a estratégia inicial.'}</p>
          <div className="mt-5 h-1 w-48 mx-auto rounded-full bg-canvas-2 overflow-hidden">
            <div className="h-full bg-blue rounded-full animate-pulse" style={{ width: '70%' }} />
          </div>
        </div>
      </div>
    )
  }

  if (phase === 'error') {
    return (
      <div className="p-4 md:p-6 min-h-[60vh] flex items-center justify-center">
        <Card className="max-w-md text-center">
          <div className="py-6">
            <div className="w-14 h-14 rounded-full bg-red-soft flex items-center justify-center mx-auto mb-4"><span className="text-red text-2xl">⚠</span></div>
            <h2 className="text-lg font-semibold text-ink mb-2">Não consegui gerar a estratégia</h2>
            <p className="text-sm text-ink-2 mb-5">{err}</p>
            <div className="flex gap-2 justify-center">
              <Button onClick={() => onComplete()}>Tentar novamente</Button>
              <Button variant="soft" onClick={() => setPhase('wizard')}>Voltar ao formulário</Button>
            </div>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-6">
      <SetupWizard onComplete={onComplete} />
    </div>
  )
}
