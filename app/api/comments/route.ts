import { NextRequest, NextResponse } from 'next/server';
import { authorizeDocumentAccess, requireAuthenticatedUser, unauthorizedResponse } from '@/lib/auth';
import { planErrorResponse, requireWorkspaceFeatureForDocument } from '@/lib/billing/feature-gating';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const commentSchema = z.object({
  content: z.string().min(1).max(2000),
  documentId: z.string(),
  annotationId: z.string().optional(),
  pageNumber: z.number().int().min(1),
  isInternal: z.boolean().optional().default(false),
});

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const documentId = searchParams.get('documentId');
  if (!documentId) return NextResponse.json({ error: 'documentId required' }, { status: 400 });

  const access = await authorizeDocumentAccess(req, documentId, 'VIEW');
  if (!access.ok) return access.response;

  const comments = await prisma.comment.findMany({
    where: {
      documentId,
      // External (share link) users never see internal team comments.
      ...(access.actor === 'share' ? { isInternal: false } : {}),
    },
    orderBy: { createdAt: 'desc' },
  });
  return NextResponse.json(comments);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const data = commentSchema.parse(body);
    const access = await authorizeDocumentAccess(req, data.documentId, 'COMMENT');
    if (!access.ok) return access.response;
    await requireWorkspaceFeatureForDocument(data.documentId, 'canComment');

    let authorUserId: string | null = null;
    let authorName: string | null = null;

    if (access.actor === 'member') {
      const user = await requireAuthenticatedUser(req);
      if (!user) return unauthorizedResponse();
      authorUserId = user.id;
      authorName = user.name || user.email || 'Member';
    } else {
      authorName = 'Shared reviewer';
    }

    const comment = await prisma.comment.create({
      data: {
        ...data,
        // Only workspace members can post internal (team-only) comments.
        isInternal: access.actor === 'member' ? data.isInternal : false,
        authorUserId,
        authorName,
      },
    });
    return NextResponse.json(comment, { status: 201 });
  } catch (error) {
    const gated = planErrorResponse(error);
    if (gated) return gated;
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to create comment' }, { status: 500 });
  }
}
