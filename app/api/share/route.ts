import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { generateToken } from '@/lib/utils';

const shareLinkSchema = z.object({
  projectId: z.string(),
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
        project: {
          include: {
            documents: {
              include: {
                annotations: { orderBy: { createdAt: 'asc' } },
                comments: { orderBy: { createdAt: 'desc' } },
              },
            },
            shareLinks: true,
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

  const projectId = searchParams.get('projectId');
  if (!projectId) return NextResponse.json({ error: 'projectId required' }, { status: 400 });

  const links = await prisma.shareLink.findMany({ where: { projectId } });
  return NextResponse.json(links);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { projectId, access, expiresAt } = shareLinkSchema.parse(body);

    const shareLink = await prisma.shareLink.create({
      data: {
        token: generateToken(),
        projectId,
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
