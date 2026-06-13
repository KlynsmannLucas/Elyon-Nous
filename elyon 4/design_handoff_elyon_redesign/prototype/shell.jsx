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

/* ── Topbar ─────────────────────────────────────────────────────────────── */
function Topbar({ mode, onMode, title, sub, onAskNous, period, onPeriod, onNav }) {
  const D = window.DATA;
  const Pill = ({ icon, children, onClick }) => (
    <button onClick={onClick} style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '7px 12px', fontSize: 13,
      background: 'var(--paper)', border: '1px solid var(--line)', borderRadius: 'var(--r-sm)', color: 'var(--ink-2)', fontWeight: 500, transition: 'all .15s' }}
      onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--line-strong)'}
      onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--line)'}>
      {icon && <Icon name={icon} size={15} />}{children}
    </button>
  );
  return (
    <header style={{ height: 64, flexShrink: 0, borderBottom: '1px solid var(--line)', background: 'rgba(255,255,255,.8)',
      backdropFilter: 'blur(12px)', display: 'flex', alignItems: 'center', gap: 14, padding: '0 22px', position: 'sticky', top: 0, zIndex: 50 }}>
      {/* Title */}
      <div style={{ minWidth: 0, flex: '0 1 auto', overflow: 'hidden' }}>
        <div style={{ fontSize: 17, fontWeight: 700, letterSpacing: '-.02em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{title}</div>
        {sub && <div style={{ fontSize: 12, color: 'var(--ink-3)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{sub}</div>}
      </div>

      <div style={{ flex: 1, minWidth: 12 }} />

      {/* Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexShrink: 0 }}>
        <span className="tb-md"><PeriodPicker value={period} onChange={onPeriod} /></span>
        <Segmented options={[{ value: 'simple', label: 'Simplificada' }, { value: 'pro', label: 'Avançada' }]} value={mode} onChange={onMode} />
        <div className="tb-md" style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '5px 10px', background: 'var(--paper)', border: '1px solid var(--line)', borderRadius: 'var(--r-sm)' }} title="Canais conectados">
          {D.channels.map((c, i) => <span key={i} style={{ marginLeft: i ? -4 : 0 }}><ChannelMark name={c} size={20} /></span>)}
        </div>
        <span className="tb-md"><CreditsPill /></span>
        <Button variant="dark" size="md" icon="sparkle2" onClick={onAskNous}>Perguntar ao NOUS</Button>
        <NotificationsPanel onNav={onNav} />
      </div>
    </header>
  );
}

Object.assign(window, { Logo, Sidebar, Topbar, ClientSwitcher, CreditsPill });
