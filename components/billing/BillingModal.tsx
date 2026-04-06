'use client';

import { useEffect, useMemo, useState } from 'react';
import { AlertCircle, CheckCircle2, CreditCard, Loader2, Sparkles, X } from 'lucide-react';
import type { PricingPlan, Workspace } from '@/types';

type BillingModalProps = {
  open: boolean;
  onClose: () => void;
  workspace: Workspace | null;
  currentUser: {
    name?: string;
    email?: string;
  };
  onWorkspaceRefresh: () => Promise<void>;
};

function formatPrice(monthlyPriceInPaise: number) {
  const usdAmount = monthlyPriceInPaise === 0 ? 0 : monthlyPriceInPaise / 100 / 83;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(usdAmount);
}

function formatRenewal(date: string | null | undefined) {
  if (!date) return 'No renewal scheduled';
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function featureList(plan: PricingPlan) {
  return [
    plan.features.hasCommentStatus ? 'Resolved comments' : 'Basic comments',
    plan.features.hasDocumentStatus ? 'Approval states' : 'No approval states',
    plan.features.hasEmailNotifications ? 'Email notifications' : 'No email notifications',
    plan.features.hasSlackIntegration ? 'Slack integrations' : 'No Slack integration',
  ];
}

function formatLimit(value: number | null) {
  return value ?? 'Unlimited';
}

function hasFeature(feature: string) {
  return !feature.startsWith('No ');
}

async function ensureRazorpayScript() {
  if (typeof window === 'undefined') return false;
  if (window.Razorpay) return true;

  return new Promise<boolean>((resolve) => {
    const existing = document.querySelector<HTMLScriptElement>('script[data-razorpay-checkout="true"]');
    if (existing) {
      existing.addEventListener('load', () => resolve(true), { once: true });
      existing.addEventListener('error', () => resolve(false), { once: true });
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.dataset.razorpayCheckout = 'true';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export function BillingModal({
  open,
  onClose,
  workspace,
  currentUser,
  onWorkspaceRefresh,
}: BillingModalProps) {
  const [plans, setPlans] = useState<PricingPlan[]>([]);
  const [loadingPlans, setLoadingPlans] = useState(false);
  const [submittingPlanId, setSubmittingPlanId] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ type: 'error' | 'success'; text: string } | null>(null);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    if (!open || typeof document === 'undefined') return;

    const { body, documentElement } = document;
    const previousBodyOverflow = body.style.overflow;
    const previousBodyTouchAction = body.style.touchAction;
    const previousHtmlOverflow = documentElement.style.overflow;

    body.style.overflow = 'hidden';
    body.style.touchAction = 'none';
    documentElement.style.overflow = 'hidden';

    return () => {
      body.style.overflow = previousBodyOverflow;
      body.style.touchAction = previousBodyTouchAction;
      documentElement.style.overflow = previousHtmlOverflow;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;

    let cancelled = false;
    setLoadingPlans(true);
    fetch('/api/pricing/plans')
      .then(async (res) => {
        if (!res.ok) throw new Error('Failed to load pricing');
        return res.json();
      })
      .then((data: PricingPlan[]) => {
        if (!cancelled) setPlans(data);
      })
      .catch((error) => {
        if (!cancelled) {
          setNotice({ type: 'error', text: error instanceof Error ? error.message : 'Failed to load pricing' });
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingPlans(false);
      });

    return () => {
      cancelled = true;
    };
  }, [open]);

  const currentPlanId = workspace?.currentPlanId ?? 'free';
  const paidWorkspace = workspace?.currentPlanId === 'pro' || workspace?.currentPlanId === 'team';

  const summary = useMemo(() => {
    return [
      { label: 'Plan', value: workspace?.currentPlan?.name ?? 'Free', icon: <CreditCard size={13} /> },
      { label: 'Workspace', value: workspace?.name ?? 'Loading...' },
      { label: 'Renewal', value: formatRenewal(workspace?.currentPlanRenewsAt) },
      {
        label: 'Usage',
        value: workspace
          ? `${workspace.usage.activeProjectsCount} project${workspace.usage.activeProjectsCount === 1 ? '' : 's'} / ${workspace.usage.activeDocumentsCount} doc${workspace.usage.activeDocumentsCount === 1 ? '' : 's'}`
          : 'Loading...',
      },
    ];
  }, [workspace]);

  async function handleUpgrade(planId: 'pro' | 'team') {
    if (!workspace) return;

    setNotice(null);
    setSubmittingPlanId(planId);

    try {
      const scriptReady = await ensureRazorpayScript();
      if (!scriptReady || !window.Razorpay) {
        throw new Error('Failed to load Razorpay Checkout.');
      }

      const res = await fetch('/api/billing/create-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspaceId: workspace.id,
          planId,
        }),
      });

      const payload = await res.json().catch(() => ({ error: 'Failed to start subscription' }));
      if (!res.ok) {
        throw new Error(payload.error || 'Failed to start subscription');
      }

      const rzp = new window.Razorpay({
        key: payload.razorpayKeyId,
        subscription_id: payload.subscriptionId,
        name: 'Markly',
        description: `Markly ${payload.planName} Monthly Subscription`,
        prefill: {
          name: currentUser.name || '',
          email: currentUser.email || '',
        },
        theme: { color: '#1E88E5' },
        handler: async () => {
          setNotice({
            type: 'success',
            text: 'Checkout opened successfully. Your workspace will update after Razorpay confirms the subscription.',
          });
          await onWorkspaceRefresh();
        },
      });

      rzp.open();
    } catch (error) {
      setNotice({
        type: 'error',
        text: error instanceof Error ? error.message : 'Failed to start subscription',
      });
    } finally {
      setSubmittingPlanId(null);
    }
  }

  async function handleCancel() {
    if (!workspace) return;

    setNotice(null);
    setCancelling(true);
    try {
      const res = await fetch('/api/billing/cancel-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workspaceId: workspace.id }),
      });

      const payload = await res.json().catch(() => ({ error: 'Failed to cancel subscription' }));
      if (!res.ok) {
        throw new Error(payload.error || 'Failed to cancel subscription');
      }

      setNotice({ type: 'success', text: 'Subscription cancelled. Your workspace has been moved back to Free.' });
      await onWorkspaceRefresh();
    } catch (error) {
      setNotice({
        type: 'error',
        text: error instanceof Error ? error.message : 'Failed to cancel subscription',
      });
    } finally {
      setCancelling(false);
    }
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[300] flex items-center justify-center"
      style={{ background: 'rgba(8, 8, 8, .48)', padding: '18px 20px' }}
    >
      <div
        className="w-full overflow-hidden animate-fade-up"
        style={{
          maxWidth: 1220,
          maxHeight: 'calc(100vh - 36px)',
          margin: '0 auto',
          background: 'var(--bg-card)',
          borderRadius: 22,
          border: '1px solid var(--border)',
          boxShadow: '0 24px 64px rgba(0, 0, 0, .18)',
          display: 'flex',
          flexDirection: 'column',
        }}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex flex-col gap-4 px-5 py-5 sm:px-6 sm:py-5" style={{ borderBottom: '1px solid var(--border)' }}>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 style={{ margin: 0, fontSize: 20, fontWeight: 500, color: 'var(--text)', lineHeight: 1.15 }}>
                Billing & plans
              </h2>
              <p style={{ marginTop: 6, fontSize: 12, color: 'var(--text-2)', maxWidth: 460, lineHeight: 1.45 }}>
                Review usage and upgrade when you need more capacity.
              </p>
            </div>

            <button
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-lg transition-colors"
              style={{ color: 'var(--text-2)', border: '1px solid var(--border)', background: 'transparent', flexShrink: 0 }}
            >
              <X size={14} />
            </button>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {summary.map((item) => (
              <div
                key={item.label}
                style={{
                  background: 'var(--bg-2)',
                  borderRadius: 14,
                  padding: '10px 12px',
                  minHeight: 68,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 5, fontSize: 11, fontWeight: 600, letterSpacing: '.06em', textTransform: 'uppercase', color: 'var(--text-3)' }}>
                  {item.icon}
                  {item.label}
                </div>
                <div style={{ color: 'var(--text)', fontSize: 14, fontWeight: 500, lineHeight: 1.3 }}>
                  {item.value}
                </div>
                {item.label === 'Plan' && workspace?.subscriptionStatus && (
                  <div style={{ marginTop: 3, fontSize: 11, color: 'var(--text-3)', textTransform: 'capitalize' }}>
                    {workspace.subscriptionStatus.replace('_', ' ')}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="px-5 py-5 sm:px-6 sm:py-5" style={{ overflow: 'hidden' }}>
          {notice && (
            <div
              style={{
                marginBottom: 16,
                display: 'flex',
                gap: 10,
                alignItems: 'flex-start',
                fontSize: 12,
                lineHeight: 1.5,
                color: notice.type === 'error' ? '#b91c1c' : '#166534',
                background: notice.type === 'error' ? 'color-mix(in srgb, #b91c1c 8%, var(--bg-card))' : 'color-mix(in srgb, #166534 9%, var(--bg-card))',
                border: `1px solid ${notice.type === 'error' ? 'color-mix(in srgb, #b91c1c 22%, var(--border))' : 'color-mix(in srgb, #166534 22%, var(--border))'}`,
                borderRadius: 14,
                padding: '11px 14px',
              }}
            >
              {notice.type === 'error' ? <AlertCircle size={16} /> : <CheckCircle2 size={16} />}
              <span>{notice.text}</span>
            </div>
          )}

          {loadingPlans ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 220, color: 'var(--text-3)' }}>
              <Loader2 size={18} className="animate-spin" />
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
              {plans.map((plan) => {
                const isCurrent = plan.id === currentPlanId;
                const isUpgrade = plan.id === 'pro' || plan.id === 'team';
                const features = featureList(plan);

                return (
                  <div
                    key={plan.id}
                    style={{
                      borderRadius: 18,
                      border: isCurrent ? '1.5px solid var(--border-strong)' : '1px solid var(--border)',
                      background: isCurrent ? 'color-mix(in srgb, var(--bg-card) 88%, var(--bg-2))' : 'var(--bg-card)',
                      padding: 16,
                      display: 'flex',
                      flexDirection: 'column',
                      minHeight: 0,
                    }}
                  >
                    <div>
                      <div className="flex items-start justify-between gap-3">
                        <div style={{ fontSize: 11, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--text-3)', fontWeight: 600 }}>
                          {plan.name}
                        </div>
                        {isCurrent && (
                          <div
                            style={{
                              fontSize: 10,
                              fontWeight: 700,
                              letterSpacing: '.08em',
                              textTransform: 'uppercase',
                              color: 'var(--text)',
                              background: 'var(--bg-2)',
                              border: '1px solid var(--border)',
                              borderRadius: 999,
                              padding: '4px 8px',
                            }}
                          >
                            Current
                          </div>
                        )}
                      </div>

                      <div style={{ marginTop: 8, display: 'flex', alignItems: 'flex-end', gap: 6 }}>
                        <div style={{ fontSize: 30, color: 'var(--text)', fontWeight: 500, lineHeight: 1 }}>
                          {formatPrice(plan.monthlyPriceInPaise)}
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: 5 }}>
                          per month
                        </div>
                      </div>

                      <p style={{ marginTop: 8, marginBottom: 0, paddingBottom: 12, fontSize: 11, color: 'var(--text-2)', lineHeight: 1.55, borderBottom: '1px solid var(--border)' }}>
                        {plan.description}
                      </p>
                    </div>

                    <div style={{ marginTop: 12, marginBottom: 12 }}>
                      <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '.07em', textTransform: 'uppercase', color: 'var(--text-3)', marginBottom: 8 }}>
                        Limits
                      </div>
                      <div style={{ display: 'grid', gap: 4, color: 'var(--text-2)', fontSize: 11, lineHeight: 1.45 }}>
                        <div>Projects: {formatLimit(plan.limits.maxActiveProjects)}</div>
                        <div>Active docs: {formatLimit(plan.limits.maxActiveDocuments)}</div>
                        <div>Monthly new docs: {formatLimit(plan.limits.softMonthlyNewDocumentsLimit)}</div>
                      </div>
                    </div>

                    <div style={{ display: 'grid', gap: 6, marginBottom: 14 }}>
                      {features.map((feature) => (
                        <div
                          key={feature}
                          style={{
                            display: 'flex',
                            gap: 8,
                            fontSize: 11,
                            color: hasFeature(feature) ? 'var(--text-2)' : 'var(--text-3)',
                            lineHeight: 1.4,
                          }}
                        >
                          <CheckCircle2
                            size={14}
                            style={{
                              color: hasFeature(feature) ? 'var(--text-2)' : 'var(--text-3)',
                              opacity: hasFeature(feature) ? 1 : 0.5,
                              flexShrink: 0,
                              marginTop: 1,
                            }}
                          />
                          <span>{feature}</span>
                        </div>
                      ))}
                    </div>

                    <div style={{ marginTop: 'auto', display: 'grid', gap: 8 }}>
                      {isCurrent ? (
                        <button
                          disabled
                          style={{
                            width: '100%',
                            borderRadius: 10,
                            border: '1px solid var(--border)',
                            background: 'transparent',
                            color: 'var(--text-2)',
                            padding: '9px 12px',
                            fontSize: 12,
                          }}
                        >
                          Current plan
                        </button>
                      ) : isUpgrade ? (
                        <button
                          onClick={() => handleUpgrade(plan.id)}
                          disabled={submittingPlanId !== null}
                          style={{
                            width: '100%',
                            borderRadius: 10,
                            border: 'none',
                            background: 'var(--text)',
                            color: 'var(--bg-card)',
                            padding: '9px 12px',
                            fontSize: 12,
                            fontWeight: 500,
                            cursor: submittingPlanId !== null ? 'default' : 'pointer',
                            opacity: submittingPlanId !== null ? 0.7 : 1,
                          }}
                        >
                          {submittingPlanId === plan.id ? 'Opening checkout...' : `Upgrade to ${plan.name}`}
                        </button>
                      ) : (
                        <button
                          disabled
                          style={{
                            width: '100%',
                            borderRadius: 10,
                            border: '1px solid var(--border)',
                            background: 'transparent',
                            color: 'var(--text-3)',
                            padding: '9px 12px',
                            fontSize: 12,
                          }}
                        >
                          Included by default
                        </button>
                      )}

                      {isCurrent && paidWorkspace && (
                        <button
                          onClick={handleCancel}
                          disabled={cancelling}
                          style={{
                            width: '100%',
                            background: 'transparent',
                            color: '#b91c1c',
                            border: '1px solid color-mix(in srgb, #b91c1c 20%, var(--border))',
                            borderRadius: 10,
                            padding: '9px 12px',
                            fontSize: 12,
                            cursor: cancelling ? 'default' : 'pointer',
                            opacity: cancelling ? 0.6 : 1,
                          }}
                        >
                          {cancelling ? 'Cancelling...' : 'Cancel subscription'}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
