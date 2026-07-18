import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { firebaseAdminAuth } from '@/lib/firebase-admin';
import { AccessType } from '@/types';
import { validateShareLinkAccess } from '@/lib/share-link-auth';
import {
  accessTypeToMinimumRole,
  getWorkspaceRoleForDocument,
  getWorkspaceRoleForProject,
  hasPermission,
  roleAtLeast,
  type WorkspacePermission,
  type WorkspaceRole,
} from '@/lib/rbac';

const SESSION_COOKIE_NAME = 'markly_session';
const SESSION_MAX_AGE_MS = 1000 * 60 * 60 * 24 * 5;

type DecodedUser = {
  uid: string;
  email?: string;
  name?: string;
  picture?: string;
};

type AccessFailure = {
  ok: false;
  response: NextResponse;
};

type AccessSuccess = {
  ok: true;
  actor: 'member' | 'share';
  userId?: string;
  role?: WorkspaceRole;
};

export function getSessionCookieName() {
  return SESSION_COOKIE_NAME;
}

export function getSessionMaxAgeMs() {
  return SESSION_MAX_AGE_MS;
}

export function readRequestCookie(req: Request, name: string) {
  const raw = req.headers.get('cookie');
  if (!raw) return null;

  for (const part of raw.split(';')) {
    const [key, ...rest] = part.trim().split('=');
    if (key === name) {
      return decodeURIComponent(rest.join('='));
    }
  }

  return null;
}

export async function verifySessionRequest(req: Request) {
  const sessionCookie = readRequestCookie(req, SESSION_COOKIE_NAME);
  if (!sessionCookie) return null;

  try {
    return await firebaseAdminAuth.verifySessionCookie(sessionCookie, true);
  } catch {
    return null;
  }
}

export async function upsertAuthenticatedUser(decoded: DecodedUser) {
  return prisma.user.upsert({
    where: { firebaseUid: decoded.uid },
    update: {
      email: decoded.email ?? null,
      name: decoded.name ?? null,
      imageUrl: decoded.picture ?? null,
    },
    create: {
      firebaseUid: decoded.uid,
      email: decoded.email ?? null,
      name: decoded.name ?? null,
      imageUrl: decoded.picture ?? null,
    },
  });
}

export async function requireAuthenticatedUser(req: Request) {
  const decoded = await verifySessionRequest(req);
  if (!decoded) return null;

  return upsertAuthenticatedUser({
    uid: decoded.uid,
    email: decoded.email,
    name: decoded.name,
    picture: decoded.picture,
  });
}

export function unauthorizedResponse(message = 'Authentication required') {
  return NextResponse.json({ error: message }, { status: 401 });
}

export function forbiddenResponse(message = 'Forbidden') {
  return NextResponse.json({ error: message }, { status: 403 });
}

/**
 * Authorizes access to a document for either:
 *  - external users presenting a share token (link access + optional password), or
 *  - authenticated workspace members (RBAC role check).
 *
 * `minimumRole` defaults to the role equivalent of `minimumAccess`
 * (VIEW -> VIEWER, COMMENT -> COMMENTER, EDIT -> EDITOR) but can be raised
 * independently, e.g. exports require EDITOR for members while share links
 * only need VIEW-level link access.
 */
export async function authorizeDocumentAccess(
  req: Request,
  documentId: string,
  minimumAccess: AccessType = 'VIEW',
  minimumRole: WorkspaceRole = accessTypeToMinimumRole(minimumAccess)
): Promise<AccessFailure | AccessSuccess> {
  const shareToken = req.headers.get('x-share-token');

  if (shareToken) {
    const shareAccess = await validateShareLinkAccess({
      token: shareToken,
      documentId,
      minimumAccess,
      password: req.headers.get('x-share-password'),
    });

    if (!shareAccess.ok) {
      return {
        ok: false,
        response: NextResponse.json(
          { error: shareAccess.error, code: shareAccess.code },
          { status: shareAccess.status }
        ),
      };
    }

    return { ok: true, actor: 'share' };
  }

  const user = await requireAuthenticatedUser(req);
  if (!user) {
    return { ok: false, response: unauthorizedResponse() };
  }

  const membership = await getWorkspaceRoleForDocument(user.id, documentId);
  if (!membership) {
    return {
      ok: false,
      response: forbiddenResponse('You do not have access to this document'),
    };
  }

  if (!roleAtLeast(membership.role, minimumRole)) {
    return {
      ok: false,
      response: forbiddenResponse('Your role does not allow this action'),
    };
  }

  return { ok: true, actor: 'member', userId: user.id, role: membership.role };
}

type ProjectAccessResult =
  | AccessFailure
  | { ok: true; userId: string; role: WorkspaceRole; workspaceId: string | null };

/** RBAC check for project-scoped routes. */
export async function authorizeProjectAccess(
  req: Request,
  projectId: string,
  permission: WorkspacePermission = 'view'
): Promise<ProjectAccessResult> {
  const user = await requireAuthenticatedUser(req);
  if (!user) return { ok: false, response: unauthorizedResponse() };

  const membership = await getWorkspaceRoleForProject(user.id, projectId);
  if (!membership) {
    return {
      ok: false,
      response: forbiddenResponse('You do not have access to this project'),
    };
  }

  if (!hasPermission(membership.role, permission)) {
    return {
      ok: false,
      response: forbiddenResponse('Your role does not allow this action'),
    };
  }

  return { ok: true, userId: user.id, role: membership.role, workspaceId: membership.workspaceId };
}
