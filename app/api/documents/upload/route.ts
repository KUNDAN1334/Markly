import { NextRequest, NextResponse } from 'next/server';
import { requireAuthenticatedUser, unauthorizedResponse } from '@/lib/auth';
import {
  convertDocxToPdfBuffer,
  DOCX_DISABLED_MESSAGE,
  isDocxConversionEnabled,
} from '@/lib/document-conversion';
import {
  DOCX_MIME_TYPE,
  PDF_MIME_TYPE,
  getUploadSupportMessage,
  isDocxFile,
  isSupportedUpload,
} from '@/lib/document-formats';
import { prisma } from '@/lib/prisma';
import { fileExists, getStoragePath, getStoredFileSize, saveFile } from '@/lib/storage';
import { v4 as uuidv4 } from 'uuid';

const MAX_SIZE = 50 * 1024 * 1024; // 50MB

const documentInclude = { annotations: true, comments: true } as const;

/**
 * Two upload paths land here:
 *
 *  1. JSON  { projectId, filename, originalName } — the file is already in R2,
 *     uploaded directly by the browser via a presigned URL. We only verify and
 *     record it. This is the path for PDFs, and it keeps large files off the
 *     serverless function entirely.
 *
 *  2. multipart/form-data — legacy/local path, also the only way to handle DOCX
 *     since that needs server-side LibreOffice conversion before storage.
 */
export async function POST(req: NextRequest) {
  try {
    const user = await requireAuthenticatedUser(req);
    if (!user) return unauthorizedResponse();

    const contentType = req.headers.get('content-type') || '';

    return contentType.includes('application/json')
      ? await handleDirectUpload(req, user.id)
      : await handleMultipartUpload(req, user.id);
  } catch (error) {
    console.error('POST /api/documents/upload error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Upload failed' },
      { status: 500 }
    );
  }
}

/** Records a document whose bytes are already in object storage. */
async function handleDirectUpload(req: NextRequest, userId: string) {
  const { projectId, filename, originalName } = (await req.json()) as {
    projectId?: string;
    filename?: string;
    originalName?: string;
  };

  if (!projectId) return NextResponse.json({ error: 'No projectId provided' }, { status: 400 });
  if (!filename) return NextResponse.json({ error: 'No filename provided' }, { status: 400 });

  const project = await prisma.project.findFirst({ where: { id: projectId, ownerId: userId } });
  if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 404 });

  // Never trust the client that the upload succeeded — confirm the object exists.
  if (!(await fileExists(filename))) {
    return NextResponse.json({ error: 'Upload not found in storage' }, { status: 400 });
  }

  const size = (await getStoredFileSize(filename)) ?? 0;
  if (size > MAX_SIZE) {
    return NextResponse.json({ error: 'File too large (max 50MB)' }, { status: 400 });
  }

  const document = await prisma.document.create({
    data: {
      filename,
      originalName: originalName || filename,
      mimeType: PDF_MIME_TYPE,
      size,
      path: getStoragePath(filename),
      isVisible: true,
      projectId,
    },
    include: documentInclude,
  });

  return NextResponse.json(document, { status: 201 });
}

/** Streams the file through this function. Required for DOCX conversion. */
async function handleMultipartUpload(req: NextRequest, userId: string) {
  const formData = await req.formData();
  const file = formData.get('file') as File;
  const projectId = formData.get('projectId') as string;

  if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 });
  if (!projectId) return NextResponse.json({ error: 'No projectId provided' }, { status: 400 });

  if (!isSupportedUpload(file)) {
    return NextResponse.json({ error: getUploadSupportMessage() }, { status: 400 });
  }

  const isDocx = isDocxFile(file);
  if (isDocx && !isDocxConversionEnabled) {
    return NextResponse.json({ error: DOCX_DISABLED_MESSAGE }, { status: 501 });
  }

  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: 'File too large (max 50MB)' }, { status: 400 });
  }

  const project = await prisma.project.findFirst({ where: { id: projectId, ownerId: userId } });
  if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 404 });

  const bytes = await file.arrayBuffer();
  const uploadBuffer = Buffer.from(bytes);
  const filename = `${uuidv4()}.pdf`;
  const pdfBuffer = isDocx ? await convertDocxToPdfBuffer(uploadBuffer, file.name) : uploadBuffer;
  const storedPath = await saveFile(pdfBuffer, filename);

  const document = await prisma.document.create({
    data: {
      filename,
      originalName: file.name,
      mimeType: isDocx ? DOCX_MIME_TYPE : file.type,
      size: pdfBuffer.length,
      path: storedPath,
      isVisible: true,
      projectId,
    },
    include: documentInclude,
  });

  return NextResponse.json(document, { status: 201 });
}
