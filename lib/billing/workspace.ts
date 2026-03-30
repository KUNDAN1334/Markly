import { prisma } from '@/lib/prisma';
import type { User } from '@/generated/prisma/models/User';

export async function ensureWorkspaceForUser(user: User) {
  let workspace = await prisma.workspace.findFirst({
    where: { ownerUserId: user.id },
    orderBy: { createdAt: 'asc' },
  });

  if (!workspace) {
    workspace = await prisma.workspace.create({
      data: {
        name: user.name?.trim() ? `${user.name}'s Workspace` : 'My Workspace',
        ownerUserId: user.id,
        currentPlanId: 'free',
        subscriptionStatus: 'none',
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

export async function getWorkspaceBySubscriptionId(razorpaySubscriptionId: string) {
  return prisma.workspace.findFirst({
    where: { razorpaySubscriptionId },
  });
}

export async function getWorkspaceForProject(projectId: string) {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: {
      workspace: true,
      owner: true,
    },
  });

  if (!project) return null;
  if (project.workspace) return project.workspace;

  return ensureWorkspaceForUser(project.owner);
}

export async function getWorkspaceForDocument(documentId: string) {
  const document = await prisma.document.findUnique({
    where: { id: documentId },
    select: {
      project: {
        select: {
          id: true,
        },
      },
    },
  });

  if (!document) return null;
  return getWorkspaceForProject(document.project.id);
}

