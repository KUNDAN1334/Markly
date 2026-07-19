import { prisma } from '@/lib/prisma';
import type { UserModel } from '@/generated/prisma/models/User';

export async function ensureWorkspaceForUser(user: UserModel) {
  let workspace = await prisma.workspace.findFirst({
    where: { ownerUserId: user.id },
    orderBy: { createdAt: 'asc' },
  });

  if (!workspace) {
    workspace = await prisma.workspace.create({
      data: {
        name: user.name?.trim() ? `${user.name}'s Workspace` : 'My Workspace',
        ownerUserId: user.id,
      },
    });
  }

  await prisma.project.updateMany({
    where: {
      ownerId: user.id,
      workspaceId: null,
    },
    data: {
      workspaceId: workspace.id,
    },
  });

  return workspace;
}

export async function getWorkspaceForUser(userId: string) {
  return prisma.workspace.findFirst({
    where: { ownerUserId: userId },
    orderBy: { createdAt: 'asc' },
  });
}

export async function getWorkspaceByIdForUser(workspaceId: string, userId: string) {
  return prisma.workspace.findFirst({
    where: { id: workspaceId, ownerUserId: userId },
  });
}

