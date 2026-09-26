import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../App';
import Logo from './Logo';
import LegalFooter from './LegalFooter';
import {
  LayoutDashboard, Send, CalendarDays, MessageSquare, Bot, Link2, LogOut, BarChart3, Inbox, Settings,
  Target, FileText, Menu, X, Users, CreditCard, Globe, Home, UserCheck,
} from 'lucide-react';

const navItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/posts', label: 'Posts', icon: Send },
  { to: '/calendar', label: 'Calendar', icon: CalendarDays },
  { to: '/comments', label: 'Comments', icon: MessageSquare },
  { to: '/inbox', label: 'Unified Inbox', icon: Inbox },
  { to: '/analytics', label: 'Analytics', icon: BarChart3 },
  { to: '/ai-agent', label: 'AI Agent', icon: Bot },
  { to: '/campaigns', label: 'Campaigns', icon: Target },
  { to: '/content', label: 'Content', icon: FileText },
  { to: '/reports', label: 'Reports', icon: FileText },
  { to: '/team', label: 'Team', icon: Users },
  { to: '/billing', label: 'Billing', icon: CreditCard },
  { to: '/leads', label: 'Leads', icon: UserCheck },
  { to: '/properties', label: 'Properties', icon: Home },
  { to: '/websites', label: 'Websites', icon: Globe },
  { to: '/accounts', label: 'Accounts', icon: Link2 },
  { to: '/settings', label: 'Settings', icon: Settings },
];

export default function Layout() {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="flex min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)]">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-[200] lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-[201] w-64 bg-[var(--bg-secondary)] border-r border-[var(--border-primary)] flex flex-col transform transition-transform duration-300 ease-out lg:transform-none ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
        aria-label="Main navigation"
      >
        <div className="flex items-center justify-between p-6 border-b border-[var(--border-primary)]">
          <Logo size={42} />
          <button
            className="lg:hidden p-2 text-[var(--text-tertiary)] hover:text-[var(--text-primary)] rounded-lg"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close sidebar"
          >
            <X size={24} />
          </button>
        </div>

        <nav className="mt-2 flex-1 overflow-y-auto px-2" aria-label="Main navigation">
          {navItems.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `flex items-center px-4 py-3 transition rounded-xl ${
                  isActive
                    ? 'bg-[var(--accent-blue-glow)] text-[var(--accent-blue)] border border-[var(--accent-blue)]/30'
                    : 'text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)]'
                }`
              }
            >
              <Icon size={20} className="mr-3" />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-[var(--border-primary)]">
          {user?.name && (
            <div className="px-2 pb-3">
              <p className="text-sm font-medium text-[var(--text-primary)] truncate">{user.name}</p>
              <p className="text-xs text-[var(--text-muted)] truncate">{user.email}</p>
            </div>
          )}
          <button
            onClick={handleLogout}
            className="flex items-center px-4 py-3 text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)] transition w-full rounded-xl"
          >
            <LogOut size={20} className="mr-3" />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Mobile Header */}
        <header className="lg:hidden sticky top-0 z-[100] bg-[var(--bg-secondary)] border-b border-[var(--border-primary)]">
          <div className="flex items-center justify-between h-16 px-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 text-[var(--text-tertiary)] hover:text-[var(--text-primary)] rounded-lg"
              aria-label="Open menu"
            >
              <Menu size={24} />
            </button>
            <Logo size={32} />
            <div className="w-10" />
          </div>
        </header>

        <main className="flex-1 overflow-auto bg-[var(--bg-primary)]">
          <div className="p-4 lg:p-8">
            <Outlet />
          </div>
        </main>

        {/* Legal Footer */}
        <LegalFooter />
      </div>
    </div>
  );
}
