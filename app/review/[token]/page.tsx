'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { PDFViewer } from '@/components/editor/PDFViewer';
import { AnnotationCanvas } from '@/components/editor/AnnotationCanvas';
import { CommentsSidebar } from '@/components/comments/CommentsSidebar';
import { Toolbar } from '@/components/editor/Toolbar';
import { ShareModal } from '@/components/sharing/ShareModal';
import { useEditorStore } from '@/lib/store';
import { debounce } from '@/lib/utils';
import { Annotation, Comment, Document as MarklyDoc, AccessType, ShareLink } from '@/types';
import { ZoomIn, ZoomOut, ChevronLeft, ChevronRight, MessageSquare, Eye, Edit3, Sun, Moon, Copy, Check } from 'lucide-react';

export default function ReviewPage() {
  const params = useParams();
  const token = params.token as string;

  const [document, setDocument] = useState<MarklyDoc | null>(null);
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [shareLinks, setShareLinks] = useState<ShareLink[]>([]);
  const [access, setAccess] = useState<AccessType>('VIEW');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [canvasDimensions, setCanvasDimensions] = useState({ width: 0, height: 0 });
  const [showComments, setShowComments] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(true);
  const [copied, setCopied] = useState(false);

  const { currentPage, totalPages, setTotalPages, zoom, zoomIn, zoomOut, setCurrentPage, isDirty, setIsDirty, pushHistory } = useEditorStore();

  useEffect(() => {
    const saved = localStorage.getItem('markly-theme') as 'light' | 'dark' | null;
    const t = saved || 'light';
    setTheme(t);
    window.document.documentElement.setAttribute('data-theme', t);

    async function load() {
      try {
        const res = await fetch(`/api/share?token=${token}`);
        if (!res.ok) { const err = await res.json(); throw new Error(err.error || 'Invalid link'); }
        const shareLink = await res.json();
        setAccess(shareLink.access);
        setShareLinks(shareLink.document?.shareLinks || shareLink.project?.shareLinks || []);
        const doc = shareLink.document ?? shareLink.project?.documents?.[0] ?? null;
        if (doc) {
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

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const saveAnnotations = useCallback(
    debounce(async (anns: Annotation[], docId: string) => {
      setIsSaving(true);
      try {
        const res = await fetch('/api/annotations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-share-token': token },
          body: JSON.stringify({ documentId: docId, annotations: anns }),
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({ error: 'Failed to save annotations' }));
          throw new Error(err.error || 'Failed to save annotations');
        }

        setIsDirty(false);
        setSaved(true);
        setError(null);
      } catch (e) {
        setSaved(false);
        setError(e instanceof Error ? e.message : 'Failed to save annotations');
      } finally {
        setIsSaving(false);
      }
    }, 1500),
    []
  );

  function handleAnnotationsChange(newAnnotations: Annotation[]) {
    if (access !== 'EDIT' || !document) return;
    setAnnotations(newAnnotations);
    setIsDirty(true);
    setSaved(false);
    pushHistory(newAnnotations);
    saveAnnotations(newAnnotations, document.id);
  }

  function toggleTheme() {
    const next = theme === 'light' ? 'dark' : 'light';
    setTheme(next);
    window.document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('markly-theme', next);
  }

  async function handleAddComment(content: string, pageNumber: number, annotationId?: string) {
    if (!document || access === 'VIEW') return;
    const res = await fetch('/api/comments', {
      method: 'POST', headers: { 'Content-Type': 'application/json', 'x-share-token': token },
      body: JSON.stringify({ content, documentId: document.id, annotationId, pageNumber }),
    });
    const comment = await res.json();
    setComments((prev) => [comment, ...prev]);
  }

  async function handleResolveComment(id: string, resolved: boolean) {
    await fetch(`/api/comments/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'x-share-token': token },
      body: JSON.stringify({ resolved }),
    });
    setComments((prev) => prev.map((c) => c.id === id ? { ...c, resolved } : c));
  }

  async function handleDeleteComment(id: string) {
    await fetch(`/api/comments/${id}`, {
      method: 'DELETE',
      headers: { 'x-share-token': token },
    });
    setComments((prev) => prev.filter((c) => c.id !== id));
  }

  async function handleCreateShareLink(accessType: AccessType): Promise<ShareLink> {
    if (!document) {
      throw new Error('Document not loaded');
    }

    const res = await fetch('/api/share', {
      method: 'POST', headers: { 'Content-Type': 'application/json', 'x-share-token': token },
      body: JSON.stringify({ documentId: document.id, access: accessType }),
    });
    const link = await res.json();
    if (link.documentId === document.id) {
      setShareLinks((prev) => {
        const exists = prev.some((item) => item.id === link.id);
        return exists ? prev : [...prev, link];
      });
    }
    return link;
  }

  async function handleDeleteShareLink(id: string) {
    const res = await fetch(`/api/share/${id}`, { method: 'DELETE' });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Failed to delete share link' }));
      throw new Error(err.error || 'Failed to delete share link');
    }
    setShareLinks((prev) => prev.filter((l) => l.id !== id));
  }

  async function copyCurrentLink() {
    await navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleManualSave() {
    if (!document) return;
    setIsSaving(true);
    try {
      const res = await fetch('/api/annotations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-share-token': token },
        body: JSON.stringify({ documentId: document.id, annotations }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Failed to save annotations' }));
        throw new Error(err.error || 'Failed to save annotations');
      }

      setIsDirty(false);
      setSaved(true);
      setError(null);
    } catch (e) {
      setSaved(false);
      setError(e instanceof Error ? e.message : 'Failed to save annotations');
    } finally {
      setIsSaving(false);
    }
  }

  if (loading) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 32, height: 32, border: '2px solid var(--border)', borderTopColor: 'var(--text)', borderRadius: '50%', margin: '0 auto 12px', animation: 'spin 1s linear infinite' }} />
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

  const fileUrl = `/api/documents/file/${document.filename}?documentId=${document.id}&token=${token}`;
  const canComment = access === 'COMMENT' || access === 'EDIT';
  const canEdit = access === 'EDIT';
  const unresolvedCount = comments.filter((c) => !c.resolved).length;

  const accessConfig = {
    VIEW:    { label: 'View only',   icon: <Eye size={11} />,           color: 'var(--text-3)', bg: 'var(--bg-2)', border: 'var(--border)' },
    COMMENT: { label: 'Can comment', icon: <MessageSquare size={11} />, color: '#1d4ed8',       bg: '#eff6ff',     border: '#bfdbfe' },
    EDIT:    { label: 'Can edit',    icon: <Edit3 size={11} />,         color: '#c2410c',       bg: '#fff7ed',     border: '#fed7aa' },
  }[access];

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg-2)', overflow: 'hidden' }}>

      <nav style={{ height: 48, background: 'var(--bg-card)', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', padding: '0 14px', gap: 10, flexShrink: 0, zIndex: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginRight: 4 }}>
          <div style={{ width: 24, height: 24, background: 'var(--accent)', borderRadius: 5, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="11" height="11" viewBox="0 0 14 14" fill="none">
              <path d="M2 11 L5 5 L8 9 L10 6 L13 11 Z" stroke="var(--accent-fg)" strokeWidth="1.5" strokeLinejoin="round" />
            </svg>
          </div>
          <span style={{ fontFamily: "'DM Serif Display', serif", fontSize: 16, color: 'var(--text)' }}>Markly</span>
        </div>

        <span style={{ color: 'var(--border-strong)', fontSize: 14 }}>/</span>
        <span style={{ fontSize: 12, color: 'var(--text-2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 200 }}>
          {document.originalName}
        </span>

        <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 99, background: accessConfig.bg, color: accessConfig.color, border: `1px solid ${accessConfig.border}`, flexShrink: 0 }}>
          {accessConfig.icon} {accessConfig.label}
        </div>

        {canEdit && (
          <div style={{ fontSize: 11, color: isSaving ? 'var(--text-3)' : saved ? '#16a34a' : 'var(--text-3)' }}>
            {isSaving ? 'saving...' : saved ? '✓ saved' : 'unsaved'}
          </div>
        )}

        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6 }}>
          <button onClick={toggleTheme} style={{ width: 30, height: 30, borderRadius: 7, border: '1px solid var(--border)', background: 'var(--bg-2)', cursor: 'pointer', color: 'var(--text-3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {theme === 'light' ? <Moon size={12} /> : <Sun size={12} />}
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            <button onClick={zoomOut} style={{ width: 26, height: 26, borderRadius: 6, border: '1px solid var(--border)', background: 'var(--bg-2)', cursor: 'pointer', color: 'var(--text-3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><ZoomOut size={11} /></button>
            <span style={{ fontSize: 10, color: 'var(--text-3)', fontFamily: "'DM Mono', monospace", width: 36, textAlign: 'center' }}>{Math.round(zoom * 100)}%</span>
            <button onClick={zoomIn} style={{ width: 26, height: 26, borderRadius: 6, border: '1px solid var(--border)', background: 'var(--bg-2)', cursor: 'pointer', color: 'var(--text-3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><ZoomIn size={11} /></button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            <button onClick={() => setCurrentPage(Math.max(1, currentPage - 1))} disabled={currentPage <= 1}
              style={{ width: 26, height: 26, borderRadius: 6, border: '1px solid var(--border)', background: 'var(--bg-2)', cursor: 'pointer', color: 'var(--text-3)', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: currentPage <= 1 ? .35 : 1 }}>
              <ChevronLeft size={11} />
            </button>
            <span style={{ fontSize: 10, color: 'var(--text-3)', fontFamily: "'DM Mono', monospace", padding: '0 4px', whiteSpace: 'nowrap' }}>{currentPage}/{totalPages}</span>
            <button onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))} disabled={currentPage >= totalPages}
              style={{ width: 26, height: 26, borderRadius: 6, border: '1px solid var(--border)', background: 'var(--bg-2)', cursor: 'pointer', color: 'var(--text-3)', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: currentPage >= totalPages ? .35 : 1 }}>
              <ChevronRight size={11} />
            </button>
          </div>

          {canComment && (
            <button onClick={() => setShowComments(!showComments)} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '0 10px', height: 28, borderRadius: 7, border: `1px solid ${showComments ? 'var(--accent)' : 'var(--border)'}`, background: showComments ? 'var(--accent)' : 'var(--bg-2)', color: showComments ? 'var(--accent-fg)' : 'var(--text-2)', cursor: 'pointer', fontSize: 11, fontWeight: 500, fontFamily: "'Instrument Sans', sans-serif", transition: 'all .15s' }}>
              <MessageSquare size={11} />
              Comments{unresolvedCount > 0 ? ` (${unresolvedCount})` : ''}
            </button>
          )}

          <button onClick={copyCurrentLink} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '0 10px', height: 28, borderRadius: 7, border: '1px solid var(--border)', background: 'var(--bg-2)', color: copied ? '#16a34a' : 'var(--text-2)', cursor: 'pointer', fontSize: 11, fontWeight: 500, fontFamily: "'Instrument Sans', sans-serif", transition: 'all .15s' }}>
            {copied ? <Check size={11} /> : <Copy size={11} />}
            {copied ? 'Copied!' : 'Copy link'}
          </button>

          <button onClick={() => setShowShare(true)} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '0 12px', height: 28, borderRadius: 7, border: 'none', background: 'var(--accent)', color: 'var(--accent-fg)', cursor: 'pointer', fontSize: 11, fontWeight: 500, fontFamily: "'Instrument Sans', sans-serif" }}>
            Share back →
          </button>
        </div>
      </nav>

      {canEdit && (
        <Toolbar
          onSave={handleManualSave}
          onExport={() => window.open(`/api/export?documentId=${document.id}&token=${token}`, '_blank')}
          onShare={() => setShowShare(true)}
          isSaving={isSaving}
          isDirty={isDirty}
        />
      )}

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
                  onChange={handleAnnotationsChange}
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
              onResolve={handleResolveComment}
              onDelete={handleDeleteComment}
              readonly={false}
            />
          </div>
        )}
      </div>

      {showShare && (
        <ShareModal
          shareLinks={shareLinks}
          onClose={() => setShowShare(false)}
          onCreateLink={handleCreateShareLink}
          onDeleteLink={handleDeleteShareLink}
          hiddenToken={token}
          allowDelete={false}
        />
      )}
    </div>
  );
}
