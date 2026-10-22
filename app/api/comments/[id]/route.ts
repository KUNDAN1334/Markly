import { NextRequest, NextResponse } from 'next/server';
import { authorizeDocumentAccess } from '@/lib/auth';
import { allowedStatusChanges, COMMENT_STATUSES, withStatusEvents } from '@/lib/comment-status';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

type RouteContext = {
  params: Promise<{ id: string }>;
};

const updateCommentSchema = z.object({
  status: z.enum(COMMENT_STATUSES),
  note: z.string().trim().max(500).optional(),
});

const STATUS_LABEL = { OPEN: 'open', FIXED: 'fixed', VERIFIED: 'verified' } as const;

export async function PATCH(req: NextRequest, { params }: RouteContext) {
  try {
    const { id } = await params;
    const body = updateCommentSchema.parse(await req.json());
    const existingComment = await prisma.comment.findUnique({
      where: { id },
      select: { documentId: true, status: true, authorUserId: true },
    });

    if (!existingComment) {
      return NextResponse.json({ error: 'Comment not found' }, { status: 404 });
    }

    const access = await authorizeDocumentAccess(req, existingComment.documentId, 'COMMENT');
    if (!access.ok) return access.response;

    const from = existingComment.status;
    const allowed = allowedStatusChanges(from, {
      actor: access.actor,
      isOwnComment: access.actor === 'owner' && existingComment.authorUserId === access.userId,
    });

    if (!allowed.includes(body.status)) {
      if (access.actor === 'share' && body.status === 'FIXED') {
        return NextResponse.json({ error: 'Only the document owner can mark a comment fixed' }, { status: 403 });
      }
      if (access.actor === 'owner' && body.status === 'VERIFIED') {
        return NextResponse.json({ error: 'Only the reviewer can verify a fix' }, { status: 403 });
      }
      return NextResponse.json(
        { error: `Can't move a comment from ${STATUS_LABEL[from]} to ${STATUS_LABEL[body.status]}` },
        { status: 409 }
      );
    }

    let actorName = 'Shared reviewer';
    if (access.actor === 'owner' && access.userId) {
      const user = await prisma.user.findUnique({
        where: { id: access.userId },
        select: { name: true, email: true },
      });
      actorName = user?.name || user?.email || 'Owner';
    }

    const comment = await prisma.$transaction(async (tx) => {
      // Guard on the status we checked, so two people acting at once can't both win.
      const { count } = await tx.comment.updateMany({
        where: { id, status: from },
        data: { status: body.status, resolved: body.status === 'VERIFIED' },
      });
      if (count === 0) return null;

      await tx.commentStatusEvent.create({
        data: {
          commentId: id,
          fromStatus: from,
          toStatus: body.status,
          note: body.note || null,
          actorUserId: access.actor === 'owner' ? access.userId ?? null : null,
          actorName,
        },
      });

      return tx.comment.findUnique({ where: { id }, include: withStatusEvents });
    });

    if (!comment) {
      return NextResponse.json(
        { error: 'Someone else just updated this comment. Refresh and try again.' },
        { status: 409 }
      );
    }

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
