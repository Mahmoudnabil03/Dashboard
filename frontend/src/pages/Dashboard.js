import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import {
  Send, CalendarDays, MessageSquare, Link2, Sparkles, ArrowRight, Plus,
} from 'lucide-react';
import { format, parseISO, isAfter } from 'date-fns';
import toast from 'react-hot-toast';
import api from '../api';

const statusColors = {
  draft: '#94a3b8',
  scheduled: '#f59e0b',
  published: '#22c55e',
  failed: '#ef4444',
};

export default function Dashboard() {
  const [posts, setPosts] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const results = await Promise.allSettled([
        api.get('/posts'),
        api.get('/social/accounts'),
      ]);
      const [po, ac] = results;
      if (po.status === 'fulfilled') setPosts(po.value.data || []);
      if (ac.status === 'fulfilled') setAccounts(ac.value.data || []);
    } catch (error) {
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--brand-primary)]"></div>
      </div>
    );
  }

  const now = new Date();
  const upcomingPosts = posts
    .filter((p) => p.scheduled_time && isAfter(parseISO(p.scheduled_time), now))
    .sort((a, b) => new Date(a.scheduled_time) - new Date(b.scheduled_time))
    .slice(0, 5);

  const draftPosts = posts.filter((p) => p.status === 'draft').length;
  const scheduledPosts = posts.filter((p) => p.status === 'scheduled').length;
  const publishedPosts = posts.filter((p) => p.status === 'published').length;

  const statusChart = [
    { name: 'Draft', value: draftPosts, key: 'draft' },
    { name: 'Scheduled', value: scheduledPosts, key: 'scheduled' },
    { name: 'Published', value: publishedPosts, key: 'published' },
  ];

  const platformCounts = posts.reduce((acc, p) => {
    const plat = p.platform || 'unknown';
    acc[plat] = (acc[plat] || 0) + 1;
    return acc;
  }, {});
  const platformChart = Object.entries(platformCounts).map(([name, value]) => ({ name, value }));

  const totalComments = posts.reduce((sum, p) => sum + (p.comments_count || 0), 0);

  const kpis = [
    { label: 'Total Posts', value: posts.length, icon: Send, color: 'blue', to: '/posts' },
    { label: 'Scheduled', value: scheduledPosts, icon: CalendarDays, color: 'amber', to: '/calendar' },
    { label: 'Comments', value: totalComments, icon: MessageSquare, color: 'violet', to: '/comments' },
    { label: 'Connected Accounts', value: accounts.length, icon: Link2, color: 'green', to: '/accounts' },
  ];

  const colorMap = {
    blue: 'bg-blue-100 text-[var(--brand-primary)]',
    amber: 'bg-[var(--warning-muted)] text-[var(--warning)]',
    violet: 'bg-[var(--brand-primary-muted)] text-[var(--brand-secondary)]',
    green: 'bg-[var(--success-muted)] text-[var(--success)]',
  };

  return (
    <div>
      <div className="flex flex-wrap justify-between items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-[460] text-[var(--text-primary)]">SocialHub</h1>
          <p className="text-sm text-[var(--text-secondary)]">Manage. Connect. Grow.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link to="/posts" className="bg-[var(--brand-primary)] text-white px-4 py-2 rounded-lg flex items-center hover:bg-[var(--brand-primary-hover)] transition text-sm">
            <Plus size={18} className="mr-1.5" /> New Post
          </Link>
          <Link to="/accounts" className="bg-[var(--bg-card)] border border-[var(--border-subtle)] text-[var(--text-primary)] px-4 py-2 rounded-lg flex items-center hover:bg-[var(--bg-elevated)] transition text-sm">
            <Link2 size={18} className="mr-1.5" /> Connect Account
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {kpis.map((kpi) => (
          <Link key={kpi.label} to={kpi.to} className="bg-[var(--bg-card)] rounded-xl shadow-sm p-6 border border-[var(--border-subtle)] hover:shadow-md transition">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[var(--text-secondary)]">{kpi.label}</p>
                <p className="text-2xl font-bold text-[var(--text-primary)]">{kpi.value}</p>
              </div>
              <div className={`${colorMap[kpi.color]} p-3 rounded-lg`}>
                <kpi.icon size={24} />
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-[var(--bg-card)] rounded-xl shadow-sm p-6 border border-[var(--border-subtle)]">
          <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4 flex items-center">
            <Send size={18} className="mr-2 text-[var(--brand-primary)]" /> Posts by Status
          </h3>
          {posts.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={statusChart}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                  {statusChart.map((entry) => (
                    <Cell key={entry.key} fill={statusColors[entry.key]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyChart label="No posts yet" to="/posts" cta="Create your first post" />
          )}
        </div>

        <div className="bg-[var(--bg-card)] rounded-xl shadow-sm p-6 border border-[var(--border-subtle)]">
          <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4 flex items-center">
            <Link2 size={18} className="mr-2 text-[var(--brand-secondary)]" /> Posts by Platform
          </h3>
          {platformChart.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={platformChart}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="value" fill="#7C3AED" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyChart label="No platform data yet" to="/accounts" cta="Connect an account" />
          )}
        </div>
      </div>

      {/* Lower panels */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Upcoming posts */}
        <div className="bg-[var(--bg-card)] rounded-xl shadow-sm p-6 border border-[var(--border-subtle)]">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-[var(--text-primary)] flex items-center">
              <CalendarDays size={18} className="mr-2 text-[var(--warning)]" /> Upcoming
            </h3>
            <Link to="/calendar" className="text-sm text-[var(--brand-primary)] hover:text-[var(--brand-primary-hover)] flex items-center">
              Calendar <ArrowRight size={14} className="ml-1" />
            </Link>
          </div>
          {upcomingPosts.length === 0 ? (
            <p className="text-[var(--text-secondary)] text-sm text-center py-6">No scheduled posts</p>
          ) : (
            <div className="space-y-3">
              {upcomingPosts.map((p) => (
                <div key={p.id} className="flex items-start justify-between p-3 bg-[var(--bg-elevated)] rounded-lg">
                  <div className="min-w-0">
                    <p className="text-sm text-[var(--text-primary)] truncate">{p.content?.slice(0, 50) || '(no text)'}</p>
                    <span className="text-xs text-[var(--text-tertiary)] capitalize">{p.platform || 'all'}</span>
                  </div>
                  <span className="text-xs text-[var(--text-secondary)] whitespace-nowrap ml-2">
                    {format(parseISO(p.scheduled_time), 'MMM d, p')}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent posts */}
        <div className="bg-[var(--bg-card)] rounded-xl shadow-sm p-6 border border-[var(--border-subtle)]">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-[var(--text-primary)] flex items-center">
              <Send size={18} className="mr-2 text-[var(--brand-primary)]" /> Recent Posts
            </h3>
            <Link to="/posts" className="text-sm text-[var(--brand-primary)] hover:text-[var(--brand-primary-hover)] flex items-center">
              All <ArrowRight size={14} className="ml-1" />
            </Link>
          </div>
          {posts.length === 0 ? (
            <p className="text-[var(--text-secondary)] text-sm text-center py-6">No posts yet</p>
          ) : (
            <div className="space-y-3">
              {posts.slice(0, 4).map((p) => (
                <div key={p.id} className="flex items-center justify-between p-3 bg-[var(--bg-elevated)] rounded-lg">
                  <div className="min-w-0">
                    <p className="text-sm text-[var(--text-primary)] truncate">{p.content?.slice(0, 40) || '(media post)'}</p>
                    <span className="text-xs text-[var(--text-tertiary)] capitalize">{p.status}</span>
                  </div>
                  <span className="text-xs font-medium text-[var(--brand-primary)] whitespace-nowrap ml-2 capitalize">{p.platform || '—'}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Connected accounts */}
        <div className="bg-[var(--bg-card)] rounded-xl shadow-sm p-6 border border-[var(--border-subtle)]">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-[var(--text-primary)] flex items-center">
              <Link2 size={18} className="mr-2 text-[var(--text-secondary)]" /> Accounts
            </h3>
            <Link to="/accounts" className="text-sm text-[var(--brand-primary)] hover:text-[var(--brand-primary-hover)] flex items-center">
              Manage <ArrowRight size={14} className="ml-1" />
            </Link>
          </div>
          {accounts.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-[var(--text-secondary)] text-sm mb-3">No accounts connected</p>
              <Link to="/accounts" className="text-[var(--brand-primary)] hover:text-[var(--brand-primary-hover)] text-sm">Connect a platform</Link>
            </div>
          ) : (
            <div className="space-y-2">
              {accounts.map((a) => (
                <div key={a.id} className="flex items-center justify-between p-3 bg-[var(--bg-elevated)] rounded-lg">
                  <span className="text-sm text-[var(--text-primary)] capitalize">{a.platform}</span>
                  <span className="text-xs text-[var(--text-secondary)]">@{a.username}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function EmptyChart({ label, to, cta }) {
  return (
    <div className="flex flex-col items-center justify-center h-[260px] text-[var(--text-tertiary)]">
      <Sparkles size={32} className="mb-2" />
      <p className="text-sm">{label}</p>
      <Link to={to} className="mt-2 text-sm text-[var(--brand-primary)] hover:text-[var(--brand-primary-hover)]">{cta}</Link>
    </div>
  );
}
