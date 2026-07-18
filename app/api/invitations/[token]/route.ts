import { NextRequest, NextResponse } from 'next/server';
import { requireAuthenticatedUser, unauthorizedResponse } from '@/lib/auth';
import { roleAtLeast, isWorkspaceRole, type WorkspaceRole } from '@/lib/rbac';
import { WORKSPACE_COOKIE_NAME } from '@/lib/workspace-access';
import { prisma } from '@/lib/prisma';

type RouteContext = {
  params: Promise<{ token: string }>;
};

async function findValidInvitation(token: string) {
  const invitation = await prisma.workspaceInvitation.findUnique({
    where: { token },
    include: {
      workspace: { select: { id: true, name: true } },
      invitedByUser: { select: { name: true, email: true } },
    },
  });

  if (!invitation || invitation.status === 'REVOKED') {
    return { error: 'Invitation not found', status: 404 } as const;
  }
  if (invitation.status === 'ACCEPTED') {
    return { error: 'Invitation already accepted', status: 410 } as const;
  }
  if (invitation.expiresAt && new Date(invitation.expiresAt) < new Date()) {
    return { error: 'Invitation expired', status: 410 } as const;
  }

  return { invitation } as const;
}

/** Public info so the invite page can render before login. */
export async function GET(_req: NextRequest, { params }: RouteContext) {
  const { token } = await params;
  const result = await findValidInvitation(token);
  if ('error' in result) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  const { invitation } = result;
  return NextResponse.json({
    workspaceName: invitation.workspace.name,
    email: invitation.email,
    role: invitation.role,
    invitedBy: invitation.invitedByUser?.name || invitation.invitedByUser?.email || null,
  });
}

/** Accept the invitation and join the workspace with the invited role. */
export async function POST(req: NextRequest, { params }: RouteContext) {
  try {
    const { token } = await params;
    const user = await requireAuthenticatedUser(req);
    if (!user) return unauthorizedResponse('Log in to accept this invitation');

    const result = await findValidInvitation(token);
    if ('error' in result) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }
    const { invitation } = result;

    if (
      user.email &&
      invitation.email.toLowerCase() !== user.email.toLowerCase()
    ) {
      return NextResponse.json(
        { error: `This invitation was sent to ${invitation.email}. Log in with that email to accept it.` },
        { status: 403 }
      );
    }

    const invitedRole: WorkspaceRole = isWorkspaceRole(invitation.role)
      ? invitation.role
      : 'VIEWER';

    await prisma.$transaction(async (tx) => {
      const existing = await tx.workspaceMembership.findUnique({
        where: {
          userId_workspaceId: { userId: user.id, workspaceId: invitation.workspaceId },
        },
      });

      if (!existing) {
        await tx.workspaceMembership.create({
          data: {
            userId: user.id,
            workspaceId: invitation.workspaceId,
            role: invitedRole,
          },
        });
      } else if (
        isWorkspaceRole(existing.role) &&
        !roleAtLeast(existing.role, invitedRole)
      ) {
        // Upgrade only — never silently downgrade an existing member.
        await tx.workspaceMembership.update({
          where: { id: existing.id },
          data: { role: invitedRole },
        });
      }

      await tx.workspaceInvitation.update({
        where: { id: invitation.id },
        data: { status: 'ACCEPTED', acceptedAt: new Date() },
      });
    });

    // Switch the user into the workspace they just joined.
    const response = NextResponse.json({
      success: true,
      workspaceId: invitation.workspaceId,
      workspaceName: invitation.workspace.name,
      role: invitedRole,
    });
    response.cookies.set(WORKSPACE_COOKIE_NAME, invitation.workspaceId, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 60 * 60 * 24 * 365,
    });
    return response;
  } catch (error) {
    console.error('POST /api/invitations/[token] error:', error);
    return NextResponse.json({ error: 'Failed to accept invitation' }, { status: 500 });
  }
}
