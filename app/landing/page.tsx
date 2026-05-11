'use client'

import { useAuth } from '@clerk/nextjs'

const CSS = `
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
:root{
  --bg:#1C1C1E;
  --surface:#242428;
  --card:#2A2A2E;
  --border:rgba(255,255,255,.08);
  --gold:#D4AF37;
  --gold-hi:#E8C84A;
  --gold-glow:rgba(212,175,55,.18);
  --green:#2AA22D;
  --green-dim:rgba(42,162,45,.15);
  --purple:#F557FA;
  --purple-dim:rgba(245,87,250,.12);
  --text:#F2F2F4;
  --muted:#8A8A96;
  --sub:#B0B0BC;
  --red:#FF4D4D;
  --f-display:'Syne',sans-serif;
  --f-body:'DM Sans',sans-serif;
  --f-mono:'JetBrains Mono',monospace;
}

body{background:var(--bg);color:var(--text);font-family:var(--f-body);-webkit-font-smoothing:antialiased;}

/* ── NAV ── */
.nav{position:fixed;top:0;left:0;right:0;z-index:100;height:64px;display:flex;align-items:center;justify-content:space-between;padding:0 48px;background:rgba(28,28,30,.92);backdrop-filter:blur(20px);border-bottom:1px solid var(--border);}
.nav-logo{font-family:var(--f-display);font-weight:800;font-size:18px;color:var(--gold);letter-spacing:-.3px;text-decoration:none;}
.nav-actions{display:flex;align-items:center;gap:12px;}
.nav-login{font-size:13px;color:var(--muted);text-decoration:none;transition:color .15s;}
.nav-login:hover{color:var(--text);}
.nav-cta{background:var(--gold);color:#000;font-weight:700;font-size:13px;padding:9px 20px;border-radius:8px;text-decoration:none;transition:all .18s;display:inline-flex;align-items:center;white-space:nowrap;}
.nav-cta:hover{background:var(--gold-hi);box-shadow:0 0 20px var(--gold-glow);}

/* ── LAYOUT ── */
.wrap{max-width:1100px;margin:0 auto;padding:0 24px;}
section{padding:96px 0;}

/* ── HERO ── */
.hero{padding:120px 0 80px;background:radial-gradient(ellipse 800px 400px at 50% 0%,rgba(212,175,55,.07) 0%,transparent 70%);}
.hero-inner{display:grid;grid-template-columns:1fr 1fr;gap:64px;align-items:center;}
.hero-badge{display:inline-flex;align-items:center;gap:8px;background:var(--gold-glow);border:1px solid rgba(212,175,55,.3);border-radius:999px;padding:5px 14px;font-family:var(--f-mono);font-size:11px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:var(--gold);margin-bottom:24px;}
.hero-badge-dot{width:6px;height:6px;border-radius:50%;background:var(--gold);animation:blink 2s infinite;}
@keyframes blink{0%,100%{opacity:1}50%{opacity:.3}}
.hero h1{font-family:var(--f-display);font-size:48px;font-weight:800;line-height:1.1;letter-spacing:-2px;color:var(--text);margin-bottom:20px;}
.hero h1 em{color:var(--gold);font-style:normal;}
.hero-sub{font-size:18px;color:var(--sub);line-height:1.6;margin-bottom:36px;max-width:480px;}
.cta-primary{background:linear-gradient(135deg,var(--gold),var(--gold-hi));color:#000;font-weight:800;font-size:16px;padding:16px 32px;border-radius:12px;border:none;cursor:pointer;font-family:var(--f-body);text-decoration:none;display:inline-flex;align-items:center;transition:all .2s;letter-spacing:-.2px;}
.cta-primary:hover{box-shadow:0 0 40px var(--gold-glow),0 8px 24px rgba(0,0,0,.4);transform:translateY(-2px);}
.cta-primary.lg{font-size:18px;padding:18px 40px;border-radius:14px;}
.hero-trust{display:flex;gap:20px;flex-wrap:wrap;margin-top:16px;}
.trust-item{display:flex;align-items:center;gap:6px;font-size:13px;color:var(--muted);}
.trust-check{color:var(--green);font-weight:700;}

/* ── CPL CARD ── */
.cpl-card{background:var(--surface);border:1px solid rgba(212,175,55,.2);border-radius:20px;padding:28px;box-shadow:0 0 60px rgba(212,175,55,.08),0 32px 80px rgba(0,0,0,.5);}
.cpl-card-title{font-family:var(--f-mono);font-size:11px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:var(--muted);margin-bottom:20px;display:flex;align-items:center;gap:8px;}
.cpl-dot{width:6px;height:6px;border-radius:50%;background:var(--green);animation:blink 2s infinite;}
.cpl-row{display:flex;justify-content:space-between;align-items:center;padding:12px 0;border-bottom:1px solid var(--border);}
.cpl-row:last-child{border-bottom:none;}
.cpl-label{font-size:13px;color:var(--muted);}
.cpl-value{font-family:var(--f-mono);font-size:20px;font-weight:700;}
.cpl-value.green{color:var(--green);}
.cpl-value.red{color:var(--red);}
.cpl-value.gold{color:var(--gold);}
.cpl-value.white{color:var(--text);}
.cpl-badge{font-size:11px;font-weight:700;padding:3px 8px;border-radius:6px;margin-left:8px;font-family:var(--f-mono);}
.badge-red{background:rgba(255,77,77,.15);color:var(--red);}
.cpl-loss{margin-top:20px;background:rgba(255,77,77,.08);border:1px solid rgba(255,77,77,.2);border-radius:12px;padding:14px 16px;display:flex;justify-content:space-between;align-items:center;}
.cpl-loss-label{font-size:13px;color:var(--red);}
.cpl-loss-value{font-family:var(--f-mono);font-size:22px;font-weight:800;color:var(--red);}

/* ── PAIN ── */
.pain{background:linear-gradient(180deg,var(--bg) 0%,rgba(36,36,40,1) 100%);}
.eyebrow{font-family:var(--f-mono);font-size:11px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:var(--gold);margin-bottom:16px;display:flex;align-items:center;gap:10px;}
.eyebrow::before{content:'';height:1px;width:28px;background:var(--gold);opacity:.6;}
.eyebrow.center{justify-content:center;}
.eyebrow.center::before{display:none;}
.section-title{font-family:var(--f-display);font-size:38px;font-weight:800;line-height:1.15;letter-spacing:-1.5px;color:var(--text);margin-bottom:20px;}
.section-title em{color:var(--gold);font-style:normal;}
.section-title.center{text-align:center;}
.section-sub{font-size:17px;color:var(--sub);line-height:1.65;margin-bottom:40px;}
.section-sub.center{text-align:center;max-width:560px;margin-left:auto;margin-right:auto;}

.pain-grid{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:32px;}
.pain-item{background:var(--surface);border:1px solid var(--border);border-radius:14px;padding:20px 22px;display:flex;align-items:flex-start;gap:14px;}
.pain-icon{font-size:20px;flex-shrink:0;margin-top:2px;}
.pain-text{font-size:15px;color:var(--sub);line-height:1.5;}
.pain-text strong{color:var(--text);}
.pain-close{background:rgba(255,77,77,.06);border:1px solid rgba(255,77,77,.2);border-radius:14px;padding:20px 24px;font-size:15px;color:var(--sub);line-height:1.6;text-align:center;}
.pain-close strong{color:var(--text);}

/* ── PROMISE ── */
.promise-list{display:grid;grid-template-columns:1fr 1fr;gap:16px;}
.promise-item{background:var(--surface);border:1px solid var(--border);border-radius:14px;padding:22px 24px;display:flex;align-items:center;gap:16px;transition:border-color .2s;}
.promise-item:hover{border-color:rgba(212,175,55,.3);}
.promise-num{width:40px;height:40px;border-radius:10px;background:var(--gold-glow);border:1px solid rgba(212,175,55,.3);display:flex;align-items:center;justify-content:center;font-family:var(--f-mono);font-size:13px;font-weight:800;color:var(--gold);flex-shrink:0;}
.promise-text{font-size:15px;color:var(--text);font-weight:600;}

/* ── PROOF ── */
.proof{background:linear-gradient(180deg,rgba(36,36,40,1) 0%,var(--bg) 100%);}
.proof-inner{display:grid;grid-template-columns:1fr 1fr;gap:56px;align-items:center;}
.proof-card{background:var(--surface);border:1px solid rgba(212,175,55,.2);border-radius:20px;padding:28px;box-shadow:0 0 60px rgba(212,175,55,.06);}
.proof-card-header{font-family:var(--f-mono);font-size:11px;letter-spacing:.1em;text-transform:uppercase;color:var(--muted);margin-bottom:20px;display:flex;align-items:center;gap:8px;}
.proof-metric{display:flex;justify-content:space-between;align-items:center;padding:14px 0;border-bottom:1px solid var(--border);}
.proof-metric:last-of-type{border-bottom:none;}
.proof-metric-label{font-size:14px;color:var(--muted);}
.proof-metric-value{font-family:var(--f-mono);font-size:22px;font-weight:700;}
.proof-loss-box{margin-top:20px;background:rgba(255,77,77,.08);border:1px solid rgba(255,77,77,.2);border-radius:12px;padding:16px 18px;display:flex;justify-content:space-between;align-items:center;}
.proof-copy{font-size:16px;color:var(--sub);line-height:1.7;}
.proof-copy strong{color:var(--text);}
.proof-tag{display:inline-flex;align-items:center;gap:8px;background:var(--green-dim);border:1px solid rgba(42,162,45,.3);border-radius:8px;padding:8px 14px;font-size:13px;font-weight:700;color:var(--green);margin-top:24px;}

/* ── HOW ── */
.steps{display:grid;grid-template-columns:repeat(3,1fr);gap:24px;}
.step{background:var(--surface);border:1px solid var(--border);border-radius:16px;padding:28px 24px;position:relative;transition:border-color .2s;}
.step:hover{border-color:rgba(212,175,55,.3);}
.step-num{font-family:var(--f-mono);font-size:11px;font-weight:700;letter-spacing:.1em;color:var(--gold);margin-bottom:16px;}
.step-icon{font-size:28px;margin-bottom:14px;}
.step-title{font-size:16px;font-weight:700;color:var(--text);margin-bottom:8px;}
.step-desc{font-size:14px;color:var(--muted);line-height:1.6;}
.step-connector{display:none;}

/* ── COMPARISON ── */
.compare-grid{display:grid;grid-template-columns:1fr 1fr;gap:16px;}
.compare-col{border-radius:18px;overflow:hidden;}
.compare-header{padding:16px 22px;font-family:var(--f-mono);font-size:12px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;}
.compare-header.bad{background:rgba(255,77,77,.1);color:var(--red);border:1px solid rgba(255,77,77,.2);border-bottom:none;border-radius:18px 18px 0 0;}
.compare-header.good{background:var(--gold-glow);color:var(--gold);border:1px solid rgba(212,175,55,.25);border-bottom:none;border-radius:18px 18px 0 0;}
.compare-body{padding:8px 0;}
.compare-body.bad{background:rgba(255,77,77,.04);border:1px solid rgba(255,77,77,.15);border-top:none;border-radius:0 0 18px 18px;}
.compare-body.good{background:rgba(212,175,55,.03);border:1px solid rgba(212,175,55,.2);border-top:none;border-radius:0 0 18px 18px;}
.compare-item{display:flex;align-items:flex-start;gap:12px;padding:12px 22px;border-bottom:1px solid var(--border);}
.compare-item:last-child{border-bottom:none;}
.compare-icon{font-size:14px;flex-shrink:0;margin-top:1px;}
.compare-text{font-size:14px;color:var(--sub);line-height:1.5;}

/* ── DELIVERABLES ── */
.deliver-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;}
.deliver-item{background:var(--surface);border:1px solid var(--border);border-radius:14px;padding:24px;transition:all .2s;}
.deliver-item:hover{border-color:rgba(212,175,55,.3);box-shadow:0 0 24px rgba(212,175,55,.05);}
.deliver-icon{font-size:28px;margin-bottom:14px;}
.deliver-title{font-size:15px;font-weight:700;color:var(--text);margin-bottom:6px;}
.deliver-desc{font-size:13px;color:var(--muted);line-height:1.6;}

/* ── SAAS ── */
.saas{background:linear-gradient(135deg,rgba(42,162,45,.05) 0%,var(--bg) 50%,rgba(245,87,250,.05) 100%);border-top:1px solid var(--border);border-bottom:1px solid var(--border);}
.saas-inner{display:grid;grid-template-columns:1fr 1fr;gap:64px;align-items:center;}
.saas-visual{background:var(--surface);border:1px solid var(--border);border-radius:16px;padding:24px;position:relative;}
.saas-metric-row{display:flex;align-items:center;justify-content:space-between;padding:10px 0;border-bottom:1px solid var(--border);}
.saas-metric-row:last-child{border-bottom:none;}
.saas-metric-label{font-size:13px;color:var(--muted);}
.saas-metric-bar{flex:1;height:4px;background:rgba(255,255,255,.06);border-radius:4px;margin:0 16px;overflow:hidden;}
.saas-metric-fill{height:100%;border-radius:4px;transition:width 1s ease;}
.saas-metric-val{font-family:var(--f-mono);font-size:12px;font-weight:700;}

/* ── PRICING ── */
.pricing{background:linear-gradient(180deg,var(--bg) 0%,rgba(36,36,40,1) 100%);}
.plans{display:grid;grid-template-columns:repeat(4,1fr);gap:16px;}
.plan{background:var(--surface);border:1px solid var(--border);border-radius:18px;padding:28px 22px;display:flex;flex-direction:column;transition:all .2s;position:relative;}
.plan:hover{border-color:rgba(212,175,55,.3);transform:translateY(-4px);box-shadow:0 16px 48px rgba(0,0,0,.4);}
.plan.featured{border-color:rgba(212,175,55,.4);background:linear-gradient(180deg,rgba(212,175,55,.06) 0%,var(--surface) 100%);box-shadow:0 0 40px rgba(212,175,55,.08);}
.plan-badge{position:absolute;top:-12px;left:50%;transform:translateX(-50%);background:var(--gold);color:#000;font-size:10px;font-weight:800;padding:3px 12px;border-radius:999px;letter-spacing:.06em;text-transform:uppercase;white-space:nowrap;}
.plan-name{font-family:var(--f-display);font-size:15px;font-weight:800;color:var(--text);margin-bottom:6px;}
.plan-desc{font-size:13px;color:var(--muted);margin-bottom:20px;line-height:1.5;min-height:36px;}
.plan-price{font-family:var(--f-mono);font-size:32px;font-weight:800;color:var(--text);margin-bottom:4px;line-height:1;}
.plan-price span{font-size:14px;color:var(--muted);font-family:var(--f-body);font-weight:400;}
.plan-free{font-family:var(--f-mono);font-size:28px;font-weight:800;color:var(--green);margin-bottom:4px;line-height:1;}
.plan-period{font-size:12px;color:var(--muted);margin-bottom:24px;}
.plan-cta{display:block;text-align:center;padding:12px;border-radius:10px;font-weight:700;font-size:14px;text-decoration:none;transition:all .18s;cursor:pointer;border:none;font-family:var(--f-body);margin-top:auto;}
.plan-cta.primary{background:linear-gradient(135deg,var(--gold),var(--gold-hi));color:#000;}
.plan-cta.primary:hover{box-shadow:0 0 24px var(--gold-glow);transform:translateY(-1px);}
.plan-cta.secondary{background:transparent;color:var(--sub);border:1px solid var(--border);}
.plan-cta.secondary:hover{color:var(--text);border-color:rgba(212,175,55,.3);}
.plan-cta.green{background:var(--green-dim);color:var(--green);border:1px solid rgba(42,162,45,.3);}
.plan-cta.green:hover{background:rgba(42,162,45,.25);}
.plan-features{list-style:none;margin-bottom:24px;display:flex;flex-direction:column;gap:8px;}
.plan-features li{display:flex;align-items:flex-start;gap:8px;font-size:13px;color:var(--sub);}
.plan-features li::before{content:'✓';color:var(--green);font-weight:700;flex-shrink:0;}
.plan-divider{height:1px;background:var(--border);margin:16px 0;}

/* ── OBJECTION ── */
.objection{background:linear-gradient(180deg,rgba(36,36,40,1) 0%,var(--bg) 100%);}
.obj-grid{display:grid;grid-template-columns:1fr 1fr;gap:56px;align-items:center;}
.obj-items{display:flex;flex-direction:column;gap:12px;}
.obj-item{background:var(--surface);border:1px solid var(--border);border-radius:12px;padding:16px 18px;display:flex;align-items:center;gap:14px;}
.obj-icon{font-size:20px;flex-shrink:0;}
.obj-text{font-size:14px;color:var(--sub);}
.obj-text strong{color:var(--text);}
.obj-cost{font-family:var(--f-mono);font-size:12px;font-weight:700;color:var(--red);margin-left:auto;white-space:nowrap;}

/* ── CTA FINAL ── */
.cta-final{background:radial-gradient(ellipse 1000px 400px at 50% 50%,rgba(212,175,55,.07) 0%,transparent 70%);text-align:center;padding:120px 0;}
.cta-final h2{font-family:var(--f-display);font-size:44px;font-weight:800;letter-spacing:-2px;color:var(--text);margin-bottom:16px;}
.cta-final h2 em{color:var(--gold);font-style:normal;}
.cta-final-sub{font-size:18px;color:var(--sub);margin-bottom:40px;}
.final-trust{display:flex;justify-content:center;gap:24px;flex-wrap:wrap;margin-top:20px;}

/* ── FOOTER ── */
.footer{background:var(--surface);border-top:1px solid var(--border);padding:32px 0;}
.footer-inner{display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:16px;}
.footer-logo{font-family:var(--f-display);font-weight:800;font-size:16px;color:var(--gold);}
.footer-links{display:flex;gap:20px;}
.footer-links a{font-size:13px;color:var(--muted);text-decoration:none;transition:color .15s;}
.footer-links a:hover{color:var(--text);}
.footer-copy{font-size:12px;color:var(--muted);}

/* ── RESPONSIVE ── */
@media(max-width:900px){
  .hero-inner,.proof-inner,.saas-inner,.obj-grid{grid-template-columns:1fr;}
  .plans{grid-template-columns:1fr 1fr;}
  .pain-grid,.promise-list,.compare-grid,.deliver-grid{grid-template-columns:1fr;}
  .steps{grid-template-columns:1fr;}
  .hero h1{font-size:34px;}
  .nav{padding:0 20px;}
  .wrap{padding:0 16px;}
  section{padding:64px 0;}
}
@media(max-width:560px){
  .plans{grid-template-columns:1fr;}
  .nav-logo{font-size:16px;}
}
`

const PAINS = [
  { icon: '💸', text: <><strong>Você não sabe qual deveria ser seu CPL.</strong> Só sabe o que está pagando agora.</> },
  { icon: '🎯', text: <><strong>Não tem como saber se está caro ou barato.</strong> Sem referência, qualquer número parece normal.</> },
  { icon: '🔁', text: <><strong>Continua investindo sem benchmark real.</strong> Muda criativo, agência e plataforma — o problema continua.</> },
  { icon: '🔥', text: <><strong>Só descobre o erro quando já perdeu dinheiro.</strong> O diagnóstico chega tarde demais.</> },
]

const PROMISES = [
  { n: '01', text: 'Quanto deveria pagar por lead no seu nicho' },
  { n: '02', text: 'Quanto está pagando hoje na realidade' },
  { n: '03', text: 'Quanto de dinheiro está sendo desperdiçado por mês' },
  { n: '04', text: 'O que corrigir primeiro para parar de perder' },
]

const STEPS = [
  { icon: '📋', title: 'Informe seu nicho e números', desc: 'Seu segmento, investimento mensal e resultado atual. Leva menos de 2 minutos.' },
  { icon: '📊', title: 'Comparamos com dados reais de mercado', desc: 'Benchmarks reais por nicho, região e tipo de campanha — não achismo.' },
  { icon: '🎯', title: 'Você recebe diagnóstico + plano de ação', desc: 'CPL ideal, gap de desperdício e o que fazer primeiro. Claro e direto.' },
]

const BAD = [
  '❌ Decide no feeling, sem referência real',
  '❌ Testa sem saber o que é certo',
  '❌ Descobre o erro quando já perdeu dinheiro',
  '❌ Troca agência e o problema continua',
]

const GOOD = [
  '✅ Sabe exatamente o CPL ideal do seu nicho',
  '✅ Sabe onde ajustar e quanto vai recuperar',
  '✅ Decide com base em dado real, não feeling',
  '✅ Para de perder dinheiro muito mais rápido',
]

const DELIVERABLES = [
  { icon: '🔍', title: 'Diagnóstico do seu negócio', desc: 'Análise comparativa do seu CPL atual versus o benchmark do mercado.' },
  { icon: '📈', title: 'Benchmark real do nicho', desc: 'Referências reais de empresas no mesmo segmento, região e porte.' },
  { icon: '💡', title: 'Identificação de desperdício', desc: 'Onde o dinheiro está vazando e quanto você está perdendo por mês.' },
  { icon: '🚀', title: 'Oportunidades de crescimento', desc: 'O que escalar, o que cortar e o que testar primeiro.' },
  { icon: '📋', title: 'Plano claro do que fazer', desc: 'Passos práticos para corrigir o CPL e parar de perder dinheiro.' },
  { icon: '🔄', title: 'Atualização contínua', desc: 'O mercado muda. Seus benchmarks também — sempre atualizados.' },
]

const PLANS = [
  {
    name: 'Diagnóstico',
    desc: 'Descubra onde está perdendo dinheiro',
    price: null,
    period: 'Gratuito para sempre',
    cta: 'Descobrir agora',
    ctaStyle: 'green',
    features: ['CPL ideal do seu nicho', 'Gap de desperdício', 'Prioridade de correção'],
    href: '/sign-in',
  },
  {
    name: 'Plataforma',
    desc: 'Acompanhe e ajuste com dados reais',
    price: 'R$297',
    period: '/mês',
    cta: 'Começar agora',
    ctaStyle: 'secondary',
    features: ['Tudo do Diagnóstico', 'Monitoramento contínuo', 'Alertas de desvio de CPL', '1 cliente'],
    href: '/sign-in',
  },
  {
    name: 'Profissional',
    desc: 'Escale campanhas com inteligência',
    price: 'R$997',
    period: '/mês',
    cta: 'Começar agora',
    ctaStyle: 'primary',
    featured: true,
    badge: 'Mais escolhido',
    features: ['Tudo da Plataforma', 'Até 8 clientes', 'Conexão Meta + Google Ads', 'Auditoria automática', 'Relatórios em PDF'],
    href: '/sign-in',
  },
  {
    name: 'Avançado',
    desc: 'Decisões estratégicas completas',
    price: 'R$2.997',
    period: '/mês',
    cta: 'Começar agora',
    ctaStyle: 'secondary',
    features: ['Tudo do Profissional', 'Até 15 clientes', 'Múltiplas contas por plataforma', 'Acesso à API', 'Suporte prioritário'],
    href: '/sign-in',
  },
]

const OBJECTIONS = [
  { icon: '🏢', text: <><strong>Agência sem contexto</strong> — cobra sem saber o benchmark</>, cost: '~R$2.000/mês' },
  { icon: '📊', text: <><strong>Planilhas manuais</strong> — atrasadas, propensas a erro</>, cost: 'Horas/semana' },
  { icon: '🎲', text: <><strong>Tentativa e erro</strong> — cada teste custa dinheiro real</>, cost: 'Variável' },
  { icon: '🤖', text: <><strong>Ferramentas genéricas</strong> — sem dados do seu nicho</>, cost: 'R$300–800/mês' },
]

export default function LandingPage() {
  const { isSignedIn } = useAuth()
  const ctaHref = isSignedIn ? '/dashboard' : '/sign-in'

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />

      {/* NAV */}
      <nav className="nav">
        <a href="/landing" className="nav-logo">ELYON NOUS</a>
        <div className="nav-actions">
          <a href={ctaHref} className="nav-login">Entrar</a>
          <a href={ctaHref} className="nav-cta">Fazer diagnóstico grátis</a>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="hero" style={{ paddingTop: 120 }}>
        <div className="wrap">
          <div className="hero-inner">
            <div>
              <div className="hero-badge">
                <span className="hero-badge-dot" />
                Diagnóstico gratuito disponível agora
              </div>
              <h1>
                Você está pagando <em>caro por lead.</em><br />
                E provavelmente nem percebeu.
              </h1>
              <p className="hero-sub">
                Descubra quanto você deveria pagar, onde está perdendo dinheiro e o que corrigir primeiro — em 3 minutos.
              </p>
              <a href={ctaHref} className="cta-primary">
                Descobrir meu CPL ideal agora (grátis) →
              </a>
              <div className="hero-trust">
                <span className="trust-item"><span className="trust-check">✓</span> Sem cartão</span>
                <span className="trust-item"><span className="trust-check">✓</span> Resultado em 3 minutos</span>
                <span className="trust-item"><span className="trust-check">✓</span> Dados reais do seu nicho</span>
              </div>
            </div>

            {/* CPL Card */}
            <div className="cpl-card">
              <div className="cpl-card-title">
                <span className="cpl-dot" />
                Diagnóstico — Clínica Odonto · SP
              </div>
              <div className="cpl-row">
                <span className="cpl-label">CPL ideal (benchmark)</span>
                <span className="cpl-value green">R$34</span>
              </div>
              <div className="cpl-row">
                <span className="cpl-label">CPL atual</span>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <span className="cpl-value red">R$68</span>
                  <span className="cpl-badge badge-red">+100%</span>
                </div>
              </div>
              <div className="cpl-row">
                <span className="cpl-label">Leads/mês</span>
                <span className="cpl-value white">210</span>
              </div>
              <div className="cpl-loss">
                <span className="cpl-loss-label">💸 Perda estimada/mês</span>
                <span className="cpl-loss-value">R$4.200</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── DOR ── */}
      <section className="pain">
        <div className="wrap">
          <div className="eyebrow">O problema real</div>
          <h2 className="section-title" style={{ maxWidth: 560 }}>
            O problema não é o tráfego.<br />É que você está <em>operando no escuro.</em>
          </h2>
          <div className="pain-grid">
            {PAINS.map((p, i) => (
              <div className="pain-item" key={i}>
                <span className="pain-icon">{p.icon}</span>
                <p className="pain-text">{p.text}</p>
              </div>
            ))}
          </div>
          <div className="pain-close">
            Enquanto isso, quem tem benchmark <strong>escala.</strong> Quem não tem… testa e <strong style={{ color: 'var(--red)' }}>perde.</strong>
          </div>
        </div>
      </section>

      {/* ── PROMESSA ── */}
      <section style={{ background: 'var(--bg)' }}>
        <div className="wrap">
          <div className="eyebrow center" style={{ justifyContent: 'center' }}>Em 3 minutos você descobre</div>
          <h2 className="section-title center" style={{ textAlign: 'center', maxWidth: 480, margin: '0 auto 40px' }}>
            Tudo que você precisa para <em>parar de perder dinheiro</em>
          </h2>
          <div className="promise-list">
            {PROMISES.map((p, i) => (
              <div className="promise-item" key={i}>
                <div className="promise-num">{p.n}</div>
                <span className="promise-text">{p.text}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PROVA ── */}
      <section className="proof">
        <div className="wrap">
          <div className="proof-inner">
            <div>
              <div className="eyebrow">Exemplo real</div>
              <h2 className="section-title">
                Diagnóstico completo.<br /><em>Resultado imediato.</em>
              </h2>
              <p className="proof-copy">
                Uma clínica odontológica em SP estava pagando <strong>R$68 por lead</strong>. O benchmark real do nicho era <strong>R$34</strong>. Ajuste nas campanhas reduziu o CPL em 47% em 3 semanas.
              </p>
              <div className="proof-tag">
                💰 Economia de R$50.400 no ano
              </div>
            </div>
            <div className="proof-card">
              <div className="proof-card-header">
                <span className="cpl-dot" />
                Relatório de diagnóstico — Exemplo
              </div>
              <div className="proof-metric">
                <span className="proof-metric-label">CPL atual</span>
                <span className="proof-metric-value" style={{ color: 'var(--red)' }}>R$68</span>
              </div>
              <div className="proof-metric">
                <span className="proof-metric-label">CPL ideal do nicho</span>
                <span className="proof-metric-value" style={{ color: 'var(--green)' }}>R$34</span>
              </div>
              <div className="proof-metric">
                <span className="proof-metric-label">Diferença</span>
                <span className="proof-metric-value" style={{ color: 'var(--red)' }}>+100%</span>
              </div>
              <div className="proof-metric">
                <span className="proof-metric-label">Leads/mês</span>
                <span className="proof-metric-value" style={{ color: 'var(--text)' }}>210</span>
              </div>
              <div className="proof-loss-box">
                <span style={{ fontSize: 14, color: 'var(--red)' }}>💸 Perda estimada/mês</span>
                <span style={{ fontFamily: 'var(--f-mono)', fontSize: 24, fontWeight: 800, color: 'var(--red)' }}>R$4.200</span>
              </div>
              <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: 14, textAlign: 'center', lineHeight: 1.5 }}>
                "O problema não era o tráfego. Era falta de referência."
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── COMO FUNCIONA ── */}
      <section style={{ background: 'var(--bg)' }}>
        <div className="wrap">
          <div className="eyebrow center" style={{ justifyContent: 'center' }}>Simples. Direto. Sem achismo.</div>
          <h2 className="section-title center" style={{ textAlign: 'center', maxWidth: 460, margin: '0 auto 48px' }}>
            Como funciona o diagnóstico
          </h2>
          <div className="steps">
            {STEPS.map((s, i) => (
              <div className="step" key={i}>
                <div className="step-num">PASSO {String(i + 1).padStart(2, '0')}</div>
                <div className="step-icon">{s.icon}</div>
                <div className="step-title">{s.title}</div>
                <p className="step-desc">{s.desc}</p>
              </div>
            ))}
          </div>
          <div style={{ textAlign: 'center', marginTop: 40 }}>
            <a href={ctaHref} className="cta-primary">Começar agora — é grátis →</a>
          </div>
        </div>
      </section>

      {/* ── COMPARAÇÃO ── */}
      <section style={{ background: 'linear-gradient(180deg,var(--bg) 0%,rgba(36,36,40,1) 100%)' }}>
        <div className="wrap">
          <div className="eyebrow center" style={{ justifyContent: 'center' }}>A diferença na prática</div>
          <h2 className="section-title center" style={{ textAlign: 'center', maxWidth: 440, margin: '0 auto 40px' }}>
            Com e sem <em>referência real</em>
          </h2>
          <div className="compare-grid">
            <div className="compare-col">
              <div className="compare-header bad">❌ Sem ELYON NOUS</div>
              <div className="compare-body bad">
                {BAD.map((t, i) => (
                  <div className="compare-item" key={i}>
                    <span className="compare-text" style={{ color: 'rgba(255,255,255,.5)' }}>{t}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="compare-col">
              <div className="compare-header good">✅ Com ELYON NOUS</div>
              <div className="compare-body good">
                {GOOD.map((t, i) => (
                  <div className="compare-item" key={i}>
                    <span className="compare-text">{t}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── O QUE VOCÊ RECEBE ── */}
      <section style={{ background: 'rgba(36,36,40,1)' }}>
        <div className="wrap">
          <div className="eyebrow center" style={{ justifyContent: 'center' }}>Não é ferramenta. É clareza.</div>
          <h2 className="section-title center" style={{ textAlign: 'center', maxWidth: 480, margin: '0 auto 40px' }}>
            O que você recebe no <em>diagnóstico</em>
          </h2>
          <div className="deliver-grid">
            {DELIVERABLES.map((d, i) => (
              <div className="deliver-item" key={i}>
                <div className="deliver-icon">{d.icon}</div>
                <div className="deliver-title">{d.title}</div>
                <p className="deliver-desc">{d.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CONTINUIDADE SAAS ── */}
      <section className="saas">
        <div className="wrap">
          <div className="saas-inner">
            <div>
              <div className="eyebrow">Acompanhamento contínuo</div>
              <h2 className="section-title">
                O mercado muda.<br /><em>Seu benchmark também.</em>
              </h2>
              <p className="section-sub">
                Seus concorrentes ajustam campanhas todos os dias. A ELYON NOUS continua analisando, comparando e mostrando exatamente o que fazer em cada momento — sem você precisar garimpar dados.
              </p>
              <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginTop: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--green)', display: 'inline-block' }} />
                  <span style={{ fontSize: 13, color: 'var(--muted)' }}>Benchmarks atualizados</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--purple)', display: 'inline-block' }} />
                  <span style={{ fontSize: 13, color: 'var(--muted)' }}>Alertas de desvio automáticos</span>
                </div>
              </div>
            </div>
            <div className="saas-visual">
              <div style={{ fontFamily: 'var(--f-mono)', fontSize: 11, color: 'var(--muted)', marginBottom: 16, letterSpacing: '.08em', textTransform: 'uppercase' }}>
                Monitor de CPL — Tempo real
              </div>
              {[
                { label: 'Odontologia SP', pct: 72, val: 'R$34', color: 'var(--green)' },
                { label: 'Imobiliário RJ', pct: 55, val: 'R$89', color: 'var(--gold)' },
                { label: 'Fitness BH', pct: 88, val: 'R$18', color: 'var(--green)' },
                { label: 'Jurídico SP', pct: 40, val: 'R$127', color: 'var(--purple)' },
                { label: 'E-commerce BR', pct: 65, val: 'R$52', color: 'var(--gold)' },
              ].map((m, i) => (
                <div className="saas-metric-row" key={i}>
                  <span className="saas-metric-label">{m.label}</span>
                  <div className="saas-metric-bar">
                    <div className="saas-metric-fill" style={{ width: `${m.pct}%`, background: m.color }} />
                  </div>
                  <span className="saas-metric-val" style={{ color: m.color }}>{m.val}</span>
                </div>
              ))}
              <div style={{ marginTop: 16, fontSize: 11, color: 'var(--muted)', textAlign: 'right', fontFamily: 'var(--f-mono)' }}>
                ● ao vivo · atualizado há 4min
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── PRICING ── */}
      <section className="pricing" id="pricing">
        <div className="wrap">
          <div className="eyebrow center" style={{ justifyContent: 'center' }}>Planos</div>
          <h2 className="section-title center" style={{ textAlign: 'center', maxWidth: 480, margin: '0 auto 48px' }}>
            Comece grátis. <em>Escale quando quiser.</em>
          </h2>
          <div className="plans">
            {PLANS.map((p, i) => (
              <div className={`plan${p.featured ? ' featured' : ''}`} key={i}>
                {p.badge && <div className="plan-badge">{p.badge}</div>}
                <div className="plan-name">{p.name}</div>
                <div className="plan-desc">{p.desc}</div>
                {p.price
                  ? <div className="plan-price">{p.price}<span>{p.period}</span></div>
                  : <div className="plan-free">Grátis</div>
                }
                <div className="plan-period">{p.price ? 'por mês' : 'Para sempre'}</div>
                <div className="plan-divider" />
                <ul className="plan-features">
                  {p.features.map((f, j) => <li key={j}>{f}</li>)}
                </ul>
                <a href={p.href} className={`plan-cta ${p.ctaStyle}`}>{p.cta}</a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── QUEBRA DE OBJEÇÃO ── */}
      <section className="objection">
        <div className="wrap">
          <div className="obj-grid">
            <div>
              <div className="eyebrow">Pense bem</div>
              <h2 className="section-title">
                Você já paga por isso.<br /><em>Só não tem os dados.</em>
              </h2>
              <p className="section-sub">
                Agência, planilha, tentativa e erro — você já investe em tentar entender o mercado. A diferença é que essas alternativas custam caro e não entregam benchmark real.
              </p>
              <a href={ctaHref} className="cta-primary" style={{ marginTop: 8, display: 'inline-flex' }}>
                Substituir agora — diagnóstico grátis →
              </a>
            </div>
            <div className="obj-items">
              {OBJECTIONS.map((o, i) => (
                <div className="obj-item" key={i}>
                  <span className="obj-icon">{o.icon}</span>
                  <p className="obj-text">{o.text}</p>
                  <span className="obj-cost">{o.cost}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA FINAL ── */}
      <section className="cta-final">
        <div className="wrap">
          <h2>
            Descubra agora quanto você<br />deveria pagar <em>por lead</em>
          </h2>
          <p className="cta-final-sub">
            Diagnóstico gratuito. Resultado em minutos. Sem compromisso.
          </p>
          <a href={ctaHref} className="cta-primary lg">
            Ver meu diagnóstico gratuito →
          </a>
          <div className="final-trust">
            <span className="trust-item"><span className="trust-check">✓</span> Resultado em minutos</span>
            <span className="trust-item"><span className="trust-check">✓</span> Sem compromisso</span>
            <span className="trust-item"><span className="trust-check">✓</span> 100% gratuito</span>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="footer">
        <div className="wrap">
          <div className="footer-inner">
            <span className="footer-logo">ELYON NOUS</span>
            <div className="footer-links">
              <a href="/termos">Termos</a>
              <a href="/privacidade">Privacidade</a>
              <a href="/cookies">Cookies</a>
              <a href="mailto:oi@elyonnous.com">Contato</a>
            </div>
            <span className="footer-copy">© 2025 ELYON NOUS</span>
          </div>
        </div>
      </footer>
    </>
  )
}
