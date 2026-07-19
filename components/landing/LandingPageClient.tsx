'use client';

import type { CSSProperties, ReactNode } from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import MorphLoader from '@/components/MorphLoader';

const REVIEW_URL = 'markly.app/review/7bfa61e8-b98f';

/* ────────────────────────────────────────────────────────────────────────────
   THEME
   Persisted under `markly-theme` and applied to <html data-theme> so the
   dashboard/editor stay in sync. Defaults to dark (the Verdigris palette).
──────────────────────────────────────────────────────────────────────────── */
function useTheme() {
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');

  useEffect(() => {
    const saved = (localStorage.getItem('markly-theme') as 'light' | 'dark' | null) || 'dark';
    setTheme(saved);
    document.documentElement.setAttribute('data-theme', saved);
  }, []);

  const toggle = useCallback(() => {
    setTheme((prev) => {
      const next = prev === 'light' ? 'dark' : 'light';
      document.documentElement.setAttribute('data-theme', next);
      localStorage.setItem('markly-theme', next);
      return next;
    });
  }, []);

  return { theme, toggle };
}

/* ────────────────────────────────────────────────────────────────────────────
   LOGO
──────────────────────────────────────────────────────────────────────────── */
function MarklyLogo({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" aria-hidden="true">
      <path d="M20 6 L8 6 L8 20" stroke="var(--text)" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M20 34 L32 34 L32 20" stroke="var(--text)" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="20" cy="20" r="3.5" fill="var(--text)" />
      <path d="M13 20 Q17 18 20 20 Q23 22 27 20" stroke="var(--text)" strokeWidth="1.5" fill="none" strokeLinecap="round" />
    </svg>
  );
}

const SunIcon = () => (
  <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2m0 16v2M4.93 4.93l1.41 1.41m11.32 11.32 1.41 1.41M2 12h2m16 0h2M4.93 19.07l1.41-1.41m11.32-11.32 1.41-1.41" />
  </svg>
);

const MoonIcon = () => (
  <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
  </svg>
);

const CheckIcon = () => (
  <svg width="16" height="16" fill="none" stroke="var(--gold)" strokeWidth="2.4" viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

/* ────────────────────────────────────────────────────────────────────────────
   CONTENT
──────────────────────────────────────────────────────────────────────────── */
const MARQUEE_NAMES = [
  { name: 'Fieldstone Legal', font: "'DM Serif Display',serif", size: '20px' },
  { name: 'ATELIER NORTH', font: "'DM Mono',monospace", size: '15px' },
  { name: 'Cornerline Architects', font: "'Instrument Sans',sans-serif", size: '17px' },
  { name: 'Hartley & Co', font: "'DM Serif Display',serif", size: '20px' },
  { name: 'MODU STUDIO', font: "'DM Mono',monospace", size: '15px' },
  { name: 'Beacon Labs', font: "'Instrument Sans',sans-serif", size: '17px' },
];

type FeatureItem = {
  t: string;
  d: string;
  icon: ReactNode;
  x: number;
  y: number;
  rotate: number;
  z: number;
  tintA: string;
  tintB: string;
  accent: string;
};

const featIcon = (children: ReactNode) => (
  <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
    {children}
  </svg>
);

const FEATURES: FeatureItem[] = [
  {
    t: 'Hand-drawn annotations',
    d: 'Excalidraw-style shapes and Virgil text. Marks that feel natural, not clinical.',
    icon: featIcon(<path d="M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />),
    x: 12, y: 52, rotate: -16, z: 1, tintA: '#fff9f0', tintB: '#f7ecd9', accent: '#c9a876',
  },
  {
    t: 'Multi-page PDF support',
    d: 'Navigate long documents with thumbnails. Annotations stay pinned at any zoom.',
    icon: featIcon(<><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /></>),
    x: 27, y: 72, rotate: -9, z: 2, tintA: '#f3faf6', tintB: '#e6f2ec', accent: '#7fb69a',
  },
  {
    t: 'One-click sharing',
    d: 'Share a link with view, comment, or edit access. Reviewers need no account.',
    icon: featIcon(<><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" /><polyline points="16 6 12 2 8 6" /><line x1="12" y1="2" x2="12" y2="15" /></>),
    x: 42, y: 46, rotate: -3, z: 3, tintA: '#f2f7fc', tintB: '#e4edf9', accent: '#7c96c2',
  },
  {
    t: 'Threaded comments',
    d: 'Attach comments to annotations or pages. Resolve, reply, and track feedback inline.',
    icon: featIcon(<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />),
    x: 58, y: 70, rotate: 4, z: 4, tintA: '#fdf3f3', tintB: '#f8e6e6', accent: '#d98a7f',
  },
  {
    t: 'Auto-save & undo/redo',
    d: 'Debounced autosave with full history. Ctrl+Z / Ctrl+Y, just like Excalidraw.',
    icon: featIcon(<><polyline points="23 6 13.5 15.5 8.5 10.5 1 18" /><polyline points="17 6 23 6 23 12" /></>),
    x: 73, y: 58, rotate: 11, z: 5, tintA: '#f8f5fc', tintB: '#efe6f8', accent: '#a888c9',
  },
  {
    t: 'Export annotated PDF',
    d: 'Download the final PDF with annotations baked in. The original stays untouched.',
    icon: featIcon(<><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></>),
    x: 88, y: 78, rotate: 17, z: 6, tintA: '#fffaf0', tintB: '#fbe8cd', accent: '#d1a44f',
  },
];

const STEPS = [
  { n: '01', t: 'Upload your PDF', d: 'Drag and drop any PDF. Rendered with pdf.js — multi-page, high-fidelity, instant.', meta: 'Drop file' },
  { n: '02', t: 'Annotate visually', d: 'Draw shapes, write in Virgil, highlight sections — a hand-drawn feel on every mark.', meta: 'Mark clearly' },
  { n: '03', t: 'Share the link', d: 'Send a secure link. Reviewers open it instantly — no account, no download.', meta: 'Send review' },
  { n: '04', t: 'Export & close', d: 'Download the annotated PDF for your records. Clean and ready to archive.', meta: 'Deliver final' },
];

const STEP_INTERVAL = 4200;

const TOOLS: { name: string; icon: ReactNode }[] = [
  { name: 'Rectangle', icon: <rect x="4" y="5" width="16" height="14" rx="1" /> },
  { name: 'Circle', icon: <circle cx="12" cy="12" r="8" /> },
  { name: 'Arrow', icon: <><path d="M5 19 19 5" /><path d="M11 5h8v8" /></> },
  { name: 'Line', icon: <path d="M4 20 20 4" /> },
  { name: 'Highlight', icon: <><path d="M9 11 4 16v4h4l5-5" /><path d="m9 11 6-6 4 4-6 6z" /></> },
  { name: 'Freehand', icon: <path d="M3 17c3-3 5-5 8-5s5 5 8-1" /> },
  { name: 'Text', icon: <><path d="M5 5h14" /><path d="M12 5v14" /></> },
];

const ACCESS_MODES = ['VIEW', 'COMMENT', 'EDIT'] as const;
type AccessMode = (typeof ACCESS_MODES)[number];

const ACCESS_CAPTIONS: Record<AccessMode, string> = {
  VIEW: 'Reviewers can read and zoom — nothing else.',
  COMMENT: 'Reviewers can leave threaded comments and reactions.',
  EDIT: 'Reviewers can draw and annotate alongside you.',
};

const FOOTER_COLS = [
  { h: 'Product', links: ['Features', 'Open source', 'Changelog', 'Roadmap'] },
  { h: 'Resources', links: ['Documentation', 'API Reference', 'Blog', 'Status'] },
  { h: 'Company', links: ['About', 'Twitter / X', 'GitHub', 'Contact'] },
];

/* ────────────────────────────────────────────────────────────────────────────
   SECTION: FEATURE NOTEBOOK CARDS
──────────────────────────────────────────────────────────────────────────── */
function NotebookFeatures() {
  const [hovered, setHovered] = useState<number | null>(null);
  const any = hovered !== null;

  return (
    <div className="lp-reveal lp-notebook" data-delay="150" onMouseLeave={() => setHovered(null)}>
      {FEATURES.map((f, i) => {
        const isH = hovered === i;
        const wrapStyle: CSSProperties = {
          position: 'absolute',
          left: `${f.x}%`,
          top: `${f.y}px`,
          width: 220,
          cursor: 'pointer',
          textAlign: 'left',
          transform: isH
            ? 'translateX(-50%) translateY(-14px) rotate(0deg) scale(1.03)'
            : `translateX(-50%) rotate(${f.rotate}deg)`,
          transformOrigin: 'center bottom',
          zIndex: isH ? 20 : f.z,
          opacity: any && !isH ? 0.48 : 1,
          filter: any && !isH ? 'blur(.2px)' : 'none',
          transition: 'transform .52s cubic-bezier(.22,1,.36,1), opacity .28s ease, filter .28s ease',
        };
        const innerStyle: CSSProperties = {
          display: 'grid',
          position: 'relative',
          minHeight: 220,
          padding: '50px 24px 14px 30px',
          border: `4px solid ${isH ? f.accent : '#111'}`,
          borderRadius: '14px 18px 16px 14px',
          background: `repeating-linear-gradient(to bottom, transparent 0 22px, rgba(0,0,0,0.08) 22px 24px), linear-gradient(160deg, ${f.tintA}, ${f.tintB})`,
          boxShadow: isH
            ? `0 10px 0 rgba(17,17,17,0.08), 0 22px 44px rgba(17,17,17,0.2), 0 0 0 3px color-mix(in srgb, ${f.accent} 22%, transparent)`
            : '0 10px 0 rgba(17,17,17,0.08), 0 18px 34px rgba(17,17,17,0.16)',
          overflow: 'hidden',
          transition: 'box-shadow .32s ease, border-color .32s ease',
        };

        return (
          <article key={f.t} style={wrapStyle} onMouseEnter={() => setHovered(i)}>
            <div style={innerStyle}>
              <div className="lp-nb-rings" aria-hidden="true">
                {Array.from({ length: 7 }).map((_, r) => <span key={r} />)}
              </div>
              <div
                className="lp-nb-pill"
                style={{ borderColor: isH ? f.accent : '#111', color: isH ? f.accent : '#111' }}
              >
                {`0${i + 1}`}
              </div>
              <div
                className="lp-nb-icon"
                style={{
                  background: `color-mix(in srgb, ${f.accent} ${isH ? 30 : 14}%, #fff)`,
                  transform: isH ? 'rotate(0deg) scale(1.06)' : 'rotate(-3deg)',
                }}
              >
                {f.icon}
              </div>
              <h3 className="lp-nb-title">{f.t}</h3>
              <p className="lp-nb-desc">{f.d}</p>
              <div className="lp-nb-lines" aria-hidden="true">
                <span /><span style={{ width: '84%' }} /><span style={{ width: '68%' }} />
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────────
   SECTION: HOW IT WORKS
──────────────────────────────────────────────────────────────────────────── */
function HowItWorks() {
  const [active, setActive] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      if (!document.hidden) setActive((a) => (a + 1) % STEPS.length);
    }, STEP_INTERVAL);
  }, []);

  useEffect(() => {
    startTimer();
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [startTimer]);

  function select(i: number) {
    setActive(i);
    startTimer();
  }

  return (
    <div className="lp-how-grid">
      <div className="lp-reveal lp-how-list">
        {STEPS.map((s, i) => {
          const isA = active === i;
          return (
            <div
              key={s.n}
              role="button"
              tabIndex={0}
              onClick={() => select(i)}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); select(i); } }}
              style={{
                display: 'flex', gap: 18, alignItems: 'flex-start', padding: '16px 20px',
                borderRadius: 16, cursor: 'pointer',
                border: `1px solid ${isA ? 'var(--border)' : 'transparent'}`,
                background: isA ? 'var(--card)' : 'transparent',
                boxShadow: isA ? 'var(--shMd)' : 'none',
                transition: 'all .35s cubic-bezier(.22,1,.36,1)',
              }}
            >
              <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 13, fontWeight: 500, color: isA ? 'var(--gold)' : 'var(--text3)', paddingTop: 3, transition: 'color .3s' }}>
                {s.n}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12 }}>
                  <div style={{ fontWeight: 600, fontSize: 17, letterSpacing: '-0.01em', color: 'var(--text)' }}>{s.t}</div>
                  <div className="lp-meta">{s.meta}</div>
                </div>
                <div style={{ maxHeight: isA ? 130 : 0, opacity: isA ? 1 : 0, overflow: 'hidden', transition: 'max-height .45s cubic-bezier(.22,1,.36,1), opacity .3s ease' }}>
                  <div style={{ fontSize: 13.5, color: 'var(--text2)', lineHeight: 1.6, marginTop: 6 }}>{s.d}</div>
                  <div style={{ height: 3, borderRadius: 999, background: 'var(--border)', marginTop: 14, overflow: 'hidden' }}>
                    <div style={isA
                      ? { height: '100%', background: 'var(--gold)', borderRadius: 999, animation: `barFill ${STEP_INTERVAL}ms linear both` }
                      : { height: '100%', width: '0%', background: 'var(--gold)', borderRadius: 999 }} />
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="lp-reveal lp-how-stage" data-delay="150">
        <div className="lp-how-stage-glow" />

        {active === 0 && (
          <div className="lp-stage-center">
            <div className="lp-dropzone">
              <div className="lp-mini-doc" style={{ animation: 'dropIn .9s cubic-bezier(.22,1,.36,1) both, floatY 6s ease-in-out 1.2s infinite' }}>
                <div style={{ height: 8, width: '65%', background: 'var(--borderS)', borderRadius: 2, marginBottom: 8 }} />
                <div style={{ height: 5, background: 'var(--border)', borderRadius: 2, marginBottom: 6 }} />
                <div style={{ height: 5, width: '80%', background: 'var(--border)', borderRadius: 2, marginBottom: 6 }} />
                <div style={{ height: 5, width: '55%', background: 'var(--border)', borderRadius: 2 }} />
              </div>
              <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 12, color: 'var(--text3)', animation: 'fadeUp .6s .5s both' }}>
                spec-v3.pdf · 2.4 MB
              </div>
            </div>
          </div>
        )}

        {active === 1 && (
          <div className="lp-stage-center">
            <div className="lp-annot-doc">
              <div style={{ height: 10, width: '64%', background: 'var(--borderS)', borderRadius: 2, marginBottom: 14 }} />
              <div style={{ height: 6, background: 'var(--border)', borderRadius: 2, marginBottom: 9 }} />
              <div style={{ height: 6, width: '84%', background: 'var(--border)', borderRadius: 2, marginBottom: 9 }} />
              <div style={{ position: 'relative', height: 6, background: 'var(--border)', borderRadius: 2, marginBottom: 9 }}>
                <div style={{ position: 'absolute', left: -3, top: -4, width: '70%', height: 14, background: 'var(--yellow)', opacity: 0.42, borderRadius: 3, transformOrigin: 'left center', animation: 'growW .7s cubic-bezier(.22,1,.36,1) 1.5s both' }} />
              </div>
              <div style={{ height: 6, width: '58%', background: 'var(--border)', borderRadius: 2, marginBottom: 9 }} />
              <div style={{ height: 6, width: '78%', background: 'var(--border)', borderRadius: 2 }} />
              <svg style={{ position: 'absolute', top: 44, left: 12, width: 200, height: 44, overflow: 'visible', pointerEvents: 'none' }}>
                <rect x="2" y="2" width="196" height="40" fill="none" stroke="var(--red)" strokeWidth="2.5" strokeDasharray="6,4" rx="4" style={{ animation: 'popIn .4s ease .4s both' }} />
              </svg>
              <div className="lp-scribble" style={{ top: -24, left: 10, color: 'var(--red)', transform: 'rotate(-3deg)', animation: 'fadeUp .5s 1s both' }}>
                too dense — split this
              </div>
            </div>
          </div>
        )}

        {active === 2 && (
          <div className="lp-stage-center" style={{ flexDirection: 'column', gap: 20 }}>
            <div className="lp-link-pill" style={{ animation: 'popIn .5s cubic-bezier(.22,1,.36,1) both' }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--green)' }} />
              {REVIEW_URL}
            </div>
            <div style={{ display: 'flex' }}>
              <div className="lp-avatar" style={{ animation: 'popIn .4s .35s both' }}>SM</div>
              <div className="lp-avatar" style={{ background: 'var(--goldSoft)', marginLeft: -10, animation: 'popIn .4s .5s both' }}>RK</div>
              <div className="lp-avatar" style={{ marginLeft: -10, animation: 'popIn .4s .65s both' }}>JL</div>
            </div>
            <div style={{ fontSize: 13, color: 'var(--text3)', animation: 'fadeUp .5s .8s both' }}>
              3 reviewers joined — zero accounts created
            </div>
          </div>
        )}

        {active === 3 && (
          <div className="lp-stage-center" style={{ flexDirection: 'column', gap: 20 }}>
            <svg width="72" height="72" viewBox="0 0 72 72" style={{ overflow: 'visible' }}>
              <circle cx="36" cy="36" r="30" fill="none" stroke="var(--green)" strokeWidth="3" pathLength={100} strokeDasharray="100" strokeDashoffset="100" strokeLinecap="round" style={{ animation: 'drawIn .8s ease-out both' }} />
              <path d="M24 37 L33 46 L49 28" fill="none" stroke="var(--green)" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" pathLength={100} strokeDasharray="100" strokeDashoffset="100" style={{ animation: 'drawIn .45s ease-out .7s both' }} />
            </svg>
            <div className="lp-link-pill" style={{ borderRadius: 12, animation: 'fadeUp .5s .9s both' }}>
              <span style={{ display: 'inline-flex', animation: 'bounceY 1.6s ease-in-out infinite' }}>
                <svg width="13" height="13" fill="none" stroke="var(--gold)" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
              </span>
              annotated.pdf
            </div>
            <div style={{ fontSize: 13, color: 'var(--text3)', animation: 'fadeUp .5s 1.1s both' }}>
              Annotations baked in — original untouched
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────────
   SECTION: TOOLKIT
──────────────────────────────────────────────────────────────────────────── */
function Toolkit() {
  const [active, setActive] = useState(0);

  return (
    <div className="lp-reveal" data-delay="120">
      <div className="lp-tool-chips">
        {TOOLS.map((t, i) => (
          <button
            key={t.name}
            type="button"
            onClick={() => setActive(i)}
            onMouseEnter={() => setActive(i)}
            className={`lp-chip${active === i ? ' is-active' : ''}`}
          >
            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
              {t.icon}
            </svg>
            {t.name}
          </button>
        ))}
      </div>

      <div className="lp-tool-canvas">
        <div style={{ height: 12, width: '52%', background: 'var(--borderS)', borderRadius: 2, marginBottom: 20 }} />
        <div style={{ height: 7, background: 'var(--border)', borderRadius: 2, marginBottom: 12 }} />
        <div style={{ height: 7, width: '86%', background: 'var(--border)', borderRadius: 2, marginBottom: 12 }} />
        <div style={{ height: 7, width: '64%', background: 'var(--border)', borderRadius: 2, marginBottom: 12 }} />
        <div style={{ height: 7, background: 'var(--border)', borderRadius: 2, marginBottom: 12 }} />
        <div style={{ height: 7, width: '78%', background: 'var(--border)', borderRadius: 2 }} />

        {active === 0 && (
          <svg className="lp-tool-overlay">
            <rect x="14%" y="32%" width="48%" height="30%" fill="none" stroke="var(--red)" strokeWidth="2.5" strokeDasharray="6,4" rx="4" style={{ animation: 'popIn .35s ease both' }} />
          </svg>
        )}
        {active === 1 && (
          <svg className="lp-tool-overlay" viewBox="0 0 760 300" preserveAspectRatio="none">
            <ellipse cx="330" cy="150" rx="200" ry="70" fill="none" stroke="var(--green)" strokeWidth="2.5" pathLength={100} strokeDasharray="100" strokeDashoffset="100" style={{ animation: 'drawIn .8s ease-out both' }} />
          </svg>
        )}
        {active === 2 && (
          <svg className="lp-tool-overlay" viewBox="0 0 760 300" preserveAspectRatio="none">
            <path d="M140 230 Q 340 90 560 140" fill="none" stroke="var(--gold)" strokeWidth="2.5" strokeLinecap="round" pathLength={100} strokeDasharray="100" strokeDashoffset="100" style={{ animation: 'drawIn .7s ease-out both' }} />
            <path d="M528 122 L 562 140 L 534 158" fill="none" stroke="var(--gold)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" pathLength={100} strokeDasharray="100" strokeDashoffset="100" style={{ animation: 'drawIn .3s ease-out .6s both' }} />
          </svg>
        )}
        {active === 3 && (
          <svg className="lp-tool-overlay" viewBox="0 0 760 300" preserveAspectRatio="none">
            <path d="M130 210 L 600 110" fill="none" stroke="var(--red)" strokeWidth="2.5" strokeLinecap="round" pathLength={100} strokeDasharray="100" strokeDashoffset="100" style={{ animation: 'drawIn .6s ease-out both' }} />
          </svg>
        )}
        {active === 4 && (
          <div style={{ position: 'absolute', left: '6.5%', top: '44%', width: '52%', height: 16, background: 'var(--yellow)', opacity: 0.42, borderRadius: 3, transformOrigin: 'left center', animation: 'growW .7s cubic-bezier(.22,1,.36,1) both' }} />
        )}
        {active === 5 && (
          <svg className="lp-tool-overlay" viewBox="0 0 760 300" preserveAspectRatio="none">
            <path d="M150 200 Q 210 120 270 180 Q 330 240 390 160 Q 450 80 510 150 Q 550 195 600 170" fill="none" stroke="var(--red)" strokeWidth="2.5" strokeLinecap="round" pathLength={100} strokeDasharray="100" strokeDashoffset="100" style={{ animation: 'drawIn 1s ease-out both' }} />
          </svg>
        )}
        {active === 6 && (
          <div style={{ position: 'absolute', left: '18%', top: '30%', fontFamily: "'Virgil',cursive", fontSize: 32, color: 'var(--green)', transform: 'rotate(-2deg)', animation: 'fadeUp .45s ease both' }}>
            ship it ✓
            <span style={{ display: 'inline-block', width: 2, height: '1em', background: 'var(--green)', verticalAlign: '-0.15em', marginLeft: 3, animation: 'blink 1.1s step-end infinite' }} />
          </div>
        )}
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────────
   SECTION: SHARE PANEL
──────────────────────────────────────────────────────────────────────────── */
function SharePanel() {
  const [access, setAccess] = useState<AccessMode>('COMMENT');
  const [copied, setCopied] = useState(false);
  const copyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => { if (copyTimer.current) clearTimeout(copyTimer.current); }, []);

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(`https://${REVIEW_URL}`);
    } catch {
      /* clipboard unavailable — still show feedback */
    }
    setCopied(true);
    if (copyTimer.current) clearTimeout(copyTimer.current);
    copyTimer.current = setTimeout(() => setCopied(false), 1600);
  }

  return (
    <div className="lp-reveal" data-delay="150" style={{ position: 'relative' }}>
      <div data-parallax="-0.04" className="lp-scribble lp-scribble-float" style={{ top: -38, right: '6%', color: 'var(--gold)', transform: 'rotate(4deg)', zIndex: 2 }}>
        no sign-up needed!
      </div>

      <div className="lp-share-card">
        <div className="lp-panel-label">Share this review</div>

        <div style={{ display: 'flex', gap: 8 }}>
          <div className="lp-share-url">
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--green)', flexShrink: 0 }} />
            {REVIEW_URL}
          </div>
          <button type="button" onClick={copyLink} className="lp-btn lp-btn-primary lp-copy-btn">
            {copied ? 'Copied ✓' : 'Copy'}
          </button>
        </div>

        <div>
          <div className="lp-panel-label" style={{ marginBottom: 9 }}>Access level</div>
          <div className="lp-access">
            {ACCESS_MODES.map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => setAccess(mode)}
                className={`lp-access-btn${access === mode ? ' is-active' : ''}`}
              >
                {mode}
              </button>
            ))}
          </div>
          <div style={{ fontSize: 13, color: 'var(--text2)', marginTop: 10, minHeight: 20 }}>
            {ACCESS_CAPTIONS[access]}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, paddingTop: 18, borderTop: '1px solid var(--border)' }}>
          <div style={{ display: 'flex' }}>
            <div className="lp-avatar lp-avatar-sm">SM</div>
            <div className="lp-avatar lp-avatar-sm" style={{ background: 'var(--goldSoft)', marginLeft: -9 }}>RK</div>
            <div className="lp-avatar lp-avatar-sm" style={{ marginLeft: -9 }}>JL</div>
          </div>
          <div style={{ fontSize: 12.5, color: 'var(--text3)' }}>
            Sarah, Rohan &amp; 3 others reviewed today — no accounts
          </div>
        </div>
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────────
   MAIN
──────────────────────────────────────────────────────────────────────────── */
type LandingPageClientProps = {
  initialIsAuthed: boolean;
};

export default function LandingPageClient({ initialIsAuthed }: LandingPageClientProps) {
  const router = useRouter();
  const { theme, toggle } = useTheme();
  const [isAuthed, setIsAuthed] = useState(initialIsAuthed);
  const mockupRef = useRef<HTMLDivElement>(null);

  /* Re-verify session client-side (cookie may have expired since SSR). */
  useEffect(() => {
    fetch('/api/auth/session')
      .then((res) => setIsAuthed(res.ok))
      .catch(() => setIsAuthed(false));
  }, []);

  /* Scroll reveals, parallax, hero tilt and reading-progress bar. */
  useEffect(() => {
    const revealEls = Array.from(document.querySelectorAll<HTMLElement>('.lp-reveal'));
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((en) => {
          if (!en.isIntersecting) return;
          const el = en.target as HTMLElement;
          el.style.transitionDelay = `${el.dataset.delay || 0}ms`;
          el.style.opacity = '1';
          el.style.transform = 'translateY(0)';
          io.unobserve(el);
        });
      },
      { threshold: 0.12 },
    );
    revealEls.forEach((el) => io.observe(el));

    const onScroll = () => {
      const vh = window.innerHeight;

      document.querySelectorAll<HTMLElement>('[data-parallax]').forEach((el) => {
        const sp = parseFloat(el.dataset.parallax || '0');
        const parent = el.parentElement;
        if (!parent) return;
        const r = parent.getBoundingClientRect();
        el.style.marginTop = `${-((r.top + r.height / 2 - vh / 2) * sp)}px`;
      });

      const tilt = document.querySelector<HTMLElement>('.mkly-tiltbox');
      if (tilt) {
        const r = tilt.getBoundingClientRect();
        const p = Math.min(Math.max(1 - (r.top - 60) / (vh * 0.55), 0), 1);
        tilt.style.transform = `rotateX(${(9 * (1 - p)).toFixed(2)}deg) scale(${(0.965 + 0.035 * p).toFixed(4)})`;
      }

      const prog = document.querySelector<HTMLElement>('.lpv2-progress');
      if (prog) {
        const h = document.documentElement;
        const max = h.scrollHeight - h.clientHeight;
        prog.style.width = `${max > 0 ? ((h.scrollTop / max) * 100).toFixed(2) : 0}%`;
      }
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    onScroll();

    return () => {
      io.disconnect();
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, []);

  /* ── Editor demo: scripted cursor, zoom, draw, type, export ─────────────── */
  useEffect(() => {
    const root = mockupRef.current;
    if (!root) return;

    const canvas = root.querySelector<HTMLElement>('.mkly-canvas')!;
    const body = root.querySelector<HTMLElement>('.mkly-body')!;
    const world = root.querySelector<HTMLElement>('.mkly-world')!;
    const pdfPage = root.querySelector<HTMLElement>('.mkly-pdf')!;
    const curEl = root.querySelector<HTMLElement>('.mkly-cur')!;
    const expBtn = root.querySelector<HTMLElement>('.mkly-exp')!;
    const tbs: Record<string, HTMLElement> = {
      arrow: root.querySelector<HTMLElement>('.mkly-tb-arrow')!,
      text: root.querySelector<HTMLElement>('.mkly-tb-text')!,
      rect: root.querySelector<HTMLElement>('.mkly-tb-rect')!,
    };
    const r1 = root.querySelector<SVGRectElement>('.mkly-r1')!;
    const r2 = root.querySelector<SVGRectElement>('.mkly-r2')!;
    const hl = root.querySelector<SVGRectElement>('.mkly-hl')!;
    const tx1 = root.querySelector<SVGTextElement>('.mkly-tx1')!;
    const tx2 = root.querySelector<SVGTextElement>('.mkly-tx2')!;

    let S = 1, Tx = 0, Ty = 0, tS = 1, tTx = 0, tTy = 0, lerpId: number | null = null;
    let cX = 0, cY = 0;
    const tmrs: ReturnType<typeof setTimeout>[] = [];
    const rafs: number[] = [];
    let stopped = false;

    function kill() {
      stopped = true;
      tmrs.forEach(clearTimeout); rafs.forEach(cancelAnimationFrame);
      tmrs.length = 0; rafs.length = 0;
      if (lerpId) { cancelAnimationFrame(lerpId); lerpId = null; }
    }
    const wait = (ms: number) => new Promise<void>((res) => {
      if (stopped) return; tmrs.push(setTimeout(res, ms));
    });
    const eio = (t: number) => (t < .5 ? 2 * t * t : -1 + (4 - 2 * t) * t);
    const eo3 = (t: number) => 1 - Math.pow(1 - t, 3);

    function applyT() { world.style.transform = `matrix(${S},0,0,${S},${Tx},${Ty})`; }
    function lerpTick() {
      if (stopped) return;
      S += (tS - S) * .09;
      Tx += (tTx - Tx) * .09;
      Ty += (tTy - Ty) * .09;
      applyT();
      if (Math.abs(tS - S) > .0002 || Math.abs(tTx - Tx) > .04 || Math.abs(tTy - Ty) > .04) {
        lerpId = requestAnimationFrame(lerpTick);
      } else { S = tS; Tx = tTx; Ty = tTy; applyT(); lerpId = null; }
    }
    function startLerp() { if (!lerpId && !stopped) lerpId = requestAnimationFrame(lerpTick); }

    function setCur(x: number, y: number) { cX = x; cY = y; curEl.style.left = `${x}px`; curEl.style.top = `${y}px`; }

    function elC(el: Element) {
      const er = el.getBoundingClientRect(), br = body.getBoundingClientRect();
      return { x: er.left - br.left + er.width / 2, y: er.top - br.top + er.height / 2 };
    }
    function elCtl(el: Element) {
      const er = el.getBoundingClientRect(), br = body.getBoundingClientRect();
      return { x: er.left - br.left, y: er.top - br.top };
    }
    function elWorld(el: Element) {
      const er = el.getBoundingClientRect(), cr = canvas.getBoundingClientRect();
      const vx = er.left - cr.left, vy = er.top - cr.top;
      return { x: (vx - Tx) / S, y: (vy - Ty) / S, w: er.width / S, h: er.height / S };
    }
    function w2c(wx: number, wy: number) {
      const cr = canvas.getBoundingClientRect(), br = body.getBoundingClientRect();
      const offX = cr.left - br.left, offY = cr.top - br.top;
      return { x: wx * S + Tx + offX, y: wy * S + Ty + offY };
    }

    function setTool(n: string | null) {
      Object.values(tbs).forEach((b) => { b.style.background = 'transparent'; b.style.color = 'var(--text3)'; });
      if (n && tbs[n]) { tbs[n].style.background = 'var(--accent)'; tbs[n].style.color = 'var(--accentFg)'; }
    }

    function moveCur(tx: number, ty: number, dur: number, opts: { zoomInScale?: number; zoomOutFirst?: boolean } = {}): Promise<void> {
      return new Promise((resolve) => {
        if (stopped) { resolve(); return; }
        const { zoomInScale, zoomOutFirst } = opts;
        const fx = cX, fy = cY, st = Date.now();
        if (zoomOutFirst) { tS = 1; tTx = 0; tTy = 0; startLerp(); }
        function tick() {
          if (stopped) { resolve(); return; }
          const t = Math.min((Date.now() - st) / dur, 1), e = eio(t);
          setCur(fx + (tx - fx) * e, fy + (ty - fy) * e);
          if (zoomInScale !== undefined && t > 0.7) {
            const zs = (zoomOutFirst ? 1 : S) + (zoomInScale - (zoomOutFirst ? 1 : S)) * eo3((t - 0.7) / 0.3);
            const wx2 = (tx - Tx) / S, wy2 = (ty - Ty) / S;
            tS = zs; tTx = tx - wx2 * zs; tTy = ty - wy2 * zs; startLerp();
          }
          if (t < 1) rafs.push(requestAnimationFrame(tick)); else { setCur(tx, ty); resolve(); }
        }
        tick();
      });
    }

    function dragRect(el: SVGRectElement, wx: number, wy: number, rW: number, rH: number, dur: number): Promise<void> {
      return new Promise((resolve) => {
        if (stopped) { resolve(); return; }
        el.setAttribute('x', String(wx)); el.setAttribute('y', String(wy));
        el.setAttribute('width', '0'); el.setAttribute('height', '0'); el.setAttribute('opacity', '1');
        const sb = w2c(wx, wy); setCur(sb.x, sb.y);
        const dz = tS * 1.06;
        tS = dz; tTx = sb.x - ((sb.x - Tx) / S) * dz; tTy = sb.y - ((sb.y - Ty) / S) * dz; startLerp();
        const st = Date.now();
        function tick() {
          if (stopped) { resolve(); return; }
          const t = Math.min((Date.now() - st) / dur, 1), e = eo3(t);
          el.setAttribute('width', String(rW * e)); el.setAttribute('height', String(rH * e));
          const nb = w2c(wx + rW * e, wy + rH * e); setCur(nb.x, nb.y);
          if (t < 1) rafs.push(requestAnimationFrame(tick)); else resolve();
        }
        tick();
      });
    }

    function growHl(el: SVGRectElement, wx: number, wy: number, maxW: number, dur: number): Promise<void> {
      return new Promise((resolve) => {
        if (stopped) { resolve(); return; }
        el.setAttribute('x', String(wx)); el.setAttribute('y', String(wy));
        el.setAttribute('width', '0'); el.setAttribute('opacity', '.42');
        const hc = w2c(wx + maxW / 2, wy), hz = tS * 1.05;
        tS = hz; tTx = hc.x - ((hc.x - Tx) / S) * hz; tTy = hc.y - ((hc.y - Ty) / S) * hz; startLerp();
        const st = Date.now();
        function tick() {
          if (stopped) { resolve(); return; }
          el.setAttribute('width', String(maxW * eo3(Math.min((Date.now() - st) / dur, 1))));
          if (Date.now() - st < dur) rafs.push(requestAnimationFrame(tick)); else resolve();
        }
        tick();
      });
    }

    function typeText(el: SVGTextElement, wx: number, wy: number, text: string, dur: number): Promise<void> {
      return new Promise((resolve) => {
        if (stopped) { resolve(); return; }
        el.setAttribute('x', String(wx)); el.setAttribute('y', String(wy));
        el.setAttribute('opacity', '1'); el.textContent = '';
        const tc = w2c(wx, wy), tz = tS * 1.06;
        tS = tz; tTx = tc.x - ((tc.x - Tx) / S) * tz; tTy = tc.y - ((tc.y - Ty) / S) * tz; startLerp();
        const chars = text.split(''); let i = 0;
        function next() {
          if (stopped) { resolve(); return; }
          el.textContent += chars[i++] ?? '';
          if (i < chars.length) tmrs.push(setTimeout(next, dur / chars.length)); else resolve();
        }
        next();
      });
    }

    function waitLerp(): Promise<void> {
      return new Promise((resolve) => {
        function check() { if (!lerpId || stopped) resolve(); else tmrs.push(setTimeout(check, 30)); }
        check();
      });
    }

    async function run() {
      if (stopped) return;
      [r1, r2].forEach((e) => { e.setAttribute('opacity', '0'); e.setAttribute('width', '0'); e.setAttribute('height', '0'); });
      hl.setAttribute('opacity', '0'); hl.setAttribute('width', '0');
      tx1.setAttribute('opacity', '0'); tx1.textContent = '';
      tx2.setAttribute('opacity', '0'); tx2.textContent = '';
      S = 1; Tx = 0; Ty = 0; tS = 1; tTx = 0; tTy = 0; applyT();
      setTool(null);
      expBtn.style.cssText = '';

      const vpW = canvas.offsetWidth, vpH = canvas.offsetHeight;
      const pgW = pdfPage.offsetWidth, pgH = pdfPage.scrollHeight || 280;
      pdfPage.style.left = `${Math.round((vpW - pgW) / 2)}px`;
      pdfPage.style.top = `${Math.round((vpH - pgH) / 2 - 10)}px`;

      await new Promise<void>((res) => { rafs.push(requestAnimationFrame(() => rafs.push(requestAnimationFrame(() => res())))); });

      const pfCtl = elCtl(pdfPage);
      setCur(pfCtl.x + pdfPage.offsetWidth + 10, pfCtl.y + pgH - 10);
      await wait(400);

      // 1. rect tool
      await moveCur(elC(tbs.rect).x, elC(tbs.rect).y, 850);
      await wait(120); setTool('rect'); await wait(300);

      // 2. arrive on PDF → zoom in
      await moveCur(elC(root!.querySelector('.mkly-ln0')!).x, elC(root!.querySelector('.mkly-ln0')!).y, 1100, { zoomInScale: 1.28 });
      await waitLerp(); await wait(300);

      // 3. draw red rect
      const ln0w = elWorld(root!.querySelector('.mkly-ln0')!);
      const ln1w = elWorld(root!.querySelector('.mkly-ln1')!);
      const rX = ln0w.x - 2, rY = ln0w.y - 2, rW = Math.max(ln0w.w, ln1w.w) + 4, rH = (ln1w.y + ln1w.h) - ln0w.y + 4;
      await moveCur(w2c(rX, rY).x, w2c(rX, rY).y, 650); await wait(100);
      await dragRect(r1, rX, rY, rW, rH, 1200); await wait(250);

      // 4. text tool → zoom out
      await moveCur(elC(tbs.text).x, elC(tbs.text).y, 850, { zoomOutFirst: true });
      await waitLerp(); await wait(140); setTool('text'); await wait(300);

      // 5. type "Review this!"
      await moveCur(w2c(rX, rY - 3).x, w2c(rX, rY - 3).y, 900, { zoomInScale: 1.32 });
      await waitLerp(); await wait(130);
      await typeText(tx1, rX, rY - 3, 'Review this!', 720); await wait(350);

      // 6. highlight ln3
      setTool('arrow'); await wait(80);
      const ln3w = elWorld(root!.querySelector('.mkly-ln3')!);
      const hlX = ln3w.x, hlY = ln3w.y + (ln3w.h - 7) / 2;
      await moveCur(w2c(hlX + ln3w.w * .3, hlY).x, w2c(hlX + ln3w.w * .3, hlY).y, 1000, { zoomInScale: 1.25, zoomOutFirst: true });
      await waitLerp(); await wait(140);
      await growHl(hl, hlX, hlY, ln3w.w, 680); await wait(300);

      // 7. rect tool → zoom out
      await moveCur(elC(tbs.rect).x, elC(tbs.rect).y, 820, { zoomOutFirst: true });
      await waitLerp(); await wait(140); setTool('rect'); await wait(300);

      // 8. draw green rect
      const ln5w = elWorld(root!.querySelector('.mkly-ln5')!);
      const ln6w = elWorld(root!.querySelector('.mkly-ln6')!);
      const g2X = ln5w.x + ln5w.w * .42, g2Y = ln5w.y - 2, g2W = ln5w.w * .55, g2H = (ln6w.y + ln6w.h) - ln5w.y + 4;
      await moveCur(w2c(g2X, g2Y).x, w2c(g2X, g2Y).y, 950, { zoomInScale: 1.28 });
      await waitLerp(); await wait(110);
      await dragRect(r2, g2X, g2Y, g2W, g2H, 1000); await wait(220);

      // 9. text tool → zoom out
      await moveCur(elC(tbs.text).x, elC(tbs.text).y, 780, { zoomOutFirst: true });
      await waitLerp(); await wait(130); setTool('text'); await wait(250);

      // 10. type "Looks good ✓"
      await moveCur(w2c(g2X, g2Y + g2H + 15).x, w2c(g2X, g2Y + g2H + 15).y, 820, { zoomInScale: 1.32 });
      await waitLerp(); await wait(130);
      await typeText(tx2, g2X, g2Y + g2H + 15, 'Looks good ✓', 600); await wait(450);

      // 11. Export button click + zoom
      setTool('arrow');
      await moveCur(elC(expBtn).x, elC(expBtn).y, 1200, { zoomOutFirst: true });
      await waitLerp(); await wait(180);
      expBtn.style.transition = 'transform .18s ease, box-shadow .18s ease';
      expBtn.style.transform = 'scale(1.08)';
      expBtn.style.boxShadow = '0 0 0 3px var(--goldSoft)';
      await wait(220); expBtn.style.transform = 'scale(0.94)';
      await wait(120); expBtn.style.transform = ''; expBtn.style.boxShadow = ''; expBtn.style.transition = '';
      const ec = elC(expBtn);
      tS = 1.5; tTx = ec.x - ((ec.x - Tx) / S) * 1.5; tTy = ec.y - ((ec.y - Ty) / S) * 1.5; startLerp();
      await wait(1300);

      if (!stopped) { await wait(500); run(); }
    }

    const t = setTimeout(() => run(), 900);
    return () => { kill(); clearTimeout(t); };
  }, []);

  async function handleLogout() {
    await fetch('/api/auth/session', { method: 'DELETE' });
    setIsAuthed(false);
    router.refresh();
  }

  const primaryCta = () => router.push(isAuthed ? '/dashboard' : '/signup');

  return (
    <>
      <MorphLoader />
      <style>{LANDING_CSS}</style>

      <div className="lpv2-root">
        <div className="lpv2-noise" aria-hidden="true" />
        <div className="lpv2-orb lpv2-orb-1" aria-hidden="true" />
        <div className="lpv2-orb lpv2-orb-2" aria-hidden="true" />
        <div className="lpv2-progress" aria-hidden="true" />

        {/* ── NAV ───────────────────────────────────────────────────────── */}
        <nav className="lp-nav">
          <div className="lp-nav-inner">
            <a href="/" className="lp-brand">
              <MarklyLogo size={28} />
              <span>Markly</span>
            </a>

            <ul className="lp-nav-links">
              <li><a href="#features">Features</a></li>
              <li><a href="#how">How it works</a></li>
              <li><a href="#toolkit">Toolkit</a></li>
            </ul>

            <div className="lp-nav-actions">
              <button type="button" onClick={toggle} aria-label="Toggle theme" className="lp-icon-btn">
                {theme === 'light' ? <MoonIcon /> : <SunIcon />}
              </button>

              {isAuthed ? (
                <>
                  <button type="button" onClick={() => router.push('/dashboard')} className="lp-btn lp-btn-ghost lp-btn-sm">Dashboard</button>
                  <button type="button" onClick={handleLogout} className="lp-btn lp-btn-primary lp-btn-sm">Log out</button>
                </>
              ) : (
                <>
                  <button type="button" onClick={() => router.push('/login')} className="lp-btn lp-btn-ghost lp-btn-sm">Log in</button>
                  <button type="button" onClick={() => router.push('/signup')} className="lp-btn lp-btn-primary lp-btn-sm">Get started free</button>
                </>
              )}
            </div>
          </div>
        </nav>

        {/* ── HERO ──────────────────────────────────────────────────────── */}
        <section className="lp-hero">
          <div className="lp-hero-inner">
            <div className="lp-badge">
              <span className="lp-badge-dot" />
              EXCALIDRAW FOR DOCUMENTS
            </div>

            <h1 className="lp-h1">
              <span className="lp-rise-mask"><span className="lp-rise" style={{ animationDelay: '.12s' }}>Annotate</span></span>{' '}
              <span className="lp-rise-mask">
                <span className="lp-rise lp-h1-accent" style={{ animationDelay: '.22s' }}>
                  documents
                  <svg viewBox="0 0 200 14" preserveAspectRatio="none" className="lp-underline">
                    <path d="M4 10 Q 60 2 104 8 Q 150 13 196 5" fill="none" stroke="var(--gold)" strokeWidth="4" strokeLinecap="round" opacity=".45" strokeDasharray="220" strokeDashoffset="220" />
                  </svg>
                </span>
              </span>
              <br />
              <span className="lp-rise-mask"><span className="lp-rise" style={{ animationDelay: '.32s' }}><em style={{ color: 'var(--text2)' }}>like an artist</em></span></span>
            </h1>

            <p className="lp-hero-sub">
              Markly brings Excalidraw&rsquo;s fluidity to your PDFs. Draw, write, and comment directly on the page —
              then share a review link in one click. No accounts needed for reviewers.
            </p>

            <div className="lp-hero-actions">
              <button type="button" onClick={primaryCta} className="lp-btn lp-btn-primary lp-btn-lg">
                <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
                {isAuthed ? 'Go to dashboard' : 'Start free with Google/GitHub'}
              </button>
              <a href="#how" className="lp-btn lp-btn-ghost lp-btn-lg">
                Watch demo
                <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <polygon points="5 3 19 12 5 21 5 3" />
                </svg>
              </a>
            </div>

            {/* ── EDITOR MOCKUP ─────────────────────────────────────────── */}
            <div className="mkly-root" ref={mockupRef}>
              <div data-parallax="0.06" className="lp-scribble lp-scribble-a">
                needs a second pass
                <svg width="52" height="34" viewBox="0 0 52 34" style={{ display: 'block', margin: '2px 0 0 34px', overflow: 'visible' }}>
                  <path d="M4 4 Q 26 8 38 24" fill="none" stroke="var(--red)" strokeWidth="2" strokeLinecap="round" />
                  <path d="M30 22 L 39 26 L 36 16" fill="none" stroke="var(--red)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <div data-parallax="-0.05" className="lp-scribble lp-scribble-b">approved ✓</div>
              <div data-parallax="0.09" className="lp-scribble lp-scribble-c">share the link →</div>

              <div className="mkly-tiltbox">
                <div className="mkly-window">
                  <div className="mkly-titlebar">
                    <div style={{ display: 'flex', gap: 7 }}>
                      <span className="mkly-dot" style={{ background: '#ff5f56' }} />
                      <span className="mkly-dot" style={{ background: '#ffbd2e' }} />
                      <span className="mkly-dot" style={{ background: '#27c93f' }} />
                    </div>
                    <div className="mkly-url">{REVIEW_URL}</div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <div className="mkly-action">Share</div>
                      <div className="mkly-action mkly-exp">Export</div>
                    </div>
                  </div>

                  <div className="mkly-body">
                    <div className="mkly-toolbar">
                      <button type="button" className="mkly-tb-btn mkly-tb-arrow" tabIndex={-1} aria-hidden="true">
                        <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M5 3l14 9-7 1-4 7z" /></svg>
                      </button>
                      <button type="button" className="mkly-tb-btn mkly-tb-text" tabIndex={-1} aria-hidden="true">
                        <span style={{ fontFamily: "'DM Serif Display',serif", fontSize: 15, fontStyle: 'italic' }}>T</span>
                      </button>
                      <button type="button" className="mkly-tb-btn mkly-tb-rect" tabIndex={-1} aria-hidden="true">
                        <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="1" /></svg>
                      </button>
                      <button type="button" className="mkly-tb-btn" tabIndex={-1} aria-hidden="true">
                        <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" /></svg>
                      </button>
                      <button type="button" className="mkly-tb-btn" tabIndex={-1} aria-hidden="true">
                        <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
                      </button>
                      <div className="mkly-tb-sep" />
                      <button type="button" className="mkly-tb-btn" tabIndex={-1} aria-hidden="true">
                        <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M3 17c3-3 5-5 8-5s5 5 8-1" /></svg>
                      </button>
                      <button type="button" className="mkly-tb-btn" tabIndex={-1} aria-hidden="true">
                        <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M9 7l6 0M9 11h6M9 15h4" strokeLinecap="round" /></svg>
                      </button>
                      <div className="mkly-tb-sep" />
                      <button type="button" className="mkly-tb-btn" tabIndex={-1} aria-hidden="true">
                        <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
                      </button>
                    </div>

                    <div className="mkly-canvas">
                      <div className="mkly-world">
                        <div className="mkly-pdf">
                          <div className="mkly-pdf-title" />
                          <div className="mkly-pdf-line mkly-ln0" />
                          <div className="mkly-pdf-line mkly-ln1" style={{ width: '82%' }} />
                          <div className="mkly-pdf-line mkly-ln2" style={{ width: '58%' }} />
                          <div className="mkly-pdf-line mkly-ln3" />
                          <div className="mkly-pdf-line mkly-ln4" style={{ width: '82%' }} />
                          <div className="mkly-pdf-line mkly-ln5" style={{ marginTop: 16 }} />
                          <div className="mkly-pdf-line mkly-ln6" />
                          <div className="mkly-pdf-line mkly-ln7" style={{ width: '58%' }} />
                          <div className="mkly-pdf-line mkly-ln8" style={{ width: '82%' }} />
                          <div className="mkly-pdf-line mkly-ln9" />
                        </div>
                        <svg className="mkly-svg">
                          <rect className="mkly-r1" x="0" y="0" width="0" height="0" fill="none" stroke="var(--red)" strokeWidth="2" strokeDasharray="5,3" rx="3" opacity="0" />
                          <rect className="mkly-r2" x="0" y="0" width="0" height="0" fill="none" stroke="var(--green)" strokeWidth="2" rx="3" opacity="0" />
                          <rect className="mkly-hl" x="0" y="0" width="0" height="9" fill="var(--yellow)" opacity="0" rx="2" />
                          <text className="mkly-tx1" x="0" y="0" fill="var(--red)" fontFamily="Virgil,cursive" fontSize="18" opacity="0" />
                          <text className="mkly-tx2" x="0" y="0" fill="var(--green)" fontFamily="Virgil,cursive" fontSize="17" opacity="0" />
                        </svg>
                      </div>
                    </div>

                    <div className="mkly-cur">
                      <svg width="20" height="22" viewBox="0 0 20 22" fill="none">
                        <path d="M3.5 2 L3.5 18 L7.5 13.5 L12 20 L14 19 L9.5 12.5 L16.5 12.5 Z" fill="var(--text)" stroke="var(--card)" strokeWidth="1.3" strokeLinejoin="round" />
                      </svg>
                    </div>

                    <div className="mkly-panel">
                      <div className="mkly-panel-group">
                        <div className="lp-panel-label">Stroke color</div>
                        <div style={{ display: 'flex', gap: 7 }}>
                          {['var(--red)', 'var(--green)', 'var(--yellow)', 'var(--text)'].map((c) => (
                            <span key={c} className="mkly-swatch" style={{ background: c }} />
                          ))}
                        </div>
                      </div>
                      <div className="mkly-panel-group">
                        <div className="lp-panel-label">Font</div>
                        <div className="mkly-font-chip">Virgil</div>
                      </div>
                      <div className="mkly-panel-group">
                        <div className="lp-panel-label">Opacity</div>
                        <input className="mkly-input" value="100%" readOnly tabIndex={-1} aria-hidden="true" />
                      </div>
                      <div className="mkly-panel-group" style={{ marginTop: 'auto' }}>
                        <div className="lp-panel-label">Comment</div>
                        <div className="mkly-comment">
                          <div className="mkly-comment-avatar">AR</div>
                          <div>
                            <div style={{ fontSize: 11, color: 'var(--text2)', lineHeight: 1.5 }}>&ldquo;Review highlighted section&rdquo;</div>
                            <div style={{ fontSize: 10, color: 'var(--text3)', marginTop: 4 }}>2 min ago · Resolved</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── SOCIAL PROOF ──────────────────────────────────────────────── */}
        <section className="lp-social">
          <div className="lp-reveal lp-social-label">Trusted for serious reviews at</div>
          <div className="lp-reveal lp-marquee-mask" data-delay="120">
            <div className="lp-marquee">
              {[...MARQUEE_NAMES, ...MARQUEE_NAMES].map((m, i) => (
                <div key={`${m.name}-${i}`} className="lp-marquee-item">
                  <span style={{ fontFamily: m.font, fontSize: m.size, fontWeight: 500, color: 'var(--text3)', letterSpacing: m.font.includes('Mono') ? '.1em' : 0 }}>
                    {m.name}
                  </span>
                  <span className="lp-marquee-dot" />
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── FEATURES ──────────────────────────────────────────────────── */}
        <section id="features" className="lp-section">
          <div className="lp-container">
            <div className="lp-reveal lp-head">
              <div className="lp-eyebrow">Features</div>
              <h2 className="lp-h2">Everything you need to<br />review documents visually</h2>
              <p className="lp-lede" style={{ maxWidth: 600 }}>
                From quick annotations to full-scale reviews — Markly gives your team a shared visual language.
              </p>
            </div>
            <NotebookFeatures />
          </div>
        </section>

        {/* ── HOW IT WORKS ──────────────────────────────────────────────── */}
        <section id="how" className="lp-section">
          <div className="lp-container">
            <div className="lp-reveal lp-head" style={{ marginBottom: 56 }}>
              <div className="lp-eyebrow">How it works</div>
              <h2 className="lp-h2">From upload to sign-off<br />in four steps</h2>
              <p className="lp-lede" style={{ maxWidth: 480 }}>
                Markly streamlines your entire review workflow — no onboarding required.
              </p>
            </div>
            <HowItWorks />
          </div>
        </section>

        {/* ── TOOLKIT ───────────────────────────────────────────────────── */}
        <section id="toolkit" className="lp-section">
          <div className="lp-container">
            <div className="lp-reveal lp-head" style={{ marginBottom: 40 }}>
              <div className="lp-eyebrow">The toolkit</div>
              <h2 className="lp-h2">Seven tools.<br />One visual language.</h2>
              <p className="lp-lede" style={{ maxWidth: 520 }}>
                Every mark Markly makes shares the same hand-drawn style your team already knows from Excalidraw. Try one.
              </p>
            </div>
            <Toolkit />
          </div>
        </section>

        {/* ── SHARING ───────────────────────────────────────────────────── */}
        <section id="share" className="lp-section">
          <div className="lp-container lp-share-grid">
            <div className="lp-reveal">
              <div className="lp-eyebrow">Zero-friction sharing</div>
              <h2 className="lp-h2" style={{ marginBottom: 16 }}>Reviews without<br />the login wall</h2>
              <p className="lp-lede" style={{ margin: '0 0 26px', maxWidth: 440, textAlign: 'left' }}>
                Send a link and your reviewer is annotating in seconds. Markly is open source and self-hostable,
                so your documents can live entirely on your own infrastructure.
              </p>
              <div className="lp-checklist">
                <div><CheckIcon />Zero-login review links — view, comment, or edit</div>
                <div><CheckIcon />Open source, MIT-licensed, fully self-hostable</div>
                <div><CheckIcon />Your original file is never modified</div>
              </div>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <button type="button" onClick={primaryCta} className="lp-btn lp-btn-primary">
                  <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                  </svg>
                  Get started free
                </button>
                <a href="#how" className="lp-btn lp-btn-ghost">Read the docs</a>
              </div>
            </div>
            <SharePanel />
          </div>
        </section>

        {/* ── CTA ───────────────────────────────────────────────────────── */}
        <div className="lp-section">
          <div className="lp-container">
            <div className="lp-reveal lp-cta">
              <div data-parallax="0.05" className="lp-scribble" style={{ position: 'absolute', top: 26, left: '7%', color: 'var(--gold)', transform: 'rotate(-5deg)', opacity: .9 }}>
                start here ↘
              </div>
              <div style={{ position: 'relative', zIndex: 1 }}>
                <h2 className="lp-cta-title">Start reviewing smarter.</h2>
                <p className="lp-cta-sub">
                  Create your workspace, upload PDFs, and share public review links in under 30 seconds.
                </p>
                <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
                  <button type="button" onClick={primaryCta} className="lp-btn lp-btn-lg lp-cta-primary">
                    {isAuthed ? 'Open dashboard' : 'Create free account'}
                  </button>
                  <button type="button" onClick={() => router.push('/login')} className="lp-btn lp-btn-lg lp-cta-ghost">
                    {isAuthed ? 'Switch account' : 'Log in'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── FOOTER ────────────────────────────────────────────────────── */}
        <footer className="lp-footer">
          <div className="lp-container">
            <div className="lp-footer-grid">
              <div>
                <a href="/" className="lp-brand" style={{ marginBottom: 14 }}>
                  <MarklyLogo size={30} />
                  <span style={{ fontSize: 20 }}>Markly</span>
                </a>
                <p style={{ fontSize: 13, color: 'var(--text3)', lineHeight: 1.65, maxWidth: 230, margin: 0 }}>
                  Excalidraw for documents. Visual feedback for any PDF — draw, annotate, share.
                </p>
              </div>
              {FOOTER_COLS.map((col) => (
                <div key={col.h}>
                  <h4 className="lp-footer-head">{col.h}</h4>
                  <ul className="lp-footer-links">
                    {col.links.map((l) => <li key={l}><a href="#">{l}</a></li>)}
                  </ul>
                </div>
              ))}
            </div>
            <div className="lp-footer-bottom">
              <span>© {new Date().getFullYear()} Markly. All rights reserved.</span>
              <div style={{ display: 'flex', gap: 20 }}>
                <a href="#">Privacy</a>
                <a href="#">Terms</a>
                <a href="#">Cookies</a>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}

/* ────────────────────────────────────────────────────────────────────────────
   STYLES — Verdigris palette. Tokens are redeclared at :root so the <body>
   background (set in globals.css) matches the landing surface exactly.
──────────────────────────────────────────────────────────────────────────── */
const LANDING_CSS = `
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
}

[data-theme="dark"], [data-theme="dark"] .lpv2-root {
  --bg:#121110; --bg-2:#1b1a17; --bg2:#1b1a17;
  --card:#201e1b; --bg-card:#201e1b; --paper:#26241f;
  --text:#f2f0ea; --text-2:#aca89e; --text2:#aca89e; --text-3:#6e6a60; --text3:#6e6a60;
  --border:#2e2c27; --border-strong:#454138; --borderS:#454138;
  --accent:#f2f0ea; --accent-fg:#141310; --accentFg:#141310;
  --gold:#7cc4ae; --goldSoft:rgba(124,196,174,.16); --glow:rgba(124,196,174,.08);
  --red:#f06a5a; --green:#4fd48b; --yellow:#f4cd41;
  --navBg:rgba(18,17,16,.72);
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
.lp-h1 { font-family: 'DM Serif Display', serif; font-size: clamp(52px, 8vw, 96px); line-height: 1.02; letter-spacing: -.035em; color: var(--text); max-width: 900px; margin: 26px 0 0; font-weight: 400; }
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
