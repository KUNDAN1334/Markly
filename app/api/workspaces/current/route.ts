import { NextRequest, NextResponse } from 'next/server';
import { requireAuthenticatedUser, unauthorizedResponse } from '@/lib/auth';
import { getPlanForWorkspace, serializePlan } from '@/lib/billing/plans';
import { ensureWorkspaceForUser } from '@/lib/billing/workspace';
import { getCurrentWorkspace, WORKSPACE_COOKIE_NAME } from '@/lib/workspace-access';
import { getWorkspaceRole } from '@/lib/rbac';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const switchWorkspaceSchema = z.object({
  workspaceId: z.string().min(1),
});

export async function GET(req: NextRequest) {
  const user = await requireAuthenticatedUser(req);
  if (!user) return unauthorizedResponse();

  await ensureWorkspaceForUser(user);
  const { workspace, role } = await getCurrentWorkspace(req, user);

  const hydratedWorkspace = await prisma.workspace.findUnique({
    where: { id: workspace.id },
    include: {
      _count: {
        select: {
          projects: true,
          memberships: true,
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
    myRole: role,
    memberCount: hydratedWorkspace._count.memberships,
    currentPlan: serializePlan(getPlanForWorkspace(hydratedWorkspace)),
    usage: {
      activeProjectsCount: hydratedWorkspace._count.projects,
      activeDocumentsCount: documentCount,
    },
  });
}

/** Switch the current workspace (persisted via cookie). */
export async function POST(req: NextRequest) {
  try {
    const user = await requireAuthenticatedUser(req);
    if (!user) return unauthorizedResponse();

    const { workspaceId } = switchWorkspaceSchema.parse(await req.json());

    const role = await getWorkspaceRole(user.id, workspaceId);
    if (!role) {
      return NextResponse.json(
        { error: 'You are not a member of this workspace' },
        { status: 403 }
      );
    }

    const response = NextResponse.json({ success: true, workspaceId, role });
    response.cookies.set(WORKSPACE_COOKIE_NAME, workspaceId, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 60 * 60 * 24 * 365,
    });
    return response;
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    console.error('POST /api/workspaces/current error:', error);
    return NextResponse.json({ error: 'Failed to switch workspace' }, { status: 500 });
  }
}
