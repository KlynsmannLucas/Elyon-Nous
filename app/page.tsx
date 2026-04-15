// app/page.tsx — Landing Page ELYON
import Link from 'next/link'

function DashboardPreview() {
  return (
    <div className="relative w-full max-w-[580px]">
      <div className="absolute -inset-4 opacity-20 blur-3xl rounded-3xl"
        style={{ background: 'radial-gradient(ellipse, #F0B429 0%, transparent 70%)' }} />

      <div className="relative bg-[#111114] border border-[#2A2A30] rounded-2xl p-5 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="font-display font-bold text-sm" style={{
              background: 'linear-gradient(135deg, #F0B429, #FFD166)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            }}>ELYON</span>
            <span className="text-[10px] text-slate-600">· Dashboard</span>
          </div>
          <span className="flex items-center gap-1.5 text-[10px] text-[#22C55E] font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-[#22C55E] animate-pulse" />
            AO VIVO
          </span>
        </div>

        {/* Nicho badge + Meta conectado */}
        <div className="mb-3 flex items-center gap-2 flex-wrap">
          <span className="text-[10px] px-2 py-1 rounded-full font-semibold"
            style={{ background: 'rgba(240,180,41,0.1)', color: '#F0B429', border: '1px solid rgba(240,180,41,0.25)' }}>
            Odontologia Estética
          </span>
          <span className="text-[10px] px-2 py-1 rounded-full font-semibold flex items-center gap-1"
            style={{ background: 'rgba(34,197,94,0.08)', color: '#22C55E', border: '1px solid rgba(34,197,94,0.2)' }}>
            <span className="w-1 h-1 rounded-full bg-[#22C55E]" />
            Meta Ads conectado
          </span>
        </div>

        {/* KPI cards */}
        <div className="grid grid-cols-2 gap-2.5 mb-3">
          {[
            { label: 'Receita Estimada', value: 'R$38k', sub: '+24% vs mês anterior', color: '#F0B429' },
            { label: 'Leads / mês',      value: '62–95',  sub: 'CPL médio R$70',       color: '#22C55E' },
            { label: 'ROAS Real',        value: '3.9×',   sub: 'Meta: 3.8× ✓',         color: '#22C55E' },
            { label: 'CPL Real',         value: 'R$70',   sub: 'Benchmark R$45–95',     color: '#F0B429' },
          ].map((kpi) => (
            <div key={kpi.label} className="bg-[#16161A] border border-[#2A2A30] rounded-xl p-3">
              <div className="text-[9px] text-slate-500 uppercase tracking-wider mb-1">{kpi.label}</div>
              <div className="text-base font-display font-bold" style={{ color: kpi.color }}>{kpi.value}</div>
              <div className="text-[9px] text-slate-600 mt-0.5">{kpi.sub}</div>
            </div>
          ))}
        </div>

        {/* Mini chart */}
        <div className="bg-[#16161A] border border-[#2A2A30] rounded-xl p-3 mb-3">
          <div className="flex items-center justify-between mb-2">
            <div className="text-[10px] text-slate-500">Projeção de Receita · 6 meses</div>
            <div className="text-[10px] text-[#22C55E] font-semibold">↑ 34%</div>
          </div>
          <div className="flex items-end gap-1 h-10">
            {[35, 48, 58, 69, 80, 100].map((h, i) => (
              <div key={i} className="flex-1 flex flex-col justify-end">
                <div className="rounded-sm" style={{
                  height: `${h}%`,
                  background: i === 5
                    ? 'linear-gradient(to top, #F0B429, #FFD166)'
                    : `rgba(240,180,41,${0.15 + i * 0.08})`,
                }} />
              </div>
            ))}
          </div>
        </div>

        {/* NOUS chat preview */}
        <div className="rounded-xl p-2.5 flex items-start gap-2"
          style={{ background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.2)' }}>
          <span className="text-sm flex-shrink-0">🧠</span>
          <div>
            <div className="text-[9px] text-[#A78BFA] font-semibold mb-0.5">NOUS · IA contextual</div>
            <span className="text-[10px] text-slate-400">Seu CPL de R$70 está dentro do benchmark. Recomendo escalar Meta Ads em 20% e testar Google Search.</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function LandingPage() {
  const niches = [
    'Odontologia', 'Saúde / Clínica', 'Financeiro', 'Educação / Cursos',
    'Imobiliário', 'E-commerce', 'Jurídico', 'Contabilidade',
    'Beleza / Estética', 'Academia / Fitness', 'SaaS / Tech', 'Pet Shop',
    'Turismo', 'Restaurante', 'Consultoria', 'Construção Civil',
    'Moda', 'Psicologia', 'Nutrição', 'Eventos', 'Marketing / Agência',
    'Barbearia', 'Clínica Veterinária', 'Advocacia', 'Arquitetura',
    'Autoescola', 'Concessionária', 'Franquias', '+52 mais',
  ]

  return (
    <main className="min-h-screen bg-[#0A0A0B] overflow-x-hidden">

      {/* ── Navbar ──────────────────────────────────────────────────────────── */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 md:px-12 py-4 border-b border-[#2A2A30] bg-[#0A0A0B]/80 backdrop-blur-xl">
        <span className="font-display font-bold text-xl" style={{
          background: 'linear-gradient(135deg, #F0B429, #FFD166)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
        }}>ELYON</span>
        <div className="hidden md:flex items-center gap-8 text-sm text-slate-500">
          <a href="#como-funciona" className="hover:text-white transition-colors">Como funciona</a>
          <a href="#nichos" className="hover:text-white transition-colors">Nichos</a>
          <a href="#features" className="hover:text-white transition-colors">Recursos</a>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/sign-in" className="text-sm text-slate-400 hover:text-white transition-colors px-4 py-2 hidden md:block">
            Entrar
          </Link>
          <Link href="/sign-up"
            className="text-sm font-bold px-5 py-2.5 rounded-xl hover:opacity-90 transition-opacity"
            style={{ background: 'linear-gradient(135deg, #F0B429, #FFD166)', color: '#000' }}>
            Começar grátis →
          </Link>
        </div>
      </nav>

      {/* ── HERO ──────────────────────────────────────────────────────────────── */}
      <section className="pt-36 pb-24 px-6 md:px-12 max-w-7xl mx-auto">
        <div className="flex flex-col lg:flex-row items-center gap-16">
          <div className="flex-1 max-w-xl">
            <div className="inline-flex items-center gap-2 bg-[#111114] border border-[#2A2A30] rounded-full px-4 py-2 mb-8">
              <span className="w-2 h-2 rounded-full bg-[#F0B429] animate-pulse" />
              <span className="text-xs font-semibold text-[#F0B429] tracking-widest uppercase">
                ELYON AGENT · Seu Head de Growth com IA 24h
              </span>
            </div>

            <h1 className="font-display text-5xl md:text-6xl leading-[1.1] mb-6">
              <span className="text-white">Não damos opinião.</span>
              <br />
              <span style={{
                background: 'linear-gradient(135deg, #F0B429, #FFD166)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              }}>
                Damos dado + direção.
              </span>
            </h1>

            <p className="text-slate-400 text-lg leading-relaxed mb-8">
              O ELYON funciona como um Head de Growth especializado no seu nicho —
              conecta suas contas de anúncio, diagnostica o funil, calcula CPL e ROAS reais
              e entrega um plano pronto para executar. Em 2 minutos.
            </p>

            <div className="flex flex-wrap gap-3 mb-8">
              <Link href="/sign-up"
                className="inline-flex items-center gap-2 font-bold px-7 py-4 rounded-xl hover:opacity-90 transition-opacity text-lg"
                style={{ background: 'linear-gradient(135deg, #F0B429, #FFD166)', color: '#000', boxShadow: '0 0 32px rgba(240,180,41,0.25)' }}>
                Quero minha análise grátis →
              </Link>
              <Link href="/sign-in"
                className="inline-flex items-center gap-2 border border-[#2A2A30] text-slate-300 font-medium px-6 py-4 rounded-xl hover:border-[#3A3A42] hover:text-white transition-colors">
                Já tenho conta
              </Link>
            </div>

            <div className="flex flex-wrap gap-x-6 gap-y-2">
              {[
                'Análise gratuita para começar',
                'Resultado em 2 minutos',
                'Sem cartão de crédito',
              ].map((item) => (
                <span key={item} className="flex items-center gap-2 text-sm text-slate-500">
                  <span className="text-[#22C55E] font-bold">✓</span>
                  {item}
                </span>
              ))}
            </div>
          </div>

          <div className="flex-1 flex justify-center lg:justify-end">
            <DashboardPreview />
          </div>
        </div>
      </section>

      {/* ── BARRA DE MÉTRICAS ─────────────────────────────────────────────────── */}
      <section className="py-14 px-6 md:px-12 border-y border-[#2A2A30]"
        style={{ background: 'rgba(240,180,41,0.02)' }}>
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {[
            { value: '80+',    label: 'Nichos com estratégia especializada' },
            { value: '4.2×',   label: 'ROAS médio calculado por cliente' },
            { value: '90 dias', label: 'Plano de ação pronto para executar' },
            { value: '2 min',  label: 'Para ter análise estratégica completa' },
          ].map((m, i) => (
            <div key={i}>
              <div className="font-display text-4xl font-bold mb-2"
                style={{ background: 'linear-gradient(135deg, #F0B429, #FFD166)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                {m.value}
              </div>
              <div className="text-sm text-slate-500">{m.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── PROBLEMA → SOLUÇÃO ────────────────────────────────────────────────── */}
      <section className="py-24 px-6 md:px-12 max-w-5xl mx-auto">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div className="bg-[#111114] border border-[#2A2A30] rounded-2xl p-8">
            <div className="text-sm font-semibold text-[#FF4D4D] uppercase tracking-wider mb-4">
              ❌ Sem o ELYON
            </div>
            <div className="space-y-4">
              {[
                'Consultor caro que fala muito e entrega pouco',
                'Budget queimado em canal errado para o seu nicho',
                'Sem visão do funil — TOFU, MOFU e BOFU no achismo',
                'Decisão baseada em feeling — sem benchmark real',
                'Campanhas passadas esquecidas, erros repetidos',
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-3 text-sm text-slate-400">
                  <span className="text-[#FF4D4D] font-bold mt-0.5 flex-shrink-0">✗</span>
                  {item}
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl p-8"
            style={{ background: 'linear-gradient(135deg, rgba(240,180,41,0.08) 0%, rgba(240,180,41,0.03) 100%)', border: '1px solid rgba(240,180,41,0.25)' }}>
            <div className="text-sm font-semibold text-[#F0B429] uppercase tracking-wider mb-4">
              ✅ Com o ELYON
            </div>
            <div className="space-y-4">
              {[
                'Head de Growth IA especializado no seu nicho — 24h',
                'Canal certo + budget certo, com dados reais do mercado',
                'Diagnóstico TOFU/MOFU/BOFU — onde está o gargalo',
                'CPL e ROAS reais das suas campanhas Meta e Google',
                'Histórico de campanhas alimentando decisões futuras',
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-3 text-sm text-slate-200">
                  <span className="text-[#22C55E] font-bold mt-0.5 flex-shrink-0">✓</span>
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── COMO FUNCIONA ─────────────────────────────────────────────────────── */}
      <section id="como-funciona" className="py-24 px-6 md:px-12 border-t border-[#2A2A30]"
        style={{ background: 'rgba(240,180,41,0.02)' }}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <div className="text-xs text-[#F0B429] font-semibold uppercase tracking-widest mb-3">Simples e direto</div>
            <h2 className="font-display text-4xl font-bold text-white mb-4">
              Decisão pronta em 3 passos
            </h2>
            <p className="text-slate-400 max-w-lg mx-auto">
              Sem planilhas. Sem consultor caro. Sem achismo.
              Configure o negócio e o ELYON entrega tudo que precisa para crescer.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { step: '01', icon: '⚙️', color: '#F0B429', title: 'Configure o negócio',
                desc: 'Informe nicho, cidade e budget. Conecte suas contas Meta Ads e Google Ads. O ELYON identifica os benchmarks reais do seu segmento.' },
              { step: '02', icon: '🧠', color: '#A78BFA', title: 'O Head de Growth analisa',
                desc: 'Em 2 minutos: diagnóstico do funil TOFU/MOFU/BOFU, o que escalar, cortar e testar. Plano de 90 dias com metas de leads e receita.' },
              { step: '03', icon: '🎯', color: '#22C55E', title: 'Execute com dados reais',
                desc: 'NOUS responde suas dúvidas com contexto real do seu negócio. Histórico de campanhas alimenta decisões futuras. Zero achismo.' },
            ].map((s, i) => (
              <div key={i} className="relative bg-[#111114] border border-[#2A2A30] rounded-2xl p-8">
                <div className="text-5xl font-display font-bold mb-4" style={{ color: `${s.color}18` }}>{s.step}</div>
                <div className="text-3xl mb-4">{s.icon}</div>
                <h3 className="font-display font-bold text-white text-lg mb-3">{s.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{s.desc}</p>
                {i < 2 && <div className="hidden md:block absolute top-1/2 -right-3 text-slate-700 text-xl">→</div>}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES / RECURSOS ───────────────────────────────────────────────── */}
      <section id="features" className="py-24 px-6 md:px-12 max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <div className="text-xs text-[#F0B429] font-semibold uppercase tracking-widest mb-3">Tudo que você precisa</div>
          <h2 className="font-display text-4xl font-bold text-white mb-4">
            Uma plataforma. Inteligência completa.
          </h2>
          <p className="text-slate-400 max-w-xl mx-auto">
            Cada recurso foi construído para um objetivo: eliminar achismo e colocar dados reais na sua tomada de decisão.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-5">
          {/* NOUS */}
          <div className="rounded-2xl p-8"
            style={{ background: 'linear-gradient(135deg, rgba(167,139,250,0.08) 0%, rgba(167,139,250,0.03) 100%)', border: '1px solid rgba(167,139,250,0.25)' }}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
                style={{ background: 'rgba(167,139,250,0.15)', border: '1px solid rgba(167,139,250,0.3)' }}>
                🧠
              </div>
              <div>
                <div className="text-xs text-[#A78BFA] font-semibold uppercase tracking-wider">NOUS</div>
                <h3 className="font-display font-bold text-white">IA contextual por nicho</h3>
              </div>
            </div>
            <p className="text-slate-400 text-sm leading-relaxed mb-4">
              Chat inteligente que conhece seu cliente, seu nicho, seu budget e suas campanhas. Não dá respostas genéricas — responde com os dados reais do seu negócio.
            </p>
            <div className="bg-[#0A0A0B]/60 rounded-xl p-3 border border-[#2A2A30]">
              <div className="text-[10px] text-[#A78BFA] font-semibold mb-1">NOUS · Clínica Odontológica · R$3k/mês</div>
              <p className="text-[11px] text-slate-400">"Seu CPL de R$82 está dentro do benchmark (R$45–95). Recomendo escalar Meta em 20% e pausar Google Display — retorno abaixo do esperado para o nicho."</p>
            </div>
          </div>

          {/* Meta + Google Ads */}
          <div className="rounded-2xl p-8"
            style={{ background: 'linear-gradient(135deg, rgba(56,189,248,0.08) 0%, rgba(56,189,248,0.03) 100%)', border: '1px solid rgba(56,189,248,0.25)' }}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
                style={{ background: 'rgba(56,189,248,0.15)', border: '1px solid rgba(56,189,248,0.3)' }}>
                🔗
              </div>
              <div>
                <div className="text-xs text-[#38BDF8] font-semibold uppercase tracking-wider">CONEXÕES</div>
                <h3 className="font-display font-bold text-white">Meta Ads + Google Ads reais</h3>
              </div>
            </div>
            <p className="text-slate-400 text-sm leading-relaxed mb-4">
              Conecte suas contas via OAuth e veja CPL, ROAS, leads e investimento real das suas campanhas — diretamente no dashboard, sem copiar e colar planilha.
            </p>
            <div className="grid grid-cols-2 gap-2">
              {[
                { icon: '📘', name: 'Meta Ads', status: 'Disponível', color: '#38BDF8' },
                { icon: '🔵', name: 'Google Ads', status: 'Disponível', color: '#38BDF8' },
              ].map((p) => (
                <div key={p.name} className="bg-[#0A0A0B]/60 rounded-xl p-3 border border-[#2A2A30] flex items-center gap-2">
                  <span className="text-lg">{p.icon}</span>
                  <div>
                    <div className="text-xs font-semibold text-white">{p.name}</div>
                    <div className="text-[10px]" style={{ color: p.color }}>{p.status}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Head of Growth */}
          <div className="rounded-2xl p-8"
            style={{ background: 'linear-gradient(135deg, rgba(240,180,41,0.08) 0%, rgba(240,180,41,0.03) 100%)', border: '1px solid rgba(240,180,41,0.25)' }}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
                style={{ background: 'rgba(240,180,41,0.15)', border: '1px solid rgba(240,180,41,0.3)' }}>
                ⚡
              </div>
              <div>
                <div className="text-xs text-[#F0B429] font-semibold uppercase tracking-wider">HEAD OF GROWTH</div>
                <h3 className="font-display font-bold text-white">Diagnóstico TOFU / MOFU / BOFU</h3>
              </div>
            </div>
            <p className="text-slate-400 text-sm leading-relaxed mb-4">
              Identifica onde está o gargalo do seu funil. Diagnóstico de desperdícios, bloqueios de crescimento e o que está travando sua escala — com plano de ação prático.
            </p>
            <div className="flex gap-2">
              {[
                { label: 'TOFU', sub: 'Atração', color: '#F0B429' },
                { label: 'MOFU', sub: 'Engajamento', color: '#A78BFA' },
                { label: 'BOFU', sub: 'Conversão', color: '#22C55E' },
              ].map((f) => (
                <div key={f.label} className="flex-1 bg-[#0A0A0B]/60 rounded-xl p-2.5 border border-[#2A2A30] text-center">
                  <div className="text-xs font-bold" style={{ color: f.color }}>{f.label}</div>
                  <div className="text-[10px] text-slate-600">{f.sub}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Histórico de campanhas */}
          <div className="rounded-2xl p-8"
            style={{ background: 'linear-gradient(135deg, rgba(34,197,94,0.08) 0%, rgba(34,197,94,0.03) 100%)', border: '1px solid rgba(34,197,94,0.25)' }}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
                style={{ background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.3)' }}>
                🗂️
              </div>
              <div>
                <div className="text-xs text-[#22C55E] font-semibold uppercase tracking-wider">HISTÓRICO</div>
                <h3 className="font-display font-bold text-white">Memória de campanhas</h3>
              </div>
            </div>
            <p className="text-slate-400 text-sm leading-relaxed mb-4">
              Registre o que funcionou e o que falhou em cada campanha. O ELYON usa esse histórico para gerar estratégias mais precisas e evitar erros repetidos.
            </p>
            <div className="space-y-2">
              {[
                { label: 'Meta Ads · Jan 2025', outcome: 'Vencedora', color: '#22C55E', cpl: 'CPL R$68' },
                { label: 'Google Search · Dez 2024', outcome: 'Perdedora', color: '#FF4D4D', cpl: 'CPL R$142' },
              ].map((c) => (
                <div key={c.label} className="bg-[#0A0A0B]/60 rounded-xl p-2.5 border border-[#2A2A30] flex items-center justify-between">
                  <div>
                    <div className="text-[11px] text-white font-semibold">{c.label}</div>
                    <div className="text-[10px] text-slate-600">{c.cpl}</div>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                    style={{ color: c.color, background: `${c.color}15`, border: `1px solid ${c.color}30` }}>
                    {c.outcome}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── NOUS INTELLIGENCE ────────────────────────────────────────────────── */}
      <section className="py-28 px-6 md:px-12 border-t border-[#2A2A30] relative overflow-hidden"
        style={{ background: '#080809' }}>
        {/* Glows dramáticos */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[300px] pointer-events-none"
          style={{ background: 'radial-gradient(ellipse, rgba(240,180,41,0.12) 0%, transparent 70%)', filter: 'blur(40px)' }} />
        <div className="absolute bottom-0 left-1/4 w-[400px] h-[200px] pointer-events-none"
          style={{ background: 'radial-gradient(ellipse, rgba(240,180,41,0.07) 0%, transparent 70%)', filter: 'blur(60px)' }} />

        <div className="max-w-5xl mx-auto relative">
          {/* Badge */}
          <div className="flex justify-center mb-8">
            <div className="inline-flex items-center gap-3 px-5 py-2.5 rounded-full"
              style={{ background: 'rgba(240,180,41,0.08)', border: '1px solid rgba(240,180,41,0.3)' }}>
              <div className="w-6 h-6 rounded-full flex items-center justify-center text-sm"
                style={{ background: 'linear-gradient(135deg, #F0B429, #FFD166)' }}>
                N
              </div>
              <span className="font-display font-bold text-sm tracking-widest uppercase"
                style={{ background: 'linear-gradient(135deg, #F0B429, #FFD166)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                ELYON NOUS
              </span>
            </div>
          </div>

          {/* Título */}
          <div className="text-center mb-16">
            <h2 className="font-display text-5xl md:text-6xl font-bold leading-tight mb-5">
              <span className="text-white">Inteligência estratégica</span><br />
              <span style={{ background: 'linear-gradient(135deg, #F0B429, #FFD166)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                para decisões que geram lucro.
              </span>
            </h2>
            <p className="text-slate-500 text-lg max-w-lg mx-auto">
              Baseada em dados reais de mercado — não em tentativa e erro.
            </p>
          </div>

          {/* 4 cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-14">
            {[
              { icon: '📊', color: '#F0B429', glow: 'rgba(240,180,41,0.15)', title: 'Análise de Mercado', desc: 'Descubra onde sua empresa está perdendo dinheiro e o que já está funcionando no seu nicho.' },
              { icon: '🎯', color: '#22C55E', glow: 'rgba(34,197,94,0.15)', title: 'Análise de Concorrentes', desc: 'Entenda exatamente o que empresas do seu mercado estão fazendo para crescer.' },
              { icon: '💡', color: '#A78BFA', glow: 'rgba(167,139,250,0.15)', title: 'Oportunidades Estratégicas', desc: 'Identifique onde está o crescimento real e quais movimentos geram mais retorno.' },
              { icon: '📋', color: '#38BDF8', glow: 'rgba(56,189,248,0.15)', title: 'Plano de Ação Estruturado', desc: 'Receba um direcionamento objetivo do que fazer, como fazer e por onde começar.' },
            ].map((card) => (
              <div key={card.title}
                className="relative rounded-2xl p-7 flex flex-col gap-4 hover:translate-y-[-4px] transition-all duration-300"
                style={{ background: `linear-gradient(160deg, ${card.glow} 0%, rgba(17,17,20,0.9) 60%)`, border: `1px solid ${card.color}40` }}>
                {/* Glow no topo do card */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-20 h-10 pointer-events-none"
                  style={{ background: `radial-gradient(ellipse, ${card.color}30, transparent)`, filter: 'blur(12px)' }} />
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl relative"
                  style={{ background: `linear-gradient(135deg, ${card.color}25, ${card.color}08)`, border: `1px solid ${card.color}40`, boxShadow: `0 0 20px ${card.color}20` }}>
                  {card.icon}
                </div>
                <h3 className="font-display font-bold text-white text-base leading-tight">{card.title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{card.desc}</p>
              </div>
            ))}
          </div>

          {/* Frase de impacto */}
          <div className="relative text-center rounded-3xl py-10 px-8 overflow-hidden"
            style={{ background: 'linear-gradient(135deg, rgba(240,180,41,0.08) 0%, rgba(240,180,41,0.02) 100%)', border: '1px solid rgba(240,180,41,0.25)' }}>
            <div className="absolute inset-0 pointer-events-none"
              style={{ background: 'radial-gradient(ellipse 60% 80% at 50% 100%, rgba(240,180,41,0.08) 0%, transparent 70%)' }} />
            <p className="font-display text-2xl md:text-3xl font-bold text-slate-300 mb-2 relative">
              Pare de tomar decisões no escuro.
            </p>
            <p className="font-display text-2xl md:text-3xl font-bold relative"
              style={{ background: 'linear-gradient(135deg, #F0B429, #FFD166)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Comece a crescer com base no que realmente funciona.
            </p>
          </div>
        </div>
      </section>

      {/* ── PLATAFORMAS MONITORADAS ───────────────────────────────────────────── */}
      <section className="py-28 px-6 md:px-12 border-t border-[#2A2A30] relative overflow-hidden"
        style={{ background: '#06060A' }}>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] pointer-events-none"
          style={{ background: 'radial-gradient(ellipse, rgba(167,139,250,0.08) 0%, transparent 70%)', filter: 'blur(60px)' }} />

        <div className="max-w-5xl mx-auto relative">
          {/* Badge */}
          <div className="flex justify-center mb-8">
            <div className="inline-flex items-center gap-3 px-5 py-2.5 rounded-full"
              style={{ background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.3)' }}>
              <div className="w-6 h-6 rounded-full flex items-center justify-center text-sm"
                style={{ background: 'linear-gradient(135deg, #A78BFA, #C4B5FD)' }}>
                N
              </div>
              <span className="font-display font-bold text-sm tracking-widest uppercase"
                style={{ background: 'linear-gradient(135deg, #F0B429, #FFD166)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                ELYON NOUS
              </span>
            </div>
          </div>

          <div className="text-center mb-16">
            <h2 className="font-display text-5xl md:text-6xl font-bold leading-tight mb-5">
              <span className="text-white">Conectado às</span><br />
              <span style={{ background: 'linear-gradient(135deg, #F0B429, #FFD166)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                principais plataformas.
              </span>
            </h2>
            <p className="text-slate-500 text-lg max-w-lg mx-auto">
              Extraímos insights e oportunidades das principais redes de anúncios — direto para o seu dashboard.
            </p>
          </div>

          {/* Plataformas */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-5 mb-14">

            {/* Meta Ads */}
            <div className="relative rounded-2xl p-7 flex flex-col items-center text-center gap-4 hover:translate-y-[-4px] transition-all duration-300"
              style={{ background: '#111114', border: '1px solid rgba(24,119,242,0.4)', boxShadow: '0 0 30px rgba(24,119,242,0.15)' }}>
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, #1877F2, #0D5FD6)', boxShadow: '0 8px 24px rgba(24,119,242,0.4)' }}>
                <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
                  <path d="M18 8C12.5 8 8.5 12.8 8.5 18.5C8.5 23.5 11.5 27.5 15.5 28.5V21H13V18H15.5V15.8C15.5 13.3 17 11.9 19.3 11.9C20.4 11.9 21.5 12.1 21.5 12.1V14.5H20.3C19.1 14.5 18.7 15.3 18.7 16.1V18H21.4L21 21H18.7V28.5C22.7 27.5 25.7 23.5 25.7 18.5C25.7 12.8 23.5 8 18 8Z" fill="white"/>
                </svg>
              </div>
              <div>
                <div className="font-display font-bold text-white text-base mb-1">Meta Ads</div>
                <div className="flex items-center justify-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#22C55E]" />
                  <span className="text-xs font-semibold text-[#22C55E]">Disponível</span>
                </div>
              </div>
            </div>

            {/* Google Ads */}
            <div className="relative rounded-2xl p-7 flex flex-col items-center text-center gap-4 hover:translate-y-[-4px] transition-all duration-300"
              style={{ background: '#111114', border: '1px solid rgba(66,133,244,0.4)', boxShadow: '0 0 30px rgba(66,133,244,0.15)' }}>
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
                style={{ background: '#fff', boxShadow: '0 8px 24px rgba(66,133,244,0.3)' }}>
                <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
                  <path d="M18 7L9 22H27L18 7Z" fill="#FBBC05"/>
                  <circle cx="10" cy="25" r="4" fill="#EA4335"/>
                  <circle cx="26" cy="25" r="4" fill="#4285F4"/>
                </svg>
              </div>
              <div>
                <div className="font-display font-bold text-white text-base mb-1">Google Ads</div>
                <div className="flex items-center justify-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#22C55E]" />
                  <span className="text-xs font-semibold text-[#22C55E]">Disponível</span>
                </div>
              </div>
            </div>

            {/* YouTube Ads */}
            <div className="relative rounded-2xl p-7 flex flex-col items-center text-center gap-4 hover:translate-y-[-4px] transition-all duration-300"
              style={{ background: '#111114', border: '1px solid rgba(255,0,0,0.3)', boxShadow: '0 0 30px rgba(255,0,0,0.1)' }}>
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
                style={{ background: '#FF0000', boxShadow: '0 8px 24px rgba(255,0,0,0.35)' }}>
                <svg width="38" height="28" viewBox="0 0 38 28" fill="none">
                  <rect width="38" height="28" rx="6" fill="#FF0000"/>
                  <path d="M15 8L28 14L15 20V8Z" fill="white"/>
                </svg>
              </div>
              <div>
                <div className="font-display font-bold text-white text-base mb-1">YouTube Ads</div>
                <div className="flex items-center justify-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#475569]" />
                  <span className="text-xs font-semibold text-[#475569]">Em breve</span>
                </div>
              </div>
            </div>

            {/* TikTok Ads */}
            <div className="relative rounded-2xl p-7 flex flex-col items-center text-center gap-4 hover:translate-y-[-4px] transition-all duration-300"
              style={{ background: '#111114', border: '1px solid rgba(105,201,208,0.3)', boxShadow: '0 0 30px rgba(105,201,208,0.1)' }}>
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
                style={{ background: '#010101', boxShadow: '0 8px 24px rgba(105,201,208,0.3)' }}>
                <svg width="32" height="36" viewBox="0 0 32 36" fill="none">
                  {/* sombra ciano */}
                  <path d="M13.5 6H19.5V24C19.5 26.2 17.7 28 15.5 28C13.3 28 11.5 26.2 11.5 24C11.5 21.8 13.3 20 15.5 20" stroke="#69C9D0" strokeWidth="2.5" fill="none" transform="translate(1,1)"/>
                  {/* sombra vermelha */}
                  <path d="M13.5 6H19.5V24C19.5 26.2 17.7 28 15.5 28C13.3 28 11.5 26.2 11.5 24C11.5 21.8 13.3 20 15.5 20" stroke="#EE1D52" strokeWidth="2.5" fill="none" transform="translate(-1,-1)"/>
                  {/* branco principal */}
                  <path d="M13.5 6H19.5V24C19.5 26.2 17.7 28 15.5 28C13.3 28 11.5 26.2 11.5 24C11.5 21.8 13.3 20 15.5 20" stroke="white" strokeWidth="2" fill="none"/>
                  {/* nota musical topo direito */}
                  <path d="M19.5 10C21 10.5 23 10.5 24.5 9" stroke="#69C9D0" strokeWidth="2.5" fill="none" transform="translate(1,1)"/>
                  <path d="M19.5 10C21 10.5 23 10.5 24.5 9" stroke="#EE1D52" strokeWidth="2.5" fill="none" transform="translate(-1,-1)"/>
                  <path d="M19.5 10C21 10.5 23 10.5 24.5 9" stroke="white" strokeWidth="2" fill="none"/>
                </svg>
              </div>
              <div>
                <div className="font-display font-bold text-white text-base mb-1">TikTok Ads</div>
                <div className="flex items-center justify-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#475569]" />
                  <span className="text-xs font-semibold text-[#475569]">Em breve</span>
                </div>
              </div>
            </div>

          </div>

          {/* Frase de impacto */}
          <div className="relative text-center rounded-3xl py-10 px-8 overflow-hidden"
            style={{ background: 'linear-gradient(135deg, rgba(167,139,250,0.08) 0%, rgba(167,139,250,0.02) 100%)', border: '1px solid rgba(167,139,250,0.25)' }}>
            <div className="absolute inset-0 pointer-events-none"
              style={{ background: 'radial-gradient(ellipse 60% 80% at 50% 100%, rgba(167,139,250,0.08) 0%, transparent 70%)' }} />
            <p className="font-display text-2xl md:text-3xl font-bold text-slate-300 mb-2 relative">
              De Meta a TikTok —
            </p>
            <p className="font-display text-2xl md:text-3xl font-bold relative"
              style={{ background: 'linear-gradient(135deg, #F0B429, #FFD166)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              tudo integrado na sua tomada de decisão.
            </p>
          </div>
        </div>
      </section>

      {/* ── PREÇOS ────────────────────────────────────────────────────────────── */}
      <section id="precos" className="py-24 px-6 md:px-12 border-t border-[#2A2A30]"
        style={{ background: 'rgba(240,180,41,0.02)' }}>
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <div className="text-xs text-[#F0B429] font-semibold uppercase tracking-widest mb-3">Estrutura de produtos</div>
            <h2 className="font-display text-4xl font-bold text-white mb-4">
              Você não contrata marketing.
            </h2>
            <p className="text-slate-400 text-lg max-w-xl mx-auto">
              Você passa a ter um sistema que mostra exatamente o que fazer para crescer.
            </p>
          </div>

          {/* Diagnóstico — entrada */}
          <div className="mb-6 rounded-2xl p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6"
            style={{ background: 'linear-gradient(135deg, rgba(240,180,41,0.1) 0%, rgba(240,180,41,0.04) 100%)', border: '1px solid rgba(240,180,41,0.35)' }}>
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                style={{ background: 'rgba(240,180,41,0.15)', border: '1px solid rgba(240,180,41,0.3)' }}>
                🔥
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                    style={{ color: '#F0B429', background: 'rgba(240,180,41,0.15)', border: '1px solid rgba(240,180,41,0.3)' }}>
                    PRIMEIRO PASSO · ENTRADA
                  </span>
                </div>
                <h3 className="font-display font-bold text-white text-lg mb-1">Diagnóstico Estratégico</h3>
                <p className="text-slate-400 text-sm max-w-xl">
                  Estudo aprofundado do seu negócio: onde você perde vendas, o que a concorrência faz, oportunidades não aproveitadas e um plano claro de crescimento. Nada genérico.
                </p>
                <div className="flex flex-wrap gap-2 mt-3">
                  {['Análise de mercado e concorrência', 'Diagnóstico do posicionamento', 'Plano de ação prático'].map((d) => (
                    <span key={d} className="text-[11px] px-2.5 py-1 rounded-full text-[#F0B429]"
                      style={{ background: 'rgba(240,180,41,0.08)', border: '1px solid rgba(240,180,41,0.2)' }}>
                      ✓ {d}
                    </span>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex-shrink-0 text-right">
              <div className="font-display text-3xl font-bold text-[#F0B429]">R$1.500</div>
              <div className="text-xs text-slate-500">até R$3.000 · por projeto</div>
              <Link href="/sign-up"
                className="mt-3 inline-flex items-center gap-2 text-sm font-bold px-5 py-2.5 rounded-xl hover:opacity-90 transition-opacity"
                style={{ background: 'linear-gradient(135deg, #F0B429, #FFD166)', color: '#000' }}>
                Começar com diagnóstico →
              </Link>
            </div>
          </div>

          {/* 3 planos de recorrência */}
          <div className="grid md:grid-cols-3 gap-4 mb-6">
            {[
              {
                icon: '🔄', tag: 'RECORRÊNCIA BASE', color: '#38BDF8', border: 'rgba(56,189,248,0.3)',
                bg: 'linear-gradient(135deg, rgba(56,189,248,0.08) 0%, rgba(56,189,248,0.03) 100%)',
                title: 'Individual',
                desc: 'Para donos de negócio e profissionais que querem direção contínua baseada em dados reais do mercado.',
                price: 'R$97', priceEnd: 'até R$197/mês',
                features: ['Estratégia atualizada mensalmente', 'Benchmarks por nicho', 'NOUS IA contextual', 'Histórico de campanhas', 'Conexão Meta Ads'],
                highlight: false,
                cta: 'Começar agora →',
                planKey: 'individual',
              },
              {
                icon: '🚀', tag: 'MAIS POPULAR', color: '#F0B429', border: 'rgba(240,180,41,0.5)',
                bg: 'linear-gradient(135deg, rgba(240,180,41,0.12) 0%, rgba(240,180,41,0.05) 100%)',
                title: 'Profissional',
                desc: 'Para gestores de tráfego e consultores que querem capacidade estratégica elevada e atender clientes com o sistema.',
                price: 'R$297', priceEnd: 'até R$497/mês',
                features: ['Tudo do Individual', 'Estratégias avançadas e múltiplos cenários', 'Diagnóstico como oferta para clientes', 'Conexão Meta + Google Ads', 'Suporte prioritário'],
                highlight: true,
                cta: 'Começar agora →',
                planKey: 'profissional',
              },
              {
                icon: '💣', tag: 'EMPRESAS E AGÊNCIAS', color: '#22C55E', border: 'rgba(34,197,94,0.3)',
                bg: 'linear-gradient(135deg, rgba(34,197,94,0.08) 0%, rgba(34,197,94,0.03) 100%)',
                title: 'Avançada',
                desc: 'Para agências e empresas que querem escalar atendimento com inteligência estratégica de alto nível.',
                price: 'R$697', priceEnd: 'até R$1.497/mês',
                features: ['Tudo do Profissional', 'Múltiplas contas e negócios', 'Comparação de mercado e performance', 'Leitura avançada de dados', 'Geração contínua de estratégias'],
                highlight: false,
                cta: 'Começar agora →',
                planKey: 'avancada',
              },
            ].map((plan) => (
              <div key={plan.title} className="relative rounded-2xl p-7 flex flex-col"
                style={{ background: plan.bg, border: `1px solid ${plan.border}` }}>
                {plan.highlight && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="text-xs font-bold px-3 py-1 rounded-full text-black"
                      style={{ background: 'linear-gradient(135deg, #F0B429, #FFD166)' }}>
                      ★ Mais popular
                    </span>
                  </div>
                )}
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-lg">{plan.icon}</span>
                  <span className="text-[10px] font-bold" style={{ color: plan.color }}>{plan.tag}</span>
                </div>
                <h3 className="font-display font-bold text-white text-xl mb-2">{plan.title}</h3>
                <p className="text-slate-500 text-xs leading-relaxed mb-5">{plan.desc}</p>
                <ul className="space-y-2 mb-6 flex-1">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-xs text-slate-300">
                      <span className="flex-shrink-0 mt-0.5" style={{ color: plan.color }}>✓</span>
                      {f}
                    </li>
                  ))}
                </ul>
                <div className="border-t pt-5" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                  <div className="font-display text-3xl font-bold mb-0.5" style={{ color: plan.color }}>{plan.price}</div>
                  <div className="text-xs text-slate-500 mb-4">{plan.priceEnd}</div>
                  <Link href={`/checkout?plan=${plan.planKey}`}
                    className="w-full flex items-center justify-center gap-2 text-sm font-bold px-5 py-3 rounded-xl hover:opacity-90 transition-opacity"
                    style={plan.highlight
                      ? { background: 'linear-gradient(135deg, #F0B429, #FFD166)', color: '#000' }
                      : { background: 'rgba(255,255,255,0.06)', border: `1px solid ${plan.border}`, color: '#fff' }
                    }>
                    {plan.cta}
                  </Link>
                </div>
              </div>
            ))}
          </div>

          {/* Implementação — upsell */}
          <div className="rounded-2xl p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6"
            style={{ background: 'linear-gradient(135deg, rgba(255,77,77,0.08) 0%, rgba(255,77,77,0.03) 100%)', border: '1px solid rgba(255,77,77,0.3)' }}>
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                style={{ background: 'rgba(255,77,77,0.15)', border: '1px solid rgba(255,77,77,0.3)' }}>
                💣
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                    style={{ color: '#FF4D4D', background: 'rgba(255,77,77,0.15)', border: '1px solid rgba(255,77,77,0.3)' }}>
                    OPCIONAL · MUITO FORTE
                  </span>
                </div>
                <h3 className="font-display font-bold text-white text-lg mb-1">Implementação</h3>
                <p className="text-slate-400 text-sm max-w-xl">
                  Execução completa das estratégias definidas no diagnóstico e na plataforma. Aqui você tira o cliente da teoria e coloca no resultado — setup de campanhas, criativos, copies e estrutura de conversão.
                </p>
                <div className="flex flex-wrap gap-2 mt-3">
                  {['Setup completo de campanhas', 'Criativos e copies', 'Estrutura de conversão', 'Resultados mensuráveis'].map((d) => (
                    <span key={d} className="text-[11px] px-2.5 py-1 rounded-full text-[#FF4D4D]"
                      style={{ background: 'rgba(255,77,77,0.08)', border: '1px solid rgba(255,77,77,0.2)' }}>
                      ✓ {d}
                    </span>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex-shrink-0 text-right">
              <div className="font-display text-3xl font-bold text-[#FF4D4D]">R$3.000</div>
              <div className="text-xs text-slate-500">até R$15.000 · por projeto</div>
              <Link href="/sign-up"
                className="mt-3 inline-flex items-center gap-2 text-sm font-bold px-5 py-2.5 rounded-xl hover:opacity-90 transition-opacity"
                style={{ background: 'rgba(255,77,77,0.15)', border: '1px solid rgba(255,77,77,0.4)', color: '#FF4D4D' }}>
                Quero implementação →
              </Link>
            </div>
          </div>

          {/* Lógica do negócio */}
          <div className="mt-8 bg-[#111114] border border-[#2A2A30] rounded-2xl p-6 text-center">
            <div className="text-xs text-slate-500 uppercase tracking-wider mb-4">Lógica completa do negócio</div>
            <div className="flex items-center justify-center gap-2 flex-wrap text-sm font-semibold">
              {[
                { label: '🔥 Confiança', color: '#F0B429' },
                { label: '→', color: '#2A2A30' },
                { label: '🔄 Recorrência', color: '#38BDF8' },
                { label: '→', color: '#2A2A30' },
                { label: '🚀 Escala', color: '#A78BFA' },
                { label: '→', color: '#2A2A30' },
                { label: '💣 Ticket alto', color: '#22C55E' },
                { label: '→', color: '#2A2A30' },
                { label: '🔥 Execução $$$', color: '#FF4D4D' },
              ].map((item, i) => (
                <span key={i} style={{ color: item.color }}>{item.label}</span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── NICHOS ────────────────────────────────────────────────────────────── */}
      <section id="nichos" className="py-24 px-6 md:px-12 border-t border-[#2A2A30]"
        style={{ background: 'rgba(240,180,41,0.02)' }}>
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <div className="text-xs text-[#F0B429] font-semibold uppercase tracking-widest mb-3">Benchmarks reais de mercado</div>
            <h2 className="font-display text-4xl font-bold text-white mb-4">
              Analista especializado no <span style={{ background: 'linear-gradient(135deg, #F0B429, #FFD166)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>seu segmento</span>
            </h2>
            <p className="text-slate-400 max-w-xl mx-auto">
              CPL, ROAS, CVR, ticket médio, sazonalidade e canais ideais para cada setor —
              dados reais do mercado brasileiro 2024–2025.
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-2.5 mb-12">
            {niches.map((niche, i) => (
              <span key={i}
                className="text-sm px-4 py-2 rounded-full font-medium transition-all hover:scale-105 cursor-default"
                style={{
                  background: i % 3 === 0 ? 'rgba(240,180,41,0.1)' : i % 3 === 1 ? 'rgba(167,139,250,0.08)' : 'rgba(34,197,94,0.07)',
                  border: i % 3 === 0 ? '1px solid rgba(240,180,41,0.25)' : i % 3 === 1 ? '1px solid rgba(167,139,250,0.2)' : '1px solid rgba(34,197,94,0.2)',
                  color: i % 3 === 0 ? '#F0B429' : i % 3 === 1 ? '#A78BFA' : '#22C55E',
                }}>
                {niche}
              </span>
            ))}
          </div>

          <div className="max-w-3xl mx-auto bg-[#111114] border border-[#2A2A30] rounded-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-[#2A2A30]">
              <span className="text-xs font-semibold text-[#F0B429] uppercase tracking-widest">Exemplo · Odontologia Estética</span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-0">
              {[
                { label: 'CPL benchmark', value: 'R$45–95', color: '#F0B429' },
                { label: 'ROAS bom',      value: '3.8×',   color: '#22C55E' },
                { label: 'CVR lead→venda', value: '15%',   color: '#A78BFA' },
                { label: 'Budget mínimo', value: 'R$2.500', color: '#38BDF8' },
              ].map((m, i) => (
                <div key={i} className="p-5 text-center border-r border-[#1E1E24] last:border-r-0">
                  <div className="text-xs text-slate-500 uppercase tracking-wider mb-2">{m.label}</div>
                  <div className="font-display text-xl font-bold" style={{ color: m.color }}>{m.value}</div>
                </div>
              ))}
            </div>
            <div className="px-6 py-4 bg-[#16161A] text-xs text-slate-500">
              <span className="text-[#F0B429] font-semibold">Canais top:</span> Meta Ads · Google Search · Instagram &nbsp;·&nbsp;
              <span className="text-[#F0B429] font-semibold">Pico:</span> Dezembro · Março
            </div>
          </div>
        </div>
      </section>

      {/* ── PARA QUEM É ───────────────────────────────────────────────────────── */}
      <section className="py-24 px-6 md:px-12 max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="font-display text-4xl font-bold text-white mb-4">Para quem é o ELYON?</h2>
        </div>
        <div className="grid md:grid-cols-3 gap-5">
          {[
            {
              icon: '🏢', title: 'Agências de marketing',
              desc: 'Gerencie múltiplos clientes com benchmarks reais por nicho. Conecte as contas de anúncio deles e tenha visão completa de CPL e ROAS em tempo real.',
              highlight: 'Plataforma Profissional ou Avançada',
            },
            {
              icon: '👤', title: 'Gestores de tráfego',
              desc: 'Saiba exatamente qual CPL aceitar, qual ROAS esperar e quais criativos convertem no nicho. NOUS responde suas dúvidas com dados reais do cliente.',
              highlight: 'Plataforma Individual ou Profissional',
            },
            {
              icon: '🏬', title: 'Donos de negócio',
              desc: 'Veja se seu marketing está acima ou abaixo do benchmark. Conecte Meta e Google Ads e entenda onde está perdendo dinheiro — sem depender de relatório de agência.',
              highlight: 'Diagnóstico → Plataforma Individual',
            },
          ].map((p, i) => (
            <div key={i} className="bg-[#111114] border border-[#2A2A30] rounded-2xl p-7">
              <div className="text-3xl mb-4">{p.icon}</div>
              <h3 className="font-display font-bold text-white text-lg mb-3">{p.title}</h3>
              <p className="text-slate-400 text-sm leading-relaxed mb-4">{p.desc}</p>
              <div className="text-xs font-semibold text-[#F0B429]">→ {p.highlight}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA FINAL ─────────────────────────────────────────────────────────── */}
      <section className="py-24 px-6 md:px-12">
        <div className="max-w-3xl mx-auto text-center">
          <div className="rounded-3xl p-14"
            style={{
              background: 'linear-gradient(135deg, rgba(240,180,41,0.12) 0%, rgba(167,139,250,0.08) 50%, rgba(34,197,94,0.05) 100%)',
              border: '1px solid rgba(240,180,41,0.3)',
            }}>
            <div className="inline-flex items-center gap-2 bg-[#0A0A0B]/60 border border-[#2A2A30] rounded-full px-4 py-2 mb-6">
              <span className="w-2 h-2 rounded-full bg-[#22C55E] animate-pulse" />
              <span className="text-xs font-semibold text-[#22C55E] tracking-widest uppercase">Diagnóstico gratuito para começar</span>
            </div>
            <h2 className="font-display text-4xl md:text-5xl font-bold text-white mb-4 leading-tight">
              Quanto você está perdendo sem benchmark?
            </h2>
            <p className="text-slate-400 text-lg mb-10 max-w-xl mx-auto leading-relaxed">
              Faça o diagnóstico gratuito agora. Em 2 minutos você sabe exatamente
              qual CPL aceitar, qual ROAS esperar e onde colocar cada real do budget.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/sign-up"
                className="inline-flex items-center justify-center gap-2 font-bold px-9 py-4 rounded-xl hover:opacity-90 transition-opacity text-lg"
                style={{ background: 'linear-gradient(135deg, #F0B429, #FFD166)', color: '#000', boxShadow: '0 0 40px rgba(240,180,41,0.3)' }}>
                Fazer diagnóstico grátis →
              </Link>
              <Link href="/sign-in"
                className="inline-flex items-center justify-center gap-2 border border-[#2A2A30] text-slate-300 font-medium px-7 py-4 rounded-xl hover:border-[#3A3A42] hover:text-white transition-colors">
                Já tenho conta
              </Link>
            </div>
            <div className="flex flex-wrap gap-x-8 gap-y-2 justify-center mt-8">
              {['Sem cartão de crédito', 'Resultado em 2 minutos', '80+ nichos cobertos', 'Dados reais 2025'].map((item) => (
                <span key={item} className="flex items-center gap-2 text-sm text-slate-500">
                  <span className="text-[#22C55E]">✓</span>{item}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#2A2A30] py-10 px-6 md:px-12">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <span className="font-display font-bold text-lg" style={{
            background: 'linear-gradient(135deg, #F0B429, #FFD166)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          }}>ELYON</span>
          <div className="flex gap-8 text-sm text-slate-600">
            <a href="#como-funciona" className="hover:text-slate-400 transition-colors">Como funciona</a>
            <a href="#features" className="hover:text-slate-400 transition-colors">Recursos</a>
            <a href="#nichos" className="hover:text-slate-400 transition-colors">Nichos</a>
            <Link href="/sign-in" className="hover:text-slate-400 transition-colors">Entrar</Link>
          </div>
          <span className="text-sm text-slate-700">© 2026 ELYON · Head of Growth com IA · Brasil</span>
        </div>
      </footer>
    </main>
  )
}
