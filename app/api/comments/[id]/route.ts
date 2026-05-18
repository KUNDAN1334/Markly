import { NextRequest, NextResponse } from 'next/server';
import { authorizeDocumentAccess } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

type RouteContext = {
  params: Promise<{ id: string }>;
};

const updateCommentSchema = z.object({
  resolved: z.boolean(),
});

export async function PATCH(req: NextRequest, { params }: RouteContext) {
  try {
    const { id } = await params;
    const body = updateCommentSchema.parse(await req.json());
    const existingComment = await prisma.comment.findUnique({
      where: { id },
      select: { documentId: true },
    });

    if (!existingComment) {
      return NextResponse.json({ error: 'Comment not found' }, { status: 404 });
    }

    const access = await authorizeDocumentAccess(req, existingComment.documentId, 'COMMENT');
    if (!access.ok) return access.response;

    const comment = await prisma.comment.update({
      where: { id },
      data: { resolved: body.resolved },
    });

    return NextResponse.json(comment);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
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
