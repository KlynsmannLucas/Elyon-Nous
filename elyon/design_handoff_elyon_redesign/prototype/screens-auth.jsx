/* ELYON NOUS — auth + onboarding --------------------------------------- */
const { useState: useStateA, useEffect: useEffectA } = React;

/* Floating metric chip for brand panel */
function FloatChip({ label, value, delta, good, x, y, delay, color }) {
  return (
    <div className="fade-up" style={{ position: 'absolute', left: x, top: y, animationDelay: delay,
      background: 'var(--paper)', border: '1px solid var(--line)', borderRadius: 'var(--r-md)', padding: '11px 14px',
      boxShadow: 'var(--sh-2)', minWidth: 140 }}>
      <div className="eyebrow" style={{ marginBottom: 4 }}>{label}</div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
        <span className="mono" style={{ fontSize: 18, fontWeight: 700 }}>{value}</span>
        {delta != null && <Delta v={delta} good={good} size={11} />}
      </div>
      {color && <div style={{ marginTop: 7 }}><Sparkline data={[3, 5, 4, 6, 5, 7, 8]} color={color} h={20} /></div>}
    </div>
  );
}

/* ── Login ──────────────────────────────────────────────────────────────── */
function Login({ onEnter }) {
  const [email, setEmail] = useStateA('rhyann@auroracapital.com.br');
  const [pwd, setPwd] = useStateA('············');
  return (
    <div style={{ height: '100vh', display: 'grid', gridTemplateColumns: '1.15fr 1fr', background: 'var(--canvas)' }}>
      {/* Brand panel */}
      <div style={{ position: 'relative', overflow: 'hidden', padding: '48px 56px', display: 'flex', flexDirection: 'column',
        background: 'radial-gradient(120% 90% at 0% 0%, var(--blue-soft) 0%, transparent 55%), radial-gradient(120% 90% at 100% 100%, var(--green-soft) 0%, transparent 55%), var(--paper)',
        borderRight: '1px solid var(--line)' }}>
        <Logo size={34} />
        <div style={{ margin: 'auto 0', maxWidth: 460 }}>
          <NousOrb size={64} />
          <h1 style={{ fontSize: 40, fontWeight: 700, letterSpacing: '-.03em', lineHeight: 1.08, margin: '22px 0 0' }}>
            A inteligência que <span style={{ color: 'var(--blue)' }}>decide</span> com seus dados.
          </h1>
          <p style={{ fontSize: 16, color: 'var(--ink-2)', lineHeight: 1.6, marginTop: 16 }}>
            Marketing e ciência de dados em um só lugar. O Elyon Nous conecta seus canais, lê os números por você
            e diz exatamente o que fazer hoje para crescer.
          </p>
          <div style={{ display: 'flex', gap: 10, marginTop: 26 }}>
            {[['layers', 'Dados unificados'], ['pulse', 'Diagnóstico contínuo'], ['bolt', 'Ações com impacto em R$']].map(([ic, t]) => (
              <div key={t} style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 12.5, color: 'var(--ink-2)', fontWeight: 500 }}>
                <span style={{ color: 'var(--green-600)' }}><Icon name={ic} size={16} /></span>{t}
              </div>
            ))}
          </div>
        </div>
        <FloatChip label="ROAS" value="3,2x" delta={12.5} good="up" x="58%" y="14%" delay=".2s" color="var(--green)" />
        <FloatChip label="Receita 7d" value="R$ 398k" delta={17.6} good="up" x="64%" y="62%" delay=".35s" color="var(--blue)" />
      </div>

      {/* Form */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 40 }}>
        <div style={{ width: '100%', maxWidth: 360 }} className="fade-up">
          <h2 style={{ fontSize: 24, fontWeight: 700, letterSpacing: '-.02em', margin: 0 }}>Bem-vindo de volta</h2>
          <p style={{ fontSize: 14, color: 'var(--ink-3)', margin: '6px 0 26px' }}>Entre para continuar de onde parou.</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <Field label="E-mail"><Input value={email} onChange={e => setEmail(e.target.value)} icon="users" /></Field>
            <Field label="Senha"><Input value={pwd} onChange={e => setPwd(e.target.value)} type="password" icon="link" /></Field>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12.5 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 7, color: 'var(--ink-2)' }}>
                <input type="checkbox" defaultChecked style={{ accentColor: 'var(--blue)' }} /> Manter conectado
              </label>
              <a href="#" style={{ color: 'var(--blue)', fontWeight: 600, textDecoration: 'none' }} onClick={e => e.preventDefault()}>Esqueci a senha</a>
            </div>
            <Button variant="primary" size="lg" full onClick={() => onEnter('app')} iconRight="arrowR">Entrar no painel</Button>
            <Button variant="ghost" size="lg" full onClick={() => onEnter('onboarding')}>Criar conta / Configurar</Button>
          </div>
          <div style={{ textAlign: 'center', fontSize: 11.5, color: 'var(--ink-4)', marginTop: 28 }} className="mono">
            ELYON NOUS · INTELIGÊNCIA DE MARKETING
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Onboarding ─────────────────────────────────────────────────────────── */
function Onboarding({ onDone }) {
  const [path, setPath] = useStateA(null); // null | 'pro' | 'beginner'
  const [step, setStep] = useStateA(0);
  const [channels, setChannels] = useStateA({ Meta: true, Google: true, TikTok: false, LinkedIn: false });
  const [niche, setNiche] = useStateA('Crédito & Fintech');
  const [goal, setGoal] = useStateA('escalar');
  const [prep, setPrep] = useStateA(0);

  useEffectA(() => {
    if (step !== lastStep) return;
    setPrep(0);
    const iv = setInterval(() => setPrep(p => { if (p >= 100) { clearInterval(iv); return 100; } return p + 4; }), 55);
    return () => clearInterval(iv);
  }, [step]);
  useEffectA(() => { if (step === lastStep && prep >= 100) { const t = setTimeout(() => onDone(), 700); return () => clearTimeout(t); } }, [prep, step]);

  const steps = path === 'beginner'
    ? ['Negócio', 'Nicho', 'Produtos', 'Verba', 'Unit economics', 'Persona', 'Pronto']
    : ['Canais', 'Negócio', 'Meta', 'Pronto'];
  const lastStep = steps.length - 1;
  const niches = ['Crédito & Fintech', 'E-commerce', 'Educação', 'Saúde', 'Serviços B2B', 'Imóveis'];
  const goals = [
    { k: 'escalar', t: 'Escalar resultados', d: 'Crescer receita mantendo a eficiência', icon: 'arrowUp' },
    { k: 'eficiencia', t: 'Reduzir CPA / CAC', d: 'Gastar melhor e baixar o custo de aquisição', icon: 'target' },
    { k: 'comecar', t: 'Começar do zero', d: 'Nunca anunciei — quero ser guiado', icon: 'spark' },
  ];
  const allChannels = ['Meta', 'Google', 'TikTok', 'LinkedIn'];

  // ── Fork: "Você já anuncia hoje?" ──────────────────────────────────────
  if (!path) {
    const Opt = ({ k, badge, icon, title, desc, bullets, accent }) => (
      <button onClick={() => { setPath(k); setStep(0); }}
        style={{ flex: 1, minWidth: 260, textAlign: 'left', padding: 26, background: 'var(--paper)',
          border: `1.5px solid var(--line)`, borderRadius: 'var(--r-lg)', boxShadow: 'var(--sh-1)', transition: 'all .18s' }}
        onMouseEnter={e => { e.currentTarget.style.borderColor = accent; e.currentTarget.style.boxShadow = 'var(--sh-3)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--line)'; e.currentTarget.style.boxShadow = 'var(--sh-1)'; e.currentTarget.style.transform = 'none'; }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <span style={{ width: 48, height: 48, borderRadius: 'var(--r-md)', background: accent, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon name={icon} size={24} /></span>
          <Badge tone={badge.tone}>{badge.label}</Badge>
        </div>
        <div style={{ fontSize: 19, fontWeight: 700, letterSpacing: '-.01em' }}>{title}</div>
        <p style={{ fontSize: 13.5, color: 'var(--ink-2)', lineHeight: 1.55, margin: '7px 0 16px' }}>{desc}</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {bullets.map((b, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 9, fontSize: 12.5, color: 'var(--ink-2)' }}>
              <span style={{ color: accent }}><Icon name="check" size={14} w={2.4} /></span>{b}
            </div>
          ))}
        </div>
        <div style={{ marginTop: 18, display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13.5, fontWeight: 700, color: accent }}>
          Começar por aqui <Icon name="arrowR" size={15} />
        </div>
      </button>
    );
    return (
      <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--canvas)' }}>
        <div style={{ padding: '20px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--line)', background: 'var(--paper)' }}>
          <Logo size={30} />
          <button onClick={onDone} style={{ background: 'none', border: 'none', color: 'var(--ink-3)', fontSize: 13, fontWeight: 600 }}>Pular →</button>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 24px' }}>
          <div style={{ width: '100%', maxWidth: 760 }} className="fade-up">
            <div style={{ textAlign: 'center', marginBottom: 30 }}>
              <NousOrb size={56} />
              <h1 style={{ fontSize: 30, fontWeight: 700, letterSpacing: '-.02em', margin: '16px 0 6px' }}>Você já anuncia hoje?</h1>
              <p style={{ fontSize: 15, color: 'var(--ink-2)' }}>Escolha o caminho e o NOUS se adapta ao seu nível.</p>
            </div>
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
              <Opt k="pro" accent="var(--blue)" icon="bolt" badge={{ tone: 'blue', label: 'Mais rápido' }}
                title="Já anuncio" desc="Conecte sua conta e o NOUS roda a auditoria automaticamente — primeiro resultado em poucos cliques."
                bullets={['Só nome + nicho', 'Conecta Meta/Google', 'Auditoria automática']} />
              <Opt k="beginner" accent="var(--green)" icon="spark" badge={{ tone: 'good', label: 'Guiado' }}
                title="Ainda não anuncio" desc="Um assistente completo te guia passo a passo, do nicho à persona, em modo iniciante."
                bullets={['Wizard guiado de 7 passos', 'Modo iniciante com IA', 'Sem precisar de conta']} />
            </div>
          </div>
        </div>
      </div>
    );
  }

  const begTitles = {
    0: ['Sobre o seu negócio', 'Como sua empresa se chama?'],
    1: ['Qual o seu nicho?', 'Para comparar com benchmarks reais do setor.'],
    2: ['O que você vende?', 'Seus principais produtos ou serviços.'],
    3: ['Qual a sua verba?', 'Quanto pretende investir por mês.'],
    4: ['Unit economics', 'Ticket médio e margem ajudam o NOUS a calcular metas.'],
    5: ['Sua persona', 'Quem é o seu cliente ideal? O NOUS refina depois.'],
  };

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--canvas)' }}>
      <div style={{ padding: '20px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--line)', background: 'var(--paper)' }}>
        <Logo size={30} />
        <button onClick={onDone} style={{ background: 'none', border: 'none', color: 'var(--ink-3)', fontSize: 13, fontWeight: 600 }}>Pular configuração →</button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', justifyContent: 'center', padding: '40px 24px' }}>
        <div style={{ width: '100%', maxWidth: 620 }}>
          {/* Stepper */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 34, justifyContent: 'center' }}>
            {steps.map((s, i) => (
              <React.Fragment key={s}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 26, height: 26, borderRadius: 99, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 12, fontWeight: 700, transition: 'all .2s',
                    background: i < step ? 'var(--green)' : i === step ? 'var(--blue)' : 'var(--canvas-2)',
                    color: i <= step ? '#fff' : 'var(--ink-3)' }} className="mono">
                    {i < step ? <Icon name="check" size={14} w={3} /> : i + 1}
                  </div>
                  <span style={{ fontSize: 12.5, fontWeight: i === step ? 600 : 500, color: i <= step ? 'var(--ink)' : 'var(--ink-3)' }}>{s}</span>
                </div>
                {i < steps.length - 1 && <div style={{ width: 28, height: 2, borderRadius: 99, background: i < step ? 'var(--green)' : 'var(--line)' }} />}
              </React.Fragment>
            ))}
          </div>

          <div key={step} className="fade-up">
            {path === 'beginner' && step < lastStep && (
              <div>
                <h2 style={{ fontSize: 26, fontWeight: 700, letterSpacing: '-.02em', margin: 0 }}>{begTitles[step][0]}</h2>
                <p style={{ fontSize: 14.5, color: 'var(--ink-2)', margin: '8px 0 24px' }}>{begTitles[step][1]}</p>
                {step === 0 && <Field label="Nome da empresa"><Input value="" onChange={() => {}} placeholder="Ex: Aurora Capital" icon="building" /></Field>}
                {step === 1 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {niches.map(n => (
                      <button key={n} onClick={() => setNiche(n)} style={{ padding: '9px 14px', fontSize: 13, fontWeight: 600, borderRadius: 'var(--r-pill)',
                        border: `1.5px solid ${niche === n ? 'var(--green)' : 'var(--line)'}`, background: niche === n ? 'var(--green-soft)' : 'var(--paper)',
                        color: niche === n ? 'var(--green-600)' : 'var(--ink-2)', transition: 'all .15s' }}>{n}</button>
                    ))}
                  </div>
                )}
                {step === 2 && <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}><Field label="Produto / serviço principal"><Input value="" onChange={() => {}} placeholder="Ex: Crédito pessoal" icon="money" /></Field><Field label="Preço / ticket"><Input value="" onChange={() => {}} placeholder="Ex: R$ 3.000" icon="money" /></Field></div>}
                {step === 3 && <div style={{ display: 'flex', gap: 12 }}><Field label="Verba mensal"><Input value="" onChange={() => {}} placeholder="R$ 10.000" icon="money" /></Field><Field label="Meta de leads/mês"><Input value="" onChange={() => {}} placeholder="500" icon="target" /></Field></div>}
                {step === 4 && <div style={{ display: 'flex', gap: 12 }}><Field label="Ticket médio"><Input value="" onChange={() => {}} placeholder="R$ 3.000" icon="money" /></Field><Field label="Margem (%)"><Input value="" onChange={() => {}} placeholder="35%" icon="scale" /></Field></div>}
                {step === 5 && <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}><Field label="Faixa etária"><Input value="" onChange={() => {}} placeholder="28–42 anos" icon="users" /></Field><Field label="O que motiva seu cliente?"><Input value="" onChange={() => {}} placeholder="Ex: organizar finanças" icon="spark" /></Field></div>}
              </div>
            )}

            {path === 'pro' && step === 0 && (
              <div>
                <h2 style={{ fontSize: 26, fontWeight: 700, letterSpacing: '-.02em', margin: 0 }}>Conecte seus canais</h2>
                <p style={{ fontSize: 14.5, color: 'var(--ink-2)', margin: '8px 0 24px' }}>O NOUS lê os dados direto da fonte — sem planilhas. Conecte ao menos um para começar.</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  {allChannels.map(c => {
                    const on = channels[c];
                    return (
                      <button key={c} onClick={() => setChannels(s => ({ ...s, [c]: !s[c] }))}
                        style={{ display: 'flex', alignItems: 'center', gap: 13, padding: 16, textAlign: 'left',
                          background: 'var(--paper)', border: `1.5px solid ${on ? 'var(--blue)' : 'var(--line)'}`, borderRadius: 'var(--r-md)',
                          boxShadow: on ? '0 0 0 3px var(--blue-soft)' : 'var(--sh-1)', transition: 'all .15s' }}>
                        <ChannelMark name={c} size={36} />
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 14, fontWeight: 600 }}>{c} Ads</div>
                          <div style={{ fontSize: 12, color: on ? 'var(--green-600)' : 'var(--ink-3)' }}>{on ? 'Conectado' : 'Toque para conectar'}</div>
                        </div>
                        <div style={{ width: 22, height: 22, borderRadius: 99, border: `2px solid ${on ? 'var(--blue)' : 'var(--line-strong)'}`,
                          background: on ? 'var(--blue)' : 'transparent', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          {on && <Icon name="check" size={13} w={3} />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {path === 'pro' && step === 1 && (
              <div>
                <h2 style={{ fontSize: 26, fontWeight: 700, letterSpacing: '-.02em', margin: 0 }}>Sobre o seu negócio</h2>
                <p style={{ fontSize: 14.5, color: 'var(--ink-2)', margin: '8px 0 24px' }}>Isso ajuda o NOUS a comparar você com benchmarks reais do seu setor.</p>
                <Field label="Nome da empresa"><Input value="Aurora Capital" onChange={() => {}} icon="building" /></Field>
                <div style={{ height: 18 }} />
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink-2)', marginBottom: 9 }}>Segmento / nicho</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {niches.map(n => (
                    <button key={n} onClick={() => setNiche(n)} style={{ padding: '9px 14px', fontSize: 13, fontWeight: 600, borderRadius: 'var(--r-pill)',
                      border: `1.5px solid ${niche === n ? 'var(--blue)' : 'var(--line)'}`, background: niche === n ? 'var(--blue-soft)' : 'var(--paper)',
                      color: niche === n ? 'var(--blue-600)' : 'var(--ink-2)', transition: 'all .15s' }}>{n}</button>
                  ))}
                </div>
              </div>
            )}

            {path === 'pro' && step === 2 && (
              <div>
                <h2 style={{ fontSize: 26, fontWeight: 700, letterSpacing: '-.02em', margin: 0 }}>Qual seu objetivo principal?</h2>
                <p style={{ fontSize: 14.5, color: 'var(--ink-2)', margin: '8px 0 24px' }}>O painel se adapta ao que importa pra você agora.</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {goals.map(g => {
                    const on = goal === g.k;
                    return (
                      <button key={g.k} onClick={() => setGoal(g.k)} style={{ display: 'flex', alignItems: 'center', gap: 15, padding: 17, textAlign: 'left',
                        background: 'var(--paper)', border: `1.5px solid ${on ? 'var(--blue)' : 'var(--line)'}`, borderRadius: 'var(--r-md)',
                        boxShadow: on ? '0 0 0 3px var(--blue-soft)' : 'var(--sh-1)', transition: 'all .15s' }}>
                        <span style={{ width: 42, height: 42, borderRadius: 'var(--r-sm)', background: on ? 'var(--blue)' : 'var(--canvas-2)', color: on ? '#fff' : 'var(--ink-2)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon name={g.icon} size={20} /></span>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 14.5, fontWeight: 600 }}>{g.t}</div>
                          <div style={{ fontSize: 12.5, color: 'var(--ink-3)' }}>{g.d}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {step === lastStep && (
              <div style={{ textAlign: 'center', padding: '30px 0' }}>
                <NousOrb size={72} thinking={prep < 100} />
                <h2 style={{ fontSize: 26, fontWeight: 700, letterSpacing: '-.02em', margin: '22px 0 8px' }}>
                  {prep < 100 ? 'O NOUS está montando seu painel…' : 'Tudo pronto, Rhyann!'}
                </h2>
                <p style={{ fontSize: 14.5, color: 'var(--ink-2)', maxWidth: 420, margin: '0 auto 24px' }}>
                  {prep < 100 ? 'Analisando seus canais, cruzando com benchmarks do setor e priorizando suas próximas ações.' : 'Seu primeiro briefing já está esperando por você.'}
                </p>
                <div style={{ maxWidth: 380, margin: '0 auto' }}>
                  <ProgressBar pct={prep} color="var(--blue)" h={10} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10, fontSize: 12 }} className="mono">
                    {['Conectando', 'Lendo dados', 'Benchmarks', 'Pronto'].map((s, i) => (
                      <span key={s} style={{ color: prep > i * 30 ? 'var(--green-600)' : 'var(--ink-4)', fontWeight: prep > i * 30 ? 600 : 500 }}>
                        {prep > i * 30 ? '✓ ' : ''}{s}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer nav */}
      {step < lastStep && (
        <div style={{ padding: '16px 32px', borderTop: '1px solid var(--line)', background: 'var(--paper)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Button variant="ghost" onClick={() => step === 0 ? setPath(null) : setStep(step - 1)} icon="chevL">{step === 0 ? 'Voltar' : 'Voltar'}</Button>
          <span className="mono" style={{ fontSize: 12, color: 'var(--ink-3)' }}>Passo {step + 1} de {steps.length}</span>
          <Button variant={path === 'beginner' ? 'green' : 'primary'} onClick={() => setStep(step + 1)} iconRight="arrowR">Continuar</Button>
        </div>
      )}
    </div>
  );
}

Object.assign(window, { Login, Onboarding });
