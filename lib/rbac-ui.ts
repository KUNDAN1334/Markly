// Client-safe role helpers for soft (UI-level) gating.
// Hard enforcement lives server-side in lib/rbac.ts.
import type { WorkspaceRole } from '@/types';

const ROLE_RANK: Record<WorkspaceRole, number> = {
  OWNER: 5,
  ADMIN: 4,
  EDITOR: 3,
  COMMENTER: 2,
  VIEWER: 1,
};

function atLeast(role: WorkspaceRole | null | undefined, minimum: WorkspaceRole): boolean {
  return Boolean(role && ROLE_RANK[role] >= ROLE_RANK[minimum]);
}

export const roleCanManageWorkspace = (role?: WorkspaceRole | null) => atLeast(role, 'ADMIN');
export const roleCanEdit = (role?: WorkspaceRole | null) => atLeast(role, 'EDITOR');
export const roleCanExport = (role?: WorkspaceRole | null) => atLeast(role, 'EDITOR');
export const roleCanComment = (role?: WorkspaceRole | null) => atLeast(role, 'COMMENTER');

export const ROLE_LABELS: Record<WorkspaceRole, string> = {
  OWNER: 'Owner',
  ADMIN: 'Admin',
  EDITOR: 'Editor',
  COMMENTER: 'Commenter',
  VIEWER: 'Viewer',
};
