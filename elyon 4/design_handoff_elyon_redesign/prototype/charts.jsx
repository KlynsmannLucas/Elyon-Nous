/* ELYON NOUS — chart library (crisp SVG, light theme) ------------------- */
const { useState: useStateC, useEffect: useEffectC, useRef: useRefC, useMemo: useMemoC } = React;

/* Hook: measure container width ------------------------------------------ */
function useWidth() {
  const ref = useRefC(null);
  const [w, setW] = useStateC(0);
  useEffectC(() => {
    if (!ref.current) return;
    const ro = new ResizeObserver((es) => { for (const e of es) setW(e.contentRect.width); });
    ro.observe(ref.current);
    setW(ref.current.getBoundingClientRect().width);
    return () => ro.disconnect();
  }, []);
  return [ref, w];
}

const CSSVAR = (v, fb) => {
  if (typeof v === 'string' && v.startsWith('var(')) {
    const name = v.slice(4, -1).trim();
    const got = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
    return got || fb || '#2C5FE0';
  }
  return v;
};

function smoothPath(pts) {
  if (pts.length < 2) return '';
  let d = `M ${pts[0][0]},${pts[0][1]}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i], p1 = pts[i + 1];
    const cx = (p0[0] + p1[0]) / 2;
    d += ` C ${cx},${p0[1]} ${cx},${p1[1]} ${p1[0]},${p1[1]}`;
  }
  return d;
}

/* ── Sparkline ──────────────────────────────────────────────────────────── */
function Sparkline({ data, color = 'var(--blue)', h = 34, fill = true, strokeW = 1.75 }) {
  const [ref, w] = useWidth();
  const c = CSSVAR(color);
  const id = useMemoC(() => 'sp' + Math.random().toString(36).slice(2, 7), []);
  if (!data || data.length < 2) return <div ref={ref} style={{ height: h }} />;
  const W = w || 80, pad = 3;
  const min = Math.min(...data), max = Math.max(...data), rng = max - min || 1;
  const pts = data.map((v, i) => [(i / (data.length - 1)) * W, h - pad - ((v - min) / rng) * (h - pad * 2)]);
  const line = smoothPath(pts);
  return (
    <div ref={ref} style={{ width: '100%', height: h, lineHeight: 0 }}>
      {W > 0 && (
        <svg width={W} height={h} style={{ display: 'block', overflow: 'visible' }}>
          <defs>
            <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={c} stopOpacity="0.18" />
              <stop offset="100%" stopColor={c} stopOpacity="0" />
            </linearGradient>
          </defs>
          {fill && <path d={`${line} L ${W},${h} L 0,${h} Z`} fill={`url(#${id})`} />}
          <path d={line} fill="none" stroke={c} strokeWidth={strokeW} strokeLinecap="round" strokeLinejoin="round" />
          <circle cx={pts[pts.length - 1][0]} cy={pts[pts.length - 1][1]} r="2.6" fill={c} />
        </svg>
      )}
    </div>
  );
}

/* ── LineChart (multi-series, axes, grid) ───────────────────────────────── */
function LineChart({ series, labels, h = 240, yFmt = (v) => v, area = false, animate = true }) {
  const [ref, w] = useWidth();
  const W = w || 600;
  const padL = 46, padR = 14, padT = 14, padB = 26;
  const all = series.flatMap(s => s.data);
  let min = Math.min(...all), max = Math.max(...all);
  const span = max - min || 1; min = Math.max(0, min - span * 0.12); max = max + span * 0.12;
  const rng = max - min || 1;
  const x = (i) => padL + (i / (labels.length - 1)) * (W - padL - padR);
  const y = (v) => padT + (1 - (v - min) / rng) * (h - padT - padB);
  const ticks = 4;
  const gridVals = Array.from({ length: ticks + 1 }, (_, i) => min + (rng * i) / ticks);
  return (
    <div ref={ref} style={{ width: '100%' }}>
      {W > 0 && (
        <svg width={W} height={h} style={{ display: 'block', overflow: 'visible' }}>
          {gridVals.map((gv, i) => (
            <g key={i}>
              <line x1={padL} x2={W - padR} y1={y(gv)} y2={y(gv)} stroke="var(--line)" strokeWidth="1" strokeDasharray={i === 0 ? '0' : '2 4'} />
              <text x={padL - 8} y={y(gv) + 3} textAnchor="end" fontSize="10" fill="var(--ink-3)" fontFamily="var(--mono)">{yFmt(gv)}</text>
            </g>
          ))}
          {labels.map((lb, i) => (
            <text key={i} x={x(i)} y={h - 8} textAnchor="middle" fontSize="10" fill="var(--ink-3)" fontFamily="var(--mono)">{lb}</text>
          ))}
          {series.map((s, si) => {
            const c = CSSVAR(s.color);
            const pts = s.data.map((v, i) => [x(i), y(v)]);
            const path = smoothPath(pts);
            const len = W * 1.8;
            const gid = 'lg' + si + Math.random().toString(36).slice(2, 6);
            return (
              <g key={si}>
                {area && (
                  <>
                    <defs><linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={c} stopOpacity="0.16" /><stop offset="100%" stopColor={c} stopOpacity="0" />
                    </linearGradient></defs>
                    <path d={`${path} L ${x(labels.length - 1)},${y(min)} L ${x(0)},${y(min)} Z`} fill={`url(#${gid})`} />
                  </>
                )}
                <path d={path} fill="none" stroke={c} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"
                  style={animate ? { strokeDasharray: len, animation: `drawLine 1.1s cubic-bezier(.4,0,.2,1) ${si * 0.12}s both`, '--len': len } : {}} />
                {pts.map((p, i) => <circle key={i} cx={p[0]} cy={p[1]} r="2.8" fill="var(--paper)" stroke={c} strokeWidth="2" />)}
              </g>
            );
          })}
        </svg>
      )}
    </div>
  );
}

/* ── Donut ──────────────────────────────────────────────────────────────── */
function Donut({ data, size = 150, thickness = 18, centerTop, centerSub }) {
  const total = data.reduce((a, d) => a + d.value, 0);
  const R = size / 2, r = R - thickness / 2;
  let acc = -90;
  const seg = data.map((d) => {
    const ang = (d.value / total) * 360;
    const s = acc, e = acc + ang; acc = e;
    const large = ang > 180 ? 1 : 0;
    const sr = (a) => [R + r * Math.cos(a * Math.PI / 180), R + r * Math.sin(a * Math.PI / 180)];
    const [x1, y1] = sr(s), [x2, y2] = sr(e - 0.5);
    return { d: `M ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2}`, color: CSSVAR(d.color), pct: Math.round(d.value / total * 100) };
  });
  return (
    <svg width={size} height={size} style={{ display: 'block' }}>
      <circle cx={R} cy={R} r={r} fill="none" stroke="var(--line-2)" strokeWidth={thickness} />
      {seg.map((s, i) => (
        <path key={i} d={s.d} fill="none" stroke={s.color} strokeWidth={thickness} strokeLinecap="round"
          style={{ animation: `fadeIn .6s ease ${i * 0.08}s both` }} />
      ))}
      {centerTop != null && (
        <>
          <text x={R} y={R - 2} textAnchor="middle" fontSize={size * 0.17} fontWeight="700" fill="var(--ink)" fontFamily="var(--mono)">{centerTop}</text>
          {centerSub && <text x={R} y={R + size * 0.13} textAnchor="middle" fontSize="10" fill="var(--ink-3)" fontFamily="var(--mono)" letterSpacing="0.08em">{centerSub}</text>}
        </>
      )}
    </svg>
  );
}

/* ── Funnel ─────────────────────────────────────────────────────────────── */
function Funnel({ data, h = 240 }) {
  const [ref, w] = useWidth();
  const W = w || 420;
  const max = data[0].v;
  const rowH = h / data.length;
  const colors = ['var(--dv-1)', 'var(--dv-3)', 'var(--dv-2)', 'var(--amber)', 'var(--green)'];
  return (
    <div ref={ref} style={{ width: '100%' }}>
      {W > 0 && (
        <svg width={W} height={h} style={{ display: 'block' }}>
          {data.map((d, i) => {
            const wTop = (d.v / max) * (W - 20);
            const next = data[i + 1] ? (data[i + 1].v / max) * (W - 20) : wTop * 0.7;
            const cx = W / 2, yT = i * rowH + 6, yB = (i + 1) * rowH - 6;
            const c = CSSVAR(colors[i % colors.length]);
            const path = `M ${cx - wTop / 2} ${yT} L ${cx + wTop / 2} ${yT} L ${cx + next / 2} ${yB} L ${cx - next / 2} ${yB} Z`;
            return (
              <g key={i} style={{ animation: `fadeUp .5s ease ${i * 0.08}s both` }}>
                <path d={path} fill={c} fillOpacity="0.9" />
                <text x={cx} y={yT + rowH / 2 - 4} textAnchor="middle" fontSize="12" fontWeight="600" fill="#fff">{d.stage}</text>
                <text x={cx} y={yT + rowH / 2 + 12} textAnchor="middle" fontSize="11" fill="rgba(255,255,255,.85)" fontFamily="var(--mono)">{d.v.toLocaleString('pt-BR')} · {d.pct}%</text>
              </g>
            );
          })}
        </svg>
      )}
    </div>
  );
}

/* ── Bars ───────────────────────────────────────────────────────────────── */
function Bars({ data, h = 200, yFmt = (v) => v }) {
  const [ref, w] = useWidth();
  const W = w || 420;
  const padB = 28, padT = 10, padL = 4;
  const max = Math.max(...data.map(d => d.value)) * 1.1 || 1;
  const bw = (W - padL) / data.length;
  return (
    <div ref={ref} style={{ width: '100%' }}>
      {W > 0 && (
        <svg width={W} height={h} style={{ display: 'block', overflow: 'visible' }}>
          {data.map((d, i) => {
            const bh = ((d.value) / max) * (h - padB - padT);
            const x = padL + i * bw + bw * 0.18, bwR = bw * 0.64, yT = h - padB - bh;
            const c = CSSVAR(d.color || 'var(--blue)');
            return (
              <g key={i}>
                <rect x={x} y={yT} width={bwR} height={bh} rx="5" fill={c} style={{ animation: `fadeUp .5s ease ${i * 0.06}s both`, transformOrigin: `${x}px ${h - padB}px` }} />
                <text x={x + bwR / 2} y={yT - 6} textAnchor="middle" fontSize="10.5" fontWeight="600" fill="var(--ink-2)" fontFamily="var(--mono)">{yFmt(d.value)}</text>
                <text x={x + bwR / 2} y={h - 9} textAnchor="middle" fontSize="10" fill="var(--ink-3)">{d.label}</text>
              </g>
            );
          })}
        </svg>
      )}
    </div>
  );
}

/* ── Radial gauge (health score) ────────────────────────────────────────── */
function Gauge({ value, size = 180, thickness = 14, label, sub, tone = 'var(--green)' }) {
  const R = size / 2, r = R - thickness / 2 - 2;
  const circ = 2 * Math.PI * r;
  const [shown, setShown] = useStateC(0);
  useEffectC(() => { const t = setTimeout(() => setShown(value), 80); return () => clearTimeout(t); }, [value]);
  const c = CSSVAR(tone);
  return (
    <svg width={size} height={size} style={{ display: 'block' }}>
      <circle cx={R} cy={R} r={r} fill="none" stroke="var(--canvas-2)" strokeWidth={thickness} />
      <circle cx={R} cy={R} r={r} fill="none" stroke={c} strokeWidth={thickness} strokeLinecap="round"
        strokeDasharray={circ} strokeDashoffset={circ * (1 - shown / 100)}
        transform={`rotate(-90 ${R} ${R})`} style={{ transition: 'stroke-dashoffset 1.2s cubic-bezier(.4,0,.2,1)' }} />
      <text x={R} y={R - 2} textAnchor="middle" fontSize={size * 0.26} fontWeight="700" fill="var(--ink)" fontFamily="var(--mono)">{value}</text>
      {sub && <text x={R} y={R + size * 0.15} textAnchor="middle" fontSize={size * 0.075} fill="var(--ink-3)" fontFamily="var(--mono)" letterSpacing="0.1em">{sub}</text>}
    </svg>
  );
}

/* ── Radar (pillars) ────────────────────────────────────────────────────── */
function Radar({ axes, h = 260, bench }) {
  const [ref, w] = useWidth();
  const W = w || 320;
  const size = Math.min(W, h);
  const cx = W / 2, cy = h / 2, R = size / 2 - 34;
  const n = axes.length;
  const pt = (i, frac) => {
    const a = (-90 + (360 / n) * i) * Math.PI / 180;
    return [cx + R * frac * Math.cos(a), cy + R * frac * Math.sin(a)];
  };
  const poly = (vals) => vals.map((v, i) => pt(i, v / 100).join(',')).join(' ');
  return (
    <div ref={ref} style={{ width: '100%' }}>
      {W > 0 && (
        <svg width={W} height={h} style={{ display: 'block', overflow: 'visible' }}>
          {[0.25, 0.5, 0.75, 1].map((f, i) => (
            <polygon key={i} points={axes.map((_, j) => pt(j, f).join(',')).join(' ')} fill="none" stroke="var(--line)" strokeWidth="1" />
          ))}
          {axes.map((_, i) => { const [x, y] = pt(i, 1); return <line key={i} x1={cx} y1={cy} x2={x} y2={y} stroke="var(--line)" strokeWidth="1" />; })}
          {bench && <polygon points={poly(bench)} fill="none" stroke="var(--ink-4)" strokeWidth="1.5" strokeDasharray="3 3" />}
          <polygon points={poly(axes.map(a => a.v))} fill="var(--blue)" fillOpacity="0.12" stroke="var(--blue)" strokeWidth="2"
            style={{ animation: 'scaleIn .6s ease both', transformOrigin: `${cx}px ${cy}px` }} />
          {axes.map((a, i) => {
            const [x, y] = pt(i, 1.18);
            return (
              <g key={i}>
                <text x={x} y={y - 2} textAnchor="middle" fontSize="10.5" fontWeight="600" fill="var(--ink-2)">{a.k}</text>
                <text x={x} y={y + 11} textAnchor="middle" fontSize="10" fill="var(--ink-3)" fontFamily="var(--mono)">{a.v}</text>
              </g>
            );
          })}
        </svg>
      )}
    </div>
  );
}

/* ── Progress bar ───────────────────────────────────────────────────────── */
function ProgressBar({ pct, color = 'var(--blue)', h = 8, track = 'var(--canvas-2)' }) {
  const [shown, setShown] = useStateC(0);
  useEffectC(() => { const t = setTimeout(() => setShown(pct), 100); return () => clearTimeout(t); }, [pct]);
  return (
    <div style={{ height: h, background: track, borderRadius: 99, overflow: 'hidden', width: '100%' }}>
      <div style={{ height: '100%', width: `${Math.min(100, shown)}%`, background: CSSVAR(color), borderRadius: 99, transition: 'width 1s cubic-bezier(.4,0,.2,1)' }} />
    </div>
  );
}

Object.assign(window, { useWidth, Sparkline, LineChart, Donut, Funnel, Bars, Gauge, Radar, ProgressBar });
