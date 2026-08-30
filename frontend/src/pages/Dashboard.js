import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import {
  Home, Users, Send, DollarSign, Plus, Sparkles, CalendarDays,
  Link2, TrendingUp, ArrowRight,
} from 'lucide-react';
import { format, parseISO, isAfter } from 'date-fns';
import toast from 'react-hot-toast';
import api from '../api';

const statusColors = {
  available: '#22c55e',
  pending: '#f59e0b',
  sold: '#9ca3af',
};

function formatMoney(n) {
  const v = Number(n) || 0;
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `$${(v / 1_000).toFixed(0)}K`;
  return `$${v.toLocaleString()}`;
}

export default function Dashboard() {
  const [propStats, setPropStats] = useState({ total: 0, available: 0, pending: 0, sold: 0, available_value: 0 });
  const [leadStats, setLeadStats] = useState({ total: 0, new: 0, contacted: 0, qualified: 0, closed: 0 });
  const [posts, setPosts] = useState([]);
  const [properties, setProperties] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Each call is independent; a failure in one shouldn't blank the whole hub.
      const results = await Promise.allSettled([
        api.get('/properties/stats/summary'),
        api.get('/leads/stats/summary'),
        api.get('/posts'),
        api.get('/properties'),
        api.get('/social/accounts'),
      ]);
      const [ps, ls, po, pr, ac] = results;
      if (ps.status === 'fulfilled') setPropStats(ps.value.data);
      if (ls.status === 'fulfilled') setLeadStats(ls.value.data);
      if (po.status === 'fulfilled') setPosts(po.value.data || []);
      if (pr.status === 'fulfilled') setProperties(pr.value.data || []);
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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const now = new Date();
  const upcomingPosts = posts
    .filter((p) => p.scheduled_time && isAfter(parseISO(p.scheduled_time), now))
    .sort((a, b) => new Date(a.scheduled_time) - new Date(b.scheduled_time))
    .slice(0, 5);

  const recentListings = properties.slice(0, 4);
  const activeLeads = (leadStats.new || 0) + (leadStats.contacted || 0) + (leadStats.qualified || 0);

  const listingChart = [
    { name: 'Available', value: propStats.available || 0, key: 'available' },
    { name: 'Pending', value: propStats.pending || 0, key: 'pending' },
    { name: 'Sold', value: propStats.sold || 0, key: 'sold' },
  ];

  const leadFunnel = [
    { name: 'New', value: leadStats.new || 0 },
    { name: 'Contacted', value: leadStats.contacted || 0 },
    { name: 'Qualified', value: leadStats.qualified || 0 },
    { name: 'Closed', value: leadStats.closed || 0 },
  ];

  const kpis = [
    { label: 'Total Listings', value: propStats.total || 0, icon: Home, color: 'blue', to: '/properties' },
    { label: 'Available Value', value: formatMoney(propStats.available_value), icon: DollarSign, color: 'green', to: '/properties' },
    { label: 'Active Leads', value: activeLeads, icon: Users, color: 'purple', to: '/leads' },
    { label: 'Scheduled Posts', value: upcomingPosts.length, icon: Send, color: 'pink', to: '/calendar' },
  ];

  const colorMap = {
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
    purple: 'bg-purple-100 text-purple-600',
    pink: 'bg-pink-100 text-pink-600',
  };

  return (
    <div>
      <div className="flex flex-wrap justify-between items-center gap-4 mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Dashboard</h1>
        <div className="flex flex-wrap gap-2">
          <Link to="/properties" className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center hover:bg-blue-700 transition text-sm">
            <Plus size={18} className="mr-1.5" /> Add Listing
          </Link>
          <Link to="/posts" className="bg-white border border-gray-200 text-gray-700 px-4 py-2 rounded-lg flex items-center hover:bg-gray-50 transition text-sm">
            <Send size={18} className="mr-1.5" /> New Post
          </Link>
          <Link to="/leads" className="bg-white border border-gray-200 text-gray-700 px-4 py-2 rounded-lg flex items-center hover:bg-gray-50 transition text-sm">
            <Users size={18} className="mr-1.5" /> Add Lead
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {kpis.map((kpi) => (
          <Link key={kpi.label} to={kpi.to} className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">{kpi.label}</p>
                <p className="text-2xl font-bold text-gray-800">{kpi.value}</p>
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
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <Home size={18} className="mr-2 text-blue-600" /> Listings by Status
          </h3>
          {propStats.total > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={listingChart}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                  {listingChart.map((entry) => (
                    <Cell key={entry.key} fill={statusColors[entry.key]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyChart label="No listings yet" to="/properties" cta="Add a property" />
          )}
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <TrendingUp size={18} className="mr-2 text-purple-600" /> Lead Pipeline
          </h3>
          {leadStats.total > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={leadFunnel}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="value" fill="#8B5CF6" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyChart label="No leads yet" to="/leads" cta="Add a lead" />
          )}
        </div>
      </div>

      {/* Lower panels */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Upcoming posts */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800 flex items-center">
              <CalendarDays size={18} className="mr-2 text-pink-600" /> Upcoming Posts
            </h3>
            <Link to="/calendar" className="text-sm text-blue-600 hover:text-blue-700 flex items-center">
              Calendar <ArrowRight size={14} className="ml-1" />
            </Link>
          </div>
          {upcomingPosts.length === 0 ? (
            <p className="text-gray-500 text-sm text-center py-6">No scheduled posts</p>
          ) : (
            <div className="space-y-3">
              {upcomingPosts.map((p) => (
                <div key={p.id} className="flex items-start justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="min-w-0">
                    <p className="text-sm text-gray-800 truncate">{p.content?.slice(0, 50) || '(no text)'}</p>
                    <span className="text-xs text-gray-400 capitalize">{p.platform}</span>
                  </div>
                  <span className="text-xs text-gray-500 whitespace-nowrap ml-2">
                    {format(parseISO(p.scheduled_time), 'MMM d, p')}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent listings */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800 flex items-center">
              <Home size={18} className="mr-2 text-blue-600" /> Recent Listings
            </h3>
            <Link to="/properties" className="text-sm text-blue-600 hover:text-blue-700 flex items-center">
              All <ArrowRight size={14} className="ml-1" />
            </Link>
          </div>
          {recentListings.length === 0 ? (
            <p className="text-gray-500 text-sm text-center py-6">No listings yet</p>
          ) : (
            <div className="space-y-3">
              {recentListings.map((p) => (
                <div key={p.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="min-w-0">
                    <p className="text-sm text-gray-800 truncate">{p.title || p.address}</p>
                    <span className="text-xs text-gray-400 capitalize">{p.status}</span>
                  </div>
                  <span className="text-sm font-semibold text-blue-600 whitespace-nowrap ml-2">{formatMoney(p.price)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Connected accounts */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800 flex items-center">
              <Link2 size={18} className="mr-2 text-gray-600" /> Accounts
            </h3>
            <Link to="/accounts" className="text-sm text-blue-600 hover:text-blue-700 flex items-center">
              Manage <ArrowRight size={14} className="ml-1" />
            </Link>
          </div>
          {accounts.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-gray-500 text-sm mb-3">No accounts connected</p>
              <Link to="/accounts" className="text-blue-600 hover:text-blue-700 text-sm">Connect a platform</Link>
            </div>
          ) : (
            <div className="space-y-2">
              {accounts.map((a) => (
                <div key={a.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm text-gray-800 capitalize">{a.platform}</span>
                  <span className="text-xs text-gray-500">@{a.username}</span>
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
    <div className="flex flex-col items-center justify-center h-[260px] text-gray-400">
      <Sparkles size={32} className="mb-2" />
      <p className="text-sm">{label}</p>
      <Link to={to} className="mt-2 text-sm text-blue-600 hover:text-blue-700">{cta}</Link>
    </div>
  );
}
