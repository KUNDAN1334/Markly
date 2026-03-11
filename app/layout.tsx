import type { Metadata } from 'next';
import './globals.css';
import { Providers } from '@/components/Providers';

export const metadata: Metadata = {
  title: 'Markly — Excalidraw for Documents',
  description: 'Annotate PDFs with hand-drawn style tools. Share with a link.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        {/* Google Fonts */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          href="https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Mono:wght@400;500&family=Instrument+Sans:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
        {/* Virgil — Excalidraw's hand-drawn font */}
        <style>{`
          @font-face {
            font-family: 'Virgil';
            src: url('https://excalidraw.com/Virgil.woff2') format('woff2');
            font-display: swap;
          }
        `}</style>
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
