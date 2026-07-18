'use client';

import { useEffect, useRef, useState } from 'react';
import { WorkspaceSummary } from '@/types';
import { ROLE_LABELS } from '@/lib/rbac-ui';
import { Check, ChevronDown, Plus, Building2 } from 'lucide-react';

interface Props {
  currentWorkspaceId: string | null;
  currentWorkspaceName: string;
  onSwitched: () => void;
}

export function WorkspaceSwitcher({ currentWorkspaceId, currentWorkspaceName, onSwitched }: Props) {
  const [open, setOpen] = useState(false);
  const [workspaces, setWorkspaces] = useState<WorkspaceSummary[]>([]);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [busy, setBusy] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    async function loadWorkspaces() {
      const res = await fetch('/api/workspaces');
      if (res.ok) setWorkspaces(await res.json());
    }
    loadWorkspaces();

    function onClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setCreating(false);
      }
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, [open]);

  async function switchWorkspace(workspaceId: string) {
    if (workspaceId === currentWorkspaceId) {
      setOpen(false);
      return;
    }
    setBusy(true);
    try {
      const res = await fetch('/api/workspaces/current', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workspaceId }),
      });
      if (res.ok) {
        setOpen(false);
        onSwitched();
      }
    } finally {
      setBusy(false);
    }
  }

  async function createWorkspace() {
    if (!newName.trim()) return;
    setBusy(true);
    try {
      const res = await fetch('/api/workspaces', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName.trim() }),
      });
      if (res.ok) {
        const workspace = await res.json();
        setNewName('');
        setCreating(false);
        await switchWorkspace(workspace.id);
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div ref={containerRef} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          display: 'flex', alignItems: 'center', gap: 6,
          background: 'var(--bg-2)', color: 'var(--text)',
          border: '1px solid var(--border)', borderRadius: 10,
          padding: '8px 12px', fontSize: 12, cursor: 'pointer',
          fontFamily: "'Instrument Sans', sans-serif", maxWidth: 200,
        }}
      >
        <Building2 size={13} style={{ flexShrink: 0, color: 'var(--text-3)' }} />
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {currentWorkspaceName}
        </span>
        <ChevronDown size={12} style={{ flexShrink: 0, color: 'var(--text-3)', transform: open ? 'rotate(180deg)' : 'none', transition: 'transform .15s' }} />
      </button>

      {open && (
        <div
          className="animate-fade-up"
          style={{
            position: 'absolute', top: 'calc(100% + 6px)', left: 0, zIndex: 200,
            width: 260, background: 'var(--bg-card)', border: '1px solid var(--border)',
            borderRadius: 12, boxShadow: 'var(--shadow-lg)', overflow: 'hidden',
          }}
        >
          <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.07em', textTransform: 'uppercase', color: 'var(--text-3)', padding: '10px 12px 6px', fontFamily: "'Instrument Sans', sans-serif" }}>
            Workspaces
          </p>
          <div style={{ maxHeight: 240, overflowY: 'auto', paddingBottom: 4 }}>
            {workspaces.map((workspace) => (
              <button
                key={workspace.id}
                onClick={() => switchWorkspace(workspace.id)}
                disabled={busy}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: 8,
                  padding: '8px 12px', border: 'none', background: 'transparent',
                  cursor: 'pointer', textAlign: 'left', transition: 'background .15s',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-2)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: "'Instrument Sans', sans-serif" }}>
                    {workspace.name}
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--text-3)' }}>{ROLE_LABELS[workspace.role]}</div>
                </div>
                {workspace.id === currentWorkspaceId && <Check size={13} style={{ color: 'var(--text)', flexShrink: 0 }} />}
              </button>
            ))}
          </div>

          <div style={{ borderTop: '1px solid var(--border)', padding: 8 }}>
            {creating ? (
              <div style={{ display: 'flex', gap: 5 }}>
                <input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && createWorkspace()}
                  placeholder="Workspace name"
                  autoFocus
                  style={{ flex: 1, background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: 8, padding: '6px 10px', fontSize: 11, color: 'var(--text)', outline: 'none', fontFamily: "'Instrument Sans', sans-serif" }}
                />
                <button
                  onClick={createWorkspace}
                  disabled={!newName.trim() || busy}
                  style={{ background: 'var(--accent)', color: 'var(--accent-fg)', border: 'none', borderRadius: 8, padding: '0 10px', fontSize: 11, fontWeight: 500, cursor: 'pointer', fontFamily: "'Instrument Sans', sans-serif", opacity: !newName.trim() || busy ? 0.5 : 1 }}
                >
                  Add
                </button>
              </div>
            ) : (
              <button
                onClick={() => setCreating(true)}
                style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '7px 0', borderRadius: 8, border: '1px dashed var(--border)', background: 'transparent', cursor: 'pointer', fontSize: 11, color: 'var(--text-3)', fontFamily: "'Instrument Sans', sans-serif", transition: 'all .15s' }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--border-strong)'; e.currentTarget.style.color = 'var(--text)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-3)'; }}
              >
                <Plus size={11} /> New workspace
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
