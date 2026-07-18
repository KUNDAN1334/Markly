import { NextRequest, NextResponse } from 'next/server';
import { requireAuthenticatedUser, unauthorizedResponse } from '@/lib/auth';
import { listWorkspacesForUser } from '@/lib/workspace-access';
import { ensureWorkspaceForUser } from '@/lib/billing/workspace';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const createWorkspaceSchema = z.object({
  name: z.string().min(1).max(100),
});

export async function GET(req: NextRequest) {
  const user = await requireAuthenticatedUser(req);
  if (!user) return unauthorizedResponse();

  await ensureWorkspaceForUser(user);
  const workspaces = await listWorkspacesForUser(user.id);

  return NextResponse.json(
    workspaces.map(({ workspace, role }) => ({
      id: workspace.id,
      name: workspace.name,
      ownerUserId: workspace.ownerUserId,
      role,
      createdAt: workspace.createdAt,
    }))
  );
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuthenticatedUser(req);
    if (!user) return unauthorizedResponse();

    const { name } = createWorkspaceSchema.parse(await req.json());

    const workspace = await prisma.workspace.create({
      data: {
        name,
        ownerUserId: user.id,
        currentPlanId: 'free',
        subscriptionStatus: 'none',
        memberships: {
          create: { userId: user.id, role: 'OWNER' },
        },
      },
    });

    return NextResponse.json({ ...workspace, role: 'OWNER' }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    console.error('POST /api/workspaces error:', error);
    return NextResponse.json({ error: 'Failed to create workspace' }, { status: 500 });
  }
}
