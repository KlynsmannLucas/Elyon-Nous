/* ELYON NOUS — Estúdio: Biblioteca de assets + Criar campanha com IA ----- */
const { useState: useStateSt, useEffect: useEffectSt } = React;

/* Thumbnail placeholder (sem imagem real — listrado + label) */
function AssetThumb({ a, color }) {
  return (
    <div style={{ position: 'relative', aspectRatio: '16/9', borderBottom: '1px solid var(--line)', overflow: 'hidden',
      background: `repeating-linear-gradient(135deg, var(--canvas) 0 10px, var(--canvas-2) 10px 20px)`,
      display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <span style={{ width: 34, height: 34, borderRadius: 9, background: color, opacity: .16, position: 'absolute', filter: 'blur(8px)' }} />
      <span style={{ color, position: 'relative', zIndex: 1, opacity: .9 }}><Icon name={a.type === 'logo' ? 'layers' : a.type === 'product' ? 'grid' : a.type === 'lifestyle' ? 'image' : a.type === 'banner' ? 'megaphone' : 'doc'} size={20} /></span>
      <span className="mono" style={{ position: 'absolute', bottom: 7, left: 9, fontSize: 9.5, color: 'var(--ink-4)' }}>{a.type}</span>
      {a.fatigue && <span style={{ position: 'absolute', top: 8, right: 8 }}><Badge tone={a.fatigue === 'fadiga' ? 'bad' : 'good'}>{a.fatigue}</Badge></span>}
    </div>
  );
}

/* Painel de copy gerada pelo NOUS */
function CopyPanel({ asset, onClose }) {
  const D = window.DATA;
  const [loading, setLoading] = useStateSt(true);
  const [copied, setCopied] = useStateSt(null);
  useEffectSt(() => { const t = setTimeout(() => setLoading(false), 1300); return () => clearTimeout(t); }, []);
  const copy = (v, i) => { try { navigator.clipboard && navigator.clipboard.writeText(`${v.headline}\n\n${v.primary}\n\n[${v.cta}]`); } catch (e) {} setCopied(i); window.toast && window.toast({ tone: 'good', title: 'Copy copiada', body: 'Pronta para colar no anúncio.' }); setTimeout(() => setCopied(null), 1500); };
  return (
    <Modal open onClose={onClose} icon="sparkle2" width={620}
      title="Gerar copy com o NOUS" sub={asset ? `A partir de "${asset.name}"` : 'Variações de anúncio'}>
      {loading ? (
        <div style={{ textAlign: 'center', padding: '34px 0' }}>
          <NousOrb size={48} thinking />
          <div style={{ fontSize: 13.5, color: 'var(--ink-2)', marginTop: 14 }}>O NOUS está escrevendo variações a partir do criativo e do seu nicho…</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {D.copyVariants.map((v, i) => (
            <div key={i} className="fade-up" style={{ animationDelay: `${i * 0.06}s`, border: '1px solid var(--line)', borderRadius: 'var(--r-md)', padding: 15 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 9 }}>
                <Badge tone="blue" dot>{v.angle}</Badge>
                <button onClick={() => copy(v, i)} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'none', border: '1px solid var(--line)', borderRadius: 'var(--r-sm)', padding: '5px 10px', fontSize: 12, fontWeight: 600, color: copied === i ? 'var(--green-600)' : 'var(--ink-2)' }}>
                  <Icon name={copied === i ? 'check' : 'copy'} size={13} /> {copied === i ? 'Copiado' : 'Copiar'}
                </button>
              </div>
              <div style={{ fontSize: 14.5, fontWeight: 700, letterSpacing: '-.01em', marginBottom: 5 }}>{v.headline}</div>
              <p style={{ fontSize: 13, color: 'var(--ink-2)', lineHeight: 1.6, margin: 0 }}>{v.primary}</p>
              <div style={{ marginTop: 11 }}><span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600, color: 'var(--blue-600)', background: 'var(--blue-soft)', border: '1px solid var(--blue-line)', borderRadius: 'var(--r-pill)', padding: '5px 12px' }}>{v.cta} <Icon name="arrowR" size={12} /></span></div>
            </div>
          ))}
          <Button variant="soft" icon="refresh" full onClick={() => { setLoading(true); setTimeout(() => setLoading(false), 1100); }}>Gerar novas variações</Button>
        </div>
      )}
    </Modal>
  );
}

/* ═══ BIBLIOTECA DE ASSETS ═══════════════════════════════════════════════ */
function Biblioteca({ mode }) {
  const D = window.DATA;
  const [filter, setFilter] = useStateSt('all');
  const [q, setQ] = useStateSt('');
  const [copyFor, setCopyFor] = useStateSt(null);
  const cv = D.creativeVision;
  const colorOf = (t) => (D.assetTypes.find(x => x.k === t) || {}).color || 'var(--ink-3)';
  const labelOf = (t) => (D.assetTypes.find(x => x.k === t) || {}).label || t;
  const visible = D.assets.filter(a => (filter === 'all' || a.type === filter) && (!q || a.name.toLowerCase().includes(q.toLowerCase())));
  const countOf = (t) => D.assets.filter(a => a.type === t).length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Análise visual com IA */}
      <Card style={{ background: 'linear-gradient(110deg, var(--blue-soft), var(--green-soft))', borderColor: 'var(--blue-line)' }}>
        <div style={{ display: 'flex', gap: 13, flexWrap: 'wrap' }}>
          <NousOrb size={38} />
          <div style={{ flex: 1, minWidth: 240 }}>
            <div className="eyebrow" style={{ color: 'var(--blue-600)', marginBottom: 6 }}>Análise visual do NOUS · {cv.analyzed} criativos lidos</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {cv.findings.map((f, i) => {
                const t = TONES[f.tone];
                return (
                  <div key={i} style={{ display: 'flex', gap: 8, fontSize: 13, color: 'var(--ink)', lineHeight: 1.5 }}>
                    <span style={{ color: t.c, flexShrink: 0, marginTop: 2 }}><Icon name={f.tone === 'good' ? 'check' : f.tone === 'warn' ? 'alert' : 'spark'} size={14} w={2.2} /></span>{f.text}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </Card>

      {/* Cards por categoria */}
      <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))' }}>
        {D.assetTypes.map(t => {
          const active = filter === t.k;
          return (
            <button key={t.k} onClick={() => setFilter(active ? 'all' : t.k)}
              style={{ textAlign: 'center', padding: '15px 10px', borderRadius: 'var(--r-md)', cursor: 'pointer', transition: 'all .15s',
                background: active ? 'var(--paper)' : 'var(--paper)', border: `1px solid ${active ? t.color : 'var(--line)'}`,
                boxShadow: active ? 'var(--sh-2)' : 'var(--sh-1)' }}>
              <div style={{ color: t.color, display: 'flex', justifyContent: 'center', marginBottom: 7, opacity: active ? 1 : .75 }}><Icon name={t.k === 'logo' ? 'layers' : t.k === 'product' ? 'grid' : t.k === 'lifestyle' ? 'image' : t.k === 'banner' ? 'megaphone' : 'doc'} size={18} /></div>
              <div className="eyebrow" style={{ color: t.color, marginBottom: 4 }}>{t.label}</div>
              <div className="mono" style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-.02em' }}>{countOf(t.k)}</div>
            </button>
          );
        })}
      </div>

      {/* Upload */}
      <Card>
        <div onClick={() => window.toast && window.toast({ tone: 'blue', title: 'Upload', body: 'No produto: arraste imagens — salvas no Supabase Storage.' })}
          style={{ borderRadius: 'var(--r-md)', border: '2px dashed var(--line-strong)', padding: '34px 24px', textAlign: 'center', cursor: 'pointer', transition: 'all .18s' }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--blue-line)'; e.currentTarget.style.background = 'var(--blue-soft)'; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--line-strong)'; e.currentTarget.style.background = 'transparent'; }}>
          <span style={{ color: 'var(--ink-3)', display: 'inline-flex' }}><Icon name="download" size={26} style={{ transform: 'rotate(180deg)' }} /></span>
          <div style={{ fontSize: 14, fontWeight: 600, marginTop: 10 }}>Arraste imagens ou clique para enviar</div>
          <div style={{ fontSize: 11.5, color: 'var(--ink-3)', marginTop: 3 }}>PNG, JPG, SVG, WebP · máx 5 MB — usados para gerar anúncios automaticamente</div>
        </div>
      </Card>

      {/* Galeria */}
      <Card>
        <SectionHead title="Biblioteca de criativos" icon="image" sub={`${visible.length}${filter !== 'all' ? ' · ' + labelOf(filter) : ' de ' + D.assets.length}`}
          right={<div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <div style={{ width: 200 }}><Input value={q} onChange={e => setQ(e.target.value)} placeholder="Buscar por nome…" icon="search" /></div>
            <SourceBadge kind="real" />
          </div>} />
        <div style={{ display: 'grid', gap: 14, gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))' }}>
          {visible.map((a, i) => (
            <div key={a.id} className="fade-up" style={{ animationDelay: `${i * 0.03}s`, border: '1px solid var(--line)', borderRadius: 'var(--r-md)', overflow: 'hidden', background: 'var(--paper)', transition: 'border-color .18s, box-shadow .18s' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--blue-line)'; e.currentTarget.style.boxShadow = 'var(--sh-2)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--line)'; e.currentTarget.style.boxShadow = 'none'; }}>
              <AssetThumb a={a} color={colorOf(a.type)} />
              <div style={{ padding: 12 }}>
                <div style={{ fontSize: 12.5, fontWeight: 600, lineHeight: 1.35, marginBottom: 6 }} className="clamp-1">{a.name}</div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 11 }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11, color: 'var(--ink-3)' }}>
                    <span style={{ width: 7, height: 7, borderRadius: 2, background: colorOf(a.type) }} />{labelOf(a.type)}
                  </span>
                  <span className="mono" style={{ fontSize: 10.5, color: 'var(--ink-4)' }}>{a.size >= 1024 ? (a.size / 1024).toFixed(1) + ' MB' : a.size + ' KB'} · {a.date}</span>
                </div>
                <div style={{ display: 'flex', gap: 7 }}>
                  <Button size="sm" variant="soft" icon="sparkle2" full onClick={() => setCopyFor(a)}>Gerar copy</Button>
                  <button title="Excluir" onClick={() => window.toast && window.toast({ tone: 'neutral', title: 'Asset removido', body: a.name })}
                    style={{ width: 32, flexShrink: 0, borderRadius: 'var(--r-sm)', border: '1px solid var(--line)', background: 'var(--paper)', color: 'var(--ink-3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon name="close" size={14} /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
        {visible.length === 0 && <EmptyState icon="image" title="Nenhum criativo encontrado" body="Ajuste a busca ou o filtro de categoria." />}
      </Card>

      {copyFor && <CopyPanel asset={copyFor} onClose={() => setCopyFor(null)} />}
    </div>
  );
}

/* ═══ CRIAR CAMPANHA COM IA ══════════════════════════════════════════════ */
function PlanField({ label, value, mono }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, padding: '9px 0', borderBottom: '1px solid var(--line-2)', fontSize: 13 }}>
      <span style={{ color: 'var(--ink-3)', flexShrink: 0 }}>{label}</span>
      <span className={mono ? 'mono' : ''} style={{ fontWeight: 600, textAlign: 'right' }}>{value}</span>
    </div>
  );
}
function PlanCard({ icon, title, reasoning, children }) {
  return (
    <Card hover>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
        <span style={{ width: 30, height: 30, borderRadius: 8, background: 'var(--blue-soft)', color: 'var(--blue-600)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon name={icon} size={16} /></span>
        <span style={{ fontSize: 14, fontWeight: 700, letterSpacing: '-.01em' }}>{title}</span>
      </div>
      <div>{children}</div>
      {reasoning && (
        <div style={{ display: 'flex', gap: 8, marginTop: 11, padding: '9px 11px', background: 'var(--blue-soft)', border: '1px solid var(--blue-line)', borderRadius: 'var(--r-sm)' }}>
          <span style={{ color: 'var(--blue-600)', flexShrink: 0, marginTop: 1 }}><Icon name="sparkle2" size={13} /></span>
          <span style={{ fontSize: 12, color: 'var(--ink-2)', lineHeight: 1.5 }}>{reasoning}</span>
        </div>
      )}
    </Card>
  );
}

function CriarCampanha({ mode, onNav }) {
  const D = window.DATA, cb = D.campaignBuilder, p = cb.plan;
  const [step, setStep] = useStateSt('input');
  const [intent, setIntent] = useStateSt('');
  const [page, setPage] = useStateSt(cb.pages[0]);
  const [prog, setProg] = useStateSt(0); // creating step index

  const plan = () => { if (!intent.trim()) { window.toast && window.toast({ tone: 'warn', title: 'Descreva sua campanha', body: 'Conte ao NOUS o que você quer alcançar.' }); return; } setStep('planning'); setTimeout(() => setStep('review'), 1500); };
  const publish = () => { setStep('creating'); setProg(0); };
  useEffectSt(() => {
    if (step !== 'creating') return;
    if (prog >= cb.steps.length) { const t = setTimeout(() => setStep('done'), 500); return () => clearTimeout(t); }
    const t = setTimeout(() => setProg(p => p + 1), 850);
    return () => clearTimeout(t);
  }, [step, prog]);

  const ghostBtn = { display: 'inline-flex', alignItems: 'center', gap: 7, padding: '9px 15px', fontSize: 13.5, fontWeight: 600, borderRadius: 'var(--r-sm)', background: 'rgba(255,255,255,.06)', color: 'var(--on-ink)', border: '1px solid var(--ink-line)' };

  return (
    <div style={{ maxWidth: 760, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* INPUT — hero escuro */}
      {step === 'input' && (
        <div className="fade-up" style={{ borderRadius: 'var(--r-lg)', overflow: 'hidden', boxShadow: 'var(--sh-ink)', border: '1px solid var(--ink-line)',
          background: 'radial-gradient(130% 130% at 8% -10%, rgba(43,91,227,.32), transparent 48%), var(--ink-surface)', padding: '26px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
            <NousOrb size={44} />
            <div>
              <div className="eyebrow" style={{ color: 'var(--blue-500)' }}>Criar campanha · NOUS IA</div>
              <div style={{ fontSize: 19, fontWeight: 700, letterSpacing: '-.02em', color: 'var(--on-ink)', marginTop: 2 }}>Descreva o que você quer — o NOUS monta a campanha.</div>
            </div>
          </div>
          <textarea value={intent} onChange={e => setIntent(e.target.value)} rows={3} placeholder="Ex: gerar leads de crédito pessoal em São Paulo com R$ 150/dia, público 25–45…"
            style={{ width: '100%', resize: 'vertical', padding: '13px 15px', fontSize: 14, lineHeight: 1.55, color: 'var(--on-ink)', background: 'rgba(255,255,255,.05)',
              border: '1px solid var(--ink-line)', borderRadius: 'var(--r-md)', outline: 'none', fontFamily: 'var(--sans)' }} />
          <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap', marginTop: 12 }}>
            {cb.examples.map((ex, i) => (
              <button key={i} onClick={() => setIntent(ex)} style={{ fontSize: 11.5, color: 'var(--on-ink-2)', background: 'rgba(255,255,255,.05)', border: '1px solid var(--ink-line)', borderRadius: 'var(--r-pill)', padding: '6px 12px' }}>{ex}</button>
            ))}
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
            <Button variant="primary" icon="sparkle2" onClick={plan}>Planejar com o NOUS</Button>
          </div>
        </div>
      )}

      {/* PLANNING */}
      {step === 'planning' && (
        <Card style={{ textAlign: 'center', padding: '46px 24px' }} className="fade-in">
          <NousOrb size={56} thinking />
          <div style={{ fontSize: 16, fontWeight: 700, marginTop: 16 }}>O NOUS está planejando sua campanha…</div>
          <div style={{ fontSize: 13, color: 'var(--ink-3)', marginTop: 6 }}>Cruzando seu nicho, verba e público de melhor ROAS.</div>
        </Card>
      )}

      {/* REVIEW */}
      {step === 'review' && (
        <div className="fade-up" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Badge tone="blue" dot>Plano gerado pelo NOUS</Badge>
            <span style={{ fontSize: 12.5, color: 'var(--ink-3)' }}>Revise e ajuste antes de publicar — nada vai ao ar sem sua aprovação.</span>
          </div>
          <PlanCard icon="megaphone" title="Campanha" reasoning={p.campaign.reasoning}>
            <PlanField label="Nome" value={p.campaign.name} />
            <PlanField label="Objetivo" value={p.campaign.objective} />
            <PlanField label="Status inicial" value={p.campaign.status} />
          </PlanCard>
          <PlanCard icon="users" title="Público & Orçamento" reasoning={p.adset.reasoning}>
            <PlanField label="Conjunto" value={p.adset.name} />
            <PlanField label="Orçamento diário" value={D.fmt.brl(p.adset.budget)} mono />
            <PlanField label="Idade" value={p.adset.age} mono />
            <PlanField label="Localização" value={p.adset.geo} />
            <PlanField label="Otimização" value={p.adset.optimization} />
          </PlanCard>
          <PlanCard icon="image" title="Criativo" reasoning="Texto alinhado ao ângulo de maior CTR no seu histórico (urgência + aprovação rápida).">
            <PlanField label="Título" value={p.creative.headline} />
            <div style={{ padding: '9px 0', borderBottom: '1px solid var(--line-2)' }}>
              <div style={{ fontSize: 12, color: 'var(--ink-3)', marginBottom: 4 }}>Texto principal</div>
              <div style={{ fontSize: 13, color: 'var(--ink)', lineHeight: 1.55 }}>{p.creative.primary}</div>
            </div>
            <PlanField label="CTA" value={p.creative.cta} />
            <PlanField label="Destino" value={p.creative.url} mono />
          </PlanCard>
          <Card>
            <Field label="Publicar pela página"><Segmented value={page} onChange={setPage} options={cb.pages.map(p => ({ value: p, label: p }))} /></Field>
          </Card>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}>
            <Button variant="ghost" icon="chevL" onClick={() => setStep('input')}>Refazer</Button>
            <div style={{ display: 'flex', gap: 10 }}>
              <Button variant="ghost" icon="sparkle2" onClick={() => { setStep('planning'); setTimeout(() => setStep('review'), 1200); }}>Gerar outro plano</Button>
              <Button variant="primary" icon="rocket" onClick={publish}>Publicar campanha</Button>
            </div>
          </div>
        </div>
      )}

      {/* CREATING */}
      {step === 'creating' && (
        <Card className="fade-in" style={{ padding: '28px 26px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 11, marginBottom: 18 }}>
            <NousOrb size={40} thinking />
            <div><div style={{ fontSize: 15, fontWeight: 700 }}>Publicando na Meta…</div><div style={{ fontSize: 12.5, color: 'var(--ink-3)' }}>O NOUS executa cada etapa via API.</div></div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {cb.steps.map((s, i) => {
              const done = i < prog, active = i === prog;
              return (
                <div key={s.k} style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '11px 13px', borderRadius: 'var(--r-sm)',
                  background: done ? 'var(--green-soft)' : active ? 'var(--blue-soft)' : 'var(--canvas-2)', border: `1px solid ${done ? 'var(--green-line)' : active ? 'var(--blue-line)' : 'var(--line)'}`, transition: 'all .2s' }}>
                  <span style={{ width: 24, height: 24, borderRadius: 99, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: done ? 'var(--green)' : active ? 'var(--blue)' : 'var(--paper)', color: done || active ? '#fff' : 'var(--ink-4)', border: done || active ? 'none' : '1px solid var(--line-strong)' }}>
                    {done ? <Icon name="check" size={13} w={3} /> : active ? <span style={{ width: 9, height: 9, borderRadius: 99, background: '#fff', animation: 'pulseDot 1s infinite' }} /> : <span className="mono" style={{ fontSize: 11 }}>{i + 1}</span>}
                  </span>
                  <span style={{ fontSize: 13.5, fontWeight: 600, color: done ? 'var(--green-600)' : active ? 'var(--blue-600)' : 'var(--ink-3)' }}>{done ? s.done : s.label}</span>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* DONE */}
      {step === 'done' && (
        <Card className="scale-in" style={{ textAlign: 'center', padding: '40px 26px' }}>
          <span style={{ width: 56, height: 56, borderRadius: 99, background: 'var(--green-soft)', color: 'var(--green-600)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}><Icon name="check" size={28} w={2.6} /></span>
          <div style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-.02em' }}>Campanha criada com sucesso!</div>
          <p style={{ fontSize: 13.5, color: 'var(--ink-2)', maxWidth: 420, margin: '8px auto 0', lineHeight: 1.6 }}>Sua campanha está <b>pausada</b> na Meta, pronta para revisão final e ativação. O NOUS vai monitorar e avisar você no briefing.</p>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginTop: 20, flexWrap: 'wrap' }}>
            <Button variant="primary" icon="link" onClick={() => window.toast && window.toast({ tone: 'blue', title: 'Abrindo Meta Ads', body: 'Redirecionando para o gerenciador…' })}>Abrir na Meta</Button>
            <Button variant="ghost" icon="plus" onClick={() => { setIntent(''); setStep('input'); }}>Criar outra</Button>
            <Button variant="ghost" iconRight="arrowR" onClick={() => onNav('desempenho')}>Ver em Desempenho</Button>
          </div>
        </Card>
      )}
    </div>
  );
}

Object.assign(window, { Biblioteca, CriarCampanha, CopyPanel });
