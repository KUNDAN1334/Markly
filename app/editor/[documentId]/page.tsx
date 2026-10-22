'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { PDFViewer } from '@/components/editor/PDFViewer';
import { AnnotationCanvas } from '@/components/editor/AnnotationCanvas';
import { Toolbar } from '@/components/editor/Toolbar';
import { PageThumbnails } from '@/components/editor/PageThumbnails';
import { CommentsSidebar } from '@/components/comments/CommentsSidebar';
import { ShareModal } from '@/components/sharing/ShareModal';
import { useEditorStore } from '@/lib/store';
import { debounce } from '@/lib/utils';
import { Annotation, AnnotationStyle, Comment, CommentStatus, Document as MarklyDoc, ShareLink, AccessType } from '@/types';
import { MessageSquare, Layers, ArrowLeft } from 'lucide-react';

type SidebarTab = 'pages' | 'comments';

export default function EditorPage() {
  const params = useParams();
  const router = useRouter();
  const documentId = params.documentId as string;

  const [document, setDocument] = useState<MarklyDoc | null>(null);
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [shareLinks, setShareLinks] = useState<ShareLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [sidebarTab, setSidebarTab] = useState<SidebarTab>('pages');
  const [canvasDimensions, setCanvasDimensions] = useState({ width: 0, height: 0 });

  const { currentPage, totalPages, setTotalPages, zoom, isDirty, setIsDirty, resetHistory, pushHistory, undo, redo, selectedAnnotationIds } = useEditorStore();

  const syncDocument = useCallback(async () => {
    const res = await fetch(`/api/documents/${documentId}`);
    if (res.status === 401) throw new Error('AUTH_REQUIRED');
    if (!res.ok) throw new Error('Document not found');

    const doc: MarklyDoc = await res.json();
    setDocument(doc);
    setAnnotations(doc.annotations || []);
    resetHistory(doc.annotations || []);
    setComments(doc.comments || []);

    const slRes = await fetch(`/api/share?documentId=${doc.id}`);
    if (slRes.ok) setShareLinks(await slRes.json());
  }, [documentId, resetHistory]);

  useEffect(() => {
    const saved = localStorage.getItem('markly-theme');
    if (saved) window.document.documentElement.setAttribute('data-theme', saved);

    async function load() {
      try {
        await syncDocument();
      } catch (e) {
        if (e instanceof Error && e.message === 'AUTH_REQUIRED') {
          router.replace('/login');
          return;
        }
        setError(e instanceof Error ? e.message : 'Failed to load');
      } finally {
        setLoading(false);
      }
    }
    load();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router, syncDocument]);

  useEffect(() => {
    if (!documentId) return;

    async function refreshIfIdle() {
      if (document?.id !== documentId || isDirty || window.document.hidden) return;

      try {
        await syncDocument();
      } catch {
        // Keep the current editor state if a background refresh fails.
      }
    }

    const intervalId = window.setInterval(refreshIfIdle, 5000);
    window.addEventListener('focus', refreshIfIdle);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener('focus', refreshIfIdle);
    };
  }, [document?.id, documentId, isDirty, syncDocument]);

  const saveAnnotations = useCallback(
    debounce(async (anns: Annotation[]) => {
      setIsSaving(true);
      try {
        await fetch('/api/annotations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ documentId, annotations: anns }),
        });
        setIsDirty(false);
      } finally {
        setIsSaving(false);
      }
    }, 1500),
    [documentId]
  );

  function handleAnnotationsChange(newAnnotations: Annotation[]) {
    setAnnotations(newAnnotations);
    setIsDirty(true);
    pushHistory(newAnnotations);
    saveAnnotations(newAnnotations);
  }

  function handleUpdateSelectedStyle(style: Partial<AnnotationStyle>) {
    if (selectedAnnotationIds.length === 0) return;

    const updated = annotations.map((annotation) =>
      selectedAnnotationIds.includes(annotation.id)
        ? {
            ...annotation,
            style: { ...annotation.style, ...style },
            updatedAt: new Date().toISOString(),
          }
        : annotation
    );
    handleAnnotationsChange(updated);
  }

  async function handleManualSave() {
    setIsSaving(true);
    try {
      await fetch('/api/annotations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documentId, annotations }),
      });
      setIsDirty(false);
    } finally {
      setIsSaving(false);
    }
  }

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLInputElement) return;
      if (e.key === 'Delete' || e.key === 'Backspace') {
        const { selectedAnnotationIds, clearSelection } = useEditorStore.getState();
        if (selectedAnnotationIds.length > 0) {
          e.preventDefault();
          const updated = annotations.filter((a) => !selectedAnnotationIds.includes(a.id));
          handleAnnotationsChange(updated);
          clearSelection();
          return;
        }
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        const prev = undo();
        if (prev) { setAnnotations(prev); setIsDirty(true); }
      }
      if ((e.metaKey || e.ctrlKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault();
        const next = redo();
        if (next) { setAnnotations(next); setIsDirty(true); }
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        handleManualSave();
      }
      const shortcuts: Record<string, string> = { s:'select', r:'rectangle', c:'circle', a:'arrow', l:'line', h:'highlight', f:'freehand', t:'text' };
      if (!e.metaKey && !e.ctrlKey && shortcuts[e.key]) {
        useEditorStore.getState().setActiveTool(shortcuts[e.key] as never);
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [annotations]);

  async function handleAddComment(content: string, pageNumber: number, annotationId?: string) {
    const res = await fetch('/api/comments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content, documentId, annotationId, pageNumber }),
    });
    const comment = await res.json();
    setComments((prev) => [comment, ...prev]);
  }

  async function handleCommentStatus(id: string, status: CommentStatus, note?: string) {
    const res = await fetch(`/api/comments/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status, note }) });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Failed to update comment' }));
      throw new Error(err.error || 'Failed to update comment');
    }
    const comment = await res.json();
    setComments((prev) => prev.map((c) => (c.id === id ? comment : c)));
  }

  async function handleDeleteComment(id: string) {
    await fetch(`/api/comments/${id}`, { method: 'DELETE' });
    setComments((prev) => prev.filter((c) => c.id !== id));
  }

  async function handleCreateShareLink(access: AccessType): Promise<ShareLink> {
    const res = await fetch('/api/share', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ documentId, access }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Failed to create share link' }));
      throw new Error(err.error || 'Failed to create share link');
    }
    const link = await res.json();
    setShareLinks((prev) => {
      const exists = prev.some((item) => item.id === link.id);
      return exists ? prev : [link, ...prev];
    });
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

  if (loading) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 32, height: 32, border: '2px solid var(--border)', borderTopColor: 'var(--text)', borderRadius: '50%', margin: '0 auto 12px' }} className="animate-spin" />
          <p style={{ fontSize: 13, color: 'var(--text-3)', fontFamily: "'Instrument Sans', sans-serif" }}>Loading document...</p>
        </div>
      </div>
    );
  }

  if (error || !document) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}>
        <div style={{ textAlign: 'center' }}>
          <p style={{ color: 'var(--text-2)', marginBottom: 16, fontFamily: "'Instrument Sans', sans-serif" }}>{error || 'Document not found'}</p>
          <button onClick={() => router.push('/dashboard')} style={{ fontSize: 13, color: 'var(--text)', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>← Go home</button>
        </div>
      </div>
    );
  }

  const fileUrl = `/api/documents/file/${document.filename}?documentId=${document.id}`;
  // Items still waiting on the owner to fix.
  const unresolvedComments = comments.filter((c) => c.status === 'OPEN').length;

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg-2)', overflow: 'hidden' }}>

      {/* BREADCRUMB BAR */}
      <div style={{ height: 36, background: 'var(--bg-card)', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', padding: '0 12px', gap: 8, flexShrink: 0 }}>
        <button
          onClick={() => router.push('/dashboard')}
          style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: 'var(--text-3)', background: 'none', border: 'none', cursor: 'pointer', padding: '3px 6px', borderRadius: 6, fontFamily: "'Instrument Sans', sans-serif", transition: 'all .15s' }}
          onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-2)'; e.currentTarget.style.color = 'var(--text)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-3)'; }}
        >
          <ArrowLeft size={12} />
          <span style={{ fontFamily: "'DM Serif Display', serif" }}>Markly</span>
        </button>
        <span style={{ color: 'var(--border-strong)', fontSize: 14 }}>/</span>
        <span style={{ fontSize: 12, color: 'var(--text-2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 300, fontFamily: "'Instrument Sans', sans-serif" }}>
          {document.originalName}
        </span>
        {document.isVisible === false && (
          <span
            title="The copy behind an edit link. The reviewer's edits and comments live here, not on the original."
            style={{ fontSize: 9, fontWeight: 700, letterSpacing: '.05em', padding: '1px 7px', borderRadius: 99, background: '#fff7ed', color: '#c2410c', border: '1px solid #fed7aa', flexShrink: 0, fontFamily: "'Instrument Sans', sans-serif" }}
          >
            SHARE-BACK COPY
          </span>
        )}
        {isDirty && (
          <span title="Unsaved changes" style={{ width: 6, height: 6, borderRadius: '50%', background: '#f59e0b', flexShrink: 0 }} />
        )}
      </div>

      {/* TOOLBAR */}
      <Toolbar
        onSave={handleManualSave}
        onExport={() => window.open(`/api/export?documentId=${documentId}`, '_blank')}
        onShare={() => setShowShare(true)}
        isSaving={isSaving}
        isDirty={isDirty}
        onUpdateSelectedStyle={handleUpdateSelectedStyle}
      />

      {/* MAIN AREA */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

        {/* LEFT SIDEBAR */}
        <div style={{ width: sidebarTab === 'comments' ? 290 : 180, background: 'var(--bg-card)', borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
          {/* Tabs */}
          <div style={{ display: 'flex', borderBottom: '1px solid var(--border)' }}>
            {([
              { id: 'pages', icon: <Layers size={11} />, label: 'Pages' },
              { id: 'comments', icon: <MessageSquare size={11} />, label: 'Comments', badge: unresolvedComments },
            ] as const).map((tab) => (
              <button
                key={tab.id}
                onClick={() => setSidebarTab(tab.id)}
                style={{
                  flex: 1, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                  fontSize: 11, borderTop: 'none', borderRight: 'none', borderBottom: 'none', borderLeft: 'none', cursor: 'pointer', fontFamily: "'Instrument Sans', sans-serif",
                  fontWeight: 500, transition: 'all .15s', padding: '0 8px 4px',
                  background: 'transparent',
                  color: sidebarTab === tab.id ? 'var(--text)' : 'var(--text-3)',
                  boxShadow: sidebarTab === tab.id ? 'inset 0 -2px 0 var(--accent)' : 'inset 0 -2px 0 transparent',
                }}
              >
                <span style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>{tab.icon}</span>
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{tab.label}</span>
                {'badge' in tab && tab.badge > 0 && (
                  <span style={{ minWidth: 16, height: 16, padding: '0 5px', background: 'var(--accent)', color: 'var(--accent-fg)', borderRadius: 99, fontSize: 9, lineHeight: '16px', fontWeight: 700, flexShrink: 0 }}>
                    {tab.badge}
                  </span>
                )}
              </button>
            ))}
          </div>

          <div style={{ flex: 1, overflowY: 'auto' }}>
            {sidebarTab === 'pages' && <PageThumbnails fileUrl={fileUrl} totalPages={totalPages} />}
            {sidebarTab === 'comments' && (
              <CommentsSidebar
                comments={comments}
                onAdd={handleAddComment}
                onStatusChange={handleCommentStatus}
                onDelete={handleDeleteComment}
                actor="owner"
              />
            )}
          </div>
        </div>

        {/* CANVAS AREA */}
        <div style={{ flex: 1, overflow: 'auto', background: 'var(--bg-2)' }}>
          <div style={{ minHeight: '100%', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: 40 }}>
            <div style={{ position: 'relative', boxShadow: 'var(--shadow-lg)' }}>
              <PDFViewer
                fileUrl={fileUrl}
                pageNumber={currentPage}
                zoom={zoom}
                onTotalPages={(t) => setTotalPages(t)}
                onPageRendered={(_, w, h) => setCanvasDimensions({ width: w / zoom, height: h / zoom })}
              />
              {canvasDimensions.width > 0 && (
                <AnnotationCanvas
                  documentId={documentId}
                  pageNumber={currentPage}
                  width={canvasDimensions.width * zoom}
                  height={canvasDimensions.height * zoom}
                  annotations={annotations}
                  onChange={handleAnnotationsChange}
                />
              )}
            </div>
          </div>
        </div>
      </div>

      {showShare && (
        <ShareModal
          shareLinks={shareLinks}
          onClose={() => setShowShare(false)}
          onCreateLink={handleCreateShareLink}
          onDeleteLink={handleDeleteShareLink}
          currentDocumentId={document.id}
          onOpenInEditor={(id) => {
            setShowShare(false);
            router.push(`/editor/${id}`);
          }}
        />
      )}
    </div>
  );
}
