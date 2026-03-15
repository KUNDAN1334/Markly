import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { validateShareLinkAccess } from '@/lib/share-link-auth';

type RouteContext = {
  params: Promise<{ id: string }>;
};
export async function PATCH(req: NextRequest, { params }: RouteContext) {
  try {
    const { id } = await params;
    const body = await req.json();
    const shareToken = req.headers.get('x-share-token');

    if (shareToken) {
      const existingComment = await prisma.comment.findUnique({
        where: { id },
        select: { documentId: true },
      });

      if (!existingComment) {
        return NextResponse.json({ error: 'Comment not found' }, { status: 404 });
      }

      const accessResult = await validateShareLinkAccess({
        token: shareToken,
        documentId: existingComment.documentId,
        minimumAccess: 'COMMENT',
      });

      if (!accessResult.ok) {
        return NextResponse.json({ error: accessResult.error }, { status: accessResult.status });
      }
    }

    const comment = await prisma.comment.update({
      where: { id },
      data: body,
    });

    return NextResponse.json(comment);
  } catch (error) {
    console.error('PATCH comment error:', error);
    return NextResponse.json({ error: 'Failed to update comment' }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: RouteContext) {
  try {
    const { id } = await params;
    const shareToken = _req.headers.get('x-share-token');

    if (shareToken) {
      const existingComment = await prisma.comment.findUnique({
        where: { id },
        select: { documentId: true },
      });

      if (!existingComment) {
        return NextResponse.json({ error: 'Comment not found' }, { status: 404 });
      }

      const accessResult = await validateShareLinkAccess({
        token: shareToken,
        documentId: existingComment.documentId,
        minimumAccess: 'COMMENT',
      });

      if (!accessResult.ok) {
        return NextResponse.json({ error: accessResult.error }, { status: accessResult.status });
      }
    }

    await prisma.comment.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE comment error:', error);
    return NextResponse.json({ error: 'Failed to delete comment' }, { status: 500 });
  }
}
