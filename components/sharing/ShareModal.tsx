'use client';

import { useMemo, useState } from 'react';
import { ShareLink, AccessType } from '@/types';
import { X, Copy, Check, Link, Trash2, Plus, Eye, MessageSquare, Edit3 } from 'lucide-react';

interface Props {
  shareLinks: ShareLink[];
  onClose: () => void;
  onCreateLink: (access: AccessType) => Promise<ShareLink>;
  onDeleteLink: (id: string) => Promise<void>;
  hiddenToken?: string;
  allowDelete?: boolean;
}

const ACCESS_OPTIONS: { id: AccessType; label: string; desc: string; icon: React.ReactNode }[] = [
  { id: 'VIEW',    label: 'Can view',    desc: 'Read-only access',       icon: <Eye size={12} /> },
  { id: 'COMMENT', label: 'Can comment', desc: 'View + add comments',    icon: <MessageSquare size={12} /> },
  { id: 'EDIT',    label: 'Can edit',    desc: 'Full annotation access', icon: <Edit3 size={12} /> },
];

export function ShareModal({
  shareLinks,
  onClose,
  onCreateLink,
  onDeleteLink,
  hiddenToken,
  allowDelete = true,
}: Props) {
  const [selectedAccess, setSelectedAccess] = useState<AccessType>('COMMENT');
  const [creating, setCreating] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [createdLink, setCreatedLink] = useState<ShareLink | null>(null);

  const appUrl = typeof window !== 'undefined' ? window.location.origin : '';

  const uniqueLinks = useMemo(() => {
    const seen = new Map<string, ShareLink>();

    for (const link of shareLinks) {
      if (hiddenToken && link.token === hiddenToken) continue;
      const key = link.id || link.token;
      if (!seen.has(key)) {
        seen.set(key, link);
      }
    }

    return Array.from(seen.values());
  }, [hiddenToken, shareLinks]);

  async function handleCreate() {
    setCreating(true);
    try {
      const link = await onCreateLink(selectedAccess);
      setCreatedLink(link);
      await copy(link.token, `created-${link.id}`);
    } finally {
      setCreating(false);
    }
  }

  async function handleDelete(id: string) {
    await onDeleteLink(id);
  }

  async function copy(token: string, id: string) {
    await navigator.clipboard.writeText(`${appUrl}/review/${token}`);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, background: 'rgba(0,0,0,.55)' }}>
      <div className="animate-fade-up" style={{ width: '100%', maxWidth: 460, background: 'var(--bg-card)', borderRadius: 20, overflow: 'hidden', boxShadow: 'var(--shadow-lg)', border: '1px solid var(--border)' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 36, height: 36, background: 'var(--bg-2)', borderRadius: 10, border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Link size={15} style={{ color: 'var(--text-2)' }} />
            </div>
            <div>
              <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 18, letterSpacing: '-.01em', color: 'var(--text)' }}>Share document</h2>
              <p style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 1 }}>No login required for recipients</p>
            </div>
          </div>
          <button onClick={onClose}
            style={{ width: 32, height: 32, borderRadius: 8, border: '1px solid var(--border)', background: 'transparent', cursor: 'pointer', color: 'var(--text-3)', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all .15s' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-2)'; e.currentTarget.style.color = 'var(--text)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-3)'; }}
          >
            <X size={14} />
          </button>
        </div>

        <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Create new link */}
          <div style={{ background: 'var(--bg-2)', borderRadius: 12, padding: 16, border: '1px solid var(--border)' }}>
            <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.07em', textTransform: 'uppercase', color: 'var(--text-3)', marginBottom: 12, fontFamily: "'Instrument Sans', sans-serif" }}>Create link</p>
            <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
              {ACCESS_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => setSelectedAccess(opt.id)}
                  style={{
                    flex: 1, padding: '8px 4px', borderRadius: 8, cursor: 'pointer', fontSize: 11, fontWeight: 500,
                    border: `1px solid ${selectedAccess === opt.id ? 'var(--border-strong)' : 'var(--border)'}`,
                    background: selectedAccess === opt.id ? 'var(--bg-card)' : 'transparent',
                    color: selectedAccess === opt.id ? 'var(--text)' : 'var(--text-3)',
                    fontFamily: "'Instrument Sans', sans-serif", transition: 'all .15s',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                  }}
                >
                  {opt.icon}
                  {opt.label}
                </button>
              ))}
            </div>
            <button
              onClick={handleCreate}
              disabled={creating}
              style={{
                width: '100%', background: 'var(--accent)', color: 'var(--accent-fg)',
                border: 'none', borderRadius: 9, padding: '10px 0',
                fontSize: 13, fontWeight: 500, cursor: 'pointer',
                fontFamily: "'Instrument Sans', sans-serif",
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                opacity: creating ? .6 : 1, transition: 'opacity .15s',
              }}
            >
              <Plus size={13} />
              {creating ? 'Generating...' : 'Generate link'}
            </button>

            {createdLink && (
              <div style={{ marginTop: 12, padding: '10px 12px', borderRadius: 10, border: '1px solid #bfdbfe', background: '#eff6ff' }}>
                <p style={{ fontSize: 11, fontWeight: 600, color: '#1d4ed8', marginBottom: 4 }}>New link ready</p>
                <p style={{ fontSize: 10, color: '#1e3a8a', fontFamily: "'DM Mono', monospace", wordBreak: 'break-all' }}>
                  {appUrl}/review/{createdLink.token}
                </p>
              </div>
            )}
          </div>

          {/* Existing links */}
          {uniqueLinks.length > 0 && (
            <div>
              <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.07em', textTransform: 'uppercase', color: 'var(--text-3)', marginBottom: 10, fontFamily: "'Instrument Sans', sans-serif" }}>
                Active links ({uniqueLinks.length})
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {uniqueLinks.map((link) => {
                  const opt = ACCESS_OPTIONS.find((o) => o.id === link.access);
                  return (
                    <div key={link.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', border: '1px solid var(--border)', borderRadius: 10, background: 'var(--bg-card)', transition: 'border-color .15s' }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                          <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text)' }}>{opt?.label}</span>
                          <span style={{
                            fontSize: 9, fontWeight: 700, letterSpacing: '.05em', padding: '1px 6px', borderRadius: 99,
                            background: link.access === 'EDIT' ? '#fff7ed' : link.access === 'COMMENT' ? '#eff6ff' : 'var(--bg-2)',
                            color: link.access === 'EDIT' ? '#c2410c' : link.access === 'COMMENT' ? '#1d4ed8' : 'var(--text-3)',
                            border: `1px solid ${link.access === 'EDIT' ? '#fed7aa' : link.access === 'COMMENT' ? '#bfdbfe' : 'var(--border)'}`,
                          }}>
                            {link.access}
                          </span>
                        </div>
                        <p style={{ fontSize: 9, color: 'var(--text-3)', fontFamily: "'DM Mono', monospace", overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          /review/{link.token}
                        </p>
                      </div>
                      <button onClick={() => copy(link.token, link.id)}
                        style={{ width: 30, height: 30, borderRadius: 7, border: '1px solid var(--border)', background: 'transparent', cursor: 'pointer', color: copiedId === link.id ? '#16a34a' : 'var(--text-3)', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all .15s' }}>
                        {copiedId === link.id ? <Check size={12} /> : <Copy size={12} />}
                      </button>
                      {allowDelete && (
                        <button onClick={() => handleDelete(link.id)}
                          style={{ width: 30, height: 30, borderRadius: 7, border: '1px solid var(--border)', background: 'transparent', cursor: 'pointer', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all .15s' }}
                          onMouseEnter={e => (e.currentTarget.style.background = '#fef2f2')}
                          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                        >
                          <Trash2 size={11} />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
