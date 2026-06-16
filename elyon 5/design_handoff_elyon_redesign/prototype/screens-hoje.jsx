/* ELYON NOUS — "Hoje" (daily home, habit center) ----------------------- */
const { useState: useStateH } = React;

/* Streak / gamification chip */
function Streak({ days }) {
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '6px 12px', borderRadius: 'var(--r-pill)',
      background: 'var(--amber-soft)', border: '1px solid #F2DDB0' }}>
      <span style={{ color: 'var(--amber)' }}><Icon name="fire" size={16} /></span>
      <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--amber)' }}>{days} dias seguidos</span>
    </div>
  );
}

/* What-changed card (texto completo, sem corte) */
function ChangeChip({ c }) {
  const tone = c.tone === 'good' ? TONES.good : c.tone === 'bad' ? TONES.bad : TONES.warn;
  const icon = c.icon === 'up' ? 'arrowUp' : c.icon === 'down' ? 'arrowDown' : 'flag';
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 11, padding: '13px 14px', background: 'var(--paper)',
      border: '1px solid var(--line)', borderRadius: 'var(--r-md)', flex: '1 1 240px', minWidth: 0, transition: 'border-color .18s, box-shadow .18s' }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--blue-line)'; e.currentTarget.style.boxShadow = 'var(--sh-2)'; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--line)'; e.currentTarget.style.boxShadow = 'none'; }}>
      <span style={{ width: 32, height: 32, borderRadius: 9, flexShrink: 0, background: tone.bg, color: tone.c, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Icon name={icon} size={16} w={2.2} />
      </span>
      <div style={{ minWidth: 0, flex: 1 }}>
        <div style={{ fontSize: 13, fontWeight: 600, lineHeight: 1.35 }}>{c.text}</div>
        <div style={{ fontSize: 11.5, color: 'var(--ink-3)', marginTop: 2, lineHeight: 1.4 }}>{c.sub}</div>
      </div>
    </div>
  );
}

/* Briefing hero — superfície escura "command center": insight → ação */
function BriefingHero({ mode, onNav }) {
  const D = window.DATA;
  const ghostBtn = {
    display: 'inline-flex', alignItems: 'center', gap: 7, padding: '9px 15px', fontSize: 13.5, fontWeight: 600,
    borderRadius: 'var(--r-sm)', background: 'rgba(255,255,255,.06)', color: 'var(--on-ink)',
    border: '1px solid var(--ink-line)', transition: 'background .15s',
  };
  return (
    <div className="fade-up sheen" style={{ borderRadius: 'var(--r-lg)', overflow: 'hidden', boxShadow: 'var(--sh-ink)', border: '1px solid var(--ink-line)',
      background: 'radial-gradient(135% 130% at 6% -10%, rgba(43,91,227,.34), transparent 46%), radial-gradient(120% 130% at 102% 120%, rgba(14,156,176,.20), transparent 52%), var(--ink-surface)' }}>
      <div style={{ padding: '24px 26px', display: 'flex', gap: 22, alignItems: 'flex-start', flexWrap: 'wrap' }}>
        <NousOrb size={50} />
        <div style={{ flex: 1, minWidth: 280 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 9, flexWrap: 'wrap' }}>
            <span className="eyebrow" style={{ color: 'var(--blue-500)' }}>Briefing do NOUS</span>
            <span className="mono" style={{ fontSize: 10.5, letterSpacing: '.12em', color: 'var(--on-ink-3)' }}>HOJE, 12 JUN</span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginLeft: 2 }}>
              <span className="live-dot" /><span className="mono" style={{ fontSize: 10, color: 'var(--green-500)', letterSpacing: '.06em' }}>ATUALIZADO AGORA</span>
            </span>
          </div>
          <div style={{ fontSize: mode === 'simple' ? 24 : 21, fontWeight: 700, letterSpacing: '-.025em', lineHeight: 1.22, color: 'var(--on-ink)' }}>{D.briefing.headline}</div>
          <p style={{ fontSize: 14, color: 'var(--on-ink-2)', lineHeight: 1.65, margin: '11px 0 0', maxWidth: 680 }}>{D.briefing.summary}</p>
          <div style={{ display: 'flex', gap: 10, marginTop: 18, flexWrap: 'wrap' }}>
            <Button variant="primary" icon="bolt" onClick={() => onNav('plano')}>Ver meu plano de hoje</Button>
            <button style={ghostBtn} onClick={() => onNav('__nous__')}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,.12)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,.06)'}>
              <Icon name="sparkle2" size={15} /> Perguntar ao NOUS
            </button>
          </div>
        </div>
        {/* Destaque: ganho rápido — dados virando ação em R$ */}
        <div style={{ minWidth: 188, flex: '0 1 220px', alignSelf: 'stretch', padding: '15px 16px', borderRadius: 'var(--r-md)',
          background: 'rgba(255,255,255,.05)', border: '1px solid var(--ink-line)', display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span className="eyebrow" style={{ color: 'var(--on-ink-3)' }}>Ganhos rápidos</span>
          <span className="mono count-up" style={{ fontSize: 25, fontWeight: 700, letterSpacing: '-.03em', color: 'var(--green-500)', whiteSpace: 'nowrap' }}>+R$ 41,8 mil</span>
          <span style={{ fontSize: 11.5, color: 'var(--on-ink-2)', lineHeight: 1.4 }}>esperando sua aprovação no plano de hoje</span>
          <button onClick={() => onNav('plano')} style={{ marginTop: 'auto', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            padding: '8px 12px', borderRadius: 'var(--r-sm)', border: '1px solid var(--ink-line)', background: 'rgba(255,255,255,.06)', color: 'var(--on-ink)',
            fontSize: 12.5, fontWeight: 600, transition: 'background .15s' }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,.12)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,.06)'}>
            Revisar e aprovar <Icon name="arrowR" size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}

/* O que mudou — linha de cards (texto completo, sem corte) */
function WhatChanged() {
  const D = window.DATA;
  return (
    <div>
      <div className="eyebrow" style={{ marginBottom: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
        <span className="live-dot" /> O que mudou desde ontem
      </div>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        {D.briefing.changed.map((c, i) => <ChangeChip key={i} c={c} />)}
      </div>
    </div>
  );
}

/* Health score card */
function HealthCard({ mode }) {
  const D = window.DATA, h = D.health;
  const tone = h.score >= 75 ? 'var(--green)' : h.score >= 55 ? 'var(--amber)' : 'var(--red)';
  return (
    <Card hover style={{ display: 'flex', flexDirection: 'column' }}>
      <SectionHead title="Saúde do negócio" sub="Índice geral · evolui todo dia" icon="pulse"
        right={<Delta v={h.delta} good="up" suffix=" pts" />} />
      <div style={{ display: 'flex', gap: 18, alignItems: 'center' }}>
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <Gauge value={h.score} size={mode === 'simple' ? 150 : 132} tone={tone} sub={h.label.toUpperCase()} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="eyebrow" style={{ marginBottom: 7 }}>Últimos 7 dias</div>
          <Sparkline data={h.history} color={tone} h={42} />
          <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 7 }}>
            {h.pillars.slice(0, mode === 'simple' ? 3 : 6).map((p) => (
              <div key={p.k} style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                <span style={{ fontSize: 11.5, color: 'var(--ink-2)', width: 74, flexShrink: 0 }}>{p.k}</span>
                <div style={{ flex: 1 }}><ProgressBar pct={p.v} color={p.v >= 75 ? 'var(--green)' : p.v >= 55 ? 'var(--amber)' : 'var(--red)'} h={6} /></div>
                <span className="mono" style={{ fontSize: 11.5, fontWeight: 600, width: 26, textAlign: 'right' }}>{p.v}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
}

/* Priority action item */
function ActionItem({ a, onNav, rank }) {
  const D = window.DATA;
  const uTone = a.urgency === 'alta' ? 'bad' : a.urgency === 'média' ? 'warn' : 'neutral';
  const effortDots = a.effort === 'Baixo' ? 1 : a.effort === 'Médio' ? 2 : 3;
  return (
    <div style={{ display: 'flex', gap: 13, padding: '14px 4px', borderBottom: '1px solid var(--line-2)', alignItems: 'center' }}
      className="fade-up">
      <div style={{ width: 28, height: 28, borderRadius: 8, flexShrink: 0, background: 'var(--canvas-2)', display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 13, fontWeight: 700 }} className="mono">{rank}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
          <span style={{ fontSize: 14, fontWeight: 600, letterSpacing: '-.01em' }}>{a.title}</span>
          <Badge tone={uTone}>{a.urgency}</Badge>
        </div>
        <div style={{ fontSize: 12.5, color: 'var(--ink-3)', lineHeight: 1.45 }}>{a.why}</div>
      </div>
      <div style={{ textAlign: 'right', flexShrink: 0 }}>
        <div className="eyebrow" style={{ marginBottom: 2 }}>Impacto</div>
        <div className="mono" style={{ fontSize: 15, fontWeight: 700, color: 'var(--green-600)' }}>+{D.fmt.brl(a.impact)}</div>
        <div style={{ display: 'flex', gap: 3, justifyContent: 'flex-end', marginTop: 4, alignItems: 'center' }}>
          <span style={{ fontSize: 10.5, color: 'var(--ink-4)', marginRight: 3 }}>esforço</span>
          {[1, 2, 3].map(d => <span key={d} style={{ width: 6, height: 6, borderRadius: 99, background: d <= effortDots ? 'var(--ink-3)' : 'var(--line)' }} />)}
        </div>
      </div>
      <Button size="sm" variant="soft" onClick={() => onNav('plano')} iconRight="arrowR">Ver</Button>
    </div>
  );
}

function PriorityActions({ mode, onNav }) {
  const D = window.DATA;
  const list = mode === 'simple' ? D.actions.slice(0, 3) : D.actions;
  const total = list.reduce((a, x) => a + x.impact, 0);
  return (
    <Card hover>
      <SectionHead title={mode === 'simple' ? 'O que fazer agora' : 'Ações prioritárias'} icon="bolt"
        sub={mode === 'simple' ? 'As 3 ações de maior impacto' : `${D.actions.length} ações priorizadas pelo NOUS`}
        right={<div style={{ textAlign: 'right' }}>
          <div className="eyebrow">Ganho potencial</div>
          <div className="mono" style={{ fontSize: 15, fontWeight: 700, color: 'var(--green-600)' }}>+{D.fmt.brl(total)}</div>
        </div>} />
      <div>
        {list.map((a, i) => <ActionItem key={a.id} a={a} rank={i + 1} onNav={onNav} />)}
      </div>
      <Button variant="ghost" full style={{ marginTop: 12 }} onClick={() => onNav('plano')} iconRight="arrowR">Abrir plano de ação completo</Button>
    </Card>
  );
}

/* Goals (gamification) */
function Goals() {
  const D = window.DATA;
  return (
    <Card hover>
      <SectionHead title="Metas do mês" icon="trophy" sub="Seu progresso rumo aos alvos" />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {D.goals.map((g) => {
          const pct = Math.min(100, Math.round((g.cur / g.target) * 100));
          const fmt = D.fmt[g.fmt];
          return (
            <div key={g.k}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 7 }}>
                <span style={{ fontSize: 13, fontWeight: 600 }}>{g.k}</span>
                <span className="mono" style={{ fontSize: 12.5, color: 'var(--ink-2)' }}>
                  <b style={{ color: 'var(--ink)' }}>{fmt(g.cur)}</b> / {fmt(g.target)}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ flex: 1 }}><ProgressBar pct={pct} color={pct >= 80 ? 'var(--green)' : 'var(--blue)'} h={9} /></div>
                <span className="mono" style={{ fontSize: 12, fontWeight: 700, color: pct >= 80 ? 'var(--green-600)' : 'var(--blue-600)', width: 36, textAlign: 'right' }}>{pct}%</span>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

/* Alerts list */
function AlertsList() {
  const D = window.DATA;
  return (
    <Card hover>
      <SectionHead title="Alertas proativos" icon="alert" sub="O NOUS monitora 24/7" right={<Badge tone="bad" dot>3 novos</Badge>} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {D.alerts.map((a, i) => {
          const t = TONES[a.tone];
          const icon = a.tone === 'bad' ? 'alert' : a.tone === 'warn' ? 'flag' : 'spark';
          return (
            <div key={i} style={{ display: 'flex', gap: 11, padding: '11px 12px', borderRadius: 'var(--r-sm)', background: t.bg, border: `1px solid ${t.b}` }}>
              <span style={{ color: t.c, flexShrink: 0, marginTop: 1 }}><Icon name={icon} size={16} /></span>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: t.c }}>{a.title}</div>
                <div style={{ fontSize: 12, color: 'var(--ink-2)', lineHeight: 1.45, marginTop: 2 }}>{a.body}</div>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

/* ── Hoje composed ──────────────────────────────────────────────────────── */
function Hoje({ mode, onNav }) {
  const D = window.DATA;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Greeting */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontSize: 23, fontWeight: 700, letterSpacing: '-.02em', margin: 0 }}>Bom dia, {D.user.first} 👋</h1>
          <p style={{ fontSize: 13.5, color: 'var(--ink-3)', margin: '3px 0 0' }}>Quinta-feira, 12 de junho · {D.company.name}</p>
        </div>
        <Streak days={D.user.streak} />
      </div>

      <BriefingHero mode={mode} onNav={onNav} />

      {mode === 'pro' && <WhatChanged />}

      {/* KPI strip */}
      <div className="auto-kpi">
        {(mode === 'simple' ? D.kpis.slice(0, 4) : D.kpis).map((k, i) => (
          <div key={k.k} className="fade-up" style={{ animationDelay: `${i * 0.04}s` }}><StatCard kpi={k} compact={mode === 'pro'} /></div>
        ))}
      </div>

      {/* Main grid */}
      <div className="split-narrow">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <HealthCard mode={mode} />
          <Goals />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <PriorityActions mode={mode} onNav={onNav} />
          <AlertsList />
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { Hoje, BriefingHero, WhatChanged, HealthCard, PriorityActions, Goals, AlertsList, Streak });
