import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'ELYON NOUS | Diagnóstico gratuito de CPL',
  description:
    'Descubra se você está pagando caro por lead. Compare seu CPL com faixas de referência por nicho e região e identifique possíveis desvios nas suas campanhas.',
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
  --bg:#0F0F12;
  --surface:#18181C;
  --card:#202026;
  --border:rgba(255,255,255,.07);
  --gold:#D4AF37;
  --gold-hi:#E8C84A;
  --gold-glow:rgba(212,175,55,.16);
  --green:#22C55E;
  --green-dim:rgba(34,197,94,.12);
  --purple:#A78BFA;
  --blue:#38BDF8;
  --text:#F2F2F4;
  --muted:#6B6B7A;
  --sub:#9A9AAA;
  --red:#FF4D4D;
  --f-display:'Syne',sans-serif;
  --f-body:'DM Sans',sans-serif;
  --f-mono:'JetBrains Mono',monospace;
}
body{background:var(--bg);color:var(--text);font-family:var(--f-body);-webkit-font-smoothing:antialiased;}

/* NAV */
.nav{position:fixed;top:0;left:0;right:0;z-index:100;height:64px;display:flex;align-items:center;justify-content:space-between;padding:0 48px;background:rgba(15,15,18,.93);backdrop-filter:blur(20px);border-bottom:1px solid var(--border);}
.nav-logo{font-family:var(--f-display);font-weight:800;font-size:18px;color:var(--gold);letter-spacing:-.3px;text-decoration:none;}
.nav-links{display:flex;align-items:center;gap:28px;}
.nav-link{font-size:13px;color:var(--muted);text-decoration:none;transition:color .15s;}
.nav-link:hover{color:var(--text);}
.nav-actions{display:flex;align-items:center;gap:12px;}
.nav-login{font-size:13px;color:var(--muted);text-decoration:none;transition:color .15s;}
.nav-login:hover{color:var(--text);}
.nav-cta{background:var(--gold);color:#000;font-weight:700;font-size:13px;padding:9px 20px;border-radius:8px;text-decoration:none;transition:all .18s;display:inline-flex;align-items:center;white-space:nowrap;}
.nav-cta:hover{background:var(--gold-hi);box-shadow:0 0 20px var(--gold-glow);}

/* LAYOUT */
.wrap{max-width:1100px;margin:0 auto;padding:0 24px;}
section{padding:96px 0;}

/* HERO */
.hero{padding:128px 0 88px;background:radial-gradient(ellipse 900px 500px at 50% 0%,rgba(212,175,55,.06) 0%,transparent 70%);}
.hero-inner{display:grid;grid-template-columns:1fr 1fr;gap:72px;align-items:center;}
.hero-badge{display:inline-flex;align-items:center;gap:8px;background:rgba(212,175,55,.12);border:1px solid rgba(212,175,55,.25);border-radius:999px;padding:5px 14px;font-family:var(--f-mono);font-size:11px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:var(--gold);margin-bottom:16px;}
.hero-badge-dot{width:6px;height:6px;border-radius:50%;background:var(--green);animation:blink 2s infinite;display:inline-block;}
@keyframes blink{0%,100%{opacity:1}50%{opacity:.3}}
.hero-pos{font-size:13px;color:var(--muted);margin-bottom:22px;line-height:1.5;}
.hero h1{font-family:var(--f-display);font-size:50px;font-weight:800;line-height:1.08;letter-spacing:-2px;color:var(--text);margin-bottom:18px;}
.hero h1 em{color:var(--gold);font-style:normal;}
.hero-sub{font-size:17px;color:var(--sub);line-height:1.65;margin-bottom:32px;max-width:500px;}
.cta-primary{background:linear-gradient(135deg,var(--gold),var(--gold-hi));color:#000;font-weight:800;font-size:16px;padding:16px 32px;border-radius:12px;border:none;cursor:pointer;font-family:var(--f-body);text-decoration:none;display:inline-flex;align-items:center;gap:8px;transition:all .2s;letter-spacing:-.2px;}
.cta-primary:hover{box-shadow:0 0 40px var(--gold-glow),0 8px 24px rgba(0,0,0,.4);transform:translateY(-2px);}
.cta-primary:focus-visible{outline:2px solid var(--gold);outline-offset:3px;}
.cta-primary.lg{font-size:18px;padding:18px 40px;border-radius:14px;}
.trust-badges{display:flex;flex-wrap:wrap;gap:8px;margin-top:14px;}
.trust-badge{display:inline-flex;align-items:center;gap:5px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.07);border-radius:7px;padding:5px 10px;font-size:12px;color:var(--muted);}
.trust-badge .tck{color:var(--green);font-size:11px;}
.trust-check{color:var(--green);}

/* CPL CARD */
.cpl-card{background:var(--surface);border:1px solid rgba(212,175,55,.2);border-radius:20px;padding:24px 24px 20px;box-shadow:0 0 80px rgba(212,175,55,.07),0 40px 80px rgba(0,0,0,.5);}
.cpl-card-header{display:flex;align-items:center;justify-content:space-between;margin-bottom:4px;}
.cpl-card-title{font-family:var(--f-mono);font-size:11px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:var(--muted);display:flex;align-items:center;gap:7px;}
.cpl-dot{width:6px;height:6px;border-radius:50%;background:var(--green);animation:blink 2s infinite;display:inline-block;}
.cpl-platform-badge{font-size:9px;font-weight:700;padding:2px 8px;border-radius:4px;background:rgba(212,175,55,.1);color:var(--gold);border:1px solid rgba(212,175,55,.2);font-family:var(--f-mono);letter-spacing:.06em;text-transform:uppercase;}
.cpl-card-meta{font-size:11px;color:rgba(255,255,255,.25);font-family:var(--f-mono);margin-bottom:14px;}
.cpl-status{display:flex;align-items:center;gap:7px;background:rgba(255,77,77,.07);border:1px solid rgba(255,77,77,.18);border-radius:8px;padding:7px 12px;margin-bottom:14px;font-size:12px;color:var(--red);font-weight:600;}
.cpl-status-dot{width:5px;height:5px;border-radius:50%;background:var(--red);flex-shrink:0;}
.cpl-row{display:flex;justify-content:space-between;align-items:center;padding:10px 0;border-bottom:1px solid var(--border);}
.cpl-row:last-of-type{border-bottom:none;}
.cpl-label{font-size:13px;color:var(--muted);}
.cpl-value{font-family:var(--f-mono);font-size:19px;font-weight:700;}
.cpl-value.green{color:var(--green);}
.cpl-value.red{color:var(--red);}
.cpl-value.white{color:var(--text);}
.cpl-badge{font-size:11px;font-weight:700;padding:3px 8px;border-radius:6px;margin-left:8px;font-family:var(--f-mono);background:rgba(255,77,77,.15);color:var(--red);}
.cpl-bars{padding:12px 0 0;border-top:1px solid var(--border);display:flex;flex-direction:column;gap:7px;}
.cpl-bar-row{display:flex;align-items:center;gap:10px;}
.cpl-bar-lbl{font-size:10px;color:var(--muted);font-family:var(--f-mono);width:36px;flex-shrink:0;text-align:right;}
.cpl-bar-track{flex:1;height:5px;background:rgba(255,255,255,.06);border-radius:3px;overflow:hidden;min-width:0;}
.cpl-bar-fill{height:100%;border-radius:3px;}
.cpl-bar-v{font-size:11px;font-family:var(--f-mono);font-weight:700;width:34px;text-align:right;flex-shrink:0;}
.cpl-loss{margin-top:14px;background:rgba(255,77,77,.07);border:1px solid rgba(255,77,77,.18);border-radius:11px;padding:13px 16px;display:flex;justify-content:space-between;align-items:center;}
.cpl-loss-label{font-size:13px;color:var(--red);}
.cpl-loss-value{font-family:var(--f-mono);font-size:21px;font-weight:800;color:var(--red);}
.cpl-priority{margin-top:8px;background:rgba(212,175,55,.06);border:1px solid rgba(212,175,55,.15);border-radius:9px;padding:9px 13px;display:flex;align-items:center;gap:10px;}
.cpl-priority-label{font-size:10px;color:var(--muted);font-family:var(--f-mono);white-space:nowrap;text-transform:uppercase;letter-spacing:.08em;}
.cpl-priority-value{font-size:12px;color:var(--gold);font-weight:600;}

/* EYEBROW / SECTION TITLES */
.eyebrow{font-family:var(--f-mono);font-size:11px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:var(--gold);margin-bottom:16px;display:flex;align-items:center;gap:10px;}
.eyebrow::before{content:'';height:1px;width:24px;background:var(--gold);opacity:.5;}
.eyebrow.center{justify-content:center;}
.eyebrow.center::before{display:none;}
.section-title{font-family:var(--f-display);font-size:38px;font-weight:800;line-height:1.15;letter-spacing:-1.5px;color:var(--text);margin-bottom:20px;}
.section-title em{color:var(--gold);font-style:normal;}
.section-title.center{text-align:center;}
.section-sub{font-size:17px;color:var(--sub);line-height:1.65;margin-bottom:40px;}
.section-sub.center{text-align:center;max-width:560px;margin-left:auto;margin-right:auto;}

/* PAIN */
.pain-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:14px;margin-bottom:28px;}
.pain-item{background:var(--surface);border:1px solid var(--border);border-radius:14px;padding:22px;display:flex;flex-direction:column;gap:10px;}
.pain-icon{font-size:22px;}
.pain-label{font-size:14px;font-weight:700;color:var(--text);}
.pain-desc{font-size:13px;color:var(--muted);line-height:1.55;}
.pain-close{background:rgba(255,77,77,.05);border:1px solid rgba(255,77,77,.18);border-radius:14px;padding:18px 24px;font-size:15px;color:var(--sub);line-height:1.6;text-align:center;}
.pain-close strong{color:var(--text);}

/* STEPS */
.steps{display:grid;grid-template-columns:repeat(3,1fr);gap:20px;}
.step{background:var(--surface);border:1px solid var(--border);border-radius:16px;padding:28px 24px;transition:border-color .2s;}
.step:hover{border-color:rgba(212,175,55,.25);}
.step-num{font-family:var(--f-mono);font-size:11px;font-weight:700;letter-spacing:.1em;color:var(--gold);margin-bottom:16px;opacity:.7;}
.step-icon{font-size:28px;margin-bottom:14px;}
.step-title{font-size:16px;font-weight:700;color:var(--text);margin-bottom:8px;}
.step-desc{font-size:14px;color:var(--muted);line-height:1.6;}

/* DELIVERABLES */
.deliver-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:14px;}
.deliver-item{background:var(--surface);border:1px solid var(--border);border-radius:14px;padding:22px;transition:all .2s;}
.deliver-item:hover{border-color:rgba(212,175,55,.25);box-shadow:0 0 24px rgba(212,175,55,.04);}
.deliver-icon{font-size:26px;margin-bottom:12px;}
.deliver-title{font-size:14px;font-weight:700;color:var(--text);margin-bottom:6px;}
.deliver-desc{font-size:13px;color:var(--muted);line-height:1.6;}

/* FREE VS PLATFORM */
.tier-section{background:linear-gradient(135deg,rgba(34,197,94,.03) 0%,var(--bg) 40%,rgba(212,175,55,.04) 100%);border-top:1px solid var(--border);border-bottom:1px solid var(--border);}
.tier-transition{text-align:center;font-size:14px;color:var(--muted);margin-bottom:40px;font-style:italic;}
.tier-cards{display:grid;grid-template-columns:1fr 1fr;gap:24px;max-width:900px;margin:0 auto;}
.tier-card{border-radius:20px;padding:32px;display:flex;flex-direction:column;}
.tier-card.free{background:rgba(34,197,94,.04);border:1px solid rgba(34,197,94,.22);}
.tier-card.paid{background:rgba(212,175,55,.04);border:1px solid rgba(212,175,55,.28);}
.tier-eyebrow{font-family:var(--f-mono);font-size:10px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;margin-bottom:10px;}
.tier-eyebrow.free{color:var(--green);}
.tier-eyebrow.paid{color:var(--gold);}
.tier-name{font-family:var(--f-display);font-size:22px;font-weight:800;color:var(--text);margin-bottom:8px;}
.tier-desc{font-size:14px;color:var(--muted);margin-bottom:22px;line-height:1.6;}
.tier-price-free{font-family:var(--f-mono);font-size:30px;font-weight:800;color:var(--green);margin-bottom:3px;}
.tier-price{font-family:var(--f-mono);font-size:30px;font-weight:800;color:var(--text);margin-bottom:3px;}
.tier-price-period{font-size:12px;color:var(--muted);margin-bottom:22px;}
.tier-list{list-style:none;display:flex;flex-direction:column;gap:10px;margin-bottom:28px;}
.tier-list li{display:flex;align-items:flex-start;gap:10px;font-size:14px;color:var(--sub);}
.tier-check-green{color:var(--green);font-weight:700;flex-shrink:0;margin-top:1px;}
.tier-check-gold{color:var(--gold);font-weight:700;flex-shrink:0;margin-top:1px;}
.tier-cta{display:block;text-align:center;padding:13px 24px;border-radius:11px;font-weight:700;font-size:14px;text-decoration:none;transition:all .18s;margin-top:auto;}
.tier-cta:focus-visible{outline:2px solid var(--gold);outline-offset:3px;}
.tier-cta.free{background:var(--green-dim);color:var(--green);border:1px solid rgba(34,197,94,.28);}
.tier-cta.free:hover{background:rgba(34,197,94,.2);}
.tier-cta.paid{background:linear-gradient(135deg,var(--gold),var(--gold-hi));color:#000;}
.tier-cta.paid:hover{box-shadow:0 0 28px var(--gold-glow);transform:translateY(-1px);}

/* FOR WHOM */
.for-whom-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:14px;}
.for-whom-item{background:var(--surface);border:1px solid var(--border);border-radius:14px;padding:22px;display:flex;flex-direction:column;gap:10px;transition:border-color .2s;}
.for-whom-item:hover{border-color:rgba(212,175,55,.22);}
.for-whom-icon{font-size:28px;}
.for-whom-name{font-size:14px;font-weight:700;color:var(--text);}
.for-whom-desc{font-size:13px;color:var(--muted);line-height:1.55;}

/* COMPARISON */
.compare-grid{display:grid;grid-template-columns:1fr 1fr;gap:16px;}
.compare-col{border-radius:18px;overflow:hidden;}
.compare-header{padding:15px 22px;font-family:var(--f-mono);font-size:12px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;}
.compare-header.bad{background:rgba(255,77,77,.08);color:var(--red);border:1px solid rgba(255,77,77,.18);border-bottom:none;border-radius:18px 18px 0 0;}
.compare-header.good{background:rgba(212,175,55,.1);color:var(--gold);border:1px solid rgba(212,175,55,.22);border-bottom:none;border-radius:18px 18px 0 0;}
.compare-body.bad{padding:8px 0;background:rgba(255,77,77,.03);border:1px solid rgba(255,77,77,.14);border-top:none;border-radius:0 0 18px 18px;}
.compare-body.good{padding:8px 0;background:rgba(212,175,55,.02);border:1px solid rgba(212,175,55,.18);border-top:none;border-radius:0 0 18px 18px;}
.compare-item{display:flex;align-items:flex-start;gap:12px;padding:12px 22px;border-bottom:1px solid var(--border);}
.compare-item:last-child{border-bottom:none;}
.compare-text{font-size:14px;color:var(--sub);line-height:1.5;}

/* PRICING */
.plans{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;}
.plan{background:var(--surface);border:1px solid var(--border);border-radius:18px;padding:26px 20px;display:flex;flex-direction:column;transition:all .2s;position:relative;}
.plan:hover{border-color:rgba(212,175,55,.25);transform:translateY(-3px);box-shadow:0 16px 40px rgba(0,0,0,.4);}
.plan.featured{border-color:rgba(212,175,55,.35);background:linear-gradient(180deg,rgba(212,175,55,.07) 0%,var(--surface) 100%);box-shadow:0 0 40px rgba(212,175,55,.07);}
.plan-badge{position:absolute;top:-11px;left:50%;transform:translateX(-50%);background:var(--gold);color:#000;font-size:9px;font-weight:800;padding:3px 12px;border-radius:999px;letter-spacing:.07em;text-transform:uppercase;white-space:nowrap;}
.plan-name{font-family:var(--f-display);font-size:15px;font-weight:800;color:var(--text);margin-bottom:4px;}
.plan-target{font-size:11px;color:var(--muted);margin-bottom:14px;line-height:1.5;font-style:italic;min-height:32px;}
.plan-divider{height:1px;background:var(--border);margin:14px 0;}
.plan-price{font-family:var(--f-mono);font-size:28px;font-weight:800;color:var(--text);line-height:1;}
.plan-price span{font-size:13px;color:var(--muted);font-family:var(--f-body);font-weight:400;}
.plan-free{font-family:var(--f-mono);font-size:26px;font-weight:800;color:var(--green);line-height:1;}
.plan-period{font-size:11px;color:var(--muted);margin-bottom:20px;margin-top:3px;}
.plan-features{list-style:none;margin-bottom:20px;display:flex;flex-direction:column;gap:7px;flex:1;}
.plan-features li{display:flex;align-items:flex-start;gap:8px;font-size:13px;color:var(--sub);}
.plan-features li::before{content:'✓';color:var(--green);font-weight:700;flex-shrink:0;margin-top:1px;}
.plan-cta{display:block;text-align:center;padding:11px;border-radius:9px;font-weight:700;font-size:14px;text-decoration:none;transition:all .18s;cursor:pointer;border:none;font-family:var(--f-body);}
.plan-cta:focus-visible{outline:2px solid var(--gold);outline-offset:3px;}
.plan-cta.primary{background:linear-gradient(135deg,var(--gold),var(--gold-hi));color:#000;}
.plan-cta.primary:hover{box-shadow:0 0 20px var(--gold-glow);}
.plan-cta.secondary{background:transparent;color:var(--sub);border:1px solid var(--border);}
.plan-cta.secondary:hover{color:var(--text);border-color:rgba(212,175,55,.25);}
.plan-cta.green-btn{background:var(--green-dim);color:var(--green);border:1px solid rgba(34,197,94,.25);}
.plan-cta.green-btn:hover{background:rgba(34,197,94,.2);}

/* BENCHMARK TRUST */
.bench-inner{max-width:740px;margin:0 auto;text-align:center;}
.bench-tags{display:flex;flex-wrap:wrap;justify-content:center;gap:8px;margin-top:32px;}
.bench-tag{display:inline-flex;align-items:center;gap:6px;background:var(--surface);border:1px solid var(--border);border-radius:999px;padding:6px 14px;font-size:12px;color:var(--sub);font-family:var(--f-mono);}
.bench-dot{width:5px;height:5px;border-radius:50%;display:inline-block;}

/* OBJECTION */
.obj-grid{display:grid;grid-template-columns:1fr 1fr;gap:56px;align-items:center;}
.obj-items{display:flex;flex-direction:column;gap:10px;}
.obj-item{background:var(--surface);border:1px solid var(--border);border-radius:12px;padding:15px 18px;display:flex;align-items:center;gap:14px;}
.obj-icon{font-size:20px;flex-shrink:0;}
.obj-text{font-size:14px;color:var(--sub);flex:1;}
.obj-text strong{color:var(--text);}
.obj-cost{font-family:var(--f-mono);font-size:11px;font-weight:700;color:var(--red);white-space:nowrap;}

/* FAQ */
.faq-list{display:flex;flex-direction:column;gap:8px;max-width:740px;margin:0 auto;}
details.faq-item{background:var(--surface);border:1px solid var(--border);border-radius:12px;overflow:hidden;transition:border-color .2s;}
details.faq-item[open]{border-color:rgba(212,175,55,.2);}
details.faq-item summary{padding:18px 22px;font-size:15px;font-weight:600;color:var(--text);cursor:pointer;list-style:none;display:flex;justify-content:space-between;align-items:center;gap:16px;user-select:none;}
details.faq-item summary::-webkit-details-marker{display:none;}
details.faq-item summary::after{content:'+';font-size:20px;color:var(--gold);font-weight:300;line-height:1;flex-shrink:0;}
details.faq-item[open] summary::after{content:'−';}
details.faq-item summary:hover{color:var(--gold);}
details.faq-item summary:focus-visible{outline:2px solid var(--gold);outline-offset:-2px;}
.faq-answer{padding:16px 22px 18px;font-size:14px;color:var(--muted);line-height:1.7;border-top:1px solid var(--border);}

/* CTA FINAL */
.cta-final{background:radial-gradient(ellipse 1000px 500px at 50% 50%,rgba(212,175,55,.06) 0%,transparent 70%);text-align:center;padding:120px 0;}
.cta-final h2{font-family:var(--f-display);font-size:42px;font-weight:800;letter-spacing:-2px;color:var(--text);margin-bottom:16px;line-height:1.15;}
.cta-final h2 em{color:var(--gold);font-style:normal;}
.cta-final-sub{font-size:17px;color:var(--sub);margin-bottom:40px;max-width:520px;margin-left:auto;margin-right:auto;line-height:1.6;}
.final-trust{display:flex;justify-content:center;gap:24px;flex-wrap:wrap;margin-top:20px;}
.trust-item{display:flex;align-items:center;gap:6px;font-size:13px;color:var(--muted);}

/* FOOTER */
.footer{background:var(--surface);border-top:1px solid var(--border);padding:32px 0;}
.footer-inner{display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:16px;}
.footer-logo{font-family:var(--f-display);font-weight:800;font-size:16px;color:var(--gold);}
.footer-links{display:flex;gap:20px;}
.footer-links a{font-size:13px;color:var(--muted);text-decoration:none;transition:color .15s;}
.footer-links a:hover{color:var(--text);}
.footer-copy{font-size:12px;color:var(--muted);}

/* RESPONSIVE */
@media(max-width:900px){
  .hero-inner,.obj-grid{grid-template-columns:1fr;}
  .plans{grid-template-columns:1fr 1fr;}
  .pain-grid,.compare-grid,.deliver-grid,.tier-cards,.for-whom-grid{grid-template-columns:1fr;}
  .steps{grid-template-columns:1fr;}
  .hero h1{font-size:36px;letter-spacing:-1.5px;}
  .nav{padding:0 20px;}
  .nav-links{display:none;}
  .wrap{padding:0 16px;}
  section{padding:64px 0;}
  .cta-final h2{font-size:32px;}
  .section-title{font-size:30px;}
  .obj-grid{gap:32px;}
}
@media(max-width:768px){
  .cpl-card{padding:20px 18px 16px;}
  .hero h1{font-size:32px;letter-spacing:-1px;}
  .hero-sub{font-size:16px;}
}
@media(max-width:560px){
  .plans{grid-template-columns:1fr;}
  .nav-logo{font-size:16px;}
  .hero h1{font-size:28px;letter-spacing:-.8px;}
  .cta-primary{font-size:15px;padding:14px 24px;}
  .cta-primary.lg{font-size:16px;padding:16px 28px;}
  .trust-badges{gap:6px;}
  .trust-badge{font-size:11px;}
  .cpl-bar-lbl{width:28px;}
  .cpl-bar-v{width:30px;}
}
`

// ── Pain: 3 focused bullets (escaneável) ──────────────────────────────────
const PAINS = [
  {
    icon: '📊',
    label: 'Você sabe quanto paga, mas não sabe se está caro.',
    desc: 'Sem uma faixa de referência por nicho e região, qualquer CPL parece aceitável.',
  },
  {
    icon: '🔄',
    label: 'Você compara campanhas só com o próprio histórico.',
    desc: 'Melhorar em relação a si mesmo não significa estar dentro da faixa esperada do mercado.',
  },
  {
    icon: '🎯',
    label: 'Você otimiza sem uma referência externa.',
    desc: 'Decisões de criativo, segmentação e verba ficam baseadas em feeling, não em comparação.',
  },
]

// ── Steps: ação orientada ────────────────────────────────────────────────
const STEPS = [
  {
    icon: '📋',
    title: 'Informe nicho, região, plataforma e CPL atual',
    desc: 'Preencha o formulário simples em menos de 2 minutos. Nenhuma conexão de conta necessária.',
  },
  {
    icon: '📊',
    title: 'Compare com a faixa de referência estimada',
    desc: 'Cruzamos as informações com faixas estruturadas por nicho, região e tipo de campanha.',
  },
  {
    icon: '🎯',
    title: 'Receba diagnóstico, desvio percentual e prioridade',
    desc: 'CPL estimado para o seu nicho, diferença do seu atual e o próximo passo mais claro.',
  },
]

const DELIVERABLES = [
  { icon: '📊', title: 'CPL de referência estimado', desc: 'Faixa esperada de custo por lead para o seu nicho e região.' },
  { icon: '⚖️', title: 'Comparativo por segmento', desc: 'Seu CPL atual frente à faixa estruturada para campanhas similares.' },
  { icon: '📉', title: 'Desvio percentual', desc: 'Quanto acima (ou abaixo) da faixa estimada você está pagando.' },
  { icon: '💸', title: 'Desperdício estimado', desc: 'Estimativa do que pode estar sendo gasto além do esperado por mês.' },
  { icon: '🎯', title: 'Prioridade de ajuste', desc: 'O que revisar primeiro: segmentação, oferta, criativo ou orçamento.' },
  { icon: '📋', title: 'Ponto de partida claro', desc: 'Uma leitura objetiva para quem quer tomar decisões com mais contexto.' },
]

const FOR_WHOM = [
  { icon: '🚀', name: 'Gestores de tráfego', desc: 'Que precisam de faixas de referência por nicho para embasar ajustes e apresentar resultados.' },
  { icon: '🏢', name: 'Agências de marketing', desc: 'Que gerenciam múltiplos clientes e querem comparativos por segmento para cada conta.' },
  { icon: '🏪', name: 'Negócios locais', desc: 'Que investem em Google Ads ou Meta Ads e não sabem se o CPL está dentro da faixa esperada.' },
  { icon: '🏥', name: 'Clínicas e consultórios', desc: 'Saúde, odontologia, estética — segmentos com CPL muito variável por cidade e especialidade.' },
  { icon: '🏠', name: 'Imobiliárias', desc: 'Onde leads custam caro e qualquer desvio da faixa esperada representa verba relevante.' },
  { icon: '🛒', name: 'E-commerces', desc: 'Que precisam entender o custo de aquisição dentro de margens sustentáveis.' },
]

// ── Comparison: linguagem calibrada ─────────────────────────────────────
const BAD = [
  '❌ Decide no feeling, sem comparativo externo',
  '❌ Testa sem saber qual faixa seria esperada',
  '❌ Percebe o desvio tarde, depois de perda de verba',
  '❌ Troca de agência sem entender o problema real',
]

const GOOD = [
  '✅ Identifica se o CPL está acima da faixa estimada',
  '✅ Prioriza ajustes com base em comparativo por nicho',
  '✅ Reduz decisões baseadas apenas em feeling',
  '✅ Começa a otimizar com um ponto de referência claro',
]

// ── Plans: badge e CTAs específicos ──────────────────────────────────────
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
    target: 'Para negócios que querem acompanhar seus indicadores ao longo do tempo.',
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
  { icon: '🏢', text: <><strong>Agência sem referência de nicho</strong> — cobra sem saber a faixa esperada</>, cost: '~R$2.000/mês' },
  { icon: '📊', text: <><strong>Planilhas manuais</strong> — sempre atrasadas, propensas a erro</>, cost: 'Horas/semana' },
  { icon: '🎲', text: <><strong>Tentativa e erro</strong> — cada teste consome verba real</>, cost: 'Variável' },
  { icon: '🤖', text: <><strong>Ferramentas genéricas</strong> — sem comparativos por nicho e região</>, cost: 'R$300–800/mês' },
]

// ── FAQ: respostas curtas, seguras, escaneáveis ──────────────────────────
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
    a: 'Estimado. O diagnóstico indica se seu CPL está dentro ou fora da faixa esperada para o seu segmento. Não é um dado exato do seu negócio — é um ponto de comparação para identificar possíveis desvios.',
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

      {/* NAV */}
      <nav className="nav" aria-label="Navegação principal">
        <a href="/landing" className="nav-logo" aria-label="ELYON NOUS — página inicial">ELYON NOUS</a>
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
            <div>
              <div className="hero-badge" aria-hidden="true">
                <span className="hero-badge-dot" />
                Diagnóstico gratuito disponível agora
              </div>
              {/* Linha de posicionamento: responde "o que é" e "para quem" */}
              <p className="hero-pos">
                Ferramenta de diagnóstico de CPL para gestores, agências e empresas que investem em mídia paga.
              </p>
              <h1 id="hero-h1">
                Descubra se você está<br />
                pagando <em>caro por lead</em>
              </h1>
              <p className="hero-sub">
                Compare seu CPL com faixas de referência por nicho e região. Em poucos minutos, veja se há desvio nas suas campanhas — e qual seria o próximo ajuste.
              </p>
              <a href={ctaHref} className="cta-primary" aria-label="Ver meu CPL ideal grátis — diagnóstico sem cartão">
                Ver meu CPL ideal grátis →
              </a>
              <div className="trust-badges" aria-label="Garantias do diagnóstico">
                <span className="trust-badge"><span className="tck">✓</span> Sem cartão</span>
                <span className="trust-badge"><span className="tck">✓</span> Resultado em minutos</span>
                <span className="trust-badge"><span className="tck">✓</span> Meta Ads e Google Ads</span>
                <span className="trust-badge"><span className="tck">✓</span> Sem compromisso</span>
              </div>
            </div>

            {/* Mockup: card de diagnóstico — aspecto de produto real */}
            <div className="cpl-card" role="img" aria-label="Exemplo de diagnóstico de CPL para clínica odontológica em São Paulo">
              <div className="cpl-card-header">
                <span className="cpl-card-title">
                  <span className="cpl-dot" aria-hidden="true" />
                  Diagnóstico de CPL
                </span>
                <span className="cpl-platform-badge" aria-hidden="true">ELYON NOUS</span>
              </div>
              <div className="cpl-card-meta">Odontologia · São Paulo · Meta Ads</div>

              {/* Status badge */}
              <div className="cpl-status" role="status">
                <span className="cpl-status-dot" aria-hidden="true" />
                CPL acima da faixa de referência
              </div>

              {/* Dados principais */}
              <div className="cpl-row">
                <span className="cpl-label">CPL atual</span>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <span className="cpl-value red">R$68</span>
                  <span className="cpl-badge" aria-label="100% acima do ideal">+100%</span>
                </div>
              </div>
              <div className="cpl-row">
                <span className="cpl-label">Leads/mês</span>
                <span className="cpl-value white">210</span>
              </div>

              {/* Barra comparativa: ideal vs atual */}
              <div className="cpl-bars" aria-label="Comparação entre CPL ideal e atual">
                <div className="cpl-bar-row">
                  <span className="cpl-bar-lbl">Ideal</span>
                  <div className="cpl-bar-track">
                    <div className="cpl-bar-fill" style={{ width: '50%', background: 'var(--green)' }} />
                  </div>
                  <span className="cpl-bar-v" style={{ color: 'var(--green)' }}>R$34</span>
                </div>
                <div className="cpl-bar-row">
                  <span className="cpl-bar-lbl">Atual</span>
                  <div className="cpl-bar-track">
                    <div className="cpl-bar-fill" style={{ width: '100%', background: 'var(--red)' }} />
                  </div>
                  <span className="cpl-bar-v" style={{ color: 'var(--red)' }}>R$68</span>
                </div>
              </div>

              <div className="cpl-loss">
                <span className="cpl-loss-label">💸 Estimativa de desperdício/mês</span>
                <span className="cpl-loss-value">R$4.200</span>
              </div>
              <div className="cpl-priority">
                <span className="cpl-priority-label">Ajuste sugerido →</span>
                <span className="cpl-priority-value">Revisar público, criativo e promessa da oferta</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── PROBLEMA ── */}
      <section style={{ background: 'linear-gradient(180deg,var(--bg) 0%,rgba(24,24,28,1) 100%)' }} aria-labelledby="pain-h2">
        <div className="wrap">
          <div className="eyebrow">O problema real</div>
          <h2 id="pain-h2" className="section-title" style={{ maxWidth: 580 }}>
            O problema não é só gerar lead.<br />
            É saber se o <em>lead está caro.</em>
          </h2>
          <p className="section-sub" style={{ maxWidth: 560 }}>
            Muitas campanhas parecem saudáveis porque geram contatos todos os dias. Mas sem uma faixa de referência por nicho, região e plataforma, fica difícil saber se o custo está dentro do esperado ou se a verba está sendo consumida sem eficiência.
          </p>
          <div className="pain-grid">
            {PAINS.map((p, i) => (
              <div className="pain-item" key={i}>
                <span className="pain-icon" aria-hidden="true">{p.icon}</span>
                <div className="pain-label">{p.label}</div>
                <p className="pain-desc">{p.desc}</p>
              </div>
            ))}
          </div>
          <div className="pain-close">
            Quem tem referência externa <strong>prioriza com mais clareza.</strong> Quem não tem… continua otimizando no escuro — e <strong style={{ color: 'var(--red)' }}>potencialmente desperdiçando verba.</strong>
          </div>
        </div>
      </section>

      {/* ── COMO FUNCIONA ── */}
      <section style={{ background: 'rgba(24,24,28,1)' }} id="how" aria-labelledby="how-h2">
        <div className="wrap">
          <div className="eyebrow center" style={{ justifyContent: 'center' }}>Simples. Direto. Sem conexão de conta.</div>
          <h2 id="how-h2" className="section-title center" style={{ textAlign: 'center', maxWidth: 440, margin: '0 auto 48px' }}>
            Como funciona o <em>diagnóstico</em>
          </h2>
          <div className="steps">
            {STEPS.map((s, i) => (
              <div className="step" key={i}>
                <div className="step-num" aria-hidden="true">PASSO {String(i + 1).padStart(2, '0')}</div>
                <div className="step-icon" aria-hidden="true">{s.icon}</div>
                <div className="step-title">{s.title}</div>
                <p className="step-desc">{s.desc}</p>
              </div>
            ))}
          </div>
          <div style={{ textAlign: 'center', marginTop: 40 }}>
            <a href={ctaHref} className="cta-primary" aria-label="Começar diagnóstico gratuito agora">Começar agora — é grátis →</a>
          </div>
        </div>
      </section>

      {/* ── O QUE VOCÊ RECEBE ── */}
      <section style={{ background: 'var(--bg)' }} aria-labelledby="deliver-h2">
        <div className="wrap">
          <div className="eyebrow center" style={{ justifyContent: 'center' }}>O que você recebe</div>
          <h2 id="deliver-h2" className="section-title center" style={{ textAlign: 'center', maxWidth: 500, margin: '0 auto 40px' }}>
            Clareza suficiente para <em>tomar a próxima decisão</em>
          </h2>
          <div className="deliver-grid">
            {DELIVERABLES.map((d, i) => (
              <div className="deliver-item" key={i}>
                <div className="deliver-icon" aria-hidden="true">{d.icon}</div>
                <div className="deliver-title">{d.title}</div>
                <p className="deliver-desc">{d.desc}</p>
              </div>
            ))}
          </div>
          <div style={{ textAlign: 'center', marginTop: 40 }}>
            <a href={ctaHref} className="cta-primary" aria-label="Ver meu diagnóstico de CPL grátis">Ver meu diagnóstico grátis →</a>
          </div>
        </div>
      </section>

      {/* ── DIAGNÓSTICO GRÁTIS VS PLATAFORMA ── */}
      <section className="tier-section" aria-labelledby="tier-h2">
        <div className="wrap">
          <div className="eyebrow center" style={{ justifyContent: 'center' }}>Gratuito agora. Plataforma depois.</div>
          <h2 id="tier-h2" className="section-title center" style={{ textAlign: 'center', maxWidth: 560, margin: '0 auto 12px' }}>
            Diagnóstico gratuito agora.<br /><em>Plataforma contínua depois.</em>
          </h2>
          <p className="section-sub center" style={{ marginBottom: 16 }}>
            Comece sem custo. Se quiser monitorar indicadores de forma contínua, a plataforma está disponível quando precisar.
          </p>
          {/* Frase de transição */}
          <p className="tier-transition">
            O diagnóstico mostra o retrato atual. A plataforma ajuda a acompanhar a evolução.
          </p>
          <div className="tier-cards">
            <div className="tier-card free">
              <div className="tier-eyebrow free">Gratuito · Sempre disponível</div>
              <div className="tier-name">Diagnóstico de CPL</div>
              <div className="tier-desc">
                Para quem quer saber, agora mesmo, se o CPL está dentro da faixa esperada — sem cartão, sem compromisso, sem conexão de conta.
              </div>
              <div className="tier-price-free">Grátis</div>
              <div className="tier-price-period">Para sempre</div>
              <ul className="tier-list">
                {[
                  'Faixa de CPL estimada para o seu nicho',
                  'Comparativo com seu CPL atual',
                  'Estimativa de desperdício mensal',
                  'Prioridade de ajuste',
                  'Ponto de partida claro para otimização',
                ].map((f, i) => (
                  <li key={i}>
                    <span className="tier-check-green" aria-hidden="true">✓</span>
                    {f}
                  </li>
                ))}
              </ul>
              <a href={ctaHref} className="tier-cta free" aria-label="Ver meu CPL ideal grátis — sem cartão">Ver meu CPL ideal grátis →</a>
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
                  'Faixas de referência por nicho e região atualizadas',
                  'Conexão com Meta Ads e Google Ads',
                  'Relatórios para tomada de decisão',
                  'Múltiplos clientes (planos Profissional e Avançado)',
                ].map((f, i) => (
                  <li key={i}>
                    <span className="tier-check-gold" aria-hidden="true">→</span>
                    {f}
                  </li>
                ))}
              </ul>
              <a href="#pricing" className="tier-cta paid" aria-label="Ver planos e preços da plataforma ELYON NOUS">Ver planos e preços →</a>
            </div>
          </div>
        </div>
      </section>

      {/* ── PARA QUEM É ── */}
      <section style={{ background: 'rgba(24,24,28,1)' }} aria-labelledby="whom-h2">
        <div className="wrap">
          <div className="eyebrow center" style={{ justifyContent: 'center' }}>Para quem é</div>
          <h2 id="whom-h2" className="section-title center" style={{ textAlign: 'center', maxWidth: 480, margin: '0 auto 40px' }}>
            Feito para quem <em>investe em mídia paga</em>
          </h2>
          <div className="for-whom-grid">
            {FOR_WHOM.map((f, i) => (
              <div className="for-whom-item" key={i}>
                <div className="for-whom-icon" aria-hidden="true">{f.icon}</div>
                <div className="for-whom-name">{f.name}</div>
                <p className="for-whom-desc">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── COMPARAÇÃO COM / SEM ── */}
      <section style={{ background: 'var(--bg)' }} aria-labelledby="compare-h2">
        <div className="wrap">
          <div className="eyebrow center" style={{ justifyContent: 'center' }}>A diferença na prática</div>
          <h2 id="compare-h2" className="section-title center" style={{ textAlign: 'center', maxWidth: 440, margin: '0 auto 40px' }}>
            Com e sem <em>referência de mercado</em>
          </h2>
          <div className="compare-grid">
            <div className="compare-col">
              <div className="compare-header bad">❌ Sem referência de mercado</div>
              <div className="compare-body bad">
                {BAD.map((t, i) => (
                  <div className="compare-item" key={i}>
                    <span className="compare-text" style={{ color: 'rgba(255,255,255,.45)' }}>{t}</span>
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

      {/* ── PLANOS ── */}
      <section style={{ background: 'linear-gradient(180deg,var(--bg) 0%,rgba(24,24,28,1) 100%)' }} id="pricing" aria-labelledby="pricing-h2">
        <div className="wrap">
          <div className="eyebrow center" style={{ justifyContent: 'center' }}>Planos</div>
          <h2 id="pricing-h2" className="section-title center" style={{ textAlign: 'center', maxWidth: 480, margin: '0 auto 14px' }}>
            Comece grátis. <em>Escale quando fizer sentido.</em>
          </h2>
          <p className="section-sub center" style={{ marginBottom: 48 }}>
            O diagnóstico é sempre gratuito. Os planos pagos são para quem quer monitoramento contínuo e acompanhamento ao longo do tempo.
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

      {/* ── DE ONDE VÊM OS BENCHMARKS ── */}
      <section style={{ background: 'rgba(24,24,28,1)' }} aria-labelledby="bench-h2">
        <div className="wrap">
          <div className="bench-inner">
            <div className="eyebrow center" style={{ justifyContent: 'center' }}>Transparência total</div>
            <h2 id="bench-h2" className="section-title center" style={{ margin: '0 auto 20px', maxWidth: 520 }}>
              De onde vêm as <em>faixas de referência?</em>
            </h2>
            <p className="section-sub center" style={{ marginBottom: 16 }}>
              As faixas de CPL são estruturadas a partir de padrões estimados por nicho, região e tipo de mídia. Não são dados coletados de terceiros nem auditados externamente.
            </p>
            <p style={{ fontSize: 14, color: 'var(--muted)', textAlign: 'center', lineHeight: 1.7, maxWidth: 560, margin: '0 auto 32px' }}>
              O diagnóstico não substitui uma auditoria profissional. O que ele entrega é uma leitura comparativa para identificar desvios evidentes — com linguagem clara sobre o que é estimado e o que não é. Acreditamos que transparência gera mais confiança do que promessas imprecisas.
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
                Agência, planilha, tentativa e erro — você já investe para tentar entender o mercado. A diferença é que nenhuma dessas alternativas entrega uma faixa de referência de CPL por nicho.
              </p>
              <a href={ctaHref} className="cta-primary" style={{ display: 'inline-flex' }} aria-label="Ver meu CPL ideal grátis — sem cartão">
                Ver meu CPL ideal grátis →
              </a>
            </div>
            <div className="obj-items">
              {OBJECTIONS.map((o, i) => (
                <div className="obj-item" key={i}>
                  <span className="obj-icon" aria-hidden="true">{o.icon}</span>
                  <p className="obj-text">{o.text}</p>
                  <span className="obj-cost">{o.cost}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section style={{ background: 'rgba(24,24,28,1)' }} id="faq" aria-labelledby="faq-h2">
        <div className="wrap">
          <div className="eyebrow center" style={{ justifyContent: 'center' }}>Perguntas frequentes</div>
          <h2 id="faq-h2" className="section-title center" style={{ textAlign: 'center', maxWidth: 480, margin: '0 auto 40px' }}>
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
          <h2 id="cta-h2">
            Antes de aumentar sua verba,<br />
            descubra se seu CPL <em>já está fora da faixa.</em>
          </h2>
          <p className="cta-final-sub">
            Faça o diagnóstico gratuito e veja se suas campanhas estão crescendo com eficiência — ou apenas ficando mais caras.
          </p>
          <a href={ctaHref} className="cta-primary lg" aria-label="Ver meu CPL ideal grátis — diagnóstico sem cartão">
            Ver meu CPL ideal grátis →
          </a>
          <div className="final-trust" aria-label="Garantias">
            <span className="trust-item"><span className="trust-check" aria-hidden="true">✓</span> Diagnóstico em minutos</span>
            <span className="trust-item"><span className="trust-check" aria-hidden="true">✓</span> Sem cartão de crédito</span>
            <span className="trust-item"><span className="trust-check" aria-hidden="true">✓</span> Resultado estimado e transparente</span>
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
