import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'ELYON NOUS | Diagnóstico gratuito de CPL',
  description:
    'Compare seu CPL com faixas de referência por nicho e região e descubra se suas campanhas estão acima da faixa esperada.',
  openGraph: {
    title: 'ELYON NOUS | Diagnóstico gratuito de CPL',
    description:
      'Compare seu CPL com faixas de referência por nicho e região. Diagnóstico gratuito para gestores, agências e empresas que investem em mídia paga.',
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
.nav-links{display:flex;align-items:center;gap:24px;}
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
  padding:144px 0 100px;
  background:
    radial-gradient(ellipse 900px 700px at 65% -5%,rgba(212,175,55,.06) 0%,transparent 60%),
    radial-gradient(ellipse 500px 400px at 10% 90%,rgba(56,189,248,.02) 0%,transparent 60%);
  position:relative;overflow:hidden;
}
.hero::before{
  content:'';position:absolute;inset:0;
  background-image:linear-gradient(rgba(255,255,255,.014) 1px,transparent 1px),
    linear-gradient(90deg,rgba(255,255,255,.014) 1px,transparent 1px);
  background-size:60px 60px;
  mask-image:radial-gradient(ellipse 90% 80% at 50% 10%,black 0%,transparent 100%);
  -webkit-mask-image:radial-gradient(ellipse 90% 80% at 50% 10%,black 0%,transparent 100%);
  pointer-events:none;
}
.hero-inner{display:grid;grid-template-columns:1fr 1fr;gap:56px;align-items:center;position:relative;z-index:1;}
.hero-eyebrow{
  display:inline-flex;align-items:center;gap:8px;margin-bottom:20px;
  background:rgba(212,175,55,.07);border:1px solid rgba(212,175,55,.18);border-radius:999px;
  padding:5px 14px;font-family:var(--f-mono);font-size:10.5px;font-weight:700;
  letter-spacing:.12em;text-transform:uppercase;color:var(--gold);
}
.blink{width:5px;height:5px;border-radius:50%;background:var(--green);animation:pulse 2s infinite;display:inline-block;}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:.2}}
.hero-pos{font-size:13px;color:var(--muted);margin-bottom:16px;letter-spacing:.01em;}
.hero h1{
  font-family:var(--f-display);font-size:54px;font-weight:800;
  line-height:1.05;letter-spacing:-2.8px;color:var(--text);margin-bottom:20px;
}
.hero h1 em{color:var(--gold);font-style:normal;}
.hero-sub{font-size:17px;color:var(--sub);line-height:1.68;margin-bottom:28px;max-width:460px;}
.hero-ctas{display:flex;align-items:center;gap:12px;flex-wrap:wrap;margin-bottom:22px;}
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

/* ── DASHBOARD CARD (hero right) ── */
.dash-card{
  background:var(--surface);border:1px solid rgba(212,175,55,.15);border-radius:var(--rxl);
  overflow:hidden;position:relative;
  box-shadow:0 0 100px rgba(212,175,55,.05),0 40px 80px rgba(0,0,0,.7),inset 0 1px 0 rgba(255,255,255,.04);
}
.dash-card::before{
  content:'';position:absolute;top:0;left:0;right:0;height:1px;
  background:linear-gradient(90deg,transparent,rgba(212,175,55,.55),transparent);pointer-events:none;z-index:2;
}
.dash-topbar{
  display:flex;align-items:center;justify-content:space-between;
  padding:12px 18px;border-bottom:1px solid var(--border);background:rgba(255,255,255,.01);
}
.dash-topbar-title{font-family:var(--f-mono);font-size:10px;font-weight:700;letter-spacing:.1em;
  text-transform:uppercase;color:var(--muted);display:flex;align-items:center;gap:7px;}
.dash-live{font-family:var(--f-mono);font-size:9px;font-weight:700;letter-spacing:.1em;
  text-transform:uppercase;color:var(--green);display:flex;align-items:center;gap:4px;}
.dash-meta{display:flex;align-items:center;gap:5px;padding:9px 18px;border-bottom:1px solid var(--border);}
.dash-chip{font-family:var(--f-mono);font-size:9.5px;padding:3px 9px;border-radius:4px;
  background:rgba(255,255,255,.04);border:1px solid var(--border);color:var(--sub);}
.dash-chip.gold{background:rgba(212,175,55,.08);border-color:rgba(212,175,55,.18);color:var(--gold);}
.dash-alert{
  display:flex;align-items:center;gap:8px;padding:9px 18px;
  background:rgba(248,113,113,.05);border-bottom:1px solid rgba(248,113,113,.12);
  font-size:11.5px;color:var(--red);font-weight:600;font-family:var(--f-mono);letter-spacing:.01em;
}
.dash-alert-tri{font-size:12px;flex-shrink:0;}
.dash-metrics{display:grid;grid-template-columns:repeat(3,1fr);border-bottom:1px solid var(--border);}
.dash-m{padding:13px 15px;border-right:1px solid var(--border);}
.dash-m:last-child{border-right:none;}
.dash-m-label{font-size:9.5px;color:var(--muted);font-family:var(--f-mono);letter-spacing:.06em;text-transform:uppercase;margin-bottom:5px;}
.dash-m-val{font-family:var(--f-mono);font-size:19px;font-weight:800;line-height:1;}
.dash-m-val.r{color:var(--red);}
.dash-m-val.g{color:var(--green);}
.dash-m-val.a{color:var(--amber);}
.dash-m-sub{font-size:9.5px;color:var(--muted);margin-top:3px;font-family:var(--f-mono);}
.dash-m-delta{display:inline-flex;font-size:9.5px;font-weight:700;font-family:var(--f-mono);
  padding:2px 5px;border-radius:3px;margin-top:3px;background:rgba(248,113,113,.12);color:var(--red);}
.dash-bars{padding:12px 18px;border-bottom:1px solid var(--border);}
.dash-bars-lbl{font-size:9px;color:var(--muted);font-family:var(--f-mono);text-transform:uppercase;letter-spacing:.08em;margin-bottom:9px;}
.bar-row{display:flex;align-items:center;gap:9px;margin-bottom:6px;}
.bar-row:last-child{margin-bottom:0;}
.bar-lbl{font-size:9.5px;color:var(--muted);font-family:var(--f-mono);width:30px;flex-shrink:0;text-align:right;}
.bar-track{flex:1;height:4px;background:rgba(255,255,255,.05);border-radius:2px;overflow:hidden;}
.bar-fill{height:100%;border-radius:2px;}
.bar-fill.g{background:var(--green);}
.bar-fill.r{background:var(--red);}
.bar-val{font-size:10px;font-family:var(--f-mono);font-weight:700;width:34px;text-align:right;flex-shrink:0;}
.bar-val.g{color:var(--green);}
.bar-val.r{color:var(--red);}
.dash-bottom{display:grid;grid-template-columns:1fr 1fr;}
.dash-block{padding:12px 18px;}
.dash-block.bd{border-right:1px solid var(--border);}
.dash-block-lbl{font-size:9px;font-family:var(--f-mono);font-weight:700;letter-spacing:.1em;text-transform:uppercase;margin-bottom:5px;}
.dash-block-lbl.gold{color:var(--gold);}
.dash-block-lbl.blue{color:var(--blue);}
.dash-block-text{font-size:11.5px;color:var(--sub);line-height:1.55;}

/* ── NARRATIVE BREAK ── */
.narrative{
  padding:72px 0;background:var(--surface);
  border-top:1px solid var(--border);border-bottom:1px solid var(--border);
  position:relative;overflow:hidden;
}
.narrative::before{
  content:'';position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);
  width:700px;height:350px;
  background:radial-gradient(ellipse,rgba(212,175,55,.035) 0%,transparent 70%);
  pointer-events:none;
}
.narrative-inner{max-width:720px;margin:0 auto;text-align:center;position:relative;}
.narrative-text{
  font-family:var(--f-display);font-size:26px;font-weight:700;
  line-height:1.5;letter-spacing:-1px;color:var(--muted);
}
.narrative-text em{color:var(--text);font-style:normal;}
.narrative-text strong{color:var(--gold);font-weight:inherit;}

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
.section-sub{font-size:17px;color:var(--sub);line-height:1.65;margin-bottom:40px;}
.section-sub.c{text-align:center;max-width:540px;margin-left:auto;margin-right:auto;}

/* ── PAIN — numbered list ── */
.pain-list{
  border:1px solid var(--border);border-radius:var(--rl);overflow:hidden;
  margin-bottom:24px;
}
.pain-item{
  display:grid;grid-template-columns:52px 1fr;
  padding:22px 24px;border-bottom:1px solid var(--border);
  transition:background .15s;
}
.pain-item:last-child{border-bottom:none;}
.pain-item:hover{background:rgba(255,255,255,.015);}
.pain-num{font-family:var(--f-mono);font-size:13px;font-weight:700;color:var(--gold);opacity:.45;padding-top:2px;}
.pain-label{font-size:15px;font-weight:700;color:var(--text);margin-bottom:5px;line-height:1.4;}
.pain-desc{font-size:13px;color:var(--muted);line-height:1.55;}
.pain-close{
  background:rgba(248,113,113,.04);border:1px solid rgba(248,113,113,.1);
  border-radius:var(--r);padding:18px 24px;font-size:15px;color:var(--sub);line-height:1.65;text-align:center;
}
.pain-close strong{color:var(--text);}
.pain-close em{color:var(--red);font-style:normal;}

/* ── STEPS — horizontal ── */
.steps{display:grid;grid-template-columns:repeat(3,1fr);gap:20px;position:relative;}
.steps::before{
  content:'';position:absolute;top:23px;left:calc(16.67% + 12px);right:calc(16.67% + 12px);
  height:1px;background:linear-gradient(90deg,rgba(212,175,55,.3),rgba(212,175,55,.08));
  z-index:0;
}
.step{background:var(--surface);border:1px solid var(--border);border-radius:var(--rl);
  padding:28px 24px;transition:border-color .2s,box-shadow .2s;position:relative;z-index:1;}
.step:hover{border-color:rgba(212,175,55,.2);box-shadow:0 0 24px rgba(212,175,55,.04);}
.step-badge{
  width:32px;height:32px;border-radius:50%;
  background:var(--gold-dim);border:1px solid rgba(212,175,55,.2);
  display:flex;align-items:center;justify-content:center;
  font-family:var(--f-mono);font-size:12px;font-weight:700;color:var(--gold);
  margin-bottom:18px;
}
.step-title{font-size:15px;font-weight:700;color:var(--text);margin-bottom:8px;line-height:1.4;}
.step-desc{font-size:13px;color:var(--muted);line-height:1.6;}

/* ── PRODUCT PANEL (reveal section) ── */
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
.pp-insights{display:grid;grid-template-columns:1fr 1fr;}
.pp-insight{padding:16px 22px;border-right:1px solid var(--border);}
.pp-insight:last-child{border-right:none;}
.pp-insight-label{font-size:9px;font-family:var(--f-mono);font-weight:700;letter-spacing:.1em;text-transform:uppercase;margin-bottom:6px;}
.pp-insight-label.gold{color:var(--gold);}
.pp-insight-label.blue{color:var(--blue);}
.pp-insight-text{font-size:13px;color:var(--sub);line-height:1.6;}

/* ── PLATFORM PANEL (produto em uso) ── */
.platform-panel{
  background:var(--surface);border:1px solid var(--border);border-radius:var(--rxl);
  overflow:hidden;position:relative;
}
.platform-panel::before{
  content:'';position:absolute;top:0;left:0;right:0;height:1px;
  background:linear-gradient(90deg,transparent,rgba(212,175,55,.3),transparent);pointer-events:none;
}
.pf-header{padding:13px 22px;border-bottom:1px solid var(--border);
  display:flex;align-items:center;justify-content:space-between;background:rgba(255,255,255,.01);}
.pf-header-title{font-family:var(--f-mono);font-size:10px;font-weight:700;letter-spacing:.1em;
  text-transform:uppercase;color:var(--muted);display:flex;align-items:center;gap:7px;}
.pf-badge{font-family:var(--f-mono);font-size:9px;font-weight:700;padding:3px 10px;border-radius:4px;
  background:rgba(212,175,55,.07);color:var(--gold);border:1px solid rgba(212,175,55,.14);letter-spacing:.06em;text-transform:uppercase;}
.pf-metrics{display:grid;grid-template-columns:repeat(4,1fr);border-bottom:1px solid var(--border);}
.pf-m{padding:18px 20px;border-right:1px solid var(--border);}
.pf-m:last-child{border-right:none;}
.pf-m-label{font-size:9.5px;color:var(--muted);font-family:var(--f-mono);letter-spacing:.06em;text-transform:uppercase;margin-bottom:7px;}
.pf-m-val{font-family:var(--f-mono);font-size:24px;font-weight:800;line-height:1;margin-bottom:4px;color:var(--text);}
.pf-m-val.g{color:var(--green);}
.pf-m-val.a{color:var(--amber);}
.pf-m-sub{font-size:11px;color:var(--muted);}
.pf-footer{padding:11px 22px;display:flex;align-items:center;gap:12px;flex-wrap:wrap;}
.pf-footer-item{font-size:11px;color:var(--muted);font-family:var(--f-mono);}
.pf-dot{width:3px;height:3px;border-radius:50%;background:var(--muted);opacity:.4;flex-shrink:0;}

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

/* ── FOR WHOM ── */
.for-whom-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;}
.fw-item{background:var(--surface);border:1px solid var(--border);border-radius:var(--r);
  padding:20px 22px;transition:border-color .2s,box-shadow .2s;}
.fw-item:hover{border-color:rgba(212,175,55,.18);box-shadow:0 0 20px rgba(212,175,55,.04);}
.fw-marker{
  width:28px;height:28px;border-radius:6px;
  background:var(--gold-dim);border:1px solid rgba(212,175,55,.14);
  display:flex;align-items:center;justify-content:center;
  font-family:var(--f-mono);font-size:10px;font-weight:700;color:var(--gold);
  margin-bottom:12px;
}
.fw-name{font-size:14px;font-weight:700;color:var(--text);margin-bottom:5px;}
.fw-desc{font-size:12.5px;color:var(--muted);line-height:1.55;}

/* ── COMPARISON TABLE ── */
.compare-wrap{max-width:820px;margin:0 auto;}
.compare-head{
  display:grid;grid-template-columns:1fr 1fr 1fr;
  border:1px solid var(--border);border-bottom:none;border-radius:var(--r) var(--r) 0 0;overflow:hidden;
}
.compare-head-cell{padding:13px 20px;font-family:var(--f-mono);font-size:10.5px;font-weight:700;
  letter-spacing:.08em;text-transform:uppercase;border-right:1px solid var(--border);}
.compare-head-cell:last-child{border-right:none;}
.compare-head-cell.topic{background:rgba(255,255,255,.02);color:var(--muted);}
.compare-head-cell.bad{background:rgba(248,113,113,.06);color:var(--red);}
.compare-head-cell.good{background:rgba(212,175,55,.08);color:var(--gold);}
.compare-body{border:1px solid var(--border);border-radius:0 0 var(--r) var(--r);overflow:hidden;}
.compare-row{display:grid;grid-template-columns:1fr 1fr 1fr;border-bottom:1px solid var(--border);}
.compare-row:last-child{border-bottom:none;}
.compare-row:hover{background:rgba(255,255,255,.01);}
.compare-cell{padding:14px 20px;font-size:13px;border-right:1px solid var(--border);}
.compare-cell:last-child{border-right:none;}
.compare-cell.topic{color:var(--sub);font-weight:600;}
.compare-cell.bad{color:rgba(248,113,113,.65);}
.compare-cell.good{color:var(--sub);}

/* ── PRICING ── */
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

/* ── BENCHMARK TRUST ── */
.bench-inner{max-width:700px;margin:0 auto;text-align:center;}
.bench-tags{display:flex;flex-wrap:wrap;justify-content:center;gap:7px;margin-top:28px;}
.bench-tag{display:inline-flex;align-items:center;gap:6px;background:var(--surface);
  border:1px solid var(--border);border-radius:999px;padding:6px 14px;font-size:11.5px;color:var(--sub);font-family:var(--f-mono);}
.bench-dot{width:5px;height:5px;border-radius:50%;display:inline-block;}

/* ── OBJECTION ── */
.obj-grid{display:grid;grid-template-columns:1fr 1fr;gap:60px;align-items:center;}
.obj-items{display:flex;flex-direction:column;gap:8px;}
.obj-item{background:var(--surface);border:1px solid var(--border);border-radius:var(--r);
  padding:14px 18px;display:flex;align-items:center;gap:14px;transition:border-color .15s;}
.obj-item:hover{border-color:rgba(212,175,55,.14);}
.obj-mark{width:5px;height:5px;border-radius:50%;background:var(--muted);flex-shrink:0;}
.obj-text{font-size:13.5px;color:var(--sub);flex:1;line-height:1.45;}
.obj-text strong{color:var(--text);}
.obj-cost{font-family:var(--f-mono);font-size:10.5px;font-weight:700;color:var(--red);white-space:nowrap;}

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
.cta-final-sub{font-size:17px;color:var(--sub);margin-bottom:40px;max-width:480px;
  margin-left:auto;margin-right:auto;line-height:1.65;}
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
@media(max-width:960px){
  .hero-inner,.obj-grid{grid-template-columns:1fr;}
  .plans{grid-template-columns:1fr 1fr;}
  .for-whom-grid{grid-template-columns:1fr 1fr;}
  .tier-cards{grid-template-columns:1fr;}
  .compare-head,.compare-row{grid-template-columns:1fr 1fr;}
  .compare-cell.topic,.compare-head-cell.topic{display:none;}
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
  .pf-metrics{grid-template-columns:1fr 1fr;}
  .pf-m:nth-child(3),.pf-m:nth-child(4){border-top:1px solid var(--border);}
  .narrative-text{font-size:22px;}
  .dash-bottom{grid-template-columns:1fr;}
  .dash-block.bd{border-right:none;border-bottom:1px solid var(--border);}
}
@media(max-width:768px){
  .hero{padding:104px 0 64px;}
  .hero h1{font-size:34px;letter-spacing:-1.8px;}
  .hero-sub{font-size:16px;}
  .hero-ctas{flex-direction:column;align-items:flex-start;}
  .dash-metrics{grid-template-columns:1fr 1fr 1fr;}
  .pp-metrics{grid-template-columns:1fr 1fr;}
  .pp-metrics .pp-m:nth-child(5){grid-column:span 2;border-right:none;border-top:1px solid var(--border);}
  .pp-insights{grid-template-columns:1fr;}
  .pp-insight{border-right:none;border-bottom:1px solid var(--border);}
  .pp-insight:last-child{border-bottom:none;}
  .narrative-text{font-size:19px;}
  .section-title{font-size:28px;letter-spacing:-1.2px;}
  .for-whom-grid{grid-template-columns:1fr;}
  .obj-grid{gap:36px;}
}
@media(max-width:560px){
  .plans{grid-template-columns:1fr;}
  .hero h1{font-size:28px;letter-spacing:-1px;}
  .cta-primary{font-size:14.5px;padding:14px 24px;}
  .cta-primary.lg{font-size:16px;padding:16px 28px;}
  .trust-row{gap:5px;}
  .tc{font-size:11px;}
  .dash-metrics{grid-template-columns:1fr 1fr;}
  .dash-m:last-child{grid-column:span 2;border-top:1px solid var(--border);border-right:none;}
  .pf-metrics{grid-template-columns:1fr 1fr;}
  .tier-card{padding:24px 20px;}
  .cta-final h2{font-size:28px;letter-spacing:-.8px;}
  .for-whom-grid{grid-template-columns:1fr;}
  .compare-head,.compare-row{grid-template-columns:1fr 1fr;}
}
`

const PAINS = [
  {
    label: 'Você sabe quanto paga, mas não sabe se está caro.',
    desc: 'Sem uma faixa de referência por nicho e região, qualquer CPL parece aceitável.',
  },
  {
    label: 'Você compara campanhas só com o próprio histórico.',
    desc: 'Melhorar em relação a si mesmo não significa estar dentro da faixa esperada.',
  },
  {
    label: 'Você otimiza sem uma referência externa.',
    desc: 'Decisões de criativo, segmentação e verba ficam baseadas em feeling, não em comparação.',
  },
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

const FOR_WHOM = [
  { marker: '01', name: 'Gestores de tráfego', desc: 'Precisam de faixas de referência por nicho para embasar ajustes e apresentar resultados ao cliente.' },
  { marker: '02', name: 'Agências de marketing', desc: 'Gerenciam múltiplos clientes e querem comparativos por segmento para cada conta.' },
  { marker: '03', name: 'Negócios locais', desc: 'Investem em Google Ads ou Meta Ads e não sabem se o CPL está dentro da faixa esperada.' },
  { marker: '04', name: 'Clínicas e consultórios', desc: 'Saúde, odontologia, estética — CPL muito variável por cidade e especialidade.' },
  { marker: '05', name: 'Imobiliárias', desc: 'Leads custam caro — qualquer desvio da faixa esperada representa verba relevante.' },
  { marker: '06', name: 'E-commerces', desc: 'Precisam entender custo de aquisição dentro de margens sustentáveis.' },
]

const COMPARE_ROWS = [
  { topic: 'Avaliação do CPL', bad: 'No escuro, sem referência externa', good: 'Comparado com faixa estimada por nicho' },
  { topic: 'Base de decisão', bad: 'Histórico interno apenas', good: 'Comparativo por segmento e região' },
  { topic: 'Justificativa de ajustes', bad: 'Baseada em feeling e teste', good: 'Embasada em desvio percentual estimado' },
  { topic: 'Identificação de desvio', bad: 'Percebido tarde, após perda de verba', good: 'Identificado antes de escalar orçamento' },
]

const PLANS = [
  {
    name: 'Diagnóstico',
    target: 'Para quem quer entender se o CPL está fora da faixa esperada.',
    price: null,
    period: 'Gratuito para sempre',
    cta: 'Fazer diagnóstico grátis',
    ctaStyle: 'green-btn',
    features: [
      'CPL de referência para o seu nicho',
      'Desvio percentual do seu atual',
      'Estimativa de desperdício mensal',
      'Prioridade de ajuste',
    ],
    href: '/sign-up',
  },
  {
    name: 'Plataforma',
    target: 'Para negócios que querem acompanhar indicadores ao longo do tempo.',
    price: 'R$297',
    period: '/mês',
    cta: 'Começar acompanhamento',
    ctaStyle: 'secondary',
    features: [
      'Tudo do Diagnóstico',
      'Monitoramento contínuo de CPL',
      'Alertas automáticos de desvio',
      '1 conta conectada',
    ],
    href: '/checkout?plan=individual',
  },
  {
    name: 'Profissional',
    target: 'Para gestores de tráfego e agências com múltiplos clientes.',
    price: 'R$997',
    period: '/mês',
    cta: 'Usar com clientes',
    ctaStyle: 'primary',
    featured: true,
    badge: 'Ideal para agências',
    features: [
      'Tudo da Plataforma',
      'Até 8 clientes',
      'Conexão Meta Ads + Google Ads',
      'Auditoria automática de contas',
      'Relatórios em PDF',
    ],
    href: '/checkout?plan=profissional',
  },
  {
    name: 'Avançado',
    target: 'Para operações maiores com múltiplas contas e acompanhamento avançado.',
    price: 'R$2.997',
    period: '/mês',
    cta: 'Falar sobre operação',
    ctaStyle: 'secondary',
    features: [
      'Tudo do Profissional',
      'Até 15 clientes',
      'Múltiplas contas por plataforma',
      'Acesso à API',
      'Suporte prioritário',
    ],
    href: 'mailto:oi@elyonnous.com?subject=Plano Avançado',
  },
]

const BENCH_TAGS = [
  { label: 'Odontologia', color: '#22C55E' },
  { label: 'Saúde e Estética', color: '#38BDF8' },
  { label: 'Imobiliário', color: '#F0B429' },
  { label: 'Educação', color: '#A78BFA' },
  { label: 'Jurídico', color: '#FB923C' },
  { label: 'Fitness', color: '#22C55E' },
  { label: 'E-commerce', color: '#38BDF8' },
  { label: 'Negócios Locais', color: '#94A3B8' },
]

const OBJECTIONS = [
  { text: <><strong>Agência sem referência de nicho</strong> — cobra sem saber a faixa esperada</>, cost: '~R$2.000/mês' },
  { text: <><strong>Planilhas manuais</strong> — sempre atrasadas, propensas a erro</>, cost: 'Horas/semana' },
  { text: <><strong>Tentativa e erro</strong> — cada teste consome verba real</>, cost: 'Variável' },
  { text: <><strong>Ferramentas genéricas</strong> — sem comparativos por nicho e região</>, cost: 'R$300–800/mês' },
]

const FAQ_ITEMS = [
  {
    q: 'O diagnóstico é gratuito mesmo?',
    a: 'Sim, sem cartão e sem compromisso. Você informa seu nicho, região e CPL atual e recebe o resultado imediatamente.',
  },
  {
    q: 'Preciso conectar minha conta do Google Ads ou Meta Ads?',
    a: 'Não. O diagnóstico é manual — você informa os dados diretamente. A conexão com plataformas de anúncios é um recurso dos planos pagos.',
  },
  {
    q: 'De onde vêm os benchmarks?',
    a: 'As faixas de referência são estruturadas a partir de padrões estimados por nicho, região e tipo de mídia. Não são dados coletados de terceiros nem auditados externamente. São estimativas para orientar, não para substituir uma análise completa.',
  },
  {
    q: 'A ELYON NOUS substitui uma agência ou gestor de tráfego?',
    a: 'Não. A ELYON NOUS fornece faixas de referência de CPL — o que faltava para embasar decisões. Gestores e agências usam a plataforma junto com sua operação.',
  },
  {
    q: 'Serve para qualquer nicho?',
    a: 'A plataforma cobre os principais nichos do mercado brasileiro. Se o seu não estiver listado, o diagnóstico apresenta uma faixa geral de referência.',
  },
  {
    q: 'O resultado é exato ou estimado?',
    a: 'Estimado. O diagnóstico indica se seu CPL está dentro ou fora da faixa esperada para o seu segmento. É um ponto de comparação para identificar possíveis desvios — não um dado exato do seu negócio.',
  },
  {
    q: 'Posso usar para clientes da minha agência?',
    a: 'Sim. O plano Profissional é feito exatamente para isso: diagnósticos e monitoramento para múltiplos clientes em um único painel.',
  },
  {
    q: 'Meus dados ficam seguros?',
    a: 'Os dados informados no diagnóstico são usados apenas para gerar o resultado. Não são compartilhados nem vendidos. Para conexões com plataformas de anúncios, usamos somente escopos de leitura.',
  },
]

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
          <a href="#how" className="nav-link">Como funciona</a>
          <a href="#pricing" className="nav-link">Planos</a>
          <a href="#faq" className="nav-link">FAQ</a>
        </div>
        <div className="nav-actions">
          <a href={ctaHref} className="nav-login">Entrar</a>
          <a href={ctaHref} className="nav-cta" aria-label="Fazer diagnóstico gratuito de CPL">Diagnóstico grátis</a>
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
                Diagnóstico gratuito disponível agora
              </div>
              <p className="hero-pos">Para gestores, agências e empresas que investem em mídia paga.</p>
              <h1 id="hero-h1">
                Antes de escalar verba,<br />
                descubra se seu CPL<br />
                <em>já está fora da faixa.</em>
              </h1>
              <p className="hero-sub">
                A ELYON NOUS compara seu CPL com faixas de referência por nicho, região e plataforma — e mostra desvio estimado, desperdício e prioridade de ajuste.
              </p>
              <div className="hero-ctas">
                <a href={ctaHref} className="cta-primary" aria-label="Fazer diagnóstico gratuito de CPL — sem cartão">
                  Fazer diagnóstico grátis →
                </a>
                <a href="#how" className="cta-ghost">Ver como funciona</a>
              </div>
              <div className="trust-row" aria-label="Garantias do diagnóstico">
                <span className="tc"><span className="tc-check">✓</span> Sem cartão</span>
                <span className="tc"><span className="tc-check">✓</span> Resultado em minutos</span>
                <span className="tc"><span className="tc-check">✓</span> Meta Ads e Google Ads</span>
                <span className="tc"><span className="tc-check">✓</span> Sem compromisso</span>
              </div>
            </div>

            {/* Right: CPL Intelligence dashboard */}
            <div
              className="dash-card"
              role="img"
              aria-label="Exemplo de diagnóstico de CPL — Odontologia, São Paulo, Meta Ads"
            >
              <div className="dash-topbar">
                <span className="dash-topbar-title">
                  <span className="blink" aria-hidden="true" />
                  CPL Intelligence
                </span>
                <span className="dash-live" aria-hidden="true">
                  <span className="blink" />
                  Ao vivo
                </span>
              </div>

              <div className="dash-meta">
                <span className="dash-chip">Odontologia</span>
                <span className="dash-chip">São Paulo</span>
                <span className="dash-chip gold">Meta Ads</span>
              </div>

              <div className="dash-alert" role="status">
                <span className="dash-alert-tri" aria-hidden="true">⚠</span>
                CPL acima da faixa esperada · +79% de desvio
              </div>

              <div className="dash-metrics">
                <div className="dash-m">
                  <div className="dash-m-label">CPL atual</div>
                  <div className="dash-m-val r">R$68</div>
                  <div className="dash-m-delta">+79%</div>
                </div>
                <div className="dash-m">
                  <div className="dash-m-label">Faixa esperada</div>
                  <div className="dash-m-val g">R$28–38</div>
                  <div className="dash-m-sub">estimada</div>
                </div>
                <div className="dash-m">
                  <div className="dash-m-label">Est. desperdício</div>
                  <div className="dash-m-val a">R$4.200</div>
                  <div className="dash-m-sub">/mês</div>
                </div>
              </div>

              <div className="dash-bars">
                <div className="dash-bars-lbl">Comparativo CPL</div>
                <div className="bar-row">
                  <span className="bar-lbl">Ideal</span>
                  <div className="bar-track"><div className="bar-fill g" style={{ width: '50%' }} /></div>
                  <span className="bar-val g">R$34</span>
                </div>
                <div className="bar-row">
                  <span className="bar-lbl">Atual</span>
                  <div className="bar-track"><div className="bar-fill r" style={{ width: '100%' }} /></div>
                  <span className="bar-val r">R$68</span>
                </div>
              </div>

              <div className="dash-bottom">
                <div className="dash-block bd">
                  <div className="dash-block-lbl gold">Insight</div>
                  <p className="dash-block-text">CPL estimado acima da faixa de referência para campanhas similares no segmento odontológico.</p>
                </div>
                <div className="dash-block">
                  <div className="dash-block-lbl blue">Próxima ação →</div>
                  <p className="dash-block-text">Revisar promessa da oferta, segmentação e criativos antes de escalar orçamento.</p>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── NARRATIVE BREAK ── */}
      <div className="narrative" aria-hidden="true">
        <div className="wrap">
          <div className="narrative-inner">
            <p className="narrative-text">
              Você investe em anúncios. Os leads chegam.<br />
              Mas sem saber se o CPL está dentro da faixa esperada,<br />
              <em>otimizar é trabalhar sem referência.</em>
            </p>
          </div>
        </div>
      </div>

      {/* ── PROBLEMA ── */}
      <section style={{ background: 'var(--bg)' }} aria-labelledby="pain-h2">
        <div className="wrap">
          <div className="eyebrow">O problema real</div>
          <h2 id="pain-h2" className="section-title" style={{ maxWidth: 540 }}>
            O problema não é só gerar lead.<br />
            É saber se o <em>custo está dentro da faixa.</em>
          </h2>
          <div className="pain-list" role="list">
            {PAINS.map((p, i) => (
              <div className="pain-item" key={i} role="listitem">
                <div className="pain-num" aria-hidden="true">0{i + 1}</div>
                <div>
                  <div className="pain-label">{p.label}</div>
                  <p className="pain-desc">{p.desc}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="pain-close">
            Quem tem referência externa <strong>prioriza com mais clareza.</strong>{' '}
            Quem não tem continua otimizando sem parâmetro —{' '}
            e <em>potencialmente desperdiçando verba.</em>
          </div>
        </div>
      </section>

      {/* ── COMO FUNCIONA ── */}
      <section style={{ background: 'var(--surface)' }} id="how" aria-labelledby="how-h2">
        <div className="wrap">
          <div className="eyebrow c">Simples. Direto. Sem conexão de conta.</div>
          <h2 id="how-h2" className="section-title c" style={{ textAlign: 'center', maxWidth: 400, margin: '0 auto 52px' }}>
            Como funciona o <em>diagnóstico</em>
          </h2>
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
      <section style={{ background: 'var(--bg)' }} aria-labelledby="reveal-h2">
        <div className="wrap">
          <div className="eyebrow c">O que você recebe</div>
          <h2 id="reveal-h2" className="section-title c" style={{ textAlign: 'center', maxWidth: 480, margin: '0 auto 40px' }}>
            Clareza suficiente para a <em>próxima decisão</em>
          </h2>

          <div className="product-panel" role="img" aria-label="Exemplo de resultado do diagnóstico de CPL">
            <div className="pp-header">
              <div className="pp-header-title">
                <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--green)', display: 'inline-block' }} aria-hidden="true" />
                Resultado do Diagnóstico · Odontologia · São Paulo · Meta Ads
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
                <div className="pp-m-label">Est. Desperdício</div>
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
                <div className="pp-insight-label gold">Insight principal</div>
                <p className="pp-insight-text">
                  CPL estimado acima da faixa de referência para campanhas similares no segmento odontológico de São Paulo. Desvio consistente com criativos sem diferenciação de oferta.
                </p>
              </div>
              <div className="pp-insight">
                <div className="pp-insight-label blue">Próxima ação sugerida</div>
                <p className="pp-insight-text">
                  Revisar promessa da oferta e ângulo de segmentação. Testar criativos com foco em resultado específico antes de aumentar orçamento.
                </p>
              </div>
            </div>
          </div>

          <div style={{ textAlign: 'center', marginTop: 32 }}>
            <a href={ctaHref} className="cta-primary" aria-label="Ver meu diagnóstico de CPL grátis">
              Ver meu diagnóstico grátis →
            </a>
          </div>
        </div>
      </section>

      {/* ── PRODUTO EM USO ── */}
      <section style={{ background: 'var(--surface)' }} aria-labelledby="product-h2">
        <div className="wrap">
          <div className="eyebrow c">A plataforma</div>
          <h2 id="product-h2" className="section-title c" style={{ textAlign: 'center', maxWidth: 520, margin: '0 auto 14px' }}>
            Um painel para enxergar o que o<br /><em>gerenciador não mostra.</em>
          </h2>
          <p className="section-sub c" style={{ marginBottom: 36 }}>
            Meta Ads e Google Ads mostram quanto você pagou. A ELYON ajuda a entender se esse custo faz sentido para o seu nicho, região e objetivo.
          </p>

          <div className="platform-panel" role="img" aria-label="Visão geral do painel ELYON NOUS — dados demonstrativos">
            <div className="pf-header">
              <div className="pf-header-title">
                <span className="blink" aria-hidden="true" />
                Dashboard · Semana 21 de 2026 · Modo demonstrativo
              </div>
              <span className="pf-badge">Plano Profissional</span>
            </div>
            <div className="pf-metrics">
              <div className="pf-m">
                <div className="pf-m-label">Clientes monitorados</div>
                <div className="pf-m-val">8</div>
                <div className="pf-m-sub">contas ativas</div>
              </div>
              <div className="pf-m">
                <div className="pf-m-label">CPL médio</div>
                <div className="pf-m-val">R$42</div>
                <div className="pf-m-sub">portfólio completo</div>
              </div>
              <div className="pf-m">
                <div className="pf-m-label">Na faixa esperada</div>
                <div className="pf-m-val g">5/8</div>
                <div className="pf-m-sub">clientes</div>
              </div>
              <div className="pf-m">
                <div className="pf-m-label">Alertas ativos</div>
                <div className="pf-m-val a">3</div>
                <div className="pf-m-sub">requerem atenção</div>
              </div>
            </div>
            <div className="pf-footer">
              <span className="pf-footer-item">3 nichos monitorados</span>
              <span className="pf-dot" aria-hidden="true" />
              <span className="pf-footer-item">Desvio médio +28%</span>
              <span className="pf-dot" aria-hidden="true" />
              <span className="pf-footer-item">2 clientes com alerta ativo esta semana</span>
              <span className="pf-dot" aria-hidden="true" />
              <span className="pf-footer-item" style={{ fontStyle: 'italic' }}>Dados demonstrativos</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── DIAGNÓSTICO GRÁTIS VS PLATAFORMA ── */}
      <section className="tier-section" aria-labelledby="tier-h2">
        <div className="wrap">
          <div className="eyebrow c">Gratuito agora. Plataforma depois.</div>
          <h2 id="tier-h2" className="section-title c" style={{ textAlign: 'center', maxWidth: 520, margin: '0 auto 12px' }}>
            O diagnóstico é o retrato.<br /><em>A plataforma é o acompanhamento.</em>
          </h2>
          <p className="section-sub c" style={{ marginBottom: 14 }}>
            Comece sem custo. Se quiser monitorar indicadores de forma contínua, a plataforma está disponível quando precisar.
          </p>
          <p className="tier-transition">Um é um snapshot. O outro é um dashboard vivo.</p>
          <div className="tier-cards">
            <div className="tier-card free">
              <div className="tier-eyebrow free">Gratuito · Sempre disponível</div>
              <div className="tier-name">Diagnóstico de CPL</div>
              <div className="tier-desc">
                Para quem quer saber, agora mesmo, se o CPL está dentro da faixa esperada — sem cartão, sem compromisso, sem conexão de conta.
              </div>
              <div className="tier-price-free">Grátis</div>
              <div className="tier-price-period">Para sempre · sem cartão</div>
              <ul className="tier-list">
                {[
                  'Faixa de CPL estimada para o seu nicho',
                  'Comparativo com seu CPL atual',
                  'Estimativa de desperdício mensal',
                  'Prioridade de ajuste',
                  'Ponto de partida claro para otimização',
                ].map((f, i) => (
                  <li key={i}>
                    <span className="tier-ck-g" aria-hidden="true">✓</span>
                    {f}
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
                Para quem quer acompanhar indicadores ao longo do tempo, conectar contas de anúncios e agir mais rápido quando algo muda.
              </div>
              <div className="tier-price">R$297</div>
              <div className="tier-price-period">a partir de · por mês · cancele quando quiser</div>
              <ul className="tier-list">
                {[
                  'Monitoramento contínuo de CPL',
                  'Alertas automáticos de variação',
                  'Faixas de referência por nicho e região',
                  'Conexão com Meta Ads e Google Ads',
                  'Relatórios para tomada de decisão',
                  'Múltiplos clientes (planos Profissional e Avançado)',
                ].map((f, i) => (
                  <li key={i}>
                    <span className="tier-ck-gold" aria-hidden="true">→</span>
                    {f}
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

      {/* ── PARA QUEM É ── */}
      <section style={{ background: 'var(--bg)' }} aria-labelledby="whom-h2">
        <div className="wrap">
          <div className="eyebrow c">Para quem é</div>
          <h2 id="whom-h2" className="section-title c" style={{ textAlign: 'center', maxWidth: 460, margin: '0 auto 40px' }}>
            Feito para quem <em>investe em mídia paga</em>
          </h2>
          <div className="for-whom-grid">
            {FOR_WHOM.map((f, i) => (
              <div className="fw-item" key={i}>
                <div className="fw-marker" aria-hidden="true">{f.marker}</div>
                <div className="fw-name">{f.name}</div>
                <p className="fw-desc">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── COMPARAÇÃO ── */}
      <section style={{ background: 'var(--surface)' }} aria-labelledby="compare-h2">
        <div className="wrap">
          <div className="eyebrow c">A diferença na prática</div>
          <h2 id="compare-h2" className="section-title c" style={{ textAlign: 'center', maxWidth: 440, margin: '0 auto 40px' }}>
            Quando você tem referência,<br /><em>a conversa muda.</em>
          </h2>
          <div className="compare-wrap" role="table" aria-label="Comparação sem referência vs com ELYON NOUS">
            <div className="compare-head" role="row">
              <div className="compare-head-cell topic" role="columnheader">Situação</div>
              <div className="compare-head-cell bad" role="columnheader">Sem referência</div>
              <div className="compare-head-cell good" role="columnheader">Com ELYON NOUS</div>
            </div>
            <div className="compare-body" role="rowgroup">
              {COMPARE_ROWS.map((r, i) => (
                <div className="compare-row" key={i} role="row">
                  <div className="compare-cell topic" role="cell">{r.topic}</div>
                  <div className="compare-cell bad" role="cell">{r.bad}</div>
                  <div className="compare-cell good" role="cell">{r.good}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── PLANOS ── */}
      <section style={{ background: 'var(--bg)' }} id="pricing" aria-labelledby="pricing-h2">
        <div className="wrap">
          <div className="eyebrow c">Planos</div>
          <h2 id="pricing-h2" className="section-title c" style={{ textAlign: 'center', maxWidth: 480, margin: '0 auto 14px' }}>
            Comece grátis. <em>Escale quando fizer sentido.</em>
          </h2>
          <p className="section-sub c" style={{ marginBottom: 48 }}>
            O diagnóstico é sempre gratuito. Os planos pagos são para quem quer monitoramento contínuo ao longo do tempo.
          </p>
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

      {/* ── BENCHMARKS — TRANSPARÊNCIA ── */}
      <section style={{ background: 'var(--surface)' }} aria-labelledby="bench-h2">
        <div className="wrap">
          <div className="bench-inner">
            <div className="eyebrow c">Transparência total</div>
            <h2 id="bench-h2" className="section-title c" style={{ margin: '0 auto 20px', maxWidth: 480 }}>
              De onde vêm as <em>faixas de referência?</em>
            </h2>
            <p className="section-sub c" style={{ marginBottom: 14 }}>
              As faixas de CPL são estruturadas a partir de padrões estimados por nicho, região e tipo de mídia. Não são dados coletados de terceiros nem auditados externamente.
            </p>
            <p style={{ fontSize: 13, color: 'var(--muted)', textAlign: 'center', lineHeight: 1.7, maxWidth: 540, margin: '0 auto 28px' }}>
              O diagnóstico não substitui uma auditoria profissional. O que ele entrega é uma leitura comparativa para identificar desvios evidentes — com linguagem clara sobre o que é estimado. Acreditamos que transparência gera mais confiança do que promessas imprecisas.
            </p>
            <div className="bench-tags" aria-label="Nichos cobertos pela plataforma">
              {BENCH_TAGS.map((t, i) => (
                <span className="bench-tag" key={i}>
                  <span className="bench-dot" style={{ background: t.color }} aria-hidden="true" />
                  {t.label}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── OBJEÇÃO ── */}
      <section style={{ background: 'var(--bg)' }} aria-labelledby="obj-h2">
        <div className="wrap">
          <div className="obj-grid">
            <div>
              <div className="eyebrow">Pense bem</div>
              <h2 id="obj-h2" className="section-title">
                Você já paga por isso.<br /><em>Só não tem os dados.</em>
              </h2>
              <p className="section-sub">
                Agência, planilha, tentativa e erro — você já investe para entender o mercado. A diferença é que nenhuma dessas alternativas entrega uma faixa de referência de CPL por nicho.
              </p>
              <a href={ctaHref} className="cta-primary" style={{ display: 'inline-flex' }} aria-label="Fazer diagnóstico gratuito — sem cartão">
                Fazer diagnóstico grátis →
              </a>
            </div>
            <div className="obj-items">
              {OBJECTIONS.map((o, i) => (
                <div className="obj-item" key={i}>
                  <span className="obj-mark" aria-hidden="true" />
                  <p className="obj-text">{o.text}</p>
                  <span className="obj-cost">{o.cost}</span>
                </div>
              ))}
            </div>
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
              Antes de aumentar a verba,<br />
              descubra se o CPL <em>já está fora da faixa.</em>
            </h2>
            <p className="cta-final-sub">
              Faça o diagnóstico gratuito. Em minutos, você vê se suas campanhas estão dentro da faixa esperada — ou se há desvio que vale revisar antes de escalar.
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
