import { NextRequest, NextResponse } from 'next/server';
import { authorizeDocumentAccess } from '@/lib/auth';
import { planErrorResponse, requireWorkspaceFeatureForDocument } from '@/lib/billing/feature-gating';
import { prisma } from '@/lib/prisma';

type RouteContext = {
  params: Promise<{ id: string }>;
};
export async function PATCH(req: NextRequest, { params }: RouteContext) {
  try {
    const { id } = await params;
    const body = await req.json();
    const existingComment = await prisma.comment.findUnique({
      where: { id },
      select: { documentId: true },
    });

    if (!existingComment) {
      return NextResponse.json({ error: 'Comment not found' }, { status: 404 });
    }

    const access = await authorizeDocumentAccess(req, existingComment.documentId, 'COMMENT');
    if (!access.ok) return access.response;
    if (typeof body.resolved === 'boolean') {
      await requireWorkspaceFeatureForDocument(existingComment.documentId, 'hasCommentStatus');
    }

    const comment = await prisma.comment.update({
      where: { id },
      data: body,
    });

    return NextResponse.json(comment);
  } catch (error) {
    const gated = planErrorResponse(error);
    if (gated) return gated;
    console.error('PATCH comment error:', error);
    return NextResponse.json({ error: 'Failed to update comment' }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: RouteContext) {
  try {
    const { id } = await params;
    const existingComment = await prisma.comment.findUnique({
      where: { id },
      select: { documentId: true },
    });

    if (!existingComment) {
      return NextResponse.json({ error: 'Comment not found' }, { status: 404 });
    }

    const access = await authorizeDocumentAccess(_req, existingComment.documentId, 'COMMENT');
    if (!access.ok) return access.response;

    await prisma.comment.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE comment error:', error);
    return NextResponse.json({ error: 'Failed to delete comment' }, { status: 500 });
  }
}
