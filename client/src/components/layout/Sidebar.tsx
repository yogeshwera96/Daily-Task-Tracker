import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
  LayoutDashboard,
  CheckSquare,
  FileText,
  Users,
  Settings,
  Calendar,
  LogOut,
  Shield,
  Activity,
  FileSpreadsheet,
  ClipboardList
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const { user, logout } = useAuth();

  if (!user) return null;

  const links = [
    // Developer links
    {
      to: '/dashboard',
      label: 'Dashboard',
      icon: <LayoutDashboard size={18} />,
      roles: ['DEVELOPER', 'MANAGER', 'ADMIN']
    },
    {
      to: '/tasks',
      label: 'My Tasks',
      icon: <CheckSquare size={18} />,
      roles: ['DEVELOPER']
    },
    {
      to: '/eod',
      label: 'EOD Report',
      icon: <FileSpreadsheet size={18} />,
      roles: ['DEVELOPER']
    },
    {
      to: '/productivity',
      label: 'My Productivity',
      icon: <Activity size={18} />,
      roles: ['DEVELOPER']
    },

    // Manager links
    {
      to: '/team-tasks',
      label: 'Team Tasks',
      icon: <ClipboardList size={18} />,
      roles: ['MANAGER', 'ADMIN']
    },
    {
      to: '/team-reports',
      label: 'Team Reports',
      icon: <FileText size={18} />,
      roles: ['MANAGER', 'ADMIN']
    },
    {
      to: '/team-analytics',
      label: 'Team Performance',
      icon: <Users size={18} />,
      roles: ['MANAGER', 'ADMIN']
    },

    // Admin links
    {
      to: '/admin/users',
      label: 'Manage Users',
      icon: <Shield size={18} />,
      roles: ['ADMIN']
    },
    {
      to: '/admin/projects',
      label: 'Manage Projects',
      icon: <LayoutDashboard size={18} />,
      roles: ['ADMIN']
    },
    {
      to: '/admin/settings',
      label: 'System Settings',
      icon: <Settings size={18} />,
      roles: ['ADMIN']
    },
    {
      to: '/admin/holidays',
      label: 'Holidays Calendar',
      icon: <Calendar size={18} />,
      roles: ['ADMIN']
    }
  ];

  const filteredLinks = links.filter((link) => link.roles.includes(user.role));

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col h-screen sticky top-0">
      {/* Brand Header */}
      <div className="h-16 flex items-center px-6 border-b border-slate-850">
        <span className="text-base font-bold text-gradient tracking-wide">AI Daily Task Tracker</span>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-4 py-6 flex flex-col gap-1.5 overflow-y-auto">
        {filteredLinks.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) =>
              `flex items-center gap-3.5 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer
              ${
                isActive
                  ? 'bg-indigo-600/10 border border-indigo-500/20 text-indigo-400 font-semibold'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-slate-850 border border-transparent'
              }`
            }
          >
            {link.icon}
            {link.label}
          </NavLink>
        ))}
      </nav>

      {/* Footer Profile & Logout */}
      <div className="p-4 border-t border-slate-850 flex flex-col gap-3.5">
        <div className="flex items-center gap-3 px-2">
          <div className="w-9 h-9 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-slate-100 text-sm">
            {user.firstName[0]}
            {user.lastName[0]}
          </div>
          <div className="overflow-hidden">
            <h4 className="text-xs font-semibold text-slate-200 truncate leading-tight">
              {user.firstName} {user.lastName}
            </h4>
            <span className="text-[10px] text-slate-500 font-medium block truncate mt-0.5">
              {user.role}
            </span>
          </div>
        </div>
        <button
          onClick={logout}
          className="flex items-center gap-3 w-full px-4 py-2.5 rounded-lg text-sm font-medium text-red-400 hover:bg-red-500/5 hover:text-red-300 transition-colors cursor-pointer text-left"
        >
          <LogOut size={16} />
          Sign Out
        </button>
      </div>
    </aside>
  );
};
export default Sidebar;
