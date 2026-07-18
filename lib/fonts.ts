// Shared font registry — used by the editor canvas (client), toolbar (client),
// and the PDF export route (server). Keep this file dependency-free so it can
// be imported from both bundles.

export interface FontOption {
  /** Stable id stored in annotation.style.fontFamily */
  id: string;
  /** Human-readable name shown in the font picker */
  label: string;
  /** CSS font-family stack used for canvas rendering and the inline editor */
  cssStack: string;
  /**
   * How the PDF export renders this font:
   * - { standard } → one of pdf-lib's built-in StandardFonts (no embedding needed)
   * - { file }     → font file under public/fonts, embedded into the PDF
   */
  pdf:
    | { standard: 'Helvetica' | 'TimesRoman' | 'Courier' }
    | { file: string };
}

export const DEFAULT_FONT_ID = 'virgil';

export const FONT_OPTIONS: FontOption[] = [
  {
    id: 'virgil',
    label: 'Virgil (hand-drawn)',
    cssStack: "'Virgil', 'Comic Sans MS', cursive",
    pdf: { file: 'Virgil.otf' },
  },
  {
    id: 'helvetica',
    label: 'Helvetica',
    cssStack: "Helvetica, Arial, sans-serif",
    pdf: { standard: 'Helvetica' },
  },
  {
    id: 'times',
    label: 'Times',
    cssStack: "'Times New Roman', Times, serif",
    pdf: { standard: 'TimesRoman' },
  },
  {
    id: 'courier',
    label: 'Courier',
    cssStack: "'Courier New', Courier, monospace",
    pdf: { standard: 'Courier' },
  },
];

/** Resolve a stored fontFamily id (or a missing/unknown one) to a font option. */
export function getFontOption(id?: string | null): FontOption {
  return FONT_OPTIONS.find((f) => f.id === id) || FONT_OPTIONS[0];
}

/** CSS stack for a stored fontFamily id; legacy annotations without one get Virgil. */
export function getFontCssStack(id?: string | null): string {
  return getFontOption(id).cssStack;
}
