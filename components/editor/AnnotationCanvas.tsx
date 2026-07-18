'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useEditorStore } from '@/lib/store';
import { Annotation, AnnotationGeometry, AnnotationStyle, AnnotationType } from '@/types';
import { getFontCssStack, getFontOption } from '@/lib/fonts';
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

interface AnnotationBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface TextMetrics {
  width: number;
  height: number;
  lines: string[];
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
  const textMeasureCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const {
    activeTool, strokeColor, fillColor, strokeWidth,
    fontSize, fontFamily, opacity, zoom,
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
    fontSize: number;
    fontFamily: string;
    stroke: string;
    isExisting: boolean;
  } | null>(null);
  const [textValue, setTextValue] = useState('');
  const [dragState, setDragState] = useState<{
    dragging: boolean; annotationId: string; offsetX: number; offsetY: number;
  } | null>(null);
  const [resizeState, setResizeState] = useState<{
    annotationId: string;
    startX: number;
    startY: number;
    initialGeometry: AnnotationGeometry;
    initialBounds: AnnotationBounds;
    initialStyle?: AnnotationStyle;
  } | null>(null);
  const textInputRef = useRef<HTMLTextAreaElement>(null);

  function measureWrappedText(content: string, boxWidth: number, fontSizePx: number, fontFamilyId?: string): TextMetrics {
    const lines = content.split('\n');
    const wrappedLines: string[] = [];
    const safeBoxWidth = Math.max(boxWidth, fontSizePx * 2);
    const measureCanvas =
      textMeasureCanvasRef.current ||
      (typeof document !== 'undefined' ? document.createElement('canvas') : null);

    if (measureCanvas && !textMeasureCanvasRef.current) {
      textMeasureCanvasRef.current = measureCanvas;
    }

    const measureContext = measureCanvas?.getContext('2d') || null;
    if (measureContext) {
      measureContext.font = `${fontSizePx}px ${getFontCssStack(fontFamilyId)}`;
    }

    const measureTextWidth = (value: string) =>
      measureContext ? measureContext.measureText(value).width : value.length * fontSizePx * 0.62;

    const splitLongToken = (token: string) => {
      let chunk = '';
      for (const char of token) {
        const nextChunk = chunk + char;
        if (chunk && measureTextWidth(nextChunk) > safeBoxWidth) {
          wrappedLines.push(chunk);
          chunk = char;
        } else {
          chunk = nextChunk;
        }
      }
      if (chunk) {
        wrappedLines.push(chunk);
      }
    };

    for (const line of lines) {
      if (!line) {
        wrappedLines.push('');
        continue;
      }

      let currentLine = '';
      const tokens = line.split(/(\s+)/).filter((token) => token.length > 0);

      for (const token of tokens) {
        const candidate = currentLine + token;
        if (!currentLine || measureTextWidth(candidate) <= safeBoxWidth) {
          currentLine = candidate;
          continue;
        }

        if (currentLine.trim()) {
          wrappedLines.push(currentLine.trimEnd());
          currentLine = token.trimStart();
        } else {
          currentLine = token;
        }

        if (measureTextWidth(currentLine) > safeBoxWidth) {
          splitLongToken(currentLine);
          currentLine = '';
        }
      }

      if (currentLine || line.trim() === '') {
        wrappedLines.push(currentLine.trimEnd());
      }
    }

    const safeLines = wrappedLines.length > 0 ? wrappedLines : [''];
    return {
      width: safeBoxWidth,
      height: Math.max(safeLines.length * fontSizePx * 1.3, fontSizePx * 1.3),
      lines: safeLines,
    };
  }

  const beginTextEditing = useCallback((annotation?: Annotation, x?: number, y?: number) => {
    if (annotation) {
      setEditingText({
        id: annotation.id,
        x: annotation.geometry.x || 0,
        y: annotation.geometry.y || 0,
        width: annotation.geometry.width || 200,
        height: annotation.geometry.height || 50,
        fontSize: annotation.style.fontSize || 18,
        fontFamily: getFontOption(annotation.style.fontFamily).id,
        stroke: annotation.style.stroke || '#000000',
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
        fontSize,
        fontFamily,
        stroke: strokeColor,
        isExisting: false,
      });
      setTextValue('');
      clearSelection();
    }

    window.setTimeout(() => {
      textInputRef.current?.focus();
      textInputRef.current?.select();
    }, 50);
  }, [clearSelection, setSelectedAnnotationIds, fontSize, fontFamily, strokeColor]);

  const getPageAnnotations = useCallback(
    () => annotations.filter((a) => a.pageNumber === pageNumber),
    [annotations, pageNumber]
  );

  const getAnnotationBounds = useCallback((annotation: Annotation): AnnotationBounds => {
    const geometry = annotation.geometry;

    if (annotation.type === 'line' || annotation.type === 'arrow') {
      const x1 = geometry.x || 0;
      const y1 = geometry.y || 0;
      const x2 = geometry.endX || x1;
      const y2 = geometry.endY || y1;
      return {
        x: Math.min(x1, x2),
        y: Math.min(y1, y2),
        width: Math.max(Math.abs(x2 - x1), 1),
        height: Math.max(Math.abs(y2 - y1), 1),
      };
    }

    if (annotation.type === 'freehand') {
      const xs = (geometry.points || []).filter((_, index) => index % 2 === 0);
      const ys = (geometry.points || []).filter((_, index) => index % 2 !== 0);
      if (xs.length === 0 || ys.length === 0) {
        return { x: geometry.x || 0, y: geometry.y || 0, width: 1, height: 1 };
      }

      const minX = Math.min(...xs);
      const maxX = Math.max(...xs);
      const minY = Math.min(...ys);
      const maxY = Math.max(...ys);
      return {
        x: minX,
        y: minY,
        width: Math.max(maxX - minX, 1),
        height: Math.max(maxY - minY, 1),
      };
    }

    if (annotation.type === 'text') {
      const fontSizePx = annotation.style.fontSize || 18;
      const boxWidth = Math.max(geometry.width || 200, fontSizePx * 2);
      const metrics = measureWrappedText(annotation.content || '', boxWidth, fontSizePx, annotation.style.fontFamily);
      return {
        x: geometry.x || 0,
        y: geometry.y || 0,
        width: boxWidth,
        height: Math.max(geometry.height || 0, metrics.height),
      };
    }

    return {
      x: geometry.x || 0,
      y: geometry.y || 0,
      width: Math.max(geometry.width || 1, 1),
      height: Math.max(geometry.height || 1, 1),
    };
  }, []);

  // Draw all annotations to canvas
  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    ctx.clearRect(0, 0, width, height);

    const pageAnnotations = getPageAnnotations();
    const orderedAnnotations = [
      ...pageAnnotations.filter((annotation) => annotation.type !== 'text'),
      ...pageAnnotations.filter((annotation) => annotation.type === 'text'),
    ];

    for (const ann of orderedAnnotations) {
      const style = ann.style;
      const geo = ann.geometry;
      const isSelected = selectedAnnotationIds.includes(ann.id);

      ctx.save();
      ctx.globalAlpha = style.opacity ?? 1;
      ctx.strokeStyle = style.stroke || '#000';
      ctx.lineWidth = (style.strokeWidth || 2) * zoom;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      const bounds = getAnnotationBounds(ann);
      const x = bounds.x * zoom;
      const y = bounds.y * zoom;
      const w = bounds.width * zoom;
      const h = bounds.height * zoom;

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
    getAnnotationBounds, getPageAnnotations, width, height, zoom, drawing,
    activeTool, strokeColor, strokeWidth, opacity, selectedAnnotationIds,
  ]);

  useEffect(() => { render(); }, [render]);

  // Canvas ctx.font never triggers a CSS @font-face download on its own, so
  // explicitly load Virgil, then re-render so text isn't stuck on the fallback.
  useEffect(() => {
    if (typeof document === 'undefined' || !document.fonts) return;
    let cancelled = false;
    Promise.all([document.fonts.load('16px Virgil'), document.fonts.ready])
      .catch(() => undefined)
      .then(() => { if (!cancelled) render(); });
    return () => { cancelled = true; };
  }, [render]);

  useEffect(() => {
    if (!editingText || !textInputRef.current || typeof ResizeObserver === 'undefined') return;

    const element = textInputRef.current;
    const observer = new ResizeObserver(() => {
      setEditingText((current) =>
        current
          ? {
              ...current,
              width: element.offsetWidth / zoom,
              height: element.offsetHeight / zoom,
            }
          : current
      );
    });

    observer.observe(element);
    return () => observer.disconnect();
  }, [editingText, zoom]);

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
          const textBoxWidth = Math.max((ann.geometry.width || 200) * zoom, fs * 2);
          const textMetrics = measureWrappedText(ann.content, textBoxWidth, fs, style.fontFamily);
          ctx.font = `${fs}px ${getFontCssStack(style.fontFamily)}`;
          ctx.fillStyle = style.stroke || '#000';
          ctx.globalAlpha = style.opacity ?? 1;
          textMetrics.lines.forEach((line, i) => {
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
    if (ann.type === 'text') {
      const bounds = getAnnotationBounds(ann);
      return (
        x >= bounds.x - pad && x <= bounds.x + bounds.width + pad &&
        y >= bounds.y - pad && y <= bounds.y + bounds.height + pad
      );
    }
    return (
      x >= (g.x || 0) - pad && x <= (g.x || 0) + (g.width || 0) + pad &&
      y >= (g.y || 0) - pad && y <= (g.y || 0) + (g.height || 0) + pad
    );
  }

  function hitResizeHandle(ann: Annotation, x: number, y: number): boolean {
    const bounds = getAnnotationBounds(ann);
    const handleHalfSize = 8 / zoom;
    const handleX = bounds.x + bounds.width + 4 / zoom;
    const handleY = bounds.y + bounds.height + 4 / zoom;

    return (
      x >= handleX - handleHalfSize &&
      x <= handleX + handleHalfSize &&
      y >= handleY - handleHalfSize &&
      y <= handleY + handleHalfSize
    );
  }

  function resizeAnnotation(
    annotation: Annotation,
    initialGeometry: AnnotationGeometry,
    initialBounds: AnnotationBounds,
    initialStyle: AnnotationStyle | undefined,
    deltaX: number,
    deltaY: number
  ): Annotation {
    const minSize = 12;
    const nextWidth = Math.max(minSize, initialBounds.width + deltaX);
    const nextHeight = Math.max(minSize, initialBounds.height + deltaY);
    const scaleX = initialBounds.width > 0 ? nextWidth / initialBounds.width : 1;
    const scaleY = initialBounds.height > 0 ? nextHeight / initialBounds.height : 1;

    if (annotation.type === 'line' || annotation.type === 'arrow') {
      const startX = initialGeometry.x || 0;
      const startY = initialGeometry.y || 0;
      const endX = initialGeometry.endX || startX;
      const endY = initialGeometry.endY || startY;
      return {
        ...annotation,
        geometry: {
          ...initialGeometry,
          x: initialBounds.x + (startX - initialBounds.x) * scaleX,
          y: initialBounds.y + (startY - initialBounds.y) * scaleY,
          endX: initialBounds.x + (endX - initialBounds.x) * scaleX,
          endY: initialBounds.y + (endY - initialBounds.y) * scaleY,
          width: nextWidth,
          height: nextHeight,
        },
      };
    }

    if (annotation.type === 'freehand') {
      const points = initialGeometry.points || [];
      const scaledPoints = points.map((point, index) =>
        index % 2 === 0
          ? initialBounds.x + (point - initialBounds.x) * scaleX
          : initialBounds.y + (point - initialBounds.y) * scaleY
      );

      const xs = scaledPoints.filter((_, index) => index % 2 === 0);
      const ys = scaledPoints.filter((_, index) => index % 2 !== 0);

      return {
        ...annotation,
        geometry: {
          ...initialGeometry,
          points: scaledPoints,
          x: Math.min(...xs),
          y: Math.min(...ys),
          width: Math.max(Math.max(...xs) - Math.min(...xs), 1),
          height: Math.max(Math.max(...ys) - Math.min(...ys), 1),
        },
      };
    }

    if (annotation.type === 'text') {
      const baseFontSize = initialStyle?.fontSize || annotation.style.fontSize || 18;
      const widthRatio = initialBounds.width > 0 ? (initialBounds.width + deltaX) / initialBounds.width : 1;
      const heightRatio = initialBounds.height > 0 ? (initialBounds.height + deltaY) / initialBounds.height : 1;
      const scale = Math.max(0.5, Math.min(4, Math.max(widthRatio, heightRatio)));
      const nextFontSize = Math.max(10, Math.round(baseFontSize * scale));
      const nextWidth = Math.max(nextFontSize * 2, (initialGeometry.width || initialBounds.width) * scale);
      const metrics = measureWrappedText(annotation.content || '', nextWidth, nextFontSize, annotation.style.fontFamily);
      return {
        ...annotation,
        geometry: {
          ...initialGeometry,
          width: nextWidth,
          height: Math.max(metrics.height, nextFontSize * 1.3),
        },
        style: {
          ...annotation.style,
          fontSize: nextFontSize,
        },
      };
    }

    return {
      ...annotation,
      geometry: {
        ...initialGeometry,
        width: nextWidth,
        height: nextHeight,
      },
    };
  }

  function onMouseDown(e: React.MouseEvent<HTMLCanvasElement>) {
    if (readonly) return;

    if (editingText) {
      commitText();
      return;
    }

    const { x, y } = getCursorCoords(e);

    if (activeTool === 'select') {
      const pageAnnotations = getPageAnnotations();
      const selectedHit = [...pageAnnotations]
        .reverse()
        .find((annotation) => selectedAnnotationIds.includes(annotation.id) && hitTest(annotation, x, y));
      const textHit = [...pageAnnotations]
        .reverse()
        .find((annotation) => annotation.type === 'text' && hitTest(annotation, x, y));
      const hit = selectedHit || textHit || [...pageAnnotations].reverse().find((a) => hitTest(a, x, y));
      if (hit) {
        setSelectedAnnotationIds([hit.id]);
        if (hitResizeHandle(hit, x, y)) {
          setResizeState({
            annotationId: hit.id,
            startX: x,
            startY: y,
            initialGeometry: { ...hit.geometry, points: hit.geometry.points ? [...hit.geometry.points] : undefined },
            initialBounds: getAnnotationBounds(hit),
            initialStyle: { ...hit.style },
          });
          return;
        }
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

    if (resizeState) {
      const deltaX = x - resizeState.startX;
      const deltaY = y - resizeState.startY;
      const updated = annotations.map((annotation) =>
        annotation.id === resizeState.annotationId
          ? resizeAnnotation(annotation, resizeState.initialGeometry, resizeState.initialBounds, resizeState.initialStyle, deltaX, deltaY)
          : annotation
      );
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

    if (resizeState) {
      setResizeState(null);
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
    const pageAnnotations = getPageAnnotations();
    const hit = [...pageAnnotations]
      .reverse()
      .find((annotation) => annotation.type === 'text' && hitTest(annotation, x, y));
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

    const currentAnnotation = editingText.isExisting
      ? annotations.find((annotation) => annotation.id === editingText.id)
      : undefined;
    const style: AnnotationStyle = {
      stroke: currentAnnotation?.style.stroke || strokeColor,
      strokeWidth: currentAnnotation?.style.strokeWidth || strokeWidth,
      opacity: currentAnnotation?.style.opacity ?? opacity,
      fontSize: currentAnnotation?.style.fontSize || fontSize,
      fontFamily: currentAnnotation?.style.fontFamily || editingText.fontFamily || fontFamily,
    };
    const nextTimestamp = new Date().toISOString();
    const lineCount = trimmedValue.split('\n').length;
    const nextWidth = textInputRef.current
      ? textInputRef.current.offsetWidth / zoom
      : editingText.width;
    const nextHeight = textInputRef.current
      ? textInputRef.current.offsetHeight / zoom
      : editingText.height;
    const nextGeometry = {
      x: editingText.x,
      y: editingText.y,
      width: nextWidth,
      height: Math.max(nextHeight, Math.ceil((style.fontSize || 18) * lineCount * 1.5)),
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
            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
              e.preventDefault();
              commitText();
            }
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
            fontSize: editingText.fontSize * zoom,
            fontFamily: getFontCssStack(editingText.fontFamily),
            color: editingText.stroke,
            resize: 'both',
            outline: 'none',
            zIndex: 10,
            lineHeight: 1.4,
          }}
          placeholder="Type here... (Ctrl/Cmd+Enter to save)"
          className="pointer-events-auto"
        />
      )}
    </div>
  );
}
