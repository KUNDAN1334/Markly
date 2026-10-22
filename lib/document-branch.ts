import { randomUUID } from 'crypto';
import { withStatusEvents } from '@/lib/comment-status';
import { prisma } from '@/lib/prisma';
import type { Prisma } from '@/generated/prisma/client';

export async function createDocumentBranch(sourceDocumentId: string) {
  return prisma.$transaction(async (tx) => {
    const source = await tx.document.findUnique({
      where: { id: sourceDocumentId },
      include: {
        annotations: { orderBy: { createdAt: 'asc' } },
        comments: { orderBy: { createdAt: 'asc' }, include: withStatusEvents },
      },
    });

    if (!source) {
      throw new Error('Source document not found');
    }

    const branchedDocument = await tx.document.create({
      data: {
        filename: source.filename,
        originalName: source.originalName,
        mimeType: source.mimeType,
        size: source.size,
        path: source.path,
        projectId: source.projectId,
        isVisible: false,
      },
    });

    if (source.annotations.length > 0) {
      await tx.annotation.createMany({
        data: source.annotations.map((annotation) => ({
          documentId: branchedDocument.id,
          pageNumber: annotation.pageNumber,
          type: annotation.type,
          // Reading a Json column yields JsonValue (which includes null); writing
          // one requires InputJsonValue (which doesn't). These are copied from an
          // existing row, so they're already valid JSON.
          geometry: annotation.geometry as Prisma.InputJsonValue,
          style: annotation.style as Prisma.InputJsonValue,
          content: annotation.content,
        })),
      });
    }

    if (source.comments.length > 0) {
      // Ids are assigned up front so each comment's status history can follow it.
      const branchedComments = source.comments.map((comment) => ({ id: randomUUID(), source: comment }));

      await tx.comment.createMany({
        data: branchedComments.map(({ id, source: comment }) => ({
          id,
          content: comment.content,
          documentId: branchedDocument.id,
          authorUserId: comment.authorUserId,
          authorName: comment.authorName,
          pageNumber: comment.pageNumber,
          resolved: comment.resolved,
          status: comment.status,
          createdAt: comment.createdAt,
        })),
      });

      const statusEvents = branchedComments.flatMap(({ id, source: comment }) =>
        comment.statusEvents.map((event) => ({
          commentId: id,
          fromStatus: event.fromStatus,
          toStatus: event.toStatus,
          note: event.note,
          actorUserId: event.actorUserId,
          actorName: event.actorName,
          createdAt: event.createdAt,
        }))
      );

      if (statusEvents.length > 0) {
        await tx.commentStatusEvent.createMany({ data: statusEvents });
      }
    }

    return branchedDocument;
  });
}
