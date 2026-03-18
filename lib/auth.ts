import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { firebaseAdminAuth } from '@/lib/firebase-admin';
import { AccessType } from '@/types';
import { validateShareLinkAccess } from '@/lib/share-link-auth';

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
  actor: 'owner' | 'share';
  userId?: string;
};

export function getSessionCookieName() {
  return SESSION_COOKIE_NAME;
}

export function getSessionMaxAgeMs() {
  return SESSION_MAX_AGE_MS;
}

function readCookie(req: Request, name: string) {
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
  const sessionCookie = readCookie(req, SESSION_COOKIE_NAME);
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

export async function authorizeDocumentAccess(
  req: Request,
  documentId: string,
  minimumAccess: AccessType = 'VIEW'
): Promise<AccessFailure | AccessSuccess> {
  const shareToken = req.headers.get('x-share-token');

  if (shareToken) {
    const shareAccess = await validateShareLinkAccess({
      token: shareToken,
      documentId,
      minimumAccess,
    });

    if (!shareAccess.ok) {
      return {
        ok: false,
        response: NextResponse.json(
          { error: shareAccess.error },
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

  const document = await prisma.document.findFirst({
    where: {
      id: documentId,
      project: {
        ownerId: user.id,
      },
    },
    select: { id: true },
  });

  if (!document) {
    return {
      ok: false,
      response: forbiddenResponse('You do not have access to this document'),
    };
  }

  return { ok: true, actor: 'owner', userId: user.id };
}

export async function requireOwnedProject(req: Request, projectId: string) {
  const user = await requireAuthenticatedUser(req);
  if (!user) return null;

  return prisma.project.findFirst({
    where: {
      id: projectId,
      ownerId: user.id,
    },
  });
}
