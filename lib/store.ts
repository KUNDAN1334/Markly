import { create } from 'zustand';
import { EditorState, Tool, Annotation } from '@/types';

interface EditorStore extends EditorState {
  // Tool actions
  setActiveTool: (tool: Tool) => void;
  setSelectedAnnotationIds: (ids: string[]) => void;
  toggleSelectedAnnotation: (id: string) => void;
  clearSelection: () => void;

  // Style actions
  setStrokeColor: (color: string) => void;
  setFillColor: (color: string) => void;
  setStrokeWidth: (width: number) => void;
  setFontSize: (size: number) => void;
  setOpacity: (opacity: number) => void;

  // Viewport actions
  setZoom: (zoom: number) => void;
  zoomIn: () => void;
  zoomOut: () => void;
  setCurrentPage: (page: number) => void;
  setTotalPages: (total: number) => void;

  // Drawing state
  setIsDrawing: (drawing: boolean) => void;
  setIsDirty: (dirty: boolean) => void;

  // Annotation history (undo/redo)
  history: Annotation[][];
  historyIndex: number;
  resetHistory: (annotations: Annotation[]) => void;
  pushHistory: (annotations: Annotation[]) => void;
  undo: () => Annotation[] | null;
  redo: () => Annotation[] | null;
}

export const useEditorStore = create<EditorStore>((set, get) => ({
  // Initial state
  activeTool: 'select',
  selectedAnnotationIds: [],
  strokeColor: '#000000',
  fillColor: 'transparent',
  strokeWidth: 2,
  fontSize: 18,
  opacity: 1,
  zoom: 1,
  currentPage: 1,
  totalPages: 1,
  isDrawing: false,
  isDirty: false,
  history: [],
  historyIndex: -1,

  // Tool actions
  setActiveTool: (tool) => set({ activeTool: tool, selectedAnnotationIds: [] }),
  setSelectedAnnotationIds: (ids) => set({ selectedAnnotationIds: ids }),
  toggleSelectedAnnotation: (id) =>
    set((state) => ({
      selectedAnnotationIds: state.selectedAnnotationIds.includes(id)
        ? state.selectedAnnotationIds.filter((i) => i !== id)
        : [...state.selectedAnnotationIds, id],
    })),
  clearSelection: () => set({ selectedAnnotationIds: [] }),

  // Style actions
  setStrokeColor: (color) => set({ strokeColor: color }),
  setFillColor: (color) => set({ fillColor: color }),
  setStrokeWidth: (width) => set({ strokeWidth: width }),
  setFontSize: (size) => set({ fontSize: size }),
  setOpacity: (opacity) => set({ opacity }),

  // Viewport actions
  setZoom: (zoom) => set({ zoom: Math.min(Math.max(zoom, 0.25), 4) }),
  zoomIn: () => set((s) => ({ zoom: Math.min(s.zoom + 0.1, 4) })),
  zoomOut: () => set((s) => ({ zoom: Math.max(s.zoom - 0.1, 0.25) })),
  setCurrentPage: (page) => set({ currentPage: page }),
  setTotalPages: (total) => set({ totalPages: total }),

  // Drawing
  setIsDrawing: (drawing) => set({ isDrawing: drawing }),
  setIsDirty: (dirty) => set({ isDirty: dirty }),

  // History
  resetHistory: (annotations) => set({ history: [[...annotations]], historyIndex: 0 }),
  pushHistory: (annotations) => {
    const { history, historyIndex } = get();
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push([...annotations]);
    set({ history: newHistory.slice(-50), historyIndex: newHistory.length - 1 });
  },
  undo: () => {
    const { history, historyIndex } = get();
    if (historyIndex <= 0) return null;
    const newIndex = historyIndex - 1;
    set({ historyIndex: newIndex });
    return history[newIndex];
  },
  redo: () => {
    const { history, historyIndex } = get();
    if (historyIndex >= history.length - 1) return null;
    const newIndex = historyIndex + 1;
    set({ historyIndex: newIndex });
    return history[newIndex];
  },
}));
