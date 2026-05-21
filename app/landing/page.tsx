import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'ELYON NOUS | Central de Decisão para Marketing',
  description:
    'Central de decisão para marketing e tráfego. Organize sinais de negócio, campanhas, audiência e funil para saber onde agir antes de gastar mais.',
  openGraph: {
    title: 'ELYON NOUS | Central de Decisão para Marketing',
    description:
      'Analise sinais do negócio, campanhas, audiência, funil e mercado para identificar gargalos e priorizar as próximas ações. Diagnóstico gratuito.',
    url: 'https://elyonnous.com',
    siteName: 'ELYON NOUS',
    type: 'website',
  },
}

const CSS = `
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
:root{
  --bg:#09090C;
  --surface:#111116;
  --surface-el:#17171D;
  --card:#16161C;
  --border:rgba(255,255,255,.06);
  --border-hi:rgba(255,255,255,.10);
  --gold:#D4AF37;
  --gold-hi:#E8C84A;
  --gold-dim:rgba(212,175,55,.08);
  --gold-glow:rgba(212,175,55,.18);
  --green:#22C55E;
  --green-dim:rgba(34,197,94,.10);
  --blue:#38BDF8;
  --purple:#A78BFA;
  --red:#F87171;
  --amber:#FBBF24;
  --text:#F4F4F6;
  --sub:#9A9AAA;
  --muted:#52525E;
  --f-display:'Syne',sans-serif;
  --f-body:'DM Sans',sans-serif;
  --f-mono:'JetBrains Mono',monospace;
  --r:14px;--rl:20px;--rxl:28px;
}
html{scroll-behavior:smooth;}
body{background:var(--bg);color:var(--text);font-family:var(--f-body);-webkit-font-smoothing:antialiased;line-height:1.5;}

/* ── NAV ── */
.nav{
  position:fixed;top:0;left:0;right:0;z-index:100;height:60px;
  display:flex;align-items:center;justify-content:space-between;padding:0 40px;
  background:rgba(9,9,12,.88);backdrop-filter:blur(24px);-webkit-backdrop-filter:blur(24px);
  border-bottom:1px solid var(--border);
}
.nav::after{
  content:'';position:absolute;bottom:-1px;left:0;right:0;height:1px;
  background:linear-gradient(90deg,transparent,rgba(212,175,55,.18),transparent);pointer-events:none;
}
.nav-logo{font-family:var(--f-display);font-weight:800;font-size:17px;color:var(--gold);
  letter-spacing:-.2px;text-decoration:none;display:flex;align-items:center;gap:7px;}
.nav-logo-mark{width:16px;height:16px;border-radius:4px;background:linear-gradient(135deg,var(--gold),rgba(212,175,55,.4));
  display:flex;align-items:center;justify-content:center;flex-shrink:0;}
.nav-logo-mark-inner{width:6px;height:6px;border-radius:50%;background:#000;}
.nav-links{display:flex;align-items:center;gap:22px;}
.nav-link{font-size:13px;color:var(--muted);text-decoration:none;transition:color .15s;}
.nav-link:hover{color:var(--sub);}
.nav-actions{display:flex;align-items:center;gap:10px;}
.nav-login{font-size:13px;color:var(--muted);text-decoration:none;padding:7px 14px;border-radius:8px;transition:all .15s;}
.nav-login:hover{color:var(--text);background:rgba(255,255,255,.04);}
.nav-cta{background:var(--gold);color:#000;font-weight:700;font-size:12.5px;padding:8px 18px;
  border-radius:8px;text-decoration:none;transition:all .2s;display:inline-flex;align-items:center;gap:6px;white-space:nowrap;}
.nav-cta:hover{background:var(--gold-hi);box-shadow:0 0 24px var(--gold-glow);}

/* ── LAYOUT ── */
.wrap{max-width:1100px;margin:0 auto;padding:0 28px;}
section{padding:96px 0;}

/* ── HERO ── */
.hero{
  padding:144px 0 108px;
  background:
    radial-gradient(ellipse 900px 700px at 65% -5%,rgba(212,175,55,.055) 0%,transparent 60%),
    radial-gradient(ellipse 500px 400px at 5% 90%,rgba(56,189,248,.025) 0%,transparent 55%);
  position:relative;overflow:hidden;
}
.hero::before{
  content:'';position:absolute;inset:0;
  background-image:linear-gradient(rgba(255,255,255,.013) 1px,transparent 1px),
    linear-gradient(90deg,rgba(255,255,255,.013) 1px,transparent 1px);
  background-size:60px 60px;
  mask-image:radial-gradient(ellipse 90% 80% at 50% 10%,black 0%,transparent 100%);
  -webkit-mask-image:radial-gradient(ellipse 90% 80% at 50% 10%,black 0%,transparent 100%);
  pointer-events:none;
}
.hero-inner{display:grid;grid-template-columns:1fr 1.1fr;gap:52px;align-items:start;position:relative;z-index:1;}
.hero-eyebrow{
  display:inline-flex;align-items:center;gap:8px;margin-bottom:20px;
  background:rgba(212,175,55,.07);border:1px solid rgba(212,175,55,.18);border-radius:999px;
  padding:5px 14px;font-family:var(--f-mono);font-size:10.5px;font-weight:700;
  letter-spacing:.12em;text-transform:uppercase;color:var(--gold);
}
.blink{width:5px;height:5px;border-radius:50%;background:var(--green);animation:pulse 2s infinite;display:inline-block;flex-shrink:0;}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:.2}}
.hero h1{
  font-family:var(--f-display);font-size:52px;font-weight:800;
  line-height:1.06;letter-spacing:-2.6px;color:var(--text);margin-bottom:20px;
}
.hero h1 em{color:var(--gold);font-style:normal;}
.hero-sub{font-size:16.5px;color:var(--sub);line-height:1.7;margin-bottom:28px;max-width:470px;}
.hero-ctas{display:flex;align-items:center;gap:12px;flex-wrap:wrap;margin-bottom:20px;}
.cta-primary{
  background:linear-gradient(135deg,var(--gold) 0%,var(--gold-hi) 100%);
  color:#000;font-weight:800;font-size:15px;padding:14px 28px;border-radius:var(--r);
  border:none;cursor:pointer;font-family:var(--f-body);text-decoration:none;
  display:inline-flex;align-items:center;gap:7px;transition:all .2s;letter-spacing:-.1px;
}
.cta-primary:hover{box-shadow:0 0 40px var(--gold-glow),0 8px 24px rgba(0,0,0,.4);transform:translateY(-2px);}
.cta-primary:focus-visible{outline:2px solid var(--gold);outline-offset:3px;}
.cta-primary.lg{font-size:17px;padding:17px 36px;border-radius:16px;}
.cta-ghost{
  font-size:14px;color:var(--sub);text-decoration:none;padding:12px 20px;
  border:1px solid var(--border);border-radius:var(--r);transition:all .18s;
  display:inline-flex;align-items:center;gap:6px;background:rgba(255,255,255,.02);
}
.cta-ghost:hover{color:var(--text);border-color:var(--border-hi);background:rgba(255,255,255,.04);}
.trust-row{display:flex;flex-wrap:wrap;gap:6px;}
.tc{display:inline-flex;align-items:center;gap:5px;background:rgba(255,255,255,.03);
  border:1px solid rgba(255,255,255,.055);border-radius:6px;padding:4px 10px;
  font-size:11.5px;color:var(--muted);}
.tc-check{color:var(--green);font-size:10px;font-weight:700;}

/* ── FULL DASHBOARD MOCKUP ── */
.hero-right{position:relative;padding-top:4px;}
.dash-card{
  background:var(--surface);border:1px solid rgba(212,175,55,.14);border-radius:var(--rxl);
  overflow:hidden;position:relative;
  box-shadow:0 0 80px rgba(212,175,55,.05),0 36px 72px rgba(0,0,0,.65),inset 0 1px 0 rgba(255,255,255,.04);
}
.dash-card::before{
  content:'';position:absolute;top:0;left:0;right:0;height:1px;
  background:linear-gradient(90deg,transparent,rgba(212,175,55,.5),transparent);pointer-events:none;z-index:2;
}
.fdb-chrome{
  display:flex;align-items:center;justify-content:space-between;
  padding:9px 14px;border-bottom:1px solid var(--border);
  background:rgba(0,0,0,.18);
}
.fdb-dots{display:flex;gap:5px;align-items:center;}
.fdb-dot{width:8px;height:8px;border-radius:50%;}
.fdb-dot-r{background:#FF5F57;}
.fdb-dot-y{background:#FEBC2E;}
.fdb-dot-g{background:#28C840;}
.fdb-chrome-title{font-family:var(--f-mono);font-size:10px;font-weight:700;
  letter-spacing:.08em;text-transform:uppercase;color:var(--muted);}
.fdb-live{font-family:var(--f-mono);font-size:9px;font-weight:700;letter-spacing:.1em;
  text-transform:uppercase;color:var(--green);display:flex;align-items:center;gap:4px;}
.fdb-body{display:grid;grid-template-columns:126px 1fr;overflow:hidden;}
.fdb-sidebar{
  border-right:1px solid var(--border);background:rgba(0,0,0,.1);
  overflow:hidden;padding:6px 0;
  -webkit-mask-image:linear-gradient(to bottom,black 78%,transparent 100%);
  mask-image:linear-gradient(to bottom,black 78%,transparent 100%);
}
.fdb-nav-group{margin-bottom:1px;}
.fdb-nav-group-label{
  font-family:var(--f-mono);font-size:7.5px;font-weight:700;letter-spacing:.1em;
  text-transform:uppercase;color:var(--muted);padding:5px 10px 2px;opacity:.6;
}
.fdb-nav-item{
  display:flex;align-items:center;gap:5px;padding:3px 10px;
  font-size:9.5px;color:var(--muted);transition:background .1s;
  cursor:default;white-space:nowrap;overflow:hidden;
}
.fdb-nav-item.active{
  background:rgba(212,175,55,.09);color:var(--gold);
  border-right:2px solid rgba(212,175,55,.5);
}
.fdb-nav-dot{width:3px;height:3px;border-radius:50%;background:var(--muted);flex-shrink:0;opacity:.5;}
.fdb-nav-dot.active{background:var(--gold);opacity:1;}
.fdb-main{display:flex;flex-direction:column;min-width:0;}
.fdb-main-header{
  padding:8px 12px;border-bottom:1px solid var(--border);
  display:flex;align-items:center;justify-content:space-between;
  background:rgba(255,255,255,.01);flex-shrink:0;
}
.fdb-main-title{
  font-family:var(--f-mono);font-size:9.5px;font-weight:700;
  letter-spacing:.08em;text-transform:uppercase;color:var(--muted);
  display:flex;align-items:center;gap:6px;
}
.fdb-badge{
  font-family:var(--f-mono);font-size:8.5px;font-weight:700;padding:2px 8px;border-radius:3px;
  background:rgba(34,197,94,.07);color:var(--green);border:1px solid rgba(34,197,94,.14);letter-spacing:.06em;
}
.fdb-content{padding:10px;}
.fdb-overview-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:5px;margin-bottom:7px;}
.fdb-block{
  background:rgba(255,255,255,.022);border:1px solid var(--border);
  border-radius:7px;padding:8px 9px;
}
.fdb-block-label{
  font-family:var(--f-mono);font-size:7.5px;font-weight:700;letter-spacing:.06em;
  text-transform:uppercase;color:var(--muted);margin-bottom:4px;
}
.fdb-block-val{font-family:var(--f-mono);font-size:15px;font-weight:800;line-height:1.1;}
.fdb-block-val.g{color:var(--green);}
.fdb-block-val.a{color:var(--amber);}
.fdb-block-val.r{color:var(--red);}
.fdb-block-val.gold{color:var(--gold);}
.fdb-block-sub{font-size:9px;color:var(--muted);margin-top:2px;}
.fdb-actions{
  background:rgba(212,175,55,.03);border:1px solid rgba(212,175,55,.1);
  border-radius:7px;padding:8px 10px;
}
.fdb-actions-label{
  font-family:var(--f-mono);font-size:7.5px;font-weight:700;letter-spacing:.06em;
  text-transform:uppercase;color:var(--gold);margin-bottom:6px;
}
.fdb-action-item{display:flex;align-items:flex-start;gap:5px;margin-bottom:4px;}
.fdb-action-item:last-child{margin-bottom:0;}
.fdb-action-num{
  font-family:var(--f-mono);font-size:7.5px;font-weight:700;color:var(--gold);
  background:rgba(212,175,55,.1);border-radius:2px;padding:1px 4px;flex-shrink:0;margin-top:1px;
}
.fdb-action-text{font-size:9.5px;color:var(--sub);line-height:1.4;}

/* Floating card on hero */
.hero-float{
  position:absolute;bottom:12px;right:0;
  background:rgba(23,23,29,.97);
  border:1px solid rgba(212,175,55,.22);border-radius:11px;
  padding:10px 14px;
  box-shadow:0 8px 32px rgba(0,0,0,.6);
  backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px);
  z-index:5;
}
.hero-float-label{
  font-family:var(--f-mono);font-size:8.5px;font-weight:700;letter-spacing:.1em;
  text-transform:uppercase;color:var(--gold);margin-bottom:3px;
}
.hero-float-val{font-family:var(--f-mono);font-size:20px;font-weight:800;color:var(--text);line-height:1;}
.hero-float-sub{font-size:9.5px;color:var(--muted);margin-top:2px;font-family:var(--f-mono);}

/* ── EYEBROW / TITLES ── */
.eyebrow{
  font-family:var(--f-mono);font-size:10.5px;font-weight:700;letter-spacing:.14em;
  text-transform:uppercase;color:var(--gold);margin-bottom:14px;
  display:flex;align-items:center;gap:10px;
}
.eyebrow::before{content:'';height:1px;width:20px;background:var(--gold);opacity:.35;}
.eyebrow.c{justify-content:center;}
.eyebrow.c::before{display:none;}
.section-title{
  font-family:var(--f-display);font-size:40px;font-weight:800;
  line-height:1.1;letter-spacing:-2px;color:var(--text);margin-bottom:18px;
}
.section-title em{color:var(--gold);font-style:normal;}
.section-title.c{text-align:center;}
.section-sub{font-size:16.5px;color:var(--sub);line-height:1.65;margin-bottom:40px;}
.section-sub.c{text-align:center;max-width:560px;margin-left:auto;margin-right:auto;}

/* ── INTELLIGENCE CONNECTION — "Uma inteligência que conecta os pontos" ── */
.intel-section{padding:96px 0;}
.intel-flow{display:flex;align-items:stretch;gap:0;}
.intel-block{
  flex:1;min-width:0;
  background:var(--surface);border:1px solid var(--border);border-radius:var(--rl);
  padding:22px 18px;position:relative;overflow:hidden;
  transition:border-color .2s,box-shadow .2s;
}
.intel-block:hover{border-color:rgba(212,175,55,.16);box-shadow:0 0 24px rgba(212,175,55,.03);}
.intel-block-line{
  position:absolute;top:0;left:0;right:0;height:2px;border-radius:var(--rl) var(--rl) 0 0;
}
.intel-sep{
  flex-shrink:0;width:24px;display:flex;align-items:flex-start;
  justify-content:center;padding-top:24px;
}
.intel-arrow{font-family:var(--f-mono);font-size:11px;color:var(--muted);opacity:.28;}
.intel-num{font-family:var(--f-mono);font-size:9.5px;font-weight:700;letter-spacing:.12em;margin-bottom:8px;}
.intel-title{font-size:13.5px;font-weight:700;color:var(--text);margin-bottom:10px;line-height:1.35;}
.intel-modules{display:flex;flex-wrap:wrap;gap:3px;margin-bottom:12px;}
.intel-mod-tag{
  font-family:var(--f-mono);font-size:8.5px;padding:2px 6px;border-radius:3px;
  background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.06);color:var(--muted);
  white-space:nowrap;
}
.intel-desc{font-size:12px;color:var(--muted);line-height:1.6;}

/* ── JOURNEY TIMELINE — "Do diagnóstico ao plano de ação" ── */
.jrn-section{
  background:var(--surface);
  border-top:1px solid var(--border);border-bottom:1px solid var(--border);
  padding:96px 0;
}
.jrn-track{display:grid;grid-template-columns:repeat(5,1fr);gap:0;position:relative;}
.jrn-track::before{
  content:'';position:absolute;top:15px;left:calc(10% + 1px);right:calc(10% + 1px);height:1px;
  background:linear-gradient(90deg,rgba(212,175,55,.45),rgba(212,175,55,.1));z-index:0;
}
.jrn-step{text-align:center;position:relative;z-index:1;padding:0 10px;}
.jrn-badge{
  width:30px;height:30px;border-radius:50%;
  background:var(--bg);border:1px solid var(--border);
  display:inline-flex;align-items:center;justify-content:center;
  font-family:var(--f-mono);font-size:10.5px;font-weight:700;color:var(--muted);
  margin:0 auto 16px;
}
.jrn-badge.first{background:var(--gold-dim);border-color:rgba(212,175,55,.3);color:var(--gold);}
.jrn-title{font-size:13.5px;font-weight:700;color:var(--text);margin-bottom:8px;line-height:1.3;}
.jrn-desc{font-size:12px;color:var(--muted);line-height:1.6;}

/* ── STEPS ── */
.steps{display:grid;grid-template-columns:repeat(3,1fr);gap:20px;position:relative;}
.steps::before{
  content:'';position:absolute;top:23px;left:calc(16.67% + 12px);right:calc(16.67% + 12px);
  height:1px;background:linear-gradient(90deg,rgba(212,175,55,.3),rgba(212,175,55,.08));z-index:0;
}
.step{background:var(--surface);border:1px solid var(--border);border-radius:var(--rl);
  padding:28px 24px;transition:border-color .2s,box-shadow .2s;position:relative;z-index:1;}
.step:hover{border-color:rgba(212,175,55,.2);box-shadow:0 0 24px rgba(212,175,55,.04);}
.step-badge{
  width:32px;height:32px;border-radius:50%;
  background:var(--gold-dim);border:1px solid rgba(212,175,55,.2);
  display:flex;align-items:center;justify-content:center;
  font-family:var(--f-mono);font-size:12px;font-weight:700;color:var(--gold);margin-bottom:18px;
}
.step-title{font-size:15px;font-weight:700;color:var(--text);margin-bottom:8px;line-height:1.4;}
.step-desc{font-size:13px;color:var(--muted);line-height:1.6;}

/* ── PRODUCT PANEL (diagnóstico demo) ── */
.product-panel{
  background:var(--surface);border:1px solid var(--border);border-radius:var(--rxl);
  overflow:hidden;position:relative;box-shadow:0 0 60px rgba(212,175,55,.03);
}
.product-panel::before{
  content:'';position:absolute;top:0;left:0;right:0;height:1px;
  background:linear-gradient(90deg,transparent,rgba(212,175,55,.35),transparent);pointer-events:none;
}
.pp-header{
  padding:13px 22px;border-bottom:1px solid var(--border);
  display:flex;align-items:center;justify-content:space-between;background:rgba(255,255,255,.01);
}
.pp-header-title{
  font-family:var(--f-mono);font-size:10px;font-weight:700;letter-spacing:.11em;
  text-transform:uppercase;color:var(--muted);display:flex;align-items:center;gap:8px;
}
.pp-badge{
  font-family:var(--f-mono);font-size:9px;font-weight:700;padding:3px 10px;border-radius:4px;
  background:rgba(34,197,94,.07);color:var(--green);border:1px solid rgba(34,197,94,.14);letter-spacing:.06em;
}
.pp-metrics{display:grid;grid-template-columns:repeat(5,1fr);border-bottom:1px solid var(--border);}
.pp-m{padding:17px 16px;border-right:1px solid var(--border);}
.pp-m:last-child{border-right:none;}
.pp-m-label{font-size:9.5px;color:var(--muted);font-family:var(--f-mono);letter-spacing:.06em;text-transform:uppercase;margin-bottom:7px;}
.pp-m-val{font-family:var(--f-mono);font-size:18px;font-weight:800;line-height:1;margin-bottom:3px;}
.pp-m-val.r{color:var(--red);}
.pp-m-val.g{color:var(--green);}
.pp-m-val.a{color:var(--amber);}
.pp-m-val.gold{color:var(--gold);}
.pp-m-sub{font-size:10.5px;color:var(--muted);}
.pp-bar-section{padding:16px 22px;border-bottom:1px solid var(--border);}
.pp-bar-label{font-size:9.5px;color:var(--muted);font-family:var(--f-mono);letter-spacing:.06em;text-transform:uppercase;margin-bottom:10px;}
.bar-row{display:flex;align-items:center;gap:9px;margin-bottom:5px;}
.bar-row:last-child{margin-bottom:0;}
.bar-lbl{font-size:9.5px;color:var(--muted);font-family:var(--f-mono);width:28px;flex-shrink:0;text-align:right;}
.bar-track{flex:1;height:4px;background:rgba(255,255,255,.05);border-radius:2px;overflow:hidden;}
.bar-fill{height:100%;border-radius:2px;}
.bar-fill.g{background:var(--green);}
.bar-fill.r{background:var(--red);}
.bar-val{font-size:10px;font-family:var(--f-mono);font-weight:700;width:34px;text-align:right;flex-shrink:0;}
.bar-val.g{color:var(--green);}
.bar-val.r{color:var(--red);}
.pp-insights{display:grid;grid-template-columns:1fr 1fr;}
.pp-insight{padding:16px 22px;border-right:1px solid var(--border);}
.pp-insight:last-child{border-right:none;}
.pp-insight-label{font-size:9px;font-family:var(--f-mono);font-weight:700;letter-spacing:.1em;text-transform:uppercase;margin-bottom:6px;}
.pp-insight-label.gold{color:var(--gold);}
.pp-insight-label.blue{color:var(--blue);}
.pp-insight-text{font-size:13px;color:var(--sub);line-height:1.6;}

/* ── CPL INVESTIGATION PANEL ── */
.cplinv-wrapper{display:grid;grid-template-columns:1fr 1fr;gap:40px;align-items:start;}
.cplinv-copy p{font-size:15px;color:var(--sub);line-height:1.7;margin-bottom:16px;}
.cplinv-copy p strong{color:var(--text);}
.cplinv-copy p em{color:var(--gold);font-style:normal;}
.cplinv-panel{
  background:var(--surface);border:1px solid var(--border);border-radius:var(--rl);overflow:hidden;
}
.cplinv-panel-header{
  padding:11px 18px;border-bottom:1px solid var(--border);
  background:rgba(248,113,113,.025);
  font-family:var(--f-mono);font-size:9.5px;font-weight:700;letter-spacing:.08em;
  text-transform:uppercase;color:var(--red);display:flex;align-items:center;gap:6px;
}
.cplinv-item{
  display:grid;grid-template-columns:64px 1fr;border-bottom:1px solid var(--border);
  transition:background .12s;
}
.cplinv-item:last-child{border-bottom:none;}
.cplinv-item:hover{background:rgba(255,255,255,.012);}
.cplinv-area{
  padding:11px 12px;font-family:var(--f-mono);font-size:9px;font-weight:700;
  letter-spacing:.06em;text-transform:uppercase;color:var(--gold);
  border-right:1px solid var(--border);display:flex;align-items:center;
}
.cplinv-question{padding:11px 14px;font-size:12.5px;color:var(--sub);display:flex;align-items:center;}
.cplinv-mod{
  font-family:var(--f-mono);font-size:8.5px;color:var(--muted);
  padding:1px 5px;background:rgba(255,255,255,.03);border-radius:3px;
  margin-left:auto;flex-shrink:0;white-space:nowrap;
}

/* ── MODULE GRID ── */
.mod-grid{
  display:grid;grid-template-columns:repeat(5,1fr);
  gap:1px;border:1px solid var(--border);border-radius:var(--rl);
  overflow:hidden;background:var(--border);
}
.mod-col{background:var(--surface);padding:22px 16px;}
.mod-col-header{margin-bottom:14px;}
.mod-col-title{font-family:var(--f-display);font-size:13px;font-weight:800;color:var(--text);margin-bottom:6px;}
.mod-col-badge{
  display:inline-block;font-family:var(--f-mono);font-size:8px;font-weight:700;
  padding:2px 7px;border-radius:3px;letter-spacing:.06em;text-transform:uppercase;
}
.mod-items{display:flex;flex-direction:column;gap:3px;}
.mod-item{
  display:flex;align-items:center;gap:5px;
  font-family:var(--f-mono);font-size:9.5px;color:var(--muted);
  padding:4px 7px;border-radius:4px;
  background:rgba(255,255,255,.02);border:1px solid rgba(255,255,255,.04);
  transition:background .12s;
}
.mod-item:hover{background:rgba(255,255,255,.04);}
.mod-item-dot{width:4px;height:4px;border-radius:50%;flex-shrink:0;}

/* ── TIER SECTION ── */
.tier-section{
  background:var(--surface);
  border-top:1px solid var(--border);border-bottom:1px solid var(--border);
}
.tier-transition{text-align:center;font-size:14px;color:var(--muted);margin-bottom:44px;letter-spacing:.01em;}
.tier-cards{display:grid;grid-template-columns:1fr 1fr;gap:20px;max-width:900px;margin:0 auto;}
.tier-card{
  border-radius:var(--rxl);padding:34px;display:flex;flex-direction:column;
  position:relative;overflow:hidden;
}
.tier-card::before{content:'';position:absolute;top:0;left:0;right:0;height:1px;pointer-events:none;}
.tier-card.free{background:rgba(34,197,94,.025);border:1px solid rgba(34,197,94,.15);}
.tier-card.free::before{background:linear-gradient(90deg,transparent,rgba(34,197,94,.3),transparent);}
.tier-card.paid{background:rgba(212,175,55,.03);border:1px solid rgba(212,175,55,.2);}
.tier-card.paid::before{background:linear-gradient(90deg,transparent,rgba(212,175,55,.45),transparent);}
.tier-eyebrow{font-family:var(--f-mono);font-size:9.5px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;margin-bottom:10px;}
.tier-eyebrow.free{color:var(--green);}
.tier-eyebrow.paid{color:var(--gold);}
.tier-name{font-family:var(--f-display);font-size:23px;font-weight:800;color:var(--text);margin-bottom:8px;}
.tier-desc{font-size:14px;color:var(--muted);margin-bottom:22px;line-height:1.65;}
.tier-price-free{font-family:var(--f-mono);font-size:32px;font-weight:800;color:var(--green);margin-bottom:2px;}
.tier-price{font-family:var(--f-mono);font-size:32px;font-weight:800;color:var(--text);margin-bottom:2px;}
.tier-price-period{font-size:12px;color:var(--muted);margin-bottom:22px;}
.tier-list{list-style:none;display:flex;flex-direction:column;gap:10px;margin-bottom:28px;}
.tier-list li{display:flex;align-items:flex-start;gap:10px;font-size:14px;color:var(--sub);line-height:1.5;}
.tier-ck-g{color:var(--green);font-weight:700;flex-shrink:0;margin-top:1px;}
.tier-ck-gold{color:var(--gold);font-weight:700;flex-shrink:0;margin-top:1px;}
.tier-cta{display:block;text-align:center;padding:14px 24px;border-radius:var(--r);
  font-weight:700;font-size:14px;text-decoration:none;transition:all .18s;margin-top:auto;}
.tier-cta:focus-visible{outline:2px solid var(--gold);outline-offset:3px;}
.tier-cta.free{background:var(--green-dim);color:var(--green);border:1px solid rgba(34,197,94,.2);}
.tier-cta.free:hover{background:rgba(34,197,94,.16);}
.tier-cta.paid{background:linear-gradient(135deg,var(--gold),var(--gold-hi));color:#000;}
.tier-cta.paid:hover{box-shadow:0 0 32px var(--gold-glow);transform:translateY(-1px);}

/* ── CDM STRIP ── */
.cdm-strip{background:var(--surface);border-top:1px solid var(--border);border-bottom:1px solid var(--border);padding:40px 0;}
.cdm-inner{max-width:660px;margin:0 auto;text-align:center;}
.cdm-label{font-family:var(--f-mono);font-size:9px;font-weight:700;letter-spacing:.18em;text-transform:uppercase;color:var(--gold);margin-bottom:14px;display:flex;align-items:center;justify-content:center;gap:10px;}
.cdm-label::before,.cdm-label::after{content:'';height:1px;width:28px;background:var(--gold);opacity:.3;}
.cdm-text{font-size:15.5px;color:var(--sub);line-height:1.75;}
.cdm-text em{color:var(--text);font-style:normal;}

/* Module decision question */
.mod-col-question{font-size:11px;color:var(--sub);line-height:1.55;margin-bottom:12px;padding-bottom:12px;border-bottom:1px solid var(--border);font-style:italic;}

/* Context analyzed in mockup */
.fdb-ctx{padding:6px 10px;border-top:1px solid var(--border);}
.fdb-ctx-label{font-family:var(--f-mono);font-size:7px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--muted);margin-bottom:4px;}
.fdb-ctx-tags{display:flex;flex-wrap:wrap;gap:3px;}
.fdb-ctx-tag{font-family:var(--f-mono);font-size:8px;padding:1px 6px;border-radius:3px;background:rgba(212,175,55,.05);border:1px solid rgba(212,175,55,.1);color:var(--gold);}

/* ── PRICING JOURNEY + PLANS ── */
.pricing-journey{
  display:flex;align-items:center;justify-content:center;margin-bottom:52px;
}
.pj-step{text-align:center;padding:0 22px;}
.pj-step-num{font-family:var(--f-mono);font-size:9px;font-weight:700;
  letter-spacing:.12em;text-transform:uppercase;color:var(--muted);margin-bottom:4px;}
.pj-step-name{font-size:13.5px;font-weight:600;color:var(--muted);}
.pj-step.active .pj-step-num{color:var(--gold);}
.pj-step.active .pj-step-name{color:var(--text);}
.pj-arr{color:var(--muted);font-size:14px;opacity:.25;flex-shrink:0;}
.plans{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;}
.plan{background:var(--surface);border:1px solid var(--border);border-radius:var(--rl);
  padding:24px 20px;display:flex;flex-direction:column;transition:all .2s;position:relative;}
.plan:hover{border-color:rgba(212,175,55,.2);transform:translateY(-2px);box-shadow:0 16px 40px rgba(0,0,0,.4);}
.plan.featured{
  border-color:rgba(212,175,55,.28);
  background:linear-gradient(180deg,rgba(212,175,55,.06) 0%,var(--surface) 60%);
  box-shadow:0 0 40px rgba(212,175,55,.06);
}
.plan.featured::before{content:'';position:absolute;top:0;left:0;right:0;height:1px;
  background:linear-gradient(90deg,transparent,var(--gold),transparent);}
.plan-badge{position:absolute;top:-10px;left:50%;transform:translateX(-50%);background:var(--gold);
  color:#000;font-size:9px;font-weight:800;padding:3px 12px;border-radius:999px;
  letter-spacing:.07em;text-transform:uppercase;white-space:nowrap;}
.plan-name{font-family:var(--f-display);font-size:15px;font-weight:800;color:var(--text);margin-bottom:4px;}
.plan-target{font-size:11.5px;color:var(--muted);margin-bottom:14px;line-height:1.5;min-height:34px;}
.plan-divider{height:1px;background:var(--border);margin:14px 0;}
.plan-price{font-family:var(--f-mono);font-size:27px;font-weight:800;color:var(--text);line-height:1;}
.plan-price span{font-size:12px;color:var(--muted);font-family:var(--f-body);font-weight:400;}
.plan-free{font-family:var(--f-mono);font-size:25px;font-weight:800;color:var(--green);line-height:1;}
.plan-period{font-size:11px;color:var(--muted);margin-bottom:18px;margin-top:3px;}
.plan-features{list-style:none;margin-bottom:18px;display:flex;flex-direction:column;gap:7px;flex:1;}
.plan-features li{display:flex;align-items:flex-start;gap:8px;font-size:12.5px;color:var(--sub);}
.plan-features li::before{content:'✓';color:var(--green);font-weight:700;flex-shrink:0;margin-top:1px;font-size:12px;}
.plan-cta{display:block;text-align:center;padding:11px;border-radius:8px;font-weight:700;font-size:13.5px;
  text-decoration:none;transition:all .18s;cursor:pointer;border:none;font-family:var(--f-body);}
.plan-cta:focus-visible{outline:2px solid var(--gold);outline-offset:3px;}
.plan-cta.primary{background:linear-gradient(135deg,var(--gold),var(--gold-hi));color:#000;}
.plan-cta.primary:hover{box-shadow:0 0 20px var(--gold-glow);}
.plan-cta.secondary{background:transparent;color:var(--sub);border:1px solid var(--border);}
.plan-cta.secondary:hover{color:var(--text);border-color:rgba(212,175,55,.2);}
.plan-cta.green-btn{background:var(--green-dim);color:var(--green);border:1px solid rgba(34,197,94,.2);}
.plan-cta.green-btn:hover{background:rgba(34,197,94,.16);}

/* ── TRUST "TRANSPARENTE POR PADRÃO" ── */
.trust-grid{
  display:grid;grid-template-columns:1fr 1fr;
  gap:1px;border:1px solid var(--border);border-radius:var(--rl);
  overflow:hidden;background:var(--border);
}
.trust-blk{background:var(--surface);padding:28px 30px;transition:background .15s;}
.trust-blk:hover{background:rgba(255,255,255,.012);}
.trust-blk-num{
  font-family:var(--f-mono);font-size:10px;font-weight:700;letter-spacing:.12em;
  color:var(--gold);opacity:.45;margin-bottom:10px;
}
.trust-blk-title{font-size:14.5px;font-weight:700;color:var(--text);margin-bottom:8px;line-height:1.4;}
.trust-blk-desc{font-size:13px;color:var(--muted);line-height:1.65;}

/* ── FAQ ── */
.faq-list{display:flex;flex-direction:column;gap:6px;max-width:720px;margin:0 auto;}
details.faq-item{background:var(--surface);border:1px solid var(--border);border-radius:var(--r);overflow:hidden;transition:border-color .2s;}
details.faq-item[open]{border-color:rgba(212,175,55,.16);}
details.faq-item summary{padding:17px 22px;font-size:14.5px;font-weight:600;color:var(--text);
  cursor:pointer;list-style:none;display:flex;justify-content:space-between;align-items:center;gap:16px;user-select:none;}
details.faq-item summary::-webkit-details-marker{display:none;}
details.faq-item summary::after{content:'+';font-size:18px;color:var(--gold);font-weight:300;line-height:1;flex-shrink:0;}
details.faq-item[open] summary::after{content:'−';}
details.faq-item summary:hover{color:var(--gold);}
details.faq-item summary:focus-visible{outline:2px solid var(--gold);outline-offset:-2px;}
.faq-answer{padding:14px 22px 18px;font-size:13.5px;color:var(--muted);line-height:1.7;border-top:1px solid var(--border);}

/* ── CTA FINAL ── */
.cta-final{
  background:radial-gradient(ellipse 900px 600px at 50% 50%,rgba(212,175,55,.055) 0%,transparent 65%);
  text-align:center;padding:120px 0;position:relative;overflow:hidden;
}
.cta-final::before{
  content:'';position:absolute;inset:0;
  background-image:linear-gradient(rgba(255,255,255,.012) 1px,transparent 1px),
    linear-gradient(90deg,rgba(255,255,255,.012) 1px,transparent 1px);
  background-size:60px 60px;
  mask-image:radial-gradient(ellipse 70% 90% at 50% 50%,black 0%,transparent 100%);
  -webkit-mask-image:radial-gradient(ellipse 70% 90% at 50% 50%,black 0%,transparent 100%);
  pointer-events:none;
}
.cta-final-inner{position:relative;z-index:1;}
.cta-final h2{font-family:var(--f-display);font-size:44px;font-weight:800;
  letter-spacing:-2.5px;color:var(--text);margin-bottom:18px;line-height:1.1;}
.cta-final h2 em{color:var(--gold);font-style:normal;}
.cta-final-sub{font-size:17px;color:var(--sub);margin-bottom:16px;max-width:520px;
  margin-left:auto;margin-right:auto;line-height:1.65;}
.cta-final-promise{
  font-family:var(--f-mono);font-size:11px;font-weight:700;letter-spacing:.06em;
  color:var(--muted);margin-bottom:36px;
}
.cta-final-promise em{color:var(--gold);font-style:normal;}
.final-trust{display:flex;justify-content:center;gap:24px;flex-wrap:wrap;margin-top:20px;}
.trust-item{display:flex;align-items:center;gap:6px;font-size:13px;color:var(--muted);}
.trust-ck{color:var(--green);font-size:12px;}

/* ── FOOTER ── */
.footer{background:var(--surface);border-top:1px solid var(--border);padding:28px 0;}
.footer-inner{display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:16px;}
.footer-logo{font-family:var(--f-display);font-weight:800;font-size:15px;color:var(--gold);}
.footer-links{display:flex;gap:20px;}
.footer-links a{font-size:12.5px;color:var(--muted);text-decoration:none;transition:color .15s;}
.footer-links a:hover{color:var(--sub);}
.footer-copy{font-size:11.5px;color:var(--muted);}

/* ── RESPONSIVE ── */
@media(max-width:1024px){
  .intel-flow{flex-direction:column;}
  .intel-sep{width:auto;height:18px;padding:0;align-items:center;}
  .intel-arrow{transform:rotate(90deg);}
}
@media(max-width:960px){
  .hero-inner{grid-template-columns:1fr;}
  .plans{grid-template-columns:1fr 1fr;}
  .tier-cards{grid-template-columns:1fr;}
  .steps{grid-template-columns:1fr;}
  .steps::before{display:none;}
  .hero h1{font-size:40px;letter-spacing:-2px;}
  .nav{padding:0 20px;}
  .nav-links{display:none;}
  .wrap{padding:0 18px;}
  section{padding:72px 0;}
  .cta-final h2{font-size:34px;}
  .section-title{font-size:32px;}
  .pp-metrics{grid-template-columns:repeat(3,1fr);}
  .pp-metrics .pp-m:nth-child(4),.pp-metrics .pp-m:nth-child(5){border-top:1px solid var(--border);}
  .cplinv-wrapper{grid-template-columns:1fr;}
  .jrn-track{grid-template-columns:1fr;gap:0;}
  .jrn-track::before{display:none;}
  .jrn-step{
    display:grid;grid-template-columns:30px 1fr;gap:16px;align-items:start;
    text-align:left;margin-bottom:20px;padding:0;
  }
  .jrn-step:last-child{margin-bottom:0;}
  .jrn-badge{margin:0;}
  .mod-grid{grid-template-columns:1fr 1fr;}
  .fdb-body{grid-template-columns:110px 1fr;}
}
@media(max-width:768px){
  .hero{padding:104px 0 72px;}
  .hero h1{font-size:34px;letter-spacing:-1.8px;}
  .hero-sub{font-size:15.5px;}
  .hero-ctas{flex-direction:column;align-items:flex-start;}
  .pp-metrics{grid-template-columns:1fr 1fr;}
  .pp-metrics .pp-m:nth-child(5){grid-column:span 2;border-right:none;border-top:1px solid var(--border);}
  .pp-insights{grid-template-columns:1fr;}
  .pp-insight{border-right:none;border-bottom:1px solid var(--border);}
  .pp-insight:last-child{border-bottom:none;}
  .section-title{font-size:28px;letter-spacing:-1.2px;}
  .trust-grid{grid-template-columns:1fr;}
  .pricing-journey{flex-wrap:wrap;gap:8px;}
  .fdb-body{grid-template-columns:1fr;}
  .fdb-sidebar{display:none;}
  .hero-float{right:8px;bottom:8px;}
}
@media(max-width:560px){
  .plans{grid-template-columns:1fr;}
  .hero h1{font-size:28px;letter-spacing:-1px;}
  .cta-primary{font-size:14.5px;padding:14px 24px;}
  .cta-primary.lg{font-size:16px;padding:16px 28px;}
  .trust-row{gap:5px;}
  .tc{font-size:11px;}
  .tier-card{padding:24px 20px;}
  .cta-final h2{font-size:28px;letter-spacing:-.8px;}
  .pj-arr{display:none;}
  .mod-grid{grid-template-columns:1fr;}
  .cplinv-item{grid-template-columns:60px 1fr;}
}
`

/* ─── DATA ─── */

const FDB_NAV: { group: string; items: { label: string; active?: boolean }[] }[] = [
  { group: 'Início', items: [{ label: 'Visão Geral', active: true }] },
  { group: 'Diagnóstico', items: [
    { label: 'Análise Profunda' }, { label: 'Saúde do Negócio' },
    { label: 'Funil de Vendas' }, { label: 'Resultados' },
  ]},
  { group: 'Campanhas', items: [
    { label: 'Meta & Google Ads' }, { label: 'Audiências' },
    { label: 'Alocador de Verba' }, { label: 'Mix de Canais' },
  ]},
  { group: 'Plano de Ação', items: [
    { label: 'Estratégia' }, { label: 'Ações Prioritárias' },
  ]},
  { group: 'Inteligência', items: [
    { label: 'TrafficBrain IA' }, { label: 'Pesquisa de Mercado' }, { label: 'Histórico' },
  ]},
  { group: 'Conteúdo', items: [
    { label: 'Concorrentes' }, { label: 'Criar Conteúdo' },
    { label: 'Persona' }, { label: 'Otim. Conversão' },
  ]},
]

const FDB_METRICS = [
  { label: 'Saúde do Negócio', val: '74', color: 'a', sub: '/100 · atenção' },
  { label: 'Eficiência Campanha', val: '61%', color: 'r', sub: 'abaixo da meta' },
  { label: 'Gargalos no Funil', val: '2', color: 'r', sub: 'etapas críticas' },
  { label: 'Audiências Potenciais', val: '3', color: 'g', sub: 'alto potencial' },
  { label: 'Verba Sugerida', val: 'R$8.4k', color: 'gold', sub: 'redistribuir' },
  { label: 'Ações Sugeridas', val: '5', color: 'gold', sub: 'prioritárias' },
]

const FDB_ACTIONS = [
  'Revisar audiência fria no Meta Ads',
  'Reequilibrar verba entre canais',
  'Ajustar promessa da landing page',
]

const FDB_CTX_TAGS = ['Campanhas', 'Audiência', 'Funil', 'Mercado', 'Conteúdo']

const INTEL_BLOCKS = [
  {
    num: '01',
    title: 'Diagnóstico do Negócio',
    color: '#38BDF8',
    modules: ['Visão Geral', 'Análise Profunda', 'Saúde do Negócio', 'Resultados'],
    desc: 'Entenda o estado atual do negócio, os principais sinais de performance e onde existem possíveis gargalos de crescimento.',
  },
  {
    num: '02',
    title: 'Campanhas & Verba',
    color: '#D4AF37',
    modules: ['Meta & Google Ads', 'Alocador de Verba', 'Mix de Canais'],
    desc: 'Analise canais, distribuição de investimento e sinais de eficiência para decidir onde manter, reduzir ou escalar.',
  },
  {
    num: '03',
    title: 'Audiência & Funil',
    color: '#A78BFA',
    modules: ['Audiências', 'Funil de Vendas', 'Persona do Cliente'],
    desc: 'Conecte público, intenção e etapas do funil para identificar se o problema está na atração, conversão ou qualificação.',
  },
  {
    num: '04',
    title: 'Mercado & Conteúdo',
    color: '#22C55E',
    modules: ['Concorrentes', 'Pesquisa de Mercado', 'Criar Conteúdo', 'Otim. de Conversão'],
    desc: 'Use contexto externo e inteligência criativa para gerar hipóteses de posicionamento, oferta, criativos e páginas.',
  },
  {
    num: '05',
    title: 'Plano de Ação',
    color: '#F87171',
    modules: ['Estratégia', 'Ações Prioritárias', 'Relatórios', 'Automação de Rotina'],
    desc: 'Transforme diagnóstico em próximos passos, organize prioridades e acompanhe a evolução com relatórios.',
  },
]

const JOURNEY_STEPS = [
  { num: '01', title: 'Diagnosticar', desc: 'Mapeie saúde do negócio, campanhas, funil e resultados.' },
  { num: '02', title: 'Entender o contexto', desc: 'Cruze sinais de audiência, mercado, concorrência e canais.' },
  { num: '03', title: 'Priorizar', desc: 'Identifique o que tem maior impacto antes de executar.' },
  { num: '04', title: 'Executar melhor', desc: 'Gere ações, conteúdos, relatórios e rotinas com apoio da IA.' },
  { num: '05', title: 'Aprender', desc: 'Use histórico de aprendizado para melhorar as próximas decisões.' },
]

const STEPS = [
  {
    title: 'Informe nicho, região, plataforma e CPL atual',
    desc: 'Formulário simples em menos de 2 minutos. Nenhuma conexão de conta necessária.',
  },
  {
    title: 'Compare com a faixa de referência estimada',
    desc: 'Cruzamos as informações com faixas estruturadas por nicho, região e tipo de campanha.',
  },
  {
    title: 'Receba diagnóstico, desvio e prioridade de ajuste',
    desc: 'CPL estimado para o seu nicho, desvio percentual e o próximo passo mais claro.',
  },
]

const CPL_INV = [
  { area: 'Audiência', question: 'O público está alinhado com a oferta?', mod: 'Audiências' },
  { area: 'Funil', question: 'Os leads avançam ou travam nas etapas?', mod: 'Funil de Vendas' },
  { area: 'Canal', question: 'A verba está distribuída no canal certo?', mod: 'Alocador de Verba' },
  { area: 'Criativo', question: 'A mensagem gera intenção de conversão?', mod: 'Otim. de Conversão' },
  { area: 'Mercado', question: 'O contexto externo está pressionando o CPL?', mod: 'Concorrentes' },
  { area: 'Página', question: 'A conversão sustenta o tráfego recebido?', mod: 'Pesquisa de Mercado' },
  { area: 'Estratégia', question: 'Qual ajuste tem maior impacto primeiro?', mod: 'Ações Prioritárias' },
]

const MODULE_GROUPS = [
  {
    group: 'Diagnóstico',
    color: '#38BDF8',
    bgColor: 'rgba(56,189,248,.08)',
    question: 'Qual parte do negócio merece atenção primeiro?',
    modules: ['Visão Geral', 'Análise Profunda', 'Saúde do Negócio', 'Funil de Vendas', 'Resultados'],
  },
  {
    group: 'Campanhas',
    color: '#D4AF37',
    bgColor: 'rgba(212,175,55,.08)',
    question: 'Onde manter, reduzir ou escalar verba?',
    modules: ['Meta & Google Ads', 'Audiências', 'Alocador de Verba', 'Mix de Canais'],
  },
  {
    group: 'Inteligência',
    color: '#A78BFA',
    bgColor: 'rgba(167,139,250,.08)',
    question: 'O que os dados sugerem que ainda não foi visto?',
    modules: ['TrafficBrain IA', 'Pesquisa de Mercado', 'Histórico de Aprendizado', 'Automação de Rotina'],
  },
  {
    group: 'Conteúdo & Conversão',
    color: '#22C55E',
    bgColor: 'rgba(34,197,94,.08)',
    question: 'A mensagem e a oferta sustentam o tráfego recebido?',
    modules: ['Concorrentes', 'Criar Conteúdo', 'Persona do Cliente', 'Otim. de Conversão com IA'],
  },
  {
    group: 'Plano de Ação',
    color: '#F87171',
    bgColor: 'rgba(248,113,113,.08)',
    question: 'Qual é o próximo passo de maior impacto?',
    modules: ['Estratégia', 'Ações Prioritárias', 'Relatórios'],
  },
]

const PLANS = [
  {
    name: 'Diagnóstico',
    target: 'Para quem quer identificar um primeiro sinal sem custo — em minutos.',
    price: null,
    period: 'Gratuito',
    cta: 'Fazer diagnóstico grátis',
    ctaStyle: 'green-btn',
    features: [
      'Diagnóstico inicial de CPL',
      'Faixa esperada estimada por nicho',
      'Desvio e prioridade sugerida',
      'Sem conexão de conta · Sem cartão',
    ],
    href: '/sign-up',
  },
  {
    name: 'Plataforma',
    target: 'Para negócios que querem sair do diagnóstico pontual e monitorar continuamente.',
    price: 'R$297',
    period: '/mês',
    cta: 'Começar acompanhamento',
    ctaStyle: 'secondary',
    features: [
      'Visão geral do negócio',
      'Saúde do negócio e campanhas',
      'Resultados e monitoramento',
      'Relatórios básicos',
      'Plano de ação inicial',
    ],
    href: '/checkout?plan=individual',
  },
  {
    name: 'Profissional',
    target: 'Para gestores e agências que tomam decisões por vários clientes ao mesmo tempo.',
    price: 'R$997',
    period: '/mês',
    cta: 'Usar com clientes',
    ctaStyle: 'primary',
    featured: true,
    badge: 'Ideal para agências',
    features: [
      'Até 8 clientes',
      'TrafficBrain IA',
      'Pesquisa de mercado',
      'Audiências e mix de canais',
      'Conteúdo e conversão com IA',
      'Relatórios em PDF',
    ],
    href: '/checkout?plan=profissional',
  },
  {
    name: 'Avançado',
    target: 'Para operações com volume alto, múltiplas contas e necessidade de inteligência contínua.',
    price: 'R$2.997',
    period: '/mês',
    cta: 'Falar sobre operação',
    ctaStyle: 'secondary',
    features: [
      'Até 15 clientes',
      'Automação de rotina',
      'Histórico de aprendizado',
      'Inteligência contínua por cliente',
      'Múltiplas contas por plataforma',
      'Acesso à API',
    ],
    href: 'mailto:oi@elyonnous.com?subject=Plano Avançado',
  },
]

const TRUST_BLOCKS = [
  {
    num: '01',
    title: 'Referências estimadas, não promessas absolutas',
    desc: 'As faixas de CPL são estruturadas a partir de padrões estimados por nicho, região e canal. Não são dados auditados externamente.',
  },
  {
    num: '02',
    title: 'Diagnóstico inicial, não auditoria definitiva',
    desc: 'O diagnóstico é um ponto de partida para identificar desvios evidentes — não uma conclusão sobre o desempenho do seu negócio.',
  },
  {
    num: '03',
    title: 'Mockups identificados como demonstrativos',
    desc: 'Todos os painéis e dados exibidos nesta página são fictícios e identificados com a etiqueta "Demonstração".',
  },
  {
    num: '04',
    title: 'Contexto de decisão, não garantia de resultado',
    desc: 'A ELYON NOUS organiza sinais e sugere prioridades. Não garantimos melhora de resultado ao ajustar campanhas.',
  },
]

const FAQ_ITEMS = [
  {
    q: 'O diagnóstico de CPL é gratuito?',
    a: 'Sim, sem cartão e sem compromisso. Você informa nicho, região e CPL atual e recebe o resultado imediatamente.',
  },
  {
    q: 'Quais módulos estão disponíveis na plataforma?',
    a: 'A ELYON NOUS cobre diagnóstico do negócio, campanhas Meta e Google Ads, audiências, funil de vendas, alocação de verba, pesquisa de mercado, conteúdo, concorrentes, plano de ação e histórico de aprendizado. Os módulos disponíveis variam por plano.',
  },
  {
    q: 'O que é o TrafficBrain IA?',
    a: 'É o módulo de inteligência da ELYON que organiza alertas proativos, análises de contexto e sugestões de prioridade com base nos dados da conta. Disponível nos planos Profissional e Avançado.',
  },
  {
    q: 'A ELYON NOUS substitui uma agência ou gestor de tráfego?',
    a: 'Não. A ELYON organiza sinais, indica possíveis gargalos e sugere prioridades — contexto para decisões mais informadas. Gestores e agências usam a plataforma junto com sua operação.',
  },
  {
    q: 'De onde vêm as faixas de referência de CPL?',
    a: 'São estimativas estruturadas por nicho, região e tipo de mídia. Não são dados coletados de terceiros nem auditados externamente. São um ponto de comparação para identificar possíveis desvios de eficiência.',
  },
  {
    q: 'Os resultados são garantidos?',
    a: 'Não. A ELYON ajuda a identificar onde agir e a organizar prioridades. O resultado depende da execução, do negócio e de variáveis que a plataforma não controla.',
  },
]

/* ─── COMPONENT ─── */

export default function LandingPage() {
  const ctaHref = '/sign-in'

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />

      {/* ── NAV ── */}
      <nav className="nav" aria-label="Navegação principal">
        <a href="/landing" className="nav-logo" aria-label="ELYON NOUS — página inicial">
          <span className="nav-logo-mark" aria-hidden="true">
            <span className="nav-logo-mark-inner" />
          </span>
          ELYON NOUS
        </a>
        <div className="nav-links">
          <a href="#platform" className="nav-link">Plataforma</a>
          <a href="#how" className="nav-link">Diagnóstico</a>
          <a href="#modules" className="nav-link">Módulos</a>
          <a href="#pricing" className="nav-link">Planos</a>
          <a href="#faq" className="nav-link">FAQ</a>
        </div>
        <div className="nav-actions">
          <a href={ctaHref} className="nav-login">Entrar</a>
          <a href={ctaHref} className="nav-cta" aria-label="Fazer diagnóstico gratuito">Diagnóstico grátis</a>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="hero" aria-labelledby="hero-h1">
        <div className="wrap">
          <div className="hero-inner">

            {/* Left: copy */}
            <div>
              <div className="hero-eyebrow" aria-hidden="true">
                <span className="blink" />
                Central de Decisão para Marketing
              </div>
              <h1 id="hero-h1">
                Saiba onde agir<br />
                antes de <em>gastar mais.</em>
              </h1>
              <p className="hero-sub">
                A ELYON NOUS organiza sinais de negócio, campanhas, audiência, funil e mercado para identificar gargalos e priorizar as próximas ações — antes de escalar investimento.
              </p>
              <div className="hero-ctas">
                <a href={ctaHref} className="cta-primary" aria-label="Fazer diagnóstico gratuito de CPL — sem cartão">
                  Fazer diagnóstico grátis →
                </a>
                <a href="#platform" className="cta-ghost">Conhecer a plataforma</a>
              </div>
              <div className="trust-row" aria-label="Garantias">
                <span className="tc"><span className="tc-check">✓</span> Sem cartão</span>
                <span className="tc"><span className="tc-check">✓</span> Resultado em minutos</span>
                <span className="tc"><span className="tc-check">✓</span> Tráfego, audiência e funil</span>
                <span className="tc"><span className="tc-check">✓</span> Sem compromisso</span>
              </div>
            </div>

            {/* Right: full platform dashboard mockup */}
            <div className="hero-right">
              <div
                className="dash-card"
                role="img"
                aria-label="Visão geral da plataforma ELYON NOUS — dados demonstrativos"
              >
                <div className="fdb-chrome" aria-hidden="true">
                  <div className="fdb-dots">
                    <div className="fdb-dot fdb-dot-r" />
                    <div className="fdb-dot fdb-dot-y" />
                    <div className="fdb-dot fdb-dot-g" />
                  </div>
                  <span className="fdb-chrome-title">ELYON NOUS · Visão Geral</span>
                  <span className="fdb-live">
                    <span className="blink" />
                    Ao vivo
                  </span>
                </div>

                <div className="fdb-body">
                  {/* Sidebar nav */}
                  <div className="fdb-sidebar" aria-hidden="true">
                    {FDB_NAV.map((g) => (
                      <div className="fdb-nav-group" key={g.group}>
                        <div className="fdb-nav-group-label">{g.group}</div>
                        {g.items.map((item) => (
                          <div
                            key={item.label}
                            className={`fdb-nav-item${item.active ? ' active' : ''}`}
                          >
                            <div className={`fdb-nav-dot${item.active ? ' active' : ''}`} />
                            {item.label}
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>

                  {/* Main content */}
                  <div className="fdb-main">
                    <div className="fdb-main-header" aria-hidden="true">
                      <div className="fdb-main-title">
                        <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--green)', display: 'inline-block' }} />
                        Visão Geral · Semana 21 · 2026
                      </div>
                      <span className="fdb-badge">Demonstração</span>
                    </div>
                    <div className="fdb-content" aria-hidden="true">
                      <div className="fdb-overview-grid">
                        {FDB_METRICS.map((m) => (
                          <div className="fdb-block" key={m.label}>
                            <div className="fdb-block-label">{m.label}</div>
                            <div className={`fdb-block-val ${m.color}`}>{m.val}</div>
                            <div className="fdb-block-sub">{m.sub}</div>
                          </div>
                        ))}
                      </div>
                      <div className="fdb-actions">
                        <div className="fdb-actions-label">Prioridade da semana</div>
                        {FDB_ACTIONS.map((a, i) => (
                          <div className="fdb-action-item" key={i}>
                            <span className="fdb-action-num">{String(i + 1).padStart(2, '0')}</span>
                            <span className="fdb-action-text">{a}</span>
                          </div>
                        ))}
                      </div>
                      <div className="fdb-ctx" aria-hidden="true">
                        <div className="fdb-ctx-label">Contexto analisado</div>
                        <div className="fdb-ctx-tags">
                          {FDB_CTX_TAGS.map((t) => (
                            <span className="fdb-ctx-tag" key={t}>{t}</span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Floating contextual card */}
              <div className="hero-float" aria-hidden="true">
                <div className="hero-float-label">Ações prioritárias</div>
                <div className="hero-float-val">5</div>
                <div className="hero-float-sub">sugeridas esta semana</div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── CDM DEFINITION STRIP ── */}
      <div className="cdm-strip" aria-hidden="true">
        <div className="wrap">
          <div className="cdm-inner">
            <div className="cdm-label">Central de Decisão para Marketing</div>
            <p className="cdm-text">
              Uma plataforma que <em>organiza sinais</em> de negócio, campanhas, audiência, funil e mercado em uma visão integrada — para ajudar a <em>identificar onde agir</em> antes de escalar investimento.
            </p>
          </div>
        </div>
      </div>

      {/* ── UMA INTELIGÊNCIA QUE CONECTA OS PONTOS ── */}
      <div className="intel-section" id="platform" aria-labelledby="intel-heading">
        <div className="wrap">
          <div className="eyebrow c">Uma inteligência que conecta os pontos</div>
          <h2 id="intel-heading" className="section-title c" style={{ textAlign: 'center', maxWidth: 620, margin: '0 auto 14px' }}>
            CPL, funil, audiência, verba, criativo e mercado<br />
            <em>não vivem separados.</em>
          </h2>
          <p className="section-sub c" style={{ marginBottom: 48 }}>
            A ELYON organiza esses sinais para mostrar onde agir primeiro — conectando diagnóstico, campanhas, audiência, conteúdo e plano de ação em uma visão integrada.
          </p>

          <div className="intel-flow">
            {INTEL_BLOCKS.flatMap((block, i) => {
              const el = (
                <div key={`b${i}`} className="intel-block">
                  <div className="intel-block-line" style={{ background: block.color, opacity: 0.6 }} />
                  <div className="intel-num" style={{ color: block.color }}>{block.num}</div>
                  <div className="intel-title">{block.title}</div>
                  <div className="intel-modules">
                    {block.modules.map((m) => (
                      <span key={m} className="intel-mod-tag">{m}</span>
                    ))}
                  </div>
                  <p className="intel-desc">{block.desc}</p>
                </div>
              )
              if (i === 0) return [el]
              return [
                <div key={`s${i}`} className="intel-sep"><span className="intel-arrow">→</span></div>,
                el,
              ]
            })}
          </div>
        </div>
      </div>

      {/* ── MÓDULOS PRINCIPAIS DA ELYON ── */}
      <section style={{ background: 'var(--surface)' }} id="modules" aria-labelledby="mod-h2">
        <div className="wrap">
          <div className="eyebrow c">Módulos principais da ELYON</div>
          <h2 id="mod-h2" className="section-title c" style={{ textAlign: 'center', maxWidth: 520, margin: '0 auto 14px' }}>
            Uma plataforma organizada por <em>área de decisão</em>
          </h2>
          <p className="section-sub c" style={{ marginBottom: 40 }}>
            Cada grupo de módulos ajuda a responder uma pergunta diferente. Juntos, formam uma visão completa do que está acontecendo e do que fazer primeiro.
          </p>

          <div className="mod-grid" role="list">
            {MODULE_GROUPS.map((group) => (
              <div className="mod-col" key={`mod2-${group.group}`} role="listitem">
                <div className="mod-col-header">
                  <div className="mod-col-title">{group.group}</div>
                  <span
                    className="mod-col-badge"
                    style={{ background: group.bgColor, color: group.color, border: `1px solid ${group.color}22` }}
                  >
                    {group.modules.length} módulos
                  </span>
                </div>
                <p className="mod-col-question">{group.question}</p>
                <div className="mod-items">
                  {group.modules.map((m) => (
                    <div className="mod-item" key={m}>
                      <div className="mod-item-dot" style={{ background: group.color, opacity: 0.6 }} />
                      {m}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── DO DIAGNÓSTICO AO PLANO DE AÇÃO ── */}
      <div className="jrn-section" aria-labelledby="jrn-heading">
        <div className="wrap">
          <div className="eyebrow c">Do diagnóstico ao plano de ação</div>
          <h2 id="jrn-heading" className="section-title c" style={{ textAlign: 'center', maxWidth: 480, margin: '0 auto 48px' }}>
            Uma rotina de decisão para <em>cada semana</em>
          </h2>
          <div className="jrn-track">
            {JOURNEY_STEPS.map((s, i) => (
              <div className="jrn-step" key={i}>
                <div className={`jrn-badge${i === 0 ? ' first' : ''}`}>{s.num}</div>
                <div>
                  <div className="jrn-title">{s.title}</div>
                  <p className="jrn-desc">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── COMO FUNCIONA O DIAGNÓSTICO ── */}
      <section style={{ background: 'var(--bg)' }} id="how" aria-labelledby="how-h2">
        <div className="wrap">
          <div className="eyebrow c">Por onde começar</div>
          <h2 id="how-h2" className="section-title c" style={{ textAlign: 'center', maxWidth: 440, margin: '0 auto 14px' }}>
            O diagnóstico gratuito é a <em>primeira porta de entrada</em>
          </h2>
          <p className="section-sub c" style={{ marginBottom: 48 }}>
            Em menos de 2 minutos, identifique se o seu CPL está dentro da faixa esperada para o seu nicho — sem conectar conta, sem cartão.
          </p>
          <div className="steps">
            {STEPS.map((s, i) => (
              <div className="step" key={i}>
                <div className="step-badge" aria-hidden="true">{String(i + 1).padStart(2, '0')}</div>
                <div className="step-title">{s.title}</div>
                <p className="step-desc">{s.desc}</p>
              </div>
            ))}
          </div>
          <div style={{ textAlign: 'center', marginTop: 44 }}>
            <a href={ctaHref} className="cta-primary" aria-label="Começar diagnóstico gratuito agora">
              Começar agora — é grátis →
            </a>
          </div>
        </div>
      </section>

      {/* ── O QUE O DIAGNÓSTICO REVELA ── */}
      <section style={{ background: 'var(--surface)' }} aria-labelledby="reveal-h2">
        <div className="wrap">
          <div className="eyebrow c">O que você recebe</div>
          <h2 id="reveal-h2" className="section-title c" style={{ textAlign: 'center', maxWidth: 480, margin: '0 auto 40px' }}>
            Clareza suficiente para a <em>próxima decisão</em>
          </h2>

          <div className="product-panel" role="img" aria-label="Exemplo de resultado do diagnóstico de CPL — dados demonstrativos">
            <div className="pp-header">
              <div className="pp-header-title">
                <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--green)', display: 'inline-block' }} aria-hidden="true" />
                Diagnóstico · Odontologia · São Paulo · Meta Ads
              </div>
              <span className="pp-badge">Demonstração</span>
            </div>

            <div className="pp-metrics">
              <div className="pp-m">
                <div className="pp-m-label">CPL Atual</div>
                <div className="pp-m-val r">R$68</div>
                <div className="pp-m-sub">informado</div>
              </div>
              <div className="pp-m">
                <div className="pp-m-label">Faixa Esperada</div>
                <div className="pp-m-val g">R$28–38</div>
                <div className="pp-m-sub">estimada para nicho</div>
              </div>
              <div className="pp-m">
                <div className="pp-m-label">Desvio</div>
                <div className="pp-m-val r">+79%</div>
                <div className="pp-m-sub">acima da faixa</div>
              </div>
              <div className="pp-m">
                <div className="pp-m-label">Est. Ineficiência</div>
                <div className="pp-m-val a">R$4.200</div>
                <div className="pp-m-sub">por mês</div>
              </div>
              <div className="pp-m">
                <div className="pp-m-label">Prioridade</div>
                <div className="pp-m-val gold" style={{ fontSize: 15 }}>Alta</div>
                <div className="pp-m-sub">revisar oferta + criativo</div>
              </div>
            </div>

            <div className="pp-bar-section">
              <div className="pp-bar-label">Comparativo CPL — atual vs. faixa esperada</div>
              <div className="bar-row">
                <span className="bar-lbl">Ideal</span>
                <div className="bar-track" style={{ height: 6 }}>
                  <div className="bar-fill g" style={{ width: '50%' }} />
                </div>
                <span className="bar-val g">R$34</span>
              </div>
              <div className="bar-row">
                <span className="bar-lbl">Atual</span>
                <div className="bar-track" style={{ height: 6 }}>
                  <div className="bar-fill r" style={{ width: '100%' }} />
                </div>
                <span className="bar-val r">R$68</span>
              </div>
            </div>

            <div className="pp-insights">
              <div className="pp-insight">
                <div className="pp-insight-label gold">Sinal identificado</div>
                <p className="pp-insight-text">
                  CPL estimado acima da faixa de referência para campanhas similares no segmento odontológico de São Paulo. Possível desvio em oferta ou segmentação.
                </p>
              </div>
              <div className="pp-insight">
                <div className="pp-insight-label blue">Próxima ação sugerida</div>
                <p className="pp-insight-text">
                  Revisar promessa da oferta e ângulo de segmentação. Investigar audiência, funil e criativos antes de escalar orçamento.
                </p>
              </div>
            </div>
          </div>

          <div style={{ textAlign: 'center', marginTop: 32 }}>
            <a href={ctaHref} className="cta-primary" aria-label="Ver meu diagnóstico grátis">
              Ver meu diagnóstico grátis →
            </a>
          </div>
        </div>
      </section>

      {/* ── QUANDO O CPL SAI DA FAIXA ── */}
      <section style={{ background: 'var(--bg)' }} aria-labelledby="cplinv-h2">
        <div className="wrap">
          <div className="cplinv-wrapper">
            <div className="cplinv-copy">
              <div className="eyebrow">O CPL como ponto de partida</div>
              <h2 id="cplinv-h2" className="section-title">
                Um CPL fora da faixa pode nascer<br />
                de <em>vários lugares.</em>
              </h2>
              <p>
                O diagnóstico de CPL é uma forma rápida de encontrar um primeiro sinal. Mas a decisão certa depende do contexto: audiência, funil, canal, oferta, conteúdo e mercado.
              </p>
              <p>
                <em>Por isso a ELYON não para no número.</em> Ela ajuda a investigar o que está por trás.
              </p>
              <div style={{ marginTop: 28 }}>
                <a href={ctaHref} className="cta-primary" style={{ display: 'inline-flex' }}>
                  Iniciar diagnóstico →
                </a>
              </div>
            </div>

            <div>
              <div
                className="cplinv-panel"
                role="table"
                aria-label="Quando o CPL sai da faixa, o que investigar"
              >
                <div className="cplinv-panel-header" role="row">
                  <span aria-hidden="true">⚑</span>
                  Quando o CPL sai da faixa — o que investigar
                </div>
                {CPL_INV.map((item, i) => (
                  <div className="cplinv-item" key={i} role="row">
                    <div className="cplinv-area" role="cell">{item.area}</div>
                    <div className="cplinv-question" role="cell">
                      {item.question}
                      <span className="cplinv-mod">{item.mod}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── DIAGNÓSTICO GRÁTIS VS PLATAFORMA ── */}
      <section className="tier-section" aria-labelledby="tier-h2">
        <div className="wrap">
          <div className="eyebrow c">Diagnóstico gratuito ou plataforma completa</div>
          <h2 id="tier-h2" className="section-title c" style={{ textAlign: 'center', maxWidth: 520, margin: '0 auto 12px' }}>
            O diagnóstico é o retrato.<br /><em>A plataforma é a rotina.</em>
          </h2>
          <p className="section-sub c" style={{ marginBottom: 14 }}>
            Comece identificando um primeiro sinal com o diagnóstico gratuito. Depois, evolua para acompanhamento contínuo de campanhas, audiências, funil e plano de ação.
          </p>
          <p className="tier-transition">Um é um snapshot. O outro é uma inteligência contínua.</p>
          <div className="tier-cards">
            <div className="tier-card free">
              <div className="tier-eyebrow free">Gratuito · Sempre disponível</div>
              <div className="tier-name">Diagnóstico de CPL</div>
              <div className="tier-desc">
                Para quem quer saber agora se o CPL está dentro da faixa esperada — sem cartão, sem compromisso, sem conexão de conta.
              </div>
              <div className="tier-price-free">Grátis</div>
              <div className="tier-price-period">Para sempre · sem cartão</div>
              <ul className="tier-list">
                {[
                  'Faixa de CPL estimada para o nicho',
                  'Comparativo com CPL atual',
                  'Desvio percentual estimado',
                  'Prioridade de ajuste sugerida',
                  'Primeiro passo claro para otimização',
                ].map((f, i) => (
                  <li key={i}>
                    <span className="tier-ck-g" aria-hidden="true">✓</span>{f}
                  </li>
                ))}
              </ul>
              <a href={ctaHref} className="tier-cta free" aria-label="Fazer diagnóstico gratuito — sem cartão">
                Fazer diagnóstico grátis →
              </a>
            </div>

            <div className="tier-card paid">
              <div className="tier-eyebrow paid">Plataforma · A partir de R$297/mês</div>
              <div className="tier-name">Plataforma ELYON NOUS</div>
              <div className="tier-desc">
                Para quem quer monitorar indicadores, conectar contas de anúncios, analisar audiências e funil e ter um plano de ação atualizado continuamente.
              </div>
              <div className="tier-price">R$297</div>
              <div className="tier-price-period">a partir de · por mês · cancele quando quiser</div>
              <ul className="tier-list">
                {[
                  'Saúde do negócio e campanhas',
                  'Audiências, funil e resultados',
                  'Alocador de verba por canal',
                  'Conteúdo e otimização de conversão',
                  'TrafficBrain IA (plano Profissional)',
                  'Múltiplos clientes (Profissional e Avançado)',
                ].map((f, i) => (
                  <li key={i}>
                    <span className="tier-ck-gold" aria-hidden="true">→</span>{f}
                  </li>
                ))}
              </ul>
              <a href="#pricing" className="tier-cta paid" aria-label="Ver planos e preços da plataforma ELYON NOUS">
                Ver planos e preços →
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ── PLANOS ── */}
      <section style={{ background: 'var(--surface)' }} id="pricing" aria-labelledby="pricing-h2">
        <div className="wrap">
          <div className="eyebrow c">Planos</div>
          <h2 id="pricing-h2" className="section-title c" style={{ textAlign: 'center', maxWidth: 560, margin: '0 auto 14px' }}>
            Escolha o nível de inteligência<br />
            da sua <em>operação.</em>
          </h2>
          <p className="section-sub c" style={{ marginBottom: 36 }}>
            Comece com o diagnóstico gratuito — sem cartão, em minutos. Evolua para acompanhamento contínuo quando precisar de mais contexto para decidir.
          </p>

          <div className="pricing-journey" aria-hidden="true">
            <div className="pj-step active">
              <div className="pj-step-num">Passo 01</div>
              <div className="pj-step-name">Diagnóstico</div>
            </div>
            <span className="pj-arr">→</span>
            <div className="pj-step">
              <div className="pj-step-num">Passo 02</div>
              <div className="pj-step-name">Acompanhamento</div>
            </div>
            <span className="pj-arr">→</span>
            <div className="pj-step">
              <div className="pj-step-num">Passo 03</div>
              <div className="pj-step-name">Operação</div>
            </div>
          </div>

          <div className="plans">
            {PLANS.map((p, i) => (
              <div className={`plan${p.featured ? ' featured' : ''}`} key={i}>
                {p.badge && <div className="plan-badge">{p.badge}</div>}
                <div className="plan-name">{p.name}</div>
                <div className="plan-target">{p.target}</div>
                <div className="plan-divider" />
                {p.price
                  ? <><div className="plan-price">{p.price}<span>{p.period}</span></div><div className="plan-period">por mês</div></>
                  : <><div className="plan-free">Grátis</div><div className="plan-period">Para sempre</div></>
                }
                <ul className="plan-features" aria-label={`Recursos do plano ${p.name}`}>
                  {p.features.map((f, j) => <li key={j}>{f}</li>)}
                </ul>
                <a href={p.href} className={`plan-cta ${p.ctaStyle}`} aria-label={`${p.cta} — plano ${p.name}`}>{p.cta}</a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TRANSPARENTE POR PADRÃO ── */}
      <section style={{ background: 'var(--bg)' }} aria-labelledby="trust-h2">
        <div className="wrap">
          <div className="eyebrow c">Transparente por padrão</div>
          <h2 id="trust-h2" className="section-title c" style={{ textAlign: 'center', maxWidth: 480, margin: '0 auto 14px' }}>
            O que a ELYON NOUS <em>não promete.</em>
          </h2>
          <p className="section-sub c" style={{ marginBottom: 40 }}>
            Acreditamos que transparência gera mais confiança do que promessas imprecisas. Aqui está o que você precisa saber antes de começar.
          </p>
          <div className="trust-grid" role="list">
            {TRUST_BLOCKS.map((b, i) => (
              <div className="trust-blk" key={i} role="listitem">
                <div className="trust-blk-num">{b.num}</div>
                <div className="trust-blk-title">{b.title}</div>
                <p className="trust-blk-desc">{b.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section style={{ background: 'var(--surface)' }} id="faq" aria-labelledby="faq-h2">
        <div className="wrap">
          <div className="eyebrow c">Perguntas frequentes</div>
          <h2 id="faq-h2" className="section-title c" style={{ textAlign: 'center', maxWidth: 460, margin: '0 auto 40px' }}>
            Antes de começar, <em>tire suas dúvidas</em>
          </h2>
          <div className="faq-list">
            {FAQ_ITEMS.map((item, i) => (
              <details className="faq-item" key={i}>
                <summary>{item.q}</summary>
                <div className="faq-answer">{item.a}</div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA FINAL ── */}
      <section className="cta-final" aria-labelledby="cta-h2">
        <div className="wrap">
          <div className="cta-final-inner">
            <h2 id="cta-h2">
              Entenda o que está acontecendo.<br />
              Decida <em>o que fazer primeiro.</em>
            </h2>
            <p className="cta-final-sub">
              Comece com o diagnóstico gratuito. Sem cartão, sem compromisso.
            </p>
            <p className="cta-final-promise">
              Baixa fricção · <em>Resultado em minutos</em> · Sem conectar conta
            </p>
            <a href={ctaHref} className="cta-primary lg" aria-label="Fazer diagnóstico gratuito de CPL — sem cartão">
              Fazer diagnóstico grátis →
            </a>
            <div className="final-trust" aria-label="Garantias">
              <span className="trust-item"><span className="trust-ck" aria-hidden="true">✓</span> Em minutos</span>
              <span className="trust-item"><span className="trust-ck" aria-hidden="true">✓</span> Sem cartão de crédito</span>
              <span className="trust-item"><span className="trust-ck" aria-hidden="true">✓</span> Estimativa transparente</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="footer">
        <div className="wrap">
          <div className="footer-inner">
            <span className="footer-logo">ELYON NOUS</span>
            <nav className="footer-links" aria-label="Links legais">
              <a href="/termos">Termos</a>
              <a href="/privacidade">Privacidade</a>
              <a href="/cookies">Cookies</a>
              <a href="mailto:oi@elyonnous.com">Contato</a>
            </nav>
            <span className="footer-copy">© 2026 ELYON NOUS</span>
          </div>
        </div>
      </footer>
    </>
  )
}
