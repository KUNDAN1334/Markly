'use client';

import { useCallback, useEffect, useState } from 'react';
import { WorkspaceInvitation, WorkspaceMember, WorkspaceRole } from '@/types';
import { ROLE_LABELS, roleCanManageWorkspace } from '@/lib/rbac-ui';
import { X, Users, Mail, Copy, Check, Trash2, Crown } from 'lucide-react';

interface Props {
  workspaceId: string;
  workspaceName: string;
  myRole: WorkspaceRole;
  currentUserId?: string;
  onClose: () => void;
}

const INVITABLE_ROLES: WorkspaceRole[] = ['ADMIN', 'EDITOR', 'COMMENTER', 'VIEWER'];

export function MembersModal({ workspaceId, workspaceName, myRole, currentUserId, onClose }: Props) {
  const [members, setMembers] = useState<WorkspaceMember[]>([]);
  const [invitations, setInvitations] = useState<WorkspaceInvitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<WorkspaceRole>('EDITOR');
  const [inviting, setInviting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [lastInviteUrl, setLastInviteUrl] = useState<string | null>(null);

  const canManage = roleCanManageWorkspace(myRole);

  const load = useCallback(async () => {
    const requests: Promise<Response>[] = [fetch(`/api/workspaces/${workspaceId}/members`)];
    if (canManage) requests.push(fetch(`/api/workspaces/${workspaceId}/invitations`));

    const [membersRes, invitationsRes] = await Promise.all(requests);
    if (membersRes.ok) setMembers(await membersRes.json());
    if (invitationsRes?.ok) setInvitations(await invitationsRes.json());
    setLoading(false);
  }, [workspaceId, canManage]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleInvite() {
    if (!inviteEmail.trim()) return;
    setInviting(true);
    setError(null);
    setLastInviteUrl(null);
    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/invitations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: inviteEmail.trim(), role: inviteRole }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to send invitation');
      setInviteEmail('');
      setLastInviteUrl(data.inviteUrl || null);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to send invitation');
    } finally {
      setInviting(false);
    }
  }

  async function handleRoleChange(userId: string, role: WorkspaceRole) {
    const res = await fetch(`/api/workspaces/${workspaceId}/members`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, role }),
    });
    if (res.ok) await load();
  }

  async function handleRemoveMember(userId: string) {
    if (!confirm('Remove this member from the workspace?')) return;
    const res = await fetch(`/api/workspaces/${workspaceId}/members`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId }),
    });
    if (res.ok) await load();
  }

  async function handleRevokeInvitation(invitationId: string) {
    const res = await fetch(`/api/workspaces/${workspaceId}/invitations`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ invitationId }),
    });
    if (res.ok) await load();
  }

  async function copyInviteLink(invitation: WorkspaceInvitation) {
    const url = invitation.inviteUrl || `${window.location.origin}/invite/${invitation.token}`;
    await navigator.clipboard.writeText(url);
    setCopiedId(invitation.id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, background: 'rgba(0,0,0,.55)' }}>
      <div className="animate-fade-up" style={{ width: '100%', maxWidth: 520, maxHeight: '85vh', display: 'flex', flexDirection: 'column', background: 'var(--bg-card)', borderRadius: 20, overflow: 'hidden', boxShadow: 'var(--shadow-lg)', border: '1px solid var(--border)' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 36, height: 36, background: 'var(--bg-2)', borderRadius: 10, border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Users size={15} style={{ color: 'var(--text-2)' }} />
            </div>
            <div>
              <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 18, letterSpacing: '-.01em', color: 'var(--text)' }}>Members</h2>
              <p style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 1 }}>{workspaceName}</p>
            </div>
          </div>
          <button onClick={onClose}
            style={{ width: 32, height: 32, borderRadius: 8, border: '1px solid var(--border)', background: 'transparent', cursor: 'pointer', color: 'var(--text-3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <X size={14} />
          </button>
        </div>

        <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 20, overflowY: 'auto' }}>

          {/* Invite (OWNER/ADMIN only) */}
          {canManage && (
            <div style={{ background: 'var(--bg-2)', borderRadius: 12, padding: 16, border: '1px solid var(--border)' }}>
              <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.07em', textTransform: 'uppercase', color: 'var(--text-3)', marginBottom: 12, fontFamily: "'Instrument Sans', sans-serif" }}>
                Invite by email
              </p>
              <div style={{ display: 'flex', gap: 6 }}>
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleInvite()}
                  placeholder="teammate@company.com"
                  style={{ flex: 1, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, padding: '8px 10px', fontSize: 12, color: 'var(--text)', outline: 'none', fontFamily: "'Instrument Sans', sans-serif" }}
                />
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as WorkspaceRole)}
                  style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, padding: '8px 8px', fontSize: 11, color: 'var(--text)', cursor: 'pointer', fontFamily: "'Instrument Sans', sans-serif" }}
                >
                  {INVITABLE_ROLES.map((role) => (
                    <option key={role} value={role}>{ROLE_LABELS[role]}</option>
                  ))}
                </select>
                <button
                  onClick={handleInvite}
                  disabled={!inviteEmail.trim() || inviting}
                  style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'var(--accent)', color: 'var(--accent-fg)', border: 'none', borderRadius: 8, padding: '0 12px', fontSize: 12, fontWeight: 500, cursor: 'pointer', fontFamily: "'Instrument Sans', sans-serif", opacity: !inviteEmail.trim() || inviting ? 0.5 : 1 }}
                >
                  <Mail size={12} /> {inviting ? 'Inviting...' : 'Invite'}
                </button>
              </div>
              {error && (
                <p style={{ fontSize: 11, color: '#b91c1c', marginTop: 8 }}>{error}</p>
              )}
              {lastInviteUrl && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 10, padding: '8px 10px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8 }}>
                  <p style={{ flex: 1, fontSize: 10, color: 'var(--text-2)', fontFamily: "'DM Mono', monospace", overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {lastInviteUrl}
                  </p>
                  <button
                    onClick={async () => { await navigator.clipboard.writeText(lastInviteUrl); setCopiedId('last'); setTimeout(() => setCopiedId(null), 2000); }}
                    style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'transparent', border: '1px solid var(--border)', borderRadius: 6, padding: '4px 8px', fontSize: 10, cursor: 'pointer', color: copiedId === 'last' ? '#16a34a' : 'var(--text-3)', fontFamily: "'Instrument Sans', sans-serif" }}
                  >
                    {copiedId === 'last' ? <Check size={10} /> : <Copy size={10} />} Copy invite link
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Member list */}
          <div>
            <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.07em', textTransform: 'uppercase', color: 'var(--text-3)', marginBottom: 10, fontFamily: "'Instrument Sans', sans-serif" }}>
              Members ({members.length})
            </p>
            {loading && <p style={{ fontSize: 11, color: 'var(--text-3)', fontStyle: 'italic' }}>Loading...</p>}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {members.map((member) => (
                <div key={member.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', border: '1px solid var(--border)', borderRadius: 10, background: 'var(--bg-card)' }}>
                  <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'var(--bg-2)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflow: 'hidden' }}>
                    {member.user.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={member.user.imageUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-2)' }}>
                        {(member.user.name || member.user.email || '?').charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: "'Instrument Sans', sans-serif" }}>
                      {member.user.name || member.user.email || 'Unknown'}
                      {member.isOwner && <Crown size={11} style={{ color: '#c2410c', flexShrink: 0 }} />}
                      {member.userId === currentUserId && <span style={{ fontSize: 9, color: 'var(--text-3)' }}>(you)</span>}
                    </div>
                    <p style={{ fontSize: 10, color: 'var(--text-3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{member.user.email}</p>
                  </div>
                  {member.isOwner || !canManage ? (
                    <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-2)', background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: 99, padding: '2px 8px' }}>
                      {ROLE_LABELS[member.role]}
                    </span>
                  ) : (
                    <>
                      <select
                        value={member.role}
                        onChange={(e) => handleRoleChange(member.userId, e.target.value as WorkspaceRole)}
                        style={{ background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: 7, padding: '4px 6px', fontSize: 10, color: 'var(--text)', cursor: 'pointer', fontFamily: "'Instrument Sans', sans-serif" }}
                      >
                        {INVITABLE_ROLES.map((role) => (
                          <option key={role} value={role}>{ROLE_LABELS[role]}</option>
                        ))}
                      </select>
                      <button
                        onClick={() => handleRemoveMember(member.userId)}
                        title="Remove member"
                        style={{ width: 28, height: 28, borderRadius: 7, border: '1px solid var(--border)', background: 'transparent', cursor: 'pointer', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = '#fef2f2')}
                        onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                      >
                        <Trash2 size={11} />
                      </button>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Pending invitations */}
          {canManage && invitations.length > 0 && (
            <div>
              <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.07em', textTransform: 'uppercase', color: 'var(--text-3)', marginBottom: 10, fontFamily: "'Instrument Sans', sans-serif" }}>
                Pending invitations ({invitations.length})
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {invitations.map((invitation) => (
                  <div key={invitation.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', border: '1px dashed var(--border)', borderRadius: 10 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 12, color: 'var(--text-2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: "'Instrument Sans', sans-serif" }}>{invitation.email}</p>
                      <p style={{ fontSize: 10, color: 'var(--text-3)' }}>{ROLE_LABELS[invitation.role]}</p>
                    </div>
                    <button
                      onClick={() => copyInviteLink(invitation)}
                      title="Copy invite link"
                      style={{ width: 28, height: 28, borderRadius: 7, border: '1px solid var(--border)', background: 'transparent', cursor: 'pointer', color: copiedId === invitation.id ? '#16a34a' : 'var(--text-3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    >
                      {copiedId === invitation.id ? <Check size={11} /> : <Copy size={11} />}
                    </button>
                    <button
                      onClick={() => handleRevokeInvitation(invitation.id)}
                      title="Revoke invitation"
                      style={{ width: 28, height: 28, borderRadius: 7, border: '1px solid var(--border)', background: 'transparent', cursor: 'pointer', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    >
                      <Trash2 size={11} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
