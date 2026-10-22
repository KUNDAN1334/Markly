import { authorizeDocumentAccess } from '@/lib/auth';
import { withStatusEvents } from '@/lib/comment-status';
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const access = await authorizeDocumentAccess(_req, id, 'VIEW');
    if (!access.ok) return access.response;

    const document = await prisma.document.findUnique({
      where: { id },
      include: {
        annotations: { orderBy: { createdAt: "asc" } },
        comments: { orderBy: { createdAt: "desc" }, include: withStatusEvents },
      },
    });

    if (!document) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    return NextResponse.json(document);
  } catch (error) {
    console.error("Error fetching document:", error);
    return NextResponse.json({ error: "Failed to fetch document" }, { status: 500 });
  }
}
