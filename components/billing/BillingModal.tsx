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
          ? `${workspace.usage.activeProjectsCount} project${workspace.usage.activeProjectsCount === 1 ? '' : 's'} • ${workspace.usage.activeDocumentsCount} doc${workspace.usage.activeDocumentsCount === 1 ? '' : 's'}`
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
      style={{ background: 'rgba(8, 8, 8, .56)', padding: '34px 20px' }}
    >
      <div
        className="w-full rounded-[26px] overflow-hidden animate-fade-up"
        style={{
          maxWidth: 1380,
          maxHeight: 'calc(100vh - 68px)',
          background: 'linear-gradient(180deg, color-mix(in srgb, var(--bg-card) 96%, white 4%), var(--bg-card))',
          boxShadow: '0 30px 80px rgba(0,0,0,.18)',
          border: '1px solid var(--border)',
        }}
      >
        <div
          className="flex items-start justify-between gap-6 px-7 py-4"
          style={{ borderBottom: '1px solid var(--border)', background: 'color-mix(in srgb, var(--bg-card) 90%, var(--bg) 10%)' }}
        >
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: 6, fontSize: 11, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--text-3)' }}>
              <Sparkles size={12} />
              Billing
            </div>
            <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 24, letterSpacing: '-.03em', color: 'var(--text)', lineHeight: 1 }}>
              Billing & Plans
            </h2>
            <p style={{ marginTop: 8, fontSize: 12, color: 'var(--text-2)', maxWidth: 460, lineHeight: 1.55 }}>
              Review usage and upgrade when you need more capacity.
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-11 h-11 flex items-center justify-center rounded-xl transition-all"
            style={{ color: 'var(--text-3)', border: '1px solid var(--border)', background: 'var(--bg-2)' }}
          >
            <X size={17} />
          </button>
        </div>

        <div style={{ padding: 14 }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
              gap: 10,
              marginBottom: 12,
            }}
          >
            {summary.map((item) => (
              <div
                key={item.label}
                style={{
                  borderRadius: 16,
                  border: '1px solid var(--border)',
                  background: 'var(--bg-card)',
                  padding: '12px 14px',
                  boxShadow: 'var(--shadow-sm)',
                  minHeight: 78,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 6, fontSize: 11, fontWeight: 700, letterSpacing: '.07em', textTransform: 'uppercase', color: 'var(--text-3)' }}>
                  {item.icon}
                  {item.label}
                </div>
                <div style={{ color: 'var(--text)', fontSize: 15, lineHeight: 1.3, fontFamily: item.label === 'Plan' ? "'DM Serif Display', serif" : "'Instrument Sans', sans-serif" }}>
                  {item.value}
                </div>
                {item.label === 'Plan' && workspace?.subscriptionStatus && (
                  <div style={{ marginTop: 4, fontSize: 11, color: 'var(--text-3)', textTransform: 'capitalize' }}>
                    {workspace.subscriptionStatus.replace('_', ' ')}
                  </div>
                )}
              </div>
            ))}
          </div>

          {notice && (
            <div
              style={{
                marginBottom: 12,
                display: 'flex',
                gap: 10,
                alignItems: 'flex-start',
                fontSize: 12,
                lineHeight: 1.5,
                color: notice.type === 'error' ? '#b91c1c' : '#166534',
                background: notice.type === 'error' ? '#fef2f2' : '#f0fdf4',
                border: `1px solid ${notice.type === 'error' ? '#fecaca' : '#bbf7d0'}`,
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
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
                gap: 12,
                alignItems: 'stretch',
              }}
            >
              {plans.map((plan) => {
                const isCurrent = plan.id === currentPlanId;
                const isUpgrade = plan.id === 'pro' || plan.id === 'team';

                return (
                  <div
                    key={plan.id}
                    style={{
                      borderRadius: 22,
                      border: isCurrent ? '1px solid var(--accent)' : '1px solid var(--border)',
                      background: isCurrent
                        ? 'linear-gradient(180deg, color-mix(in srgb, var(--accent) 4%, var(--bg-card)), var(--bg-card))'
                        : 'var(--bg-card)',
                      padding: 16,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 12,
                      boxShadow: isCurrent ? 'var(--shadow-md)' : 'var(--shadow-sm)',
                      minHeight: 400,
                    }}
                  >
                    <div>
                      <div style={{ fontSize: 11, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--text-3)', fontWeight: 700 }}>
                        {plan.name}
                      </div>
                      <div style={{ marginTop: 6, display: 'flex', alignItems: 'flex-end', gap: 6 }}>
                        <div style={{ fontSize: 34, color: 'var(--text)', fontFamily: "'DM Serif Display', serif", lineHeight: .95 }}>
                          {formatPrice(plan.monthlyPriceInPaise)}
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: 4 }}>
                          / month
                        </div>
                      </div>
                      <p style={{ marginTop: 8, fontSize: 12, color: 'var(--text-2)', lineHeight: 1.5 }}>
                        {plan.description}
                      </p>
                    </div>

                    <div
                      style={{
                        borderRadius: 14,
                        background: 'var(--bg-2)',
                        border: '1px solid var(--border)',
                        padding: '10px 12px',
                      }}
                    >
                      <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.07em', textTransform: 'uppercase', color: 'var(--text-3)', marginBottom: 6 }}>
                        Limits
                      </div>
                      <div style={{ color: 'var(--text)', lineHeight: 1.55, fontSize: 11 }}>
                        <div>Projects: {plan.limits.maxActiveProjects ?? 'Unlimited'}</div>
                        <div>Active docs: {plan.limits.maxActiveDocuments ?? 'Unlimited'}</div>
                        <div>Monthly new docs: {plan.limits.softMonthlyNewDocumentsLimit ?? 'Unlimited'}</div>
                      </div>
                    </div>

                    <div style={{ display: 'grid', gap: 6 }}>
                      {featureList(plan).map((feature) => (
                        <div key={feature} style={{ display: 'flex', gap: 7, fontSize: 11, color: 'var(--text-2)', lineHeight: 1.35 }}>
                          <CheckCircle2 size={14} style={{ color: 'var(--text-3)', flexShrink: 0, marginTop: 1 }} />
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
                            borderRadius: 14,
                            border: '1px solid var(--border)',
                            background: 'var(--bg-2)',
                            color: 'var(--text-2)',
                            padding: '11px 12px',
                            fontSize: 13,
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
                            borderRadius: 14,
                            border: 'none',
                            background: 'var(--accent)',
                            color: 'var(--accent-fg)',
                            padding: '11px 12px',
                            fontSize: 13,
                            fontWeight: 600,
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
                            borderRadius: 14,
                            border: '1px solid var(--border)',
                            background: 'transparent',
                            color: 'var(--text-3)',
                            padding: '11px 12px',
                            fontSize: 13,
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
                            border: '1px solid #fecaca',
                            borderRadius: 14,
                            padding: '10px 12px',
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
