import { NextRequest, NextResponse } from 'next/server';
import { requireAuthenticatedUser, unauthorizedResponse } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { saveFile } from '@/lib/storage';
import { v4 as uuidv4 } from 'uuid';

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuthenticatedUser(req);
    if (!user) return unauthorizedResponse();

    const formData = await req.formData();
    const file = formData.get('file') as File;
    const projectId = formData.get('projectId') as string;

    if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    if (!projectId) return NextResponse.json({ error: 'No projectId provided' }, { status: 400 });

    if (file.type !== 'application/pdf') {
      return NextResponse.json({ error: 'Only PDF files are allowed' }, { status: 400 });
    }

    const MAX_SIZE = 50 * 1024 * 1024; // 50MB
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: 'File too large (max 50MB)' }, { status: 400 });
    }

    const project = await prisma.project.findFirst({ where: { id: projectId, ownerId: user.id } });
    if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 404 });

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const filename = `${uuidv4()}.pdf`;
    const filePath = await saveFile(buffer, filename);

    const document = await prisma.document.create({
      data: {
        filename,
        originalName: file.name,
        mimeType: file.type,
        size: file.size,
        path: filePath,
        isVisible: true,
        projectId,
      },
      include: { annotations: true, comments: true },
    });

    return NextResponse.json(document, { status: 201 });
  } catch (error) {
    console.error('POST /api/documents/upload error:', error);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}
