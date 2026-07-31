'use client';

/* ────────────────────────────────────────────────────────────────────────────
   Shared landing chrome — logo, theme toggle, nav and footer.
   Used by the landing page (`/`) and the blog (`/blog`) so both surfaces stay
   visually identical without duplicating markup.
──────────────────────────────────────────────────────────────────────────── */

import type { ReactNode } from 'react';
import { useCallback, useEffect, useState } from 'react';

export const REPO_URL = 'https://github.com/KUNDAN1334/Markly';

/* ── theme ─────────────────────────────────────────────────────────────────
   Persisted under `markly-theme` and applied to <html data-theme> so the
   dashboard/editor stay in sync. Defaults to dark (the Verdigris palette).
──────────────────────────────────────────────────────────────────────────── */
export function useTheme() {
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

/* ── icons ─────────────────────────────────────────────────────────────── */
export function MarklyLogo({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" aria-hidden="true">
      <path d="M20 6 L8 6 L8 20" stroke="var(--text)" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M20 34 L32 34 L32 20" stroke="var(--text)" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="20" cy="20" r="3.5" fill="var(--text)" />
      <path d="M13 20 Q17 18 20 20 Q23 22 27 20" stroke="var(--text)" strokeWidth="1.5" fill="none" strokeLinecap="round" />
    </svg>
  );
}

export const SunIcon = () => (
  <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2m0 16v2M4.93 4.93l1.41 1.41m11.32 11.32 1.41 1.41M2 12h2m16 0h2M4.93 19.07l1.41-1.41m11.32-11.32 1.41-1.41" />
  </svg>
);

export const MoonIcon = () => (
  <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
  </svg>
);

export const GitHubIcon = ({ size = 15 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M12 .5A11.5 11.5 0 0 0 .5 12a11.5 11.5 0 0 0 7.86 10.92c.58.1.79-.25.79-.56v-2c-3.2.7-3.88-1.37-3.88-1.37-.53-1.34-1.29-1.7-1.29-1.7-1.05-.72.08-.7.08-.7 1.16.08 1.77 1.2 1.77 1.2 1.03 1.77 2.7 1.26 3.36.96.1-.75.4-1.26.73-1.55-2.55-.29-5.24-1.28-5.24-5.7 0-1.26.45-2.29 1.19-3.1-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.18 1.18a11 11 0 0 1 5.79 0c2.2-1.5 3.17-1.18 3.17-1.18.63 1.59.24 2.76.12 3.05.74.81 1.19 1.84 1.19 3.1 0 4.43-2.7 5.4-5.26 5.69.41.36.78 1.06.78 2.14v3.17c0 .31.21.67.8.56A11.5 11.5 0 0 0 23.5 12 11.5 11.5 0 0 0 12 .5z" />
  </svg>
);

/* ── footer ────────────────────────────────────────────────────────────── */
type FooterLink = { label: string; href: string; external?: boolean };

export const FOOTER_COLS: { h: string; links: FooterLink[] }[] = [
  {
    h: 'Product',
    links: [
      { label: 'Features', href: '/#features' },
      { label: 'Open source', href: REPO_URL, external: true },
      { label: 'Changelog', href: `${REPO_URL}/commits`, external: true },
      { label: 'Roadmap', href: `${REPO_URL}#roadmap`, external: true },
    ],
  },
  {
    h: 'Resources',
    links: [
      { label: 'Documentation', href: `${REPO_URL}#getting-started`, external: true },
      { label: 'API Reference', href: `${REPO_URL}#api-reference`, external: true },
      { label: 'Blog', href: '/blog' },
      { label: 'Status', href: '/#how' },
    ],
  },
  {
    h: 'Company',
    links: [
      { label: 'About', href: '/blog' },
      { label: 'Twitter / X', href: 'https://x.com', external: true },
      { label: 'GitHub', href: REPO_URL, external: true },
      { label: 'Contact', href: `${REPO_URL}/issues`, external: true },
    ],
  },
];

export function LandingFooter() {
  return (
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
                {col.links.map((l) => (
                  <li key={l.label}>
                    <a
                      href={l.href}
                      {...(l.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                    >
                      {l.label}
                    </a>
                  </li>
                ))}
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
  );
}

/* ── nav ───────────────────────────────────────────────────────────────── */
export function LandingNav({ links, actions }: { links: ReactNode; actions: ReactNode }) {
  return (
    <nav className="lp-nav">
      <div className="lp-nav-inner">
        <a href="/" className="lp-brand">
          <MarklyLogo size={28} />
          <span>Markly</span>
        </a>
        <ul className="lp-nav-links">{links}</ul>
        <div className="lp-nav-actions">{actions}</div>
      </div>
    </nav>
  );
}
