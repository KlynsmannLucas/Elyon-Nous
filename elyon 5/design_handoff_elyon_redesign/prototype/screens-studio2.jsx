/* ELYON NOUS — Estúdio II: Teste A/B · CRO · Conteúdo · Financeiro -------- */
const { useState: useStateS2 } = React;
const brl0 = (n) => 'R$ ' + Math.round(n).toLocaleString('pt-BR');
const fmtK = (n) => n >= 1e6 ? 'R$ ' + (n / 1e6).toFixed(1) + 'M' : n >= 1000 ? 'R$ ' + Math.round(n / 1000) + 'k' : 'R$ ' + Math.round(n);

/* ═══ TESTE A/B ══════════════════════════════════════════════════════════ */
function abCTR(v) { return v.impressions > 0 ? (v.clicks / v.impressions) * 100 : 0; }
function abCPL(v) { return v.conv > 0 ? Math.round(v.spend / v.conv) : 0; }
function abWinner(t) {
  if (t.status === 'winner_a') return 'a'; if (t.status === 'winner_b') return 'b';
  if (t.a.impressions < 300 || t.b.impressions < 300) return null;
  let sa = 0, sb = 0;
  if (abCTR(t.a) > abCTR(t.b) * 1.1) sa++; else if (abCTR(t.b) > abCTR(t.a) * 1.1) sb++;
  if (t.a.conv > t.b.conv * 1.1) sa++; else if (t.b.conv > t.a.conv * 1.1) sb++;
  return sa > sb ? 'a' : sb > sa ? 'b' : null;
}
function VariantCol({ label, v, win, lose }) {
  const metrics = [['Impressões', v.impressions ? v.impressions.toLocaleString('pt-BR') : '—'], ['Cliques', v.clicks ? v.clicks.toLocaleString('pt-BR') : '—'],
    ['CTR', v.impressions ? abCTR(v).toFixed(2) + '%' : '—'], ['Conversões', v.conv || '—'], ['CPL', abCPL(v) ? brl0(abCPL(v)) : '—'], ['Investido', v.spend ? brl0(v.spend) : '—']];
  return (
    <div style={{ position: 'relative', flex: 1, minWidth: 0, borderRadius: 'var(--r-md)', padding: 14,
      background: win ? 'var(--green-soft)' : 'var(--canvas)', border: `1px solid ${win ? 'var(--green-line)' : 'var(--line)'}`, opacity: lose ? .72 : 1 }}>
      {win && <span style={{ position: 'absolute', top: -10, right: 12 }}><Badge tone="good" dot>Vencedora</Badge></span>}
      <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 9 }}>
        <span style={{ width: 22, height: 22, borderRadius: 6, background: 'var(--blue-soft)', color: 'var(--blue-600)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800 }} className="mono">{label}</span>
        <span className="eyebrow">Variante {label}</span>
      </div>
      <div style={{ fontSize: 12.5, fontWeight: 600, lineHeight: 1.4, marginBottom: 11, minHeight: 34 }} className="clamp-2">{v.headline || '—'}</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
        {metrics.map(([l, val]) => (
          <div key={l} style={{ background: 'var(--paper)', border: '1px solid var(--line)', borderRadius: 'var(--r-xs)', padding: '6px 8px', textAlign: 'center' }}>
            <div className="mono" style={{ fontSize: 13, fontWeight: 700 }}>{val}</div>
            <div style={{ fontSize: 9.5, color: 'var(--ink-3)', marginTop: 1 }}>{l}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
function ABTestCard({ t }) {
  const win = abWinner(t);
  const stMap = { running: ['good', 'Rodando'], winner_a: ['blue', 'A venceu'], winner_b: ['blue', 'B venceu'], paused: ['neutral', 'Pausado'] };
  const st = stMap[t.status] || stMap.running;
  const hasData = t.a.impressions > 0 || t.b.impressions > 0;
  const bars = [['CTR', abCTR(t.a), abCTR(t.b), v => v.toFixed(2) + '%', true], ['CPL', abCPL(t.a), abCPL(t.b), v => v ? brl0(v) : '—', false], ['Conv.', t.a.conv, t.b.conv, v => String(v), true]];
  return (
    <Card hover>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 14, fontWeight: 700, letterSpacing: '-.01em' }}>{t.name}</span>
        <ChannelMark name={t.channel.replace(' Ads', '')} size={18} />
        <Badge tone={st[0]} dot>{st[1]}</Badge>
        <span className="mono" style={{ fontSize: 10.5, color: 'var(--ink-4)', marginLeft: 'auto' }}>{t.date}</span>
      </div>
      <div style={{ display: 'flex', gap: 12 }}>
        <VariantCol label="A" v={t.a} win={win === 'a'} lose={win === 'b'} />
        <VariantCol label="B" v={t.b} win={win === 'b'} lose={win === 'a'} />
      </div>
      {hasData && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14, marginTop: 14, paddingTop: 14, borderTop: '1px solid var(--line-2)' }}>
          {bars.map(([l, a, b, fmt, hi]) => {
            const tot = a + b || 1, pctA = (a / tot) * 100;
            const aw = hi ? a > b : (b > 0 && a < b); const bw = hi ? b > a : (a > 0 && b < a);
            return (
              <div key={l}>
                <div className="eyebrow" style={{ textAlign: 'center', marginBottom: 6 }}>{l}</div>
                <div style={{ display: 'flex', height: 6, borderRadius: 99, overflow: 'hidden', marginBottom: 6 }}>
                  <div style={{ width: pctA + '%', background: aw ? 'var(--blue)' : 'var(--line-strong)' }} />
                  <div style={{ width: (100 - pctA) + '%', background: bw ? 'var(--blue)' : 'var(--line-strong)' }} />
                </div>
                <div className="mono" style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11 }}>
                  <span style={{ color: aw ? 'var(--blue-600)' : 'var(--ink-3)', fontWeight: aw ? 700 : 500 }}>{fmt(a)}</span>
                  <span style={{ color: bw ? 'var(--blue-600)' : 'var(--ink-3)', fontWeight: bw ? 700 : 500 }}>{fmt(b)}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
      {win && t.status === 'running' && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12, padding: '9px 12px', background: 'var(--green-soft)', border: '1px solid var(--green-line)', borderRadius: 'var(--r-sm)' }}>
          <Icon name="spark" size={15} style={{ color: 'var(--green-600)' }} />
          <span style={{ fontSize: 12.5, color: 'var(--green-600)', fontWeight: 600 }}>Variante {win.toUpperCase()} está performando melhor — pode declarar vencedora.</span>
        </div>
      )}
      <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
        <Button size="sm" variant="ghost" icon="chart" onClick={() => window.toast && window.toast({ tone: 'blue', title: 'Atualizar métricas', body: 'Sincronizando com a plataforma…' })}>Atualizar métricas</Button>
        <Button size="sm" variant="soft" icon="sparkle2" onClick={() => window.toast && window.toast({ tone: 'good', title: 'Variante B gerada', body: 'O NOUS criou uma nova abordagem para testar.' })}>Gerar B com IA</Button>
      </div>
    </Card>
  );
}
function ABTest({ mode }) {
  const D = window.DATA;
  const running = D.abTests.filter(t => t.status === 'running');
  const rest = D.abTests.filter(t => t.status !== 'running');
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
        <div><div style={{ fontSize: 15, fontWeight: 600 }}>Testes A/B de criativos</div><div style={{ fontSize: 12.5, color: 'var(--ink-3)' }}>Compare copy, hooks e CTAs — deixe os dados escolherem o vencedor.</div></div>
        <Button variant="primary" icon="plus" onClick={() => window.toast && window.toast({ tone: 'blue', title: 'Novo teste A/B', body: 'Defina variante A e B para começar.' })}>Novo teste</Button>
      </div>
      <div className="eyebrow" style={{ display: 'flex', alignItems: 'center', gap: 8 }}><span className="live-dot" /> Ativos ({running.length})</div>
      {running.map(t => <ABTestCard key={t.id} t={t} />)}
      {rest.length > 0 && <><div className="eyebrow">Encerrados / pausados ({rest.length})</div>{rest.map(t => <ABTestCard key={t.id} t={t} />)}</>}
    </div>
  );
}

/* ═══ CRO ════════════════════════════════════════════════════════════════ */
const CRO_PRI = { urgent: ['bad', 'Urgente'], high: ['warn', 'Alta'], medium: ['blue', 'Média'], low: ['neutral', 'Baixa'] };
const CRO_AREA = { landing_page: 'Landing page', creative: 'Criativos', audience: 'Públicos', funnel: 'Funil', bid: 'Lances', budget: 'Orçamento', copy: 'Copy' };
function CRORec({ r }) {
  const [open, setOpen] = useStateS2(false);
  const pri = CRO_PRI[r.priority] || CRO_PRI.low; const t = TONES[pri[0]];
  return (
    <Card pad={0} style={{ overflow: 'hidden', borderColor: open ? t.b : 'var(--line)' }}>
      <button onClick={() => setOpen(o => !o)} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 11, padding: '13px 15px', background: 'transparent', border: 'none', textAlign: 'left' }}>
        <span style={{ width: 8, height: 8, borderRadius: 99, background: t.c, flexShrink: 0 }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13.5, fontWeight: 600, marginBottom: 5 }}>{r.title}</div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
            <Badge tone={pri[0]}>{pri[1]}</Badge>
            <span style={{ fontSize: 10.5, color: 'var(--ink-3)', background: 'var(--canvas-2)', border: '1px solid var(--line)', borderRadius: 'var(--r-xs)', padding: '2px 7px' }}>{CRO_AREA[r.area] || r.area}</span>
            {r.cpl > 0 && <Badge tone="good">−{r.cpl}% CPL</Badge>}
            <span className="mono" style={{ fontSize: 10.5, color: 'var(--ink-4)' }}>esforço {r.effort} · {r.time}</span>
          </div>
        </div>
        <Icon name="chevD" size={16} style={{ color: 'var(--ink-3)', transform: open ? 'rotate(180deg)' : 'none', transition: 'transform .2s', flexShrink: 0 }} />
      </button>
      {open && (
        <div style={{ padding: '0 15px 15px 34px', display: 'flex', flexDirection: 'column', gap: 11 }}>
          <div><div className="eyebrow" style={{ color: 'var(--red)', marginBottom: 3 }}>Problema</div><div style={{ fontSize: 12.5, color: 'var(--ink-2)', lineHeight: 1.55 }}>{r.problem}</div></div>
          <div><div className="eyebrow" style={{ color: 'var(--green-600)', marginBottom: 3 }}>Solução</div><div style={{ fontSize: 12.5, color: 'var(--ink-2)', lineHeight: 1.55 }}>{r.solution}</div></div>
          <div style={{ padding: '9px 11px', background: 'var(--blue-soft)', border: '1px solid var(--blue-line)', borderRadius: 'var(--r-sm)' }}>
            <div className="eyebrow" style={{ color: 'var(--blue-600)', marginBottom: 3 }}>Impacto esperado</div><div style={{ fontSize: 12.5, color: 'var(--ink)', fontWeight: 600 }}>{r.impact}</div>
          </div>
        </div>
      )}
    </Card>
  );
}
function CRO({ mode }) {
  const D = window.DATA, c = D.cro;
  const [run, setRun] = useStateS2(true);
  const [filter, setFilter] = useStateS2('all');
  const tone = c.score >= 80 ? 'var(--green)' : c.score >= 60 ? 'var(--amber)' : 'var(--red)';
  const recs = filter === 'all' ? c.recs : c.recs.filter(r => r.priority === filter);
  if (!run) return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <Card style={{ textAlign: 'center', padding: '40px 24px' }}>
        <span style={{ color: 'var(--ink-3)' }}><Icon name="target" size={28} /></span>
        <div style={{ fontSize: 16, fontWeight: 700, marginTop: 12 }}>Otimização de conversão (CRO)</div>
        <p style={{ fontSize: 13, color: 'var(--ink-2)', maxWidth: 420, margin: '6px auto 18px' }}>O NOUS analisa seu funil e sugere ações com impacto estimado no CPL.</p>
        <Button variant="primary" icon="target" onClick={() => setRun(true)}>Rodar análise CRO</Button>
      </Card>
    </div>
  );
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}><Button variant="ghost" size="sm" icon="refresh" onClick={() => window.toast && window.toast({ tone: 'blue', title: 'Reanalisando…', body: 'O NOUS está revisando seu funil.' })}>Reanalisar</Button></div>
      <Card>
        <div style={{ display: 'flex', gap: 20, alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flexShrink: 0 }}><Gauge value={c.score} size={120} tone={tone} sub={c.grade} /></div>
          <div style={{ flex: 1, minWidth: 220 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 8, fontSize: 10.5, fontWeight: 600, letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--blue-600)' }}><Icon name="sparkle2" size={13} /> Análise do NOUS</div>
            <div style={{ fontSize: 14.5, fontWeight: 600, lineHeight: 1.45 }}>{c.summary}</div>
            <div style={{ fontSize: 12.5, color: 'var(--ink-2)', marginTop: 8 }}>Gargalo principal: <b style={{ color: 'var(--ink)' }}>{c.bottleneck}</b></div>
          </div>
          <div style={{ textAlign: 'center', padding: '14px 18px', background: 'var(--green-soft)', border: '1px solid var(--green-line)', borderRadius: 'var(--r-md)' }}>
            <div className="eyebrow">CPL otimizado</div>
            <div className="mono" style={{ fontSize: 22, fontWeight: 700, color: 'var(--green-600)' }}>{brl0(c.cplOptimized)}</div>
            <div style={{ fontSize: 11, color: 'var(--ink-3)' }}>vs {brl0(c.cplCurrent)} atual</div>
          </div>
        </div>
      </Card>
      <Card style={{ background: 'var(--green-soft)', borderColor: 'var(--green-line)' }}>
        <div className="eyebrow" style={{ color: 'var(--green-600)', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 7 }}><Icon name="bolt" size={14} /> Quick wins — alto impacto, baixo esforço</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
          {c.quickWins.map((w, i) => <div key={i} style={{ display: 'flex', gap: 8, fontSize: 13, color: 'var(--ink)' }}><span style={{ color: 'var(--green-600)', flexShrink: 0 }}><Icon name="arrowR" size={14} /></span>{w}</div>)}
        </div>
      </Card>
      <div style={{ display: 'flex', alignItems: 'center', gap: 7, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 12, color: 'var(--ink-3)' }}>Filtrar:</span>
        {['all', 'urgent', 'high', 'medium', 'low'].map(f => {
          const n = f === 'all' ? c.recs.length : c.recs.filter(r => r.priority === f).length; if (!n) return null;
          const lbl = f === 'all' ? 'Todos' : CRO_PRI[f][1]; const active = filter === f;
          return <button key={f} onClick={() => setFilter(f)} style={{ fontSize: 11.5, fontWeight: 600, padding: '4px 11px', borderRadius: 'var(--r-pill)', border: `1px solid ${active ? 'var(--blue)' : 'var(--line)'}`, background: active ? 'var(--blue-soft)' : 'var(--paper)', color: active ? 'var(--blue-600)' : 'var(--ink-2)' }}>{lbl} ({n})</button>;
        })}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>{recs.map((r, i) => <CRORec key={i} r={r} />)}</div>
    </div>
  );
}

/* ═══ CONTEÚDO ═══════════════════════════════════════════════════════════ */
function ContentCopyBtn({ text }) {
  const [c, setC] = useStateS2(false);
  return <button onClick={() => { try { navigator.clipboard && navigator.clipboard.writeText(text); } catch (e) {} setC(true); setTimeout(() => setC(false), 1500); }}
    style={{ fontSize: 11, fontWeight: 600, padding: '3px 9px', borderRadius: 'var(--r-sm)', border: '1px solid var(--line)', background: 'var(--paper)', color: c ? 'var(--green-600)' : 'var(--ink-3)', display: 'inline-flex', alignItems: 'center', gap: 5 }}>
    <Icon name={c ? 'check' : 'copy'} size={12} /> {c ? 'Copiado' : 'Copiar'}</button>;
}
function PostCard({ p, i, color }) {
  return (
    <Card pad={0} style={{ overflow: 'hidden' }} className="fade-up">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderBottom: '1px solid var(--line)', background: 'var(--paper-2)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Badge tone="blue">{p.tipo}</Badge><span style={{ fontSize: 11.5, color: 'var(--ink-3)' }}>Ideia {i + 1}</span></div>
        <ContentCopyBtn text={`${p.gancho}\n\n${p.legenda}\n\n${p.cta}\n\n${p.hashtags.map(h => '#' + h).join(' ')}`} />
      </div>
      <div style={{ padding: 15, display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div><div className="eyebrow" style={{ color, marginBottom: 4 }}>Gancho</div><div style={{ fontSize: 13.5, fontWeight: 600, lineHeight: 1.4 }}>{p.gancho}</div></div>
        <div><div className="eyebrow" style={{ marginBottom: 4 }}>Estrutura</div><div style={{ fontSize: 12, color: 'var(--ink-2)', lineHeight: 1.55 }}>{p.estrutura}</div></div>
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}><div className="eyebrow">Legenda</div><ContentCopyBtn text={p.legenda} /></div>
          <div style={{ background: 'var(--canvas)', border: '1px solid var(--line)', borderRadius: 'var(--r-sm)', padding: '10px 12px', fontSize: 12.5, color: 'var(--ink-2)', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{p.legenda}</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '8px 12px', background: 'var(--blue-soft)', border: '1px solid var(--blue-line)', borderRadius: 'var(--r-sm)' }}>
          <div className="eyebrow" style={{ color: 'var(--blue-600)' }}>CTA</div><span style={{ fontSize: 12.5, color: 'var(--ink)', fontWeight: 600 }}>{p.cta}</span>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>{p.hashtags.map((h, j) => <span key={j} className="mono" style={{ fontSize: 11, color: 'var(--ink-3)', background: 'var(--canvas-2)', border: '1px solid var(--line)', borderRadius: 'var(--r-xs)', padding: '2px 7px' }}>#{h}</span>)}</div>
      </div>
    </Card>
  );
}
function Conteudo({ mode }) {
  const D = window.DATA;
  const [plat, setPlat] = useStateS2('instagram');
  const [theme, setTheme] = useStateS2('');
  const [posts, setPosts] = useStateS2([]);
  const [loading, setLoading] = useStateS2(false);
  const pl = D.contentPlatforms.find(p => p.k === plat);
  const gen = () => { if (!theme.trim()) { window.toast && window.toast({ tone: 'warn', title: 'Escolha um tema', body: 'Diga sobre o que o NOUS deve escrever.' }); return; } setLoading(true); setPosts([]); setTimeout(() => { setLoading(false); setPosts(D.contentPosts); }, 1400); };
  return (
    <div style={{ maxWidth: 760, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div><div style={{ fontSize: 15, fontWeight: 600 }}>Gerador de conteúdo</div><div style={{ fontSize: 12.5, color: 'var(--ink-3)' }}>A IA cria 3 ideias prontas — gancho, legenda, CTA e hashtags por plataforma.</div></div>
      <Card style={{ background: 'var(--blue-soft)', borderColor: 'var(--blue-line)' }} pad={13}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <NousOrb size={30} />
          <div style={{ fontSize: 12.5, color: 'var(--ink-2)' }}><b style={{ color: 'var(--ink)' }}>Persona ativa: Marina, 34</b> · crédito para organizar finanças — o conteúdo será personalizado.</div>
        </div>
      </Card>
      <Card>
        <div className="eyebrow" style={{ marginBottom: 11 }}>Plataforma</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 8 }}>
          {D.contentPlatforms.map(p => {
            const active = plat === p.k;
            return <button key={p.k} onClick={() => setPlat(p.k)} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 12px', borderRadius: 'var(--r-sm)', textAlign: 'left',
              background: active ? 'var(--paper)' : 'var(--canvas)', border: `1px solid ${active ? p.color : 'var(--line)'}`, boxShadow: active ? 'var(--sh-1)' : 'none' }}>
              <span style={{ width: 9, height: 9, borderRadius: 3, background: p.color, flexShrink: 0 }} /><span style={{ fontSize: 12.5, fontWeight: 600, color: active ? 'var(--ink)' : 'var(--ink-2)' }}>{p.label}</span></button>;
          })}
        </div>
      </Card>
      <Card>
        <div className="eyebrow" style={{ marginBottom: 11 }}>Tema do conteúdo</div>
        <Input value={theme} onChange={e => setTheme(e.target.value)} placeholder="Ex: como sair das dívidas sem comprometer o orçamento" icon="spark" />
        <div style={{ fontSize: 11, color: 'var(--ink-3)', margin: '11px 0 7px' }}>Sugestões rápidas:</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {D.contentThemes.map(s => <button key={s} onClick={() => setTheme(s)} style={{ fontSize: 11, padding: '5px 11px', borderRadius: 'var(--r-pill)', border: '1px solid var(--line)', background: 'var(--paper)', color: 'var(--ink-2)' }}>{s}</button>)}
        </div>
      </Card>
      <Button variant="primary" icon="sparkle2" full size="lg" onClick={gen} disabled={loading}>{loading ? 'Gerando conteúdo…' : `Gerar 3 ideias para ${pl.label}`}</Button>
      {loading && <Card style={{ textAlign: 'center', padding: '34px 0' }}><NousOrb size={44} thinking /><div style={{ fontSize: 13, color: 'var(--ink-2)', marginTop: 12 }}>O NOUS está escrevendo ideias para {pl.label}…</div></Card>}
      {posts.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><div className="eyebrow">3 ideias prontas para usar</div><button onClick={() => setPosts([])} style={{ fontSize: 11.5, color: 'var(--ink-3)', background: 'none', border: 'none' }}>Limpar</button></div>
          {posts.map((p, i) => <PostCard key={i} p={p} i={i} color={pl.color} />)}
        </div>
      )}
    </div>
  );
}

/* ═══ FINANCEIRO ═════════════════════════════════════════════════════════ */
function Financeiro({ mode }) {
  const D = window.DATA, f = D.finance;
  const feeOf = (c) => !c.active ? 0 : c.feeType === 'percent' ? c.budget * c.fee / 100 : c.fee;
  const mrr = f.clients.reduce((s, c) => s + feeOf(c), 0);
  const totalBudget = f.clients.reduce((s, c) => s + c.budget, 0);
  const activeN = f.clients.filter(c => c.active).length;
  const avg = activeN ? mrr / activeN : 0;
  const sorted = [...f.clients].sort((a, b) => feeOf(b) - feeOf(a));
  const kpis = [['MRR da agência', fmtK(mrr), 'Receita mensal recorrente', 'var(--blue)', 'money'], ['Clientes ativos', String(activeN), `de ${f.clients.length} cadastrados`, 'var(--green)', 'users'],
    ['Verba gerenciada', fmtK(totalBudget), 'Investimento mensal somado', 'var(--teal)', 'layers'], ['Ticket médio', fmtK(avg), 'Honorário médio por cliente', 'var(--amber)', 'target']];
  const cols = [
    { label: 'Cliente', bold: true, render: c => (<div style={{ minWidth: 150 }}><div style={{ fontWeight: 600 }}>{c.name}</div><div style={{ marginTop: 5 }}><ProgressBar pct={c.budget / totalBudget * 100} color="var(--blue)" h={5} /></div><div style={{ fontSize: 10, color: 'var(--ink-4)', marginTop: 3 }}>{Math.round(c.budget / totalBudget * 100)}% da verba total</div></div>) },
    { label: 'Nicho', render: c => <span style={{ color: 'var(--ink-2)' }}>{c.niche}</span> },
    { label: 'Verba/mês', align: 'right', mono: true, render: c => brl0(c.budget) },
    { label: 'Fee', align: 'right', mono: true, render: c => c.feeType === 'percent' ? c.fee + '%' : 'fixo' },
    { label: 'Honorário', align: 'right', mono: true, render: c => <span style={{ color: feeOf(c) > 0 ? 'var(--green-600)' : 'var(--ink-4)', fontWeight: 700 }}>{feeOf(c) > 0 ? brl0(feeOf(c)) : '—'}</span> },
    { label: 'Status', align: 'center', render: c => <Badge tone={c.active ? 'good' : 'neutral'} dot>{c.active ? 'Ativo' : 'Pausado'}</Badge> },
    { label: '', align: 'right', render: c => <Button size="sm" variant="ghost" onClick={() => window.toast && window.toast({ tone: 'blue', title: 'Configurar honorário', body: c.name })}>Editar</Button> },
  ];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div className="auto-kpi">
        {kpis.map(([l, v, sub, col, ic], i) => (
          <Card key={i} hover pad={16} style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="eyebrow">{l}</span>
              <span style={{ width: 28, height: 28, borderRadius: 8, background: 'var(--canvas-2)', color: col, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon name={ic} size={15} /></span>
            </div>
            <div className="mono count-up" style={{ fontSize: 24, fontWeight: 700, letterSpacing: '-.03em', color: col }}>{v}</div>
            <div style={{ fontSize: 11, color: 'var(--ink-3)' }}>{sub}</div>
          </Card>
        ))}
      </div>
      <div className="split-wide">
        <Card hover>
          <SectionHead title="Evolução do MRR" sub="Últimos 6 meses" icon="chart" />
          <Bars h={200} yFmt={v => fmtK(v)} data={f.mrrSeries.map((d, i) => ({ label: d.l, value: d.v, color: i === f.mrrSeries.length - 1 ? 'var(--blue)' : 'var(--blue-line)' }))} />
        </Card>
        <Card hover>
          <SectionHead title="Projeção anual" icon="trophy" />
          <div className="mono" style={{ fontSize: 28, fontWeight: 700, letterSpacing: '-.03em', color: 'var(--blue-600)' }}>{fmtK(mrr * 12)}</div>
          <div style={{ fontSize: 11.5, color: 'var(--ink-3)', marginBottom: 14 }}>se o MRR se mantiver constante</div>
          {[['MRR atual', mrr, 'var(--blue-600)'], ['Meta +30%', mrr * 1.3, 'var(--green-600)'], ['Meta +50%', mrr * 1.5, 'var(--amber)']].map(([l, v, c]) => (
            <div key={l} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderTop: '1px solid var(--line-2)' }}>
              <span style={{ fontSize: 12.5, color: 'var(--ink-2)' }}>{l}</span><span className="mono" style={{ fontSize: 13, fontWeight: 700, color: c }}>{fmtK(v)}</span>
            </div>
          ))}
        </Card>
      </div>
      <Card hover>
        <SectionHead title="Clientes & honorários" icon="building" sub={`${f.clients.length} clientes cadastrados`} />
        <DataTable cols={cols} rows={sorted} />
      </Card>
      <div className="cols-3">
        {[['Maior cliente', sorted[0].name, `Fee: ${brl0(feeOf(sorted[0]))}/mês`, 'trophy', 'var(--blue)'],
          ['Meta · +1 cliente', fmtK(mrr + avg), `+${fmtK(avg)} no ticket médio`, 'target', 'var(--green)'],
          ['Eficiência média', (mrr / totalBudget * 100).toFixed(1) + '%', 'Fee sobre verba gerenciada', 'pulse', 'var(--amber)']].map(([t, v, sub, ic, col]) => (
          <Card key={t} hover>
            <div className="eyebrow" style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 8 }}><Icon name={ic} size={14} style={{ color: col }} />{t}</div>
            <div style={{ fontSize: 17, fontWeight: 700, letterSpacing: '-.01em' }}>{v}</div>
            <div style={{ fontSize: 11.5, color: 'var(--ink-3)', marginTop: 3 }}>{sub}</div>
          </Card>
        ))}
      </div>
    </div>
  );
}

Object.assign(window, { ABTest, CRO, Conteudo, Financeiro });
