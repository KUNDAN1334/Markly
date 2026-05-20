import { NextRequest, NextResponse } from 'next/server';
import { authorizeDocumentAccess } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { PDFDocument, rgb } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import path from 'path';
import fs from 'fs/promises';

const STORAGE_BASE = process.env.STORAGE_PATH || './storage/documents';
const EXCALIFONT_PATH = path.join(
  process.cwd(),
  'public',
  'fonts',
  'Excalifont',
  'Excalifont-Regular-a88b72a24fb54c9f94e3b5fdaa7481c9.woff2'
);

function hexToRgb(hex: string) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? { r: parseInt(result[1], 16) / 255, g: parseInt(result[2], 16) / 255, b: parseInt(result[3], 16) / 255 }
    : { r: 0, g: 0, b: 0 };
}

function scalePoint(value: number | undefined, scale: number) {
  return (value || 0) * scale;
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

    const filePath = path.join(STORAGE_BASE, path.basename(doc.filename));
    const pdfBytes = await fs.readFile(filePath);
    const pdfDoc = await PDFDocument.load(pdfBytes);
    pdfDoc.registerFontkit(fontkit);
    const pages = pdfDoc.getPages();
    const excalifontBytes = await fs.readFile(EXCALIFONT_PATH);
    const excalifont = await pdfDoc.embedFont(excalifontBytes, { subset: true });

    for (const annotation of doc.annotations) {
      const pageIndex = annotation.pageNumber - 1;
      if (pageIndex < 0 || pageIndex >= pages.length) continue;
      const page = pages[pageIndex];
      const { width: pageWidth, height: pageHeight } = page.getSize();
      const cropBox = page.getCropBox();
      const scaleX = pageWidth / cropBox.width;
      const scaleY = pageHeight / cropBox.height;
      const geo = annotation.geometry as Record<string, number>;
      const style = annotation.style as Record<string, unknown>;

      const strokeHex = (style.stroke as string) || '#000000';
      const { r, g, b } = hexToRgb(strokeHex);
      const strokeWidth = ((style.strokeWidth as number) || 2) * Math.min(scaleX, scaleY);
      const opacity = (style.opacity as number) || 1;
      const color = rgb(r, g, b);

      const x = scalePoint(geo.x, scaleX);
      const topY = scalePoint(geo.y, scaleY);
      const w = (geo.width || 100) * scaleX;
      const h = (geo.height || 50) * scaleY;
      const y = pageHeight - topY - h;

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
          page.drawLine({
            start: { x, y: pageHeight - topY },
            end: { x: scalePoint(geo.endX, scaleX), y: pageHeight - scalePoint(geo.endY, scaleY) },
            color,
            thickness: strokeWidth,
            opacity,
          });
          break;
        case 'text':
          if (annotation.content) {
            const fontSize = ((style.fontSize as number) || 16) * Math.min(scaleX, scaleY);
            page.drawText(annotation.content, {
              x,
              y: pageHeight - topY - fontSize,
              size: fontSize,
              font: excalifont,
              color,
              opacity,
            });
          }
          break;
        case 'freehand': {
          const pts = (geo as unknown as { points: number[] }).points || [];
          for (let i = 0; i < pts.length - 3; i += 2) {
            page.drawLine({
              start: { x: pts[i] * scaleX, y: pageHeight - pts[i + 1] * scaleY },
              end: { x: pts[i + 2] * scaleX, y: pageHeight - pts[i + 3] * scaleY },
              color,
              thickness: strokeWidth,
              opacity,
            });
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
      },
    });
  } catch (error) {
    console.error('Export error:', error);
    return NextResponse.json({ error: 'Export failed' }, { status: 500 });
  }
}
