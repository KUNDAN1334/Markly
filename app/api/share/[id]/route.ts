import { NextResponse } from 'next/server';
import {
  forbiddenResponse,
  requireAuthenticatedUser,
  unauthorizedResponse,
} from '@/lib/auth';
import { prisma } from '@/lib/prisma';

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function DELETE(req: Request, { params }: RouteContext) {
  try {
    const { id } = await params;
    const user = await requireAuthenticatedUser(req);
    if (!user) return unauthorizedResponse();

    const shareLink = await prisma.shareLink.findUnique({
      where: { id },
      select: {
        id: true,
        documentId: true,
        project: {
          select: { ownerId: true },
        },
      },
    });

    if (!shareLink) {
      return NextResponse.json({ error: 'Share link not found' }, { status: 404 });
    }

    if (shareLink.project.ownerId !== user.id) {
      return forbiddenResponse('Only the owner can delete share links');
    }

    await prisma.$transaction(async (tx) => {
      await tx.shareLink.delete({
        where: { id: shareLink.id },
      });

      if (!shareLink.documentId) return;

      const document = await tx.document.findUnique({
        where: { id: shareLink.documentId },
        select: { id: true, isVisible: true },
      });

      if (!document || document.isVisible) return;

      const remainingLinks = await tx.shareLink.count({
        where: { documentId: document.id },
      });

      if (remainingLinks === 0) {
        await tx.document.delete({
          where: { id: document.id },
        });
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/share/[id] error:', error);
    return NextResponse.json({ error: 'Failed to delete share link' }, { status: 500 });
  }
}
