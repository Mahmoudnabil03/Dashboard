import React from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../App';
import Logo from './Logo';
import {
  LayoutDashboard, Send, CalendarDays, MessageSquare, Bot, Link2, LogOut, BarChart3, Inbox, Settings,
} from 'lucide-react';

const navItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/posts', label: 'Posts', icon: Send },
  { to: '/calendar', label: 'Calendar', icon: CalendarDays },
  { to: '/comments', label: 'Comments', icon: MessageSquare },
  { to: '/inbox', label: 'Unified Inbox', icon: Inbox },
  { to: '/analytics', label: 'Analytics', icon: BarChart3 },
  { to: '/ai-agent', label: 'AI Agent', icon: Bot },
  { to: '/accounts', label: 'Accounts', icon: Link2 },
  { to: '/settings', label: 'Settings', icon: Settings },
];

export default function Layout() {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="flex min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)]">
      <div className="w-64 bg-[var(--bg-secondary)] border-r border-[var(--border-primary)] flex flex-col">
        <div className="p-6 border-b border-[var(--border-primary)]">
          <Logo size={42} />
        </div>

        <nav className="mt-2 flex-1 overflow-y-auto px-2">
          {navItems.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
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
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto bg-[var(--bg-primary)]">
        <div className="p-8">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
