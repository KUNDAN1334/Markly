'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

/* ── THEME HOOK ── */
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

export default function LandingPage() {
  const router = useRouter();
  const { theme, toggle } = useTheme();

  return (
    <>
      <style>{`
        /* ── TOKENS (duplicated for SSR safety) ── */
        :root {
          --bg:#fafaf9;--bg-2:#f4f4f2;--bg-card:#ffffff;
          --border:#e4e4e0;--border-strong:#c8c8c4;
          --text:#0d0d0c;--text-2:#5a5a58;--text-3:#9a9a96;
          --accent:#0d0d0c;--accent-fg:#fafaf9;
          --badge-bg:#f0f0ee;--badge-border:#d8d8d4;
          --shadow-sm:0 1px 3px rgba(0,0,0,.07);
          --shadow-md:0 4px 16px rgba(0,0,0,.08);
          --shadow-lg:0 12px 40px rgba(0,0,0,.10);
        }
        [data-theme="dark"] {
          --bg:#0c0c0b;--bg-2:#161614;--bg-card:#1a1a18;
          --border:#2a2a28;--border-strong:#3e3e3a;
          --text:#f4f4f0;--text-2:#a8a8a4;--text-3:#606060;
          --accent:#f4f4f0;--accent-fg:#0c0c0b;
          --badge-bg:#222220;--badge-border:#333330;
          --shadow-lg:0 12px 40px rgba(0,0,0,.5);
        }
        .lp-body { font-family:'Instrument Sans',sans-serif; background:var(--bg); color:var(--text); }
        /* NAV */
        .lp-nav {
          position:sticky;top:0;z-index:100;
          background:color-mix(in srgb,var(--bg) 85%,transparent);
          backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px);
          border-bottom:1px solid var(--border);
        }
        .lp-nav-inner {
          max-width:1100px;margin:0 auto;padding:0 24px;
          display:flex;align-items:center;height:72px;gap:20px;
        }
        .lp-logo { display:flex;align-items:center;gap:8px;text-decoration:none;flex:1; }
        .lp-logo-mark {
          width:28px;height:28px;background:var(--accent);border-radius:6px;
          display:flex;align-items:center;justify-content:center;
        }
        .lp-logo-text { font-family:'DM Serif Display',serif;font-size:22px;font-weight:700;color:var(--text);letter-spacing:-.01em; }        .lp-nav-links { display:flex;gap:4px;list-style:none;padding:0;margin:0; }
        .lp-nav-links a {
          padding:6px 12px;border-radius:8px;font-size:14px;color:var(--text-2);
          text-decoration:none;transition:all .15s;
        }
        .lp-nav-links a:hover { color:var(--text);background:var(--bg-2); }
        /* BADGE */
        .lp-badge {
          display:inline-flex;align-items:center;gap:6px;
          padding:4px 12px;border-radius:999px;
          background:var(--badge-bg);border:1px solid var(--badge-border);
          font-size:12px;font-weight:500;color:var(--text-2);
        }
        .lp-badge-dot { width:6px;height:6px;border-radius:50%;background:var(--text);flex-shrink:0; }
        /* BUTTONS */
        .lp-btn {
          display:inline-flex;align-items:center;gap:8px;
          padding:10px 20px;border-radius:10px;font-size:14px;font-weight:500;
          cursor:pointer;transition:all .18s;text-decoration:none;border:1px solid transparent;
          font-family:'Instrument Sans',sans-serif;
        }
        .lp-btn-primary { background:var(--accent);color:var(--accent-fg);border-color:var(--accent); }
        .lp-btn-primary:hover { opacity:.82;transform:translateY(-1px);box-shadow:var(--shadow-md); }
        .lp-btn-secondary { background:transparent;color:var(--text);border-color:var(--border-strong); }
        .lp-btn-secondary:hover { background:var(--bg-2);transform:translateY(-1px); }
        .lp-btn-lg { padding:13px 28px;font-size:15px; }
        /* THEME TOGGLE */
        .lp-theme-toggle {
          width:38px;height:38px;border-radius:8px;cursor:pointer;
          display:flex;align-items:center;justify-content:center;
          background:var(--bg-2);border:1px solid var(--border);
          color:var(--text-2);transition:all .18s;
        }
        .lp-theme-toggle:hover { background:var(--bg-card);color:var(--text);border-color:var(--border-strong); }
        /* CONTAINER */
        .lp-container { max-width:1100px;margin:0 auto;padding:0 24px;position:relative;z-index:1; }
        /* HERO */
        .lp-hero { padding:96px 0 80px;display:flex;flex-direction:column;align-items:center;text-align:center;gap:28px; }
        .lp-hero-title { font-family:'DM Serif Display',serif;font-size:clamp(42px,7vw,76px);line-height:1.06;letter-spacing:-.03em;color:var(--text);max-width:820px; }
        .lp-hero-title em { font-style:italic;color:var(--text-2); }
        .lp-hero-sub { font-size:17px;color:var(--text-2);max-width:500px;line-height:1.65;font-weight:400; }
        /* MOCKUP */
        .lp-mockup-window {
          background:var(--bg-card);border:1px solid var(--border);
          border-radius:16px;box-shadow:var(--shadow-lg);overflow:hidden;
        }
        .lp-mockup-bar {
          background:var(--bg-2);border-bottom:1px solid var(--border);
          padding:12px 16px;display:flex;align-items:center;gap:12px;
        }
        .lp-mockup-url {
          flex:1;background:var(--bg);border:1px solid var(--border);
          border-radius:6px;padding:4px 12px;font-family:'DM Mono',monospace;
          font-size:11px;color:var(--text-3);
        }
        .lp-editor-mock { display:flex;height:420px; }
        .lp-editor-sidebar {
          width:52px;border-right:1px solid var(--border);background:var(--bg-2);
          display:flex;flex-direction:column;align-items:center;padding:12px 0;gap:6px;
        }
        .lp-tool-btn {
          width:36px;height:36px;border-radius:8px;display:flex;align-items:center;justify-content:center;
          color:var(--text-3);cursor:pointer;font-size:13px;border:none;background:transparent;transition:all .15s;
        }
        .lp-tool-btn.active { background:var(--accent);color:var(--accent-fg); }
        .lp-tool-btn:not(.active):hover { background:var(--border);color:var(--text); }
        .lp-tool-sep { width:28px;height:1px;background:var(--border);margin:4px 0; }
        .lp-editor-canvas { flex:1;position:relative;overflow:hidden;background:var(--bg); }
        .lp-pdf-page {
          position:absolute;top:24px;left:50%;transform:translateX(-50%);
          width:300px;background:white;box-shadow:var(--shadow-md);border-radius:4px;
          padding:28px 28px 36px;
        }
        [data-theme="dark"] .lp-pdf-page { background:#1e1e1c; }
        .lp-pdf-line { height:8px;background:var(--border);border-radius:2px;margin-bottom:10px; }
        .lp-pdf-line.title { height:14px;width:70%;margin-bottom:20px;background:var(--border-strong); }
        .lp-pdf-line.med { width:80%; }
        .lp-pdf-line.short { width:60%; }
        .lp-anno-rect { position:absolute;border:2px solid;border-radius:3px; }
        .lp-anno-text { position:absolute;font-family:'Virgil',cursive;font-size:13px;color:#e74c3c;white-space:nowrap;pointer-events:none; }
        .lp-anno-highlight { position:absolute;height:8px;border-radius:2px;opacity:.35; }
        .lp-editor-panel {
          width:200px;border-left:1px solid var(--border);background:var(--bg-card);
          padding:16px;font-size:12px;display:flex;flex-direction:column;gap:16px;
        }
        .lp-panel-label { font-size:10px;font-weight:600;letter-spacing:.08em;text-transform:uppercase;color:var(--text-3); }
        .lp-color-swatch { width:20px;height:20px;border-radius:4px;border:1px solid var(--border);cursor:pointer; }
        .lp-panel-input {
          flex:1;background:var(--bg-2);border:1px solid var(--border);border-radius:6px;
          padding:5px 8px;font-size:11px;color:var(--text);font-family:'DM Mono',monospace;
        }
        .lp-panel-comment {
          background:var(--bg-2);border:1px solid var(--border);
          border-radius:8px;padding:10px;display:flex;flex-direction:column;gap:6px;
        }
        .lp-comment-avatar {
          width:20px;height:20px;border-radius:50%;background:var(--text);
          display:inline-flex;align-items:center;justify-content:center;
          font-size:9px;color:var(--accent-fg);flex-shrink:0;font-family:'Instrument Sans',sans-serif;
        }
        /* SECTIONS */
        .lp-section { padding:96px 0;border-top:1px solid var(--border); }
        .lp-section-header { text-align:center;margin-bottom:56px; }
        .lp-section-title { font-family:'DM Serif Display',serif;font-size:clamp(28px,4vw,42px);letter-spacing:-.025em;line-height:1.1;margin-bottom:14px;color:var(--text); }
        .lp-section-sub { color:var(--text-2);max-width:460px;margin:0 auto;font-size:15px; }
        /* FEATURES GRID */
        .lp-features-grid {
          display:grid;grid-template-columns:repeat(3,1fr);gap:1px;
          background:var(--border);border:1px solid var(--border);border-radius:16px;overflow:hidden;
        }
        .lp-feat-card { background:var(--bg-card);padding:36px 32px;display:flex;flex-direction:column;gap:16px;transition:background .2s; }
        .lp-feat-card:hover { background:var(--bg-2); }
        .lp-feat-icon {
          width:44px;height:44px;border-radius:10px;border:1px solid var(--border);
          background:var(--bg-2);display:flex;align-items:center;justify-content:center;
          color:var(--text);transition:all .2s;
        }
        .lp-feat-card:hover .lp-feat-icon { background:var(--text);color:var(--accent-fg); }
        .lp-feat-title { font-weight:600;font-size:15px;letter-spacing:-.01em;color:var(--text); }
        .lp-feat-desc { font-size:13.5px;color:var(--text-2);line-height:1.6; }
        /* STEPS */
        .lp-steps { display:grid;grid-template-columns:repeat(4,1fr);gap:24px; }
        .lp-step { display:flex;flex-direction:column;gap:16px; }
        .lp-step-line { height:1px;background:linear-gradient(to right,var(--text) 0%,var(--border) 100%);margin-bottom:4px; }
        .lp-step-num { font-family:'DM Mono',monospace;font-size:11px;color:var(--text-3);letter-spacing:.06em; }
        .lp-step-title { font-weight:600;font-size:15px;color:var(--text); }
        .lp-step-desc { font-size:13px;color:var(--text-2);line-height:1.6; }
        /* TESTIMONIALS */
        .lp-testi-grid { display:grid;grid-template-columns:repeat(3,1fr);gap:16px; }
        .lp-testi-card {
          background:var(--bg-card);border:1px solid var(--border);border-radius:16px;
          padding:28px;display:flex;flex-direction:column;gap:20px;box-shadow:var(--shadow-sm);
        }
        .lp-testi-quote { font-size:14px;color:var(--text-2);line-height:1.7; }
        .lp-testi-avatar { width:36px;height:36px;border-radius:50%;background:var(--bg-2);border:1px solid var(--border);display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:600;color:var(--text-2); }
        /* PRICING */
        .lp-pricing-grid { display:grid;grid-template-columns:repeat(3,1fr);gap:16px;max-width:860px;margin:0 auto; }
        .lp-price-card {
          background:var(--bg-card);border:1px solid var(--border);border-radius:16px;
          padding:32px 28px;display:flex;flex-direction:column;gap:24px;
          box-shadow:var(--shadow-sm);position:relative;
        }
        .lp-price-card.featured { background:var(--text);color:var(--accent-fg);border-color:var(--text); }
        .lp-featured-badge {
          position:absolute;top:-12px;left:50%;transform:translateX(-50%);
          background:var(--accent-fg);color:var(--text);padding:3px 12px;border-radius:999px;
          font-size:11px;font-weight:600;letter-spacing:.04em;border:1px solid var(--border);
        }
        [data-theme="dark"] .lp-featured-badge { background:var(--text);color:var(--accent-fg);border-color:var(--border-strong); }
        .lp-price-amount { font-family:'DM Serif Display',serif;font-size:42px;letter-spacing:-.03em;line-height:1; }
        .lp-price-period { font-size:13px;opacity:.6;font-weight:400;font-family:'Instrument Sans',sans-serif; }
        .lp-price-features { display:flex;flex-direction:column;gap:10px;list-style:none;padding:0;margin:0; }
        .lp-price-feature { display:flex;align-items:center;gap:10px;font-size:13px;color:var(--text-2); }
        .lp-price-card.featured .lp-price-feature { color:color-mix(in srgb,var(--accent-fg) 65%,transparent); }
        .lp-price-card.featured hr { border-color:color-mix(in srgb,var(--accent-fg) 20%,transparent); }
        /* CTA */
        .lp-cta-strip {
          margin:0 0 96px;background:var(--text);color:var(--accent-fg);
          border-radius:16px;padding:72px 48px;text-align:center;position:relative;overflow:hidden;
        }
        .lp-cta-strip::before {
          content:'';position:absolute;inset:0;
          background:repeating-linear-gradient(-45deg,transparent,transparent 20px,color-mix(in srgb,var(--accent-fg) 3%,transparent) 20px,color-mix(in srgb,var(--accent-fg) 3%,transparent) 21px);
        }
        .lp-cta-inner { position:relative;z-index:1; }
        .lp-cta-title { font-family:'DM Serif Display',serif;font-size:clamp(28px,4vw,48px);letter-spacing:-.03em;margin-bottom:14px; }
        /* FOOTER */
        footer.lp-footer { border-top:1px solid var(--border);padding:48px 0 40px; }
        .lp-footer-inner { display:grid;grid-template-columns:1.5fr repeat(3,1fr);gap:40px; }
        .lp-footer-tagline { font-size:13px;color:var(--text-3);line-height:1.6;max-width:220px; }
        .lp-footer-col h4 { font-size:12px;font-weight:600;letter-spacing:.06em;text-transform:uppercase;color:var(--text-3);margin-bottom:14px; }
        .lp-footer-col ul { list-style:none;padding:0;margin:0;display:flex;flex-direction:column;gap:8px; }
        .lp-footer-col a { font-size:13px;color:var(--text-2);text-decoration:none;transition:color .15s; }
        .lp-footer-col a:hover { color:var(--text); }
        .lp-footer-bottom { margin-top:40px;padding-top:20px;border-top:1px solid var(--border);display:flex;justify-content:space-between;align-items:center;font-size:12px;color:var(--text-3); }
        /* FADE ANIM */
        @keyframes lp-fadeUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
        .lp-fade-up { animation:lp-fadeUp .6s ease both; }
        .lp-delay-1 { animation-delay:.1s; } .lp-delay-2 { animation-delay:.2s; }
        .lp-delay-3 { animation-delay:.3s; } .lp-delay-4 { animation-delay:.4s; }
        /* RESPONSIVE */
        @media(max-width:900px){
          .lp-features-grid,.lp-testi-grid,.lp-pricing-grid{grid-template-columns:1fr 1fr}
          .lp-steps{grid-template-columns:1fr 1fr}
          .lp-footer-inner{grid-template-columns:1fr 1fr}
          .lp-editor-panel{display:none}
          .lp-nav-links{display:none}
        }
        @media(max-width:600px){
          .lp-features-grid,.lp-testi-grid,.lp-pricing-grid,.lp-steps{grid-template-columns:1fr}
          .lp-footer-inner{grid-template-columns:1fr}
          .lp-cta-strip{padding:48px 24px}
          .lp-hero{padding:64px 0 48px}
        }
        /* Virgil font for hand-drawn text */
        @font-face {
          font-family: 'Virgil';
          src: url('https://excalidraw.com/Virgil.woff2') format('woff2');
          font-display: swap;
        }
      `}</style>

      <div className="lp-body">

        {/* ── NAV ── */}
        <nav className="lp-nav">
          <div className="lp-nav-inner">
            <a href="/" className="lp-logo">
            <div style={{display:'flex',alignItems:'center',justifyContent:'center',width:32,height:32}}>
                <svg width="32" height="32" viewBox="0 0 40 40" fill="none">
                  <path d="M20 6 L8 6 L8 20" stroke="var(--text)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M20 34 L32 34 L32 20" stroke="var(--text)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
                  <circle cx="20" cy="20" r="3" fill="var(--text)"/>
                  <path d="M13 20 Q17 18 20 20 Q23 22 27 20" stroke="var(--text)" strokeWidth="1.2" fill="none" strokeLinecap="round"/>
                </svg>
            </div>
              <span className="lp-logo-text">Markly</span>
            </a>
            <ul className="lp-nav-links">
              <li><a href="#features">Features</a></li>
              <li><a href="#how">How it works</a></li>
              <li><a href="#pricing">Pricing</a></li>
            </ul>
            <div style={{display:'flex',alignItems:'center',gap:10}}>
              <button className="lp-theme-toggle" onClick={toggle} aria-label="Toggle theme">
                {theme === 'light'
                  ? <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
                  : <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M4.93 4.93l1.41 1.41m11.32 11.32 1.41 1.41M2 12h2m16 0h2M4.93 19.07l1.41-1.41m11.32-11.32 1.41-1.41"/></svg>
                }
              </button>
              <button onClick={() => router.push('/dashboard')} className="lp-btn lp-btn-secondary" style={{padding:'7px 16px',fontSize:13}}>Dashboard</button>
              <button onClick={() => router.push('/dashboard')} className="lp-btn lp-btn-primary" style={{padding:'7px 16px',fontSize:13}}>Get started free</button>
            </div>
          </div>
        </nav>

        {/* ── HERO ── */}
        <section className="lp-hero">
          <div className="lp-container" style={{display:'flex',flexDirection:'column',alignItems:'center',gap:28}}>
            <h1 className="lp-hero-title lp-fade-up lp-delay-1">
              Annotate documents<br/><em>like an artist</em>
            </h1>
            <p className="lp-hero-sub lp-fade-up lp-delay-2">
              Markly brings the fluidity of Excalidraw to your PDFs. Draw, write, and comment directly on documents — then share in one click.
            </p>
            <div className="lp-fade-up lp-delay-3" style={{display:'flex',gap:10,flexWrap:'wrap',justifyContent:'center'}}>
              <button onClick={() => router.push('/dashboard')} className="lp-btn lp-btn-primary lp-btn-lg">
                <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                Upload a PDF
              </button>
              <button className="lp-btn lp-btn-secondary lp-btn-lg">
                Watch demo
                <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polygon points="5 3 19 12 5 21 5 3"/></svg>
              </button>
            </div>

            {/* ── EDITOR MOCKUP ── */}
            <div className="lp-fade-up lp-delay-4" style={{marginTop:32,width:'100%',maxWidth:900}}>
              <div className="lp-mockup-window">
                <div className="lp-mockup-bar">
                  <div style={{display:'flex',gap:6}}>
                    <div style={{width:10,height:10,borderRadius:'50%',background:'#ff5f56'}}/>
                    <div style={{width:10,height:10,borderRadius:'50%',background:'#ffbd2e'}}/>
                    <div style={{width:10,height:10,borderRadius:'50%',background:'#27c93f'}}/>
                  </div>
                  <div className="lp-mockup-url">markly.app/review/7bfa61e8-b98f</div>
                  <div style={{display:'flex',gap:8,marginLeft:'auto'}}>
                    <div style={{width:60,height:22,background:'var(--bg)',border:'1px solid var(--border)',borderRadius:4,fontSize:10,display:'flex',alignItems:'center',justifyContent:'center',color:'var(--text-3)',fontFamily:"'DM Mono',monospace"}}>Share</div>
                    <div style={{width:60,height:22,background:'var(--text)',borderRadius:4,fontSize:10,display:'flex',alignItems:'center',justifyContent:'center',color:'var(--accent-fg)',fontFamily:"'DM Mono',monospace"}}>Export</div>
                  </div>
                </div>
                <div className="lp-editor-mock">
                  {/* TOOLBAR */}
                  <div className="lp-editor-sidebar">
                    {[
                      <svg key="s" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M5 3l14 9-7 1-4 7z"/></svg>,
                      <span key="t" style={{fontFamily:"'DM Serif Display',serif",fontSize:14,fontStyle:'italic'}}>T</span>,
                      <svg key="r" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="1"/></svg>,
                      <svg key="c" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/></svg>,
                      <svg key="a" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M5 12h14M13 6l6 6-6 6"/></svg>,
                    ].map((icon, i) => (
                      <button key={i} className={`lp-tool-btn${i===1?' active':''}`}>{icon}</button>
                    ))}
                    <div className="lp-tool-sep"/>
                    <button className="lp-tool-btn">
                      <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M3 17c3-3 5-5 8-5s5 5 8-1"/></svg>
                    </button>
                    <button className="lp-tool-btn">
                      <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M9 7l6 0M9 11h6M9 15h4" strokeLinecap="round"/></svg>
                    </button>
                    <div className="lp-tool-sep"/>
                    <button className="lp-tool-btn">
                      <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                    </button>
                  </div>

                  {/* CANVAS WITH PDF + EXCALIDRAW ANNOTATIONS */}
                  <div className="lp-editor-canvas">
                    <div className="lp-pdf-page">
                      <div className="lp-pdf-line title"/>
                      <div className="lp-pdf-line"/>
                      <div className="lp-pdf-line med"/>
                      <div className="lp-pdf-line short"/>
                      <div className="lp-pdf-line"/>
                      <div className="lp-pdf-line med"/>
                      <div className="lp-pdf-line" style={{marginTop:16}}/>
                      <div className="lp-pdf-line"/>
                      <div className="lp-pdf-line short"/>
                      <div className="lp-pdf-line med"/>
                      <div className="lp-pdf-line"/>
                    </div>
                    {/* Hand-drawn annotations using Virgil font */}
                    <div className="lp-anno-rect" style={{left:'calc(50% - 162px)',top:80,width:136,height:48,borderColor:'#e74c3c',borderStyle:'dashed'}}/>
                    <div className="lp-anno-text" style={{left:'calc(50% - 156px)',top:60,fontFamily:"'Virgil',cursive",fontSize:13}}>Review this!</div>
                    <div className="lp-anno-highlight" style={{left:'calc(50% - 162px)',top:174,width:200,background:'#f1c40f'}}/>
                    <div className="lp-anno-rect" style={{left:'calc(50% + 10px)',top:120,width:90,height:32,borderColor:'#2ecc71'}}/>
                    <div className="lp-anno-text" style={{left:'calc(50% + 14px)',top:155,color:'#2ecc71',fontFamily:"'Virgil',cursive",fontSize:12}}>Looks good ✓</div>
                    {/* SVG arrow - hand drawn style */}
                    <svg style={{position:'absolute',left:'calc(50% - 170px)',top:90,pointerEvents:'none'}} width="60" height="40">
                      <path d="M10,35 Q30,10 50,20" stroke="#e74c3c" strokeWidth="2" fill="none" strokeDasharray="4,2"/>
                      <polygon points="48,15 55,22 44,24" fill="#e74c3c"/>
                    </svg>
                  </div>

                  {/* PROPERTIES PANEL */}
                  <div className="lp-editor-panel">
                    <div style={{display:'flex',flexDirection:'column',gap:8}}>
                      <div className="lp-panel-label">Stroke color</div>
                      <div style={{display:'flex',gap:6,alignItems:'center'}}>
                        {['#e74c3c','#2ecc71','#f1c40f','var(--text)'].map((c,i) => (
                          <div key={i} className="lp-color-swatch" style={{background:c}}/>
                        ))}
                      </div>
                    </div>
                    <div style={{display:'flex',flexDirection:'column',gap:8}}>
                      <div className="lp-panel-label">Font</div>
                      <div style={{fontSize:11,color:'var(--text-2)',fontFamily:"'Virgil',cursive",background:'var(--bg-2)',border:'1px solid var(--border)',borderRadius:6,padding:'5px 8px'}}>Virgil (hand-drawn)</div>
                    </div>
                    <div style={{display:'flex',flexDirection:'column',gap:8}}>
                      <div className="lp-panel-label">Opacity</div>
                      <input className="lp-panel-input" value="100%" readOnly/>
                    </div>
                    <div style={{marginTop:'auto',display:'flex',flexDirection:'column',gap:8}}>
                      <div className="lp-panel-label">Comment</div>
                      <div className="lp-panel-comment">
                        <div style={{display:'flex',gap:8,alignItems:'flex-start'}}>
                          <div className="lp-comment-avatar">AR</div>
                          <div>
                            <div style={{fontSize:11,color:'var(--text-2)',lineHeight:1.5}}>"Please review highlighted section"</div>
                            <div style={{fontSize:10,color:'var(--text-3)',marginTop:3}}>2 min ago · Resolved</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* SOCIAL PROOF */}
              <div style={{display:'flex',alignItems:'center',justifyContent:'center',gap:24,marginTop:24,flexWrap:'wrap'}}>
                {['No sign-up required','Share via link','Export as PDF'].map((t) => (
                  <div key={t} style={{display:'flex',alignItems:'center',gap:8,fontSize:13,color:'var(--text-3)'}}>
                    <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>
                    {t}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── FEATURES ── */}
        <section className="lp-section" id="features">
          <div className="lp-container">
            <div className="lp-section-header">
              <div className="lp-badge" style={{marginBottom:16}}>
                <span className="lp-badge-dot"/>Built for real workflows
              </div>
              <h2 className="lp-section-title">Everything you need to<br/>review documents visually</h2>
              <p className="lp-section-sub">From quick annotations to full-scale document reviews — Markly gives your team a shared visual language.</p>
            </div>
            <div className="lp-featureis-grid">
              {[
                { icon: <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>, title: 'Hand-drawn annotations', desc: 'Excalidraw-style shapes with Virgil font — sketch-like text and doodles that feel natural and expressive.' },
                { icon: <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>, title: 'Multi-page PDF support', desc: 'Navigate long documents with page thumbnails. Annotations stay perfectly positioned at any zoom level.' },
                { icon: <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg>, title: 'One-click sharing', desc: 'No accounts needed. Share a link with view, comment, or edit access. Works instantly for anyone.' },
                { icon: <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>, title: 'Threaded comments', desc: 'Attach comments to specific annotations or pages. Resolve, reply, and track feedback inline.' },
                { icon: <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>, title: 'Auto-save & undo/redo', desc: 'Debounce autosave + full history. Ctrl+Z / Ctrl+Y work just like Excalidraw.' },
                { icon: <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>, title: 'Export annotated PDF', desc: 'Download the final PDF with all annotations baked in. Original file stays untouched.' },
              ].map((f,i) => (
                <div key={i} className="lp-feat-card">
                  <div className="lp-feat-icon">{f.icon}</div>
                  <div>
                    <div className="lp-feat-title">{f.title}</div>
                    <div className="lp-feat-desc" style={{marginTop:6}}>{f.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── HOW IT WORKS ── */}
        <section className="lp-section" id="how">
          <div className="lp-container">
            <div className="lp-section-header">
              <h2 className="lp-section-title">Four steps to better<br/>document reviews</h2>
              <p className="lp-section-sub">From upload to sign-off — Markly streamlines your entire review workflow.</p>
            </div>
            <div className="lp-steps">
              {[
                { n:'01', t:'Upload your PDF', d:'Drag and drop any PDF. Rendered with pdf.js — multi-page, high-fidelity, instant.' },
                { n:'02', t:'Annotate visually', d:'Draw shapes, write with Virgil font, highlight sections — hand-drawn feel on every annotation.' },
                { n:'03', t:'Share the link', d:'Send a secure link. Your reviewer opens it instantly — no account, no download needed.' },
                { n:'04', t:'Export & close', d:'Download the annotated PDF for your records. Clean, professional, ready to archive.' },
              ].map((s,i) => (
                <div key={i} className="lp-step">
                  <div className="lp-step-line"/>
                  <div className="lp-step-num">{s.n}</div>
                  <div className="lp-step-title">{s.t}</div>
                  <div className="lp-step-desc">{s.d}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── TESTIMONIALS ── */}
        <section className="lp-section">
          <div className="lp-container">
            <div className="lp-section-header">
              <h2 className="lp-section-title">Trusted by teams who<br/>care about clarity</h2>
            </div>
            <div className="lp-testi-grid">
              {[
                { q: '"Finally a review tool that feels like sketching on a whiteboard. Clients actually understand our feedback now."', name:'Sarah M.', role:'Product Designer' },
                { q: '"We replaced three tools with Markly. The hand-drawn annotations with Virgil font feel personal and readable."', name:'Rohan K.', role:'Founder, legal-tech' },
                { q: '"Our architecture team reviews drawings daily. Free-form annotation is perfect — like sketching on paper but shareable."', name:'Jenna L.', role:'Senior Architect' },
              ].map((t,i) => (
                <div key={i} className="lp-testi-card">
                  <div className="lp-testi-quote">{t.q}</div>
                  <div style={{display:'flex',alignItems:'center',gap:12}}>
                    <div className="lp-testi-avatar">{t.name.split(' ').map(n=>n[0]).join('')}</div>
                    <div>
                      <div style={{fontSize:13,fontWeight:600,color:'var(--text)'}}>{t.name}</div>
                      <div style={{fontSize:11,color:'var(--text-3)'}}>{t.role}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── PRICING ── */}
        <section className="lp-section" id="pricing">
          <div className="lp-container">
            <div className="lp-section-header">
              <h2 className="lp-section-title">Simple, honest pricing</h2>
              <p className="lp-section-sub">Start free. Upgrade when you need more.</p>
            </div>
            <div className="lp-pricing-grid">
              {[
                { name:'Free', price:'$0', desc:'Perfect for individuals.', featured:false,
                  features:[{y:true,t:'3 documents / month'},{y:true,t:'All annotation tools'},{y:true,t:'Shareable links'},{y:false,t:'PDF export'}] },
                { name:'Pro', price:'$12', desc:'For professionals and small teams.', featured:true,
                  features:[{y:true,t:'Unlimited documents'},{y:true,t:'All annotation tools'},{y:true,t:'PDF export'},{y:true,t:'Custom permissions'}] },
                { name:'Team', price:'$39', desc:'Everything for growing teams.', featured:false,
                  features:[{y:true,t:'Up to 15 members'},{y:true,t:'Shared workspaces'},{y:true,t:'Admin controls'},{y:true,t:'Priority support'}] },
              ].map((p,i) => (
                <div key={i} className={`lp-price-card${p.featured?' featured':''}`}>
                  {p.featured && <div className="lp-featured-badge">POPULAR</div>}
                  <div>
                    <div style={{fontSize:13,fontWeight:600,letterSpacing:'.04em',textTransform:'uppercase',opacity:p.featured?.6:1}}>{p.name}</div>
                    <div className="lp-price-amount">{p.price} <span className="lp-price-period">/ mo</span></div>
                    <div style={{fontSize:13,marginTop:8,color:p.featured?'color-mix(in srgb,var(--accent-fg) 65%,transparent)':'var(--text-2)'}}>{p.desc}</div>
                  </div>
                  <hr style={{border:'none',borderTop:'1px solid var(--border)'}}/>
                  <ul className="lp-price-features">
                    {p.features.map((f,j) => (
                      <li key={j} className="lp-price-feature" style={{opacity:f.y?1:.4}}>
                        <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          {f.y ? <polyline points="20 6 9 17 4 12"/> : <><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></>}
                        </svg>
                        {f.t}
                      </li>
                    ))}
                  </ul>
                  <button
                    onClick={() => router.push('/dashboard')}
                    className="lp-btn lp-btn-primary"
                    style={{
                      justifyContent:'center',width:'100%',
                      background: p.featured ? 'var(--accent-fg)' : 'var(--accent)',
                      color: p.featured ? 'var(--text)' : 'var(--accent-fg)',
                    }}
                  >
                    {p.featured ? 'Start Pro free' : 'Get started'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── CTA STRIP ── */}
        <div className="lp-container">
          <div className="lp-cta-strip">
            <div className="lp-cta-inner">
              <h2 className="lp-cta-title">Start reviewing smarter.</h2>
              <p style={{opacity:.65,maxWidth:440,margin:'0 auto 32px',fontSize:15}}>Upload your first document in under 30 seconds. No account needed.</p>
              <div style={{display:'flex',gap:10,justifyContent:'center',flexWrap:'wrap'}}>
                <button onClick={() => router.push('/dashboard')} className="lp-btn lp-btn-lg" style={{background:'var(--accent-fg)',color:'var(--text)',border:'none'}}>
                  Upload a PDF — it&apos;s free
                </button>
                <button className="lp-btn lp-btn-lg" style={{background:'transparent',color:'var(--accent-fg)',border:'1px solid color-mix(in srgb,var(--accent-fg) 30%,transparent)'}}>
                  View example review →
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ── FOOTER ── */}
        <footer className="lp-footer">
          <div className="lp-container">
            <div className="lp-footer-inner">
              <div>
                <a href="/" className="lp-logo" style={{marginBottom:12,display:'inline-flex'}}>
                  <div className="lp-logo-mark" style={{background:'transparent',border:'none'}}>
                      <svg width="32" height="32" viewBox="0 0 40 40" fill="none">
                         <path d="M20 6 L8 6 L8 20" stroke="var(--accent)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
                         <path d="M20 34 L32 34 L32 20" stroke="var(--accent)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
                         <circle cx="20" cy="20" r="3" fill="var(--accent)"/>
                        <path d="M13 20 Q17 18 20 20 Q23 22 27 20" stroke="var(--accent)" strokeWidth="1.2" fill="none" strokeLinecap="round"/>
                       </svg>
</div>
                  <span className="lp-logo-text">Markly</span>
                </a>
                <div className="lp-footer-tagline">Excalidraw for Documents. Visual feedback for any PDF — draw, annotate, share.</div>
              </div>
              {[
                { h:'Product', links:['Features','Pricing','Changelog','Roadmap'] },
                { h:'Resources', links:['Documentation','API Reference','Blog','Status'] },
                { h:'Company', links:['About','Twitter / X','GitHub','Contact'] },
              ].map((col) => (
                <div key={col.h} className="lp-footer-col">
                  <h4>{col.h}</h4>
                  <ul>{col.links.map(l => <li key={l}><a href="#">{l}</a></li>)}</ul>
                </div>
              ))}
            </div>
            <div className="lp-footer-bottom">
              <span>© 2025 Markly. All rights reserved.</span>
              <div style={{display:'flex',gap:20}}>
                <a href="#" style={{color:'var(--text-3)',textDecoration:'none'}}>Privacy</a>
                <a href="#" style={{color:'var(--text-3)',textDecoration:'none'}}>Terms</a>
              </div>
            </div>
          </div>
        </footer>

      </div>
    </>
  );
}
