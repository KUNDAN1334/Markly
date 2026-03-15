import { NextRequest, NextResponse } from 'next/server';
import { createDocumentBranch } from '@/lib/document-branch';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { generateToken } from '@/lib/utils';

const shareLinkSchema = z.object({
  documentId: z.string(),
  access: z.enum(['VIEW', 'COMMENT', 'EDIT']).default('VIEW'),
  expiresAt: z.string().optional(),
});

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get('token');

  if (token) {
    const shareLink = await prisma.shareLink.findUnique({
      where: { token },
      include: {
        document: {
          include: {
            annotations: { orderBy: { createdAt: 'asc' } },
            comments: { orderBy: { createdAt: 'desc' } },
            shareLinks: {
              orderBy: { createdAt: 'desc' },
            },
          },
        },
        project: {
          include: {
            documents: {
              include: {
                annotations: { orderBy: { createdAt: 'asc' } },
                comments: { orderBy: { createdAt: 'desc' } },
              },
            },
            shareLinks: {
              orderBy: { createdAt: 'desc' },
            },
          },
        },
      },
    });

    if (!shareLink) return NextResponse.json({ error: 'Link not found' }, { status: 404 });

    if (shareLink.expiresAt && new Date(shareLink.expiresAt) < new Date()) {
      return NextResponse.json({ error: 'Link expired' }, { status: 410 });
    }

    return NextResponse.json(shareLink);
  }

  const documentId = searchParams.get('documentId');
  if (documentId) {
    const links = await prisma.shareLink.findMany({
      where: { documentId },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(links);
  }

  const projectId = searchParams.get('projectId');
  if (!projectId) return NextResponse.json({ error: 'projectId required' }, { status: 400 });

  const links = await prisma.shareLink.findMany({
    where: { projectId },
    orderBy: { createdAt: 'desc' },
  });
  return NextResponse.json(links);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { documentId, access, expiresAt } = shareLinkSchema.parse(body);

    const sourceDocument = await prisma.document.findUnique({
      where: { id: documentId },
      select: { id: true, projectId: true },
    });

    if (!sourceDocument) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    const targetDocument =
      access === 'EDIT'
        ? await createDocumentBranch(sourceDocument.id)
        : sourceDocument;

    const shareLink = await prisma.shareLink.create({
      data: {
        token: generateToken(),
        projectId: targetDocument.projectId,
        documentId: targetDocument.id,
        access,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
      },
    });

    return NextResponse.json(shareLink, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to create share link' }, { status: 500 });
  }
}
