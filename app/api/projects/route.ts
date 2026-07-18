import { NextRequest, NextResponse } from 'next/server';
import { requireAuthenticatedUser, unauthorizedResponse } from '@/lib/auth';
import { ensureWorkspaceForUser } from '@/lib/workspace';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const createProjectSchema = z.object({
  name: z.string().min(1).max(100),
});

export async function GET(req: NextRequest) {
  try {
    const user = await requireAuthenticatedUser(req);
    if (!user) return unauthorizedResponse();

    await ensureWorkspaceForUser(user);

    const projects = await prisma.project.findMany({
      where: { ownerId: user.id },
      include: {
        documents: {
          where: { isVisible: true },
          select: { id: true, originalName: true, createdAt: true },
          orderBy: { createdAt: 'desc' },
        },
        shareLinks: true,
        _count: { select: { documents: true } },
      },
      orderBy: { updatedAt: 'desc' },
    });
    return NextResponse.json(projects);
  } catch (error) {
    console.error('GET /api/projects error:', error);
    return NextResponse.json({ error: 'Failed to fetch projects' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuthenticatedUser(req);
    if (!user) return unauthorizedResponse();
    const workspace = await ensureWorkspaceForUser(user);

    const body = await req.json();
    const { name } = createProjectSchema.parse(body);

    const project = await prisma.project.create({
      data: { name, ownerId: user.id, workspaceId: workspace.id },
      include: { documents: true, shareLinks: true },
    });

    return NextResponse.json(project, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    console.error('POST /api/projects error:', error);
    return NextResponse.json({ error: 'Failed to create project' }, { status: 500 });
  }
}
