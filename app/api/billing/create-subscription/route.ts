import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAuthenticatedUser, unauthorizedResponse } from '@/lib/auth';
import { billingErrorResponse } from '@/lib/billing/billing-api';
import {
  createRazorpayCustomer,
  createWorkspaceSubscription,
  getPublicBillingConfig,
} from '@/lib/billing/billing-service';
import { getPlan } from '@/lib/billing/plans';
import { getWorkspaceByIdForUser } from '@/lib/billing/workspace';
import { prisma } from '@/lib/prisma';

const schema = z.object({
  workspaceId: z.string().min(1),
  planId: z.enum(['pro', 'team']),
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

    const plan = getPlan(body.planId);
    let razorpayCustomerId = workspace.razorpayCustomerId;

    if (!razorpayCustomerId) {
      const customer = await createRazorpayCustomer({
        workspaceId: workspace.id,
        name: user.name,
        email: user.email,
      });

      razorpayCustomerId = customer.id;

      await prisma.workspace.update({
        where: { id: workspace.id },
        data: {
          razorpayCustomerId,
        },
      });
    }

    const subscription = await createWorkspaceSubscription({
      workspaceId: workspace.id,
      planId: body.planId,
      razorpayCustomerId,
    });

    await prisma.workspace.update({
      where: { id: workspace.id },
      data: {
        razorpaySubscriptionId: subscription.id,
        subscriptionStatus: subscription.status === 'active' ? 'active' : 'pending',
      },
    });

    return NextResponse.json({
      subscriptionId: subscription.id,
      workspaceId: workspace.id,
      planId: plan.id,
      planName: plan.name,
      currency: 'INR',
      amountInPaise: plan.monthlyPriceInPaise,
      ...getPublicBillingConfig(),
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return billingErrorResponse(error, 'Failed to create subscription');
  }
}

