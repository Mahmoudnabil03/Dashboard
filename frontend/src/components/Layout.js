import React from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Home, Send, CalendarDays, MessageSquare, Users, Bot, Link2, LogOut,
} from 'lucide-react';

const navItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/properties', label: 'Properties', icon: Home },
  { to: '/posts', label: 'Posts', icon: Send },
  { to: '/calendar', label: 'Calendar', icon: CalendarDays },
  { to: '/comments', label: 'Comments', icon: MessageSquare },
  { to: '/leads', label: 'Leads', icon: Users },
  { to: '/ai-agent', label: 'AI Agent', icon: Bot },
  { to: '/accounts', label: 'Accounts', icon: Link2 },
];

export default function Layout() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="w-64 bg-white shadow-lg flex flex-col">
        <div className="p-6">
          <h1 className="text-2xl font-bold text-blue-600">EstateHub</h1>
          <p className="text-sm text-gray-500">Real Estate Social Manager</p>
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
                    ? 'bg-blue-50 text-blue-600 border-blue-600'
                    : 'text-gray-700 border-transparent hover:bg-blue-50 hover:text-blue-600'
                }`
              }
            >
              <Icon size={20} className="mr-3" />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t">
          {user?.name && (
            <div className="px-2 pb-3">
              <p className="text-sm font-medium text-gray-700 truncate">{user.name}</p>
              <p className="text-xs text-gray-400 truncate">{user.email}</p>
            </div>
          )}
          <button
            onClick={handleLogout}
            className="flex items-center px-4 py-3 text-gray-700 hover:bg-red-50 hover:text-red-600 transition w-full rounded-lg"
          >
            <LogOut size={20} className="mr-3" />
            Logout
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <div className="p-8">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
