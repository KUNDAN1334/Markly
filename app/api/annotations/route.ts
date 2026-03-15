import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { validateShareLinkAccess } from '@/lib/share-link-auth';
import { z } from 'zod';

const bulkSaveSchema = z.object({
  documentId: z.string(),
  annotations: z.array(
    z.object({
      id: z.string(),
      pageNumber: z.number(),
      type: z.string(),
      geometry: z.record(z.string(), z.unknown()),
      style: z.record(z.string(), z.unknown()),
      content: z.string().nullish(),
    })
  ),
});

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const documentId = searchParams.get('documentId');
    if (!documentId) return NextResponse.json({ error: 'documentId required' }, { status: 400 });

    const annotations = await prisma.annotation.findMany({
      where: { documentId },
      orderBy: { createdAt: 'asc' },
    });
    return NextResponse.json(annotations);
  } catch {
    return NextResponse.json({ error: 'Failed to fetch annotations' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { documentId, annotations } = bulkSaveSchema.parse(body);
    const shareToken = req.headers.get('x-share-token');

    if (shareToken) {
      const accessResult = await validateShareLinkAccess({
        token: shareToken,
        documentId,
        minimumAccess: 'EDIT',
      });

      if (!accessResult.ok) {
        return NextResponse.json({ error: accessResult.error }, { status: accessResult.status });
      }
    }

    await prisma.annotation.deleteMany({ where: { documentId } });

    if (annotations.length > 0) {
      await prisma.annotation.createMany({
        data: annotations.map((a) => ({
          id: a.id,
          documentId,
          pageNumber: a.pageNumber,
          type: a.type,
          geometry: a.geometry,
          style: a.style,
          content: a.content ?? null,
        })),
      });
    }

    const saved = await prisma.annotation.findMany({
      where: { documentId },
      orderBy: { createdAt: 'asc' },
    });

    await prisma.document.update({
      where: { id: documentId },
      data: { updatedAt: new Date() },
    });

    return NextResponse.json(saved);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    console.error('POST /api/annotations error:', error);
    return NextResponse.json({ error: 'Failed to save annotations' }, { status: 500 });
  }
}
