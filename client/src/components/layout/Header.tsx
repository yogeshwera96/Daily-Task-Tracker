import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNotifications } from '../../hooks/useNotifications';
import { Bell, Sun, Moon, CheckCircle } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';

export const Header: React.FC = () => {
  const { user } = useAuth();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const { theme, toggleTheme } = useTheme();
  const [showNotifications, setShowNotifications] = useState(false);

  return (
    <header className="h-16 border-b border-slate-800 bg-slate-900/40 backdrop-blur-md px-8 flex items-center justify-between sticky top-0 z-30">
      {/* Title Placeholder */}
      <div>
        <h2 className="text-sm font-semibold text-slate-300">
          Welcome back, <span className="text-indigo-400 font-bold">{user?.firstName}</span>!
        </h2>
      </div>

      {/* Utilities */}
      <div className="flex items-center gap-5">
        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="text-slate-400 hover:text-slate-200 transition-colors p-2 hover:bg-slate-800 rounded-lg cursor-pointer"
        >
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        {/* Notifications Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="text-slate-400 hover:text-slate-200 transition-colors p-2 hover:bg-slate-800 rounded-lg cursor-pointer relative"
          >
            <Bell size={18} />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-indigo-600 rounded-full text-[9px] font-bold text-white flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <>
              {/* Overlay to close notifications click outside */}
              <div
                className="fixed inset-0 z-40 cursor-default"
                onClick={() => setShowNotifications(false)}
              />

              <div className="absolute right-0 mt-2 w-80 glass-panel border border-slate-800 rounded-xl shadow-2xl z-50 overflow-hidden flex flex-col max-h-[420px]">
                <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between bg-slate-900/60">
                  <h4 className="text-xs font-semibold text-slate-200">Notifications</h4>
                  {unreadCount > 0 && (
                    <button
                      onClick={() => markAllAsRead()}
                      className="text-[10px] text-indigo-400 hover:text-indigo-300 font-semibold cursor-pointer"
                    >
                      Mark all read
                    </button>
                  )}
                </div>

                <div className="flex-1 overflow-y-auto divide-y divide-slate-850">
                  {notifications.length === 0 ? (
                    <div className="p-6 text-center text-xs text-slate-500">
                      No notifications yet
                    </div>
                  ) : (
                    notifications.map((notif: any) => (
                      <div
                        key={notif.id}
                        onClick={() => !notif.isRead && markAsRead(notif.id)}
                        className={`p-4 transition-colors cursor-pointer text-left ${
                          notif.isRead ? 'opacity-65 hover:bg-slate-900/10' : 'bg-indigo-600/5 hover:bg-indigo-600/10'
                        }`}
                      >
                        <div className="flex items-start gap-2.5">
                          {!notif.isRead && <CheckCircle size={14} className="text-indigo-400 mt-0.5" />}
                          <div>
                            <h5 className="text-xs font-semibold text-slate-200 mb-0.5">
                              {notif.title}
                            </h5>
                            <p className="text-[11px] text-slate-400 leading-normal">
                              {notif.message}
                            </p>
                            <span className="text-[9px] text-slate-500 font-medium block mt-1.5">
                              {new Date(notif.createdAt).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
};
export default Header;
