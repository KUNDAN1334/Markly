import { prisma } from '@/lib/prisma';
import { AccessType } from '@/types';

const ACCESS_RANK: Record<AccessType, number> = {
  VIEW: 1,
  COMMENT: 2,
  EDIT: 3,
};

type ValidationResult =
  | { ok: true }
  | { ok: false; status: number; error: string };

export async function validateShareLinkAccess(params: {
  token: string;
  documentId: string;
  minimumAccess: AccessType;
}): Promise<ValidationResult> {
  const { token, documentId, minimumAccess } = params;

  const shareLink = await prisma.shareLink.findUnique({
    where: { token },
    select: {
      access: true,
      expiresAt: true,
      projectId: true,
      documentId: true,
    },
  });

  if (!shareLink) {
    return { ok: false, status: 404, error: 'Link not found' };
  }

  if (shareLink.expiresAt && new Date(shareLink.expiresAt) < new Date()) {
    return { ok: false, status: 410, error: 'Link expired' };
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
