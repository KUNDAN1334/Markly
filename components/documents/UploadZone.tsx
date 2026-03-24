'use client';

import { useState, useCallback, useRef } from 'react';
import { Upload, FileText, X, AlertCircle } from 'lucide-react';
import { getUploadSupportMessage, isSupportedUpload } from '@/lib/document-formats';
import { formatBytes } from '@/lib/utils';

interface Props { projectId: string; onUploaded: (documentId: string) => void; }

export function UploadZone({ projectId, onUploaded }: Props) {
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback((f: File) => {
    setError(null);
    if (!isSupportedUpload(f)) { setError(getUploadSupportMessage()); return; }
    if (f.size > 50 * 1024 * 1024) { setError('File too large (max 50MB)'); return; }
    setFile(f);
  }, []);

  async function handleUpload() {
    if (!file) return;
    setUploading(true);
    setError(null);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('projectId', projectId);
    try {
      const res = await fetch('/api/documents/upload', { method: 'POST', body: formData });
      if (!res.ok) { const e = await res.json(); throw new Error(e.error || 'Upload failed'); }
      const doc = await res.json();
      onUploaded(doc.id);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => { e.preventDefault(); setIsDragging(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
        onClick={() => inputRef.current?.click()}
        style={{
          border: `2px ${file ? 'solid' : 'dashed'} ${isDragging ? 'var(--accent)' : file ? 'var(--border-strong)' : 'var(--border)'}`,
          borderRadius: 14, padding: file ? '16px 20px' : '32px 20px',
          cursor: 'pointer', textAlign: 'center', background: isDragging ? 'var(--bg-2)' : 'transparent',
          transition: 'all .2s',
        }}
        onMouseEnter={e => { if (!file) { (e.currentTarget as HTMLDivElement).style.background = 'var(--bg-2)'; (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--border-strong)'; } }}
        onMouseLeave={e => { if (!file) { (e.currentTarget as HTMLDivElement).style.background = 'transparent'; (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--border)'; } }}
      >
        <input ref={inputRef} type="file" accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document" className="hidden" style={{ display: 'none' }} onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />

        {file ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 40, height: 40, background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <FileText size={18} style={{ color: 'var(--text-2)' }} />
            </div>
            <div style={{ flex: 1, textAlign: 'left', minWidth: 0 }}>
              <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{file.name}</p>
              <p style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 2, fontFamily: "'DM Mono', monospace" }}>{formatBytes(file.size)}</p>
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); setFile(null); }}
              style={{ width: 24, height: 24, borderRadius: 6, border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <X size={13} />
            </button>
          </div>
        ) : (
          <>
            <div style={{ width: 48, height: 48, background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
              <Upload size={20} style={{ color: 'var(--text-3)' }} />
            </div>
            <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)', marginBottom: 4 }}>Drop PDF or DOCX here or click to browse</p>
            <p style={{ fontSize: 11, color: 'var(--text-3)' }}>Up to 50MB</p>
          </>
        )}
      </div>

      {error && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, color: '#dc2626', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '8px 12px' }}>
          <AlertCircle size={13} />
          {error}
        </div>
      )}

      {uploading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{ height: 3, background: 'var(--bg-2)', borderRadius: 99, overflow: 'hidden' }}>
            <div className="animate-pulse" style={{ height: '100%', width: '60%', background: 'var(--accent)', borderRadius: 99 }} />
          </div>
          <p style={{ fontSize: 11, color: 'var(--text-3)', textAlign: 'center', fontFamily: "'Instrument Sans', sans-serif" }}>Uploading...</p>
        </div>
      )}

      {file && !uploading && (
        <button
          onClick={handleUpload}
          style={{
            width: '100%', background: 'var(--accent)', color: 'var(--accent-fg)',
            border: 'none', borderRadius: 10, padding: '11px 0',
            fontSize: 14, fontWeight: 500, cursor: 'pointer',
            fontFamily: "'Instrument Sans', sans-serif", transition: 'opacity .15s',
          }}
          onMouseEnter={e => (e.currentTarget.style.opacity = '.8')}
          onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
        >
          Open in editor →
        </button>
      )}
    </div>
  );
}
