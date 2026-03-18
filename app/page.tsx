'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

function useTheme() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  useEffect(() => {
    const saved = (localStorage.getItem('markly-theme') as 'light' | 'dark') || 'light';
    setTheme(saved);
    document.documentElement.setAttribute('data-theme', saved);
  }, []);
  function toggle() {
    const next = theme === 'light' ? 'dark' : 'light';
    setTheme(next);
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('markly-theme', next);
  }
  return { theme, toggle };
}

/* ── LOGO COMPONENT (Option D — stacked docs + red checkmark) ── */
function MarklyLogo({ size = 36, forDark = false }: { size?: number; forDark?: boolean }) {
  const c = forDark ? '#f4f4f0' : '#0d0d0c';
  const s = size;
  return (
    <svg width={s} height={s} viewBox="0 0 38 42" fill="none">
      <rect x="8" y="6" width="24" height="30" rx="2" fill="none" stroke={c} strokeWidth="1.4" opacity="0.2"/>
      <rect x="5" y="4" width="24" height="30" rx="2" fill="none" stroke={c} strokeWidth="1.4" opacity="0.45"/>
      <rect x="2" y="2" width="24" height="30" rx="2" fill="none" stroke={c} strokeWidth="1.6"/>
      <path d="M7 10 L20 10" stroke={c} strokeWidth="1" strokeLinecap="round" opacity="0.35"/>
      <path d="M7 14 L18 14" stroke={c} strokeWidth="1" strokeLinecap="round" opacity="0.35"/>
      <path d="M7 18 L20 18" stroke={c} strokeWidth="1" strokeLinecap="round" opacity="0.35"/>
      <path d="M6 25 L10 29 L18 21" stroke="#e74c3c" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
    </svg>
  );
}

export default function LandingPage() {
  const router = useRouter();
  const { theme, toggle } = useTheme();
  const [isAuthed, setIsAuthed] = useState(false);

  useEffect(() => {
    fetch('/api/auth/session')
      .then((res) => setIsAuthed(res.ok))
      .catch(() => setIsAuthed(false));
  }, []);

  async function handleLogout() {
    await fetch('/api/auth/session', { method: 'DELETE' });
    setIsAuthed(false);
    router.refresh();
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=Instrument+Sans:wght@400;500;600&family=DM+Mono:wght@400;500&display=swap');
        @font-face { font-family:'Virgil'; src:url('https://excalidraw.com/Virgil.woff2') format('woff2'); font-display:swap; }

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        :root {
          --bg:#fafaf9; --bg-2:#f4f4f2; --bg-card:#ffffff;
          --border:#e4e4e0; --border-strong:#c8c8c4;
          --text:#0d0d0c; --text-2:#5a5a58; --text-3:#9a9a96;
          --accent:#0d0d0c; --accent-fg:#fafaf9;
          --red:#e74c3c; --yellow:#f1c40f; --green:#2ecc71;
          --shadow-sm:0 1px 3px rgba(0,0,0,.06);
          --shadow-md:0 4px 16px rgba(0,0,0,.08);
          --shadow-lg:0 16px 48px rgba(0,0,0,.10);
          --shadow-xl:0 32px 80px rgba(0,0,0,.12);
          --radius-sm:6px; --radius-md:10px; --radius-lg:16px; --radius-xl:24px;
        }
        [data-theme="dark"] {
          --bg:#0c0c0b; --bg-2:#161614; --bg-card:#1a1a18;
          --border:#2a2a28; --border-strong:#3e3e3a;
          --text:#f4f4f0; --text-2:#a8a8a4; --text-3:#505050;
          --accent:#f4f4f0; --accent-fg:#0c0c0b;
          --shadow-lg:0 16px 48px rgba(0,0,0,.4);
          --shadow-xl:0 32px 80px rgba(0,0,0,.5);
        }

        html { scroll-behavior: smooth; }
        body {
          font-family: 'Instrument Sans', sans-serif;
          background: var(--bg); color: var(--text);
          line-height: 1.5; -webkit-font-smoothing: antialiased;
        }

        /* ── NOISE TEXTURE ── */
        body::before {
          content: ''; position: fixed; inset: 0; pointer-events: none; z-index: 0;
          opacity: 0.018;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E");
        }

        /* ── NAV ── */
        .nav {
          position: sticky; top: 0; z-index: 200;
          background: color-mix(in srgb, var(--bg) 88%, transparent);
          backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);
          border-bottom: 1px solid var(--border);
        }
        .nav-inner {
          max-width: 1120px; margin: 0 auto; padding: 0 28px;
          display: flex; align-items: center; height: 68px; gap: 0;
        }
        .nav-brand { display: flex; align-items: center; gap: 10px; text-decoration: none; flex: 1; }
        .nav-brand-text {
          font-family: 'DM Serif Display', serif; font-size: 22px;
          color: var(--text); letter-spacing: -.02em;
        }
        .nav-links { display: flex; gap: 2px; list-style: none; margin: 0 auto; }
        .nav-links a {
          display: block; padding: 7px 14px; border-radius: var(--radius-sm);
          font-size: 14px; color: var(--text-2); text-decoration: none; transition: all .15s;
          font-weight: 500;
        }
        .nav-links a:hover { color: var(--text); background: var(--bg-2); }
        .nav-actions { display: flex; align-items: center; gap: 8px; }

        /* ── BUTTONS ── */
        .btn {
          display: inline-flex; align-items: center; gap: 7px;
          padding: 9px 18px; border-radius: var(--radius-md);
          font-size: 14px; font-weight: 500; font-family: 'Instrument Sans', sans-serif;
          cursor: pointer; transition: all .18s; text-decoration: none;
          border: 1px solid transparent; white-space: nowrap;
        }
        .btn-ghost {
          background: transparent; color: var(--text-2);
          border-color: transparent;
        }
        .btn-ghost:hover { background: var(--bg-2); color: var(--text); }
        .btn-outline {
          background: transparent; color: var(--text);
          border-color: var(--border-strong);
        }
        .btn-outline:hover { background: var(--bg-2); transform: translateY(-1px); }
        .btn-primary {
          background: var(--accent); color: var(--accent-fg);
          border-color: var(--accent);
        }
        .btn-primary:hover { opacity: .85; transform: translateY(-1px); box-shadow: var(--shadow-md); }
        .btn-lg { padding: 13px 26px; font-size: 15px; border-radius: var(--radius-lg); }
        .btn-icon {
          width: 38px; height: 38px; padding: 0; justify-content: center;
          background: var(--bg-2); border-color: var(--border); color: var(--text-2);
          border-radius: var(--radius-md);
        }
        .btn-icon:hover { background: var(--bg-card); color: var(--text); border-color: var(--border-strong); }

        /* ── BADGE ── */
        .badge {
          display: inline-flex; align-items: center; gap: 7px;
          padding: 5px 14px; border-radius: 999px;
          background: var(--bg-2); border: 1px solid var(--border);
          font-size: 12px; font-weight: 500; color: var(--text-2);
        }
        .badge-dot {
          width: 6px; height: 6px; border-radius: 50%;
          background: var(--red); flex-shrink: 0;
          box-shadow: 0 0 0 3px color-mix(in srgb, var(--red) 20%, transparent);
        }

        /* ── CONTAINER ── */
        .container { max-width: 1120px; margin: 0 auto; padding: 0 28px; position: relative; z-index: 1; }

        /* ── SECTION ── */
        .section { padding: 100px 0; border-top: 1px solid var(--border); }
        .section-header { text-align: center; margin-bottom: 64px; }
        .section-label {
          font-size: 11px; font-weight: 600; letter-spacing: .1em;
          text-transform: uppercase; color: var(--text-3);
          font-family: 'DM Mono', monospace; margin-bottom: 16px;
        }
        .section-title {
          font-family: 'DM Serif Display', serif;
          font-size: clamp(28px, 4vw, 44px); letter-spacing: -.03em;
          line-height: 1.08; color: var(--text); margin-bottom: 16px;
        }
        .section-sub { color: var(--text-2); max-width: 480px; margin: 0 auto; font-size: 15px; line-height: 1.7; }

        /* ── DIVIDER ── */
        .divider { height: 1px; background: var(--border); }

        /* ── HERO ── */
        .hero {
          padding: 100px 0 80px;
          display: flex; flex-direction: column; align-items: center;
          text-align: center; gap: 0;
        }
        .hero-eyebrow { margin-bottom: 28px; }
        .hero-title {
          font-family: 'DM Serif Display', serif;
          font-size: clamp(48px, 7.5vw, 82px);
          line-height: 1.04; letter-spacing: -.035em;
          color: var(--text); max-width: 860px; margin-bottom: 24px;
        }
        .hero-title em { font-style: italic; color: var(--text-2); }
        .hero-sub {
          font-size: 18px; color: var(--text-2);
          max-width: 520px; line-height: 1.7; margin-bottom: 36px;
        }
        .hero-actions { display: flex; gap: 10px; flex-wrap: wrap; justify-content: center; margin-bottom: 64px; }
        .hero-proof {
          display: flex; align-items: center; gap: 28px;
          flex-wrap: wrap; justify-content: center;
        }
        .hero-proof-item { display: flex; align-items: center; gap: 8px; font-size: 13px; color: var(--text-3); }

        /* ── MOCKUP ── */
        .mockup-wrap { width: 100%; max-width: 960px; margin: 0 auto; }
        .mockup-window {
          background: var(--bg-card); border: 1px solid var(--border);
          border-radius: var(--radius-xl); box-shadow: var(--shadow-xl); overflow: hidden;
        }
        .mockup-titlebar {
          background: var(--bg-2); border-bottom: 1px solid var(--border);
          padding: 13px 18px; display: flex; align-items: center; gap: 14px;
        }
        .mockup-dots { display: flex; gap: 7px; }
        .mockup-dot { width: 11px; height: 11px; border-radius: 50%; }
        .mockup-url {
          flex: 1; background: var(--bg); border: 1px solid var(--border);
          border-radius: var(--radius-sm); padding: 5px 14px;
          font-family: 'DM Mono', monospace; font-size: 11px; color: var(--text-3);
        }
        .mockup-actions { display: flex; gap: 8px; margin-left: auto; }
        .mockup-action {
          padding: 4px 12px; border-radius: 5px; font-size: 11px;
          font-family: 'DM Mono', monospace; cursor: default;
        }
        .mockup-body { display: flex; height: 440px; }

        /* TOOLBAR */
        .editor-toolbar {
          width: 54px; border-right: 1px solid var(--border); background: var(--bg-2);
          display: flex; flex-direction: column; align-items: center;
          padding: 14px 0; gap: 4px; flex-shrink: 0;
        }
        .tool-btn {
          width: 38px; height: 38px; border-radius: 9px;
          display: flex; align-items: center; justify-content: center;
          color: var(--text-3); cursor: pointer; border: none; background: transparent;
          transition: all .15s; font-size: 13px;
        }
        .tool-btn.active { background: var(--accent); color: var(--accent-fg); }
        .tool-btn:hover:not(.active) { background: var(--border); color: var(--text); }
        .tool-sep { width: 28px; height: 1px; background: var(--border); margin: 6px 0; }

        /* CANVAS */
        .editor-canvas { flex: 1; position: relative; overflow: hidden; background: var(--bg); }
        .pdf-page {
          position: absolute; top: 28px; left: 50%; transform: translateX(-50%);
          width: 290px; background: white; box-shadow: var(--shadow-md); border-radius: 3px;
          padding: 26px 26px 34px;
        }
        [data-theme="dark"] .pdf-page { background: #1e1e1c; }
        .pdf-line { height: 7px; background: var(--border); border-radius: 2px; margin-bottom: 10px; }
        .pdf-line.title { height: 13px; width: 68%; margin-bottom: 18px; background: var(--border-strong); }
        .pdf-line.med { width: 82%; }
        .pdf-line.short { width: 58%; }
        .anno-rect { position: absolute; border: 2px solid; border-radius: 3px; }
        .anno-text { position: absolute; font-family: 'Virgil', cursive; font-size: 13px; color: var(--red); white-space: nowrap; pointer-events: none; }
        .anno-hl { position: absolute; height: 8px; border-radius: 2px; opacity: .38; }

        /* PANEL */
        .editor-panel {
          width: 196px; border-left: 1px solid var(--border); background: var(--bg-card);
          padding: 18px; font-size: 12px; display: flex; flex-direction: column; gap: 18px;
          flex-shrink: 0;
        }
        .panel-label { font-size: 10px; font-weight: 600; letter-spacing: .08em; text-transform: uppercase; color: var(--text-3); font-family: 'DM Mono', monospace; }
        .color-dot { width: 22px; height: 22px; border-radius: 5px; border: 1px solid var(--border); }
        .panel-input {
          background: var(--bg-2); border: 1px solid var(--border); border-radius: var(--radius-sm);
          padding: 6px 9px; font-size: 11px; color: var(--text); font-family: 'DM Mono', monospace;
          width: 100%;
        }
        .comment-bubble {
          background: var(--bg-2); border: 1px solid var(--border);
          border-radius: 10px; padding: 11px; display: flex; gap: 9px;
        }
        .comment-avatar {
          width: 22px; height: 22px; border-radius: 50%; background: var(--text);
          display: flex; align-items: center; justify-content: center;
          font-size: 9px; color: var(--accent-fg); flex-shrink: 0;
          font-family: 'Instrument Sans', sans-serif; font-weight: 600;
        }

        /* ── FEATURES GRID ── */
        .features-grid {
          display: grid; grid-template-columns: repeat(3, 1fr);
          border: 1px solid var(--border); border-radius: var(--radius-xl); overflow: hidden;
          background: var(--border); gap: 1px;
        }
        .feat-card {
          background: var(--bg-card); padding: 36px 32px;
          display: flex; flex-direction: column; gap: 18px;
          transition: background .2s;
        }
        .feat-card:hover { background: var(--bg-2); }
        .feat-icon {
          width: 46px; height: 46px; border-radius: 11px;
          border: 1px solid var(--border); background: var(--bg-2);
          display: flex; align-items: center; justify-content: center;
          color: var(--text); transition: all .2s;
        }
        .feat-card:hover .feat-icon { background: var(--text); color: var(--accent-fg); }
        .feat-title { font-weight: 600; font-size: 15px; letter-spacing: -.01em; color: var(--text); }
        .feat-desc { font-size: 13.5px; color: var(--text-2); line-height: 1.65; }

        /* ── STEPS ── */
        .steps-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 28px; }
        .step { display: flex; flex-direction: column; gap: 14px; }
        .step-rule { height: 1px; background: linear-gradient(to right, var(--text), var(--border)); }
        .step-num { font-family: 'DM Mono', monospace; font-size: 11px; color: var(--text-3); letter-spacing: .06em; padding-top: 4px; }
        .step-title { font-weight: 600; font-size: 15px; color: var(--text); }
        .step-desc { font-size: 13px; color: var(--text-2); line-height: 1.65; }

        /* ── TESTIMONIALS ── */
        .testi-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
        .testi-card {
          background: var(--bg-card); border: 1px solid var(--border);
          border-radius: var(--radius-lg); padding: 28px 26px;
          display: flex; flex-direction: column; gap: 22px;
          box-shadow: var(--shadow-sm); transition: box-shadow .2s, transform .2s;
        }
        .testi-card:hover { box-shadow: var(--shadow-md); transform: translateY(-2px); }
        .testi-stars { display: flex; gap: 3px; }
        .testi-star { color: var(--yellow); font-size: 13px; }
        .testi-quote { font-size: 14px; color: var(--text-2); line-height: 1.75; font-style: italic; }
        .testi-author { display: flex; align-items: center; gap: 12px; }
        .testi-avatar {
          width: 38px; height: 38px; border-radius: 50%;
          background: var(--bg-2); border: 1px solid var(--border);
          display: flex; align-items: center; justify-content: center;
          font-size: 13px; font-weight: 600; color: var(--text-2);
        }
        .testi-name { font-size: 13px; font-weight: 600; color: var(--text); }
        .testi-role { font-size: 11px; color: var(--text-3); margin-top: 2px; }

        /* ── PRICING ── */
        .pricing-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; max-width: 900px; margin: 0 auto; }
        .price-card {
          background: var(--bg-card); border: 1px solid var(--border);
          border-radius: var(--radius-lg); padding: 32px 28px;
          display: flex; flex-direction: column; gap: 24px;
          position: relative; transition: box-shadow .2s;
        }
        .price-card:hover { box-shadow: var(--shadow-md); }
        .price-card.featured {
          background: var(--text); color: var(--accent-fg);
          border-color: var(--text); box-shadow: var(--shadow-lg);
        }
        .price-popular {
          position: absolute; top: -12px; left: 50%; transform: translateX(-50%);
          background: var(--red); color: white; padding: 3px 14px; border-radius: 999px;
          font-size: 10px; font-weight: 700; letter-spacing: .06em; text-transform: uppercase;
          white-space: nowrap;
        }
        .price-plan { font-size: 12px; font-weight: 600; letter-spacing: .07em; text-transform: uppercase; color: var(--text-3); font-family: 'DM Mono', monospace; }
        .price-card.featured .price-plan { color: color-mix(in srgb, var(--accent-fg) 50%, transparent); }
        .price-amount { font-family: 'DM Serif Display', serif; font-size: 46px; letter-spacing: -.03em; line-height: 1; }
        .price-per { font-size: 13px; opacity: .55; font-weight: 400; font-family: 'Instrument Sans', sans-serif; }
        .price-desc { font-size: 13px; color: var(--text-2); line-height: 1.6; }
        .price-card.featured .price-desc { color: color-mix(in srgb, var(--accent-fg) 60%, transparent); }
        .price-divider { height: 1px; background: var(--border); }
        .price-card.featured .price-divider { background: color-mix(in srgb, var(--accent-fg) 15%, transparent); }
        .price-features { list-style: none; display: flex; flex-direction: column; gap: 11px; }
        .price-feat { display: flex; align-items: center; gap: 10px; font-size: 13px; color: var(--text-2); }
        .price-card.featured .price-feat { color: color-mix(in srgb, var(--accent-fg) 65%, transparent); }
        .price-feat-icon { flex-shrink: 0; }

        /* ── CTA ── */
        .cta-wrap { padding: 0 0 100px; }
        .cta-block {
          background: var(--text); color: var(--accent-fg);
          border-radius: var(--radius-xl); padding: 80px 60px;
          text-align: center; position: relative; overflow: hidden;
        }
        .cta-block::before {
          content: ''; position: absolute; inset: 0; pointer-events: none;
          background: repeating-linear-gradient(-45deg, transparent, transparent 24px,
            color-mix(in srgb, var(--accent-fg) 2.5%, transparent) 24px,
            color-mix(in srgb, var(--accent-fg) 2.5%, transparent) 25px);
        }
        .cta-inner { position: relative; z-index: 1; }
        .cta-title {
          font-family: 'DM Serif Display', serif;
          font-size: clamp(30px, 4.5vw, 52px); letter-spacing: -.03em;
          line-height: 1.06; margin-bottom: 16px;
        }
        .cta-sub { opacity: .6; max-width: 420px; margin: 0 auto 36px; font-size: 15px; line-height: 1.65; }
        .cta-actions { display: flex; gap: 10px; justify-content: center; flex-wrap: wrap; }

        /* ── FOOTER ── */
        .footer { border-top: 1px solid var(--border); padding: 56px 0 44px; }
        .footer-grid { display: grid; grid-template-columns: 1.6fr repeat(3, 1fr); gap: 40px; margin-bottom: 44px; }
        .footer-brand { display: flex; align-items: center; gap: 10px; text-decoration: none; margin-bottom: 14px; }
        .footer-brand-text { font-family: 'DM Serif Display', serif; font-size: 20px; color: var(--text); letter-spacing: -.02em; }
        .footer-tagline { font-size: 13px; color: var(--text-3); line-height: 1.65; max-width: 220px; }
        .footer-col h4 { font-size: 11px; font-weight: 600; letter-spacing: .08em; text-transform: uppercase; color: var(--text-3); margin-bottom: 16px; font-family: 'DM Mono', monospace; }
        .footer-col ul { list-style: none; display: flex; flex-direction: column; gap: 10px; }
        .footer-col a { font-size: 13px; color: var(--text-2); text-decoration: none; transition: color .15s; }
        .footer-col a:hover { color: var(--text); }
        .footer-bottom {
          padding-top: 24px; border-top: 1px solid var(--border);
          display: flex; justify-content: space-between; align-items: center;
          font-size: 12px; color: var(--text-3);
        }
        .footer-bottom-links { display: flex; gap: 20px; }
        .footer-bottom-links a { color: var(--text-3); text-decoration: none; transition: color .15s; }
        .footer-bottom-links a:hover { color: var(--text-2); }

        /* ── ANIMATIONS ── */
        @keyframes fadeUp { from { opacity: 0; transform: translateY(22px); } to { opacity: 1; transform: translateY(0); } }
        .anim { animation: fadeUp .65s cubic-bezier(.22,1,.36,1) both; }
        .d1 { animation-delay: .08s; } .d2 { animation-delay: .18s; }
        .d3 { animation-delay: .28s; } .d4 { animation-delay: .40s; }

        /* ── RESPONSIVE ── */
        @media (max-width: 960px) {
          .features-grid, .testi-grid, .pricing-grid { grid-template-columns: 1fr 1fr; }
          .steps-grid { grid-template-columns: 1fr 1fr; }
          .footer-grid { grid-template-columns: 1fr 1fr; }
          .editor-panel { display: none; }
          .nav-links { display: none; }
        }
        @media (max-width: 640px) {
          .features-grid, .testi-grid, .pricing-grid, .steps-grid { grid-template-columns: 1fr; }
          .footer-grid { grid-template-columns: 1fr; }
          .cta-block { padding: 52px 28px; }
          .hero { padding: 72px 0 56px; }
          .section { padding: 72px 0; }
        }
      `}</style>

      {/* ── NAV ── */}
      <nav className="nav">
        <div className="nav-inner">
          <a href="/" className="nav-brand">
          <div style={{display:'flex',alignItems:'center',justifyContent:'center',width:32,height:32}}>
  <svg width="32" height="32" viewBox="0 0 40 40" fill="none">
    <path d="M20 6 L8 6 L8 20" stroke="var(--text)" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M20 34 L32 34 L32 20" stroke="var(--text)" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round"/>
    <circle cx="20" cy="20" r="3.5" fill="var(--text)"/>
    <path d="M13 20 Q17 18 20 20 Q23 22 27 20" stroke="var(--text)" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
  </svg>
</div>
            <span className="nav-brand-text">Markly</span>
          </a>

          <ul className="nav-links">
            <li><a href="#features">Features</a></li>
            <li><a href="#how">How it works</a></li>
            <li><a href="#pricing">Pricing</a></li>
          </ul>

          <div className="nav-actions">
            <button className="btn btn-icon" onClick={toggle} aria-label="Toggle theme">
              {theme === 'light'
                ? <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
                : <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M4.93 4.93l1.41 1.41m11.32 11.32 1.41 1.41M2 12h2m16 0h2M4.93 19.07l1.41-1.41m11.32-11.32 1.41-1.41"/></svg>
              }
            </button>
            {isAuthed ? (
              <>
                <button onClick={() => router.push('/dashboard')} className="btn btn-outline" style={{padding:'8px 16px',fontSize:13}}>Dashboard</button>
                <button onClick={handleLogout} className="btn btn-primary" style={{padding:'8px 16px',fontSize:13}}>Log out</button>
              </>
            ) : (
              <>
                <button onClick={() => router.push('/login')} className="btn btn-outline" style={{padding:'8px 16px',fontSize:13}}>Log in</button>
                <button onClick={() => router.push('/signup')} className="btn btn-primary" style={{padding:'8px 16px',fontSize:13}}>Get started free</button>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="hero">
        <div className="container" style={{display:'flex',flexDirection:'column',alignItems:'center'}}>

          <div className="hero-eyebrow anim d1">
            <span className="badge">
              <span className="badge-dot"/>
              Excalidraw for Documents — now in beta
            </span>
          </div>

          <h1 className="hero-title anim d2">
            Annotate documents<br/><em>like an artist</em>
          </h1>

          <p className="hero-sub anim d3">
            Markly brings the fluidity of Excalidraw to your PDFs. Draw, write, and comment directly on documents — then share in one click.
          </p>

          <div className="hero-actions anim d3">
            <button onClick={() => router.push(isAuthed ? '/dashboard' : '/signup')} className="btn btn-primary btn-lg">
              <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
              {isAuthed ? 'Open your dashboard' : 'Start free with Google/GitHub'}
            </button>
            <button className="btn btn-outline btn-lg">
              Watch demo
              <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polygon points="5 3 19 12 5 21 5 3"/></svg>
            </button>
          </div>

          {/* PROOF */}
          <div className="hero-proof anim d4">
            {['Google & GitHub login','Share via link','Export as PDF','Works on any PDF'].map(t => (
              <div key={t} className="hero-proof-item">
                <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>
                {t}
              </div>
            ))}
          </div>

          {/* MOCKUP */}
          <div className="mockup-wrap anim d4" style={{marginTop:56}}>
            <div className="mockup-window">
              <div className="mockup-titlebar">
                <div className="mockup-dots">
                  <div className="mockup-dot" style={{background:'#ff5f56'}}/>
                  <div className="mockup-dot" style={{background:'#ffbd2e'}}/>
                  <div className="mockup-dot" style={{background:'#27c93f'}}/>
                </div>
                <div className="mockup-url">markly.app/review/7bfa61e8-b98f</div>
                <div className="mockup-actions">
                  <div className="mockup-action" style={{background:'var(--bg)',border:'1px solid var(--border)',color:'var(--text-3)'}}>Share</div>
                  <div className="mockup-action" style={{background:'var(--text)',color:'var(--accent-fg)'}}>Export</div>
                </div>
              </div>

              <div className="mockup-body">
                {/* TOOLBAR */}
                <div className="editor-toolbar">
                  {[
                    <svg key="s" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M5 3l14 9-7 1-4 7z"/></svg>,
                    <span key="t" style={{fontFamily:"'DM Serif Display',serif",fontSize:15,fontStyle:'italic'}}>T</span>,
                    <svg key="r" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="1"/></svg>,
                    <svg key="c" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/></svg>,
                    <svg key="a" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M5 12h14M13 6l6 6-6 6"/></svg>,
                  ].map((icon, i) => (
                    <button key={i} className={`tool-btn${i===1?' active':''}`}>{icon}</button>
                  ))}
                  <div className="tool-sep"/>
                  <button className="tool-btn"><svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M3 17c3-3 5-5 8-5s5 5 8-1"/></svg></button>
                  <button className="tool-btn"><svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M9 7l6 0M9 11h6M9 15h4" strokeLinecap="round"/></svg></button>
                  <div className="tool-sep"/>
                  <button className="tool-btn"><svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg></button>
                </div>

                {/* CANVAS */}
                <div className="editor-canvas">
                  <div className="pdf-page">
                    <div className="pdf-line title"/>
                    <div className="pdf-line"/>
                    <div className="pdf-line med"/>
                    <div className="pdf-line short"/>
                    <div className="pdf-line"/>
                    <div className="pdf-line med"/>
                    <div className="pdf-line" style={{marginTop:14}}/>
                    <div className="pdf-line"/>
                    <div className="pdf-line short"/>
                    <div className="pdf-line med"/>
                    <div className="pdf-line"/>
                  </div>
                  <div className="anno-rect" style={{left:'calc(50% - 158px)',top:82,width:132,height:46,borderColor:'#e74c3c',borderStyle:'dashed'}}/>
                  <div className="anno-text" style={{left:'calc(50% - 152px)',top:62}}>Review this!</div>
                  <div className="anno-hl" style={{left:'calc(50% - 158px)',top:172,width:196,background:'#f1c40f'}}/>
                  <div className="anno-rect" style={{left:'calc(50% + 12px)',top:118,width:88,height:30,borderColor:'#2ecc71'}}/>
                  <div className="anno-text" style={{left:'calc(50% + 16px)',top:152,color:'#2ecc71',fontSize:12}}>Looks good ✓</div>
                  <svg style={{position:'absolute',left:'calc(50% - 168px)',top:88,pointerEvents:'none'}} width="56" height="38">
                    <path d="M10,33 Q28,9 48,20" stroke="#e74c3c" strokeWidth="1.8" fill="none" strokeDasharray="4,2"/>
                    <polygon points="46,14 53,22 42,23" fill="#e74c3c"/>
                  </svg>
                </div>

                {/* PANEL */}
                <div className="editor-panel">
                  <div style={{display:'flex',flexDirection:'column',gap:10}}>
                    <div className="panel-label">Stroke color</div>
                    <div style={{display:'flex',gap:7}}>
                      {['#e74c3c','#2ecc71','#f1c40f','var(--text)'].map((c,i) => (
                        <div key={i} className="color-dot" style={{background:c}}/>
                      ))}
                    </div>
                  </div>
                  <div style={{display:'flex',flexDirection:'column',gap:10}}>
                    <div className="panel-label">Font</div>
                    <div style={{fontSize:12,color:'var(--text-2)',fontFamily:"'Virgil',cursive",background:'var(--bg-2)',border:'1px solid var(--border)',borderRadius:6,padding:'6px 9px'}}>Virgil</div>
                  </div>
                  <div style={{display:'flex',flexDirection:'column',gap:10}}>
                    <div className="panel-label">Opacity</div>
                    <input className="panel-input" value="100%" readOnly/>
                  </div>
                  <div style={{marginTop:'auto',display:'flex',flexDirection:'column',gap:10}}>
                    <div className="panel-label">Comment</div>
                    <div className="comment-bubble">
                      <div className="comment-avatar">AR</div>
                      <div>
                        <div style={{fontSize:11,color:'var(--text-2)',lineHeight:1.5}}>"Review highlighted section"</div>
                        <div style={{fontSize:10,color:'var(--text-3)',marginTop:4}}>2 min ago · Resolved</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section className="section" id="features">
        <div className="container">
          <div className="section-header">
            <div className="section-label">Features</div>
            <h2 className="section-title">Everything you need to<br/>review documents visually</h2>
            <p className="section-sub">From quick annotations to full-scale document reviews — Markly gives your team a shared visual language.</p>
          </div>
          <div className="features-grid">
            {[
              { icon:<svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>, t:'Hand-drawn annotations', d:'Excalidraw-style shapes with Virgil font — sketch-like text and doodles that feel natural.' },
              { icon:<svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>, t:'Multi-page PDF support', d:'Navigate long documents with page thumbnails. Annotations stay perfectly positioned at any zoom.' },
              { icon:<svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg>, t:'One-click sharing', d:'No accounts needed. Share a link with view, comment, or edit access — works instantly.' },
              { icon:<svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>, t:'Threaded comments', d:'Attach comments to specific annotations or pages. Resolve, reply, and track feedback inline.' },
              { icon:<svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>, t:'Auto-save & undo/redo', d:'Debounce autosave + full history. Ctrl+Z / Ctrl+Y work just like Excalidraw.' },
              { icon:<svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>, t:'Export annotated PDF', d:'Download the final PDF with all annotations baked in. Original file stays untouched.' },
            ].map((f,i) => (
              <div key={i} className="feat-card">
                <div className="feat-icon">{f.icon}</div>
                <div>
                  <div className="feat-title">{f.t}</div>
                  <div className="feat-desc" style={{marginTop:7}}>{f.d}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="section" id="how">
        <div className="container">
          <div className="section-header">
            <div className="section-label">How it works</div>
            <h2 className="section-title">From upload to sign-off<br/>in four steps</h2>
            <p className="section-sub">Markly streamlines your entire review workflow — no onboarding required.</p>
          </div>
          <div className="steps-grid">
            {[
              { n:'01', t:'Upload your PDF', d:'Drag and drop any PDF. Rendered with pdf.js — multi-page, high-fidelity, instant.' },
              { n:'02', t:'Annotate visually', d:'Draw shapes, write with Virgil font, highlight sections — hand-drawn feel on every mark.' },
              { n:'03', t:'Share the link', d:'Send a secure link. Your reviewer opens it instantly — no account, no download needed.' },
              { n:'04', t:'Export & close', d:'Download the annotated PDF for your records. Clean, professional, ready to archive.' },
            ].map((s,i) => (
              <div key={i} className="step">
                <div className="step-rule"/>
                <div className="step-num">{s.n}</div>
                <div className="step-title">{s.t}</div>
                <div className="step-desc">{s.d}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section className="section">
        <div className="container">
          <div className="section-header">
            <div className="section-label">Testimonials</div>
            <h2 className="section-title">Trusted by teams who<br/>care about clarity</h2>
          </div>
          <div className="testi-grid">
            {[
              { q:'"Finally a review tool that feels like sketching on a whiteboard. Clients actually understand our feedback now."', name:'Sarah M.', role:'Product Designer' },
              { q:'"We replaced three tools with Markly. The hand-drawn annotations with Virgil font feel personal and readable."', name:'Rohan K.', role:'Founder, legal-tech' },
              { q:'"Our architecture team reviews drawings daily. Free-form annotation is perfect — like sketching on paper but shareable."', name:'Jenna L.', role:'Senior Architect' },
            ].map((t,i) => (
              <div key={i} className="testi-card">
                <div className="testi-stars">{[...Array(5)].map((_,j) => <span key={j} className="testi-star">★</span>)}</div>
                <div className="testi-quote">{t.q}</div>
                <div className="testi-author">
                  <div className="testi-avatar">{t.name.split(' ').map(n=>n[0]).join('')}</div>
                  <div>
                    <div className="testi-name">{t.name}</div>
                    <div className="testi-role">{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRICING ── */}
      <section className="section" id="pricing">
        <div className="container">
          <div className="section-header">
            <div className="section-label">Pricing</div>
            <h2 className="section-title">Simple, honest pricing</h2>
            <p className="section-sub">Start free. Upgrade when you need more.</p>
          </div>
          <div className="pricing-grid">
            {[
              { name:'Free', price:'$0', desc:'Perfect for individuals.', featured:false,
                features:[{y:true,t:'3 documents / month'},{y:true,t:'All annotation tools'},{y:true,t:'Shareable links'},{y:false,t:'PDF export'}] },
              { name:'Pro', price:'$12', desc:'For professionals and small teams.', featured:true,
                features:[{y:true,t:'Unlimited documents'},{y:true,t:'All annotation tools'},{y:true,t:'PDF export'},{y:true,t:'Custom permissions'}] },
              { name:'Team', price:'$39', desc:'Everything for growing teams.', featured:false,
                features:[{y:true,t:'Up to 15 members'},{y:true,t:'Shared workspaces'},{y:true,t:'Admin controls'},{y:true,t:'Priority support'}] },
            ].map((p,i) => (
              <div key={i} className={`price-card${p.featured?' featured':''}`}>
                {p.featured && <div className="price-popular">Most popular</div>}
                <div>
                  <div className="price-plan">{p.name}</div>
                  <div className="price-amount">{p.price} <span className="price-per">/ mo</span></div>
                  <div className="price-desc" style={{marginTop:10}}>{p.desc}</div>
                </div>
                <div className="price-divider"/>
                <ul className="price-features">
                  {p.features.map((f,j) => (
                    <li key={j} className="price-feat" style={{opacity:f.y?1:.38}}>
                      <span className="price-feat-icon">
                        <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                          {f.y ? <polyline points="20 6 9 17 4 12"/> : <><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></>}
                        </svg>
                      </span>
                      {f.t}
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => router.push(isAuthed ? '/dashboard' : '/signup')}
                  className="btn btn-primary"
                  style={{
                    justifyContent:'center', width:'100%', borderRadius:10,
                    background: p.featured ? 'var(--accent-fg)' : 'var(--accent)',
                    color: p.featured ? 'var(--text)' : 'var(--accent-fg)',
                    padding:'11px 0',
                  }}
                >
                  {isAuthed ? 'Open dashboard' : (p.featured ? 'Start Pro free' : 'Get started')}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <div className="cta-wrap">
        <div className="container">
          <div className="cta-block">
            <div className="cta-inner">
              <h2 className="cta-title">Start reviewing smarter.</h2>
              <p className="cta-sub">Create your workspace, upload PDFs, and share public review links in under 30 seconds.</p>
              <div className="cta-actions">
                <button onClick={() => router.push(isAuthed ? '/dashboard' : '/signup')} className="btn btn-lg" style={{background:'var(--accent-fg)',color:'var(--text)',border:'none'}}>
                  {isAuthed ? 'Open your workspace' : 'Create free account'}
                </button>
                <button className="btn btn-lg" style={{background:'transparent',color:'var(--accent-fg)',border:'1px solid color-mix(in srgb,var(--accent-fg) 25%,transparent)'}}>
                  View example review →
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── FOOTER ── */}
      <footer className="footer">
        <div className="container">
          <div className="footer-grid">
            <div>
              <a href="/" className="footer-brand">
              <div style={{display:'flex',alignItems:'center',justifyContent:'center',width:32,height:32}}>
  <svg width="32" height="32" viewBox="0 0 40 40" fill="none">
    <path d="M20 6 L8 6 L8 20" stroke="var(--text)" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M20 34 L32 34 L32 20" stroke="var(--text)" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round"/>
    <circle cx="20" cy="20" r="3.5" fill="var(--text)"/>
    <path d="M13 20 Q17 18 20 20 Q23 22 27 20" stroke="var(--text)" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
  </svg>
</div>
                <span className="footer-brand-text">Markly</span>
              </a>
              <p className="footer-tagline">Excalidraw for Documents. Visual feedback for any PDF — draw, annotate, share.</p>
            </div>
            {[
              { h:'Product', links:['Features','Pricing','Changelog','Roadmap'] },
              { h:'Resources', links:['Documentation','API Reference','Blog','Status'] },
              { h:'Company', links:['About','Twitter / X','GitHub','Contact'] },
            ].map(col => (
              <div key={col.h} className="footer-col">
                <h4>{col.h}</h4>
                <ul>{col.links.map(l => <li key={l}><a href="#">{l}</a></li>)}</ul>
              </div>
            ))}
          </div>
          <div className="footer-bottom">
            <span>© 2025 Markly. All rights reserved.</span>
            <div className="footer-bottom-links">
              <a href="#">Privacy</a>
              <a href="#">Terms</a>
              <a href="#">Cookies</a>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}
