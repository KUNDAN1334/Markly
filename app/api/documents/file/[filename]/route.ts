import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs/promises';
import { authorizeDocumentAccess } from '@/lib/auth';

const STORAGE_BASE = process.env.STORAGE_PATH || './storage/documents';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  try {
    const { filename } = await params;
    const { searchParams } = new URL(_req.url);
    const documentId = searchParams.get('documentId');
    const token = searchParams.get('token');

    if (!documentId) {
      return NextResponse.json({ error: 'documentId required' }, { status: 400 });
    }

    const headers = new Headers(_req.headers);
    if (token) {
      headers.set('x-share-token', token);
    }
    const password = searchParams.get('password');
    if (password) {
      headers.set('x-share-password', password);
    }

    const access = await authorizeDocumentAccess(
      new Request(_req.url, { headers }),
      documentId,
      'VIEW'
    );
    if (!access.ok) return access.response;

    const safe = path.basename(filename);
    const filePath = path.join(STORAGE_BASE, safe);
    const buffer = await fs.readFile(filePath);

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="${safe}"`,
        'Cache-Control': 'public, max-age=31536000',
      },
    });
  } catch {
    return NextResponse.json({ error: 'File not found' }, { status: 404 });
  }
}
