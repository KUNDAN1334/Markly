import { authorizeDocumentAccess } from '@/lib/auth';
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
        comments: {
          // Share-link users never receive internal (team-only) comments.
          ...(access.actor === 'share' ? { where: { isInternal: false } } : {}),
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!document) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    return NextResponse.json({
      ...document,
      // Lets the editor UI apply soft (role-based) gating.
      myRole: access.actor === 'member' ? access.role : null,
    });
  } catch (error) {
    console.error("Error fetching document:", error);
    return NextResponse.json({ error: "Failed to fetch document" }, { status: 500 });
  }
}
