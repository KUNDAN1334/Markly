import { NextRequest, NextResponse } from 'next/server';
import { authorizeProjectAccess } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const access = await authorizeProjectAccess(req, id, 'view');
    if (!access.ok) return access.response;

    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        documents: {
          where: { isVisible: true },
          include: {
            annotations: { orderBy: { createdAt: 'asc' } },
            comments: { orderBy: { createdAt: 'asc' } },
          },
          orderBy: { createdAt: 'desc' },
        },
        shareLinks: true,
      },
    });
    if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    return NextResponse.json({ ...project, myRole: access.role });
  } catch (error) {
    console.error('GET /api/projects/[id] error:', error);
    return NextResponse.json({ error: 'Failed to fetch project' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const access = await authorizeProjectAccess(req, id, 'deleteProject');
    if (!access.ok) return access.response;

    await prisma.project.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Failed to delete project' }, { status: 500 });
  }
}
