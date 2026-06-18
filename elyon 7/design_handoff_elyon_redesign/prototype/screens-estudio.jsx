/* ELYON NOUS — Estúdio de Criação (hub + sub-navegação) ----------------- */
const { useState: useStateEst } = React;

/* Definição das 5 ferramentas do estúdio (ordem = fluxo de criação) */
function studioTools() {
  const D = window.DATA;
  const assets = (D.assets || []).length;
  const analyzed = (D.creativeVision || {}).analyzed || assets;
  const platforms = (D.contentPlatforms || []).length;
  const running = (D.abTests || []).filter(t => t.status === 'running').length;
  const score = (D.cro || {}).score || 0;
  return [
    { k: 'criar', n: 1, icon: 'rocket', title: 'Criar campanha', badge: 'IA',
      desc: 'Descreva a intenção e o NOUS monta público, verba e criativo — pronto para publicar.',
      stat: '~2 min para publicar', verb: 'Criar agora',
      accent: 'var(--blue)', c: 'var(--blue-600)', soft: 'var(--blue-soft)', line: 'var(--blue-line)' },
    { k: 'biblioteca', n: 2, icon: 'image', title: 'Biblioteca',
      desc: 'Seus criativos em um só lugar, com análise visual por IA e geração de copy.',
      stat: assets + ' criativos · ' + analyzed + ' lidos', verb: 'Abrir biblioteca',
      accent: 'var(--teal)', c: 'var(--teal)', soft: 'rgba(14,156,176,.10)', line: 'rgba(14,156,176,.28)' },
    { k: 'conteudo', n: 3, icon: 'megaphone', title: 'Conteúdo',
      desc: 'Gere posts por plataforma — gancho, legenda, CTA e hashtags em segundos.',
      stat: platforms + ' plataformas', verb: 'Gerar conteúdo',
      accent: 'var(--amber)', c: 'var(--amber)', soft: 'var(--amber-soft)', line: 'rgba(217,135,11,.28)' },
    { k: 'abtest', n: 4, icon: 'scale', title: 'Teste A/B',
      desc: 'Compare variantes de criativo e deixe os dados elegerem o vencedor.',
      stat: running + ' testes ativos', verb: 'Ver testes',
      accent: 'var(--slate)', c: 'var(--slate)', soft: 'rgba(100,116,139,.10)', line: 'rgba(100,116,139,.28)' },
    { k: 'cro', n: 5, icon: 'target', title: 'Otimização (CRO)',
      desc: 'Encontre o gargalo de conversão e aja com impacto estimado no CPL.',
      stat: 'Score ' + score + '/100', verb: 'Otimizar',
      accent: 'var(--green)', c: 'var(--green-600)', soft: 'var(--green-soft)', line: 'var(--green-line)' },
  ];
}

/* ── Sub-navegação do estúdio (conecta as ferramentas) ─────────────────── */
function StudioTabs({ active, onNav }) {
  const tools = studioTools();
  const tab = (k, label, icon, isHub) => {
    const on = active === k;
    return (
      <button key={k} onClick={() => onNav(k)}
        style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '7px 14px', borderRadius: 'var(--r-pill)',
          border: `1px solid ${on ? 'var(--blue-line)' : 'var(--line)'}`, background: on ? 'var(--blue-soft)' : 'var(--paper)',
          color: on ? 'var(--blue-600)' : 'var(--ink-2)', fontSize: 13, fontWeight: on ? 600 : 500, whiteSpace: 'nowrap',
          transition: 'all .15s', flexShrink: 0, boxShadow: on ? 'none' : 'var(--sh-1)' }}>
        <Icon name={icon} size={15} w={on ? 2 : 1.8} />{label}
      </button>
    );
  };
  return (
    <div className="no-sb" style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4, marginBottom: 18, alignItems: 'center' }}>
      {tab('estudio', 'Estúdio', 'sparkle2', true)}
      <span style={{ width: 1, height: 22, background: 'var(--line)', flexShrink: 0, margin: '0 2px' }} />
      {tools.map(t => tab(t.k, t.title, t.icon))}
    </div>
  );
}

/* ── Ribbon do fluxo (contexto visual: criar → guardar → produzir → …) ─── */
function FlowRibbon() {
  const steps = [['Criar', 'rocket'], ['Guardar', 'image'], ['Produzir', 'megaphone'], ['Testar', 'scale'], ['Otimizar', 'target']];
  return (
    <div className="no-sb" style={{ display: 'flex', alignItems: 'center', gap: 4, overflowX: 'auto', padding: '2px 0' }}>
      {steps.map(([l, ic], i) => (
        <React.Fragment key={l}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '6px 12px', borderRadius: 'var(--r-pill)', background: 'var(--canvas-2)', border: '1px solid var(--line)', flexShrink: 0 }}>
            <span style={{ color: 'var(--ink-3)', display: 'flex' }}><Icon name={ic} size={13} /></span>
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink-2)' }}>{l}</span>
          </div>
          {i < steps.length - 1 && <span style={{ color: 'var(--ink-4)', flexShrink: 0, display: 'flex' }}><Icon name="arrowR" size={14} /></span>}
        </React.Fragment>
      ))}
    </div>
  );
}

/* ── Card de ferramenta ────────────────────────────────────────────────── */
function ToolCard({ t, onNav, i }) {
  const [h, setH] = useStateEst(false);
  return (
    <button onClick={() => onNav(t.k)} onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
      className="fade-up" style={{ animationDelay: `${i * 0.05}s`, textAlign: 'left', display: 'flex', flexDirection: 'column', gap: 12,
        background: 'var(--paper)', border: `1px solid ${h ? t.line : 'var(--line)'}`, borderRadius: 'var(--r-lg)', padding: 18,
        boxShadow: h ? 'var(--sh-2)' : 'var(--sh-1)', transform: h ? 'translateY(-3px)' : 'none', transition: 'all .2s cubic-bezier(.22,1,.36,1)', cursor: 'pointer' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ width: 42, height: 42, borderRadius: 'var(--r-md)', background: t.soft, color: t.c, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Icon name={t.icon} size={20} /></span>
        <span className="mono" style={{ fontSize: 11, fontWeight: 600, color: 'var(--ink-4)' }}>0{t.n}</span>
      </div>
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <span style={{ fontSize: 16, fontWeight: 700, letterSpacing: '-.02em' }}>{t.title}</span>
          {t.badge && <Badge tone="blue" style={{ padding: '1px 7px', fontSize: 9.5 }}>{t.badge}</Badge>}
        </div>
        <p style={{ fontSize: 13, color: 'var(--ink-2)', lineHeight: 1.55, margin: 0 }}>{t.desc}</p>
      </div>
      <div style={{ marginTop: 'auto', paddingTop: 12, borderTop: '1px solid var(--line-2)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11.5, fontWeight: 600, color: t.c }}>
          <span style={{ width: 6, height: 6, borderRadius: 99, background: t.accent }} />{t.stat}
        </span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12.5, fontWeight: 600, color: h ? t.c : 'var(--ink-3)', transition: 'color .15s' }}>
          {t.verb} <Icon name="arrowR" size={14} style={{ transform: h ? 'translateX(2px)' : 'none', transition: 'transform .2s' }} />
        </span>
      </div>
    </button>
  );
}

/* ═══ ESTÚDIO — hub ══════════════════════════════════════════════════════ */
function Estudio({ mode, onNav }) {
  const tools = studioTools();
  const [intent, setIntent] = useStateEst('');
  const D = window.DATA;
  const examples = (D.campaignBuilder && D.campaignBuilder.examples) || ['Gerar leads de crédito em SP', 'Escalar campanha de melhor ROAS', 'Criar conteúdo para Instagram'];
  const go = () => { onNav('criar'); };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      {/* Hero escuro — prompt do NOUS */}
      <div className="fade-up sheen" style={{ borderRadius: 'var(--r-lg)', overflow: 'hidden', boxShadow: 'var(--sh-ink)', border: '1px solid var(--ink-line)',
        background: 'radial-gradient(130% 130% at 6% -10%, rgba(43,91,227,.32), transparent 46%), radial-gradient(120% 130% at 102% 120%, rgba(14,156,176,.18), transparent 52%), var(--ink-surface)', padding: '26px 26px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 13, marginBottom: 16 }}>
          <NousOrb size={46} />
          <div>
            <div className="eyebrow" style={{ color: 'var(--blue-500)' }}>Estúdio de Criação · NOUS IA</div>
            <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-.025em', color: 'var(--on-ink)', marginTop: 3 }}>O que você quer criar hoje?</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 260, display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(255,255,255,.06)', border: '1px solid var(--ink-line)', borderRadius: 'var(--r-md)', padding: '4px 4px 4px 15px' }}>
            <input value={intent} onChange={e => setIntent(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') go(); }}
              placeholder="Descreva uma campanha, peça um criativo ou um post…"
              style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: 'var(--on-ink)', fontSize: 14, fontFamily: 'var(--sans)' }} />
            <Button variant="primary" icon="sparkle2" onClick={go}>Começar</Button>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap', marginTop: 13 }}>
          {examples.slice(0, 3).map((ex, i) => (
            <button key={i} onClick={() => { setIntent(ex); go(); }} style={{ fontSize: 11.5, color: 'var(--on-ink-2)', background: 'rgba(255,255,255,.05)', border: '1px solid var(--ink-line)', borderRadius: 'var(--r-pill)', padding: '6px 12px' }}>{ex}</button>
          ))}
        </div>
      </div>

      {/* Fluxo */}
      <div>
        <div className="eyebrow" style={{ marginBottom: 10 }}>O fluxo de criação</div>
        <FlowRibbon />
      </div>

      {/* Ferramentas */}
      <div style={{ display: 'grid', gap: 14, gridTemplateColumns: 'repeat(auto-fit, minmax(232px, 1fr))' }}>
        {tools.map((t, i) => <ToolCard key={t.k} t={t} onNav={onNav} i={i} />)}
      </div>

      {/* Sugestão do NOUS — próximo passo */}
      <Card hover onClick={() => onNav('biblioteca')} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
        <span style={{ width: 40, height: 40, borderRadius: 'var(--r-md)', background: 'var(--amber-soft)', color: 'var(--amber)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Icon name="bolt" size={19} /></span>
        <div style={{ flex: 1, minWidth: 220 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 14, fontWeight: 700, letterSpacing: '-.01em' }}>Sugestão do NOUS</span>
            <Badge tone="warn" dot>Ação rápida</Badge>
          </div>
          <div style={{ fontSize: 13, color: 'var(--ink-2)', marginTop: 3, lineHeight: 1.5 }}>3 criativos entraram em fadiga na Biblioteca. Gere variações antes que o CTR caia mais.</div>
        </div>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600, color: 'var(--blue-600)' }}>Revisar criativos <Icon name="arrowR" size={14} /></span>
      </Card>
    </div>
  );
}

Object.assign(window, { Estudio, StudioTabs });
