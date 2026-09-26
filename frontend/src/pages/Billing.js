import React, { useState, useEffect } from 'react';
import { CreditCard, DollarSign, Download, Clock, AlertTriangle, CheckCircle, XCircle, Loader2, ArrowRight, X, Edit2, Trash2, Plus } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import toast from 'react-hot-toast';
import api from '../api';

const plans = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    period: 'month',
    description: 'For individuals getting started',
    features: [
      '1 workspace',
      '3 social accounts',
      '10 scheduled posts/month',
      'Basic analytics (7 days)',
      '1 AI agent',
      'Community support',
    ],
    limits: { workspaces: 1, accounts: 3, posts: 10, analytics_days: 7, ai_agents: 1 },
    popular: false,
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 49,
    period: 'month',
    description: 'For growing businesses',
    features: [
      '3 workspaces',
      '15 social accounts',
      'Unlimited scheduled posts',
      'Advanced analytics (90 days)',
      '5 AI agents',
      'Priority support',
      'Webhooks & API access',
      'Custom reports',
    ],
    limits: { workspaces: 3, accounts: 15, posts: -1, analytics_days: 90, ai_agents: 5 },
    popular: true,
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 199,
    period: 'month',
    description: 'For large organizations',
    features: [
      'Unlimited workspaces',
      'Unlimited social accounts',
      'Unlimited scheduled posts',
      'Full analytics history',
      'Unlimited AI agents',
      'Dedicated support',
      'Custom integrations',
      'SSO & advanced security',
      'SLA guarantee',
      'On-premise option',
    ],
    limits: { workspaces: -1, accounts: -1, posts: -1, analytics_days: -1, ai_agents: -1 },
    popular: false,
  },
];

export default function Billing() {
  const [subscription, setSubscription] = useState(null);
  const [invoices, setInvoices] = useState([]);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchBillingData();
  }, []);

  const fetchBillingData = async () => {
    try {
      const [subRes, invRes, pmRes] = await Promise.allSettled([
        api.get('/subscription'),
        api.get('/invoices'),
        api.get('/payment-methods'),
      ]);
      if (subRes.status === 'fulfilled') setSubscription(subRes.value.data);
      if (invRes.status === 'fulfilled') setInvoices(invRes.value.data || []);
      if (pmRes.status === 'fulfilled') setPaymentMethods(pmRes.value.data || []);
    } catch (error) {
      toast.error('Failed to load billing data');
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = async (planId) => {
    setProcessing(true);
    setSelectedPlan(planId);
    try {
      const res = await api.post('/subscription/subscribe', { plan: planId });
      if (res.data.checkout_url) {
        window.location.href = res.data.checkout_url;
      } else {
        toast.success('Subscription updated');
        fetchBillingData();
      }
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to process subscription');
    } finally {
      setProcessing(false);
      setSelectedPlan(null);
    }
  };

  const handleCancel = async () => {
    if (!window.confirm('Cancel your subscription? You\'ll lose access to paid features at the end of the billing period.')) return;
    try {
      await api.post('/subscription/cancel');
      toast.success('Subscription cancelled');
      fetchBillingData();
    } catch (error) {
      toast.error('Failed to cancel subscription');
    }
  };

  const handleDownloadInvoice = (invoice) => {
    if (invoice.file_url) {
      window.open(invoice.file_url, '_blank');
    }
  };

  const formatPrice = (plan) => {
    if (plan.price === 0) return 'Free';
    return `$${plan.price}/${plan.period}`;
  };

  const getLimitDisplay = (limit) => {
    if (limit === -1) return 'Unlimited';
    return limit.toString();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin text-[var(--brand-primary)]" size={32} />
      </div>
    );
  }

  const currentPlan = plans.find(p => p.id === subscription?.plan) || plans[0];
  const isProOrEnterprise = ['pro', 'enterprise'].includes(currentPlan.id);

  return (
    <div>
      <div className="flex flex-wrap justify-between items-start gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-[var(--text-primary)]">Billing & Subscription</h1>
          <p className="text-[var(--text-secondary)]">Manage your plan, payment methods, and invoices</p>
        </div>
      </div>

      {/* Current Plan */}
      <div className="card-glass p-6 mb-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className={`p-4 rounded-xl ${currentPlan.popular ? 'bg-[var(--brand-primary-muted)]' : 'bg-[var(--bg-input)]'}`}>
              <DollarSign size={24} className={currentPlan.popular ? 'text-[var(--brand-primary)]' : 'text-[var(--text-secondary)]'} />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-bold text-[var(--text-primary)]">{currentPlan.name}</h2>
                {currentPlan.popular && <span className="badge badge-primary">Current Plan</span>}
              </div>
              <p className="text-[var(--text-secondary)] text-sm mt-1">{currentPlan.description}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-3xl font-bold text-[var(--text-primary)]">{formatPrice(currentPlan)}</div>
              <div className="text-sm text-[var(--text-tertiary)]">
                {subscription?.status === 'active' ? (
                  <>
                    <CheckCircle size={14} className="text-[var(--success)] inline mr-1" />
                    Active
                    {subscription?.current_period_end && (
                      <span className="ml-2">· Renews {format(parseISO(subscription.current_period_end), 'MMM d, yyyy')}</span>
                    )}
                  </>
                ) : subscription?.status === 'canceled' ? (
                  <>
                    <XCircle size={14} className="text-[var(--warning)] inline mr-1" />
                    Canceled · Ends {subscription?.current_period_end ? format(parseISO(subscription.current_period_end), 'MMM d, yyyy') : ''}
                  </>
                ) : (
                  <>
                    <Clock size={14} className="text-[var(--text-tertiary)] inline mr-1" />
                    {subscription?.status}
                  </>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              {isProOrEnterprise && subscription?.status === 'active' && (
                <button onClick={handleCancel} className="btn btn-ghost btn-sm text-[var(--error)] hover:text-[var(--error)]">
                  Cancel Subscription
                </button>
              )}
              <button onClick={() => setSelectedPlan('upgrade')} className="btn btn-primary">
                {processing && selectedPlan === 'upgrade' ? (
                  <Loader2 size={18} className="animate-spin mr-2" />
                ) : (
                  <>Upgrade Plan</>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Plan Comparison */}
        <div className="mt-8 overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th className="w-48">Feature</th>
                {plans.map((plan) => (
                  <th key={plan.id} className={`text-center ${plan.popular ? 'text-[var(--brand-primary)]' : ''}`}>
                    <div className={`font-semibold ${plan.popular ? 'text-[var(--brand-primary)]' : 'text-[var(--text-primary)]'}`}>{plan.name}</div>
                    <div className="text-sm text-[var(--text-tertiary)]">{formatPrice(plan)}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="font-medium">Workspaces</td>
                {plans.map((plan) => (
                  <td key={plan.id} className="text-center">{getLimitDisplay(plan.limits.workspaces)}</td>
                ))}
              </tr>
              <tr>
                <td className="font-medium">Social Accounts</td>
                {plans.map((plan) => (
                  <td key={plan.id} className="text-center">{getLimitDisplay(plan.limits.accounts)}</td>
                ))}
              </tr>
              <tr>
                <td className="font-medium">Scheduled Posts/Month</td>
                {plans.map((plan) => (
                  <td key={plan.id} className="text-center">{getLimitDisplay(plan.limits.posts)}</td>
                ))}
              </tr>
              <tr>
                <td className="font-medium">Analytics History</td>
                {plans.map((plan) => (
                  <td key={plan.id} className="text-center">{plan.limits.analytics_days === -1 ? 'Unlimited' : `${plan.limits.analytics_days} days`}</td>
                ))}
              </tr>
              <tr>
                <td className="font-medium">AI Agents</td>
                {plans.map((plan) => (
                  <td key={plan.id} className="text-center">{getLimitDisplay(plan.limits.ai_agents)}</td>
                ))}
              </tr>
              <tr>
                <td className="font-medium">API & Webhooks</td>
                {plans.map((plan) => (
                  <td key={plan.id} className="text-center">{['pro', 'enterprise'].includes(plan.id) ? <CheckCircle size={16} className="text-[var(--success)] mx-auto" /> : <X size={16} className="text-[var(--text-tertiary)] mx-auto" />}</td>
                ))}
              </tr>
              <tr>
                <td className="font-medium">Priority Support</td>
                {plans.map((plan) => (
                  <td key={plan.id} className="text-center">{['pro', 'enterprise'].includes(plan.id) ? <CheckCircle size={16} className="text-[var(--success)] mx-auto" /> : <X size={16} className="text-[var(--text-tertiary)] mx-auto" />}</td>
                ))}
              </tr>
              <tr>
                <td className="font-medium">SSO & Advanced Security</td>
                {plans.map((plan) => (
                  <td key={plan.id} className="text-center">{plan.id === 'enterprise' ? <CheckCircle size={16} className="text-[var(--success)] mx-auto" /> : <X size={16} className="text-[var(--text-tertiary)] mx-auto" />}</td>
                ))}
              </tr>
              <tr>
                <td className="font-medium">SLA Guarantee</td>
                {plans.map((plan) => (
                  <td key={plan.id} className="text-center">{plan.id === 'enterprise' ? <CheckCircle size={16} className="text-[var(--success)] mx-auto" /> : <X size={16} className="text-[var(--text-tertiary)] mx-auto" />}</td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Upgrade Modal */}
      {selectedPlan && !isProOrEnterprise && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="card-glass p-6 max-w-md w-full animate-scale-in">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-[var(--text-primary)]">Upgrade to {plans.find(p => p.id === selectedPlan)?.name}</h2>
              <button onClick={() => setSelectedPlan(null)} className="text-[var(--text-tertiary)] hover:text-[var(--text-primary)]">
                <X size={24} />
              </button>
            </div>
            <p className="text-[var(--text-secondary)] mb-6">You'll be redirected to Stripe Checkout to complete your purchase securely.</p>
            <div className="flex gap-3">
              <button onClick={() => setSelectedPlan(null)} className="btn btn-secondary flex-1">Cancel</button>
              <button
                onClick={() => handleSubscribe(selectedPlan)}
                disabled={processing}
                className="btn btn-primary flex-1"
              >
                {processing ? <Loader2 size={18} className="animate-spin mr-2" /> : <>Proceed to Checkout</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Invoices */}
      <div className="mt-12">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">Invoices</h2>
          <span className="text-sm text-[var(--text-tertiary)]">{invoices.length} invoices</span>
        </div>

        {invoices.length === 0 ? (
          <div className="card-glass p-8 text-center">
            <FileText size={48} className="mx-auto mb-4 text-[var(--text-tertiary)] opacity-50" />
            <h3 className="text-lg font-medium text-[var(--text-primary)] mb-2">No invoices yet</h3>
            <p className="text-[var(--text-secondary)]">Invoices will appear here after your first payment</p>
          </div>
        ) : (
          <div className="card-glass overflow-hidden">
            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th>Invoice</th>
                    <th>Date</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.map((invoice) => (
                    <tr key={invoice.id}>
                      <td className="font-medium text-[var(--text-primary)]">{invoice.number || invoice.id}</td>
                      <td className="text-[var(--text-secondary)]">{invoice.date ? format(parseISO(invoice.date), 'MMM d, yyyy') : '—'}</td>
                      <td className="font-medium text-[var(--text-primary)]">{invoice.currency || '$'}{invoice.amount}</td>
                      <td>
                        <span className={`badge ${invoice.status === 'paid' ? 'badge-success' : invoice.status === 'pending' ? 'badge-warning' : 'badge-error'}`}>
                          {invoice.status}
                        </span>
                      </td>
                      <td>
                        <button onClick={() => handleDownloadInvoice(invoice)} className="btn btn-ghost btn-sm" title="Download PDF">
                          <Download size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}