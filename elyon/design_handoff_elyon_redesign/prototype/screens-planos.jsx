/* ELYON NOUS — Planos (recreated in light editorial theme) -------------- */
const { useState: useStatePl } = React;

/* Journey stepper: Diagnóstico → Acompanhamento → Operação */
function JourneyStepper({ active }) {
  const D = window.DATA;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
      {D.journey.map((s, i) => {
        const on = s.k === active;
        return (
          <React.Fragment key={s.k}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
              <span className="mono" style={{ fontSize: 10.5, letterSpacing: '.14em', color: on ? 'var(--blue-600)' : 'var(--ink-4)', fontWeight: 600 }}>
                PASSO {String(i + 1).padStart(2, '0')}
              </span>
              <span style={{ fontSize: 14, fontWeight: on ? 700 : 500, color: on ? 'var(--ink)' : 'var(--ink-3)' }}>{s.label}</span>
            </div>
            {i < D.journey.length - 1 && <Icon name="arrowR" size={15} style={{ color: 'var(--ink-4)' }} />}
          </React.Fragment>
        );
      })}
    </div>
  );
}

function PlanCard({ p, billing }) {
  const D = window.DATA;
  const accents = {
    green: { c: 'var(--green-600)', soft: 'var(--green-soft)', line: 'var(--green-line)', btn: 'green' },
    blue:  { c: 'var(--blue-600)',  soft: 'var(--blue-soft)',  line: 'var(--blue-line)',  btn: 'soft' },
    gold:  { c: 'var(--amber)',     soft: 'var(--amber-soft)', line: '#F2DDB0',            btn: 'primary' },
    ink:   { c: 'var(--ink)',       soft: 'var(--canvas-2)',   line: 'var(--line)',        btn: 'ghost' },
  };
  const a = accents[p.accent] || accents.blue;
  const yearly = p.price > 0 ? Math.round(p.price * 0.8) : 0;
  const shownPrice = p.price === 0 ? 'Grátis' : 'R$ ' + (billing === 'anual' ? yearly : p.price).toLocaleString('pt-BR');
  return (
    <div style={{ position: 'relative', display: 'flex', flexDirection: 'column',
      background: p.featured ? 'linear-gradient(180deg, var(--amber-soft) 0%, var(--paper) 38%)' : 'var(--paper)',
      border: `1.5px solid ${p.featured ? a.line : 'var(--line)'}`, borderRadius: 'var(--r-lg)', padding: 22,
      boxShadow: p.featured ? 'var(--sh-3)' : 'var(--sh-1)' }}>
      {p.badge && (
        <div style={{ position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)', whiteSpace: 'nowrap',
          background: 'var(--amber)', color: '#3a2c00', fontSize: 10.5, fontWeight: 700, letterSpacing: '.08em',
          textTransform: 'uppercase', padding: '5px 13px', borderRadius: 'var(--r-pill)', boxShadow: 'var(--sh-2)' }}>{p.badge}</div>
      )}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 17, fontWeight: 700, letterSpacing: '-.01em' }}>{p.name}</span>
        {p.current && <Badge tone="good" dot>Seu plano</Badge>}
      </div>
      <p style={{ fontSize: 12.5, color: 'var(--ink-3)', lineHeight: 1.5, margin: '7px 0 0', minHeight: 38 }}>{p.pitch}</p>

      <div style={{ height: 1, background: 'var(--line)', margin: '18px 0' }} />

      <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
        <span className="mono" style={{ fontSize: 30, fontWeight: 700, letterSpacing: '-.02em', color: p.price === 0 ? 'var(--green-600)' : 'var(--ink)' }}>{shownPrice}</span>
        {p.price > 0 && <span className="mono" style={{ fontSize: 13, color: 'var(--ink-3)' }}>/mês</span>}
      </div>
      <div style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 3 }}>
        {p.price === 0 ? p.cycle : billing === 'anual' ? 'cobrado anualmente · economize 20%' : p.cycle}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 11, margin: '20px 0 22px', flex: 1 }}>
        {p.features.map((f, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 9, fontSize: 13, color: 'var(--ink-2)' }}>
            <span style={{ color: a.c, flexShrink: 0, marginTop: 1 }}><Icon name="check" size={15} w={2.4} /></span>
            <span>{f}</span>
          </div>
        ))}
      </div>

      <Button variant={p.current ? 'ghost' : a.btn} full size="md" disabled={p.current}>
        {p.current ? 'Plano atual' : p.cta}
      </Button>
    </div>
  );
}

function Planos({ mode }) {
  const D = window.DATA;
  const [billing, setBilling] = useStatePl('mensal');
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14, flexWrap: 'wrap' }}>
        <JourneyStepper active="operacao" />
        <Segmented value={billing} onChange={setBilling}
          options={[{ value: 'mensal', label: 'Mensal' }, { value: 'anual', label: 'Anual −20%' }]} />
      </div>

      <NousBanner title="Recomendação do NOUS">
        Com 2 contas ativas e crescimento de receita consistente, o plano <b>Enterprise</b> mantém sua operação em inteligência contínua.
        Se for escalar para mais clientes, o <b>Agency</b> cobre até 8 com relatórios em PDF.
      </NousBanner>

      <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', alignItems: 'stretch', paddingTop: 8 }}>
        {D.plans.map((p, i) => (
          <div key={p.k} className="fade-up" style={{ animationDelay: `${i * 0.06}s`, display: 'flex' }}><PlanCard p={p} billing={billing} /></div>
        ))}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 9, justifyContent: 'center', color: 'var(--ink-3)', fontSize: 12.5, marginTop: 4 }}>
        <Icon name="check" size={15} style={{ color: 'var(--green-600)' }} />
        Sem fidelidade · cancele quando quiser · suporte humano em todos os planos
      </div>
    </div>
  );
}

Object.assign(window, { Planos, JourneyStepper, PlanCard });
