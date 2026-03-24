import { NextRequest, NextResponse } from 'next/server';
import { authorizeDocumentAccess } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import path from 'path';
import fs from 'fs/promises';

const STORAGE_BASE = process.env.STORAGE_PATH || './storage/documents';

function hexToRgb(hex: string) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? { r: parseInt(result[1], 16) / 255, g: parseInt(result[2], 16) / 255, b: parseInt(result[3], 16) / 255 }
    : { r: 0, g: 0, b: 0 };
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
    const pages = pdfDoc.getPages();
    const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);

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
            page.drawText(annotation.content, { x, y: height - (geo.y || 0) - fontSize, size: fontSize, font: helvetica, color, opacity });
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
      },
    });
  } catch (error) {
    console.error('Export error:', error);
    return NextResponse.json({ error: 'Export failed' }, { status: 500 });
  }
}
