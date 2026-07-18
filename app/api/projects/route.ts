import { NextRequest, NextResponse } from 'next/server';
import { forbiddenResponse, requireAuthenticatedUser, unauthorizedResponse } from '@/lib/auth';
import { checkWorkspaceLimits, planErrorResponse } from '@/lib/billing/feature-gating';
import { ensureWorkspaceForUser } from '@/lib/billing/workspace';
import { getCurrentWorkspace } from '@/lib/workspace-access';
import { hasPermission } from '@/lib/rbac';
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
    const { workspace } = await getCurrentWorkspace(req, user);

    // Workspace-scoped: members see every project in the current workspace.
    const projects = await prisma.project.findMany({
      where: { workspaceId: workspace.id },
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
    await ensureWorkspaceForUser(user);
    const { workspace, role } = await getCurrentWorkspace(req, user);

    if (!hasPermission(role, 'createProject')) {
      return forbiddenResponse('Your role does not allow creating projects');
    }

    const body = await req.json();
    const { name } = createProjectSchema.parse(body);
    await checkWorkspaceLimits(workspace, {
      enforceProjectLimit: true,
      enforceDocumentLimit: false,
      enforceMonthlyDocumentLimit: false,
    });

    const project = await prisma.project.create({
      data: { name, ownerId: user.id, workspaceId: workspace.id },
      include: { documents: true, shareLinks: true },
    });

    return NextResponse.json(project, { status: 201 });
  } catch (error) {
    const gated = planErrorResponse(error);
    if (gated) return gated;
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    console.error('POST /api/projects error:', error);
    return NextResponse.json({ error: 'Failed to create project' }, { status: 500 });
  }
}
