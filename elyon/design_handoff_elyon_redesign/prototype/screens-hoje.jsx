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

/* What-changed chip */
function ChangeChip({ c }) {
  const tone = c.tone === 'good' ? TONES.good : c.tone === 'bad' ? TONES.bad : TONES.warn;
  const icon = c.icon === 'up' ? 'arrowUp' : c.icon === 'down' ? 'arrowDown' : 'flag';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 13px', background: 'var(--paper)',
      border: '1px solid var(--line)', borderRadius: 'var(--r-sm)', flex: 1, minWidth: 0 }}>
      <span style={{ width: 30, height: 30, borderRadius: 8, flexShrink: 0, background: tone.bg, color: tone.c, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Icon name={icon} size={16} w={2.2} />
      </span>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 12.5, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.text}</div>
        <div style={{ fontSize: 11, color: 'var(--ink-3)' }}>{c.sub}</div>
      </div>
    </div>
  );
}

/* Briefing hero */
function BriefingHero({ mode, onNav }) {
  const D = window.DATA;
  return (
    <Card pad={0} style={{ overflow: 'hidden' }} className="fade-up">
      <div style={{ display: 'flex', gap: 18, padding: 20, alignItems: 'flex-start',
        background: 'linear-gradient(110deg, var(--blue-soft) 0%, transparent 42%, var(--green-soft) 100%)' }}>
        <NousOrb size={48} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="eyebrow" style={{ color: 'var(--blue-600)', marginBottom: 5 }}>Briefing do NOUS · hoje, 12 jun</div>
          <div style={{ fontSize: mode === 'simple' ? 21 : 18, fontWeight: 700, letterSpacing: '-.02em', lineHeight: 1.25 }}>{D.briefing.headline}</div>
          <p style={{ fontSize: 14, color: 'var(--ink-2)', lineHeight: 1.6, margin: '9px 0 0', maxWidth: 720 }}>{D.briefing.summary}</p>
          <div style={{ display: 'flex', gap: 10, marginTop: 16, flexWrap: 'wrap' }}>
            <Button variant="primary" icon="bolt" onClick={() => onNav('plano')}>Ver meu plano de hoje</Button>
            <Button variant="ghost" icon="sparkle2" onClick={() => onNav('__nous__')}>Perguntar ao NOUS</Button>
          </div>
        </div>
      </div>
      {mode === 'pro' && (
        <div style={{ display: 'flex', gap: 10, padding: '14px 20px', borderTop: '1px solid var(--line)', background: 'var(--paper-2)' }}>
          {D.briefing.changed.map((c, i) => <ChangeChip key={i} c={c} />)}
        </div>
      )}
    </Card>
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

Object.assign(window, { Hoje, BriefingHero, HealthCard, PriorityActions, Goals, AlertsList, Streak });
