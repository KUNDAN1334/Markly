import crypto from 'node:crypto';
import { prisma } from '@/lib/prisma';
import { getPlan, plans, type PlanId, type SubscriptionStatus } from '@/lib/billing/plans';
import { getRazorpayClient } from '@/lib/billing/razorpay-client';
import { getWorkspaceBySubscriptionId } from '@/lib/billing/workspace';

type RazorpaySubscriptionPayload = {
  id: string;
  status?: string;
  plan_id?: string;
  current_start?: number;
  current_end?: number;
  notes?: Record<string, string>;
};

type RazorpayWebhookPayload = {
  event: string;
  payload?: {
    subscription?: { entity?: RazorpaySubscriptionPayload };
    payment?: {
      entity?: {
        id?: string;
        status?: string;
        notes?: Record<string, string>;
        subscription_id?: string;
      };
    };
  };
  account_id?: string;
};

export async function createRazorpayCustomer(input: {
  workspaceId: string;
  name: string | null | undefined;
  email: string | null | undefined;
}) {
  const razorpay = await getRazorpayClient();
  const customer = await razorpay.customers.create({
    name: input.name ?? 'Markly Workspace',
    email: input.email ?? undefined,
    notes: {
      workspaceId: input.workspaceId,
    },
  });

  return customer;
}

export async function createWorkspaceSubscription(input: {
  workspaceId: string;
  planId: Exclude<PlanId, 'free'>;
  razorpayCustomerId: string;
}) {
  const plan = getPlan(input.planId);
  if (!plan.razorpayPlanId) {
    throw new Error(`Missing Razorpay plan id for ${plan.id}. Set the matching env var first.`);
  }

  const razorpay = await getRazorpayClient();
  const subscription = await razorpay.subscriptions.create({
    plan_id: plan.razorpayPlanId,
    customer_notify: 1,
    quantity: 1,
    total_count: 1200,
    notes: {
      workspaceId: input.workspaceId,
      internalPlanId: plan.id,
      razorpayCustomerId: input.razorpayCustomerId,
    },
  });

  return subscription;
}

export async function cancelWorkspaceSubscription(razorpaySubscriptionId: string) {
  const razorpay = await getRazorpayClient();
  return razorpay.subscriptions.cancel(razorpaySubscriptionId, {
    cancel_at_cycle_end: 0,
  });
}

export function verifyRazorpayWebhookSignature(rawBody: string, signature: string | null) {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret) throw new Error('Missing RAZORPAY_WEBHOOK_SECRET');
  if (!signature) return false;

  const digest = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
  return crypto.timingSafeEqual(Buffer.from(digest), Buffer.from(signature));
}

function mapSubscriptionStatus(status?: string): SubscriptionStatus {
  switch (status) {
    case 'created':
    case 'authenticated':
    case 'pending':
      return 'pending';
    case 'active':
      return 'active';
    case 'halted':
      return 'past_due';
    case 'paused':
      return 'paused';
    case 'completed':
    case 'cancelled':
      return 'cancelled';
    default:
      return 'none';
  }
}

function unixToDate(value?: number) {
  return typeof value === 'number' ? new Date(value * 1000) : null;
}

export async function handleRazorpayWebhook(payload: RazorpayWebhookPayload, eventId?: string | null) {
  const subscriptionEntity = payload.payload?.subscription?.entity;
  const paymentEntity = payload.payload?.payment?.entity;
  const subscriptionId = subscriptionEntity?.id ?? paymentEntity?.subscription_id;

  if (eventId) {
    const existingEvent = await prisma.billingWebhookEvent.findUnique({
      where: { razorpayEventId: eventId },
    });

    if (existingEvent) {
      return;
    }
  }

  let workspace = subscriptionId ? await getWorkspaceBySubscriptionId(subscriptionId) : null;

  if (!workspace && subscriptionEntity?.notes?.workspaceId) {
    workspace = await prisma.workspace.findUnique({
      where: { id: subscriptionEntity.notes.workspaceId },
    });
  }

  await prisma.billingWebhookEvent.create({
    data: {
      workspaceId: workspace?.id ?? null,
      razorpayEventId: eventId ?? null,
      razorpayEntityId: subscriptionId ?? paymentEntity?.id ?? null,
      event: payload.event,
      payload: payload as unknown as object,
    },
  });

  if (!workspace) {
    console.warn('Razorpay webhook received with no matching workspace', payload.event, subscriptionId);
    return;
  }

  switch (payload.event) {
    case 'subscription.activated': {
      const nextPlanId = (subscriptionEntity?.notes?.internalPlanId as PlanId | undefined) ?? 'free';
      await prisma.workspace.update({
        where: { id: workspace.id },
        data: {
          currentPlanId: getPlan(nextPlanId).id,
          subscriptionStatus: 'active',
          currentPlanStartedAt: unixToDate(subscriptionEntity?.current_start),
          currentPlanRenewsAt: unixToDate(subscriptionEntity?.current_end),
        },
      });
      break;
    }
    case 'subscription.charged': {
      await prisma.workspace.update({
        where: { id: workspace.id },
        data: {
          subscriptionStatus: 'active',
          currentPlanRenewsAt: unixToDate(subscriptionEntity?.current_end) ?? workspace.currentPlanRenewsAt,
        },
      });
      break;
    }
    case 'subscription.pending': {
      await prisma.workspace.update({
        where: { id: workspace.id },
        data: {
          subscriptionStatus: 'pending',
        },
      });
      break;
    }
    case 'subscription.paused': {
      await prisma.workspace.update({
        where: { id: workspace.id },
        data: {
          subscriptionStatus: 'paused',
        },
      });
      break;
    }
    case 'subscription.cancelled':
    case 'subscription.completed': {
      await prisma.workspace.update({
        where: { id: workspace.id },
        data: {
          currentPlanId: 'free',
          subscriptionStatus: 'cancelled',
          currentPlanStartedAt: null,
          currentPlanRenewsAt: null,
        },
      });
      break;
    }
    case 'payment.failed': {
      await prisma.workspace.update({
        where: { id: workspace.id },
        data: {
          subscriptionStatus: 'past_due',
        },
      });
      break;
    }
    default: {
      if (subscriptionEntity?.status) {
        await prisma.workspace.update({
          where: { id: workspace.id },
          data: {
            subscriptionStatus: mapSubscriptionStatus(subscriptionEntity.status),
            currentPlanRenewsAt: unixToDate(subscriptionEntity.current_end) ?? workspace.currentPlanRenewsAt,
          },
        });
      }
    }
  }
}

export function getPublicBillingConfig() {
  if (!process.env.RAZORPAY_KEY_ID) {
    throw new Error('Missing RAZORPAY_KEY_ID');
  }

  return {
    razorpayKeyId: process.env.RAZORPAY_KEY_ID,
  };
}

export function getPricingCatalog() {
  return [plans.free, plans.pro, plans.team];
}
