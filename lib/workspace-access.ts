import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  forbiddenResponse,
  readRequestCookie,
  requireAuthenticatedUser,
  unauthorizedResponse,
} from '@/lib/auth';
import {
  hasPermission,
  getWorkspaceRole,
  type WorkspacePermission,
  type WorkspaceRole,
} from '@/lib/rbac';
import { ensureWorkspaceForUser } from '@/lib/billing/workspace';
import type { User } from '@/generated/prisma/models/User';
import type { Workspace } from '@/generated/prisma/models/Workspace';

export const WORKSPACE_COOKIE_NAME = 'markly_workspace';

type WorkspaceAccessFailure = {
  ok: false;
  response: NextResponse;
};

export type WorkspaceAccessSuccess = {
  ok: true;
  user: User;
  workspace: Workspace;
  role: WorkspaceRole;
};

export type WorkspaceAccessResult = WorkspaceAccessFailure | WorkspaceAccessSuccess;

/**
 * API middleware: validates that the caller is authenticated, belongs to the
 * workspace, and holds a role sufficient for `permission`.
 *
 * Usage:
 *   const access = await requireWorkspaceAccess(req, workspaceId, 'manageWorkspace');
 *   if (!access.ok) return access.response;
 */
export async function requireWorkspaceAccess(
  req: Request,
  workspaceId: string,
  permission: WorkspacePermission = 'view'
): Promise<WorkspaceAccessResult> {
  const user = await requireAuthenticatedUser(req);
  if (!user) return { ok: false, response: unauthorizedResponse() };

  const workspace = await prisma.workspace.findUnique({ where: { id: workspaceId } });
  if (!workspace) {
    return {
      ok: false,
      response: NextResponse.json({ error: 'Workspace not found' }, { status: 404 }),
    };
  }

  const role = await getWorkspaceRole(user.id, workspaceId);
  if (!role) {
    return {
      ok: false,
      response: forbiddenResponse('You are not a member of this workspace'),
    };
  }

  if (!hasPermission(role, permission)) {
    return {
      ok: false,
      response: forbiddenResponse('Your role does not allow this action'),
    };
  }

  return { ok: true, user, workspace, role };
}

/** All workspaces the user can see (owned + member of), with their role. */
export async function listWorkspacesForUser(userId: string) {
  const [owned, memberships] = await Promise.all([
    prisma.workspace.findMany({
      where: { ownerUserId: userId },
      orderBy: { createdAt: 'asc' },
    }),
    prisma.workspaceMembership.findMany({
      where: { userId, workspace: { ownerUserId: { not: userId } } },
      include: { workspace: true },
      orderBy: { createdAt: 'asc' },
    }),
  ]);

  return [
    ...owned.map((workspace) => ({ workspace, role: 'OWNER' as WorkspaceRole })),
    ...memberships.map((membership) => ({
      workspace: membership.workspace,
      role: membership.role as WorkspaceRole,
    })),
  ];
}

/**
 * The workspace the user is currently operating in: the one selected via the
 * workspace cookie when the user still has access to it, otherwise their own
 * (auto-provisioned) workspace.
 */
export async function getCurrentWorkspace(
  req: Request,
  user: User
): Promise<{ workspace: Workspace; role: WorkspaceRole }> {
  const selectedId = readRequestCookie(req, WORKSPACE_COOKIE_NAME);

  if (selectedId) {
    const role = await getWorkspaceRole(user.id, selectedId);
    if (role) {
      const workspace = await prisma.workspace.findUnique({ where: { id: selectedId } });
      if (workspace) return { workspace, role };
    }
  }

  const workspace = await ensureWorkspaceForUser(user);
  return { workspace, role: 'OWNER' };
}
