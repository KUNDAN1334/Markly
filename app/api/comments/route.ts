import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { validateShareLinkAccess } from '@/lib/share-link-auth';
import { z } from 'zod';

const commentSchema = z.object({
  content: z.string().min(1).max(2000),
  documentId: z.string(),
  annotationId: z.string().optional(),
  pageNumber: z.number().int().min(1),
});

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const documentId = searchParams.get('documentId');
  if (!documentId) return NextResponse.json({ error: 'documentId required' }, { status: 400 });

  const comments = await prisma.comment.findMany({
    where: { documentId },
    orderBy: { createdAt: 'desc' },
  });
  return NextResponse.json(comments);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const data = commentSchema.parse(body);
    const shareToken = req.headers.get('x-share-token');

    if (shareToken) {
      const accessResult = await validateShareLinkAccess({
        token: shareToken,
        documentId: data.documentId,
        minimumAccess: 'COMMENT',
      });

      if (!accessResult.ok) {
        return NextResponse.json({ error: accessResult.error }, { status: accessResult.status });
      }
    }

    const comment = await prisma.comment.create({ data });
    return NextResponse.json(comment, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to create comment' }, { status: 500 });
  }
}
