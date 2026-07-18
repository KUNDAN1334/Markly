import { NextRequest, NextResponse } from 'next/server';
import { authorizeProjectAccess } from '@/lib/auth';
import { checkWorkspaceLimits, planErrorResponse } from '@/lib/billing/feature-gating';
import { getWorkspaceForProject } from '@/lib/billing/workspace';
import { convertDocxToPdfBuffer } from '@/lib/document-conversion';
import { DOCX_MIME_TYPE, getUploadSupportMessage, isDocxFile, isSupportedUpload } from '@/lib/document-formats';
import { prisma } from '@/lib/prisma';
import { saveFile } from '@/lib/storage';
import { v4 as uuidv4 } from 'uuid';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const projectId = formData.get('projectId') as string;

    if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    if (!projectId) return NextResponse.json({ error: 'No projectId provided' }, { status: 400 });

    if (!isSupportedUpload(file)) {
      return NextResponse.json({ error: getUploadSupportMessage() }, { status: 400 });
    }

    const MAX_SIZE = 50 * 1024 * 1024; // 50MB
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: 'File too large (max 50MB)' }, { status: 400 });
    }

    const access = await authorizeProjectAccess(req, projectId, 'uploadDocument');
    if (!access.ok) return access.response;
    const workspace = await getWorkspaceForProject(projectId);
    if (!workspace) return NextResponse.json({ error: 'Workspace not found' }, { status: 404 });
    await checkWorkspaceLimits(workspace, {
      enforceProjectLimit: false,
      enforceDocumentLimit: true,
      enforceMonthlyDocumentLimit: true,
    });

    const bytes = await file.arrayBuffer();
    const uploadBuffer = Buffer.from(bytes);
    const filename = `${uuidv4()}.pdf`;
    const pdfBuffer = isDocxFile(file)
      ? await convertDocxToPdfBuffer(uploadBuffer, file.name)
      : uploadBuffer;
    const filePath = await saveFile(pdfBuffer, filename);

    const document = await prisma.document.create({
      data: {
        filename,
        originalName: file.name,
        mimeType: isDocxFile(file) ? DOCX_MIME_TYPE : file.type,
        size: pdfBuffer.length,
        path: filePath,
        isVisible: true,
        projectId,
        workspaceId: workspace.id,
      },
      include: { annotations: true, comments: true },
    });

    return NextResponse.json(document, { status: 201 });
  } catch (error) {
    const gated = planErrorResponse(error);
    if (gated) return gated;
    console.error('POST /api/documents/upload error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Upload failed' },
      { status: 500 }
    );
  }
}
