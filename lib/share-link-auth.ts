import { createHash } from 'crypto';
import { prisma } from '@/lib/prisma';
import { AccessType } from '@/types';

const ACCESS_RANK: Record<AccessType, number> = {
  VIEW: 1,
  COMMENT: 2,
  EDIT: 3,
};

type ValidationResult =
  | { ok: true }
  | { ok: false; status: number; error: string; code?: string };

export function hashSharePassword(password: string): string {
  return createHash('sha256').update(password).digest('hex');
}

export async function validateShareLinkAccess(params: {
  token: string;
  documentId: string;
  minimumAccess: AccessType;
  password?: string | null;
}): Promise<ValidationResult> {
  const { token, documentId, minimumAccess, password } = params;

  const shareLink = await prisma.shareLink.findUnique({
    where: { token },
    select: {
      access: true,
      expiresAt: true,
      projectId: true,
      documentId: true,
      passwordHash: true,
    },
  });

  if (!shareLink) {
    return { ok: false, status: 404, error: 'Link not found' };
  }

  if (shareLink.expiresAt && new Date(shareLink.expiresAt) < new Date()) {
    return { ok: false, status: 410, error: 'Link expired' };
  }

  if (shareLink.passwordHash) {
    if (!password || hashSharePassword(password) !== shareLink.passwordHash) {
      return {
        ok: false,
        status: 401,
        error: 'This link is password protected',
        code: 'SHARE_PASSWORD_REQUIRED',
      };
    }
  }

  if (ACCESS_RANK[shareLink.access as AccessType] < ACCESS_RANK[minimumAccess]) {
    return { ok: false, status: 403, error: 'Insufficient link access' };
  }

  if (shareLink.documentId) {
    if (shareLink.documentId !== documentId) {
      return { ok: false, status: 403, error: 'Link does not grant access to this document' };
    }

    return { ok: true };
  }

  const document = await prisma.document.findUnique({
    where: { id: documentId },
    select: { projectId: true },
  });

  if (!document || document.projectId !== shareLink.projectId) {
    return { ok: false, status: 403, error: 'Link does not grant access to this document' };
  }

  return { ok: true };
}
