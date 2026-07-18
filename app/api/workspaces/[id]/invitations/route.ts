import { NextRequest, NextResponse } from 'next/server';
import { requireWorkspaceAccess } from '@/lib/workspace-access';
import { prisma } from '@/lib/prisma';
import { generateToken } from '@/lib/utils';
import { z } from 'zod';

type RouteContext = {
  params: Promise<{ id: string }>;
};

const INVITATION_TTL_MS = 1000 * 60 * 60 * 24 * 7; // 7 days

const createInvitationSchema = z.object({
  email: z.string().email().max(320),
  role: z.enum(['ADMIN', 'EDITOR', 'COMMENTER', 'VIEWER']).default('EDITOR'),
});

export async function GET(req: NextRequest, { params }: RouteContext) {
  const { id } = await params;
  const access = await requireWorkspaceAccess(req, id, 'manageWorkspace');
  if (!access.ok) return access.response;

  const invitations = await prisma.workspaceInvitation.findMany({
    where: { workspaceId: id, status: 'PENDING' },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json(invitations);
}

export async function POST(req: NextRequest, { params }: RouteContext) {
  try {
    const { id } = await params;
    const access = await requireWorkspaceAccess(req, id, 'manageWorkspace');
    if (!access.ok) return access.response;

    const { email, role } = createInvitationSchema.parse(await req.json());
    const normalizedEmail = email.trim().toLowerCase();

    const existingMember = await prisma.workspaceMembership.findFirst({
      where: {
        workspaceId: id,
        user: { email: { equals: normalizedEmail, mode: 'insensitive' } },
      },
    });
    if (existingMember) {
      return NextResponse.json(
        { error: 'This user is already a member of the workspace' },
        { status: 409 }
      );
    }

    // Re-inviting the same email refreshes the pending invitation.
    const pending = await prisma.workspaceInvitation.findFirst({
      where: { workspaceId: id, email: normalizedEmail, status: 'PENDING' },
    });

    const expiresAt = new Date(Date.now() + INVITATION_TTL_MS);

    const invitation = pending
      ? await prisma.workspaceInvitation.update({
          where: { id: pending.id },
          data: { role, expiresAt, invitedByUserId: access.user.id },
        })
      : await prisma.workspaceInvitation.create({
          data: {
            workspaceId: id,
            email: normalizedEmail,
            role,
            token: generateToken(),
            invitedByUserId: access.user.id,
            expiresAt,
          },
        });

    // NOTE: transactional email delivery can be hooked in here later; for now
    // the invite URL is returned so it can be copied and shared directly.
    const origin = req.nextUrl.origin;
    return NextResponse.json(
      { ...invitation, inviteUrl: `${origin}/invite/${invitation.token}` },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    console.error('POST /api/workspaces/[id]/invitations error:', error);
    return NextResponse.json({ error: 'Failed to create invitation' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: RouteContext) {
  try {
    const { id } = await params;
    const access = await requireWorkspaceAccess(req, id, 'manageWorkspace');
    if (!access.ok) return access.response;

    const { invitationId } = z
      .object({ invitationId: z.string().min(1) })
      .parse(await req.json());

    const invitation = await prisma.workspaceInvitation.findFirst({
      where: { id: invitationId, workspaceId: id },
    });
    if (!invitation) {
      return NextResponse.json({ error: 'Invitation not found' }, { status: 404 });
    }

    await prisma.workspaceInvitation.update({
      where: { id: invitationId },
      data: { status: 'REVOKED' },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    console.error('DELETE /api/workspaces/[id]/invitations error:', error);
    return NextResponse.json({ error: 'Failed to revoke invitation' }, { status: 500 });
  }
}
