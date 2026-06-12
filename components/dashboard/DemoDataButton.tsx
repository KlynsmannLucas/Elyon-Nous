// components/dashboard/DemoDataButton.tsx — Botão "Usar dados de exemplo" + banner do modo demo
'use client'

import { applySimpleDemoData, clearSimpleDemoData } from '@/lib/simpleDemoData'

// Botão para ativar os dados de exemplo (usado nos estados vazios)
export function DemoDataButton() {
  return (
    <button
      onClick={() => applySimpleDemoData()}
      style={{
        padding: '10px 18px', borderRadius: '9px', fontSize: '13px', fontWeight: 600, cursor: 'pointer',
        background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.12)', color: '#5A6473',
        transition: 'all 0.15s',
      }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(124,58,237,0.3)'; e.currentTarget.style.color = '#2C5FE0' }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'; e.currentTarget.style.color = '#5A6473' }}
    >
      👀 Usar dados de exemplo
    </button>
  )
}

// Banner discreto exibido enquanto os dados de exemplo estão ativos
export function DemoBanner() {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '10px',
      padding: '10px 16px', marginBottom: '16px', borderRadius: '10px',
      background: 'rgba(245,158,11,0.07)', border: '1px solid rgba(245,158,11,0.25)',
    }}>
      <span style={{ fontSize: '15px', flexShrink: 0 }}>👀</span>
      <span style={{ fontSize: '12px', color: '#FCD34D', flex: 1, lineHeight: 1.4 }}>
        Você está vendo <strong>dados de exemplo</strong> — para experimentar como o painel funciona.
      </span>
      <button
        onClick={() => clearSimpleDemoData()}
        style={{ flexShrink: 0, fontSize: '11px', fontWeight: 700, color: '#E08B0B', background: 'none', border: '1px solid rgba(245,158,11,0.3)', borderRadius: '7px', padding: '5px 11px', cursor: 'pointer' }}
      >
        Limpar dados de exemplo
      </button>
    </div>
  )
}
