import { NextRequest, NextResponse } from 'next/server';
import { createDocumentBranch } from '@/lib/document-branch';
import {
  authorizeDocumentAccess,
  authorizeProjectAccess,
  forbiddenResponse,
  requireAuthenticatedUser,
  unauthorizedResponse,
} from '@/lib/auth';
import { getWorkspaceRoleForDocument, hasPermission } from '@/lib/rbac';
import { hashSharePassword } from '@/lib/share-link-auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { generateToken } from '@/lib/utils';

const shareLinkSchema = z.object({
  documentId: z.string(),
  access: z.enum(['VIEW', 'COMMENT', 'EDIT']).default('VIEW'),
  expiresAt: z.string().optional(),
  password: z.string().min(1).max(100).optional(),
});

// Never leak the password hash to clients.
function sanitizeLink<T extends { passwordHash?: string | null }>(link: T) {
  const { passwordHash, ...rest } = link;
  return { ...rest, hasPassword: Boolean(passwordHash) };
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get('token');

  if (token) {
    const password = searchParams.get('password') || req.headers.get('x-share-password');

    const shareLink = await prisma.shareLink.findUnique({
      where: { token },
      include: {
        document: {
          include: {
            annotations: { orderBy: { createdAt: 'asc' } },
            // Public viewers never see internal (team-only) comments.
            comments: { where: { isInternal: false }, orderBy: { createdAt: 'desc' } },
          },
        },
        project: {
          include: {
            documents: {
              include: {
                annotations: { orderBy: { createdAt: 'asc' } },
                comments: { where: { isInternal: false }, orderBy: { createdAt: 'desc' } },
              },
            },
          },
        },
      },
    });

    if (!shareLink) return NextResponse.json({ error: 'Link not found' }, { status: 404 });

    if (shareLink.expiresAt && new Date(shareLink.expiresAt) < new Date()) {
      return NextResponse.json({ error: 'Link expired' }, { status: 410 });
    }

    if (shareLink.passwordHash) {
      if (!password || hashSharePassword(password) !== shareLink.passwordHash) {
        // Only expose that a password is needed — no document payload.
        return NextResponse.json(
          { error: 'This link is password protected', code: 'SHARE_PASSWORD_REQUIRED' },
          { status: 401 }
        );
      }
    }

    return NextResponse.json(sanitizeLink(shareLink));
  }

  const documentId = searchParams.get('documentId');
  if (documentId) {
    const user = await requireAuthenticatedUser(req);
    if (!user) return unauthorizedResponse();

    const membership = await getWorkspaceRoleForDocument(user.id, documentId);
    if (!membership || !hasPermission(membership.role, 'manageShareLinks')) {
      return forbiddenResponse('You do not have access to share links for this document');
    }

    const sourceDocument = await prisma.document.findUnique({
      where: { id: documentId },
      select: { id: true, path: true, originalName: true, projectId: true },
    });

    if (!sourceDocument) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    const links = await prisma.shareLink.findMany({
      where: {
        projectId: sourceDocument.projectId,
        OR: [
          { documentId: sourceDocument.id },
          {
            access: 'EDIT',
            document: {
              is: {
                isVisible: false,
                path: sourceDocument.path,
                originalName: sourceDocument.originalName,
                projectId: sourceDocument.projectId,
              },
            },
          },
        ],
      },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(links.map(sanitizeLink));
  }

  const projectId = searchParams.get('projectId');
  if (!projectId) return NextResponse.json({ error: 'projectId required' }, { status: 400 });

  const access = await authorizeProjectAccess(req, projectId, 'manageShareLinks');
  if (!access.ok) return access.response;

  const links = await prisma.shareLink.findMany({
    where: { projectId },
    orderBy: { createdAt: 'desc' },
  });
  return NextResponse.json(links.map(sanitizeLink));
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { documentId, access, expiresAt, password } = shareLinkSchema.parse(body);
    // Share-link holders can re-share at VIEW level; members need EDITOR.
    const docAccess = await authorizeDocumentAccess(req, documentId, 'VIEW', 'EDITOR');
    if (!docAccess.ok) return docAccess.response;

    const sourceDocument = await prisma.document.findUnique({
      where: { id: documentId },
      select: { id: true, projectId: true, workspaceId: true },
    });

    if (!sourceDocument) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    const targetDocument =
      access === 'EDIT'
        ? await createDocumentBranch(sourceDocument.id)
        : sourceDocument;

    const shareLink = await prisma.shareLink.create({
      data: {
        token: generateToken(),
        projectId: targetDocument.projectId,
        documentId: targetDocument.id,
        workspaceId: sourceDocument.workspaceId,
        createdByUserId: docAccess.actor === 'member' ? docAccess.userId ?? null : null,
        access,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        passwordHash: password ? hashSharePassword(password) : null,
      },
    });

    return NextResponse.json(sanitizeLink(shareLink), { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to create share link' }, { status: 500 });
  }
}
