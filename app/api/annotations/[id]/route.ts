import { NextRequest, NextResponse } from 'next/server';
import { authorizeDocumentAccess } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const existingAnnotation = await prisma.annotation.findUnique({
      where: { id },
      select: { documentId: true },
    });

    if (!existingAnnotation) {
      return NextResponse.json({ error: 'Annotation not found' }, { status: 404 });
    }

    const access = await authorizeDocumentAccess(req, existingAnnotation.documentId, 'EDIT');
    if (!access.ok) return access.response;

    const annotation = await prisma.annotation.update({
      where: { id },
      data: body,
    });
    return NextResponse.json(annotation);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update annotation' }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const existingAnnotation = await prisma.annotation.findUnique({
      where: { id },
      select: { documentId: true },
    });

    if (!existingAnnotation) {
      return NextResponse.json({ error: 'Annotation not found' }, { status: 404 });
    }

    const access = await authorizeDocumentAccess(_req, existingAnnotation.documentId, 'EDIT');
    if (!access.ok) return access.response;

    await prisma.annotation.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete annotation' }, { status: 500 });
  }
}
