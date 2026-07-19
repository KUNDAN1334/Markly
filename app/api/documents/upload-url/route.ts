import { NextRequest, NextResponse } from 'next/server';
import { requireAuthenticatedUser, unauthorizedResponse } from '@/lib/auth';
import { getUploadSupportMessage, isPdfFile } from '@/lib/document-formats';
import { prisma } from '@/lib/prisma';
import { createUploadUrl, isR2Enabled } from '@/lib/storage';
import { v4 as uuidv4 } from 'uuid';

export const MAX_UPLOAD_SIZE = 50 * 1024 * 1024; // 50MB

/**
 * Issues a short-lived presigned PUT URL so the browser uploads the PDF
 * straight to R2. The file never passes through this function, which is what
 * keeps us under Vercel's 4.5MB request body limit.
 *
 * Only PDFs go down this path — DOCX needs server-side conversion and so still
 * uses the multipart route.
 */
export async function POST(req: NextRequest) {
  try {
    const user = await requireAuthenticatedUser(req);
    if (!user) return unauthorizedResponse();

    if (!isR2Enabled) {
      return NextResponse.json(
        { error: 'Direct upload is not configured on this deployment' },
        { status: 501 }
      );
    }

    const body = await req.json();
    const { projectId, name, size, type } = body as {
      projectId?: string;
      name?: string;
      size?: number;
      type?: string;
    };

    if (!projectId) return NextResponse.json({ error: 'No projectId provided' }, { status: 400 });
    if (!name) return NextResponse.json({ error: 'No file name provided' }, { status: 400 });

    if (!isPdfFile({ name, type })) {
      return NextResponse.json({ error: getUploadSupportMessage() }, { status: 400 });
    }

    if (typeof size === 'number' && size > MAX_UPLOAD_SIZE) {
      return NextResponse.json({ error: 'File too large (max 50MB)' }, { status: 400 });
    }

    // Authorize against the project before handing out a write URL.
    const project = await prisma.project.findFirst({
      where: { id: projectId, ownerId: user.id },
    });
    if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 404 });

    const filename = `${uuidv4()}.pdf`;
    const uploadUrl = await createUploadUrl(filename, 'application/pdf');

    return NextResponse.json({ uploadUrl, filename });
  } catch (error) {
    console.error('POST /api/documents/upload-url error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Could not create upload URL' },
      { status: 500 }
    );
  }
}
