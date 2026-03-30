'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { BillingModal } from '@/components/billing/BillingModal';
import { UploadZone } from '@/components/documents/UploadZone';
import { Project, Workspace } from '@/types';
import { Plus, X, FolderOpen, Clock, Trash2, FileText, Sun, Moon, CreditCard } from 'lucide-react';

function ThemeToggle() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    const saved = localStorage.getItem('markly-theme') as 'light' | 'dark' | null;
    const nextTheme = saved || 'light';
    setTheme(nextTheme);
    document.documentElement.setAttribute('data-theme', nextTheme);
  }, []);

  function toggle() {
    const nextTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(nextTheme);
    document.documentElement.setAttribute('data-theme', nextTheme);
    localStorage.setItem('markly-theme', nextTheme);
  }

  return (
    <button
      onClick={toggle}
      className="w-9 h-9 rounded-lg flex items-center justify-center transition-all"
      style={{ background: 'var(--bg-2)', border: '1px solid var(--border)', color: 'var(--text-2)' }}
      aria-label="Toggle theme"
    >
      {theme === 'light' ? <Moon size={15} /> : <Sun size={15} />}
    </button>
  );
}

function NewProjectModal({ onClose, onCreate }: { onClose: () => void; onCreate: (p: Project) => void }) {
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCreate() {
    if (!name.trim()) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim() }),
      });

      const project = await res.json().catch(() => ({ error: 'Failed to create project' }));
      if (!res.ok) {
        throw new Error(project.error || 'Failed to create project');
      }

      onCreate(project);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create project');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,.5)' }}>
      <div className="w-full max-w-md rounded-2xl overflow-hidden animate-fade-up" style={{ background: 'var(--bg-card)', boxShadow: 'var(--shadow-lg)', border: '1px solid var(--border)' }}>
        <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
          <div>
            <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 20, letterSpacing: '-.01em', color: 'var(--text)' }}>New project</h2>
            <p style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 2 }}>Give your review workspace a name</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg transition-all"
            style={{ color: 'var(--text-3)', background: 'transparent' }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-2)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
          >
            <X size={15} />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label style={{ fontSize: 11, fontWeight: 600, letterSpacing: '.06em', textTransform: 'uppercase', color: 'var(--text-3)', display: 'block', marginBottom: 8 }}>Project name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
              placeholder="e.g. Q4 Contracts Review"
              autoFocus
              style={{
                width: '100%',
                background: 'var(--bg-2)',
                border: '1px solid var(--border)',
                borderRadius: 10,
                padding: '10px 14px',
                fontSize: 14,
                color: 'var(--text)',
                outline: 'none',
                fontFamily: "'Instrument Sans', sans-serif",
                transition: 'border-color .15s',
              }}
              onFocus={(e) => (e.target.style.borderColor = 'var(--border-strong)')}
              onBlur={(e) => (e.target.style.borderColor = 'var(--border)')}
            />
          </div>
          <button
            onClick={handleCreate}
            disabled={!name.trim() || loading}
            style={{
              width: '100%',
              background: 'var(--accent)',
              color: 'var(--accent-fg)',
              border: 'none',
              borderRadius: 10,
              padding: '11px 0',
              fontSize: 14,
              fontWeight: 500,
              cursor: 'pointer',
              fontFamily: "'Instrument Sans', sans-serif",
              opacity: !name.trim() || loading ? 0.45 : 1,
              transition: 'opacity .15s',
            }}
          >
            {loading ? 'Creating...' : 'Create project →'}
          </button>
          {error && (
            <div style={{ fontSize: 12, color: '#b91c1c', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, padding: '10px 12px' }}>
              {error}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function UploadModal({ project, onClose, onUploaded }: { project: Project; onClose: () => void; onUploaded: (id: string) => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,.5)' }}>
      <div className="w-full max-w-md rounded-2xl overflow-hidden animate-fade-up" style={{ background: 'var(--bg-card)', boxShadow: 'var(--shadow-lg)', border: '1px solid var(--border)' }}>
        <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
          <div>
            <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 20, letterSpacing: '-.01em', color: 'var(--text)' }}>Upload Document</h2>
            <p style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 2 }}>{project.name}</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg transition-all"
            style={{ color: 'var(--text-3)' }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-2)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
          >
            <X size={15} />
          </button>
        </div>
        <div className="p-6">
          <UploadZone projectId={project.id} onUploaded={onUploaded} />
        </div>
      </div>
    </div>
  );
}

function ProjectCard({ project, onUpload, onDelete, onOpenDoc }: {
  project: Project;
  onUpload: () => void;
  onDelete: () => void;
  onOpenDoc: (id: string) => void;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)',
        overflow: 'hidden',
        boxShadow: hovered ? 'var(--shadow-md)' : 'var(--shadow-sm)',
        borderColor: hovered ? 'var(--border-strong)' : 'var(--border)',
        transition: 'all .2s',
      }}
    >
      <div className="p-5" style={{ borderBottom: '1px solid var(--border)' }}>
        <div className="flex items-start justify-between mb-3">
          <div style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            background: hovered ? 'var(--accent)' : 'var(--bg-2)',
            border: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all .2s',
          }}>
            <FolderOpen size={15} style={{ color: hovered ? 'var(--accent-fg)' : 'var(--text-3)' }} />
          </div>
          <button
            onClick={onDelete}
            title="Delete project"
            style={{
              width: 28,
              height: 28,
              borderRadius: 8,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              opacity: hovered ? 1 : 0,
              color: 'var(--text-3)',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              transition: 'all .15s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = '#ef4444';
              e.currentTarget.style.background = '#fef2f2';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = 'var(--text-3)';
              e.currentTarget.style.background = 'transparent';
            }}
          >
            <Trash2 size={13} />
          </button>
        </div>
        <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 16, letterSpacing: '-.01em', color: 'var(--text)', marginBottom: 4 }}>
          {project.name}
        </div>
        <div style={{ fontSize: 11, color: 'var(--text-3)', display: 'flex', alignItems: 'center', gap: 5 }}>
          <Clock size={10} />
          {new Date(project.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          <span style={{ marginLeft: 6 }}>
            {(project.documents || []).length} doc{(project.documents || []).length !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      <div className="px-3 py-2" style={{ minHeight: 60 }}>
        {(project.documents || []).slice(0, 3).map((doc) => (
          <button
            key={doc.id}
            onClick={() => onOpenDoc(doc.id)}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '6px 8px',
              borderRadius: 8,
              border: 'none',
              background: 'transparent',
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'background .15s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-2)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
          >
            <FileText size={12} style={{ color: 'var(--text-3)', flexShrink: 0 }} />
            <span style={{ fontSize: 12, color: 'var(--text-2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {doc.originalName}
            </span>
          </button>
        ))}
        {(project.documents || []).length === 0 && (
          <p style={{ fontSize: 11, color: 'var(--text-3)', padding: '8px', fontStyle: 'italic' }}>No documents yet</p>
        )}
        {(project.documents || []).length > 3 && (
          <p style={{ fontSize: 11, color: 'var(--text-3)', padding: '4px 8px' }}>+{project.documents.length - 3} more</p>
        )}
      </div>

      <div className="px-3 pb-3">
        <button
          onClick={onUpload}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            padding: '7px 0',
            borderRadius: 8,
            fontSize: 12,
            cursor: 'pointer',
            border: '1px dashed var(--border)',
            background: 'transparent',
            color: 'var(--text-3)',
            transition: 'all .15s',
            fontFamily: "'Instrument Sans', sans-serif",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = 'var(--border-strong)';
            e.currentTarget.style.color = 'var(--text)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'var(--border)';
            e.currentTarget.style.color = 'var(--text-3)';
          }}
        >
          <Plus size={12} /> Upload PDF/DOCX
        </button>
      </div>
    </div>
  );
}

export default function HomePage() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [showNewProject, setShowNewProject] = useState(false);
  const [uploadingProject, setUploadingProject] = useState<Project | null>(null);
  const [showBilling, setShowBilling] = useState(false);

  async function loadWorkspace() {
    const workspaceRes = await fetch('/api/workspaces/current');
    if (!workspaceRes.ok) return;
    const workspaceData = await workspaceRes.json();
    setWorkspace(workspaceData);
  }

  useEffect(() => {
    const saved = localStorage.getItem('markly-theme');
    if (saved) document.documentElement.setAttribute('data-theme', saved);

    async function load() {
      const sessionRes = await fetch('/api/auth/session');
      if (!sessionRes.ok) {
        router.replace('/login');
        return;
      }

      const session = await sessionRes.json();
      setUserName(session.name || session.email || 'Workspace');
      setUserEmail(session.email || '');

      await loadWorkspace();

      const projectsRes = await fetch('/api/projects');
      if (!projectsRes.ok) {
        setLoading(false);
        return;
      }

      const data = await projectsRes.json();
      setProjects(data);
      setLoading(false);
    }

    load();
  }, [router]);

  async function handleLogout() {
    await fetch('/api/auth/session', { method: 'DELETE' });
    router.push('/');
    router.refresh();
  }

  async function handleProjectCreated(project: Project) {
    setProjects((prev) => [project, ...prev]);
    setShowNewProject(false);
    setUploadingProject(project);
    await loadWorkspace();
  }

  async function handleUploaded(documentId: string) {
    setUploadingProject(null);
    await loadWorkspace();
    router.push(`/editor/${documentId}`);
  }

  async function handleDeleteProject(id: string) {
    if (!confirm('Delete this project and all its documents?')) return;
    await fetch(`/api/projects/${id}`, { method: 'DELETE' });
    setProjects((prev) => prev.filter((project) => project.id !== id));
    await loadWorkspace();
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', position: 'relative' }}>
      <nav
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 100,
          background: 'color-mix(in srgb, var(--bg) 85%, transparent)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          borderBottom: '1px solid var(--border)',
        }}
      >
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 24px', display: 'flex', alignItems: 'center', height: 56, gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 32, height: 32 }}>
              <svg width="32" height="32" viewBox="0 0 40 40" fill="none">
                <path d="M20 6 L8 6 L8 20" stroke="var(--text)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M20 34 L32 34 L32 20" stroke="var(--text)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                <circle cx="20" cy="20" r="3" fill="var(--text)" />
                <path d="M13 20 Q17 18 20 20 Q23 22 27 20" stroke="var(--text)" strokeWidth="1.2" fill="none" strokeLinecap="round" />
              </svg>
            </div>
            <span style={{ fontFamily: "'DM Serif Display', serif", fontSize: 20, color: 'var(--text)', letterSpacing: '-.01em' }}>Markly</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {workspace && (
              <button
                onClick={() => setShowBilling(true)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  background: 'var(--bg-2)',
                  color: 'var(--text)',
                  border: '1px solid var(--border)',
                  borderRadius: 10,
                  padding: '8px 12px',
                  fontSize: 12,
                  cursor: 'pointer',
                  fontFamily: "'Instrument Sans', sans-serif",
                }}
              >
                <CreditCard size={13} />
                {workspace.currentPlan.name}
              </button>
            )}
            {userName && (
              <span style={{ fontSize: 12, color: 'var(--text-2)', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {userName}
              </span>
            )}
            <ThemeToggle />
            <button
              onClick={handleLogout}
              style={{
                background: 'transparent',
                color: 'var(--text-2)',
                border: '1px solid var(--border)',
                borderRadius: 10,
                padding: '8px 12px',
                fontSize: 12,
                cursor: 'pointer',
                fontFamily: "'Instrument Sans', sans-serif",
              }}
            >
              Log out
            </button>
          </div>

          <button
            onClick={() => setShowNewProject(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              background: 'var(--accent)',
              color: 'var(--accent-fg)',
              border: 'none',
              borderRadius: 10,
              padding: '8px 16px',
              fontSize: 13,
              fontWeight: 500,
              cursor: 'pointer',
              fontFamily: "'Instrument Sans', sans-serif",
              transition: 'opacity .15s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = '.8')}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
          >
            <Plus size={14} /> New Project
          </button>
        </div>
      </nav>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '48px 24px', position: 'relative', zIndex: 1 }}>
        {!loading && projects.length === 0 && (
          <div className="animate-fade-up" style={{ textAlign: 'center', padding: '80px 0' }}>
            <div style={{
              width: 64,
              height: 64,
              background: 'var(--bg-2)',
              border: '1px solid var(--border)',
              borderRadius: 16,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 24px',
            }}>
              <FileText size={26} style={{ color: 'var(--text-3)' }} />
            </div>
            <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 36, letterSpacing: '-.025em', color: 'var(--text)', marginBottom: 12 }}>
              Welcome to Markly
            </h1>
            <p style={{ fontSize: 15, color: 'var(--text-2)', maxWidth: 380, margin: '0 auto 32px', lineHeight: 1.6 }}>
              Annotate PDFs and DOCX files with Excalidraw-style tools. Share with a link - no login required.
            </p>
            <button
              onClick={() => setShowNewProject(true)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                background: 'var(--accent)',
                color: 'var(--accent-fg)',
                border: 'none',
                borderRadius: 12,
                padding: '12px 24px',
                fontSize: 14,
                fontWeight: 500,
                cursor: 'pointer',
                fontFamily: "'Instrument Sans', sans-serif",
              }}
            >
              <Plus size={15} /> Create your first project
            </button>
          </div>
        )}

        {loading && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
            {[1, 2, 3].map((index) => (
              <div key={index} className="animate-pulse" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 16, height: 200 }} />
            ))}
          </div>
        )}

        {!loading && projects.length > 0 && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, gap: 16, flexWrap: 'wrap' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: '.07em', textTransform: 'uppercase', color: 'var(--text-3)' }}>
                    Projects
                  </span>
                  <span style={{
                    fontSize: 10,
                    fontWeight: 600,
                    background: 'var(--bg-2)',
                    border: '1px solid var(--border)',
                    borderRadius: 99,
                    padding: '1px 7px',
                    color: 'var(--text-2)',
                  }}>
                    {projects.length}
                  </span>
                </div>
                <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 24, letterSpacing: '-.02em', color: 'var(--text)' }}>
                  Your workspaces
                </h2>
                {workspace && (
                  <p style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 6 }}>
                    {workspace.currentPlan.name} plan - {workspace.subscriptionStatus.replace('_', ' ')}
                  </p>
                )}
              </div>
              {workspace && (
                <button
                  onClick={() => setShowBilling(true)}
                  style={{
                    background: 'transparent',
                    color: 'var(--text-2)',
                    border: '1px solid var(--border)',
                    borderRadius: 10,
                    padding: '8px 12px',
                    fontSize: 12,
                    cursor: 'pointer',
                    fontFamily: "'Instrument Sans', sans-serif",
                  }}
                >
                  Manage billing
                </button>
              )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
              {projects.map((project, index) => (
                <div key={project.id} className="animate-fade-up" style={{ animationDelay: `${index * 0.05}s` }}>
                  <ProjectCard
                    project={project}
                    onUpload={() => setUploadingProject(project)}
                    onDelete={() => handleDeleteProject(project.id)}
                    onOpenDoc={(id) => router.push(`/editor/${id}`)}
                  />
                </div>
              ))}

              <button
                onClick={() => setShowNewProject(true)}
                style={{
                  background: 'transparent',
                  border: '1.5px dashed var(--border)',
                  borderRadius: 16,
                  padding: '32px 24px',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 10,
                  minHeight: 160,
                  transition: 'all .2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border-strong)';
                  e.currentTarget.style.background = 'var(--bg-2)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border)';
                  e.currentTarget.style.background = 'transparent';
                }}
              >
                <div style={{ width: 36, height: 36, background: 'var(--bg-2)', borderRadius: 10, border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Plus size={16} style={{ color: 'var(--text-3)' }} />
                </div>
                <span style={{ fontSize: 13, color: 'var(--text-3)', fontFamily: "'Instrument Sans', sans-serif" }}>New project</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {showNewProject && <NewProjectModal onClose={() => setShowNewProject(false)} onCreate={handleProjectCreated} />}
      {uploadingProject && <UploadModal project={uploadingProject} onClose={() => setUploadingProject(null)} onUploaded={handleUploaded} />}
      <BillingModal
        open={showBilling}
        onClose={() => setShowBilling(false)}
        workspace={workspace}
        currentUser={{ name: userName, email: userEmail }}
        onWorkspaceRefresh={loadWorkspace}
      />
    </div>
  );
}
