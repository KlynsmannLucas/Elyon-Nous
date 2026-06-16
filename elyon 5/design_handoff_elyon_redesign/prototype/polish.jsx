/* ELYON NOUS — polish layer: Toast, Modal, DropdownMenu, PeriodPicker,
   NotificationsPanel, keyboard handlers, persistence helpers ------------- */
const { useState: useStateP, useEffect: useEffectP, useRef: useRefP, createContext: createCtxP, useContext: useCtxP } = React;

/* ── Toast system (global, via window.toast()) ─────────────────────────── */
const ToastCtx = createCtxP({ push: () => {} });
function ToastProvider({ children }) {
  const [items, setItems] = useStateP([]);
  const push = (t) => {
    const id = Math.random().toString(36).slice(2, 8);
    const toast = { id, tone: 'good', duration: 3200, ...t };
    setItems(s => [...s, toast]);
    setTimeout(() => setItems(s => s.filter(x => x.id !== id)), toast.duration);
  };
  useEffectP(() => { window.toast = push; }, []);
  return (
    <ToastCtx.Provider value={{ push }}>
      {children}
      <div style={{ position: 'fixed', right: 22, bottom: 22, zIndex: 300, display: 'flex', flexDirection: 'column', gap: 9, pointerEvents: 'none' }}>
        {items.map(t => {
          const tone = TONES[t.tone] || TONES.good;
          const icon = t.tone === 'bad' ? 'alert' : t.tone === 'warn' ? 'flag' : t.tone === 'blue' ? 'spark' : 'check';
          return (
            <div key={t.id} className="scale-in" style={{ pointerEvents: 'auto', display: 'flex', alignItems: 'flex-start', gap: 11, minWidth: 280, maxWidth: 380,
              background: 'var(--paper)', border: `1px solid ${tone.b}`, borderLeft: `3px solid ${tone.c}`,
              borderRadius: 'var(--r-md)', boxShadow: 'var(--sh-pop)', padding: '13px 14px' }}>
              <span style={{ color: tone.c, flexShrink: 0, marginTop: 1 }}><Icon name={icon} size={17} /></span>
              <div style={{ flex: 1, minWidth: 0 }}>
                {t.title && <div style={{ fontSize: 13, fontWeight: 600, marginBottom: t.body ? 3 : 0 }}>{t.title}</div>}
                {t.body && <div style={{ fontSize: 12.5, color: 'var(--ink-2)', lineHeight: 1.45 }}>{t.body}</div>}
              </div>
              <button onClick={() => setItems(s => s.filter(x => x.id !== t.id))} style={{ background: 'none', border: 'none', padding: 0, color: 'var(--ink-4)', flexShrink: 0 }}>
                <Icon name="chevR" size={14} style={{ transform: 'rotate(45deg)' }} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastCtx.Provider>
  );
}

/* ── Modal / Dialog ─────────────────────────────────────────────────────── */
function Modal({ open, onClose, title, sub, icon, children, footer, width = 520 }) {
  useEffectP(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === 'Escape') onClose && onClose(); };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow; document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = prev; };
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 250, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}
      onClick={onClose}>
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(20,28,46,.32)', backdropFilter: 'blur(3px)', animation: 'fadeIn .18s ease both' }} />
      <div onClick={e => e.stopPropagation()} className="scale-in" role="dialog" aria-modal="true"
        style={{ position: 'relative', width: '100%', maxWidth: width, background: 'var(--paper)',
          border: '1px solid var(--line)', borderRadius: 'var(--r-lg)', boxShadow: 'var(--sh-pop)', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '18px 22px 14px', borderBottom: '1px solid var(--line)', display: 'flex', alignItems: 'flex-start', gap: 12 }}>
          {icon && <span style={{ width: 36, height: 36, borderRadius: 9, background: 'var(--blue-soft)', color: 'var(--blue)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Icon name={icon} size={18} /></span>}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 16, fontWeight: 700, letterSpacing: '-.01em' }}>{title}</div>
            {sub && <div style={{ fontSize: 12.5, color: 'var(--ink-3)', marginTop: 2 }}>{sub}</div>}
          </div>
          <button onClick={onClose} aria-label="Fechar" style={{ background: 'none', border: 'none', padding: 6, borderRadius: 7, color: 'var(--ink-3)' }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--canvas-2)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M6 6l12 12M18 6l-12 12" /></svg>
          </button>
        </div>
        <div style={{ padding: '18px 22px', overflowY: 'auto', flex: 1 }}>{children}</div>
        {footer && <div style={{ padding: '14px 22px', borderTop: '1px solid var(--line)', display: 'flex', gap: 9, justifyContent: 'flex-end', background: 'var(--paper-2)', borderRadius: '0 0 var(--r-lg) var(--r-lg)' }}>{footer}</div>}
      </div>
    </div>
  );
}

/* ── DropdownMenu (anchored, click-outside, Esc) ───────────────────────── */
function DropdownMenu({ trigger, children, align = 'right', minWidth = 220 }) {
  const [open, setOpen] = useStateP(false);
  const wrapRef = useRefP(null);
  useEffectP(() => {
    if (!open) return;
    const onDoc = (e) => { if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false); };
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', onDoc); document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('mousedown', onDoc); document.removeEventListener('keydown', onKey); };
  }, [open]);
  return (
    <div ref={wrapRef} style={{ position: 'relative', display: 'inline-flex' }}>
      <span onClick={() => setOpen(o => !o)}>{trigger}</span>
      {open && (
        <div className="scale-in" style={{ position: 'absolute', top: 'calc(100% + 6px)', [align]: 0, minWidth,
          background: 'var(--paper)', border: '1px solid var(--line)', borderRadius: 'var(--r-md)',
          boxShadow: 'var(--sh-pop)', padding: 6, zIndex: 150 }} onClick={() => setOpen(false)}>
          {children}
        </div>
      )}
    </div>
  );
}
function MenuItem({ icon, children, onClick, active, danger }) {
  const [h, setH] = useStateP(false);
  return (
    <button onClick={onClick} onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
      style={{ display: 'flex', alignItems: 'center', gap: 9, width: '100%', padding: '8px 10px', border: 'none',
        borderRadius: 'var(--r-sm)', background: active ? 'var(--blue-soft)' : h ? 'var(--canvas-2)' : 'transparent',
        textAlign: 'left', fontSize: 13, fontWeight: active ? 600 : 500,
        color: danger ? 'var(--red)' : active ? 'var(--blue-600)' : 'var(--ink-2)', transition: 'background .12s' }}>
      {icon && <Icon name={icon} size={15} />}<span style={{ flex: 1 }}>{children}</span>
      {active && <Icon name="check" size={14} w={2.6} />}
    </button>
  );
}
function MenuLabel({ children }) {
  return <div className="eyebrow" style={{ padding: '6px 10px 4px' }}>{children}</div>;
}
function MenuDivider() {
  return <div style={{ height: 1, background: 'var(--line)', margin: '5px 4px' }} />;
}

/* ── Period picker ──────────────────────────────────────────────────────── */
function PeriodPicker({ value, onChange }) {
  const opts = ['Hoje', 'Últimos 7 dias', 'Últimos 14 dias', 'Últimos 30 dias', 'Mês atual', 'Mês anterior', 'Últimos 90 dias'];
  return (
    <DropdownMenu align="left" minWidth={210} trigger={
      <button style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '7px 12px', fontSize: 13,
        background: 'var(--paper)', border: '1px solid var(--line)', borderRadius: 'var(--r-sm)', color: 'var(--ink-2)', fontWeight: 500, transition: 'all .15s' }}
        onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--line-strong)'}
        onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--line)'}>
        <Icon name="calendar" size={15} />{value}<Icon name="chevD" size={13} />
      </button>
    }>
      <MenuLabel>Período</MenuLabel>
      {opts.map(o => <MenuItem key={o} icon={o === value ? 'check' : undefined} active={o === value} onClick={() => onChange(o)}>{o}</MenuItem>)}
      <MenuDivider />
      <MenuItem icon="calendar" onClick={() => window.toast({ tone: 'blue', title: 'Período personalizado', body: 'Seletor de datas em breve.' })}>Personalizado…</MenuItem>
    </DropdownMenu>
  );
}

/* ── Notifications panel ────────────────────────────────────────────────── */
function NotificationsPanel({ onNav }) {
  const D = window.DATA;
  const [items, setItems] = useStateP([
    { id: 1, tone: 'bad', title: 'CPA em alta no Google Ads', body: '+18,7% nos últimos 7 dias', when: 'há 12 min', area: 'desempenho', read: false },
    { id: 2, tone: 'warn', title: '3 criativos em fadiga', body: 'CTR caindo há 3 dias', when: 'há 1 h', area: 'desempenho', read: false },
    { id: 3, tone: 'good', title: 'ROAS atingiu 3,2x', body: 'Meta semanal alcançada', when: 'há 3 h', area: 'hoje', read: false },
    { id: 4, tone: 'blue', title: 'NOUS sugere realocação', body: '+R$ 41,8 mil em ganhos rápidos', when: 'há 5 h', area: 'desempenho', read: true },
  ]);
  const unread = items.filter(i => !i.read).length;
  return (
    <DropdownMenu align="right" minWidth={340} trigger={
      <button title="Notificações" style={{ position: 'relative', width: 38, height: 38, borderRadius: 'var(--r-sm)', border: '1px solid var(--line)', background: 'var(--paper)', color: 'var(--ink-2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Icon name="bell" size={18} />
        {unread > 0 && <span style={{ position: 'absolute', top: 7, right: 8, minWidth: 14, height: 14, padding: '0 4px',
          borderRadius: 99, background: 'var(--red)', color: '#fff', fontSize: 9, fontWeight: 700, fontFamily: 'var(--mono)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1.5px solid var(--paper)' }}>{unread}</span>}
      </button>
    }>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 10px 8px' }}>
        <span style={{ fontSize: 13, fontWeight: 700 }}>Notificações</span>
        <button onClick={(e) => { e.stopPropagation(); setItems(s => s.map(x => ({ ...x, read: true }))); }}
          style={{ background: 'none', border: 'none', color: 'var(--blue-600)', fontSize: 11.5, fontWeight: 600 }}>Marcar todas como lidas</button>
      </div>
      <div style={{ height: 1, background: 'var(--line)', margin: '0 4px 4px' }} />
      <div style={{ maxHeight: 360, overflowY: 'auto' }}>
        {items.map(n => {
          const tone = TONES[n.tone] || TONES.neutral;
          const icon = n.tone === 'bad' ? 'alert' : n.tone === 'warn' ? 'flag' : n.tone === 'blue' ? 'sparkle2' : 'check';
          return (
            <button key={n.id} onClick={() => { setItems(s => s.map(x => x.id === n.id ? { ...x, read: true } : x)); onNav && onNav(n.area); }}
              style={{ display: 'flex', gap: 10, padding: '10px 10px', border: 'none', borderRadius: 'var(--r-sm)', background: 'transparent', textAlign: 'left', width: '100%', transition: 'background .12s', cursor: 'pointer' }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--canvas-2)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
              <span style={{ width: 28, height: 28, borderRadius: 7, flexShrink: 0, background: tone.bg, color: tone.c, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon name={icon} size={15} /></span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 12.5, fontWeight: n.read ? 500 : 700 }}>
                  {!n.read && <span style={{ width: 6, height: 6, borderRadius: 99, background: 'var(--blue)', flexShrink: 0 }} />}
                  <span>{n.title}</span>
                </div>
                <div style={{ fontSize: 11.5, color: 'var(--ink-3)', marginTop: 2 }}>{n.body}</div>
                <div className="mono" style={{ fontSize: 10, color: 'var(--ink-4)', marginTop: 3 }}>{n.when}</div>
              </div>
            </button>
          );
        })}
      </div>
    </DropdownMenu>
  );
}

/* ── Empty state ────────────────────────────────────────────────────────── */
function EmptyState({ icon = 'spark', title, body, cta, onCta }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '40px 24px' }}>
      <span style={{ width: 48, height: 48, borderRadius: 12, background: 'var(--canvas-2)', color: 'var(--ink-3)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}><Icon name={icon} size={22} /></span>
      <div style={{ fontSize: 15, fontWeight: 600 }}>{title}</div>
      {body && <div style={{ fontSize: 12.5, color: 'var(--ink-3)', marginTop: 4, maxWidth: 320 }}>{body}</div>}
      {cta && <div style={{ marginTop: 14 }}><Button variant="soft" onClick={onCta} icon="plus">{cta}</Button></div>}
    </div>
  );
}

Object.assign(window, { ToastProvider, Modal, DropdownMenu, MenuItem, MenuLabel, MenuDivider, PeriodPicker, NotificationsPanel, EmptyState });
