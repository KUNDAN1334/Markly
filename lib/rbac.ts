import { prisma } from '@/lib/prisma';
import type { AccessType } from '@/types';

export type WorkspaceRole = 'OWNER' | 'ADMIN' | 'EDITOR' | 'COMMENTER' | 'VIEWER';

export const WORKSPACE_ROLES: WorkspaceRole[] = ['OWNER', 'ADMIN', 'EDITOR', 'COMMENTER', 'VIEWER'];

const ROLE_RANK: Record<WorkspaceRole, number> = {
  OWNER: 5,
  ADMIN: 4,
  EDITOR: 3,
  COMMENTER: 2,
  VIEWER: 1,
};

/**
 * Permission -> minimum role mapping.
 *
 * | Action           | OWNER | ADMIN | EDITOR | COMMENTER | VIEWER |
 * | ---------------- | ----- | ----- | ------ | --------- | ------ |
 * | Manage workspace |  yes  |  yes  |   no   |    no     |   no   |
 * | Edit documents   |  yes  |  yes  |  yes   |    no     |   no   |
 * | Comment          |  yes  |  yes  |  yes   |   yes     |   no   |
 * | View             |  yes  |  yes  |  yes   |   yes     |  yes   |
 * | Export           |  yes  |  yes  |  yes   |    no     |   no   |
 */
export const PERMISSION_MIN_ROLE = {
  manageWorkspace: 'ADMIN',
  deleteWorkspace: 'OWNER',
  manageBilling: 'OWNER',
  createProject: 'EDITOR',
  deleteProject: 'ADMIN',
  uploadDocument: 'EDITOR',
  editDocument: 'EDITOR',
  manageShareLinks: 'EDITOR',
  export: 'EDITOR',
  comment: 'COMMENTER',
  view: 'VIEWER',
} as const satisfies Record<string, WorkspaceRole>;

export type WorkspacePermission = keyof typeof PERMISSION_MIN_ROLE;

export function isWorkspaceRole(value: unknown): value is WorkspaceRole {
  return typeof value === 'string' && WORKSPACE_ROLES.includes(value as WorkspaceRole);
}

export function roleAtLeast(role: WorkspaceRole, minimum: WorkspaceRole): boolean {
  return ROLE_RANK[role] >= ROLE_RANK[minimum];
}

export function hasPermission(role: WorkspaceRole, permission: WorkspacePermission): boolean {
  return roleAtLeast(role, PERMISSION_MIN_ROLE[permission]);
}

/** Share-link access levels reuse the same enforcement path as roles. */
export function accessTypeToMinimumRole(access: AccessType): WorkspaceRole {
  switch (access) {
    case 'EDIT':
      return 'EDITOR';
    case 'COMMENT':
      return 'COMMENTER';
    default:
      return 'VIEWER';
  }
}

/**
 * Resolve the caller's role inside a workspace.
 * Workspace owners are implicitly OWNER even without a membership row.
 */
export async function getWorkspaceRole(
  userId: string,
  workspaceId: string
): Promise<WorkspaceRole | null> {
  const workspace = await prisma.workspace.findUnique({
    where: { id: workspaceId },
    select: { ownerUserId: true },
  });
  if (!workspace) return null;
  if (workspace.ownerUserId === userId) return 'OWNER';

  const membership = await prisma.workspaceMembership.findUnique({
    where: { userId_workspaceId: { userId, workspaceId } },
    select: { role: true },
  });

  return membership && isWorkspaceRole(membership.role) ? membership.role : null;
}

export async function getWorkspaceRoleForProject(
  userId: string,
  projectId: string
): Promise<{ role: WorkspaceRole; workspaceId: string | null } | null> {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { ownerId: true, workspaceId: true },
  });
  if (!project) return null;

  if (project.workspaceId) {
    const role = await getWorkspaceRole(userId, project.workspaceId);
    return role ? { role, workspaceId: project.workspaceId } : null;
  }

  // Legacy project not yet attached to a workspace: only its owner can touch it.
  return project.ownerId === userId ? { role: 'OWNER', workspaceId: null } : null;
}

export async function getWorkspaceRoleForDocument(
  userId: string,
  documentId: string
): Promise<{ role: WorkspaceRole; workspaceId: string | null } | null> {
  const document = await prisma.document.findUnique({
    where: { id: documentId },
    select: { workspaceId: true, projectId: true },
  });
  if (!document) return null;

  if (document.workspaceId) {
    const role = await getWorkspaceRole(userId, document.workspaceId);
    return role ? { role, workspaceId: document.workspaceId } : null;
  }

  return getWorkspaceRoleForProject(userId, document.projectId);
}
