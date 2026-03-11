'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { PDFViewer } from '@/components/editor/PDFViewer';
import { AnnotationCanvas } from '@/components/editor/AnnotationCanvas';
import { CommentsSidebar } from '@/components/comments/CommentsSidebar';
import { useEditorStore } from '@/lib/store';
import { Annotation, Comment, Document as MarklyDoc, AccessType } from '@/types';
import { ZoomIn, ZoomOut, ChevronLeft, ChevronRight, MessageSquare, Eye, Edit3, Sun, Moon } from 'lucide-react';

export default function ReviewPage() {
  const params = useParams();
  const token = params.token as string;

  const [document, setDocument] = useState<MarklyDoc | null>(null);
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [access, setAccess] = useState<AccessType>('VIEW');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [canvasDimensions, setCanvasDimensions] = useState({ width: 0, height: 0 });
  const [showComments, setShowComments] = useState(false);
  const [theme, setTheme] = useState<'light'|'dark'>('light');

  const { currentPage, totalPages, setTotalPages, zoom, zoomIn, zoomOut, setCurrentPage } = useEditorStore();

  useEffect(() => {
    const saved = localStorage.getItem('markly-theme') as 'light'|'dark'|null;
    const t = saved || 'light';
    setTheme(t);
    window.document.documentElement.setAttribute('data-theme', t);

    async function load() {
      try {
        const res = await fetch(`/api/share?token=${token}`);
        if (!res.ok) { const err = await res.json(); throw new Error(err.error || 'Invalid link'); }
        const shareLink = await res.json();
        setAccess(shareLink.access);
        const docs = shareLink.project.documents;
        if (docs.length > 0) {
          const doc = docs[0];
          setDocument(doc);
          setAnnotations(doc.annotations || []);
          setComments(doc.comments || []);
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load');
      } finally {
        setLoading(false);
      }
    }
    load();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  function toggleTheme() {
    const next = theme === 'light' ? 'dark' : 'light';
    setTheme(next);
    window.document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('markly-theme', next);
  }

  async function handleAddComment(content: string, pageNumber: number, annotationId?: string) {
    if (!document || access === 'VIEW') return;
    const res = await fetch('/api/comments', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content, documentId: document.id, annotationId, pageNumber }),
    });
    const comment = await res.json();
    setComments((prev) => [comment, ...prev]);
  }

  if (loading) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 32, height: 32, border: '2px solid var(--border)', borderTopColor: 'var(--text)', borderRadius: '50%', margin: '0 auto 12px' }} className="animate-spin" />
          <p style={{ fontSize: 13, color: 'var(--text-3)', fontFamily: "'Instrument Sans', sans-serif" }}>Loading review...</p>
        </div>
      </div>
    );
  }

  if (error || !document) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}>
        <div style={{ textAlign: 'center', padding: 32 }}>
          <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 24, color: 'var(--text)', marginBottom: 8 }}>Link not found</h2>
          <p style={{ fontSize: 13, color: 'var(--text-3)' }}>{error || 'This link may have expired or been deleted.'}</p>
        </div>
      </div>
    );
  }

  const fileUrl = `/api/documents/file/${document.filename}`;
  const isReadonly = access === 'VIEW';
  const canComment = access === 'COMMENT' || access === 'EDIT';
  const canEdit = access === 'EDIT';
  const unresolvedCount = comments.filter((c) => !c.resolved).length;

  const accessConfig = {
    VIEW:    { label: 'View only',    icon: <Eye size={11} />,           color: 'var(--text-3)',   bg: 'var(--bg-2)' },
    COMMENT: { label: 'Can comment',  icon: <MessageSquare size={11} />, color: '#1d4ed8',          bg: '#eff6ff' },
    EDIT:    { label: 'Can edit',     icon: <Edit3 size={11} />,          color: '#c2410c',          bg: '#fff7ed' },
  }[access];

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg-2)', overflow: 'hidden' }}>
      {/* NAV */}
      <nav style={{ height: 52, background: 'var(--bg-card)', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', padding: '0 16px', gap: 12, flexShrink: 0 }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          <div style={{ width: 26, height: 26, background: 'var(--accent)', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
              <path d="M2 11 L5 5 L8 9 L10 6 L13 11 Z" stroke="var(--accent-fg)" strokeWidth="1.5" strokeLinejoin="round" />
            </svg>
          </div>
          <span style={{ fontFamily: "'DM Serif Display', serif", fontSize: 17, color: 'var(--text)' }}>Markly</span>
        </div>

        <span style={{ color: 'var(--border-strong)', fontSize: 16 }}>/</span>
        <span style={{ fontSize: 12, color: 'var(--text-2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 240, fontFamily: "'Instrument Sans', sans-serif" }}>
          {document.originalName}
        </span>

        {/* Access badge */}
        <div style={{ marginLeft: 4, display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 500, padding: '3px 10px', borderRadius: 99, background: accessConfig.bg, color: accessConfig.color, border: '1px solid', borderColor: access === 'VIEW' ? 'var(--border)' : 'transparent' }}>
          {accessConfig.icon} {accessConfig.label}
        </div>

        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6 }}>
          {/* Theme */}
          <button onClick={toggleTheme}
            style={{ width: 30, height: 30, borderRadius: 7, border: '1px solid var(--border)', background: 'var(--bg-2)', cursor: 'pointer', color: 'var(--text-3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {theme === 'light' ? <Moon size={12} /> : <Sun size={12} />}
          </button>

          {/* Zoom */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            <button onClick={zoomOut} style={{ width: 28, height: 28, borderRadius: 6, border: '1px solid var(--border)', background: 'var(--bg-2)', cursor: 'pointer', color: 'var(--text-3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><ZoomOut size={11} /></button>
            <span style={{ fontSize: 10, color: 'var(--text-3)', fontFamily: "'DM Mono', monospace", width: 38, textAlign: 'center' }}>{Math.round(zoom * 100)}%</span>
            <button onClick={zoomIn} style={{ width: 28, height: 28, borderRadius: 6, border: '1px solid var(--border)', background: 'var(--bg-2)', cursor: 'pointer', color: 'var(--text-3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><ZoomIn size={11} /></button>
          </div>

          {/* Page nav */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            <button onClick={() => setCurrentPage(Math.max(1, currentPage - 1))} disabled={currentPage <= 1}
              style={{ width: 28, height: 28, borderRadius: 6, border: '1px solid var(--border)', background: 'var(--bg-2)', cursor: 'pointer', color: 'var(--text-3)', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: currentPage <= 1 ? .35 : 1 }}>
              <ChevronLeft size={11} />
            </button>
            <span style={{ fontSize: 10, color: 'var(--text-3)', fontFamily: "'DM Mono', monospace", padding: '0 6px' }}>{currentPage}/{totalPages}</span>
            <button onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))} disabled={currentPage >= totalPages}
              style={{ width: 28, height: 28, borderRadius: 6, border: '1px solid var(--border)', background: 'var(--bg-2)', cursor: 'pointer', color: 'var(--text-3)', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: currentPage >= totalPages ? .35 : 1 }}>
              <ChevronRight size={11} />
            </button>
          </div>

          {canComment && (
            <button
              onClick={() => setShowComments(!showComments)}
              style={{
                display: 'flex', alignItems: 'center', gap: 6, padding: '0 12px', height: 30, borderRadius: 8,
                border: `1px solid ${showComments ? 'var(--accent)' : 'var(--border)'}`,
                background: showComments ? 'var(--accent)' : 'var(--bg-2)',
                color: showComments ? 'var(--accent-fg)' : 'var(--text-2)',
                cursor: 'pointer', fontSize: 12, fontWeight: 500,
                fontFamily: "'Instrument Sans', sans-serif", transition: 'all .15s',
              }}
            >
              <MessageSquare size={11} />
              Comments {unresolvedCount > 0 && `(${unresolvedCount})`}
            </button>
          )}
        </div>
      </nav>

      {/* CANVAS + SIDEBAR */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <div style={{ flex: 1, overflow: 'auto', background: 'var(--bg-2)' }}>
          <div style={{ minHeight: '100%', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: 40 }}>
            <div style={{ position: 'relative', boxShadow: 'var(--shadow-lg)' }}>
              <PDFViewer
                fileUrl={fileUrl}
                pageNumber={currentPage}
                zoom={zoom}
                onTotalPages={setTotalPages}
                onPageRendered={(_, w, h) => setCanvasDimensions({ width: w / zoom, height: h / zoom })}
              />
              {canvasDimensions.width > 0 && (
                <AnnotationCanvas
                  documentId={document.id}
                  pageNumber={currentPage}
                  width={canvasDimensions.width * zoom}
                  height={canvasDimensions.height * zoom}
                  annotations={annotations}
                  onChange={setAnnotations}
                  readonly={!canEdit}
                />
              )}
            </div>
          </div>
        </div>

        {showComments && canComment && (
          <div style={{ width: 260, background: 'var(--bg-card)', borderLeft: '1px solid var(--border)', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
            <CommentsSidebar
              comments={comments}
              onAdd={handleAddComment}
              onResolve={async () => {}}
              onDelete={async () => {}}
              readonly={!canComment}
            />
          </div>
        )}
      </div>
    </div>
  );
}
