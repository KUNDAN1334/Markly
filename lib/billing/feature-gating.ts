import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getPlanForWorkspace, plans, type PlanFeatures, type PlanId } from '@/lib/billing/plans';
import { getWorkspaceForDocument, getWorkspaceForProject } from '@/lib/billing/workspace';

const planOrder: PlanId[] = ['free', 'pro', 'team'];

export class PlanLimitError extends Error {
  status: number;
  code: string;

  constructor(message: string, code = 'PLAN_LIMIT_REACHED', status = 402) {
    super(message);
    this.name = 'PlanLimitError';
    this.code = code;
    this.status = status;
  }
}

export function planErrorResponse(error: unknown) {
  if (error instanceof PlanLimitError) {
    return NextResponse.json(
      {
        error: error.message,
        code: error.code,
      },
      { status: error.status }
    );
  }

  return null;
}

export function requirePlan(minPlanId: PlanId, workspace: { currentPlanId: string | null | undefined }) {
  const currentPlan = getPlanForWorkspace(workspace);
  if (planOrder.indexOf(currentPlan.id) < planOrder.indexOf(minPlanId)) {
    throw new PlanLimitError(`This feature requires the ${plans[minPlanId].name} plan or higher.`, 'PLAN_UPGRADE_REQUIRED');
  }
}

export function requireFeature(featureKey: keyof PlanFeatures, workspace: { currentPlanId: string | null | undefined }) {
  const plan = getPlanForWorkspace(workspace);
  if (!plan.features[featureKey]) {
    throw new PlanLimitError(
      `Your workspace is on the ${plan.name} plan. Upgrade to unlock this feature.`,
      'FEATURE_NOT_AVAILABLE'
    );
  }
}

export async function checkWorkspaceLimits(
  workspace: { id: string; currentPlanId: string | null | undefined },
  counts?: {
    activeProjectsCount?: number;
    activeDocumentsCount?: number;
    monthlyNewDocsCount?: number;
    enforceProjectLimit?: boolean;
    enforceDocumentLimit?: boolean;
    enforceMonthlyDocumentLimit?: boolean;
  }
) {
  const plan = getPlanForWorkspace(workspace);
  const enforceProjectLimit = counts?.enforceProjectLimit ?? true;
  const enforceDocumentLimit = counts?.enforceDocumentLimit ?? true;
  const enforceMonthlyDocumentLimit = counts?.enforceMonthlyDocumentLimit ?? true;
  const activeProjectsCount =
    counts?.activeProjectsCount ??
    (await prisma.project.count({
      where: { workspaceId: workspace.id },
    }));
  const activeDocumentsCount =
    counts?.activeDocumentsCount ??
    (await prisma.document.count({
      where: {
        isVisible: true,
        project: { workspaceId: workspace.id },
      },
    }));

  const monthStart = new Date();
  monthStart.setUTCDate(1);
  monthStart.setUTCHours(0, 0, 0, 0);

  const monthlyNewDocsCount =
    counts?.monthlyNewDocsCount ??
    (await prisma.document.count({
      where: {
        project: { workspaceId: workspace.id },
        createdAt: { gte: monthStart },
      },
    }));

  if (
    enforceProjectLimit &&
    Number.isFinite(plan.limits.maxActiveProjects) &&
    activeProjectsCount >= plan.limits.maxActiveProjects
  ) {
    throw new PlanLimitError(
      "You've hit the limit for the Free plan. Upgrade to Pro or Team to add another project."
    );
  }

  if (
    enforceDocumentLimit &&
    Number.isFinite(plan.limits.maxActiveDocuments) &&
    activeDocumentsCount >= plan.limits.maxActiveDocuments
  ) {
    throw new PlanLimitError(
      "You've hit the limit for the Free plan. Upgrade to Pro or Team to add more documents."
    );
  }

  if (
    enforceMonthlyDocumentLimit &&
    Number.isFinite(plan.limits.softMonthlyNewDocumentsLimit) &&
    monthlyNewDocsCount >= plan.limits.softMonthlyNewDocumentsLimit
  ) {
    throw new PlanLimitError(
      plan.id === 'pro'
        ? "You've used your monthly document allowance on Pro. Upgrade to Team to keep adding documents."
        : "You've hit the monthly document limit for the Free plan. Upgrade to Pro or Team to keep going."
    );
  }

  return {
    activeProjectsCount,
    activeDocumentsCount,
    monthlyNewDocsCount,
    plan,
  };
}

export async function requireWorkspaceFeatureForProject(projectId: string, featureKey: keyof PlanFeatures) {
  const workspace = await getWorkspaceForProject(projectId);
  if (!workspace) throw new PlanLimitError('Workspace not found', 'WORKSPACE_NOT_FOUND', 404);
  requireFeature(featureKey, workspace);
  return workspace;
}

export async function requireWorkspaceFeatureForDocument(documentId: string, featureKey: keyof PlanFeatures) {
  const workspace = await getWorkspaceForDocument(documentId);
  if (!workspace) throw new PlanLimitError('Workspace not found', 'WORKSPACE_NOT_FOUND', 404);
  requireFeature(featureKey, workspace);
  return workspace;
}
