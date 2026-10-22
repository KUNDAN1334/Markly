'use client';

import { useState } from 'react';
import { Comment, CommentStatus, CommentStatusEvent } from '@/types';
import { allowedStatusChanges, StatusActor } from '@/lib/comment-status';
import { CheckCircle2, Trash2, Plus, MessageSquare, X, Wrench, RotateCcw, ChevronRight, BadgeCheck } from 'lucide-react';
import { useEditorStore } from '@/lib/store';

interface Props {
  comments: Comment[];
  onAdd: (content: string, page: number, annotationId?: string) => Promise<void>;
  onStatusChange: (id: string, status: CommentStatus, note?: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  // Who is looking: the signed-in owner (editor) or a reviewer on a share link.
  actor: StatusActor;
  readonly?: boolean;
}

type Filter = 'ALL' | CommentStatus;

type Tone = { color: string; bg: string; border: string };

const TONES: Record<CommentStatus | 'REOPENED', Tone & { label: string }> = {
  OPEN:     { label: 'Open',     color: 'var(--text-2)',          bg: 'var(--bg-2)',               border: 'var(--border)' },
  REOPENED: { label: 'Reopened', color: 'var(--status-reopened)', bg: 'var(--status-reopened-bg)', border: 'var(--status-reopened-border)' },
  FIXED:    { label: 'Fixed',    color: 'var(--status-fixed)',    bg: 'var(--status-fixed-bg)',    border: 'var(--status-fixed-border)' },
  VERIFIED: { label: 'Verified', color: 'var(--status-verified)', bg: 'var(--status-verified-bg)', border: 'var(--status-verified-border)' },
};

const FONT = "'Instrument Sans', sans-serif";

function formatWhen(iso: string) {
  return new Date(iso).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
}

function describeEvent(event: CommentStatusEvent) {
  if (event.toStatus === 'FIXED') return 'Marked fixed';
  if (event.toStatus === 'VERIFIED') return event.fromStatus === 'FIXED' ? 'Verified the fix' : 'Resolved';
  if (event.fromStatus === 'VERIFIED') return 'Reopened';
  return event.actorUserId ? 'Undid the fix' : 'Still broken';
}

function lastEvent(comment: Comment) {
  const events = comment.statusEvents ?? [];
  return events.length > 0 ? events[events.length - 1] : undefined;
}

// The fix the owner described most recently, shown while the item is fixed or verified.
function latestFix(comment: Comment) {
  if (comment.status === 'OPEN') return undefined;
  return [...(comment.statusEvents ?? [])].reverse().find((event) => event.toStatus === 'FIXED');
}

// A comment counts as reopened when it went back to OPEN after a fix or verification.
function reopenEvent(comment: Comment) {
  const last = lastEvent(comment);
  return comment.status === 'OPEN' && last?.toStatus === 'OPEN' ? last : undefined;
}

export function CommentsSidebar({ comments, onAdd, onStatusChange, onDelete, actor, readonly }: Props) {
  const { currentPage } = useEditorStore();
  const [newComment, setNewComment] = useState('');
  const [adding, setAdding] = useState(false);
  const [loading, setLoading] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>('ALL');
  const [noteFor, setNoteFor] = useState<{ id: string; status: CommentStatus } | null>(null);
  const [noteText, setNoteText] = useState('');
  const [historyOpen, setHistoryOpen] = useState<Set<string>>(new Set());
  const [errorFor, setErrorFor] = useState<{ id: string; message: string } | null>(null);

  const counts = {
    OPEN: comments.filter((c) => c.status === 'OPEN').length,
    FIXED: comments.filter((c) => c.status === 'FIXED').length,
    VERIFIED: comments.filter((c) => c.status === 'VERIFIED').length,
  };
  const total = comments.length;
  const visible = comments.filter((c) => filter === 'ALL' || c.status === filter);

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

  async function changeStatus(id: string, status: CommentStatus, note?: string) {
    setLoading(id);
    setErrorFor(null);
    try {
      await onStatusChange(id, status, note?.trim() || undefined);
      setNoteFor(null);
      setNoteText('');
    } catch (e) {
      setErrorFor({ id, message: e instanceof Error ? e.message : 'Failed to update comment' });
    } finally {
      setLoading(null);
    }
  }

  function toggleHistory(id: string) {
    setHistoryOpen((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  function actionButton(comment: Comment, target: CommentStatus) {
    const busy = loading === comment.id;
    const fromFixed = comment.status === 'FIXED';

    // Marking fixed and sending a fix back both ask for an optional note first.
    const asksForNote = target === 'FIXED' || (target === 'OPEN' && actor === 'share' && fromFixed);
    const onClick = asksForNote
      ? () => { setNoteFor({ id: comment.id, status: target }); setNoteText(''); setErrorFor(null); }
      : () => changeStatus(comment.id, target);

    let label: string;
    let icon: React.ReactNode;
    let tone: Tone;
    if (target === 'FIXED') {
      label = 'Mark fixed'; icon = <Wrench size={9} />; tone = TONES.FIXED;
    } else if (target === 'VERIFIED') {
      label = actor === 'share' ? 'Verify fix' : 'Resolve'; icon = <BadgeCheck size={9} />; tone = TONES.VERIFIED;
    } else if (actor === 'share' && fromFixed) {
      label = 'Still broken'; icon = <RotateCcw size={9} />; tone = TONES.REOPENED;
    } else {
      label = fromFixed ? 'Undo fix' : 'Reopen'; icon = <RotateCcw size={9} />; tone = TONES.OPEN;
    }

    const primary = target === 'VERIFIED' && actor === 'share';

    return (
      <button
        key={target}
        onClick={onClick}
        disabled={busy}
        style={{
          flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, padding: '4px 0', borderRadius: 6,
          border: `1px solid ${primary ? tone.color : tone.border}`,
          background: primary ? tone.color : tone.bg,
          color: primary ? 'var(--bg-card)' : tone.color,
          cursor: busy ? 'default' : 'pointer', fontSize: 10, fontWeight: 600, fontFamily: FONT, transition: 'all .15s', opacity: busy ? .6 : 1,
        }}
      >
        {icon}
        {label}
      </button>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header: progress toward every flagged item being verified */}
      <div style={{ padding: '10px 12px', borderBottom: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.07em', textTransform: 'uppercase', color: 'var(--text-3)' }}>Review</span>
          {total > 0 && (
            <span style={{ fontSize: 10, color: 'var(--text-2)', fontFamily: FONT }}>
              <strong style={{ color: 'var(--text)' }}>{counts.VERIFIED}</strong> of {total} verified
            </span>
          )}
        </div>

        {total > 0 && (
          <div style={{ display: 'flex', height: 5, borderRadius: 99, overflow: 'hidden', background: 'var(--bg-2)', gap: 1 }}>
            {counts.VERIFIED > 0 && <div style={{ flex: counts.VERIFIED, background: 'var(--status-verified)' }} />}
            {counts.FIXED > 0 && <div style={{ flex: counts.FIXED, background: 'var(--status-fixed)' }} />}
            {counts.OPEN > 0 && <div style={{ flex: counts.OPEN, background: 'var(--border-strong)' }} />}
          </div>
        )}

        {actor === 'share' && counts.FIXED > 0 && (
          <button
            onClick={() => setFilter('FIXED')}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 8px', borderRadius: 7, border: `1px solid ${TONES.FIXED.border}`, background: TONES.FIXED.bg, color: TONES.FIXED.color, fontSize: 10, fontWeight: 600, fontFamily: FONT, cursor: 'pointer', textAlign: 'left' }}
          >
            <Wrench size={10} />
            {counts.FIXED === 1 ? '1 fix is waiting for your check' : `${counts.FIXED} fixes are waiting for your check`}
          </button>
        )}

        {/* Filters double as the legend for the bar above */}
        <div style={{ display: 'flex', gap: 3 }}>
          {(['ALL', 'OPEN', 'FIXED', 'VERIFIED'] as const).map((id) => {
            const active = filter === id;
            const count = id === 'ALL' ? total : counts[id];
            const dot = id === 'OPEN' ? 'var(--border-strong)' : id === 'FIXED' ? 'var(--status-fixed)' : id === 'VERIFIED' ? 'var(--status-verified)' : null;
            return (
              <button
                key={id}
                onClick={() => setFilter(id)}
                style={{
                  flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, height: 22, borderRadius: 6,
                  border: `1px solid ${active ? 'var(--border-strong)' : 'transparent'}`,
                  background: active ? 'var(--bg-2)' : 'transparent',
                  color: active ? 'var(--text)' : 'var(--text-3)',
                  fontSize: 10, fontWeight: 500, fontFamily: FONT, cursor: 'pointer', whiteSpace: 'nowrap',
                }}
              >
                {dot && <span style={{ width: 6, height: 6, borderRadius: '50%', background: dot, flexShrink: 0 }} />}
                {id === 'ALL' ? 'All' : TONES[id].label}
                <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, opacity: .8 }}>{count}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Comment list */}
      <div style={{ flex: 1, overflowY: 'auto', padding: 8 }}>
        {visible.length === 0 && (
          <div style={{ textAlign: 'center', padding: '32px 16px', color: 'var(--text-3)' }}>
            <MessageSquare size={20} style={{ margin: '0 auto 8px', opacity: .3 }} />
            <p style={{ fontSize: 11, fontStyle: 'italic' }}>{total === 0 ? 'No comments yet' : 'Nothing here'}</p>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {visible.map((comment) => {
            const reopened = reopenEvent(comment);
            const fix = latestFix(comment);
            const tone = reopened ? TONES.REOPENED : TONES[comment.status];
            const events = comment.statusEvents ?? [];
            const showHistory = historyOpen.has(comment.id);
            const targets = readonly ? [] : allowedStatusChanges(comment.status, {
              actor,
              // Only the owner signs in, so a comment with an author id is the owner's own note.
              isOwnComment: actor === 'owner' && !!comment.authorUserId,
            });
            const awaitingMyCheck = actor === 'share' && comment.status === 'FIXED';

            return (
              <div key={comment.id} style={{
                background: comment.status === 'VERIFIED' ? 'transparent' : 'var(--bg-card)',
                border: `1px solid ${awaitingMyCheck ? TONES.FIXED.border : 'var(--border)'}`,
                borderRadius: 10, padding: 10,
                opacity: comment.status === 'VERIFIED' ? .7 : 1,
                transition: 'all .15s',
              }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6 }}>
                  <div style={{ width: 22, height: 22, borderRadius: '50%', background: 'var(--bg-2)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <span style={{ fontSize: 8, fontWeight: 700, color: 'var(--text-2)', fontFamily: FONT }}>P{comment.pageNumber}</span>
                  </div>
                  <p style={{ fontSize: 11, color: 'var(--text-2)', lineHeight: 1.5, flex: 1, minWidth: 0, wordBreak: 'break-word', overflowWrap: 'break-word' }}>
                    {comment.content}
                  </p>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 3, flexShrink: 0, fontSize: 9, fontWeight: 600, padding: '2px 7px', borderRadius: 99, color: tone.color, background: tone.bg, border: `1px solid ${tone.border}`, fontFamily: FONT }}>
                    {comment.status === 'VERIFIED' && <CheckCircle2 size={9} />}
                    {tone.label}
                  </span>
                </div>

                <div style={{ marginTop: 6, fontSize: 9, color: 'var(--text-3)', fontFamily: "'DM Mono', monospace" }}>
                  {comment.authorName || 'Reviewer'} · {new Date(comment.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </div>

                {fix && (
                  <div style={{ marginTop: 8, padding: '6px 8px', borderRadius: 7, background: TONES.FIXED.bg, border: `1px solid ${TONES.FIXED.border}` }}>
                    <div style={{ fontSize: 9, fontWeight: 600, color: TONES.FIXED.color, fontFamily: FONT }}>
                      Fixed by {fix.actorName || 'Owner'} · {formatWhen(fix.createdAt)}
                    </div>
                    {fix.note && <p style={{ fontSize: 11, color: 'var(--text)', lineHeight: 1.45, marginTop: 2, wordBreak: 'break-word' }}>{fix.note}</p>}
                  </div>
                )}

                {reopened && (
                  <div style={{ marginTop: 8, padding: '6px 8px', borderRadius: 7, background: TONES.REOPENED.bg, border: `1px solid ${TONES.REOPENED.border}` }}>
                    <div style={{ fontSize: 9, fontWeight: 600, color: TONES.REOPENED.color, fontFamily: FONT }}>
                      {describeEvent(reopened)} · {reopened.actorName || 'Reviewer'} · {formatWhen(reopened.createdAt)}
                    </div>
                    {reopened.note && <p style={{ fontSize: 11, color: 'var(--text)', lineHeight: 1.45, marginTop: 2, wordBreak: 'break-word' }}>{reopened.note}</p>}
                  </div>
                )}

                {events.length > 0 && (
                  <button
                    onClick={() => toggleHistory(comment.id)}
                    style={{ marginTop: 6, display: 'flex', alignItems: 'center', gap: 3, padding: 0, background: 'none', border: 'none', cursor: 'pointer', fontSize: 9, color: 'var(--text-3)', fontFamily: FONT }}
                  >
                    <ChevronRight size={9} style={{ transform: showHistory ? 'rotate(90deg)' : 'none', transition: 'transform .15s' }} />
                    History ({events.length + 1})
                  </button>
                )}

                {showHistory && (
                  <ol style={{ listStyle: 'none', margin: '6px 0 0', padding: '0 0 0 6px', borderLeft: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 5 }}>
                    <li style={{ fontSize: 9, color: 'var(--text-3)', fontFamily: FONT }}>
                      <span style={{ color: 'var(--text-2)', fontWeight: 600 }}>Flagged</span> by {comment.authorName || 'Reviewer'} · {formatWhen(comment.createdAt)}
                    </li>
                    {events.map((event) => (
                      <li key={event.id} style={{ fontSize: 9, color: 'var(--text-3)', fontFamily: FONT }}>
                        <span style={{ color: event.toStatus === 'OPEN' ? TONES.REOPENED.color : TONES[event.toStatus].color, fontWeight: 600 }}>{describeEvent(event)}</span>
                        {' '}by {event.actorName || 'Reviewer'} · {formatWhen(event.createdAt)}
                        {event.note && <div style={{ color: 'var(--text-2)', marginTop: 1, wordBreak: 'break-word' }}>&ldquo;{event.note}&rdquo;</div>}
                      </li>
                    ))}
                  </ol>
                )}

                {noteFor?.id === comment.id && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 5, marginTop: 8 }}>
                    <textarea
                      value={noteText}
                      onChange={(e) => setNoteText(e.target.value)}
                      placeholder={noteFor.status === 'FIXED' ? 'What changed? (optional)' : "What's still wrong? (optional)"}
                      rows={2}
                      maxLength={500}
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) changeStatus(comment.id, noteFor.status, noteText);
                        if (e.key === 'Escape') { setNoteFor(null); setNoteText(''); }
                      }}
                      style={{ width: '100%', background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: 7, padding: '6px 8px', fontSize: 11, color: 'var(--text)', resize: 'none', outline: 'none', fontFamily: FONT, lineHeight: 1.45 }}
                    />
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button
                        onClick={() => changeStatus(comment.id, noteFor.status, noteText)}
                        disabled={loading === comment.id}
                        style={{ flex: 1, background: 'var(--accent)', color: 'var(--accent-fg)', border: 'none', borderRadius: 6, padding: '5px 0', fontSize: 10, fontWeight: 600, cursor: 'pointer', fontFamily: FONT }}
                      >
                        {loading === comment.id ? 'Saving...' : noteFor.status === 'FIXED' ? 'Mark fixed' : 'Send back'}
                      </button>
                      <button onClick={() => { setNoteFor(null); setNoteText(''); }}
                        style={{ width: 26, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'transparent', border: '1px solid var(--border)', borderRadius: 6, cursor: 'pointer', color: 'var(--text-3)' }}>
                        <X size={10} />
                      </button>
                    </div>
                  </div>
                )}

                {errorFor?.id === comment.id && (
                  <p style={{ marginTop: 6, fontSize: 10, color: 'var(--status-reopened)', fontFamily: FONT }}>{errorFor.message}</p>
                )}

                {!readonly && noteFor?.id !== comment.id && (
                  <div style={{ display: 'flex', gap: 4, marginTop: 8, paddingTop: 8, borderTop: '1px solid var(--border)' }}>
                    {targets.map((target) => actionButton(comment, target))}
                    {targets.length === 0 && (
                      <span style={{ flex: 1, fontSize: 9, color: 'var(--text-3)', fontFamily: FONT, alignSelf: 'center' }}>
                        {actor === 'share' && comment.status === 'OPEN' ? 'Waiting on the owner' : ''}
                      </span>
                    )}
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
                      style={{ width: 28, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 6, border: '1px solid var(--border)', background: 'transparent', cursor: 'pointer', color: '#ef4444', transition: 'all .15s', flexShrink: 0 }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'var(--status-reopened-bg)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                    >
                      <Trash2 size={9} />
                    </button>
                  </div>
                )}
              </div>
            );
          })}
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
                  resize: 'none', outline: 'none', fontFamily: FONT,
                  lineHeight: 1.5, transition: 'border-color .15s',
                }}
                onFocus={e => (e.target.style.borderColor = 'var(--border-strong)')}
                onBlur={e => (e.target.style.borderColor = 'var(--border)')}
              />
              <div style={{ display: 'flex', gap: 5 }}>
                <button
                  onClick={handleAdd}
                  disabled={!newComment.trim() || loading === 'add'}
                  style={{ flex: 1, background: 'var(--accent)', color: 'var(--accent-fg)', border: 'none', borderRadius: 7, padding: '6px 0', fontSize: 11, fontWeight: 500, cursor: 'pointer', fontFamily: FONT, opacity: !newComment.trim() ? .45 : 1 }}
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
                fontFamily: FONT, transition: 'all .15s',
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
