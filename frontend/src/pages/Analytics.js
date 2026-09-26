import React, { useEffect, useMemo, useState } from 'react';
import { BarChart3, CheckCircle2, Clock3, MessageSquare, Send, TrendingUp } from 'lucide-react';
import api from '../api';
import toast from 'react-hot-toast';

const periods = [
  { value: '7', label: 'Last 7 days' },
  { value: '30', label: 'Last 30 days' },
  { value: 'all', label: 'All time' },
];

function isWithinPeriod(date, period) {
  if (period === 'all') return true;
  const cutoff = Date.now() - Number(period) * 24 * 60 * 60 * 1000;
  return date && new Date(date).getTime() >= cutoff;
}

export default function Analytics() {
  const [posts, setPosts] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [inbox, setInbox] = useState([]);
  const [period, setPeriod] = useState('30');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.allSettled([api.get('/posts'), api.get('/social/accounts'), api.get('/social/inbox')])
      .then(([postsResult, accountsResult, inboxResult]) => {
        if (postsResult.status === 'fulfilled') setPosts(postsResult.value.data || []);
        if (accountsResult.status === 'fulfilled') setAccounts(accountsResult.value.data || []);
        if (inboxResult.status === 'fulfilled') setInbox(inboxResult.value.data || []);
      })
      .catch(() => toast.error('Failed to load analytics'))
      .finally(() => setLoading(false));
  }, []);

  const filteredPosts = useMemo(
    () => posts.filter((post) => isWithinPeriod(post.created_at || post.scheduled_time, period)),
    [posts, period]
  );

  const platformRows = useMemo(() => {
    const grouped = {};
    filteredPosts.forEach((post) => {
      const platform = post.platform || 'Unassigned';
      if (!grouped[platform]) grouped[platform] = { platform, posts: 0, published: 0, scheduled: 0, draft: 0 };
      grouped[platform].posts += 1;
      if (post.status === 'published') grouped[platform].published += 1;
      if (post.status === 'scheduled') grouped[platform].scheduled += 1;
      if (post.status === 'draft') grouped[platform].draft += 1;
    });
    return Object.values(grouped).sort((a, b) => b.posts - a.posts);
  }, [filteredPosts]);

  const published = filteredPosts.filter((post) => post.status === 'published').length;
  const scheduled = filteredPosts.filter((post) => post.status === 'scheduled').length;
  const openInbox = inbox.filter((item) => !item.replied).length;
  const publishRate = filteredPosts.length ? Math.round((published / filteredPosts.length) * 100) : 0;

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" /></div>;

  const stats = [
    { label: 'Posts created', value: filteredPosts.length, icon: Send, color: 'text-[var(--brand-primary)] bg-[var(--brand-primary-muted)]' },
    { label: 'Published', value: published, icon: CheckCircle2, color: 'text-emerald-600 bg-emerald-50' },
    { label: 'Publishing rate', value: `${publishRate}%`, icon: TrendingUp, color: 'text-[var(--brand-secondary)] bg-violet-50' },
    { label: 'Open conversations', value: openInbox, icon: MessageSquare, color: 'text-[var(--warning)] bg-amber-50' },
  ];

  return (
    <div>
      <div className="flex flex-wrap justify-between items-start gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-[460] text-[var(--text-primary)]">Analytics</h1>
          <p className="text-[var(--text-secondary)] mt-1">Understand publishing activity across your connected channels.</p>
        </div>
        <button onClick={() => { const rows = [["platform", "posts", "published", "scheduled", "draft"], ...platformRows.map((r) => [r.platform, r.posts, r.published, r.scheduled, r.draft])]; downloadCsv("socialhub-analytics.csv", rows); toast.success("Analytics exported as CSV"); }} className="px-3 py-2 bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-lg text-sm text-[var(--text-primary)] hover:border-[var(--brand-primary)] transition">Export CSV</button>`n        <select value={period} onChange={(event) => setPeriod(event.target.value)} className="px-3 py-2 bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-lg text-sm text-[var(--text-primary)]">
          {periods.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
        </select>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
        {stats.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-2xl p-5">
            <div className="flex items-center justify-between"><div><p className="text-sm text-[var(--text-secondary)]">{label}</p><p className="text-3xl font-[460] text-[var(--text-primary)] mt-1">{value}</p></div><div className={`p-3 rounded-xl ${color}`}><Icon size={22} /></div></div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <section className="lg:col-span-2 bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-2xl p-6">
          <div className="flex items-center justify-between mb-5"><h2 className="text-lg font-semibold text-[var(--text-primary)] flex items-center"><BarChart3 size={19} className="mr-2 text-[var(--brand-secondary)]" /> Platform overview</h2><span className="text-sm text-[var(--text-secondary)]">{accounts.length} connected</span></div>
          {platformRows.length === 0 ? <p className="text-[var(--text-secondary)] py-12 text-center">Create posts to see platform analytics.</p> : <div className="overflow-x-auto"><table className="w-full text-left"><thead><tr className="border-b border-[var(--border-subtle)] text-xs uppercase text-[var(--text-tertiary)]"><th className="py-3">Platform</th><th className="py-3">Posts</th><th className="py-3">Published</th><th className="py-3">Scheduled</th><th className="py-3">Drafts</th></tr></thead><tbody>{platformRows.map((row) => <tr key={row.platform} className="border-b border-gray-50 last:border-0 text-sm"><td className="py-4 font-medium text-[var(--text-primary)] capitalize">{row.platform}</td><td className="py-4 text-[var(--text-secondary)]">{row.posts}</td><td className="py-4 text-emerald-600">{row.published}</td><td className="py-4 text-[var(--warning)]">{row.scheduled}</td><td className="py-4 text-[var(--text-secondary)]">{row.draft}</td></tr>)}</tbody></table></div>}
        </section>
        <section className="bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-2xl p-6">
          <h2 className="text-lg font-semibold text-[var(--text-primary)] flex items-center mb-5"><Clock3 size={19} className="mr-2 text-[var(--warning)]" /> Workflow health</h2>
          <div className="space-y-5"><Metric label="Publishing rate" value={publishRate} color="bg-emerald-500" /><Metric label="Scheduled share" value={filteredPosts.length ? Math.round((scheduled / filteredPosts.length) * 100) : 0} color="bg-amber-500" /><Metric label="Inbox response coverage" value={inbox.length ? Math.round(((inbox.length - openInbox) / inbox.length) * 100) : 0} color="bg-violet-500" /></div>
          <div className="mt-8 p-4 rounded-xl bg-violet-50"><p className="text-sm font-medium text-violet-900">Next best action</p><p className="text-sm text-violet-700 mt-1">{openInbox ? `Review ${openInbox} open conversation${openInbox === 1 ? '' : 's'} in the Inbox.` : 'Your inbox is clear. Plan your next content batch.'}</p></div>
        </section>
      </div>
    </div>
  );
}

function Metric({ label, value, color }) {
  return <div><div className="flex justify-between text-sm mb-2"><span className="text-[var(--text-secondary)]">{label}</span><span className="font-semibold text-[var(--text-primary)]">{value}%</span></div><div className="h-2 rounded-full bg-[var(--bg-elevated)] overflow-hidden"><div className={`h-full rounded-full ${color}`} style={{ width: `${value}%` }} /></div></div>;
}
