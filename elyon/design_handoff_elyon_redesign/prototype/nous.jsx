/* ELYON NOUS — copilot (orb + right rail) ------------------------------- */
const { useState: useStateN, useRef: useRefN, useEffect: useEffectN } = React;

/* ── NOUS orb (animated brand mark, original geometry) ──────────────────── */
function NousOrb({ size = 40, pulse = true, thinking = false }) {
  const id = React.useMemo(() => 'orb' + Math.random().toString(36).slice(2, 6), []);
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" style={{ display: 'block' }}>
      <defs>
        <radialGradient id={id} cx="50%" cy="42%" r="60%">
          <stop offset="0%" stopColor="#5B9BFF" />
          <stop offset="55%" stopColor="#2C5FE0" />
          <stop offset="100%" stopColor="#0E9CB0" />
        </radialGradient>
      </defs>
      <circle cx="24" cy="24" r="22" fill="none" stroke="#2C5FE0" strokeOpacity="0.18" strokeWidth="1" />
      <circle cx="24" cy="24" r="22" fill="none" stroke="#0E9CB0" strokeOpacity="0.25" strokeWidth="1.4"
        strokeDasharray="34 100" strokeLinecap="round"
        style={{ transformOrigin: '24px 24px', animation: thinking ? 'spin 1.4s linear infinite' : 'spin 9s linear infinite' }} />
      <circle cx="24" cy="24" r="13" fill={`url(#${id})`}
        style={{ animation: pulse ? 'orbPulse 2.6s ease-in-out infinite' : 'none' }} />
      <circle cx="20" cy="20" r="3.6" fill="#fff" fillOpacity="0.9" />
      <circle cx="28" cy="27" r="1.8" fill="#fff" fillOpacity="0.55" />
    </svg>
  );
}

/* ── Insight card ───────────────────────────────────────────────────────── */
function InsightCard({ a, onAct }) {
  const t = TONES[a.tone] || TONES.neutral;
  const icon = a.tone === 'bad' ? 'alert' : a.tone === 'warn' ? 'flag' : 'spark';
  return (
    <div style={{ background: 'var(--paper)', border: `1px solid var(--line)`, borderRadius: 'var(--r-sm)',
      padding: 13, borderLeft: `3px solid ${t.c}`, transition: 'box-shadow .15s' }}
      onMouseEnter={e => e.currentTarget.style.boxShadow = 'var(--sh-2)'}
      onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 6 }}>
        <span style={{ color: t.c, display: 'flex' }}><Icon name={icon} size={14} /></span>
        <span style={{ fontSize: 13, fontWeight: 600, flex: 1, letterSpacing: '-.01em' }}>{a.title}</span>
        <Badge tone={a.tone}>{a.tag}</Badge>
      </div>
      <div style={{ fontSize: 12, color: 'var(--ink-2)', lineHeight: 1.5 }}>{a.body}</div>
      <button onClick={onAct} style={{ marginTop: 9, background: 'none', border: 'none', padding: 0,
        color: 'var(--blue)', fontSize: 12, fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
        Ver detalhes <Icon name="arrowR" size={13} />
      </button>
    </div>
  );
}

/* ── Chat bubble ────────────────────────────────────────────────────────── */
function Bubble({ role, children }) {
  const me = role === 'me';
  return (
    <div style={{ display: 'flex', justifyContent: me ? 'flex-end' : 'flex-start', marginBottom: 10 }} className="fade-up">
      <div style={{ maxWidth: '85%', padding: '10px 13px', borderRadius: 12, fontSize: 13, lineHeight: 1.5,
        background: me ? 'var(--blue)' : 'var(--paper)', color: me ? '#fff' : 'var(--ink)',
        border: me ? 'none' : '1px solid var(--line)', borderBottomRightRadius: me ? 3 : 12, borderBottomLeftRadius: me ? 12 : 3 }}>
        {children}
      </div>
    </div>
  );
}

/* ── NOUS rail (the always-present copilot) ─────────────────────────────── */
function NousRail({ open, onToggle, mode, onNavigate, docked = true }) {
  const D = window.DATA;
  const [tab, setTab] = useStateN('insights');
  const [thread, setThread] = useStateN([]);
  const [typing, setTyping] = useStateN(false);
  const [input, setInput] = useStateN('');
  const scrollRef = useRefN(null);

  const ANSWERS = {
    default: 'Analisei seus dados dos últimos 7 dias. O ponto mais urgente é o CPA do Google Search, 18,7% acima da meta — corrigir pode liberar R$ 22,3 mil. Em paralelo, há R$ 53,8 mil em ganho escalando o remarketing do Meta (ROAS 4,8x). Quer que eu prepare o plano?',
    pausar: 'Recomendo pausar 2 campanhas: "Lead Gen | B2B" (LinkedIn, ROAS 1,9x) e os criativos em fadiga de "Video Views". Juntas drenam ~R$ 6,2 mil/semana com retorno abaixo da meta.',
    cpa: 'Os maiores CPAs estão no LinkedIn (R$ 63,90) e no Google Search de termos genéricos. Ajustar lances e negativar 14 termos deve reduzir o CPA médio em ~9%.',
    semana: 'Esta semana: (1) reduzir CPA do Google Search, (2) escalar remarketing Meta, (3) renovar 3 criativos em fadiga. Impacto somado estimado: +R$ 88,7 mil em receita.',
    roas: 'TikTok lidera em ROAS (4,1x) com o menor CPA (R$ 25,16), seguido por Meta (3,4x). LinkedIn está abaixo da meta (1,9x).',
  };
  const pick = (q) => {
    const s = q.toLowerCase();
    if (s.includes('pausar')) return ANSWERS.pausar;
    if (s.includes('cpa') || s.includes('gasto')) return ANSWERS.cpa;
    if (s.includes('semana') || s.includes('fazer')) return ANSWERS.semana;
    if (s.includes('roas') || s.includes('canais')) return ANSWERS.roas;
    return ANSWERS.default;
  };
  const ask = (q) => {
    if (!q.trim()) return;
    setTab('perguntas');
    setThread(t => [...t, { role: 'me', text: q }]);
    setInput(''); setTyping(true);
    setTimeout(() => {
      setTyping(false);
      setThread(t => [...t, { role: 'nous', text: pick(q) }]);
    }, 1100);
  };
  useEffectN(() => { if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight; }, [thread, typing]);

  if (!open) {
    return (
      <button onClick={onToggle} title="Abrir NOUS"
        style={{ position: 'fixed', right: 22, bottom: 22, zIndex: 200, border: 'none', background: 'var(--paper)',
          borderRadius: 'var(--r-pill)', padding: '8px 8px 8px 14px', boxShadow: 'var(--sh-3)', display: 'flex',
          alignItems: 'center', gap: 9, cursor: 'pointer' }} className="scale-in">
        <span style={{ fontSize: 13, fontWeight: 600 }}>Perguntar ao NOUS</span>
        <NousOrb size={34} />
      </button>
    );
  }

  const panel = (
    <aside style={{ width: 340, flexShrink: 0, height: '100vh', background: 'var(--paper)',
      borderLeft: '1px solid var(--line)', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ padding: '16px 16px 12px', borderBottom: '1px solid var(--line)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
          <NousOrb size={40} thinking={typing} />
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
              <span style={{ fontSize: 15, fontWeight: 700, letterSpacing: '.02em' }}>NOUS</span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 10.5 }} className="mono">
                <span className="pulse-dot" /> <span style={{ color: 'var(--green-600)' }}>online</span>
              </span>
            </div>
            <div style={{ fontSize: 11.5, color: 'var(--ink-3)' }}>Inteligência que decide</div>
          </div>
          <button onClick={onToggle} title="Recolher" style={{ background: 'none', border: 'none', color: 'var(--ink-3)', padding: 4 }}>
            <Icon name="chevR" size={18} />
          </button>
        </div>
        <div style={{ display: 'flex', gap: 2, marginTop: 13, background: 'var(--canvas-2)', borderRadius: 'var(--r-sm)', padding: 3 }}>
          {[['insights', 'Insights'], ['perguntas', 'Perguntas']].map(([k, l]) => (
            <button key={k} onClick={() => setTab(k)}
              style={{ flex: 1, padding: '6px', fontSize: 12.5, fontWeight: tab === k ? 600 : 500, border: 'none', borderRadius: 6,
                background: tab === k ? 'var(--paper)' : 'transparent', color: tab === k ? 'var(--ink)' : 'var(--ink-3)',
                boxShadow: tab === k ? 'var(--sh-1)' : 'none', transition: 'all .15s' }}>{l}</button>
          ))}
        </div>
      </div>

      {/* Body */}
      {tab === 'insights' ? (
        <div className="no-sb" style={{ flex: 1, overflowY: 'auto', padding: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ background: 'linear-gradient(135deg, var(--blue-soft), var(--green-soft))', border: '1px solid var(--blue-line)',
            borderRadius: 'var(--r-md)', padding: 14 }} className="fade-up">
            <div className="eyebrow" style={{ color: 'var(--blue-600)', marginBottom: 6 }}>Briefing de hoje</div>
            <div style={{ fontSize: 13, lineHeight: 1.55, color: 'var(--ink)' }}>{D.briefing.summary}</div>
            <Button size="sm" variant="primary" icon="bolt" style={{ marginTop: 11 }} onClick={() => onNavigate && onNavigate('plano')}>Ver plano sugerido</Button>
          </div>
          <div className="eyebrow" style={{ marginTop: 4 }}>Insights em destaque</div>
          {D.alerts.map((a, i) => <div key={i} className="fade-up" style={{ animationDelay: `${i * 0.06}s` }}><InsightCard a={a} onAct={() => onNavigate && onNavigate('diagnostico')} /></div>)}
        </div>
      ) : (
        <div ref={scrollRef} className="no-sb" style={{ flex: 1, overflowY: 'auto', padding: 14 }}>
          {thread.length === 0 && (
            <div style={{ color: 'var(--ink-3)', fontSize: 12.5, textAlign: 'center', padding: '20px 8px' }}>
              <NousOrb size={48} pulse={false} />
              <div style={{ marginTop: 10 }}>Pergunte qualquer coisa sobre seus dados.</div>
            </div>
          )}
          {thread.map((m, i) => <Bubble key={i} role={m.role}>{m.text}</Bubble>)}
          {typing && (
            <Bubble role="nous"><span style={{ display: 'inline-flex', gap: 3 }}>
              {[0, 1, 2].map(d => <span key={d} style={{ width: 6, height: 6, borderRadius: 99, background: 'var(--ink-4)', animation: `pulseDot 1s ease-in-out ${d * 0.15}s infinite` }} />)}
            </span></Bubble>
          )}
        </div>
      )}

      {/* Suggestions + input */}
      <div style={{ borderTop: '1px solid var(--line)', padding: 12, background: 'var(--paper-2)' }}>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
          {D.suggestions.slice(0, 3).map((s, i) => (
            <button key={i} onClick={() => ask(s)} style={{ fontSize: 11.5, color: 'var(--ink-2)', background: 'var(--paper)',
              border: '1px solid var(--line)', borderRadius: 'var(--r-pill)', padding: '5px 10px', transition: 'all .15s' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--blue-line)'; e.currentTarget.style.color = 'var(--blue-600)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--line)'; e.currentTarget.style.color = 'var(--ink-2)'; }}>{s}</button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 7, alignItems: 'center', background: 'var(--paper)', border: '1px solid var(--line)',
          borderRadius: 'var(--r-pill)', padding: '5px 5px 5px 14px' }}>
          <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && ask(input)}
            placeholder="Pergunte ao NOUS…" style={{ flex: 1, border: 'none', outline: 'none', fontSize: 13, background: 'transparent', color: 'var(--ink)' }} />
          <button onClick={() => ask(input)} style={{ width: 32, height: 32, borderRadius: 99, border: 'none', background: 'var(--blue)',
            color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Icon name="send" size={15} /></button>
        </div>
      </div>
    </aside>
  );

  if (docked) return panel;
  return (
    <>
      <div className="nous-backdrop" onClick={onToggle} />
      <div className="nous-overlay">{panel}</div>
    </>
  );
}

Object.assign(window, { NousOrb, NousRail, InsightCard });
