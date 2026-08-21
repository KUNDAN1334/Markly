/* ────────────────────────────────────────────────────────────────────────────
   STYLES — Verdigris palette. Shared by the landing page and /blog so both
   surfaces stay on identical tokens. Tokens are redeclared at :root so the
   <body> background (set in globals.css) matches the landing surface exactly.
──────────────────────────────────────────────────────────────────────────── */
export const LANDING_CSS = `
:root, .lpv2-root {
  --bg:#faf9f7; --bg-2:#f3f1ec; --bg2:#f3f1ec;
  --card:#ffffff; --bg-card:#ffffff; --paper:#ffffff;
  --text:#16140f; --text-2:#5d5a52; --text2:#5d5a52; --text-3:#9c988c; --text3:#9c988c;
  --border:#e8e4da; --border-strong:#cfc9bb; --borderS:#cfc9bb;
  --accent:#16140f; --accent-fg:#faf9f7; --accentFg:#faf9f7;
  --gold:#3f8a75; --goldSoft:rgba(63,138,117,.16); --glow:rgba(63,138,117,.10);
  --red:#e74c3c; --green:#2ecc71; --yellow:#f1c40f;
  --navBg:rgba(250,249,247,.72);
  --shSm:0 1px 3px rgba(20,18,12,.06);
  --shMd:0 6px 24px rgba(20,18,12,.09);
  --shLg:0 24px 64px rgba(20,18,12,.13);
  --shXl:0 40px 100px rgba(20,18,12,.16);
  --shadow-sm:var(--shSm); --shadow-md:var(--shMd); --shadow-lg:var(--shLg);
  --doc-accent:var(--gold); --doc-accent-soft:var(--goldSoft);
  /* display face for the hero headline — clean, professional grotesque */
  --font-display:'Inter Tight','Instrument Sans',system-ui,sans-serif;
}

[data-theme="dark"], [data-theme="dark"] .lpv2-root {
  --bg:#000000; --bg-2:#0a0a0a; --bg2:#0a0a0a;
  --card:#0d0d0d; --bg-card:#0d0d0d; --paper:#141414;
  --text:#f5f5f5; --text-2:#a6a6a6; --text2:#a6a6a6; --text-3:#6a6a6a; --text3:#6a6a6a;
  --border:#1f1f1f; --border-strong:#333333; --borderS:#333333;
  --accent:#f5f5f5; --accent-fg:#000000; --accentFg:#000000;
  --gold:#7cc4ae; --goldSoft:rgba(124,196,174,.16);
  /* no ambient tint on black — the orbs/section glows read as a green wash */
  --glow:transparent;
  --red:#f06a5a; --green:#4fd48b; --yellow:#f4cd41;
  --navBg:rgba(0,0,0,.72);
  --shSm:0 1px 3px rgba(0,0,0,.3);
  --shMd:0 6px 24px rgba(0,0,0,.4);
  --shLg:0 24px 64px rgba(0,0,0,.5);
  --shXl:0 40px 100px rgba(0,0,0,.55);
}

.lpv2-root {
  position: relative;
  background: var(--bg);
  color: var(--text);
  overflow-x: clip;
  font-family: 'Instrument Sans', sans-serif;
  transition: background .4s ease, color .4s ease;
}

/* ── ambience ──────────────────────────────────────────────────────────── */
.lpv2-noise {
  position: fixed; inset: 0; pointer-events: none; z-index: 500; opacity: .035;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
}
.lpv2-orb { position: absolute; border-radius: 50%; pointer-events: none; z-index: 0; background: radial-gradient(circle, var(--glow), transparent 65%); }
.lpv2-orb-1 { top: -180px; left: -120px; width: 640px; height: 640px; animation: drift1 26s ease-in-out infinite; }
.lpv2-orb-2 { top: 340px; right: -200px; width: 720px; height: 720px; animation: drift2 32s ease-in-out infinite; }
.lpv2-progress { position: fixed; top: 0; left: 0; height: 2px; width: 0%; background: var(--gold); z-index: 400; }
/* dark mode = flat black surface: no radial glows, no drifting orbs */
[data-theme="dark"] .lpv2-orb,
[data-theme="dark"] .lp-how-stage-glow { display: none; }

/* ── layout ────────────────────────────────────────────────────────────── */
.lp-container { max-width: 1120px; margin: 0 auto; padding: 0 28px; }
.lp-section { position: relative; z-index: 1; padding: 100px 0; border-top: 1px solid var(--border); }

.lp-reveal {
  opacity: 0; transform: translateY(30px);
  transition: opacity .9s cubic-bezier(.22,1,.36,1), transform .9s cubic-bezier(.22,1,.36,1);
}

.lp-head { text-align: center; margin-bottom: 14px; }
.lp-eyebrow { font-size: 11px; font-weight: 600; letter-spacing: .12em; text-transform: uppercase; color: var(--gold); font-family: 'DM Mono', monospace; margin-bottom: 12px; }
.lp-h2 { font-family: 'DM Serif Display', serif; font-size: clamp(30px, 4vw, 48px); letter-spacing: -.03em; line-height: 1.04; color: var(--text); margin: 0 0 12px; font-weight: 400; }
.lp-lede { color: var(--text2); margin: 0 auto; font-size: 15px; line-height: 1.6; }
.lp-meta { font-size: 10px; font-weight: 600; letter-spacing: .08em; text-transform: uppercase; color: var(--text3); font-family: 'DM Mono', monospace; }
.lp-panel-label { font-size: 10px; font-weight: 600; letter-spacing: .08em; text-transform: uppercase; color: var(--text3); font-family: 'DM Mono', monospace; }

/* ── buttons ───────────────────────────────────────────────────────────── */
.lp-btn {
  display: inline-flex; align-items: center; gap: 8px; padding: 12px 22px;
  border-radius: 14px; font-size: 14px; font-weight: 500;
  font-family: 'Instrument Sans', sans-serif; cursor: pointer;
  transition: all .2s; text-decoration: none; border: 1px solid transparent;
}
.lp-btn-sm { padding: 8px 15px; border-radius: 11px; font-size: 13px; }
.lp-btn-lg { padding: 14px 28px; border-radius: 16px; font-size: 15px; }
.lp-btn-primary { background: var(--accent); color: var(--accentFg); border-color: var(--accent); box-shadow: var(--shSm); }
.lp-btn-primary:hover { transform: translateY(-2px); box-shadow: var(--shLg); }
.lp-btn-ghost { background: var(--card); color: var(--text); border-color: var(--borderS); }
.lp-btn-ghost:hover { background: var(--bg2); transform: translateY(-2px); }
.lp-icon-btn {
  display: inline-flex; align-items: center; justify-content: center;
  width: 36px; height: 36px; padding: 0; border-radius: 11px;
  background: transparent; border: 1px solid var(--border); color: var(--text2);
  cursor: pointer; transition: all .18s;
}
.lp-icon-btn:hover { color: var(--text); border-color: var(--borderS); transform: rotate(-14deg); }

/* ── nav ───────────────────────────────────────────────────────────────── */
.lp-nav {
  position: fixed; top: 14px; left: 50%; transform: translateX(-50%);
  width: min(1080px, calc(100% - 32px)); z-index: 300;
  background: var(--navBg); backdrop-filter: blur(18px) saturate(1.4);
  -webkit-backdrop-filter: blur(18px) saturate(1.4);
  border: 1px solid var(--border); border-radius: 18px; box-shadow: var(--shSm);
  transition: background .4s ease, border-color .4s ease;
}
.lp-nav-inner { display: flex; align-items: center; justify-content: space-between; gap: 16px; padding: 10px 14px; }
.lp-brand { display: flex; align-items: center; gap: 10px; text-decoration: none; }
.lp-brand span { font-family: 'DM Serif Display', serif; font-size: 21px; letter-spacing: -.02em; color: var(--text); }
.lp-nav-links { display: flex; gap: 2px; list-style: none; margin: 0; padding: 0; }
.lp-nav-links a { display: block; padding: 7px 14px; border-radius: 10px; font-size: 13.5px; color: var(--text2); text-decoration: none; transition: all .15s; font-weight: 500; }
.lp-nav-links a:hover { color: var(--text); background: var(--bg2); }
.lp-nav-actions { display: flex; align-items: center; gap: 8px; }
@media (max-width: 880px) { .lp-nav-links { display: none; } }

/* ── hero ──────────────────────────────────────────────────────────────── */
.lp-hero { position: relative; z-index: 1; padding: 168px 0 40px; display: flex; flex-direction: column; align-items: center; text-align: center; }
.lp-hero-inner { max-width: 1160px; margin: 0 auto; padding: 0 28px; display: flex; flex-direction: column; align-items: center; width: 100%; }
.lp-badge {
  animation: fadeUp .8s cubic-bezier(.22,1,.36,1) both .05s;
  display: inline-flex; align-items: center; gap: 8px; padding: 6px 16px;
  border-radius: 999px; border: 1px solid var(--border); background: var(--card);
  font-size: 12px; font-weight: 500; color: var(--text2);
  font-family: 'DM Mono', monospace; letter-spacing: .04em; box-shadow: var(--shSm);
}
.lp-badge-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--gold); box-shadow: 0 0 0 3px var(--goldSoft); }
.lp-h1 { font-family: var(--font-display); font-size: clamp(48px, 7.4vw, 88px); line-height: 1.04; letter-spacing: -.038em; color: var(--text); max-width: 900px; margin: 26px 0 0; font-weight: 600; }
.lp-h1 em { font-style: italic; font-weight: 500; }
.lp-rise-mask { display: inline-block; overflow: hidden; vertical-align: bottom; padding-bottom: .08em; margin-bottom: -.08em; }
.lp-rise { display: inline-block; animation: riseIn .9s cubic-bezier(.22,1,.36,1) both; }
.lp-h1-accent { color: var(--gold); position: relative; }
.lp-underline { position: absolute; left: 0; right: 0; bottom: -.05em; width: 100%; height: .16em; overflow: visible; }
.lp-underline path { animation: drawIn 1s ease-out .9s both; }
.lp-hero-sub { font-size: 18px; color: var(--text2); max-width: 540px; line-height: 1.7; margin: 26px 0 0; animation: fadeUp .8s cubic-bezier(.22,1,.36,1) both .5s; }
.lp-hero-actions { display: flex; gap: 10px; flex-wrap: wrap; justify-content: center; margin-top: 34px; animation: fadeUp .8s cubic-bezier(.22,1,.36,1) both .62s; }

/* ── hand-written scribbles ────────────────────────────────────────────── */
.lp-scribble { font-family: 'Virgil', cursive; font-size: 19px; pointer-events: none; }
.lp-scribble-float { position: absolute; }
.lp-scribble-a { position: absolute; top: -34px; left: -14px; z-index: 5; color: var(--red); transform: rotate(-6deg); }
.lp-scribble-b { position: absolute; top: -24px; right: 2%; z-index: 5; color: var(--green); transform: rotate(4deg); animation: floatY 7s ease-in-out infinite; }
.lp-scribble-c { position: absolute; bottom: -20px; left: 6%; z-index: 5; font-size: 17px; color: var(--gold); transform: rotate(-3deg); animation: floatY 9s ease-in-out infinite; }
@media (max-width: 760px) { .lp-scribble-a, .lp-scribble-b, .lp-scribble-c { display: none; } }

/* ── editor mockup ─────────────────────────────────────────────────────── */
.mkly-root { width: 100%; max-width: 1060px; margin: 76px auto 0; position: relative; perspective: 1600px; animation: fadeUp .9s cubic-bezier(.22,1,.36,1) both .75s; }
.mkly-tiltbox { transform: rotateX(9deg) scale(.965); transform-origin: center top; transition: transform .1s linear; will-change: transform; }
.mkly-window { background: var(--card); border: 1px solid var(--border); border-radius: 24px; box-shadow: var(--shXl); overflow: hidden; }
.mkly-titlebar { background: var(--bg2); border-bottom: 1px solid var(--border); padding: 13px 18px; display: flex; align-items: center; gap: 14px; }
.mkly-dot { width: 11px; height: 11px; border-radius: 50%; }
.mkly-url { flex: 1; background: var(--bg); border: 1px solid var(--border); border-radius: 8px; padding: 5px 14px; font-family: 'DM Mono', monospace; font-size: 11px; color: var(--text3); }
.mkly-action { padding: 4px 12px; border-radius: 6px; font-size: 11px; font-family: 'DM Mono', monospace; cursor: default; background: var(--bg); border: 1px solid var(--border); color: var(--text3); }
.mkly-action.mkly-exp { background: var(--accent); color: var(--accentFg); border-color: var(--accent); transform-origin: center; }
.mkly-body { position: relative; display: flex; height: 430px; }
.mkly-toolbar { width: 54px; border-right: 1px solid var(--border); background: var(--bg2); display: flex; flex-direction: column; align-items: center; padding: 14px 0; gap: 4px; flex-shrink: 0; }
.mkly-tb-btn { width: 38px; height: 38px; border-radius: 9px; border: none; background: transparent; color: var(--text3); display: flex; align-items: center; justify-content: center; cursor: default; transition: background .12s, color .12s; }
.mkly-tb-sep { width: 28px; height: 1px; background: var(--border); margin: 6px 0; }
.mkly-canvas { position: relative; overflow: hidden; flex: 1; align-self: stretch; background: var(--bg); }
.mkly-world { position: absolute; inset: 0; transform-origin: 0 0; will-change: transform; }
.mkly-pdf { position: absolute; background: var(--paper); box-shadow: var(--shMd); border-radius: 3px; padding: 30px 30px 40px; width: 340px; z-index: 1; }
.mkly-pdf-title { height: 14px; width: 68%; margin-bottom: 20px; background: var(--borderS); border-radius: 2px; }
.mkly-pdf-line { height: 8px; background: var(--border); border-radius: 2px; margin-bottom: 11px; }
.mkly-svg { position: absolute; top: 0; left: 0; width: 3000px; height: 3000px; pointer-events: none; overflow: visible; z-index: 2; }
.mkly-cur { position: absolute; pointer-events: none; z-index: 100; transform: translate(-2px,-2px); }
.mkly-panel { width: 210px; border-left: 1px solid var(--border); background: var(--card); padding: 18px; font-size: 12px; display: flex; flex-direction: column; gap: 18px; flex-shrink: 0; }
.mkly-panel-group { display: flex; flex-direction: column; gap: 10px; }
.mkly-swatch { width: 22px; height: 22px; border-radius: 6px; border: 1px solid var(--border); }
.mkly-font-chip { font-size: 12px; color: var(--text2); font-family: 'Virgil', cursive; background: var(--bg2); border: 1px solid var(--border); border-radius: 8px; padding: 6px 9px; }
.mkly-input { background: var(--bg2); border: 1px solid var(--border); border-radius: 8px; padding: 6px 9px; font-size: 11px; color: var(--text); font-family: 'DM Mono', monospace; width: 100%; }
.mkly-comment { background: var(--bg2); border: 1px solid var(--border); border-radius: 12px; padding: 11px; display: flex; gap: 9px; }
.mkly-comment-avatar { width: 22px; height: 22px; border-radius: 50%; background: var(--text); display: flex; align-items: center; justify-content: center; font-size: 9px; color: var(--accentFg); flex-shrink: 0; font-weight: 600; }
@media (max-width: 900px) { .mkly-panel { display: none; } }
@media (max-width: 620px) { .mkly-body { height: 340px; } .mkly-toolbar { display: none; } }

/* ── social proof ──────────────────────────────────────────────────────── */
.lp-social { position: relative; z-index: 1; padding: 64px 0 72px; }
.lp-social-label { text-align: center; font-size: 11px; font-weight: 600; letter-spacing: .14em; text-transform: uppercase; color: var(--text3); font-family: 'DM Mono', monospace; margin-bottom: 28px; }
.lp-marquee-mask { overflow: hidden; position: relative; -webkit-mask-image: linear-gradient(90deg, transparent, black 12%, black 88%, transparent); mask-image: linear-gradient(90deg, transparent, black 12%, black 88%, transparent); }
.lp-marquee { display: flex; width: max-content; animation: marquee 34s linear infinite; }
.lp-marquee:hover { animation-play-state: paused; }
.lp-marquee-item { display: flex; align-items: center; gap: 14px; padding: 0 28px; white-space: nowrap; }
.lp-marquee-dot { width: 5px; height: 5px; border-radius: 50%; background: var(--border); }

/* ── notebook feature cards ────────────────────────────────────────────── */
.lp-notebook { position: relative; max-width: 940px; height: 310px; margin: 0 auto; }
.lp-nb-rings { position: absolute; top: -16px; left: 18px; right: 14px; display: flex; justify-content: space-between; }
.lp-nb-rings span { width: 14px; height: 38px; border: 4px solid #111; border-bottom-width: 8px; border-radius: 12px 12px 8px 8px; background: transparent; box-shadow: inset 0 -4px 0 #111; }
.lp-nb-pill { display: inline-flex; align-items: center; justify-content: center; min-width: 34px; height: 26px; border: 2px solid #111; border-radius: 999px; background: #fff; font-family: 'DM Mono', monospace; font-size: 10px; letter-spacing: .08em; transition: border-color .28s ease, color .28s ease; justify-self: start; }
.lp-nb-icon { width: 44px; height: 44px; margin-top: 10px; border: 2px solid #111; border-radius: 16px 18px 14px 16px; display: flex; align-items: center; justify-content: center; color: #111; box-shadow: 3px 4px 0 rgba(17,17,17,.08); transition: background .28s ease, transform .28s ease; }
.lp-nb-title { margin: 10px 0 0; max-width: 10ch; font-family: 'DM Serif Display', serif; font-size: clamp(17px, 1.7vw, 24px); line-height: 1.08; letter-spacing: -.04em; color: #111; font-weight: 400; }
.lp-nb-desc { margin: 7px 0 0; max-width: 24ch; font-size: 12.5px; line-height: 1.5; color: rgba(17,17,17,.9); }
.lp-nb-lines { position: absolute; left: 30px; right: 20px; bottom: 12px; display: flex; flex-direction: column; gap: 6px; }
.lp-nb-lines span { display: block; height: 2px; border-radius: 999px; background: rgba(17,17,17,.16); }
@media (max-width: 1000px) {
  .lp-notebook { height: auto; display: grid; grid-template-columns: repeat(auto-fit, minmax(230px, 1fr)); gap: 22px; justify-items: center; }
  .lp-notebook > article { position: static !important; transform: none !important; opacity: 1 !important; filter: none !important; }
}

/* ── how it works ──────────────────────────────────────────────────────── */
.lp-how-grid { display: grid; grid-template-columns: .95fr 1.05fr; gap: 40px; align-items: stretch; max-width: 1040px; margin: 0 auto; }
.lp-how-list { display: flex; flex-direction: column; gap: 8px; justify-content: center; }
.lp-how-stage { position: relative; min-height: 420px; background: var(--card); border: 1px solid var(--border); border-radius: 24px; box-shadow: var(--shMd); overflow: hidden; }
.lp-how-stage-glow { position: absolute; inset: 0; background: radial-gradient(circle at 30% 15%, var(--goldSoft), transparent 60%); opacity: .5; pointer-events: none; }
.lp-stage-center { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; }
.lp-dropzone { width: 74%; height: 66%; border: 2px dashed var(--borderS); border-radius: 18px; display: flex; align-items: center; justify-content: center; flex-direction: column; gap: 18px; }
.lp-mini-doc { width: 118px; background: var(--paper); border: 1px solid var(--border); border-radius: 6px; padding: 14px 14px 18px; box-shadow: var(--shMd); }
.lp-annot-doc { position: relative; width: 230px; background: var(--paper); border: 1px solid var(--border); border-radius: 6px; padding: 22px 22px 28px; box-shadow: var(--shMd); animation: fadeUp .5s ease both; }
.lp-annot-doc .lp-scribble { position: absolute; font-size: 17px; white-space: nowrap; }
.lp-link-pill { display: inline-flex; align-items: center; gap: 10px; background: var(--bg2); border: 1px solid var(--border); border-radius: 999px; padding: 11px 20px; font-family: 'DM Mono', monospace; font-size: 12px; color: var(--text2); }
.lp-avatar { width: 38px; height: 38px; border-radius: 50%; background: var(--bg2); border: 2px solid var(--card); display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 600; color: var(--text2); }
.lp-avatar-sm { width: 30px; height: 30px; font-size: 10px; }
@media (max-width: 900px) { .lp-how-grid { grid-template-columns: 1fr; } }

/* ── toolkit ───────────────────────────────────────────────────────────── */
.lp-tool-chips { display: flex; gap: 8px; justify-content: center; flex-wrap: wrap; margin-bottom: 26px; }
.lp-chip { display: inline-flex; align-items: center; gap: 7px; padding: 9px 16px; border-radius: 999px; font-size: 13px; font-weight: 500; font-family: 'Instrument Sans', sans-serif; cursor: pointer; border: 1px solid var(--border); background: var(--card); color: var(--text2); transition: all .2s; }
.lp-chip.is-active { border-color: var(--accent); background: var(--accent); color: var(--accentFg); }
.lp-tool-canvas { position: relative; max-width: 760px; margin: 0 auto; background: var(--paper); border: 1px solid var(--border); border-radius: 20px; box-shadow: var(--shLg); padding: 46px 52px; min-height: 240px; overflow: hidden; }
.lp-tool-overlay { position: absolute; inset: 0; width: 100%; height: 100%; pointer-events: none; overflow: visible; }

/* ── sharing ───────────────────────────────────────────────────────────── */
.lp-share-grid { display: grid; grid-template-columns: 1.05fr .95fr; gap: 60px; align-items: center; }
.lp-checklist { display: flex; flex-direction: column; gap: 13px; margin-bottom: 32px; }
.lp-checklist > div { display: flex; align-items: center; gap: 11px; font-size: 14px; color: var(--text2); }
.lp-share-card { background: var(--card); border: 1px solid var(--border); border-radius: 22px; box-shadow: var(--shLg); padding: 28px; display: flex; flex-direction: column; gap: 20px; }
.lp-share-url { flex: 1; display: flex; align-items: center; gap: 9px; background: var(--bg2); border: 1px solid var(--border); border-radius: 12px; padding: 11px 14px; font-family: 'DM Mono', monospace; font-size: 12px; color: var(--text2); white-space: nowrap; overflow: hidden; }
.lp-copy-btn { justify-content: center; padding: 0 18px; border-radius: 12px; min-width: 88px; box-shadow: none; }
.lp-copy-btn:hover { transform: none; opacity: .85; box-shadow: none; }
.lp-access { display: flex; background: var(--bg2); border: 1px solid var(--border); border-radius: 12px; padding: 4px; gap: 4px; }
.lp-access-btn { flex: 1; padding: 9px 0; border-radius: 9px; font-size: 11px; font-weight: 600; letter-spacing: .08em; font-family: 'DM Mono', monospace; cursor: pointer; border: none; background: transparent; color: var(--text2); transition: all .2s; }
.lp-access-btn.is-active { background: var(--accent); color: var(--accentFg); }
@media (max-width: 900px) { .lp-share-grid { grid-template-columns: 1fr; gap: 40px; } }

/* ── CTA ───────────────────────────────────────────────────────────────── */
.lp-cta { background: var(--accent); color: var(--accentFg); border-radius: 28px; padding: 84px 60px; text-align: center; position: relative; overflow: hidden; }
.lp-cta::before { content: ''; position: absolute; inset: 0; pointer-events: none; background: repeating-linear-gradient(-45deg, transparent, transparent 24px, rgba(128,128,128,.06) 24px, rgba(128,128,128,.06) 25px); }
.lp-cta-title { font-family: 'DM Serif Display', serif; font-size: clamp(32px, 4.5vw, 56px); letter-spacing: -.03em; line-height: 1.06; margin: 0 0 16px; font-weight: 400; }
.lp-cta-sub { opacity: .65; max-width: 430px; margin: 0 auto 36px; font-size: 15px; line-height: 1.65; }
.lp-cta-primary { background: var(--accentFg); color: var(--accent); border: none; }
.lp-cta-primary:hover { transform: translateY(-2px); box-shadow: 0 14px 40px rgba(0,0,0,.25); }
.lp-cta-ghost { background: transparent; color: var(--accentFg); border: 1px solid color-mix(in srgb, var(--accentFg) 28%, transparent); }
.lp-cta-ghost:hover { background: color-mix(in srgb, var(--accentFg) 10%, transparent); }
@media (max-width: 640px) { .lp-cta { padding: 56px 24px; } }

/* ── footer ────────────────────────────────────────────────────────────── */
.lp-footer { position: relative; z-index: 1; border-top: 1px solid var(--border); padding: 56px 0 44px; }
.lp-footer-grid { display: grid; grid-template-columns: 1.6fr repeat(3, 1fr); gap: 40px; margin-bottom: 44px; }
.lp-footer-head { font-size: 11px; font-weight: 600; letter-spacing: .08em; text-transform: uppercase; color: var(--text3); margin: 0 0 16px; font-family: 'DM Mono', monospace; }
.lp-footer-links { list-style: none; display: flex; flex-direction: column; gap: 10px; margin: 0; padding: 0; }
.lp-footer-links a { font-size: 13px; color: var(--text2); text-decoration: none; transition: color .15s; }
.lp-footer-links a:hover { color: var(--text); }
.lp-footer-bottom { padding-top: 24px; border-top: 1px solid var(--border); display: flex; justify-content: space-between; align-items: center; gap: 16px; flex-wrap: wrap; font-size: 12px; color: var(--text3); }
.lp-footer-bottom a { color: var(--text3); text-decoration: none; }
.lp-footer-bottom a:hover { color: var(--text2); }
@media (max-width: 760px) { .lp-footer-grid { grid-template-columns: 1fr 1fr; } }

/* ── keyframes ─────────────────────────────────────────────────────────── */
@keyframes riseIn { from { opacity: 0; transform: translateY(110%) rotate(2deg); } to { opacity: 1; transform: translateY(0) rotate(0deg); } }
@keyframes fadeUp { from { opacity: 0; transform: translateY(24px); } to { opacity: 1; transform: translateY(0); } }
@keyframes marquee { from { transform: translateX(0); } to { transform: translateX(-50%); } }
@keyframes drawIn { to { stroke-dashoffset: 0; } }
@keyframes drift1 { 0% { transform: translate(0,0) scale(1); } 50% { transform: translate(60px,40px) scale(1.15); } 100% { transform: translate(0,0) scale(1); } }
@keyframes drift2 { 0% { transform: translate(0,0) scale(1.1); } 50% { transform: translate(-70px,-30px) scale(1); } 100% { transform: translate(0,0) scale(1.1); } }
@keyframes floatY { 0% { transform: translateY(0); } 50% { transform: translateY(-9px); } 100% { transform: translateY(0); } }
@keyframes blink { 0%,55% { opacity: 1; } 60%,100% { opacity: 0; } }
@keyframes dropIn { 0% { opacity: 0; transform: translateY(-52px) rotate(-7deg); } 60% { opacity: 1; transform: translateY(6px) rotate(1.5deg); } 80% { transform: translateY(-3px) rotate(0deg); } 100% { opacity: 1; transform: translateY(0) rotate(0deg); } }
@keyframes popIn { from { opacity: 0; transform: scale(.6); } to { opacity: 1; transform: scale(1); } }
@keyframes growW { from { transform: scaleX(0); } to { transform: scaleX(1); } }
@keyframes barFill { from { width: 0%; } to { width: 100%; } }
@keyframes bounceY { 0%,100% { transform: translateY(0); } 50% { transform: translateY(5px); } }

@media (prefers-reduced-motion: reduce) {
  .lpv2-root *, .lpv2-root *::before, .lpv2-root *::after {
    animation-duration: .01ms !important; animation-iteration-count: 1 !important; transition-duration: .01ms !important;
  }
}
`;
