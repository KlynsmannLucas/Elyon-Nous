/* ELYON NOUS — app shell (sidebar + topbar) ---------------------------- */
const { useState: useStateS, useEffect: useEffectShell } = React;

/* ── Logo mark (geometric, blue→teal) ───────────────────────────────────── */
function Logo({ size = 30, withText = true }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <svg width={size} height={size} viewBox="0 0 32 32" style={{ flexShrink: 0 }}>
        <defs><linearGradient id="lgmk" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#2C5FE0" /><stop offset="100%" stopColor="#0E9CB0" />
        </linearGradient></defs>
        <rect x="1" y="1" width="30" height="30" rx="9" fill="url(#lgmk)" />
        <path d="M11 9h10M11 16h7M11 23h10" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" />
        <circle cx="22" cy="16" r="1.8" fill="#fff" />
      </svg>
      {withText && (
        <div style={{ lineHeight: 1 }}>
          <div style={{ fontSize: 16, fontWeight: 700, letterSpacing: '-.01em' }}>Elyon</div>
          <div className="mono" style={{ fontSize: 9.5, letterSpacing: '.28em', color: 'var(--ink-3)', marginTop: 2 }}>NOUS</div>
        </div>
      )}
    </div>
  );
}

/* ── Sidebar ────────────────────────────────────────────────────────────── */
/* ── Client switcher (multi-cliente) ─────────────────────────────────── */
function ClientSwitcher({ compact }) {
  const D = window.DATA;
  const [open, setOpen] = useStateS(false);
  const [active, setActive] = useStateS(D.clients.find(c => c.active) || D.clients[0]);
  useEffectShell(() => {
    const close = () => setOpen(false);
    if (open) { document.addEventListener('click', close); return () => document.removeEventListener('click', close); }
  }, [open]);
  return (
    <div style={{ position: 'relative' }} onClick={e => e.stopPropagation()}>
      <button onClick={() => setOpen(o => !o)} style={{ display: 'flex', alignItems: 'center', gap: 9, width: '100%',
        padding: compact ? '7px 9px' : '8px 11px', background: 'var(--canvas)', border: '1px solid var(--line)',
        borderRadius: 'var(--r-sm)', textAlign: 'left', transition: 'border-color .15s' }}
        onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--line-strong)'}
        onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--line)'}>
        <Avatar initials={active.initials} size={28} tone={active.color} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="eyebrow" style={{ marginBottom: 1 }}>Cliente ativo</div>
          <div style={{ fontSize: 12.5, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{active.name}</div>
        </div>
        <Icon name="chevD" size={15} style={{ color: 'var(--ink-3)', flexShrink: 0 }} />
      </button>
      {open && (
        <div className="scale-in" style={{ position: 'absolute', bottom: compact ? 'auto' : 'calc(100% + 6px)', top: compact ? 'calc(100% + 6px)' : 'auto',
          left: 0, right: 0, minWidth: 240, background: 'var(--paper)', border: '1px solid var(--line)', borderRadius: 'var(--r-md)',
          boxShadow: 'var(--sh-pop)', padding: 6, zIndex: 120 }}>
          <div className="eyebrow" style={{ padding: '6px 8px 4px' }}>Trocar cliente</div>
          {D.clients.map(c => (
            <button key={c.id} onClick={() => { setActive(c); setOpen(false); }}
              style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '8px 8px', border: 'none',
                borderRadius: 'var(--r-sm)', background: c.id === active.id ? 'var(--blue-soft)' : 'transparent', textAlign: 'left', transition: 'background .12s' }}
              onMouseEnter={e => { if (c.id !== active.id) e.currentTarget.style.background = 'var(--canvas-2)'; }}
              onMouseLeave={e => { if (c.id !== active.id) e.currentTarget.style.background = 'transparent'; }}>
              <Avatar initials={c.initials} size={30} tone={c.color} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{c.name}</div>
                <div style={{ fontSize: 11, color: 'var(--ink-3)' }}>{c.niche}</div>
              </div>
              <span className="mono" style={{ fontSize: 12, fontWeight: 700, color: c.score >= 75 ? 'var(--green-600)' : c.score >= 55 ? 'var(--amber)' : 'var(--red)' }}>{c.score}</span>
            </button>
          ))}
          <button style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '9px 8px', marginTop: 4,
            border: 'none', borderTop: '1px solid var(--line)', background: 'transparent', color: 'var(--blue-600)', fontSize: 12.5, fontWeight: 600 }}>
            <Icon name="plus" size={15} /> Adicionar cliente
          </button>
        </div>
      )}
    </div>
  );
}

/* ── AI credits indicator ────────────────────────────────────────────── */
function CreditsPill() {
  const D = window.DATA, c = D.credits;
  const pct = Math.round(c.used / c.total * 100);
  const left = c.total - c.used;
  return (
    <div title={`${left.toLocaleString('pt-BR')} créditos de IA restantes`}
      style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 11px', background: 'var(--paper)',
        border: '1px solid var(--line)', borderRadius: 'var(--r-sm)' }}>
      <span style={{ color: 'var(--blue)' }}><Icon name="sparkle2" size={15} /></span>
      <div style={{ width: 44 }}><ProgressBar pct={pct} color={pct > 85 ? 'var(--amber)' : 'var(--blue)'} h={5} /></div>
      <span className="mono" style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--ink-2)' }}>{left.toLocaleString('pt-BR')}</span>
    </div>
  );
}

function Sidebar({ active, onChange, collapsed, onToggle, onLogout }) {
  const D = window.DATA;
  const main = D.nav.filter(n => n.group === 'main');
  const sys = D.nav.filter(n => n.group === 'sys');
  const W = collapsed ? 66 : 232;

  const NavBtn = ({ n }) => {
    const isActive = active === n.k;
    const [h, setH] = useStateS(false);
    return (
      <button onClick={() => onChange(n.k)} title={collapsed ? n.label : undefined}
        onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
        style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 11, position: 'relative',
          justifyContent: collapsed ? 'center' : 'flex-start', padding: collapsed ? '10px 0' : '9px 11px',
          borderRadius: 'var(--r-sm)', border: 'none', marginBottom: 2, transition: 'all .14s',
          background: isActive ? 'var(--blue-soft)' : h ? 'var(--canvas-2)' : 'transparent',
          color: isActive ? 'var(--blue-600)' : h ? 'var(--ink)' : 'var(--ink-2)',
          fontWeight: isActive ? 600 : 500, fontSize: 13.5 }}>
        {isActive && !collapsed && <span style={{ position: 'absolute', left: 0, top: 8, bottom: 8, width: 3, borderRadius: 99, background: 'var(--blue)' }} />}
        <Icon name={n.icon} size={18} w={isActive ? 2 : 1.8} />
        {!collapsed && <span style={{ flex: 1, textAlign: 'left' }}>{n.label}</span>}
        {!collapsed && n.badge && <Badge tone={isActive ? 'blue' : 'neutral'} style={{ padding: '1px 7px', fontSize: 10.5 }}>{n.badge}</Badge>}
        {collapsed && n.badge && <span style={{ position: 'absolute', top: 6, right: 12, width: 7, height: 7, borderRadius: 99, background: 'var(--red)' }} />}
      </button>
    );
  };

  return (
    <aside style={{ width: W, flexShrink: 0, height: '100vh', background: 'var(--paper)', borderRight: '1px solid var(--line)',
      display: 'flex', flexDirection: 'column', transition: 'width .22s cubic-bezier(.4,0,.2,1)' }}>
      {/* Logo */}
      <div style={{ padding: collapsed ? '18px 0' : '18px 18px', display: 'flex', alignItems: 'center',
        justifyContent: collapsed ? 'center' : 'space-between', borderBottom: '1px solid var(--line)' }}>
        <Logo withText={!collapsed} size={collapsed ? 30 : 30} />
        {!collapsed && <button onClick={onToggle} title="Recolher" style={{ background: 'none', border: 'none', color: 'var(--ink-4)', padding: 3 }}><Icon name="chevL" size={18} /></button>}
      </div>
      {collapsed && (
        <button onClick={onToggle} title="Expandir" style={{ alignSelf: 'center', margin: '8px 0 0', background: 'none', border: 'none', color: 'var(--ink-4)' }}><Icon name="chevR" size={18} /></button>
      )}

      {/* Nav */}
      <nav className="no-sb" style={{ flex: 1, overflowY: 'auto', padding: collapsed ? '12px 10px' : '14px 12px' }}>
        {!collapsed && <div className="eyebrow" style={{ padding: '0 4px 8px' }}>Operação</div>}
        {main.map(n => <NavBtn key={n.k} n={n} />)}
        <div style={{ height: 1, background: 'var(--line)', margin: collapsed ? '12px 6px' : '14px 4px' }} />
        {!collapsed && <div className="eyebrow" style={{ padding: '0 4px 8px' }}>Sistema</div>}
        {sys.map(n => <NavBtn key={n.k} n={n} />)}
      </nav>

      {/* Client + user */}
      {!collapsed ? (
        <div style={{ padding: 12, borderTop: '1px solid var(--line)' }}>
          <div style={{ marginBottom: 10 }}><ClientSwitcher /></div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
            <Avatar initials={D.user.initials} size={34} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12.5, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{D.user.name}</div>
              <div className="mono" style={{ fontSize: 10, color: 'var(--ink-3)' }}>PLANO {D.user.plan.toUpperCase()}</div>
            </div>
            <button onClick={onLogout} title="Sair" style={{ background: 'none', border: '1px solid var(--line)', borderRadius: 7, padding: 6, color: 'var(--ink-3)' }}><Icon name="logout" size={15} /></button>
          </div>
        </div>
      ) : (
        <div style={{ padding: '12px 0', borderTop: '1px solid var(--line)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
          <Avatar initials={D.user.initials} size={32} />
          <button onClick={onLogout} title="Sair" style={{ background: 'none', border: '1px solid var(--line)', borderRadius: 7, padding: 6, color: 'var(--ink-3)' }}><Icon name="logout" size={14} /></button>
        </div>
      )}
    </aside>
  );
}

/* ── Live sync indicator (mostra que o produto está atualizado, ao vivo) ── */
function LiveSync() {
  const [open, setOpen] = useStateS(false);
  return (
    <div className="tb-md" style={{ position: 'relative' }}
      onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}>
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 11px 6px 10px',
        background: 'var(--green-soft)', border: '1px solid var(--green-line)', borderRadius: 'var(--r-pill)', cursor: 'default' }}>
        <span className="live-dot" />
        <span className="mono" style={{ fontSize: 11, fontWeight: 600, color: 'var(--green-600)', letterSpacing: '.02em' }}>AO VIVO</span>
      </div>
      {open && (
        <div className="scale-in" style={{ position: 'absolute', top: 'calc(100% + 8px)', right: 0, width: 232, background: 'var(--paper)',
          border: '1px solid var(--line)', borderRadius: 'var(--r-md)', boxShadow: 'var(--sh-pop)', padding: 12, zIndex: 150 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <span className="live-dot" /><span style={{ fontSize: 12.5, fontWeight: 700 }}>Dados sincronizados</span>
          </div>
          {[['Meta Ads', 'há 3 min'], ['Google Ads', 'há 5 min'], ['TikTok · LinkedIn', 'há 8 min'], ['GA4', 'há 4 min']].map(([k, t]) => (
            <div key={k} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 0', fontSize: 12 }}>
              <span style={{ color: 'var(--ink-2)' }}>{k}</span>
              <span className="mono" style={{ fontSize: 10.5, color: 'var(--ink-3)' }}>{t}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Mode switch — deixa claro QUANDO usar cada modo ────────────────────── */
const MODE_INFO = {
  simple: { label: 'Simplificada', icon: 'eye', tag: 'Visão essencial',
    desc: 'Só os números e ações que importam, em linguagem direta. Ideal para o dia a dia e para apresentar a clientes.' },
  pro:    { label: 'Avançada', icon: 'grid', tag: 'Operação completa',
    desc: 'Todos os indicadores, tabelas, drill-down e ferramentas de IA. Ideal para analisar e otimizar a fundo.' },
};
function ModeSwitch({ mode, onMode }) {
  const [help, setHelp] = useStateS(false);
  const cur = MODE_INFO[mode] || MODE_INFO.pro;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
      <div style={{ display: 'inline-flex', background: 'var(--canvas-2)', borderRadius: 'var(--r-sm)', padding: 3, gap: 2, border: '1px solid var(--line)' }}>
        {['simple', 'pro'].map(k => {
          const active = k === mode, m = MODE_INFO[k];
          return (
            <button key={k} onClick={() => onMode(k)} title={m.label}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '6px 13px', fontSize: 13, fontWeight: active ? 600 : 500,
                border: 'none', borderRadius: 6, background: active ? 'var(--paper)' : 'transparent', color: active ? 'var(--ink)' : 'var(--ink-3)',
                boxShadow: active ? 'var(--sh-1)' : 'none', transition: 'all .15s' }}>
              <Icon name={m.icon} size={15} w={active ? 2 : 1.7} />{m.label}
            </button>
          );
        })}
      </div>
      <div className="tb-md" style={{ position: 'relative', display: 'flex' }}
        onMouseEnter={() => setHelp(true)} onMouseLeave={() => setHelp(false)}>
        <button aria-label="O que muda entre os modos" style={{ width: 30, height: 30, borderRadius: '50%', border: '1px solid var(--line)',
          background: 'var(--paper)', color: 'var(--ink-3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700 }}>?</button>
        {help && (
          <div className="scale-in" style={{ position: 'absolute', top: 'calc(100% + 8px)', right: 0, width: 320, background: 'var(--paper)',
            border: '1px solid var(--line)', borderRadius: 'var(--r-md)', boxShadow: 'var(--sh-pop)', padding: 14, zIndex: 160 }}>
            <div className="eyebrow" style={{ marginBottom: 10 }}>Como ver seus dados</div>
            {['simple', 'pro'].map(k => {
              const m = MODE_INFO[k], active = k === mode;
              return (
                <div key={k} style={{ display: 'flex', gap: 10, padding: '9px 0', borderTop: k === 'pro' ? '1px solid var(--line-2)' : 'none' }}>
                  <span style={{ width: 30, height: 30, borderRadius: 8, flexShrink: 0, background: active ? 'var(--blue-soft)' : 'var(--canvas-2)',
                    color: active ? 'var(--blue-600)' : 'var(--ink-2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon name={m.icon} size={16} /></span>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                      <span style={{ fontSize: 13, fontWeight: 700 }}>{m.label}</span>
                      {active && <Badge tone="blue" style={{ padding: '1px 7px', fontSize: 9.5 }}>Atual</Badge>}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--ink-2)', lineHeight: 1.5, marginTop: 2 }}>{m.desc}</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Topbar ─────────────────────────────────────────────────────────────── */
function Topbar({ mode, onMode, title, sub, onAskNous, period, onPeriod, onNav }) {
  const D = window.DATA;
  return (
    <header style={{ height: 66, flexShrink: 0, borderBottom: '1px solid var(--line)', background: 'rgba(255,255,255,.82)',
      backdropFilter: 'blur(12px)', display: 'flex', alignItems: 'center', gap: 14, padding: '0 24px', position: 'sticky', top: 0, zIndex: 50 }}>
      {/* Title */}
      <div style={{ minWidth: 0, flex: '0 1 auto', overflow: 'hidden' }}>
        <div style={{ fontSize: 17, fontWeight: 700, letterSpacing: '-.025em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{title}</div>
        {sub && <div style={{ fontSize: 12, color: 'var(--ink-3)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{sub}</div>}
      </div>

      <div style={{ flex: 1, minWidth: 12 }} />

      {/* Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
        <LiveSync />
        <span className="tb-md"><PeriodPicker value={period} onChange={onPeriod} /></span>
        <ModeSwitch mode={mode} onMode={onMode} />
        <span className="tb-md"><CreditsPill /></span>
        <Button variant="dark" size="md" icon="sparkle2" onClick={onAskNous}>Perguntar ao NOUS</Button>
        <NotificationsPanel onNav={onNav} />
      </div>
    </header>
  );
}

Object.assign(window, { Logo, Sidebar, Topbar, ClientSwitcher, CreditsPill, ModeSwitch, LiveSync });
