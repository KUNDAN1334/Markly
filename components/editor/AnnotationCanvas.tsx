'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useEditorStore } from '@/lib/store';
import { Annotation, AnnotationGeometry, AnnotationStyle, AnnotationType } from '@/types';
import { v4 as uuidv4 } from 'uuid';

interface AnnotationCanvasProps {
  documentId: string;
  pageNumber: number;
  width: number;
  height: number;
  annotations: Annotation[];
  onChange: (annotations: Annotation[]) => void;
  readonly?: boolean;
}

interface DrawingState {
  isActive: boolean;
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
  points: number[];
  annotationId: string;
}

export function AnnotationCanvas({
  documentId,
  pageNumber,
  width,
  height,
  annotations,
  onChange,
  readonly = false,
}: AnnotationCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const {
    activeTool, strokeColor, fillColor, strokeWidth,
    fontSize, opacity, zoom,
    selectedAnnotationIds, setSelectedAnnotationIds, clearSelection,
    setActiveTool,
  } = useEditorStore();

  const [drawing, setDrawing] = useState<DrawingState | null>(null);
  const [editingText, setEditingText] = useState<{
    id: string;
    x: number;
    y: number;
    width: number;
    height: number;
    isExisting: boolean;
  } | null>(null);
  const [textValue, setTextValue] = useState('');
  const [dragState, setDragState] = useState<{
    dragging: boolean; annotationId: string; offsetX: number; offsetY: number;
  } | null>(null);
  const textInputRef = useRef<HTMLTextAreaElement>(null);

  const beginTextEditing = useCallback((annotation?: Annotation, x?: number, y?: number) => {
    if (annotation) {
      setEditingText({
        id: annotation.id,
        x: annotation.geometry.x || 0,
        y: annotation.geometry.y || 0,
        width: annotation.geometry.width || 200,
        height: annotation.geometry.height || 50,
        isExisting: true,
      });
      setTextValue(annotation.content || '');
      setSelectedAnnotationIds([annotation.id]);
    } else if (typeof x === 'number' && typeof y === 'number') {
      setEditingText({
        id: uuidv4(),
        x,
        y,
        width: 200,
        height: 50,
        isExisting: false,
      });
      setTextValue('');
      clearSelection();
    }

    window.setTimeout(() => {
      textInputRef.current?.focus();
      textInputRef.current?.select();
    }, 50);
  }, [clearSelection, setSelectedAnnotationIds]);

  const getPageAnnotations = useCallback(
    () => annotations.filter((a) => a.pageNumber === pageNumber),
    [annotations, pageNumber]
  );

  // Draw all annotations to canvas
  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    ctx.clearRect(0, 0, width, height);

    const pageAnnotations = getPageAnnotations();

    for (const ann of pageAnnotations) {
      const style = ann.style;
      const geo = ann.geometry;
      const isSelected = selectedAnnotationIds.includes(ann.id);

      ctx.save();
      ctx.globalAlpha = style.opacity ?? 1;
      ctx.strokeStyle = style.stroke || '#000';
      ctx.lineWidth = (style.strokeWidth || 2) * zoom;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      const x = (geo.x || 0) * zoom;
      const y = (geo.y || 0) * zoom;
      const w = (geo.width || 0) * zoom;
      const h = (geo.height || 0) * zoom;

      drawAnnotation(ctx, ann, x, y, w, h, zoom, style);

      // Selection outline
      if (isSelected) {
        ctx.save();
        ctx.strokeStyle = '#0ea5e9';
        ctx.lineWidth = 2;
        ctx.setLineDash([4, 4]);
        const pad = 4;
        ctx.strokeRect(x - pad, y - pad, w + pad * 2, h + pad * 2);
        // Resize handle
        ctx.fillStyle = '#0ea5e9';
        ctx.fillRect(x + w + pad - 4, y + h + pad - 4, 8, 8);
        ctx.setLineDash([]);
        ctx.restore();
      }
      ctx.restore();
    }

    // Live drawing preview
    if (drawing?.isActive) {
      ctx.save();
      ctx.globalAlpha = opacity;
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = strokeWidth * zoom;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      const sx = drawing.startX * zoom;
      const sy = drawing.startY * zoom;
      const ex = drawing.currentX * zoom;
      const ey = drawing.currentY * zoom;

      if (activeTool === 'rectangle') {
        ctx.strokeRect(sx, sy, ex - sx, ey - sy);
      } else if (activeTool === 'circle') {
        ctx.beginPath();
        ctx.ellipse(
          sx + (ex - sx) / 2, sy + (ey - sy) / 2,
          Math.abs(ex - sx) / 2, Math.abs(ey - sy) / 2,
          0, 0, Math.PI * 2
        );
        ctx.stroke();
      } else if (activeTool === 'highlight') {
        ctx.fillStyle = '#fef08a';
        ctx.globalAlpha = 0.4;
        ctx.fillRect(sx, sy, ex - sx, ey - sy);
      } else if (activeTool === 'line') {
        ctx.beginPath();
        ctx.moveTo(sx, sy);
        ctx.lineTo(ex, ey);
        ctx.stroke();
      } else if (activeTool === 'arrow') {
        drawArrow(ctx, sx, sy, ex, ey);
      } else if (activeTool === 'freehand' && drawing.points.length >= 4) {
        ctx.beginPath();
        const pts = drawing.points.map((p, i) => (i % 2 === 0 ? p * zoom : p * zoom));
        ctx.moveTo(pts[0], pts[1]);
        for (let i = 2; i < pts.length; i += 2) {
          ctx.lineTo(pts[i], pts[i + 1]);
        }
        ctx.stroke();
      }
      ctx.restore();
    }
  }, [
    getPageAnnotations, width, height, zoom, drawing,
    activeTool, strokeColor, strokeWidth, opacity, selectedAnnotationIds,
  ]);

  useEffect(() => { render(); }, [render]);

  function drawAnnotation(
    ctx: CanvasRenderingContext2D,
    ann: Annotation,
    x: number, y: number, w: number, h: number,
    zoom: number, style: AnnotationStyle
  ) {
    switch (ann.type) {
      case 'rectangle':
        if (style.fill && style.fill !== 'transparent') {
          ctx.fillStyle = style.fill;
          ctx.fillRect(x, y, w, h);
        }
        ctx.strokeRect(x, y, w, h);
        break;

      case 'circle':
        ctx.beginPath();
        ctx.ellipse(x + w / 2, y + h / 2, Math.abs(w / 2), Math.abs(h / 2), 0, 0, Math.PI * 2);
        if (style.fill && style.fill !== 'transparent') {
          ctx.fillStyle = style.fill;
          ctx.fill();
        }
        ctx.stroke();
        break;

      case 'highlight':
        ctx.save();
        ctx.globalAlpha = 0.35;
        ctx.fillStyle = style.stroke || '#fef08a';
        ctx.fillRect(x, y, w, h);
        ctx.restore();
        break;

      case 'line':
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo((ann.geometry.endX || 0) * zoom, (ann.geometry.endY || 0) * zoom);
        ctx.stroke();
        break;

      case 'arrow':
        drawArrow(
          ctx, x, y,
          (ann.geometry.endX || 0) * zoom,
          (ann.geometry.endY || 0) * zoom
        );
        break;

      case 'freehand': {
        const pts = ann.geometry.points || [];
        if (pts.length < 4) break;
        ctx.beginPath();
        ctx.moveTo(pts[0] * zoom, pts[1] * zoom);
        for (let i = 2; i < pts.length; i += 2) {
          ctx.lineTo(pts[i] * zoom, pts[i + 1] * zoom);
        }
        ctx.stroke();
        break;
      }

      case 'text':
        if (ann.content) {
          const fs = (style.fontSize || 18) * zoom;
          ctx.font = `${fs}px "Virgil", "Comic Sans MS", cursive`;
          ctx.fillStyle = style.stroke || '#000';
          ctx.globalAlpha = style.opacity ?? 1;
          const lines = ann.content.split('\n');
          lines.forEach((line, i) => {
            ctx.fillText(line, x, y + fs + i * (fs * 1.3));
          });
        }
        break;
    }
  }

  function drawArrow(ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number) {
    const angle = Math.atan2(y2 - y1, x2 - x1);
    const len = 14;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x2, y2);
    ctx.lineTo(x2 - len * Math.cos(angle - 0.4), y2 - len * Math.sin(angle - 0.4));
    ctx.lineTo(x2 - len * Math.cos(angle + 0.4), y2 - len * Math.sin(angle + 0.4));
    ctx.closePath();
    ctx.fillStyle = ctx.strokeStyle;
    ctx.fill();
  }

  function getCursorCoords(e: React.MouseEvent<HTMLCanvasElement>) {
    const rect = canvasRef.current!.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left) / zoom,
      y: (e.clientY - rect.top) / zoom,
    };
  }

  function hitTest(ann: Annotation, x: number, y: number): boolean {
    const g = ann.geometry;
    const pad = 8;
    if (ann.type === 'line' || ann.type === 'arrow') {
      const dx = (g.endX || 0) - (g.x || 0);
      const dy = (g.endY || 0) - (g.y || 0);
      const t = ((x - (g.x || 0)) * dx + (y - (g.y || 0)) * dy) / (dx * dx + dy * dy);
      const ct = Math.max(0, Math.min(1, t));
      const nx = (g.x || 0) + ct * dx - x;
      const ny = (g.y || 0) + ct * dy - y;
      return Math.sqrt(nx * nx + ny * ny) < 10;
    }
    if (ann.type === 'freehand') {
      const pts = g.points || [];
      for (let i = 0; i < pts.length - 3; i += 2) {
        const dx = pts[i + 2] - pts[i];
        const dy = pts[i + 3] - pts[i + 1];
        const t = ((x - pts[i]) * dx + (y - pts[i + 1]) * dy) / (dx * dx + dy * dy);
        const ct = Math.max(0, Math.min(1, t));
        const nx = pts[i] + ct * dx - x;
        const ny = pts[i + 1] + ct * dy - y;
        if (Math.sqrt(nx * nx + ny * ny) < 8) return true;
      }
      return false;
    }
    return (
      x >= (g.x || 0) - pad && x <= (g.x || 0) + (g.width || 0) + pad &&
      y >= (g.y || 0) - pad && y <= (g.y || 0) + (g.height || 0) + pad
    );
  }

  function onMouseDown(e: React.MouseEvent<HTMLCanvasElement>) {
    if (readonly) return;
    const { x, y } = getCursorCoords(e);

    if (activeTool === 'select') {
      const hit = [...getPageAnnotations()].reverse().find((a) => hitTest(a, x, y));
      if (hit) {
        setSelectedAnnotationIds([hit.id]);
        setDragState({ dragging: true, annotationId: hit.id, offsetX: x - (hit.geometry.x || 0), offsetY: y - (hit.geometry.y || 0) });
      } else {
        clearSelection();
      }
      return;
    }

    if (activeTool === 'text') {
      beginTextEditing(undefined, x, y);
      return;
    }

    setDrawing({
      isActive: true,
      startX: x, startY: y,
      currentX: x, currentY: y,
      points: [x, y],
      annotationId: uuidv4(),
    });
  }

  function onMouseMove(e: React.MouseEvent<HTMLCanvasElement>) {
    if (readonly) return;
    const { x, y } = getCursorCoords(e);

    if (dragState?.dragging) {
      const updated = annotations.map((a) => {
        if (a.id !== dragState.annotationId) return a;
        return {
          ...a,
          geometry: {
            ...a.geometry,
            x: x - dragState.offsetX,
            y: y - dragState.offsetY,
            ...(a.type === 'line' || a.type === 'arrow'
              ? {
                  endX: (a.geometry.endX || 0) + (x - dragState.offsetX - (a.geometry.x || 0)),
                  endY: (a.geometry.endY || 0) + (y - dragState.offsetY - (a.geometry.y || 0)),
                }
              : {}),
          },
        };
      });
      onChange(updated);
      return;
    }

    if (!drawing?.isActive) return;
    setDrawing((d) =>
      d ? {
        ...d, currentX: x, currentY: y,
        points: activeTool === 'freehand' ? [...d.points, x, y] : d.points,
      } : null
    );
  }

  function onMouseUp(e: React.MouseEvent<HTMLCanvasElement>) {
    if (readonly) return;
    const { x, y } = getCursorCoords(e);

    if (dragState) {
      setDragState(null);
      return;
    }

    if (!drawing?.isActive) return;

    const { startX, startY, annotationId, points } = drawing;
    setDrawing(null);

    const minSize = 5;
    if (Math.abs(x - startX) < minSize && Math.abs(y - startY) < minSize && activeTool !== 'freehand') {
      return;
    }

    const style: AnnotationStyle = {
      stroke: strokeColor, strokeWidth, opacity, fontSize,
      fill: fillColor === 'transparent' ? undefined : fillColor,
    };

    let geometry: AnnotationGeometry;
    if (activeTool === 'line' || activeTool === 'arrow') {
      geometry = { x: startX, y: startY, endX: x, endY: y, width: Math.abs(x - startX), height: Math.abs(y - startY) };
    } else if (activeTool === 'freehand') {
      geometry = { x: Math.min(...points.filter((_, i) => i % 2 === 0)), y: Math.min(...points.filter((_, i) => i % 2 !== 0)), points, width: 1, height: 1 };
    } else {
      geometry = { x: Math.min(startX, x), y: Math.min(startY, y), width: Math.abs(x - startX), height: Math.abs(y - startY) };
    }

    const newAnnotation: Annotation = {
      id: annotationId,
      documentId,
      pageNumber,
      type: activeTool as AnnotationType,
      geometry,
      style,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    onChange([...annotations, newAnnotation]);
  }

  function onDoubleClick(e: React.MouseEvent<HTMLCanvasElement>) {
    if (readonly) return;

    const { x, y } = getCursorCoords(e);
    const hit = [...getPageAnnotations()].reverse().find((a) => hitTest(a, x, y));
    if (!hit || hit.type !== 'text') return;

    beginTextEditing(hit);
  }

  function commitText() {
    if (!editingText) {
      return;
    }

    const trimmedValue = textValue.trim();
    if (!trimmedValue) {
      if (editingText.isExisting) {
        onChange(annotations.filter((annotation) => annotation.id !== editingText.id));
      }
      setEditingText(null);
      setTextValue('');
      return;
    }

    const style: AnnotationStyle = { stroke: strokeColor, strokeWidth, opacity, fontSize };
    const nextTimestamp = new Date().toISOString();
    const lineCount = trimmedValue.split('\n').length;
    const nextGeometry = {
      x: editingText.x,
      y: editingText.y,
      width: editingText.width,
      height: Math.max(editingText.height, Math.ceil((style.fontSize || 18) * lineCount * 1.5)),
    };

    if (editingText.isExisting) {
      const updated = annotations.map((annotation) =>
        annotation.id === editingText.id
          ? {
              ...annotation,
              geometry: nextGeometry,
              style: {
                ...annotation.style,
                ...style,
              },
              content: trimmedValue,
              updatedAt: nextTimestamp,
            }
          : annotation
      );
      onChange(updated);
    } else {
      const newAnnotation: Annotation = {
        id: editingText.id,
        documentId,
        pageNumber,
        type: 'text',
        geometry: nextGeometry,
        style,
        content: trimmedValue,
        createdAt: nextTimestamp,
        updatedAt: nextTimestamp,
      };

      onChange([...annotations, newAnnotation]);
    }

    setEditingText(null);
    setTextValue('');
    setActiveTool('select');
  }

  const getCursor = () => {
    if (readonly) return 'default';
    if (activeTool === 'select') return 'default';
    if (activeTool === 'text') return 'text';
    return 'crosshair';
  };

  return (
    <div className="absolute inset-0 pointer-events-none" style={{ width, height }}>
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        style={{ width, height, cursor: getCursor() }}
        className="absolute inset-0 pointer-events-auto"
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onDoubleClick={onDoubleClick}
      />

      {/* Inline text editor */}
      {editingText && (
        <textarea
          ref={textInputRef}
          value={textValue}
          onChange={(e) => setTextValue(e.target.value)}
          onBlur={commitText}
          onKeyDown={(e) => {
            if (e.key === 'Escape') { setEditingText(null); return; }
            if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); commitText(); }
          }}
          style={{
            position: 'absolute',
            left: editingText.x * zoom,
            top: editingText.y * zoom,
            minWidth: 120,
            width: editingText.width * zoom,
            height: editingText.height * zoom,
            background: 'rgba(255,255,255,0.9)',
            border: '1.5px dashed #0ea5e9',
            borderRadius: 4,
            padding: '2px 6px',
            fontSize: fontSize * zoom,
            fontFamily: "'Virgil', 'Comic Sans MS', cursive",
            color: strokeColor,
            resize: 'both',
            outline: 'none',
            zIndex: 10,
            lineHeight: 1.4,
          }}
          placeholder="Type here..."
          className="pointer-events-auto"
        />
      )}
    </div>
  );
}
