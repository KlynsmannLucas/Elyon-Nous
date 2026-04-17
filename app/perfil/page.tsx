// app/perfil/page.tsx — Perfil do usuário: dados, plano, pagamentos, segurança
'use client'

import { useState } from 'react'
import { useUser, useClerk } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'

type Section = 'dados' | 'contatos' | 'pagamentos' | 'faturas' | 'seguranca'

const SECTIONS: { key: Section; label: string; icon: string }[] = [
  { key: 'dados',       label: 'Dados Pessoais', icon: '👤' },
  { key: 'contatos',    label: 'Contatos',        icon: '📞' },
  { key: 'pagamentos',  label: 'Pagamentos',      icon: '💳' },
  { key: 'faturas',     label: 'Faturas',         icon: '🧾' },
  { key: 'seguranca',   label: 'Login e Senha',   icon: '🔒' },
]

const PLAN_LABELS: Record<string, { label: string; color: string }> = {
  individual:   { label: 'Individual',   color: '#38BDF8' },
  profissional: { label: 'Profissional', color: '#F0B429' },
  avancada:     { label: 'Avançada',     color: '#22C55E' },
}

function Field({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="py-3 border-b border-[#1A1A1F] last:border-0">
      <div className="text-[11px] text-slate-500 uppercase tracking-wider mb-1">{label}</div>
      <div className="text-sm text-white font-medium">{value || '—'}</div>
      {sub && <div className="text-xs text-slate-600 mt-0.5">{sub}</div>}
    </div>
  )
}

export default function PerfilPage() {
  const { user, isLoaded } = useUser()
  const { signOut, openUserProfile } = useClerk()
  const router = useRouter()
  const [activeSection, setActiveSection] = useState<Section>('dados')
  const [portalLoading, setPortalLoading] = useState(false)
  const [syncLoading, setSyncLoading] = useState(false)
  const [syncMsg, setSyncMsg] = useState('')

  const userPlan    = user?.publicMetadata?.plan as string | undefined
  const planInfo    = userPlan ? PLAN_LABELS[userPlan] : null
  const email       = user?.primaryEmailAddress?.emailAddress || ''
  const firstName   = user?.firstName || ''
  const lastName    = user?.lastName  || ''
  const fullName    = [firstName, lastName].filter(Boolean).join(' ') || '—'
  const phone       = user?.primaryPhoneNumber?.phoneNumber || ''
  const username    = user?.username || ''
  const createdAt   = user?.createdAt
    ? new Date(typeof user.createdAt === 'number' ? user.createdAt : user.createdAt).toLocaleDateString('pt-BR')
    : '—'

  const handlePortal = async () => {
    setPortalLoading(true)
    const res  = await fetch('/api/stripe/portal', { method: 'POST' })
    const data = await res.json()
    if (data.url) window.location.href = data.url
    else alert('Erro ao abrir portal de pagamento.')
    setPortalLoading(false)
  }

  const handleSync = async () => {
    setSyncLoading(true)
    setSyncMsg('')
    const res  = await fetch('/api/stripe/sync', { method: 'POST' })
    const data = await res.json()
    if (data.success) {
      setSyncMsg(`Plano "${data.plan}" sincronizado! Atualizando...`)
      setTimeout(() => window.location.reload(), 1500)
    } else {
      setSyncMsg(data.message || 'Nenhuma assinatura encontrada.')
    }
    setSyncLoading(false)
  }

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-[#0A0A0B] flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-[#F0B429]/30 border-t-[#F0B429] rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0A0A0B] px-4 py-8">
      {/* Navbar */}
      <div className="max-w-4xl mx-auto flex items-center justify-between mb-10">
        <button
          onClick={() => router.push('/dashboard')}
          className="flex items-center gap-2 text-sm text-slate-500 hover:text-white transition-colors"
        >
          ← Voltar ao dashboard
        </button>
        <span
          className="font-display font-bold text-xl"
          style={{ background: 'linear-gradient(135deg, #F0B429, #FFD166)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}
        >
          ELYON
        </span>
        <button
          onClick={() => signOut({ redirectUrl: '/sign-in' })}
          className="text-sm text-slate-600 hover:text-red-400 transition-colors flex items-center gap-1.5"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
          Sair
        </button>
      </div>

      <div className="max-w-4xl mx-auto">
        {/* Header do perfil */}
        <div className="flex items-center gap-5 mb-8 bg-[#111114] border border-[#2A2A30] rounded-2xl p-6">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-bold text-black flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, #F0B429, #FFD166)' }}>
            {firstName?.[0] || email?.[0]?.toUpperCase() || 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-display text-xl font-bold text-white">{fullName}</div>
            <div className="text-sm text-slate-500 truncate">{email}</div>
            <div className="flex items-center gap-2 mt-2">
              {planInfo ? (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                  style={{ color: planInfo.color, background: `${planInfo.color}18`, border: `1px solid ${planInfo.color}30` }}>
                  {planInfo.label}
                </span>
              ) : (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full text-slate-500 bg-[#2A2A30]">
                  Sem plano
                </span>
              )}
              <span className="text-[10px] text-slate-600">Membro desde {createdAt}</span>
            </div>
          </div>
          <button
            onClick={() => openUserProfile()}
            className="hidden md:block text-xs font-semibold px-3 py-2 rounded-xl border border-[#2A2A30] text-slate-400 hover:text-white hover:border-[#3A3A45] transition-all"
          >
            Editar perfil
          </button>
        </div>

        <div className="grid md:grid-cols-[200px_1fr] gap-6">
          {/* Sidebar */}
          <div className="bg-[#111114] border border-[#2A2A30] rounded-2xl p-2 h-fit">
            {SECTIONS.map((s) => (
              <button
                key={s.key}
                onClick={() => setActiveSection(s.key)}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all text-left"
                style={{
                  background: activeSection === s.key ? 'rgba(240,180,41,0.08)' : 'transparent',
                  color: activeSection === s.key ? '#F0B429' : '#64748B',
                  border: activeSection === s.key ? '1px solid rgba(240,180,41,0.2)' : '1px solid transparent',
                }}
              >
                <span>{s.icon}</span>
                <span className="font-semibold">{s.label}</span>
              </button>
            ))}
          </div>

          {/* Conteúdo */}
          <div className="bg-[#111114] border border-[#2A2A30] rounded-2xl p-6">

            {/* ── DADOS PESSOAIS ── */}
            {activeSection === 'dados' && (
              <div>
                <h2 className="font-display text-lg font-bold text-white mb-5">Dados Pessoais</h2>
                <Field label="Nome completo"    value={fullName} />
                <Field label="Email principal"  value={email} />
                <Field label="Username"         value={username} />
                <Field label="Membro desde"     value={createdAt} />
                <Field label="ID do usuário"    value={user?.id || '—'} sub="Identificador único da conta" />
                <div className="mt-6">
                  <button
                    onClick={() => openUserProfile()}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold border transition-all hover:opacity-80"
                    style={{ border: '1px solid rgba(240,180,41,0.3)', color: '#F0B429', background: 'rgba(240,180,41,0.05)' }}
                  >
                    ✏️ Editar dados no Clerk
                  </button>
                </div>
              </div>
            )}

            {/* ── CONTATOS ── */}
            {activeSection === 'contatos' && (
              <div>
                <h2 className="font-display text-lg font-bold text-white mb-5">Contatos</h2>
                <Field label="Email principal"  value={email} />
                <Field label="Telefone"         value={phone || 'Não cadastrado'} />
                {user?.emailAddresses && user.emailAddresses.length > 1 && (
                  <div className="py-3 border-b border-[#1A1A1F]">
                    <div className="text-[11px] text-slate-500 uppercase tracking-wider mb-2">Outros emails</div>
                    {user.emailAddresses.filter(e => e.id !== user.primaryEmailAddressId).map(e => (
                      <div key={e.id} className="text-sm text-slate-400">{e.emailAddress}</div>
                    ))}
                  </div>
                )}
                <div className="mt-6">
                  <button
                    onClick={() => openUserProfile()}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold border transition-all hover:opacity-80"
                    style={{ border: '1px solid rgba(240,180,41,0.3)', color: '#F0B429', background: 'rgba(240,180,41,0.05)' }}
                  >
                    ✏️ Adicionar/editar contatos
                  </button>
                </div>
              </div>
            )}

            {/* ── PAGAMENTOS ── */}
            {activeSection === 'pagamentos' && (
              <div>
                <h2 className="font-display text-lg font-bold text-white mb-5">Pagamentos</h2>
                <div className="mb-5">
                  <div className="text-[11px] text-slate-500 uppercase tracking-wider mb-2">Plano atual</div>
                  {planInfo ? (
                    <div className="flex items-center gap-3 p-4 rounded-xl" style={{ background: `${planInfo.color}08`, border: `1px solid ${planInfo.color}25` }}>
                      <div className="w-9 h-9 rounded-lg flex items-center justify-center font-bold text-sm text-black"
                        style={{ background: planInfo.color }}>
                        {planInfo.label[0]}
                      </div>
                      <div>
                        <div className="text-sm font-bold text-white">Plano {planInfo.label}</div>
                        <div className="text-xs text-slate-500">Ativo · renovação automática</div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3 p-4 rounded-xl bg-[#16161A] border border-[#2A2A30]">
                      <div className="text-sm text-slate-400">Nenhum plano ativo</div>
                      <a href="/planos" className="ml-auto text-xs font-bold text-[#F0B429] hover:underline">Ver planos →</a>
                    </div>
                  )}
                </div>
                <div className="space-y-3">
                  {planInfo && (
                    <button
                      onClick={handlePortal}
                      disabled={portalLoading}
                      className="w-full flex items-center justify-between px-4 py-3.5 rounded-xl border transition-all hover:opacity-80 disabled:opacity-50"
                      style={{ border: '1px solid rgba(240,180,41,0.3)', color: '#F0B429', background: 'rgba(240,180,41,0.05)' }}
                    >
                      <div className="flex items-center gap-2 text-sm font-semibold">
                        💳 Gerenciar forma de pagamento
                      </div>
                      <span className="text-[#F0B429]">→</span>
                    </button>
                  )}
                  <button
                    onClick={handlePortal}
                    disabled={portalLoading}
                    className="w-full flex items-center justify-between px-4 py-3.5 rounded-xl border transition-all hover:opacity-80 disabled:opacity-50"
                    style={{ border: '1px solid #2A2A30', color: '#94A3B8', background: 'transparent' }}
                  >
                    <div className="flex items-center gap-2 text-sm font-semibold">
                      {portalLoading ? '⏳ Carregando...' : '🔧 Portal de assinatura Stripe'}
                    </div>
                    <span>→</span>
                  </button>
                  <button
                    onClick={handleSync}
                    disabled={syncLoading}
                    className="w-full flex items-center justify-between px-4 py-3.5 rounded-xl border transition-all hover:opacity-80 disabled:opacity-50"
                    style={{ border: '1px solid #2A2A30', color: '#64748B', background: 'transparent' }}
                  >
                    <div className="text-sm">{syncLoading ? '🔄 Verificando...' : '↺ Verificar assinatura manualmente'}</div>
                    <span>→</span>
                  </button>
                  {syncMsg && (
                    <p className="text-xs text-center" style={{ color: syncMsg.includes('sincronizado') ? '#22C55E' : '#F0B429' }}>
                      {syncMsg}
                    </p>
                  )}
                </div>
                {!planInfo && (
                  <div className="mt-5">
                    <a
                      href="/planos"
                      className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold text-sm text-black hover:opacity-90 transition-opacity"
                      style={{ background: 'linear-gradient(135deg, #F0B429, #FFD166)' }}
                    >
                      ⚡ Ver planos e assinar
                    </a>
                  </div>
                )}
              </div>
            )}

            {/* ── FATURAS ── */}
            {activeSection === 'faturas' && (
              <div>
                <h2 className="font-display text-lg font-bold text-white mb-5">Faturas</h2>
                <p className="text-slate-400 text-sm mb-5 leading-relaxed">
                  Suas faturas e histórico de pagamentos ficam no portal seguro do Stripe. Clique abaixo para acessar e baixar.
                </p>
                <button
                  onClick={handlePortal}
                  disabled={portalLoading}
                  className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold text-sm border transition-all hover:opacity-80 disabled:opacity-50"
                  style={{ border: '1px solid rgba(240,180,41,0.3)', color: '#F0B429', background: 'rgba(240,180,41,0.05)' }}
                >
                  {portalLoading ? '⏳ Carregando...' : '🧾 Ver faturas no Stripe'}
                </button>
                <div className="mt-6 p-4 rounded-xl bg-[#16161A] border border-[#2A2A30]">
                  <div className="text-xs text-slate-500 leading-relaxed">
                    O portal do Stripe exibe todas as faturas, status de pagamento e permite o download em PDF. Seus dados de pagamento são processados com segurança.
                  </div>
                </div>
              </div>
            )}

            {/* ── SEGURANÇA ── */}
            {activeSection === 'seguranca' && (
              <div>
                <h2 className="font-display text-lg font-bold text-white mb-5">Login e Senha</h2>
                <Field label="Email de acesso" value={email} />
                <Field label="Autenticação"    value="Email e senha" sub="Você pode adicionar autenticação social no perfil" />
                <div className="mt-6 space-y-3">
                  <button
                    onClick={() => openUserProfile()}
                    className="w-full flex items-center justify-between px-4 py-3.5 rounded-xl border transition-all hover:opacity-80"
                    style={{ border: '1px solid rgba(240,180,41,0.3)', color: '#F0B429', background: 'rgba(240,180,41,0.05)' }}
                  >
                    <div className="text-sm font-semibold flex items-center gap-2">🔑 Alterar senha</div>
                    <span>→</span>
                  </button>
                  <button
                    onClick={() => openUserProfile()}
                    className="w-full flex items-center justify-between px-4 py-3.5 rounded-xl border border-[#2A2A30] text-slate-400 hover:text-white transition-all"
                  >
                    <div className="text-sm flex items-center gap-2">🛡️ Segurança da conta (2FA, sessões)</div>
                    <span>→</span>
                  </button>
                  <div className="pt-2 border-t border-[#2A2A30]">
                    <button
                      onClick={() => signOut({ redirectUrl: '/sign-in' })}
                      className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm text-red-400 border border-red-400/20 hover:bg-red-400/05 transition-all"
                    >
                      Sair desta conta
                    </button>
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  )
}
