'use client';

import { useEditorStore } from '@/lib/store';
import { Tool } from '@/types';
import { cn } from '@/lib/utils';
import {
  MousePointer2, Square, Circle, Minus, ArrowRight,
  Highlighter, Pen, Type, ZoomIn, ZoomOut, Save,
  Undo2, Redo2, Download, Share2, ChevronLeft, ChevronRight,
  Sun, Moon,
} from 'lucide-react';
import { useState, useEffect } from 'react';

const TOOLS: { id: Tool; icon: React.ReactNode; label: string; shortcut: string }[] = [
  { id: 'select',    icon: <MousePointer2 size={14} />, label: 'Select',    shortcut: 'S' },
  { id: 'rectangle', icon: <Square size={14} />,        label: 'Rectangle', shortcut: 'R' },
  { id: 'circle',    icon: <Circle size={14} />,         label: 'Circle',    shortcut: 'C' },
  { id: 'arrow',     icon: <ArrowRight size={14} />,     label: 'Arrow',     shortcut: 'A' },
  { id: 'line',      icon: <Minus size={14} />,           label: 'Line',      shortcut: 'L' },
  { id: 'highlight', icon: <Highlighter size={14} />,    label: 'Highlight', shortcut: 'H' },
  { id: 'freehand',  icon: <Pen size={14} />,             label: 'Freehand',  shortcut: 'F' },
  { id: 'text',      icon: <Type size={14} />,            label: 'Text',      shortcut: 'T' },
];

const STROKE_COLORS = ['#0d0d0c', '#dc2626', '#16a34a', '#2563eb', '#d97706', '#7c3aed', '#db2777', '#0891b2'];
const STROKE_WIDTHS = [1, 2, 4, 6];

interface ToolbarProps {
  onSave: () => void;
  onExport: () => void;
  onShare: () => void;
  isSaving: boolean;
  isDirty: boolean;
}

export function Toolbar({ onSave, onExport, onShare, isSaving, isDirty }: ToolbarProps) {
  const {
    activeTool, setActiveTool,
    strokeColor, setStrokeColor,
    strokeWidth, setStrokeWidth,
    fontSize, setFontSize,
    opacity, setOpacity,
    zoom, zoomIn, zoomOut, setZoom,
    currentPage, totalPages, setCurrentPage,
    undo, redo,
  } = useEditorStore();

  const [theme, setTheme] = useState<'light'|'dark'>('light');

  useEffect(() => {
    const saved = localStorage.getItem('markly-theme') as 'light'|'dark'|null;
    if (saved) setTheme(saved);
  }, []);

  function toggleTheme() {
    const next = theme === 'light' ? 'dark' : 'light';
    setTheme(next);
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('markly-theme', next);
  }

  const divider = <div style={{ width: 1, height: 28, background: 'var(--border)', flexShrink: 0 }} />;

  return (
    <div style={{
      height: 48, background: 'var(--bg-card)', borderBottom: '1px solid var(--border)',
      display: 'flex', alignItems: 'center', gap: 4, padding: '0 12px',
      flexShrink: 0, overflowX: 'auto', position: 'relative', zIndex: 10,
    }}>

      {/* TOOLS */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 2, paddingRight: 8 }}>
        {TOOLS.map((tool) => (
          <button
            key={tool.id}
            onClick={() => setActiveTool(tool.id)}
            title={`${tool.label}  (${tool.shortcut})`}
            style={{
              width: 32, height: 32, borderRadius: 8, border: 'none',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', transition: 'all .15s',
              background: activeTool === tool.id ? 'var(--accent)' : 'transparent',
              color: activeTool === tool.id ? 'var(--accent-fg)' : 'var(--text-3)',
            }}
            onMouseEnter={e => { if (activeTool !== tool.id) { e.currentTarget.style.background = 'var(--bg-2)'; e.currentTarget.style.color = 'var(--text)'; } }}
            onMouseLeave={e => { if (activeTool !== tool.id) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-3)'; } }}
          >
            {tool.icon}
          </button>
        ))}
      </div>

      {divider}

      {/* COLORS */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '0 10px' }}>
        <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: '.06em', textTransform: 'uppercase', color: 'var(--text-3)' }}>Color</span>
        <div style={{ display: 'flex', gap: 3 }}>
          {STROKE_COLORS.map((color) => (
            <button
              key={color}
              onClick={() => setStrokeColor(color)}
              style={{
                width: 18, height: 18, borderRadius: '50%', border: 'none', cursor: 'pointer',
                background: color,
                outline: strokeColor === color ? `2px solid var(--text)` : '2px solid transparent',
                outlineOffset: 2,
                transform: strokeColor === color ? 'scale(1.15)' : 'scale(1)',
                transition: 'all .15s',
              }}
            />
          ))}
          <input
            type="color" value={strokeColor}
            onChange={(e) => setStrokeColor(e.target.value)}
            title="Custom color"
            style={{ width: 18, height: 18, borderRadius: '50%', border: 'none', cursor: 'pointer', padding: 0 }}
          />
        </div>
      </div>

      {divider}

      {/* STROKE WIDTH */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '0 10px' }}>
        <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: '.06em', textTransform: 'uppercase', color: 'var(--text-3)' }}>Width</span>
        {STROKE_WIDTHS.map((w) => (
          <button
            key={w}
            onClick={() => setStrokeWidth(w)}
            style={{
              width: 26, height: 26, borderRadius: 6, border: '1px solid',
              borderColor: strokeWidth === w ? 'var(--border-strong)' : 'transparent',
              background: strokeWidth === w ? 'var(--bg-2)' : 'transparent',
              fontSize: 11, fontWeight: 500, cursor: 'pointer', color: 'var(--text-2)',
              fontFamily: "'DM Mono', monospace",
              transition: 'all .15s',
            }}
          >{w}</button>
        ))}
      </div>

      {divider}

      {/* FONT SIZE - only for text tool */}
      {activeTool === 'text' && (
        <>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '0 10px' }}>
            <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: '.06em', textTransform: 'uppercase', color: 'var(--text-3)' }}>Size</span>
            <select
              value={fontSize}
              onChange={(e) => setFontSize(Number(e.target.value))}
              style={{
                background: 'var(--bg-2)', border: '1px solid var(--border)',
                borderRadius: 6, padding: '3px 6px', fontSize: 11, color: 'var(--text)',
                fontFamily: "'DM Mono', monospace", cursor: 'pointer',
              }}
            >
              {[10,12,14,16,18,20,24,28,32,40,48].map((s) => (
                <option key={s} value={s}>{s}px</option>
              ))}
            </select>
          </div>
          {divider}
        </>
      )}

      {/* OPACITY */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '0 10px' }}>
        <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: '.06em', textTransform: 'uppercase', color: 'var(--text-3)' }}>Opacity</span>
        <input
          type="range" min="0.1" max="1" step="0.1" value={opacity}
          onChange={(e) => setOpacity(Number(e.target.value))}
          style={{ width: 60, accentColor: 'var(--accent)', cursor: 'pointer' }}
        />
        <span style={{ fontSize: 10, color: 'var(--text-3)', fontFamily: "'DM Mono', monospace", minWidth: 28 }}>
          {Math.round(opacity * 100)}%
        </span>
      </div>

      {divider}

      {/* UNDO / REDO */}
      <div style={{ display: 'flex', gap: 2, padding: '0 6px' }}>
        {[
          { icon: <Undo2 size={13} />, action: () => undo(), label: 'Undo (⌘Z)' },
          { icon: <Redo2 size={13} />, action: () => redo(), label: 'Redo (⌘Y)' },
        ].map((btn, i) => (
          <button key={i} onClick={btn.action} title={btn.label}
            style={{ width: 30, height: 30, borderRadius: 7, border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-3)', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all .15s' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-2)'; e.currentTarget.style.color = 'var(--text)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-3)'; }}
          >{btn.icon}</button>
        ))}
      </div>

      {divider}

      {/* PAGE NAV */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '0 8px' }}>
        <button onClick={() => setCurrentPage(Math.max(1, currentPage - 1))} disabled={currentPage <= 1}
          style={{ width: 26, height: 26, borderRadius: 6, border: '1px solid var(--border)', background: 'var(--bg-2)', cursor: 'pointer', color: 'var(--text-3)', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: currentPage <= 1 ? .35 : 1 }}>
          <ChevronLeft size={12} />
        </button>
        <span style={{ fontSize: 11, color: 'var(--text-2)', fontFamily: "'DM Mono', monospace", whiteSpace: 'nowrap', padding: '0 4px' }}>
          {currentPage} / {totalPages}
        </span>
        <button onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))} disabled={currentPage >= totalPages}
          style={{ width: 26, height: 26, borderRadius: 6, border: '1px solid var(--border)', background: 'var(--bg-2)', cursor: 'pointer', color: 'var(--text-3)', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: currentPage >= totalPages ? .35 : 1 }}>
          <ChevronRight size={12} />
        </button>
      </div>

      {divider}

      {/* ZOOM */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 3, padding: '0 8px' }}>
        <button onClick={zoomOut}
          style={{ width: 26, height: 26, borderRadius: 6, border: '1px solid var(--border)', background: 'var(--bg-2)', cursor: 'pointer', color: 'var(--text-3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <ZoomOut size={12} />
        </button>
        <button onClick={() => setZoom(1)}
          style={{ fontSize: 10, fontFamily: "'DM Mono', monospace", color: 'var(--text-2)', padding: '0 6px', minWidth: 44, textAlign: 'center', background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: 6, height: 26, cursor: 'pointer' }}>
          {Math.round(zoom * 100)}%
        </button>
        <button onClick={zoomIn}
          style={{ width: 26, height: 26, borderRadius: 6, border: '1px solid var(--border)', background: 'var(--bg-2)', cursor: 'pointer', color: 'var(--text-3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <ZoomIn size={12} />
        </button>
      </div>

      {/* SPACER */}
      <div style={{ flex: 1 }} />

      {/* ACTIONS */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <button onClick={toggleTheme}
          style={{ width: 32, height: 32, borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-2)', cursor: 'pointer', color: 'var(--text-3)', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all .15s' }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--border-strong)'; e.currentTarget.style.color = 'var(--text)'; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-3)'; }}
        >
          {theme === 'light' ? <Moon size={13} /> : <Sun size={13} />}
        </button>

        <button
          onClick={onSave} disabled={isSaving || !isDirty}
          style={{
            display: 'flex', alignItems: 'center', gap: 5,
            padding: '0 12px', height: 32, borderRadius: 8,
            border: '1px solid var(--border)', background: 'var(--bg-2)',
            fontSize: 12, fontWeight: 500, cursor: 'pointer', color: 'var(--text-2)',
            fontFamily: "'Instrument Sans', sans-serif",
            opacity: isSaving || !isDirty ? .5 : 1, transition: 'all .15s',
          }}
        >
          <Save size={12} />
          {isSaving ? 'Saving...' : isDirty ? 'Save*' : 'Saved'}
        </button>

        <button
          onClick={onShare}
          style={{
            display: 'flex', alignItems: 'center', gap: 5,
            padding: '0 12px', height: 32, borderRadius: 8,
            border: '1px solid var(--border)', background: 'var(--bg-2)',
            fontSize: 12, fontWeight: 500, cursor: 'pointer', color: 'var(--text-2)',
            fontFamily: "'Instrument Sans', sans-serif", transition: 'all .15s',
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--border-strong)'; e.currentTarget.style.color = 'var(--text)'; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-2)'; }}
        >
          <Share2 size={12} /> Share
        </button>

        <button
          onClick={onExport}
          style={{
            display: 'flex', alignItems: 'center', gap: 5,
            padding: '0 14px', height: 32, borderRadius: 8,
            border: 'none', background: 'var(--accent)',
            fontSize: 12, fontWeight: 500, cursor: 'pointer', color: 'var(--accent-fg)',
            fontFamily: "'Instrument Sans', sans-serif", transition: 'opacity .15s',
          }}
          onMouseEnter={e => (e.currentTarget.style.opacity = '.8')}
          onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
        >
          <Download size={12} /> Export PDF
        </button>
      </div>
    </div>
  );
}
