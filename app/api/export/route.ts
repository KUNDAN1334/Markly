import { NextRequest, NextResponse } from 'next/server';
import { authorizeDocumentAccess } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { PDFDocument, PDFFont, rgb, StandardFonts } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import { getFontOption } from '@/lib/fonts';
import { readStoredFile } from '@/lib/storage';
import path from 'path';
import fs from 'fs/promises';

const FONTS_DIR = path.join(process.cwd(), 'public', 'fonts');

function hexToRgb(hex: string) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? { r: parseInt(result[1], 16) / 255, g: parseInt(result[2], 16) / 255, b: parseInt(result[3], 16) / 255 }
    : { r: 0, g: 0, b: 0 };
}

/** Drop characters the font has no glyphs/encoding for, so drawText never throws. */
function sanitizeForFont(text: string, font: PDFFont): string {
  try {
    font.widthOfTextAtSize(text, 10);
    return text;
  } catch {
    return Array.from(text)
      .filter((ch) => {
        try {
          font.widthOfTextAtSize(ch, 10);
          return true;
        } catch {
          return false;
        }
      })
      .join('');
  }
}

/**
 * Word-wrap text into lines that fit boxWidth — mirrors the editor canvas's
 * measureWrappedText so the exported PDF matches what the user saw on screen.
 */
function wrapTextToWidth(content: string, boxWidth: number, fontSize: number, font: PDFFont): string[] {
  const safeBoxWidth = Math.max(boxWidth, fontSize * 2);
  const measure = (value: string) => font.widthOfTextAtSize(value, fontSize);
  const wrappedLines: string[] = [];

  const splitLongToken = (token: string) => {
    let chunk = '';
    for (const char of token) {
      const nextChunk = chunk + char;
      if (chunk && measure(nextChunk) > safeBoxWidth) {
        wrappedLines.push(chunk);
        chunk = char;
      } else {
        chunk = nextChunk;
      }
    }
    if (chunk) wrappedLines.push(chunk);
  };

  for (const line of content.split('\n')) {
    if (!line) {
      wrappedLines.push('');
      continue;
    }

    let currentLine = '';
    const tokens = line.split(/(\s+)/).filter((token) => token.length > 0);

    for (const token of tokens) {
      const candidate = currentLine + token;
      if (!currentLine || measure(candidate) <= safeBoxWidth) {
        currentLine = candidate;
        continue;
      }

      if (currentLine.trim()) {
        wrappedLines.push(currentLine.trimEnd());
        currentLine = token.trimStart();
      } else {
        currentLine = token;
      }

      if (measure(currentLine) > safeBoxWidth) {
        splitLongToken(currentLine);
        currentLine = '';
      }
    }

    if (currentLine || line.trim() === '') {
      wrappedLines.push(currentLine.trimEnd());
    }
  }

  return wrappedLines.length > 0 ? wrappedLines : [''];
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const documentId = searchParams.get('documentId');
  const token = searchParams.get('token');
  if (!documentId) return NextResponse.json({ error: 'documentId required' }, { status: 400 });

  try {
    const headers = new Headers(req.headers);
    if (token) {
      headers.set('x-share-token', token);
    }

    const access = await authorizeDocumentAccess(
      new Request(req.url, { headers }),
      documentId,
      'VIEW'
    );
    if (!access.ok) return access.response;

    const doc = await prisma.document.findUnique({
      where: { id: documentId },
      include: { annotations: true },
    });
    if (!doc) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const pdfBytes = await readStoredFile(doc.filename);
    const pdfDoc = await PDFDocument.load(pdfBytes);
    pdfDoc.registerFontkit(fontkit);
    const pages = pdfDoc.getPages();

    // Fonts are embedded lazily, once per family, keyed by font option id.
    const STANDARD_FONTS = {
      Helvetica: StandardFonts.Helvetica,
      TimesRoman: StandardFonts.TimesRoman,
      Courier: StandardFonts.Courier,
    } as const;
    const fontCache = new Map<string, PDFFont>();
    const getPdfFont = async (fontFamilyId?: string | null): Promise<PDFFont> => {
      const option = getFontOption(fontFamilyId);
      const cached = fontCache.get(option.id);
      if (cached) return cached;

      let font: PDFFont;
      if ('standard' in option.pdf) {
        font = await pdfDoc.embedFont(STANDARD_FONTS[option.pdf.standard]);
      } else {
        try {
          const fontBytes = await fs.readFile(path.join(FONTS_DIR, path.basename(option.pdf.file)));
          // Embed the full font, not a subset: fontkit's CFF subsetter emits a
          // bare font program that strict viewers (Acrobat, Edge) can reject,
          // silently substituting a default font.
          font = await pdfDoc.embedFont(fontBytes, { subset: false });
        } catch (fontError) {
          console.error(`Failed to embed font "${option.id}", falling back to Helvetica:`, fontError);
          font = await pdfDoc.embedFont(StandardFonts.Helvetica);
        }
      }
      fontCache.set(option.id, font);
      return font;
    };

    for (const annotation of doc.annotations) {
      const pageIndex = annotation.pageNumber - 1;
      if (pageIndex < 0 || pageIndex >= pages.length) continue;
      const page = pages[pageIndex];
      const { height } = page.getSize();
      const geo = annotation.geometry as Record<string, number>;
      const style = annotation.style as Record<string, unknown>;

      const strokeHex = (style.stroke as string) || '#000000';
      const { r, g, b } = hexToRgb(strokeHex);
      const strokeWidth = (style.strokeWidth as number) || 2;
      const opacity = (style.opacity as number) || 1;
      const color = rgb(r, g, b);

      const x = geo.x || 0;
      const y = height - (geo.y || 0) - (geo.height || 0);
      const w = geo.width || 100;
      const h = geo.height || 50;

      switch (annotation.type) {
        case 'rectangle':
          page.drawRectangle({ x, y, width: w, height: h, borderColor: color, borderWidth: strokeWidth, opacity });
          break;
        case 'circle':
          page.drawEllipse({ x: x + w/2, y: y + h/2, xScale: w/2, yScale: h/2, borderColor: color, borderWidth: strokeWidth, opacity });
          break;
        case 'highlight':
          page.drawRectangle({ x, y, width: w, height: h, color: rgb(1,1,0), opacity: 0.3 });
          break;
        case 'line':
        case 'arrow':
          page.drawLine({ start: { x: geo.x, y: height - geo.y }, end: { x: geo.endX || 0, y: height - (geo.endY || 0) }, color, thickness: strokeWidth, opacity });
          break;
        case 'text':
          if (annotation.content) {
            const fontSize = (style.fontSize as number) || 16;
            const font = await getPdfFont(style.fontFamily as string | undefined);
            const content = sanitizeForFont(annotation.content, font);
            // Same box width and 1.3 line height the editor canvas renders with.
            const boxWidth = Math.max(geo.width || 200, fontSize * 2);
            const lines = wrapTextToWidth(content, boxWidth, fontSize, font);
            lines.forEach((line, i) => {
              if (!line) return;
              page.drawText(line, {
                x,
                y: height - (geo.y || 0) - fontSize - i * fontSize * 1.3,
                size: fontSize,
                font,
                color,
                opacity,
              });
            });
          }
          break;
        case 'freehand': {
          const pts = (geo as unknown as { points: number[] }).points || [];
          for (let i = 0; i < pts.length - 3; i += 2) {
            page.drawLine({ start: { x: pts[i], y: height - pts[i+1] }, end: { x: pts[i+2], y: height - pts[i+3] }, color, thickness: strokeWidth, opacity });
          }
          break;
        }
      }
    }

    const exportedBytes = await pdfDoc.save();
    const exportName = `${path.parse(doc.originalName).name}_reviewed.pdf`;

    return new NextResponse(exportedBytes as unknown as BodyInit, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${exportName}"`,
        'Content-Length': exportedBytes.length.toString(),
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    console.error('Export error:', error);
    return NextResponse.json({ error: 'Export failed' }, { status: 500 });
  }
}
