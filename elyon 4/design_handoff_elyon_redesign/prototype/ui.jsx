/* ELYON NOUS — UI primitives + icons ----------------------------------- */
const { useState: useStateU } = React;

/* ── Icons (stroke, currentColor) ───────────────────────────────────────── */
const ICONS = {
  home:  'M3 10.5 12 3l9 7.5M5 9.5V21h14V9.5',
  chart: 'M4 20V4M4 20h16M8 16v-5M13 16V8M18 16v-9',
  pulse: 'M3 12h4l2.5 7 4-15 2.5 8H21',
  globe: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18ZM3 12h18M12 3c2.5 2.5 3.5 6 3.5 9S14.5 18.5 12 21c-2.5-2.5-3.5-6-3.5-9S9.5 5.5 12 3Z',
  check: 'M4 12.5 9 17.5 20 6',
  doc:   'M7 3h7l5 5v13H7V3ZM14 3v5h5M10 13h6M10 17h6',
  plug:  'M9 3v5M15 3v5M7 8h10v3a5 5 0 0 1-10 0V8ZM12 16v5',
  gear:  'M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6ZM19 12a7 7 0 0 0-.1-1l2-1.5-2-3.5-2.4 1a7 7 0 0 0-1.7-1l-.4-2.5h-4l-.4 2.5a7 7 0 0 0-1.7 1l-2.4-1-2 3.5 2 1.5a7 7 0 0 0 0 2l-2 1.5 2 3.5 2.4-1a7 7 0 0 0 1.7 1l.4 2.5h4l.4-2.5a7 7 0 0 0 1.7-1l2.4 1 2-3.5-2-1.5a7 7 0 0 0 .1-1Z',
  bell:  'M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 0 1-3.4 0',
  search:'M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16ZM21 21l-4.3-4.3',
  arrowUp:'M12 19V5M5 12l7-7 7 7',
  arrowDown:'M12 5v14M19 12l-7 7-7-7',
  arrowR:'M5 12h14M13 6l6 6-6 6',
  bolt:  'M13 2 4 14h7l-1 8 9-12h-7l1-8Z',
  flag:  'M5 21V4M5 4h11l-1.5 3.5L16 11H5',
  target:'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18ZM12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM12 13a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z',
  trophy:'M7 4h10v4a5 5 0 0 1-10 0V4ZM7 6H4v1a3 3 0 0 0 3 3M17 6h3v1a3 3 0 0 1-3 3M9 14h6M10 18h4M9 21h6',
  fire:  'M12 3c1 3-1 4-1 6 0-1-1-2-2-2 .5 2-2 3-2 6a5 5 0 0 0 10 0c0-3-2-4-2-6-1 1-2 1-2 2 0-3 2-4 1-6Z',
  spark: 'M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M18 6l-2.5 2.5M8.5 15.5 6 18',
  plus:  'M12 5v14M5 12h14',
  chevR: 'M9 6l6 6-6 6',
  chevD: 'M6 9l6 6 6-6',
  chevL: 'M15 6l-6 6 6 6',
  filter:'M3 5h18l-7 8v6l-4 2v-8L3 5Z',
  download:'M12 3v12M7 11l5 5 5-5M5 21h14',
  send:  'M4 12 21 4l-7 17-2-7-8-2Z',
  alert: 'M12 3 2 20h20L12 3ZM12 10v5M12 18h0',
  sparkle2:'M12 2l1.8 5.4L19 9l-5.2 1.6L12 16l-1.8-5.4L5 9l5.2-1.6L12 2Z',
  calendar:'M7 3v3M17 3v3M3 8h18M5 6h14v15H5V6Z',
  building:'M5 21V3h10v18M15 9h4v12M8 7h2M8 11h2M8 15h2',
  layers:'M12 3 3 8l9 5 9-5-9-5ZM3 13l9 5 9-5M3 18l9 5 9-5',
  users: 'M16 19v-1a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v1M9 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7ZM22 19v-1a4 4 0 0 0-3-3.8M16 4.2a3.5 3.5 0 0 1 0 6.6',
  logout:'M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9',
  refresh:'M21 12a9 9 0 1 1-3-6.7M21 4v4h-4',
  eye:   'M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12ZM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z',
  link:  'M10 13a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1.5 1.5M14 11a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1.5-1.5',
  megaphone:'M3 11v2l3 1 2 5h2l-1-4 8 3V5L9 9H4a1 1 0 0 0-1 1ZM18 8a3 3 0 0 1 0 8',
  image: 'M4 4h16v16H4V4ZM4 15l4.5-4.5 4 4L16 11l4 4M9 9a1.4 1.4 0 1 1-2.8 0 1.4 1.4 0 0 1 2.8 0Z',
  funnel:'M3 4h18l-7 8v7l-4 2v-9L3 4Z',
  close: 'M6 6l12 12M18 6l-12 12',
  brain: 'M9 3a3 3 0 0 0-3 3 3 3 0 0 0-1 5 3 3 0 0 0 2 4 3 3 0 0 0 5 1V3.5A2.5 2.5 0 0 0 9 3ZM15 3a3 3 0 0 1 3 3 3 3 0 0 1 1 5 3 3 0 0 1-2 4 3 3 0 0 1-5 1',
  money: 'M12 2v20M16 6.5C16 4.6 14.2 4 12 4S8 4.6 8 6.5 9.8 9 12 9.5 16 11.1 16 13s-1.8 2.5-4 2.5-4-.6-4-2.5',
  share: 'M16 6l-4-4-4 4M12 2v13M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7',
  copy:  'M9 9h10v10H9zM5 15H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v1',
  map:   'M9 3 3 5v16l6-2 6 2 6-2V3l-6 2-6-2ZM9 3v16M15 5v16',
  scale: 'M12 3v18M7 7 3 14h8L7 7ZM17 7l-4 7h8l-4-7ZM5 21h14',
  grid:  'M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z',
  rocket:'M5 15c-1 1-1 4-1 4s3 0 4-1m6.5-6.5a8 8 0 0 0 2-7 8 8 0 0 0-7 2C7 9 6 12 6 12l6 6s3-1 3.5-3.5ZM14 10a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z',
};

function Icon({ name, size = 18, w = 1.7, style, className }) {
  const d = ICONS[name] || ICONS.home;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" style={style} className={className}>
      {d.split('M').filter(Boolean).map((seg, i) => <path key={i} d={'M' + seg} />)}
    </svg>
  );
}

/* ── Channel logos (simple brand marks, original) ───────────────────────── */
function ChannelMark({ name, size = 18 }) {
  const s = size;
  const map = {
    Meta:    { bg: '#1877F2', t: 'M' },
    Google:  { bg: '#EA4335', t: 'G' },
    TikTok:  { bg: '#111', t: 'T' },
    LinkedIn:{ bg: '#0A66C2', t: 'in' },
    Outros:  { bg: '#64748B', t: '+' },
  };
  const m = map[name] || map.Outros;
  return (
    <span style={{ width: s, height: s, borderRadius: s * 0.28, background: m.bg, color: '#fff',
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: s * 0.5,
      fontWeight: 700, flexShrink: 0, fontFamily: 'var(--sans)' }}>{m.t}</span>
  );
}

/* ── Card ───────────────────────────────────────────────────────────────── */
function Card({ children, pad = 18, style, className, onClick, hover, ...rest }) {
  const [h, setH] = useStateU(false);
  return (
    <div onClick={onClick}
      onMouseEnter={() => hover && setH(true)} onMouseLeave={() => hover && setH(false)}
      className={className}
      style={{
        background: 'var(--paper)', border: '1px solid var(--line)', borderRadius: 'var(--r-md)',
        padding: pad, boxShadow: h ? 'var(--sh-2)' : 'var(--sh-1)',
        transition: 'box-shadow .18s, border-color .18s, transform .18s',
        transform: h ? 'translateY(-1px)' : 'none',
        cursor: onClick ? 'pointer' : 'default',
        borderColor: h ? 'var(--line-strong)' : 'var(--line)',
        ...style,
      }} {...rest}>
      {children}
    </div>
  );
}

/* ── Section head ───────────────────────────────────────────────────────── */
function SectionHead({ title, sub, right, icon }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 14 }}>
      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
        {icon && <span style={{ color: 'var(--ink-3)' }}><Icon name={icon} size={17} /></span>}
        <div>
          <div style={{ fontSize: 15, fontWeight: 600, letterSpacing: '-.01em' }}>{title}</div>
          {sub && <div style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 1 }}>{sub}</div>}
        </div>
      </div>
      {right}
    </div>
  );
}

/* ── Delta tag ──────────────────────────────────────────────────────────── */
function Delta({ v, good = 'up', size = 11.5, suffix = '' }) {
  // good: 'up' = positive good, 'down' = negative good, 'neutral'
  const pos = v >= 0;
  let isGood;
  if (good === 'neutral') isGood = null;
  else isGood = good === 'up' ? pos : !pos;
  const color = isGood == null ? 'var(--ink-3)' : isGood ? 'var(--green)' : 'var(--red)';
  return (
    <span className="mono" style={{ color, fontSize: size, fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 2, whiteSpace: 'nowrap' }}>
      <Icon name={pos ? 'arrowUp' : 'arrowDown'} size={size + 1} w={2.4} />
      {Math.abs(v).toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%{suffix}
    </span>
  );
}

/* ── Badge / Pill ───────────────────────────────────────────────────────── */
const TONES = {
  good: { c: 'var(--green-600)', bg: 'var(--green-soft)', b: 'var(--green-line)' },
  bad:  { c: 'var(--red)', bg: 'var(--red-soft)', b: '#F3CFCC' },
  warn: { c: 'var(--amber)', bg: 'var(--amber-soft)', b: '#F2DDB0' },
  blue: { c: 'var(--blue-600)', bg: 'var(--blue-soft)', b: 'var(--blue-line)' },
  neutral: { c: 'var(--ink-2)', bg: 'var(--canvas-2)', b: 'var(--line)' },
};
function Badge({ children, tone = 'neutral', dot, style }) {
  const t = TONES[tone] || TONES.neutral;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 600,
      color: t.c, background: t.bg, border: `1px solid ${t.b}`, borderRadius: 'var(--r-pill)', padding: '3px 9px',
      letterSpacing: '.01em', ...style }}>
      {dot && <span style={{ width: 6, height: 6, borderRadius: 99, background: t.c }} />}
      {children}
    </span>
  );
}

/* ── Button ─────────────────────────────────────────────────────────────── */
function Button({ children, variant = 'primary', size = 'md', icon, iconRight, onClick, full, style, disabled, type = 'button' }) {
  const [h, setH] = useStateU(false);
  const sizes = { sm: { p: '6px 11px', f: 12.5, g: 6 }, md: { p: '9px 15px', f: 13.5, g: 7 }, lg: { p: '12px 20px', f: 14.5, g: 8 } };
  const sz = sizes[size];
  const variants = {
    primary:  { bg: h ? 'var(--blue-600)' : 'var(--blue)', c: '#fff', b: 'transparent', sh: '0 1px 2px rgba(44,95,224,.3)' },
    green:    { bg: h ? 'var(--green-600)' : 'var(--green)', c: '#fff', b: 'transparent', sh: '0 1px 2px rgba(14,158,110,.3)' },
    soft:     { bg: h ? '#DEE9FD' : 'var(--blue-soft)', c: 'var(--blue-600)', b: 'var(--blue-line)', sh: 'none' },
    ghost:    { bg: h ? 'var(--canvas-2)' : 'transparent', c: 'var(--ink-2)', b: 'var(--line)', sh: 'none' },
    dark:     { bg: h ? '#0E1320' : '#161B26', c: '#fff', b: 'transparent', sh: 'var(--sh-1)' },
  };
  const v = variants[variant] || variants.primary;
  return (
    <button type={type} onClick={onClick} disabled={disabled}
      onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
      style={{
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: sz.g,
        padding: sz.p, fontSize: sz.f, fontWeight: 600, borderRadius: 'var(--r-sm)',
        background: v.bg, color: v.c, border: `1px solid ${v.b}`, boxShadow: v.sh,
        transition: 'all .15s', width: full ? '100%' : 'auto', whiteSpace: 'nowrap',
        opacity: disabled ? 0.5 : 1, letterSpacing: '-.005em', ...style,
      }}>
      {icon && <Icon name={icon} size={sz.f + 2} />}
      {children}
      {iconRight && <Icon name={iconRight} size={sz.f + 2} />}
    </button>
  );
}

/* ── Avatar ─────────────────────────────────────────────────────────────── */
function Avatar({ initials, size = 34, tone }) {
  return (
    <div style={{ width: size, height: size, borderRadius: size * 0.3, flexShrink: 0,
      background: tone || 'linear-gradient(135deg, var(--blue), var(--teal))', color: '#fff',
      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: size * 0.4, fontWeight: 600 }}>
      {initials}
    </div>
  );
}

/* ── Segmented toggle ───────────────────────────────────────────────────── */
function Segmented({ options, value, onChange, size = 'md' }) {
  const pad = size === 'sm' ? '5px 11px' : '7px 15px';
  const fs = size === 'sm' ? 12 : 13;
  return (
    <div style={{ display: 'inline-flex', background: 'var(--canvas-2)', borderRadius: 'var(--r-sm)', padding: 3, gap: 2, border: '1px solid var(--line)' }}>
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button key={o.value} onClick={() => onChange(o.value)}
            style={{ padding: pad, fontSize: fs, fontWeight: active ? 600 : 500, borderRadius: 6, border: 'none',
              background: active ? 'var(--paper)' : 'transparent', color: active ? 'var(--ink)' : 'var(--ink-3)',
              boxShadow: active ? 'var(--sh-1)' : 'none', transition: 'all .15s', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            {o.icon && <Icon name={o.icon} size={fs + 2} />}
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

/* ── KPI stat card ──────────────────────────────────────────────────────── */
function StatCard({ kpi, compact }) {
  const color = kpi.good === 'up' ? 'var(--green)' : kpi.good === 'down' ? 'var(--blue)' : 'var(--slate)';
  return (
    <Card pad={compact ? 14 : 16} hover style={{ display: 'flex', flexDirection: 'column', gap: compact ? 6 : 9 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span className="eyebrow">{kpi.label}</span>
        <Delta v={kpi.delta} good={kpi.good} />
      </div>
      <div className="mono" style={{ fontSize: compact ? 22 : 26, fontWeight: 700, letterSpacing: '-.02em' }}>{kpi.value}</div>
      <div style={{ marginTop: 'auto' }}><Sparkline data={kpi.spark} color={color} h={compact ? 26 : 32} /></div>
    </Card>
  );
}

/* ── Tooltip-lite (title attr wrapper) ──────────────────────────────────── */
function Field({ label, children }) {
  return (
    <label style={{ display: 'block' }}>
      <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink-2)', marginBottom: 6 }}>{label}</div>
      {children}
    </label>
  );
}
function Input({ value, onChange, placeholder, icon, ...rest }) {
  return (
    <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
      {icon && <span style={{ position: 'absolute', left: 12, color: 'var(--ink-3)', pointerEvents: 'none' }}><Icon name={icon} size={16} /></span>}
      <input value={value} onChange={onChange} placeholder={placeholder}
        style={{ width: '100%', padding: icon ? '11px 14px 11px 36px' : '11px 14px', fontSize: 14,
          background: 'var(--paper)', border: '1px solid var(--line)', borderRadius: 'var(--r-sm)', color: 'var(--ink)',
          outline: 'none', transition: 'border-color .15s' }}
        onFocus={(e) => e.target.style.borderColor = 'var(--blue)'}
        onBlur={(e) => e.target.style.borderColor = 'var(--line)'} {...rest} />
    </div>
  );
}

/* ── Source badge (origem do dado) ──────────────────────────────────── */
const SOURCE = {
  real:  { tone: 'good', label: 'Dados reais' },
  est:   { tone: 'warn', label: 'Estimativa' },
  bench: { tone: 'warn', label: 'Benchmark' },
  ai:    { tone: 'neutral', label: 'Fallback IA' },
};
function SourceBadge({ kind = 'real', style }) {
  const s = SOURCE[kind] || SOURCE.real;
  const t = TONES[s.tone];
  return (
    <span title={`Origem: ${s.label}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 9.5,
      fontWeight: 600, fontFamily: 'var(--mono)', letterSpacing: '.04em', color: t.c, background: t.bg,
      border: `1px solid ${t.b}`, borderRadius: 'var(--r-pill)', padding: '2px 7px', textTransform: 'uppercase', ...style }}>
      <span style={{ width: 5, height: 5, borderRadius: 99, background: t.c }} />{s.label}
    </span>
  );
}

Object.assign(window, { Icon, ChannelMark, Card, SectionHead, Delta, Badge, Button, Avatar, Segmented, StatCard, Field, Input, TONES, SourceBadge });
