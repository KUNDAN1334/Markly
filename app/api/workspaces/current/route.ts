import { NextRequest, NextResponse } from 'next/server';
import { requireAuthenticatedUser, unauthorizedResponse } from '@/lib/auth';
import { ensureWorkspaceForUser } from '@/lib/workspace';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const user = await requireAuthenticatedUser(req);
  if (!user) return unauthorizedResponse();

  const workspace = await ensureWorkspaceForUser(user);
  const hydratedWorkspace = await prisma.workspace.findUnique({
    where: { id: workspace.id },
    include: {
      _count: {
        select: {
          projects: true,
        },
      },
      projects: {
        select: {
          id: true,
          _count: {
            select: {
              documents: true,
            },
          },
        },
      },
    },
  });

  if (!hydratedWorkspace) {
    return NextResponse.json({ error: 'Workspace not found' }, { status: 404 });
  }

  const documentCount = await prisma.document.count({
    where: {
      project: {
        workspaceId: hydratedWorkspace.id,
      },
      isVisible: true,
    },
  });

  return NextResponse.json({
    ...hydratedWorkspace,
    usage: {
      activeProjectsCount: hydratedWorkspace._count.projects,
      activeDocumentsCount: documentCount,
    },
  });
}

