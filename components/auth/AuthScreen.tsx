'use client';

import { Github, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { firebaseAuth, githubProvider, googleProvider } from '@/lib/firebase-client';
import { signInWithPopup } from 'firebase/auth';

type ProviderId = 'google' | 'github';

export function AuthScreen({
  mode,
}: {
  mode: 'login' | 'signup';
}) {
  const router = useRouter();
  const [loading, setLoading] = useState<ProviderId | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/auth/session').then((res) => {
      if (res.ok) {
        router.replace('/dashboard');
      }
    });
  }, [router]);

  async function handleAuth(providerId: ProviderId) {
    setLoading(providerId);
    setError(null);

    try {
      const provider = providerId === 'google' ? googleProvider : githubProvider;
      const result = await signInWithPopup(firebaseAuth, provider);
      const idToken = await result.user.getIdToken();

      const res = await fetch('/api/auth/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken }),
      });

      if (!res.ok) {
        const payload = await res.json().catch(() => ({ error: 'Login failed' }));
        throw new Error(payload.error || 'Login failed');
      }

      router.push('/dashboard');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication failed');
    } finally {
      setLoading(null);
    }
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
        background:
          'radial-gradient(circle at top, rgba(231,76,60,.12), transparent 28%), var(--bg)',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 440,
          borderRadius: 24,
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          boxShadow: 'var(--shadow-lg)',
          padding: 32,
        }}
      >
        <div style={{ marginBottom: 28 }}>
          <p style={{ fontSize: 11, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--text-3)', marginBottom: 10 }}>
            Markly
          </p>
          <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 34, color: 'var(--text)', letterSpacing: '-.03em', lineHeight: 1.05 }}>
            {mode === 'login' ? 'Log in to your workspace' : 'Create your workspace'}
          </h1>
          <p style={{ marginTop: 10, color: 'var(--text-2)', fontSize: 14, lineHeight: 1.6 }}>
            Use Google or GitHub to access your projects, uploads, and private dashboard.
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <button
            onClick={() => handleAuth('google')}
            disabled={loading !== null}
            style={{
              height: 48,
              borderRadius: 14,
              border: '1px solid var(--border)',
              background: 'var(--bg)',
              color: 'var(--text)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 10,
              cursor: 'pointer',
              fontSize: 14,
              fontWeight: 600,
            }}
          >
            {loading === 'google' ? <Loader2 size={16} className="animate-spin" /> : <span style={{ fontSize: 18, lineHeight: 1 }}>G</span>}
            Continue with Google
          </button>

          <button
            onClick={() => handleAuth('github')}
            disabled={loading !== null}
            style={{
              height: 48,
              borderRadius: 14,
              border: '1px solid var(--border)',
              background: 'var(--text)',
              color: 'var(--accent-fg)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 10,
              cursor: 'pointer',
              fontSize: 14,
              fontWeight: 600,
            }}
          >
            {loading === 'github' ? <Loader2 size={16} className="animate-spin" /> : <Github size={16} />}
            Continue with GitHub
          </button>
        </div>

        {error && (
          <p style={{ marginTop: 14, color: '#b91c1c', fontSize: 13 }}>
            {error}
          </p>
        )}

        <p style={{ marginTop: 22, fontSize: 12, color: 'var(--text-3)', lineHeight: 1.6 }}>
          Shared review links stay public. Only the main platform workspace requires authentication.
        </p>
      </div>
    </div>
  );
}
