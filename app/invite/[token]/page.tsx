'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { WorkspaceRole } from '@/types';
import { ROLE_LABELS } from '@/lib/rbac-ui';
import { Users, LogIn } from 'lucide-react';

type InvitationInfo = {
  workspaceName: string;
  email: string;
  role: WorkspaceRole;
  invitedBy: string | null;
};

export default function InvitePage() {
  const params = useParams();
  const router = useRouter();
  const token = params.token as string;

  const [invitation, setInvitation] = useState<InvitationInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [accepting, setAccepting] = useState(false);
  const [needsLogin, setNeedsLogin] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('markly-theme');
    if (saved) document.documentElement.setAttribute('data-theme', saved);

    async function load() {
      try {
        const [inviteRes, sessionRes] = await Promise.all([
          fetch(`/api/invitations/${token}`),
          fetch('/api/auth/session'),
        ]);

        if (!inviteRes.ok) {
          const err = await inviteRes.json().catch(() => ({}));
          throw new Error(err.error || 'Invitation not found');
        }

        setInvitation(await inviteRes.json());
        setNeedsLogin(!sessionRes.ok);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load invitation');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [token]);

  async function handleAccept() {
    setAccepting(true);
    setError(null);
    try {
      const res = await fetch(`/api/invitations/${token}`, { method: 'POST' });
      const data = await res.json().catch(() => ({}));

      if (res.status === 401) {
        setNeedsLogin(true);
        return;
      }
      if (!res.ok) throw new Error(data.error || 'Failed to accept invitation');

      router.push('/dashboard');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to accept invitation');
    } finally {
      setAccepting(false);
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)', padding: 16 }}>
      <div className="animate-fade-up" style={{ width: '100%', maxWidth: 420, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 20, padding: 36, textAlign: 'center', boxShadow: 'var(--shadow-lg)' }}>
        <div style={{ width: 48, height: 48, background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 18px' }}>
          <Users size={20} style={{ color: 'var(--text-2)' }} />
        </div>

        {loading && (
          <p style={{ fontSize: 13, color: 'var(--text-3)', fontFamily: "'Instrument Sans', sans-serif" }}>Loading invitation...</p>
        )}

        {!loading && error && !invitation && (
          <>
            <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 24, color: 'var(--text)', marginBottom: 8 }}>Invitation unavailable</h1>
            <p style={{ fontSize: 13, color: 'var(--text-3)' }}>{error}</p>
          </>
        )}

        {!loading && invitation && (
          <>
            <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 24, letterSpacing: '-.02em', color: 'var(--text)', marginBottom: 8 }}>
              Join {invitation.workspaceName}
            </h1>
            <p style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.6, marginBottom: 6 }}>
              {invitation.invitedBy ? `${invitation.invitedBy} invited you` : 'You were invited'} to join as{' '}
              <strong>{ROLE_LABELS[invitation.role]}</strong>.
            </p>
            <p style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 24 }}>
              Sent to {invitation.email}
            </p>

            {needsLogin ? (
              <>
                <p style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: 14 }}>
                  Log in with {invitation.email} to accept, then reopen this link.
                </p>
                <button
                  onClick={() => router.push('/login')}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'var(--accent)', color: 'var(--accent-fg)', border: 'none', borderRadius: 12, padding: '12px 24px', fontSize: 14, fontWeight: 500, cursor: 'pointer', fontFamily: "'Instrument Sans', sans-serif" }}
                >
                  <LogIn size={14} /> Log in to continue
                </button>
              </>
            ) : (
              <button
                onClick={handleAccept}
                disabled={accepting}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'var(--accent)', color: 'var(--accent-fg)', border: 'none', borderRadius: 12, padding: '12px 28px', fontSize: 14, fontWeight: 500, cursor: 'pointer', fontFamily: "'Instrument Sans', sans-serif", opacity: accepting ? 0.6 : 1 }}
              >
                {accepting ? 'Joining...' : 'Accept invitation →'}
              </button>
            )}

            {error && (
              <p style={{ fontSize: 11, color: '#b91c1c', marginTop: 14 }}>{error}</p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
