'use client';

import { useEffect, useRef, useState } from 'react';

interface PDFViewerProps {
  fileUrl: string;
  pageNumber: number;
  zoom: number;
  onPageRendered?: (canvas: HTMLCanvasElement, width: number, height: number) => void;
  onTotalPages?: (total: number) => void;
}

export function PDFViewer({ fileUrl, pageNumber, zoom, onPageRendered, onTotalPages }: PDFViewerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const renderTaskRef = useRef<{ cancel: () => void } | null>(null);
  const pdfRef = useRef<unknown>(null);
  const onPageRenderedRef = useRef(onPageRendered);
  const onTotalPagesRef = useRef(onTotalPages);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  onPageRenderedRef.current = onPageRendered;
  onTotalPagesRef.current = onTotalPages;

  useEffect(() => {
    let cancelled = false;

    async function loadPDF() {
      setLoading(true);
      setError(null);
      try {
        const pdfjsLib = await import('pdfjs-dist');
        pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
        const pdf = await pdfjsLib.getDocument(fileUrl).promise;
        if (cancelled) return;
        pdfRef.current = pdf;
        onTotalPagesRef.current?.(pdf.numPages);
      } catch {
        if (!cancelled) { setError('Failed to load PDF'); setLoading(false); }
      }
    }

    loadPDF();
    return () => { cancelled = true; };
  }, [fileUrl]);

  useEffect(() => {
    if (!pdfRef.current) return;
    let cancelled = false;

    async function renderPage() {
      if (!pdfRef.current || !canvasRef.current) return;
      if (renderTaskRef.current) {
        try { renderTaskRef.current.cancel(); } catch { /* ignore */ }
        renderTaskRef.current = null;
      }
      setLoading(true);
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const pdf = pdfRef.current as any;
        const page = await pdf.getPage(pageNumber);
        if (cancelled) return;
        const viewport = page.getViewport({ scale: zoom });
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d')!;
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        canvas.style.width = `${viewport.width}px`;
        canvas.style.height = `${viewport.height}px`;
        const renderTask = page.render({ canvasContext: ctx, viewport });
        renderTaskRef.current = renderTask;
        await renderTask.promise;
        if (!cancelled) {
          onPageRenderedRef.current?.(canvas, viewport.width, viewport.height);
          setLoading(false);
        }
      } catch (err: unknown) {
        if (!cancelled) {
          const name = err instanceof Error ? err.name : '';
          if (name !== 'RenderingCancelledException') {
            setError('Failed to render page');
            setLoading(false);
          }
        }
      }
    }

    renderPage();
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pdfRef.current, pageNumber, zoom]);

  return (
    <div style={{ position: 'relative', minWidth: 100, minHeight: 100 }}>
      {loading && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,.85)', zIndex: 10 }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ width: 28, height: 28, border: '2px solid #e5e5e5', borderTopColor: '#0d0d0c', borderRadius: '50%', margin: '0 auto 8px', animation: 'spin 1s linear infinite' }} />
            <span style={{ fontSize: 11, color: '#9a9a96' }}>Rendering...</span>
          </div>
        </div>
      )}
      {error && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300, color: '#ef4444', fontSize: 13 }}>
          {error}
        </div>
      )}
      <canvas ref={canvasRef} style={{ display: 'block' }} />
    </div>
  );
}