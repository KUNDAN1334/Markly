import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import { authorizeDocumentAccess } from '@/lib/auth';
import { readStoredFile } from '@/lib/storage';

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

    const access = await authorizeDocumentAccess(
      new Request(_req.url, { headers }),
      documentId,
      'VIEW'
    );
    if (!access.ok) return access.response;

    const safe = path.basename(filename);
    const buffer = await readStoredFile(safe);

    // Node's Buffer isn't a valid BodyInit under current @types/node; the
    // underlying bytes are, so hand the Response a plain Uint8Array view.
    return new NextResponse(new Uint8Array(buffer), {
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
