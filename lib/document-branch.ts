import { prisma } from '@/lib/prisma';

export async function createDocumentBranch(sourceDocumentId: string) {
  return prisma.$transaction(async (tx) => {
    const source = await tx.document.findUnique({
      where: { id: sourceDocumentId },
      include: {
        annotations: { orderBy: { createdAt: 'asc' } },
        comments: { orderBy: { createdAt: 'asc' } },
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
          geometry: annotation.geometry,
          style: annotation.style,
          content: annotation.content,
        })),
      });
    }

    if (source.comments.length > 0) {
      await tx.comment.createMany({
        data: source.comments.map((comment) => ({
          content: comment.content,
          documentId: branchedDocument.id,
          pageNumber: comment.pageNumber,
          resolved: comment.resolved,
        })),
      });
    }

    return branchedDocument;
  });
}
