import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAuthenticatedUser, unauthorizedResponse } from '@/lib/auth';
import { billingErrorResponse } from '@/lib/billing/billing-api';
import { cancelWorkspaceSubscription } from '@/lib/billing/billing-service';
import { getWorkspaceByIdForUser } from '@/lib/billing/workspace';
import { prisma } from '@/lib/prisma';

const schema = z.object({
  workspaceId: z.string().min(1),
});

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuthenticatedUser(req);
    if (!user) return unauthorizedResponse();

    const body = schema.parse(await req.json());
    const workspace = await getWorkspaceByIdForUser(body.workspaceId, user.id);

    if (!workspace) {
      return NextResponse.json({ error: 'Workspace not found' }, { status: 404 });
    }

    if (workspace.razorpaySubscriptionId) {
      await cancelWorkspaceSubscription(workspace.razorpaySubscriptionId);
    }

    await prisma.workspace.update({
      where: { id: workspace.id },
      data: {
        currentPlanId: 'free',
        subscriptionStatus: 'cancelled',
        currentPlanStartedAt: null,
        currentPlanRenewsAt: null,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return billingErrorResponse(error, 'Failed to cancel subscription');
  }
}

