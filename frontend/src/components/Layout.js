import React from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../App';
import Logo from './Logo';
import {
  LayoutDashboard, Send, CalendarDays, MessageSquare, Bot, Link2, LogOut, BarChart3, Inbox,
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
    <div className="flex min-h-screen bg-[#f2f0eb] text-[#292827]">
      <div className="w-64 bg-white/70 backdrop-blur-xl border-r border-[#e3e3e2] flex flex-col">
        <div className="p-6 border-b border-[#e3e3e2]">
          <Logo size={42} />
        </div>

        <nav className="mt-2 flex-1 overflow-y-auto">
          {navItems.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex items-center px-6 py-3 transition border-l-4 ${
                  isActive
                    ? 'bg-[#d4c7ff]/50 text-[#421d24] border-[#421d24]'
                    : 'text-[#666666] border-transparent hover:bg-[#f2f0eb] hover:text-[#292827]'
                }`
              }
            >
              <Icon size={20} className="mr-3" />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-[#e3e3e2]">
          {user?.name && (
            <div className="px-2 pb-3">
              <p className="text-sm font-medium text-[#292827] truncate">{user.name}</p>
              <p className="text-xs text-[#666666] truncate">{user.email}</p>
            </div>
          )}
          <button
            onClick={handleLogout}
            className="flex items-center px-4 py-3 text-[#666666] hover:bg-[#f2f0eb] hover:text-[#421d24] transition w-full rounded-lg"
          >
            <LogOut size={20} className="mr-3" />
            Logout
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto bg-[#f2f0eb]">
        <div className="p-8">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
