export const PLAN_IDS = ['free', 'pro', 'team'] as const;

export type PlanId = (typeof PLAN_IDS)[number];
export type SubscriptionStatus =
  | 'none'
  | 'pending'
  | 'trialing'
  | 'active'
  | 'past_due'
  | 'cancelled'
  | 'paused';

export type PlanFeatures = {
  canAnnotate: boolean;
  canComment: boolean;
  hasCommentStatus: boolean;
  hasDocumentStatus: boolean;
  hasEmailNotifications: boolean;
  hasSlackIntegration: boolean;
  hasBranding: boolean;
  hasTeamOnlyComments: boolean;
  hasPasswordProtectedLinks: boolean;
  hasAnalytics: boolean;
};

export type PlanLimits = {
  maxActiveProjects: number;
  maxActiveDocuments: number;
  softMonthlyNewDocumentsLimit: number;
};

export type PlanDefinition = {
  id: PlanId;
  name: string;
  description: string;
  monthlyPriceInPaise: number;
  razorpayPlanId: string | null;
  limits: PlanLimits;
  features: PlanFeatures;
};

export const plans: Record<PlanId, PlanDefinition> = {
  free: {
    id: 'free',
    name: 'Free',
    description: 'For solo reviewers getting started with a lightweight workspace.',
    monthlyPriceInPaise: 0,
    razorpayPlanId: null,
    limits: {
      maxActiveProjects: 1,
      maxActiveDocuments: 5,
      softMonthlyNewDocumentsLimit: 5,
    },
    features: {
      canAnnotate: true,
      canComment: true,
      hasCommentStatus: false,
      hasDocumentStatus: false,
      hasEmailNotifications: false,
      hasSlackIntegration: false,
      hasBranding: false,
      hasTeamOnlyComments: false,
      hasPasswordProtectedLinks: false,
      hasAnalytics: false,
    },
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    description: 'For active client work with richer review workflows and email notifications.',
    monthlyPriceInPaise: 99900,
    razorpayPlanId: process.env.RAZORPAY_PRO_PLAN_ID ?? null,
    limits: {
      maxActiveProjects: Number.POSITIVE_INFINITY,
      maxActiveDocuments: Number.POSITIVE_INFINITY,
      softMonthlyNewDocumentsLimit: 50,
    },
    features: {
      canAnnotate: true,
      canComment: true,
      hasCommentStatus: true,
      hasDocumentStatus: true,
      hasEmailNotifications: true,
      hasSlackIntegration: false,
      hasBranding: false,
      hasTeamOnlyComments: false,
      hasPasswordProtectedLinks: false,
      hasAnalytics: false,
    },
  },
  team: {
    id: 'team',
    name: 'Team',
    description: 'For growing teams that need branded reviews, analytics, and advanced controls.',
    monthlyPriceInPaise: 299900,
    razorpayPlanId: process.env.RAZORPAY_TEAM_PLAN_ID ?? null,
    limits: {
      maxActiveProjects: Number.POSITIVE_INFINITY,
      maxActiveDocuments: Number.POSITIVE_INFINITY,
      softMonthlyNewDocumentsLimit: Number.POSITIVE_INFINITY,
    },
    features: {
      canAnnotate: true,
      canComment: true,
      hasCommentStatus: true,
      hasDocumentStatus: true,
      hasEmailNotifications: true,
      hasSlackIntegration: true,
      hasBranding: true,
      hasTeamOnlyComments: true,
      hasPasswordProtectedLinks: true,
      hasAnalytics: true,
    },
  },
};

export function getPlan(planId: PlanId | string | null | undefined) {
  if (!planId || !(planId in plans)) return plans.free;
  return plans[planId as PlanId];
}

export function getPlanForWorkspace(workspace: { currentPlanId?: string | null }) {
  return getPlan(workspace.currentPlanId);
}

export function serializePlan(plan: PlanDefinition) {
  return {
    ...plan,
    limits: {
      maxActiveProjects: Number.isFinite(plan.limits.maxActiveProjects) ? plan.limits.maxActiveProjects : null,
      maxActiveDocuments: Number.isFinite(plan.limits.maxActiveDocuments) ? plan.limits.maxActiveDocuments : null,
      softMonthlyNewDocumentsLimit: Number.isFinite(plan.limits.softMonthlyNewDocumentsLimit)
        ? plan.limits.softMonthlyNewDocumentsLimit
        : null,
    },
  };
}

export function isPaidPlan(planId: PlanId) {
  return planId === 'pro' || planId === 'team';
}

