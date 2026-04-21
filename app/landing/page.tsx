'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'

// ── CSS ──────────────────────────────────────────────────────────────────────
const LP_CSS = `
:root{--bg:#030305;--surface:#0C0C12;--card:#111118;--border:rgba(255,255,255,.06);--border-hi:rgba(255,255,255,.12);--gold:#F5A500;--gold-hi:#FFB800;--gold-dim:rgba(245,165,0,.06);--green:#22C55E;--red:#EF4444;--cyan:#06B6D4;--purple:#A78BFA;--text:#F0F0F2;--muted:#6B7280;--sub:#9CA3AF;--f-display:'Syne',sans-serif;--f-mono:'JetBrains Mono',monospace;--f-body:'DM Sans',sans-serif;}
.lp-wrap{position:relative;z-index:1;min-height:100vh;}
/* NAV */
.lp-nav{position:fixed;top:0;left:0;right:0;z-index:100;display:flex;align-items:center;justify-content:space-between;padding:0 48px;height:64px;background:rgba(3,3,5,.9);backdrop-filter:blur(16px);border-bottom:1px solid var(--border);}
.lp-logo{font-family:var(--f-display);font-weight:800;font-size:20px;color:var(--gold);letter-spacing:-.5px;text-decoration:none;}
.lp-nav-links{display:flex;gap:32px;}
.lp-nav-links a{font-size:14px;color:var(--sub);text-decoration:none;transition:color .15s;}
.lp-nav-links a:hover{color:var(--text);}
.lp-nav-actions{display:flex;gap:12px;align-items:center;}
.lp-nav-cta{background:var(--gold);color:#000;font-weight:700;font-size:13px;padding:9px 20px;border-radius:8px;border:none;cursor:pointer;font-family:var(--f-body);transition:all .18s;text-decoration:none;display:inline-flex;align-items:center;}
.lp-nav-cta:hover{background:var(--gold-hi);box-shadow:0 0 24px rgba(245,165,0,.4);transform:translateY(-1px);}
.lp-ghost-link{font-size:14px;color:var(--sub);text-decoration:none;transition:color .15s;}
.lp-ghost-link:hover{color:var(--text);}
/* VAR TOGGLE */
.var-toggle{position:fixed;top:80px;left:50%;transform:translateX(-50%);z-index:200;display:flex;gap:4px;background:var(--card);border:1px solid var(--border-hi);border-radius:12px;padding:4px;box-shadow:0 8px 32px rgba(0,0,0,.5);}
.var-btn{padding:8px 20px;border-radius:8px;font-family:var(--f-mono);font-size:12px;font-weight:600;letter-spacing:.05em;text-transform:uppercase;border:none;cursor:pointer;transition:all .18s;color:var(--muted);background:transparent;}
.var-btn.active{background:var(--gold);color:#000;}
/* SHARED */
.lp-container{max-width:1140px;margin:0 auto;padding:0 48px;}
.tag-badge{display:inline-flex;align-items:center;gap:6px;background:var(--gold-dim);border:1px solid rgba(245,165,0,.25);border-radius:999px;padding:5px 14px;font-family:var(--f-mono);font-size:11px;font-weight:600;letter-spacing:.08em;text-transform:uppercase;color:var(--gold);margin-bottom:28px;}
.tag-dot{width:6px;height:6px;border-radius:50%;background:var(--gold);box-shadow:0 0 8px var(--gold);animation:lp-blink 2s infinite;}
.section-eyebrow{font-family:var(--f-mono);font-size:11px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:var(--gold);margin-bottom:16px;display:flex;align-items:center;gap:10px;}
.section-eyebrow::before{content:'';height:1px;width:32px;background:var(--gold);opacity:.5;}
.section-eyebrow-c{justify-content:center;}
.section-eyebrow-c::before{display:none;}
.section-h{font-family:var(--f-display);font-size:40px;font-weight:800;letter-spacing:-1.5px;color:var(--text);margin-bottom:56px;max-width:500px;}
.section-h em{color:var(--gold);font-style:normal;}
.trust-row{display:flex;gap:20px;flex-wrap:wrap;}
.trust-item{display:flex;align-items:center;gap:6px;font-size:13px;color:var(--sub);}
.trust-check{color:var(--green);font-size:12px;}
/* BUTTONS */
.btn-p{background:var(--gold);color:#000;font-weight:700;font-size:15px;padding:14px 32px;border-radius:10px;border:none;cursor:pointer;font-family:var(--f-body);letter-spacing:-.2px;transition:all .18s;text-decoration:none;display:inline-flex;align-items:center;}
.btn-p:hover{background:var(--gold-hi);box-shadow:0 0 32px rgba(245,165,0,.4);transform:translateY(-1px);}
.btn-p.lg{font-size:17px;padding:16px 36px;border-radius:12px;}
.btn-s{background:transparent;color:var(--sub);font-size:15px;padding:14px 24px;border-radius:10px;border:1px solid var(--border-hi);cursor:pointer;font-family:var(--f-body);transition:all .18s;text-decoration:none;display:inline-flex;align-items:center;}
.btn-s:hover{color:var(--text);border-color:rgba(245,165,0,.3);}
/* FADE UP */
.lp-fade{opacity:0;transform:translateY(24px);transition:opacity .7s ease,transform .7s ease;}
.lp-fade.lp-visible{opacity:1;transform:none;}
.lp-d1{transition-delay:.1s;}.lp-d2{transition-delay:.2s;}.lp-d3{transition-delay:.3s;}
/* TERMINAL */
.terminal{background:#07080D;border:1px solid rgba(34,197,94,.25);border-radius:14px;overflow:hidden;box-shadow:0 0 40px rgba(34,197,94,.08),0 24px 64px rgba(0,0,0,.5);margin-bottom:28px;}
.terminal-bar{display:flex;align-items:center;gap:6px;padding:10px 16px;background:#0C0E15;border-bottom:1px solid rgba(255,255,255,.06);}
.t-dot{width:10px;height:10px;border-radius:50%;}
.terminal-body{padding:16px 20px;min-height:130px;font-family:var(--f-mono);font-size:12.5px;line-height:1.7;overflow:hidden;}
.t-cursor{display:inline-block;width:7px;height:14px;background:#22C55E;margin-left:2px;animation:lp-cursor .9s infinite;vertical-align:middle;}
@keyframes lp-cursor{0%,49%{opacity:1}50%,100%{opacity:0}}
@keyframes lp-blink{0%,100%{opacity:1}50%{opacity:.3}}
/* DASH MOCKUP */
.dash-mockup{background:var(--surface);border:1px solid var(--border-hi);border-radius:20px;overflow:hidden;box-shadow:0 0 80px rgba(245,165,0,.07),0 40px 100px rgba(0,0,0,.6);position:relative;}
.dash-top{display:flex;align-items:center;justify-content:space-between;padding:10px 16px;background:#0E0E18;border-bottom:1px solid var(--border);}
.dash-logo-sm{font-family:var(--f-display);font-weight:800;color:var(--gold);font-size:14px;}
.live-pill{display:flex;align-items:center;gap:5px;font-family:var(--f-mono);font-size:10px;font-weight:700;color:var(--green);letter-spacing:.08em;}
.live-dot{width:6px;height:6px;border-radius:50%;background:var(--green);box-shadow:0 0 6px var(--green);animation:lp-blink 1.5s infinite;}
.dash-body{padding:14px;}
.dash-niche-row{display:flex;gap:6px;margin-bottom:12px;}
.pill-sm{padding:3px 10px;border-radius:999px;font-family:var(--f-mono);font-size:10px;font-weight:600;letter-spacing:.06em;background:var(--card);border:1px solid var(--border);color:var(--sub);}
.pill-sm.active{background:rgba(245,165,0,.08);border-color:rgba(245,165,0,.25);color:var(--gold);}
.dm-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:8px;}
.dm{background:var(--card);border:1px solid var(--border);border-radius:10px;padding:10px 12px;}
.dm-label{font-family:var(--f-mono);font-size:9px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:var(--muted);margin-bottom:4px;}
.dm-val{font-family:var(--f-mono);font-size:22px;font-weight:700;letter-spacing:-.5px;line-height:1;}
.dm-sub{font-family:var(--f-mono);font-size:10px;color:var(--muted);margin-top:3px;}
.ai-mini{background:#0A0A14;border:1px solid rgba(245,165,0,.2);border-radius:10px;padding:10px 12px;margin-top:4px;}
.ai-mini-label{font-family:var(--f-mono);font-size:9px;font-weight:700;color:var(--gold);letter-spacing:.08em;margin-bottom:5px;}
.ai-mini-text{font-size:11px;color:var(--sub);line-height:1.5;}
.ai-mini-text strong{color:var(--text);}
/* HERO A */
.hero-a{min-height:100vh;padding-top:120px;padding-bottom:80px;display:grid;align-items:center;}
.hero-a-inner{display:grid;grid-template-columns:1fr 1fr;gap:64px;align-items:center;}
.hero-a-h{font-family:var(--f-display);font-size:clamp(40px,5vw,62px);font-weight:800;letter-spacing:-2px;line-height:1.05;color:var(--text);margin-bottom:20px;}
.hero-a-h em{color:var(--gold);font-style:normal;display:block;}
.hero-a-sub{font-size:17px;color:var(--sub);line-height:1.75;margin-bottom:36px;max-width:440px;}
.hero-a-sub strong{color:var(--text);font-weight:500;}
.hero-a-ctas{display:flex;gap:14px;align-items:center;margin-bottom:28px;}
/* STATS A */
.stats-a{padding:0 0 80px;}
.stats-a-inner{border:1px solid var(--border);border-radius:16px;background:var(--surface);display:grid;grid-template-columns:repeat(4,1fr);gap:0;overflow:hidden;}
.stat-a{padding:36px 32px;text-align:center;border-right:1px solid var(--border);}
.stat-a:last-child{border-right:none;}
.stat-a-val{font-family:var(--f-display);font-size:52px;font-weight:800;letter-spacing:-2px;color:var(--gold);line-height:1;margin-bottom:8px;}
.stat-a-label{font-size:13px;color:var(--muted);line-height:1.4;}
/* HOW A */
.how-a{padding:80px 0;}
.steps-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:24px;}
.step{background:var(--surface);border:1px solid var(--border);border-radius:16px;padding:32px 28px;position:relative;overflow:hidden;transition:border-color .2s;}
.step:hover{border-color:rgba(245,165,0,.3);}
.step-n{font-family:var(--f-mono);font-size:11px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:var(--gold);margin-bottom:14px;}
.step-h{font-family:var(--f-display);font-size:20px;font-weight:700;margin-bottom:10px;letter-spacing:-.3px;}
.step-p{font-size:14px;color:var(--sub);line-height:1.7;}
/* COMP A */
.comp-a{padding:80px 0;}
.comp-grid{display:grid;grid-template-columns:1fr 1fr;gap:16px;max-width:820px;margin:0 auto;}
.comp-side{border-radius:16px;padding:32px 28px;border:1px solid var(--border);}
.comp-side.bad{background:rgba(239,68,68,.04);}
.comp-side.good{background:linear-gradient(135deg,rgba(245,165,0,.05),rgba(34,197,94,.04));border-color:rgba(245,165,0,.2);box-shadow:0 0 40px rgba(245,165,0,.05);}
.comp-side-h{font-family:var(--f-display);font-size:15px;font-weight:700;margin-bottom:24px;display:flex;align-items:center;gap:8px;}
.comp-side.bad .comp-side-h{color:var(--red);}
.comp-side.good .comp-side-h{color:var(--green);}
.comp-items{display:flex;flex-direction:column;gap:14px;}
.comp-item{display:flex;align-items:flex-start;gap:10px;font-size:14px;color:var(--sub);line-height:1.5;}
.comp-icon{flex-shrink:0;margin-top:1px;font-weight:700;font-family:var(--f-mono);font-size:13px;}
.comp-side.bad .comp-icon{color:var(--red);}
.comp-side.good .comp-icon{color:var(--green);}
/* CTA A */
.cta-final{padding:100px 0 120px;text-align:center;}
.cta-final-h{font-family:var(--f-display);font-size:clamp(36px,5vw,60px);font-weight:800;letter-spacing:-2px;line-height:1.05;margin-bottom:20px;max-width:700px;margin-left:auto;margin-right:auto;}
.cta-final-h em{color:var(--gold);font-style:normal;}
.cta-final-sub{font-size:17px;color:var(--sub);margin-bottom:40px;}
.cta-row{display:flex;gap:14px;justify-content:center;align-items:center;margin-bottom:28px;}
/* HERO B */
.hero-b{min-height:100vh;padding-top:100px;position:relative;overflow:hidden;}
.hero-b-top{min-height:88vh;display:grid;grid-template-columns:1fr 1fr;gap:0;align-items:stretch;position:relative;z-index:1;}
.hero-b-left{padding:80px 48px 80px 0;display:flex;flex-direction:column;justify-content:center;border-right:1px solid var(--border);}
.hero-b-right{padding:80px 0 80px 64px;display:flex;flex-direction:column;justify-content:center;}
.hero-b-metric-label{font-family:var(--f-mono);font-size:11px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:var(--muted);margin-bottom:8px;}
.hero-b-number{font-family:var(--f-display);font-size:clamp(80px,12vw,136px);font-weight:800;letter-spacing:-5px;line-height:.9;color:var(--gold);text-shadow:0 0 80px rgba(245,165,0,.25);margin-bottom:16px;transition:all .3s;}
.hero-b-niche-label{font-family:var(--f-mono);font-size:13px;font-weight:500;color:var(--sub);letter-spacing:.02em;margin-bottom:4px;}
.niche-slot{font-family:var(--f-mono);font-size:16px;font-weight:700;color:var(--cyan);letter-spacing:-.2px;display:inline-block;min-width:280px;border-bottom:1px solid rgba(6,182,212,.3);padding-bottom:2px;transition:all .25s;}
.hero-b-h{font-family:var(--f-display);font-size:clamp(32px,4vw,50px);font-weight:800;letter-spacing:-1.5px;line-height:1.08;color:var(--text);margin-bottom:20px;}
.hero-b-h em{color:var(--gold);font-style:normal;}
.hero-b-sub{font-size:16px;color:var(--sub);line-height:1.75;margin-bottom:36px;max-width:400px;}
.niches-cloud{display:flex;flex-wrap:wrap;gap:8px;padding:20px 0;margin-top:8px;}
.niche-tag{padding:4px 12px;border-radius:999px;font-family:var(--f-mono);font-size:11px;font-weight:500;background:var(--card);border:1px solid var(--border);color:var(--muted);cursor:pointer;transition:all .15s;}
.niche-tag:hover,.niche-tag.active{background:rgba(6,182,212,.08);border-color:rgba(6,182,212,.3);color:var(--cyan);}
/* STATS B */
.stats-b{padding:0 0 80px;}
.stats-b-inner{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;}
.stat-b{background:var(--surface);border:1px solid var(--border);border-radius:14px;padding:28px 24px;transition:border-color .2s,transform .2s;}
.stat-b:hover{border-color:rgba(245,165,0,.3);transform:translateY(-2px);}
.stat-b-val{font-family:var(--f-display);font-size:44px;font-weight:800;letter-spacing:-2px;color:var(--gold);line-height:1;margin-bottom:8px;}
.stat-b-label{font-size:13px;color:var(--muted);line-height:1.4;}
.stat-b-sub{font-family:var(--f-mono);font-size:10px;color:var(--green);margin-top:6px;font-weight:600;}
/* TIMELINE */
.how-b{padding:80px 0;}
.timeline{display:flex;flex-direction:column;gap:0;max-width:680px;}
.tl-item{display:grid;grid-template-columns:64px 1fr;gap:24px;padding-bottom:40px;position:relative;}
.tl-item:not(:last-child)::before{content:'';position:absolute;left:30px;top:48px;width:1px;bottom:0;background:linear-gradient(var(--border),transparent);}
.tl-num{width:44px;height:44px;border-radius:50%;background:var(--gold-dim);border:1px solid rgba(245,165,0,.3);display:flex;align-items:center;justify-content:center;font-family:var(--f-mono);font-size:14px;font-weight:700;color:var(--gold);flex-shrink:0;margin-top:2px;}
.tl-h{font-family:var(--f-display);font-size:20px;font-weight:700;letter-spacing:-.3px;margin-bottom:6px;}
.tl-p{font-size:14px;color:var(--sub);line-height:1.7;}
.tl-tag{display:inline-block;margin-top:8px;padding:2px 10px;border-radius:999px;font-family:var(--f-mono);font-size:10px;font-weight:700;letter-spacing:.06em;background:rgba(34,197,94,.08);border:1px solid rgba(34,197,94,.2);color:var(--green);}
/* COMP B */
.comp-b{padding:80px 0;}
.comp-b-inner{display:grid;grid-template-columns:1fr 1fr;gap:2px;border-radius:16px;overflow:hidden;border:1px solid var(--border);}
.comp-b-side{padding:40px 36px;}
.comp-b-side.bad{background:var(--surface);}
.comp-b-side.good{background:linear-gradient(160deg,rgba(245,165,0,.05),var(--surface));}
.comp-b-head{font-family:var(--f-display);font-size:13px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;margin-bottom:28px;display:flex;align-items:center;gap:8px;}
.comp-b-side.bad .comp-b-head{color:var(--red);}
.comp-b-side.good .comp-b-head{color:var(--gold);}
.comp-b-items{display:flex;flex-direction:column;gap:16px;}
.comp-b-item{font-size:14px;color:var(--sub);line-height:1.55;display:flex;gap:10px;align-items:flex-start;}
.comp-b-icon{flex-shrink:0;font-family:var(--f-mono);font-weight:700;font-size:12px;margin-top:1px;}
.comp-b-side.bad .comp-b-icon{color:var(--red);}
.comp-b-side.good .comp-b-icon{color:var(--gold);}
/* FEATURES B */
.b-feat-grid{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-top:48px;}
.b-feat{background:var(--surface);border:1px solid var(--border);border-radius:14px;padding:26px 24px;transition:border-color .2s;}
.b-feat:hover{border-color:var(--border-hi);}
.b-feat-iw{width:38px;height:38px;border-radius:9px;background:rgba(245,165,0,.06);border:1px solid rgba(245,165,0,.2);display:flex;align-items:center;justify-content:center;font-size:17px;margin-bottom:14px;}
.b-feat-lbl{font-family:var(--f-mono);font-size:9.5px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:var(--gold);margin-bottom:7px;}
.b-feat-h{font-family:var(--f-display);font-size:18px;font-weight:700;letter-spacing:-.3px;margin-bottom:8px;}
.b-feat-p{font-size:13.5px;color:var(--sub);line-height:1.7;}
.b-feat-demo{margin-top:14px;background:var(--card);border:1px solid var(--border);border-radius:8px;padding:11px 13px;font-size:12px;color:var(--sub);line-height:1.55;}
.b-feat-demo strong{color:var(--text);}
.b-feat-badges{display:flex;gap:7px;margin-top:12px;flex-wrap:wrap;}
.b-fbadge{display:flex;align-items:center;gap:5px;background:var(--card);border:1px solid var(--border);border-radius:7px;padding:5px 10px;font-size:11.5px;font-weight:500;color:var(--sub);}
.funnel-b{display:flex;gap:5px;margin-top:12px;}
.funnel-b-p{flex:1;padding:6px;background:var(--card);border-radius:6px;text-align:center;border:1px solid var(--border);}
.funnel-b-p.mid{border-color:rgba(245,165,0,.25);background:rgba(245,165,0,.04);}
.fb-lbl{font-family:var(--f-mono);font-size:8.5px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:var(--muted);}
.fb-name{font-size:10.5px;font-weight:600;color:var(--text);margin-top:2px;}
.camp-b{display:flex;flex-direction:column;gap:6px;margin-top:12px;}
.camp-b-i{display:flex;justify-content:space-between;align-items:center;background:var(--card);border:1px solid var(--border);border-radius:7px;padding:6px 10px;}
.camp-b-n{font-size:11px;color:var(--sub);}
.camp-b-r{font-family:var(--f-mono);font-size:10px;font-weight:700;}
/* BENCHMARKS B */
.b-bench{padding:80px 0;}
.b-niche-sel{display:flex;flex-wrap:wrap;gap:6px;margin:28px 0 24px;}
.b-ntag{padding:5px 13px;border-radius:999px;font-family:var(--f-mono);font-size:11px;font-weight:600;background:var(--card);border:1px solid var(--border);color:var(--muted);cursor:pointer;transition:all .15s;}
.b-ntag:hover{color:var(--text);border-color:var(--border-hi);}
.b-ntag.active{background:rgba(6,182,212,.08);border-color:rgba(6,182,212,.3);color:var(--cyan);}
.b-ndata{background:var(--surface);border:1px solid rgba(6,182,212,.25);border-radius:16px;padding:28px 30px;display:grid;grid-template-columns:1fr 1fr;gap:24px;align-items:start;}
.b-nd-t{font-family:var(--f-display);font-size:21px;font-weight:700;letter-spacing:-.4px;color:var(--text);margin-bottom:14px;}
.b-nd-metrics{display:grid;grid-template-columns:1fr 1fr;gap:9px;}
.b-nd-m{background:var(--card);border:1px solid var(--border);border-radius:9px;padding:11px 13px;}
.b-nd-ml{font-family:var(--f-mono);font-size:9px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:var(--muted);margin-bottom:3px;}
.b-nd-mv{font-family:var(--f-mono);font-size:20px;font-weight:700;letter-spacing:-.4px;}
.b-nd-ms{font-size:10.5px;color:var(--muted);margin-top:2px;}
.b-nd-ch-lbl{font-family:var(--f-mono);font-size:9px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:var(--muted);margin-bottom:8px;}
.b-nd-chs{display:flex;flex-direction:column;gap:7px;}
.b-nd-ch{display:flex;justify-content:space-between;align-items:center;background:var(--card);border:1px solid var(--border);border-radius:7px;padding:7px 11px;}
.b-nd-cn{font-size:13px;font-weight:500;color:var(--text);}
.b-nd-cv{font-family:var(--f-mono);font-size:10.5px;font-weight:700;color:var(--cyan);}
.b-nd-ins{background:rgba(6,182,212,.04);border:1px solid rgba(6,182,212,.2);border-radius:9px;padding:11px 13px;margin-top:10px;font-size:12.5px;color:var(--sub);line-height:1.6;}
.b-nd-ins strong{color:var(--text);}
/* PRICING B */
.b-price{padding:80px 0;}
.b-pgrid{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-top:44px;}
.b-pcard{background:var(--surface);border:1px solid var(--border);border-radius:16px;padding:26px 22px;position:relative;transition:border-color .2s,transform .2s;}
.b-pcard:hover{border-color:var(--border-hi);transform:translateY(-2px);}
.b-pcard.pop{border-color:rgba(245,165,0,.3);background:linear-gradient(155deg,rgba(245,165,0,.04),var(--surface));}
.b-pop-badge{position:absolute;top:-10px;left:50%;transform:translateX(-50%);background:var(--gold);color:#000;font-family:var(--f-mono);font-size:9.5px;font-weight:700;padding:3px 12px;border-radius:999px;white-space:nowrap;letter-spacing:.05em;}
.b-pc-lbl{font-family:var(--f-mono);font-size:9.5px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:var(--muted);margin-bottom:7px;}
.b-pc-name{font-family:var(--f-display);font-size:21px;font-weight:800;letter-spacing:-.4px;margin-bottom:4px;}
.b-pc-desc{font-size:13px;color:var(--sub);margin-bottom:18px;line-height:1.5;}
.b-pc-price{display:flex;align-items:baseline;gap:3px;margin-bottom:18px;}
.b-pc-cur{font-family:var(--f-display);font-size:15px;font-weight:700;color:var(--sub);}
.b-pc-val{font-family:var(--f-display);font-size:42px;font-weight:800;letter-spacing:-2px;color:var(--text);line-height:1;}
.b-pc-per{font-size:13px;color:var(--muted);}
.b-pc-btn{width:100%;padding:11px;border-radius:8px;font-family:var(--f-body);font-size:13.5px;font-weight:700;cursor:pointer;border:none;transition:all .18s;margin-bottom:18px;}
.b-pc-btn.prim{background:var(--gold);color:#000;}
.b-pc-btn.prim:hover{background:var(--gold-hi);box-shadow:0 0 20px rgba(245,165,0,.35);}
.b-pc-btn.ghost{background:transparent;color:var(--sub);border:1px solid var(--border-hi);}
.b-pc-btn.ghost:hover{border-color:rgba(245,165,0,.3);color:var(--text);}
.b-pc-feats{list-style:none;display:flex;flex-direction:column;gap:8px;}
.b-pc-feat{font-size:13px;color:var(--sub);display:flex;gap:7px;align-items:flex-start;line-height:1.4;}
.b-pc-feat::before{content:'✓';color:var(--green);font-size:11px;flex-shrink:0;margin-top:2px;font-weight:700;}
/* AUDIENCE B */
.b-aud{padding:80px 0;}
.b-aud-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:14px;margin-top:38px;}
.b-aud-card{background:var(--surface);border:1px solid var(--border);border-radius:14px;padding:26px 20px;transition:border-color .2s;}
.b-aud-card:hover{border-color:var(--border-hi);}
.b-aud-ico{font-size:26px;margin-bottom:14px;display:block;}
.b-aud-who{font-family:var(--f-mono);font-size:9.5px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:var(--muted);margin-bottom:7px;}
.b-aud-h{font-family:var(--f-display);font-size:17px;font-weight:700;letter-spacing:-.3px;margin-bottom:9px;}
.b-aud-p{font-size:13.5px;color:var(--sub);line-height:1.7;margin-bottom:12px;}
.b-aud-plan{font-family:var(--f-mono);font-size:10.5px;font-weight:600;color:var(--cyan);}
/* CTA B */
.cta-b{padding:100px 0 120px;text-align:center;position:relative;}
.cta-b::before{content:'';position:absolute;inset:0;background:radial-gradient(ellipse at 50% 50%,rgba(245,165,0,.06) 0%,transparent 60%);pointer-events:none;}
.cta-b-h{position:relative;z-index:1;font-family:var(--f-display);font-size:clamp(40px,6vw,72px);font-weight:800;letter-spacing:-3px;line-height:1;color:var(--text);margin-bottom:24px;}
.cta-b-h em{color:var(--gold);font-style:normal;}
.cta-b-h span{color:var(--muted);}
.cta-b-sub{position:relative;z-index:1;font-size:18px;color:var(--sub);margin-bottom:44px;}
/* FOOTER */
.lp-footer{border-top:1px solid var(--border);padding:40px 0;}
.lp-footer-inner{display:flex;flex-direction:column;align-items:center;gap:16px;}
.lp-footer-links{display:flex;gap:28px;}
.lp-footer-links a{font-size:13px;color:var(--muted);text-decoration:none;transition:color .15s;}
.lp-footer-links a:hover{color:var(--sub);}
/* NICHE SLOT MACHINE */
@keyframes niche-in{0%{opacity:0;transform:translateY(-14px)}100%{opacity:1;transform:none}}
@keyframes roas-in{0%{opacity:0;transform:translateY(10px) scale(.96)}100%{opacity:1;transform:none}}
.niche-slot-anim{animation:niche-in .32s cubic-bezier(.34,1.56,.64,1) forwards;}
.roas-anim{animation:roas-in .38s cubic-bezier(.34,1.56,.64,1) forwards;}
/* SOCIAL BAR */
.social-bar{border-top:1px solid var(--border);border-bottom:1px solid var(--border);padding:16px 0;background:rgba(255,255,255,.015);position:relative;z-index:1;}
.social-bar-inner{display:flex;align-items:center;justify-content:center;gap:28px;flex-wrap:wrap;}
.social-item{display:flex;align-items:center;gap:8px;font-family:var(--f-mono);font-size:11px;font-weight:600;letter-spacing:.06em;color:var(--muted);}
.social-item-dot{width:6px;height:6px;border-radius:50%;background:var(--green);box-shadow:0 0 6px var(--green);}
.social-sep{width:1px;height:14px;background:var(--border);}
/* MOBILE */
@media(max-width:900px){
  .hero-b-top{grid-template-columns:1fr!important;}
  .hero-b-left{border-right:none!important;border-bottom:1px solid var(--border);padding:60px 20px 36px!important;}
  .hero-b-right{padding:36px 20px 60px!important;}
  .stats-b-inner{grid-template-columns:1fr 1fr;}
  .b-feat-grid{grid-template-columns:1fr;}
  .b-pgrid{grid-template-columns:1fr;}
  .b-aud-grid{grid-template-columns:1fr;}
  .comp-b-inner{grid-template-columns:1fr;}
  .b-ndata{grid-template-columns:1fr;}
  .lp-container{padding:0 20px;}
  .section-h{font-size:32px;}
  .hero-b-h{font-size:clamp(28px,6vw,40px);}
}
@media(max-width:600px){
  .lp-nav{padding:0 16px;}
  .lp-nav-links{display:none;}
  .stats-b-inner{grid-template-columns:1fr 1fr;}
  .social-bar-inner{gap:16px;}
  .hero-b-number{font-size:clamp(72px,20vw,120px)!important;}
}
`

// ── DATA ─────────────────────────────────────────────────────────────────────
const TERMINAL_LINES = [
  { delay: 400,  html: '<span style="color:#22C55E">$</span> <span style="color:#F0F0F2">elyon analyze --nicho "Odontologia Estética"</span>' },
  { delay: 1200, html: '<span style="color:#6EE7B7">⏳ Carregando benchmark...</span>' },
  { delay: 1800, html: '<span style="color:#9CA3AF">  CPL médio: </span><span style="color:#F5A500;font-weight:700">R$87</span>&nbsp;&nbsp;<span style="color:#9CA3AF">ROAS:</span> <span style="color:#22C55E;font-weight:700">4.1×</span>&nbsp;&nbsp;<span style="color:#9CA3AF">Canal:</span> Meta Ads' },
  { delay: 2200, html: '<span style="color:#9CA3AF">  Leads/mês: </span><span style="color:#22C55E;font-weight:700">62–95</span>&nbsp;&nbsp;<span style="color:#9CA3AF">LTV:</span> <span style="color:#A78BFA;font-weight:700">R$38k</span>' },
  { delay: 2800, html: '' },
  { delay: 3000, html: '<span style="color:#22C55E">$</span> <span style="color:#F0F0F2">elyon analyze --nicho "Móveis Planejados"</span>' },
  { delay: 3800, html: '<span style="color:#9CA3AF">  CPL médio: </span><span style="color:#F5A500;font-weight:700">R$63</span>&nbsp;&nbsp;<span style="color:#9CA3AF">ROAS:</span> <span style="color:#22C55E;font-weight:700">34.8×</span>&nbsp;&nbsp;<span style="color:#9CA3AF">Canal:</span> Facebook' },
  { delay: 4300, html: '<span style="color:#9CA3AF">  Receita est:</span> <span style="color:#F5A500;font-weight:700">R$1.04M/ano</span>&nbsp;&nbsp;<span style="color:#9CA3AF">Score:</span> <span style="color:#22C55E;font-weight:700">EXCELENTE ✓</span>' },
]

const HERO_NICHES = [
  { label: 'Móveis Planejados', roas: 34.8, niche: 'Marcenaria / Móveis Planejados' },
  { label: 'Odontologia',       roas: 4.1,  niche: 'Odontologia Estética' },
  { label: 'Advocacia',         roas: 6.8,  niche: 'Advocacia Previdenciária' },
  { label: 'Estética',          roas: 5.2,  niche: 'Clínica de Estética' },
  { label: 'Personal',          roas: 3.9,  niche: 'Personal Trainer' },
  { label: 'Imobiliária',       roas: 7.4,  niche: 'Imobiliária de Luxo' },
  { label: 'Psicologia',        roas: 4.5,  niche: 'Psicologia Online' },
  { label: 'Cursos Online',     roas: 9.2,  niche: 'Cursos de Inglês' },
]

const BENCHMARKS = [
  { label: 'Odontologia',    name: 'Odontologia Estética',        cpl: 'R$45–95',  roas: '3.8×', cvr: '15%', bmin: 'R$2.500', ch1: 'Meta Ads',     ch2: 'Google Search', ch3: 'Instagram',      tip: 'Pico: Dezembro · Março' },
  { label: 'Estética',       name: 'Clínica de Estética',         cpl: 'R$35–70',  roas: '4.5×', cvr: '18%', bmin: 'R$2.000', ch1: 'Instagram Ads', ch2: 'Meta Ads',       ch3: 'Google Display', tip: 'Pico: Janeiro · Outubro' },
  { label: 'Imobiliária',    name: 'Imobiliária',                  cpl: 'R$80–180', roas: '12×',  cvr: '6%',  bmin: 'R$5.000', ch1: 'Meta Ads',     ch2: 'Google Search', ch3: 'Portais',        tip: 'Pico: Fevereiro · Agosto' },
  { label: 'Advocacia',      name: 'Advocacia Previdenciária',     cpl: 'R$40–90',  roas: '6.8×', cvr: '12%', bmin: 'R$3.000', ch1: 'Google Search', ch2: 'Meta Ads',       ch3: 'YouTube',        tip: 'Evergreen' },
  { label: 'Cursos Online',  name: 'Cursos Online',                cpl: 'R$15–35',  roas: '9.2×', cvr: '22%', bmin: 'R$1.500', ch1: 'Meta Ads',     ch2: 'YouTube Ads',   ch3: 'Google',         tip: 'Pico: Janeiro · Julho' },
  { label: 'Móveis Planej.', name: 'Marcenaria / Móveis Planej.', cpl: 'R$50–80',  roas: '34.8×',cvr: '12%', bmin: 'R$3.000', ch1: 'Facebook Ads', ch2: 'Instagram',      ch3: 'Google Search',  tip: 'Pico: Março · Outubro' },
  { label: 'Academia',       name: 'Academia / Fitness',           cpl: 'R$18–45',  roas: '4.2×', cvr: '25%', bmin: 'R$1.500', ch1: 'Instagram Ads', ch2: 'Meta Ads',       ch3: 'TikTok',         tip: 'Pico: Janeiro · Junho' },
  { label: 'Psicologia',     name: 'Psicologia Online',            cpl: 'R$30–65',  roas: '4.5×', cvr: '20%', bmin: 'R$2.000', ch1: 'Google Search', ch2: 'Meta Ads',       ch3: 'Instagram',      tip: 'Evergreen' },
  { label: 'E-commerce',     name: 'E-commerce',                   cpl: 'R$8–25',   roas: '5.5×', cvr: '3%',  bmin: 'R$3.000', ch1: 'Meta Ads',     ch2: 'Google Shopping',ch3: 'TikTok',         tip: 'Pico: Nov · Dez' },
  { label: 'SaaS / Tech',    name: 'SaaS / Tech',                  cpl: 'R$50–120', roas: '8×',   cvr: '8%',  bmin: 'R$4.000', ch1: 'Google Search', ch2: 'LinkedIn',       ch3: 'Meta Ads',       tip: 'Evergreen' },
]

// ── COMPONENT ────────────────────────────────────────────────────────────────
export default function LandingPage() {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [activeVar] = useState<'A' | 'B'>('B')
  const [nicheIdx, setNicheIdx] = useState(0)
  const [activeBench, setActiveBench] = useState(BENCHMARKS[0])
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const termBodyRef = useRef<HTMLDivElement>(null)
  const termDoneRef = useRef(false)
  const animFrameRef = useRef<number>()
  const heroNiche = HERO_NICHES[nicheIdx]

  // Particles
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const c = canvas
    const ctx = c.getContext('2d')!
    function resize() { c.width = window.innerWidth; c.height = window.innerHeight }
    window.addEventListener('resize', resize); resize()
    type P = { x:number;y:number;vx:number;vy:number;size:number;alpha:number;color:string }
    const pts: P[] = Array.from({ length: 60 }, () => ({
      x: Math.random() * c.width, y: Math.random() * c.height,
      vx: (Math.random()-.5)*.4, vy: (Math.random()-.5)*.4,
      size: Math.random()*1.5+.3, alpha: Math.random()*.4+.05,
      color: Math.random()>.7?'245,165,0':Math.random()>.5?'167,139,250':'255,255,255',
    }))
    function draw() {
      ctx.clearRect(0,0,c.width,c.height)
      pts.forEach(p => {
        ctx.beginPath(); ctx.arc(p.x,p.y,p.size,0,Math.PI*2)
        ctx.fillStyle=`rgba(${p.color},${p.alpha})`; ctx.fill()
        p.x+=p.vx; p.y+=p.vy
        if(p.x<0||p.x>c.width) p.vx*=-1
        if(p.y<0||p.y>c.height) p.vy*=-1
      })
      pts.forEach((a,i)=>pts.slice(i+1).forEach(b=>{
        const d=Math.sqrt((a.x-b.x)**2+(a.y-b.y)**2)
        if(d<120){ctx.beginPath();ctx.strokeStyle=`rgba(245,165,0,${.06*(1-d/120)})`;ctx.lineWidth=.5;ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke()}
      }))
      animFrameRef.current=requestAnimationFrame(draw)
    }
    draw()
    return () => { window.removeEventListener('resize',resize); if(animFrameRef.current) cancelAnimationFrame(animFrameRef.current) }
  }, [])

  // Terminal
  useEffect(() => {
    if (activeVar !== 'A' || termDoneRef.current) return
    const el = termBodyRef.current; if (!el) return
    termDoneRef.current = true
    const cursor = document.createElement('span'); cursor.className='t-cursor'; el.appendChild(cursor)
    TERMINAL_LINES.forEach(({ delay, html }) => {
      setTimeout(() => {
        if (!html) return
        const line = document.createElement('div'); line.innerHTML = html
        line.style.cssText = 'font-family:var(--f-mono);font-size:12.5px;line-height:1.7;'
        el.insertBefore(line, cursor); el.scrollTop = el.scrollHeight
      }, delay)
    })
  }, [activeVar])

  // Auto-cycle hero niches
  useEffect(() => {
    const t = setInterval(() => {
      setNicheIdx(i => (i + 1) % HERO_NICHES.length)
    }, 3000)
    return () => clearInterval(t)
  }, [])

  // Scroll fade — também ativa elementos já visíveis no viewport
  useEffect(() => {
    const obs = new IntersectionObserver(entries => {
      entries.forEach(e => { if(e.isIntersecting){e.target.classList.add('lp-visible');obs.unobserve(e.target)} })
    }, { threshold: 0.08, rootMargin: '0px 0px -20px 0px' })
    document.querySelectorAll('.lp-fade').forEach(el => {
      const rect = (el as HTMLElement).getBoundingClientRect()
      if (rect.top < window.innerHeight) {
        el.classList.add('lp-visible')
      } else {
        obs.observe(el)
      }
    })
    return () => obs.disconnect()
  }, [activeVar])

  // Counters
  useEffect(() => {
    const obs = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (!e.isIntersecting) return
        const el = e.target as HTMLElement
        const target = parseFloat(el.dataset.target||'0'), dec = parseInt(el.dataset.dec||'0')
        const dur = 1800, t0 = performance.now()
        function step(now:number){const p=Math.min((now-t0)/dur,1),ease=1-Math.pow(1-p,4),v=target*ease;el.textContent=dec>0?v.toFixed(dec):Math.round(v).toString();if(p<1)requestAnimationFrame(step)}
        requestAnimationFrame(step); obs.unobserve(e.target)
      })
    }, { threshold: 0.5 })
    document.querySelectorAll('.lp-counter').forEach(el => obs.observe(el))
    return () => obs.disconnect()
  }, [activeVar])

  const BAD = ['Consultor caro que fala muito e entrega pouco','Budget queimado em canal errado para o seu nicho','Sem visão do funil — TOFU, MOFU e BOFU no achismo','Decisão baseada em feeling — sem benchmark real','Campanhas passadas esquecidas, erros repetidos','ROAS break-even calculado no achismo ou ignorado']
  const GOOD = ['Pipeline 360°: 5 agentes IA analisam tudo em paralelo','Canal certo + budget certo, com dados reais do mercado','Diagnóstico TOFU/MOFU/BOFU em 11 dimensões','ROAS break-even real calculado com seu ticket e margem','Histórico de campanhas + benchmark do nicho na mesma tela','NOUS responde com contexto completo do cliente']

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: LP_CSS }} />
      <canvas ref={canvasRef} style={{ position:'fixed',inset:0,zIndex:0,pointerEvents:'none',opacity:.5 }} />

      {/* NAV */}
      <nav className="lp-nav">
        <Link href="/landing" className="lp-logo">ELYON</Link>
        <div className="lp-nav-links">
          <a href="#como-funciona">Como funciona</a>
          <a href="#features">Recursos</a>
          <a href="#nichos">Nichos</a>
          <a href="#precos">Preços</a>
        </div>
        <div className="lp-nav-actions">
          <Link href="/sign-in" className="lp-ghost-link">Entrar</Link>
          <Link href="/sign-up" className="lp-nav-cta">Iniciar Pipeline grátis →</Link>
        </div>
      </nav>

      {/* ─── VARIATION A (hidden) ───────────────────────────────────────────── */}
      {activeVar === 'A' && (
        <div className="lp-wrap">
          {/* Hero A */}
          <section className="hero-a">
            <div className="lp-container">
              <div className="hero-a-inner">
                <div className="lp-fade">
                  <div className="tag-badge"><span className="tag-dot" />&nbsp;ELYON AGENT · HEAD DE GROWTH COM IA 24H</div>
                  <h1 className="hero-a-h">O ELYON sabe o CPL real<em>do seu nicho específico.</em></h1>
                  <p className="hero-a-sub">Não de forma genérica. Treinado em <strong>80+ nichos</strong> do mercado brasileiro — conecta suas contas, lê o histórico e entrega os dados reais do seu mercado em <strong>2 minutos</strong>.</p>
                  <div className="terminal">
                    <div className="terminal-bar">
                      <span className="t-dot" style={{background:'#FF5F56'}} />
                      <span className="t-dot" style={{background:'#FFBD2E'}} />
                      <span className="t-dot" style={{background:'#27C93F'}} />
                    </div>
                    <div className="terminal-body" ref={termBodyRef} />
                  </div>
                  <div className="hero-a-ctas">
                    <Link href="/sign-up" className="btn-p">Ver dados do meu nicho →</Link>
                    <Link href="/sign-in" style={{fontSize:14,color:'var(--sub)',textDecoration:'none'}}>Já tenho conta</Link>
                  </div>
                  <div className="trust-row">
                    <div className="trust-item"><span className="trust-check">✓</span>Análise gratuita</div>
                    <div className="trust-item"><span className="trust-check">✓</span>Em 2 minutos</div>
                    <div className="trust-item"><span className="trust-check">✓</span>Sem cartão</div>
                  </div>
                </div>
                {/* Dashboard mockup */}
                <div className="dash-mockup lp-fade lp-d1">
                  <div className="dash-top">
                    <span className="dash-logo-sm">ELYON</span>
                    <span style={{fontFamily:'var(--f-mono)',fontSize:11,color:'var(--muted)'}}>Dashboard</span>
                    <span className="live-pill"><span className="live-dot" />AO VIVO</span>
                  </div>
                  <div className="dash-body">
                    <div className="dash-niche-row">
                      <span className="pill-sm active">Odontologia Estética</span>
                      <span className="pill-sm">✓ Meta Ads</span>
                    </div>
                    <div className="dm-grid">
                      <div className="dm"><div className="dm-label">Receita Est.</div><div className="dm-val" style={{color:'var(--gold)'}}>R$538k</div><div className="dm-sub" style={{color:'var(--green)'}}>↑ 34% vs anterior</div></div>
                      <div className="dm"><div className="dm-label">Leads / Mês</div><div className="dm-val" style={{color:'var(--green)'}}>62–95</div><div className="dm-sub">c/1 médico</div></div>
                    </div>
                    <div className="dm-grid">
                      <div className="dm"><div className="dm-label">ROAS Real</div><div className="dm-val" style={{color:'var(--purple)'}}>3.9×</div><div className="dm-sub">Meta: 3.5×</div></div>
                      <div className="dm"><div className="dm-label">CPL Real</div><div className="dm-val" style={{color:'var(--text)'}}>R$70</div><div className="dm-sub">Bench: R$45–90</div></div>
                    </div>
                    <div className="ai-mini">
                      <div className="ai-mini-label">🧠 IA CONTEXTUAL</div>
                      <div className="ai-mini-text">Seu CPL de <strong>R$70</strong> está dentro do benchmark. Recomendo <strong>escalar Meta Ads em 20%</strong> e testar Google Search.</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Stats A */}
          <section className="stats-a">
            <div className="lp-container">
              <div className="stats-a-inner">
                {[{v:'80',suf:'+',label:'Nichos com dados reais de CPL e ROAS'},{v:'4',suf:'×',dec:'1',label:'ROAS médio calculado por cliente'},{v:'90',suf:'d',label:'Plano de ação pronto para executar'},{v:'2',suf:'min',label:'Para diagnóstico estratégico completo'}].map((s,i)=>(
                  <div key={i} className={`stat-a lp-fade lp-d${i}`}>
                    <div className="stat-a-val"><span className="lp-counter" data-target={s.v} data-dec={s.dec||'0'}>0</span>{s.suf}</div>
                    <div className="stat-a-label">{s.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* How A */}
          <section className="how-a" id="como-funciona">
            <div className="lp-container">
              <div className="section-eyebrow">Como funciona</div>
              <h2 className="section-h lp-fade">Seu Head de Growth IA.<br /><em>Em 3 passos.</em></h2>
              <div className="steps-grid">
                {[{n:'01',title:'Conecte Meta Ads e Google',p:'Conecte suas contas de anúncio em segundos. O ELYON lê o histórico e identifica padrões do seu nicho específico.'},{n:'02',title:'TOFU, MOFU e BOFU mapeados',p:'A IA identifica onde está o gargalo do seu funil com dados reais — sem achismo, sem benchmark genérico.'},{n:'03',title:'Plano de ação pronto',p:'Receba um plano executável com canais, budget e next steps específicos para o seu nicho. Em 2 minutos.'}].map((s,i)=>(
                  <div key={i} className={`step lp-fade lp-d${i}`}>
                    <div className="step-n">{s.n} — Passo {i+1}</div>
                    <div className="step-h">{s.title}</div>
                    <p className="step-p">{s.p}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Comparison A */}
          <section className="comp-a">
            <div className="lp-container">
              <div style={{textAlign:'center',marginBottom:48}}>
                <div className="section-eyebrow section-eyebrow-c lp-fade">A diferença</div>
                <h2 className="section-h lp-fade" style={{textAlign:'center',margin:'0 auto',maxWidth:500}}>Dados reais<br /><em>vs. achismo caro</em></h2>
              </div>
              <div className="comp-grid">
                <div className="comp-side bad lp-fade">
                  <div className="comp-side-h">✗ Sem o ELYON</div>
                  <div className="comp-items">
                    {BAD.map((t,i)=><div key={i} className="comp-item"><span className="comp-icon">✗</span>{t}</div>)}
                  </div>
                </div>
                <div className="comp-side good lp-fade lp-d1">
                  <div className="comp-side-h">✓ Com o ELYON</div>
                  <div className="comp-items">
                    {GOOD.map((t,i)=><div key={i} className="comp-item"><span className="comp-icon">✓</span>{t}</div>)}
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* CTA A */}
          <section className="cta-final">
            <div className="lp-container">
              <div className="section-eyebrow section-eyebrow-c lp-fade">Comece agora</div>
              <h2 className="cta-final-h lp-fade">Veja os dados reais<br /><em>do seu nicho.</em></h2>
              <p className="cta-final-sub lp-fade">Em 2 minutos. Gratuito. Sem cartão.</p>
              <div className="cta-row lp-fade">
                <Link href="/sign-up" className="btn-p lg">Quero minha análise grátis →</Link>
              </div>
              <div className="trust-row lp-fade" style={{justifyContent:'center',marginTop:16}}>
                <div className="trust-item"><span className="trust-check">✓</span>Análise gratuita para começar</div>
                <div className="trust-item"><span className="trust-check">✓</span>Resultado em 2 minutos</div>
                <div className="trust-item"><span className="trust-check">✓</span>Sem cartão de crédito</div>
              </div>
            </div>
          </section>
        </div>
      )}

      {/* ─── VARIATION B ────────────────────────────────────────────────────── */}
      {activeVar === 'B' && (
        <div className="lp-wrap">
          {/* Hero B */}
          <section className="hero-b">
            <div style={{maxWidth:'100%',padding:'0 64px',margin:'0 auto'}}>
              <div className="hero-b-top">
                <div className="hero-b-left lp-fade">
                  <div className="tag-badge"><span className="tag-dot" />&nbsp;ELYON · IA ESPECIALIZADA POR NICHO</div>
                  <div className="hero-b-metric-label">ROAS MÉDIO CALCULADO</div>
                  <div className="hero-b-number roas-anim" key={`roas-${nicheIdx}`}>{heroNiche.roas.toFixed(1)}×</div>
                  <div className="hero-b-niche-label">nicho ativo:</div>
                  <div className="niche-slot niche-slot-anim" key={`niche-${nicheIdx}`}>{heroNiche.niche}</div>
                  <div className="niches-cloud">
                    {HERO_NICHES.map((n,i) => (
                      <span key={i} className={`niche-tag${nicheIdx===i?' active':''}`}
                        onClick={() => setNicheIdx(i)}>{n.label}</span>
                    ))}
                  </div>
                </div>
                <div className="hero-b-right lp-fade lp-d1">
                  <h1 className="hero-b-h">5 agentes IA analisam<br /><em>o seu negócio.</em><br />Em 3 minutos.</h1>
                  <p className="hero-b-sub">O ELYON roda um Pipeline 360° com Auditor, Analista, Estrategista, Copywriter e Report — tudo com dados reais do seu nicho, budget e campanhas. Sem achismo.</p>
                  <div style={{display:'flex',gap:14,alignItems:'center',flexWrap:'wrap',marginBottom:24}}>
                    <Link href="/sign-up" className="btn-p">Iniciar análise grátis →</Link>
                    <Link href="/sign-in" className="btn-s">Já tenho conta</Link>
                  </div>
                  <div className="trust-row">
                    <div className="trust-item"><span className="trust-check">✓</span>Grátis para começar</div>
                    <div className="trust-item"><span className="trust-check">✓</span>3 minutos</div>
                    <div className="trust-item"><span className="trust-check">✓</span>Sem cartão</div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Social proof bar */}
          <div className="social-bar">
            <div className="lp-container">
              <div className="social-bar-inner">
                <div className="social-item"><span className="social-item-dot" />Meta Ads ao vivo</div>
                <div className="social-sep" />
                <div className="social-item"><span className="social-item-dot" />Google Ads ao vivo</div>
                <div className="social-sep" />
                <div className="social-item">🤖 Pipeline 360° — 5 agentes IA</div>
                <div className="social-sep" />
                <div className="social-item">🧠 NOUS com contexto completo</div>
                <div className="social-sep" />
                <div className="social-item">📊 80+ nichos com benchmarks reais</div>
                <div className="social-sep" />
                <div className="social-item">💰 ROAS break-even calculado</div>
              </div>
            </div>
          </div>

          {/* Stats B */}
          <section className="stats-b">
            <div className="lp-container">
              <div className="stats-b-inner">
                {[{v:'80',suf:'+',label:'Nichos com benchmarks reais de CPL e ROAS',sub:'↑ 12 novos este mês'},{v:'5',suf:'',label:'Agentes IA no Pipeline 360° trabalhando juntos',sub:'Auditor · Analista · Estrategista · Copy · Report'},{v:'11',suf:'',label:'Dimensões de análise na Auditoria Profunda',sub:'Estrutura · Criativos · Financeiro · Escala…'},{v:'3',suf:'min',label:'Para análise 360° completa com IA',sub:'Sem reunião, sem achismo, sem espera'}].map((s,i)=>(
                  <div key={i} className={`stat-b lp-fade lp-d${i}`}>
                    <div className="stat-b-val"><span className="lp-counter" data-target={s.v} data-dec={'0'}>0</span>{s.suf}</div>
                    <div className="stat-b-label">{s.label}</div>
                    <div className="stat-b-sub">{s.sub}</div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* How B */}
          <section className="how-b" id="como-funciona">
            <div className="lp-container">
              <div className="section-eyebrow">Como funciona</div>
              <h2 className="section-h lp-fade">Inteligência de mercado.<br /><em>Sem complexidade.</em></h2>
              <div className="timeline">
                {[
                  {n:'01',h:'Configure nicho, budget e financeiro',p:'80+ nichos mapeados. Informe ticket médio, margem bruta e taxa de fechamento — o ELYON calcula seu ROAS break-even real e CPL máximo lucrativo automaticamente.',tag:'Em 2 minutos'},
                  {n:'02',h:'Pipeline 360°: 5 agentes IA em paralelo',p:'Auditor analisa estrutura e desperdiços. Analista cruza dados. Estrategista define o plano. Copywriter cria os ângulos. Report entrega o diagnóstico completo — tudo de uma vez.',tag:'3–5 minutos de análise'},
                  {n:'03',h:'Dashboard com inteligência contínua',p:'9 abas de diagnóstico: Visão Geral ao vivo, Estratégia, Auditoria Profunda (11 dimensões), Anúncios IA, Performance, Cenários, Ações e NOUS — sua analista estratégica contextual 24h.',tag:'Resultado imediato'},
                ].map((t,i)=>(
                  <div key={i} className={`tl-item lp-fade lp-d${i}`}>
                    <div className="tl-num">{t.n}</div>
                    <div>
                      <div className="tl-h">{t.h}</div>
                      <p className="tl-p">{t.p}</p>
                      <span className="tl-tag">{t.tag}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Comparison B */}
          <section className="comp-b">
            <div className="lp-container">
              <div className="section-eyebrow lp-fade">A diferença</div>
              <h2 className="section-h lp-fade">Dados reais<br /><em>vs. achismo caro.</em></h2>
              <div className="comp-b-inner lp-fade">
                <div className="comp-b-side bad">
                  <div className="comp-b-head">✗ Sem o ELYON</div>
                  <div className="comp-b-items">{BAD.map((t,i)=><div key={i} className="comp-b-item"><span className="comp-b-icon">✗</span>{t}</div>)}</div>
                </div>
                <div className="comp-b-side good">
                  <div className="comp-b-head">✓ Com o ELYON</div>
                  <div className="comp-b-items">{GOOD.map((t,i)=><div key={i} className="comp-b-item"><span className="comp-b-icon">✓</span>{t}</div>)}</div>
                </div>
              </div>
            </div>
          </section>

          {/* Features B */}
          <section style={{padding:'80px 0',position:'relative',zIndex:1}} id="features">
            <div className="lp-container">
              <div className="section-eyebrow lp-fade">9 abas. Uma plataforma.</div>
              <h2 className="section-h lp-fade">Inteligência completa.<br /><em>Sem complexidade.</em></h2>
              <p style={{fontSize:16,color:'var(--sub)',lineHeight:1.75,maxWidth:520,marginBottom:0}} className="lp-fade">Cada recurso foi construído para eliminar achismo e colocar dados reais na sua tomada de decisão.</p>
              <div className="b-feat-grid">

                {/* Pipeline 360° — destaque */}
                <div className="b-feat lp-fade" style={{gridColumn:'span 2',background:'linear-gradient(135deg,rgba(240,180,41,.05),rgba(167,139,250,.04))',borderColor:'rgba(240,180,41,.25)'}}>
                  <div style={{display:'flex',alignItems:'flex-start',gap:20}}>
                    <div>
                      <div className="b-feat-iw">🤖</div>
                    </div>
                    <div style={{flex:1}}>
                      <div className="b-feat-lbl">PIPELINE 360°</div>
                      <div className="b-feat-h">5 agentes IA trabalhando em paralelo</div>
                      <p className="b-feat-p">Cada agente é um especialista: <strong style={{color:'var(--text)'}}>Auditor</strong> detecta desperdícios e gaps de estrutura. <strong style={{color:'var(--text)'}}>Analista</strong> cruza CPL, ROAS e benchmarks. <strong style={{color:'var(--text)'}}>Estrategista</strong> define prioridades de escala. <strong style={{color:'var(--text)'}}>Copywriter</strong> cria ângulos e hooks. <strong style={{color:'var(--text)'}}>Report</strong> entrega o diagnóstico executivo. Tudo em 3–5 minutos.</p>
                      <div style={{display:'flex',gap:8,flexWrap:'wrap',marginTop:12}}>
                        {['🔍 Auditor','📊 Analista','⚡ Estrategista','✍️ Copywriter','📋 Report'].map((a,i)=>(
                          <span key={i} style={{padding:'4px 12px',borderRadius:999,fontFamily:'var(--f-mono)',fontSize:10,fontWeight:600,background:'rgba(167,139,250,.08)',border:'1px solid rgba(167,139,250,.2)',color:'var(--purple)'}}>{a}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="b-feat lp-fade">
                  <div className="b-feat-iw">🔍</div>
                  <div className="b-feat-lbl">ANÁLISE PROFUNDA</div>
                  <div className="b-feat-h">Auditoria em 11 dimensões</div>
                  <p className="b-feat-p">Estrutura de campanhas, tracking, criativos, audiências, escala, financeiro, riscos, oportunidades e plano de ação — em uma análise completa com upload de CSV ou via Pipeline IA.</p>
                  <div className="funnel-b" style={{gap:4}}>
                    {['Estrutura','Criativos','Financeiro','Escala','Riscos'].map((d,i)=>(
                      <div key={i} className={`funnel-b-p${i===2?' mid':''}`} style={{padding:'5px 4px'}}>
                        <div className="fb-lbl" style={{fontSize:7.5}}>{d}</div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="b-feat lp-fade lp-d1">
                  <div className="b-feat-iw">🧠</div>
                  <div className="b-feat-lbl">NOUS</div>
                  <div className="b-feat-h">IA com contexto completo</div>
                  <p className="b-feat-p">Conhece ticket médio, margem, ROAS break-even, histórico de campanhas, benchmark do nicho e último audit. Não dá respostas genéricas — responde com os dados reais do seu cliente.</p>
                  <div className="b-feat-demo">
                    <div style={{fontFamily:'var(--f-mono)',fontSize:9,fontWeight:700,color:'var(--gold)',marginBottom:5}}>🧠 NOUS · Clínica Estética · Ticket R$1.200 · Margem 45%</div>
                    "Seu CPL máximo lucrativo é <strong>R$54</strong>. Atual de <strong>R$38</strong> está ótimo — recomendo escalar Meta em 25%."
                  </div>
                </div>

                <div className="b-feat lp-fade lp-d1">
                  <div className="b-feat-iw">💰</div>
                  <div className="b-feat-lbl">FINANCEIRO</div>
                  <div className="b-feat-h">ROAS break-even real</div>
                  <p className="b-feat-p">Informe ticket médio, margem bruta e taxa de fechamento. O ELYON calcula o ROAS break-even exato, CPL máximo lucrativo e LTV estimado — sem planilha, em tempo real.</p>
                  <div className="camp-b">
                    <div className="camp-b-i"><span className="camp-b-n">ROAS break-even</span><span className="camp-b-r" style={{color:'var(--gold)'}}>2.22× calculado</span></div>
                    <div className="camp-b-i"><span className="camp-b-n">CPL máximo lucrativo</span><span className="camp-b-r" style={{color:'var(--green)'}}>R$54 / lead</span></div>
                    <div className="camp-b-i"><span className="camp-b-n">LTV estimado</span><span className="camp-b-r" style={{color:'var(--purple)'}}>R$24k recorrente</span></div>
                  </div>
                </div>

                <div className="b-feat lp-fade lp-d2">
                  <div className="b-feat-iw">📡</div>
                  <div className="b-feat-lbl">ANÚNCIOS AO VIVO</div>
                  <div className="b-feat-h">Meta Ads + Google Ads reais</div>
                  <p className="b-feat-p">Conecte via OAuth. Veja CPL, ROAS, leads e investimento real de cada campanha com análise de IA — tudo em uma aba com sub-tabs para Meta, Google e Conexões.</p>
                  <div className="b-feat-badges">
                    <div className="b-fbadge"><span style={{width:8,height:8,borderRadius:'50%',background:'#1877F2',flexShrink:0,display:'inline-block'}} />Meta Ads <span style={{color:'var(--green)',fontSize:11,marginLeft:4}}>conectado</span></div>
                    <div className="b-fbadge"><span style={{width:8,height:8,borderRadius:'50%',background:'#4285F4',flexShrink:0,display:'inline-block'}} />Google Ads <span style={{color:'var(--green)',fontSize:11,marginLeft:4}}>conectado</span></div>
                  </div>
                </div>

                <div className="b-feat lp-fade lp-d2">
                  <div className="b-feat-iw">📈</div>
                  <div className="b-feat-lbl">PERFORMANCE + CENÁRIOS</div>
                  <div className="b-feat-h">Trends reais + simulador what-if</div>
                  <p className="b-feat-p">Gráficos de tendência de CPL, Leads, Revenue e ROAS ao longo do tempo. Mais simulador de cenários (conservador / recomendado / agressivo) com pacing de budget em tempo real.</p>
                  <div className="camp-b">
                    <div className="camp-b-i"><span className="camp-b-n">Meta Ads · Mar 2025</span><span className="camp-b-r" style={{color:'var(--green)'}}>CPL R$68 · Vencedora ↑</span></div>
                    <div className="camp-b-i"><span className="camp-b-n">Google Search · Jan 2025</span><span className="camp-b-r" style={{color:'var(--red)'}}>CPL R$142 · Perdedora ↓</span></div>
                  </div>
                </div>

              </div>
            </div>
          </section>

          {/* Benchmarks B */}
          <section className="b-bench" id="nichos">
            <div className="lp-container">
              <div className="section-eyebrow lp-fade">Benchmarks reais de mercado</div>
              <h2 className="section-h lp-fade">Analista especializado<br /><em>no seu segmento.</em></h2>
              <p style={{fontSize:16,color:'var(--sub)',lineHeight:1.75,maxWidth:520}} className="lp-fade">CPL, ROAS, CVR e canais ideais — dados reais do mercado brasileiro 2024–2025.</p>
              <div className="b-niche-sel lp-fade">
                {BENCHMARKS.map((b,i) => (
                  <span key={i} className={`b-ntag${activeBench.label===b.label?' active':''}`} onClick={()=>setActiveBench(b)}>{b.label}</span>
                ))}
                <span style={{padding:'5px 13px',borderRadius:999,fontFamily:'var(--f-mono)',fontSize:11,fontWeight:600,background:'var(--card)',border:'1px solid var(--border)',color:'var(--muted)'}}>+70 nichos →</span>
              </div>
              <div className="b-ndata lp-fade">
                <div>
                  <div className="b-nd-t">{activeBench.name}</div>
                  <div className="b-nd-metrics">
                    <div className="b-nd-m"><div className="b-nd-ml">CPL Benchmark</div><div className="b-nd-mv" style={{color:'var(--gold)'}}>{activeBench.cpl}</div><div className="b-nd-ms">Faixa do nicho</div></div>
                    <div className="b-nd-m"><div className="b-nd-ml">ROAS bom</div><div className="b-nd-mv" style={{color:'var(--green)'}}>{activeBench.roas}</div><div className="b-nd-ms">Acima da média</div></div>
                    <div className="b-nd-m"><div className="b-nd-ml">CVR lead→venda</div><div className="b-nd-mv" style={{color:'var(--purple)'}}>{activeBench.cvr}</div><div className="b-nd-ms">Benchmark nicho</div></div>
                    <div className="b-nd-m"><div className="b-nd-ml">Budget mínimo</div><div className="b-nd-mv" style={{color:'var(--text)'}}>{activeBench.bmin}</div><div className="b-nd-ms">Para ter dados</div></div>
                  </div>
                </div>
                <div>
                  <div className="b-nd-ch-lbl">Canais recomendados</div>
                  <div className="b-nd-chs">
                    <div className="b-nd-ch"><span className="b-nd-cn">{activeBench.ch1}</span><span className="b-nd-cv">Principal</span></div>
                    <div className="b-nd-ch"><span className="b-nd-cn">{activeBench.ch2}</span><span className="b-nd-cv">Secundário</span></div>
                    <div className="b-nd-ch"><span className="b-nd-cn">{activeBench.ch3}</span><span className="b-nd-cv">Suporte</span></div>
                  </div>
                  <div className="b-nd-ins">💡 <strong>{activeBench.tip}.</strong> Use essa janela para maximizar budget no pico do nicho.</div>
                </div>
              </div>
            </div>
          </section>

          {/* Pricing B */}
          <section className="b-price" id="precos">
            <div className="lp-container">
              <div style={{textAlign:'center'}}>
                <div className="section-eyebrow section-eyebrow-c lp-fade">Planos</div>
                <h2 className="section-h lp-fade" style={{margin:'0 auto'}}>Você não contrata marketing.<br /><em>Você tem um sistema.</em></h2>
                <p style={{fontSize:16,color:'var(--sub)',margin:'0 auto',maxWidth:480}} className="lp-fade">Que mostra exatamente o que fazer para crescer.</p>
              </div>
              <div className="b-pgrid">
                {[
                  {lbl:'🔄 Para começar',name:'Individual',desc:'Para donos de negócio e profissionais que querem direção contínua baseada em dados reais.',price:'197',plan:'individual',pop:false,feats:['Estratégia por IA com benchmarks do nicho','NOUS com contexto completo do cliente','ROAS break-even + CPL máximo calculados','Histórico de campanhas + trends','Cenários de budget (conservador/recomendado/agressivo)']},
                  {lbl:'🚀 Mais popular',name:'Profissional',desc:'Para gestores de tráfego e consultores com múltiplos clientes e capacidade estratégica elevada.',price:'497',plan:'profissional',pop:true,feats:['Tudo do Individual','Pipeline 360° — 5 agentes IA','Análise Profunda (11 dimensões)','Anúncios ao vivo: Meta Ads + Google Ads','Plano de Ações priorizado por IA']},
                  {lbl:'💣 Agências e empresas',name:'Avançada',desc:'Para agências e empresas que querem escalar atendimento com inteligência estratégica de alto nível.',price:'1.497',plan:'avancada',pop:false,feats:['Tudo do Profissional','Clientes ilimitados','Inteligência de mercado senior por nicho','Auditoria completa com upload CSV/XLSX','Geração contínua sem limite de estratégias']},
                ].map((p,i)=>(
                  <div key={i} className={`b-pcard lp-fade lp-d${i}${p.pop?' pop':''}`}>
                    {p.pop && <div className="b-pop-badge">★ Mais popular</div>}
                    <div className="b-pc-lbl">{p.lbl}</div>
                    <div className="b-pc-name">{p.name}</div>
                    <div className="b-pc-desc">{p.desc}</div>
                    <div className="b-pc-price"><span className="b-pc-cur">R$</span><span className="b-pc-val">{p.price}</span><span className="b-pc-per">/mês</span></div>
                    <button className={`b-pc-btn${p.pop?' prim':' ghost'}`} onClick={()=>window.location.href=`/checkout?plan=${p.plan}`}>Começar agora →</button>
                    <ul className="b-pc-feats">{p.feats.map((f,j)=><li key={j} className="b-pc-feat">{f}</li>)}</ul>
                  </div>
                ))}
              </div>

              {/* Serviços pontuais */}
              <div className="lp-fade" style={{marginTop:32,display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
                {[
                  {
                    ico:'📋', tag:'SERVIÇO PONTUAL',
                    name:'Relatório Completo',
                    desc:'Análise completa do negócio: benchmark do nicho, diagnóstico de funil, histórico de campanhas e plano de ação documentado — entregue em 48h.',
                    price:'3.000',
                    per:'por relatório',
                    feats:['Diagnóstico TOFU · MOFU · BOFU','Benchmark detalhado do nicho','Análise de campanhas anteriores','Plano de ação com prioridades','PDF executivo para apresentação'],
                  },
                  {
                    ico:'🚀', tag:'SERVIÇO PONTUAL',
                    name:'Implantação',
                    desc:'Configuração completa do ELYON para o seu negócio: setup de contas, integração Meta + Google Ads, treinamento da equipe e estratégia inicial definida.',
                    price:'5.000',
                    per:'por implantação',
                    feats:['Setup completo da plataforma','Conexão Meta Ads + Google Ads','Configuração de benchmarks do nicho','Treinamento da equipe (até 3 pessoas)','Estratégia inicial com NOUS IA'],
                  },
                ].map((s,i)=>(
                  <div key={i} className="b-pcard" style={{display:'flex',flexDirection:'column',gap:0}}>
                    <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:8}}>
                      <span style={{fontSize:20}}>{s.ico}</span>
                      <span style={{fontFamily:'var(--f-mono)',fontSize:9,fontWeight:700,letterSpacing:'.1em',textTransform:'uppercase',color:'var(--muted)'}}>{s.tag}</span>
                    </div>
                    <div className="b-pc-name">{s.name}</div>
                    <div className="b-pc-desc" style={{marginBottom:14}}>{s.desc}</div>
                    <div className="b-pc-price" style={{marginBottom:18}}>
                      <span className="b-pc-cur">R$</span>
                      <span className="b-pc-val">{s.price}</span>
                      <span className="b-pc-per" style={{marginLeft:6}}>a partir · {s.per}</span>
                    </div>
                    <button className="b-pc-btn ghost" onClick={()=>window.location.href='/sign-up'}>Solicitar orçamento →</button>
                    <ul className="b-pc-feats">{s.feats.map((f,j)=><li key={j} className="b-pc-feat">{f}</li>)}</ul>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Audience B */}
          <section className="b-aud">
            <div className="lp-container">
              <div style={{textAlign:'center'}}>
                <div className="section-eyebrow section-eyebrow-c lp-fade">Para quem é</div>
                <h2 className="section-h lp-fade" style={{margin:'0 auto'}}>Para quem é <em>o ELYON?</em></h2>
              </div>
              <div className="b-aud-grid">
                {[
                  {ico:'🏢',who:'Agências de marketing',h:'Escale sem contratar analistas',p:'Pipeline 360° roda análise completa de cada cliente em minutos. Entregue diagnósticos com 11 dimensões, plano de ação e estratégia — sem horas de planilha.',plan:'→ Plano Avançada'},
                  {ico:'👤',who:'Gestores de tráfego',h:'Prove valor com dados reais',p:'ROAS break-even calculado, CPL máximo por cliente, NOUS com contexto completo. Saiba exatamente o que falar pro cliente e o que escalar primeiro.',plan:'→ Plano Profissional'},
                  {ico:'🏬',who:'Donos de negócio',h:'Pare de perder dinheiro no escuro',p:'Veja se seu CPL está acima ou abaixo do benchmark do seu nicho. Pipeline 360° identifica em 3 minutos onde cada real está sendo desperdiçado.',plan:'→ Plano Individual'},
                ].map((a,i)=>(
                  <div key={i} className={`b-aud-card lp-fade lp-d${i}`}>
                    <span className="b-aud-ico">{a.ico}</span>
                    <div className="b-aud-who">{a.who}</div>
                    <div className="b-aud-h">{a.h}</div>
                    <p className="b-aud-p">{a.p}</p>
                    <div className="b-aud-plan">{a.plan}</div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* CTA B */}
          <section className="cta-b">
            <div className="lp-container">
              <h2 className="cta-b-h lp-fade"><span>5 agentes analisam</span><br /><em>seu negócio</em><br /><span>agora mesmo.</span></h2>
              <p className="cta-b-sub lp-fade">Configure em 2 minutos. O Pipeline 360° entrega diagnóstico completo — ROAS break-even, CPL máximo, estratégia e plano de ação — sem reunião, sem achismo.</p>
              <div style={{position:'relative',zIndex:1,display:'flex',gap:14,justifyContent:'center',alignItems:'center',marginBottom:28}} className="lp-fade">
                <Link href="/sign-up" className="btn-p lg">Iniciar Pipeline 360° grátis →</Link>
              </div>
              <div className="trust-row lp-fade" style={{justifyContent:'center',marginTop:16}}>
                <div className="trust-item"><span className="trust-check">✓</span>Sem cartão de crédito</div>
                <div className="trust-item"><span className="trust-check">✓</span>Diagnóstico em 3 minutos</div>
                <div className="trust-item"><span className="trust-check">✓</span>80+ nichos cobertos</div>
              </div>
            </div>
          </section>
        </div>
      )}

      {/* FOOTER */}
      <footer className="lp-footer" style={{position:'relative',zIndex:1}}>
        <div className="lp-container">
          <div className="lp-footer-inner">
            <span style={{fontFamily:'var(--f-display)',fontWeight:800,fontSize:18,color:'var(--gold)'}}>ELYON</span>
            <div className="lp-footer-links">
              <a href="#como-funciona">Como funciona</a>
              <a href="#features">Recursos</a>
              <a href="#nichos">Nichos</a>
              <a href="#precos">Preços</a>
              <Link href="/sign-in">Entrar</Link>
            </div>
            <span style={{fontSize:13,color:'var(--muted)'}}>© 2026 ELYON · Pipeline 360° com IA · Brasil</span>
          </div>
        </div>
      </footer>
    </>
  )
}
