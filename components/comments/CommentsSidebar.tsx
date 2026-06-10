'use client';

import { useState } from 'react';
import { Comment } from '@/types';
import { CheckCircle2, Trash2, Plus, MessageSquare, X } from 'lucide-react';
import { useEditorStore } from '@/lib/store';

interface Props {
  comments: Comment[];
  onAdd: (content: string, page: number, annotationId?: string) => Promise<void>;
  onResolve: (id: string, resolved: boolean) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  readonly?: boolean;
}

export function CommentsSidebar({ comments, onAdd, onResolve, onDelete, readonly }: Props) {
  const { currentPage } = useEditorStore();
  const [newComment, setNewComment] = useState('');
  const [adding, setAdding] = useState(false);
  const [loading, setLoading] = useState<string | null>(null);
  const [showResolved, setShowResolved] = useState(false);

  const visible = comments.filter((c) => showResolved || !c.resolved);
  const unresolvedCount = comments.filter((c) => !c.resolved).length;

  async function handleAdd() {
    if (!newComment.trim()) return;
    setLoading('add');
    try {
      await onAdd(newComment.trim(), currentPage);
      setNewComment('');
      setAdding(false);
    } finally {
      setLoading(null);
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <div style={{ padding: '10px 12px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.07em', textTransform: 'uppercase', color: 'var(--text-3)' }}>All</span>
          {unresolvedCount > 0 && (
            <span style={{ fontSize: 9, fontWeight: 700, background: 'var(--accent)', color: 'var(--accent-fg)', borderRadius: 99, padding: '1px 6px' }}>
              {unresolvedCount}
            </span>
          )}
        </div>
        <button
          onClick={() => setShowResolved(!showResolved)}
          style={{ fontSize: 10, color: 'var(--text-3)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: "'Instrument Sans', sans-serif" }}
        >
          {showResolved ? 'Hide resolved' : 'Show resolved'}
        </button>
      </div>

      {/* Comment list */}
      <div style={{ flex: 1, overflowY: 'auto', padding: 8 }}>
        {visible.length === 0 && (
          <div style={{ textAlign: 'center', padding: '32px 16px', color: 'var(--text-3)' }}>
            <MessageSquare size={20} style={{ margin: '0 auto 8px', opacity: .3 }} />
            <p style={{ fontSize: 11, fontStyle: 'italic' }}>No comments yet</p>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {visible.map((comment) => (
            <div key={comment.id} style={{
              background: comment.resolved ? 'transparent' : 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: 10, padding: 10,
              opacity: comment.resolved ? .55 : 1,
              transition: 'all .15s',
            }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6 }}>
                <div style={{ width: 22, height: 22, borderRadius: '50%', background: 'var(--bg-2)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <span style={{ fontSize: 8, fontWeight: 700, color: 'var(--text-2)', fontFamily: "'Instrument Sans', sans-serif" }}>P{comment.pageNumber}</span>
                </div>
                <p style={{
  fontSize: 11,
  color: 'var(--text-2)',
  lineHeight: 1.5,
  flex: 1,
  minWidth: 0,          
  wordBreak: 'break-word',
  overflowWrap: 'break-word',
}}>
  {comment.content}
</p>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 }}>
                <span style={{ fontSize: 9, color: 'var(--text-3)', fontFamily: "'DM Mono', monospace" }}>
                  {new Date(comment.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </span>
                {comment.resolved ? (
                  <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 9, color: '#16a34a' }}>
                    <CheckCircle2 size={9} /> Resolved
                  </span>
                ) : null}
              </div>

              {!readonly && (
                <div style={{ display: 'flex', gap: 4, marginTop: 8, paddingTop: 8, borderTop: '1px solid var(--border)' }}>
                  <button
                    onClick={async () => {
                      setLoading(comment.id);
                      try {
                        await onResolve(comment.id, !comment.resolved);
                      } finally {
                        setLoading(null);
                      }
                    }}
                    disabled={loading === comment.id}
                    style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, padding: '4px 0', borderRadius: 6, border: '1px solid var(--border)', background: 'transparent', cursor: 'pointer', fontSize: 10, fontWeight: 500, color: comment.resolved ? 'var(--text-3)' : '#16a34a', fontFamily: "'Instrument Sans', sans-serif", transition: 'all .15s' }}
                  >
                    <CheckCircle2 size={9} />
                    {comment.resolved ? 'Unresolve' : 'Resolve'}
                  </button>
                  <button
                    onClick={async () => {
                      setLoading(comment.id);
                      try {
                        await onDelete(comment.id);
                      } finally {
                        setLoading(null);
                      }
                    }}
                    disabled={loading === comment.id}
                    style={{ width: 28, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 6, border: '1px solid var(--border)', background: 'transparent', cursor: 'pointer', color: '#ef4444', transition: 'all .15s' }}
                    onMouseEnter={e => (e.currentTarget.style.background = '#fef2f2')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    <Trash2 size={9} />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Add comment */}
      {!readonly && (
        <div style={{ padding: 8, borderTop: '1px solid var(--border)' }}>
          {adding ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Add a comment..."
                rows={3}
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleAdd();
                  if (e.key === 'Escape') { setAdding(false); setNewComment(''); }
                }}
                style={{
                  width: '100%', background: 'var(--bg-2)', border: '1px solid var(--border)',
                  borderRadius: 8, padding: '8px 10px', fontSize: 11, color: 'var(--text)',
                  resize: 'none', outline: 'none', fontFamily: "'Instrument Sans', sans-serif",
                  lineHeight: 1.5, transition: 'border-color .15s',
                }}
                onFocus={e => (e.target.style.borderColor = 'var(--border-strong)')}
                onBlur={e => (e.target.style.borderColor = 'var(--border)')}
              />
              <div style={{ display: 'flex', gap: 5 }}>
                <button
                  onClick={handleAdd}
                  disabled={!newComment.trim() || loading === 'add'}
                  style={{ flex: 1, background: 'var(--accent)', color: 'var(--accent-fg)', border: 'none', borderRadius: 7, padding: '6px 0', fontSize: 11, fontWeight: 500, cursor: 'pointer', fontFamily: "'Instrument Sans', sans-serif", opacity: !newComment.trim() ? .45 : 1 }}
                >
                  {loading === 'add' ? 'Adding...' : 'Add comment'}
                </button>
                <button onClick={() => { setAdding(false); setNewComment(''); }}
                  style={{ width: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'transparent', border: '1px solid var(--border)', borderRadius: 7, cursor: 'pointer', color: 'var(--text-3)' }}>
                  <X size={11} />
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setAdding(true)}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                padding: '8px 0', borderRadius: 8, border: '1px dashed var(--border)',
                background: 'transparent', cursor: 'pointer', fontSize: 11, color: 'var(--text-3)',
                fontFamily: "'Instrument Sans', sans-serif", transition: 'all .15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--border-strong)'; e.currentTarget.style.color = 'var(--text)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-3)'; }}
            >
              <Plus size={11} /> Comment on page {currentPage}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
