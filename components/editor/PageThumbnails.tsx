'use client';

import { useEffect, useState } from 'react';
import { useEditorStore } from '@/lib/store';

interface Props { fileUrl: string; totalPages: number; }

export function PageThumbnails({ fileUrl, totalPages }: Props) {
  const { currentPage, setCurrentPage } = useEditorStore();
  const [thumbnails, setThumbnails] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!fileUrl || !totalPages) return;
    let cancelled = false;
    async function render() {
      try {
        const pdfjsLib = await import('pdfjs-dist');
        pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
        const pdf = await pdfjsLib.getDocument(fileUrl).promise;
        const thumbs: string[] = [];
        for (let i = 1; i <= Math.min(pdf.numPages, 30); i++) {
          if (cancelled) return;
          const page = await pdf.getPage(i);
          const viewport = page.getViewport({ scale: 0.22 });
          const canvas = document.createElement('canvas');
          canvas.width = viewport.width;
          canvas.height = viewport.height;
          await page.render({ canvasContext: canvas.getContext('2d')!, viewport } as Parameters<typeof page.render>[0]).promise;
          thumbs.push(canvas.toDataURL());
        }
        if (!cancelled) { setThumbnails(thumbs); setLoading(false); }
      } catch { setLoading(false); }
    }
    render();
    return () => { cancelled = true; };
  }, [fileUrl, totalPages]);

  return (
    <div style={{ padding: '8px 8px', display: 'flex', flexDirection: 'column', gap: 4 }}>
      <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.07em', textTransform: 'uppercase', color: 'var(--text-3)', padding: '4px 4px 6px', fontFamily: "'Instrument Sans', sans-serif" }}>
        Pages ({totalPages})
      </div>

      {loading
        ? Array.from({ length: Math.min(totalPages, 4) }).map((_, i) => (
            <div key={i} className="animate-pulse" style={{ width: '100%', aspectRatio: '3/4', background: 'var(--bg-2)', borderRadius: 6 }} />
          ))
        : thumbnails.map((src, i) => (
            <button
              key={i}
              onClick={() => setCurrentPage(i + 1)}
              style={{
                position: 'relative', borderRadius: 8, overflow: 'hidden',
                border: `2px solid ${currentPage === i + 1 ? 'var(--accent)' : 'transparent'}`,
                cursor: 'pointer', background: 'none', padding: 0,
                transition: 'border-color .15s', display: 'block', width: '100%',
              }}
              onMouseEnter={e => { if (currentPage !== i + 1) e.currentTarget.style.borderColor = 'var(--border-strong)'; }}
              onMouseLeave={e => { if (currentPage !== i + 1) e.currentTarget.style.borderColor = 'transparent'; }}
            >
              <img src={src} alt={`Page ${i + 1}`} style={{ width: '100%', display: 'block' }} />
              <div style={{
                position: 'absolute', bottom: 0, left: 0, right: 0, textAlign: 'center',
                padding: '3px 0', fontSize: 9, fontWeight: 600,
                fontFamily: "'DM Mono', monospace",
                background: currentPage === i + 1 ? 'var(--accent)' : 'rgba(0,0,0,.35)',
                color: currentPage === i + 1 ? 'var(--accent-fg)' : 'white',
              }}>
                {i + 1}
              </div>
            </button>
          ))
      }
    </div>
  );
}
