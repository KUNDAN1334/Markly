import { NextRequest, NextResponse } from 'next/server';
import { requireWorkspaceAccess } from '@/lib/workspace-access';
import { isWorkspaceRole } from '@/lib/rbac';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

type RouteContext = {
  params: Promise<{ id: string }>;
};

// OWNER is tied to Workspace.ownerUserId and can't be granted here.
const assignableRoleSchema = z.enum(['ADMIN', 'EDITOR', 'COMMENTER', 'VIEWER']);

const updateMemberSchema = z.object({
  userId: z.string().min(1),
  role: assignableRoleSchema,
});

const removeMemberSchema = z.object({
  userId: z.string().min(1),
});

export async function GET(req: NextRequest, { params }: RouteContext) {
  const { id } = await params;
  const access = await requireWorkspaceAccess(req, id, 'view');
  if (!access.ok) return access.response;

  const memberships = await prisma.workspaceMembership.findMany({
    where: { workspaceId: id },
    include: {
      user: {
        select: { id: true, name: true, email: true, imageUrl: true },
      },
    },
    orderBy: { createdAt: 'asc' },
  });

  return NextResponse.json(
    memberships.map((membership) => ({
      id: membership.id,
      userId: membership.userId,
      role: isWorkspaceRole(membership.role) ? membership.role : 'VIEWER',
      isOwner: membership.userId === access.workspace.ownerUserId,
      user: membership.user,
      createdAt: membership.createdAt,
    }))
  );
}

export async function PATCH(req: NextRequest, { params }: RouteContext) {
  try {
    const { id } = await params;
    const access = await requireWorkspaceAccess(req, id, 'manageWorkspace');
    if (!access.ok) return access.response;

    const { userId, role } = updateMemberSchema.parse(await req.json());

    if (userId === access.workspace.ownerUserId) {
      return NextResponse.json(
        { error: "The workspace owner's role cannot be changed" },
        { status: 400 }
      );
    }

    const membership = await prisma.workspaceMembership.update({
      where: { userId_workspaceId: { userId, workspaceId: id } },
      data: { role },
    });

    return NextResponse.json(membership);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    console.error('PATCH /api/workspaces/[id]/members error:', error);
    return NextResponse.json({ error: 'Failed to update member' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: RouteContext) {
  try {
    const { id } = await params;
    const { userId } = removeMemberSchema.parse(await req.json());

    // Members may remove themselves (leave); otherwise ADMIN+ required.
    const permission = 'manageWorkspace';
    const access = await requireWorkspaceAccess(
      req,
      id,
      undefined // membership check only; role check below
    );
    if (!access.ok) return access.response;

    const isSelf = access.user.id === userId;
    if (!isSelf) {
      const adminAccess = await requireWorkspaceAccess(req, id, permission);
      if (!adminAccess.ok) return adminAccess.response;
    }

    if (userId === access.workspace.ownerUserId) {
      return NextResponse.json(
        { error: 'The workspace owner cannot be removed' },
        { status: 400 }
      );
    }

    await prisma.workspaceMembership.delete({
      where: { userId_workspaceId: { userId, workspaceId: id } },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    console.error('DELETE /api/workspaces/[id]/members error:', error);
    return NextResponse.json({ error: 'Failed to remove member' }, { status: 500 });
  }
}
