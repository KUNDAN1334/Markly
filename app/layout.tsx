import type { Metadata } from 'next';
import './globals.css';
import { Providers } from '@/components/Providers';

export const metadata: Metadata = {
  title: 'Markly — Excalidraw for Documents',
  description: 'Annotate PDFs with hand-drawn style tools. Share with a link.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Google Fonts */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          href="https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Mono:wght@400;500&family=Instrument+Sans:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
        {/* Inter Tight — hero / display headline face */}
        <link
          href="https://fonts.googleapis.com/css2?family=Inter+Tight:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500;1,600&display=swap"
          rel="stylesheet"
        />
        {/* Bricolage Grotesque (variable weight) — drives the intro morph loader */}
        <link
          href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,200..800&display=swap"
          rel="stylesheet"
        />
        {/* Virgil — Excalidraw's hand-drawn font (self-hosted, also embedded in PDF exports) */}
        <link
          rel="preload"
          href="/fonts/Virgil.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
        <style>{`
          @font-face {
            font-family: 'Virgil';
            src: url('/fonts/Virgil.woff2') format('woff2');
            font-display: swap;
          }
        `}</style>
      </head>
      <body suppressHydrationWarning>
        {/*
          Runs before first paint:
          1. Applies the persisted theme so there's no light/dark flash.
          2. Mirrors the "intro already played this session" flag onto <html>,
             so the landing loader is hidden by CSS instead of rendering for a
             frame and then unmounting on hydration.
        */}
        <script
          dangerouslySetInnerHTML={{
            __html: `try{var d=document.documentElement;d.setAttribute('data-theme',localStorage.getItem('markly-theme')||'dark');if(sessionStorage.getItem('markly-intro-seen')==='1')d.setAttribute('data-intro','seen')}catch(e){}`,
          }}
        />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
