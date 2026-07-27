import React from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

export const AuthLayout: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="w-screen h-screen flex flex-col items-center justify-center bg-slate-950 text-slate-100 gap-4">
        <svg className="animate-spin h-8 w-8 text-indigo-500" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      </div>
    );
  }

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-12 bg-slate-950 text-slate-100">
      {/* Visual panel (left side on lg) */}
      <div className="hidden lg:flex lg:col-span-5 bg-gradient-to-tr from-indigo-950 via-slate-900 to-indigo-900 p-12 flex-col justify-between relative overflow-hidden border-r border-slate-800">
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-indigo-600/5 rounded-full blur-[120px] pointer-events-none" />

        <div className="flex items-center gap-2 relative z-10">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center font-bold text-white shadow-lg shadow-indigo-600/25">
            AI
          </div>
          <span className="font-bold text-slate-200 tracking-wide">Daily Task Tracker</span>
        </div>

        <div className="relative z-10 max-w-sm">
          <h1 className="text-3xl font-extrabold tracking-tight mb-4 leading-tight">
            Streamline EOD Reporting With AI
          </h1>
          <p className="text-sm text-slate-400 leading-relaxed">
            Log your achievements throughout the day. Let our AI construct polished updates, and schedule automatic submission notifications straight to your team leads.
          </p>
        </div>

        <div className="relative z-10 text-xs text-slate-500 font-medium">
          © {new Date().getFullYear()} AI Task Tracker. All rights reserved.
        </div>
      </div>

      {/* Form panel (right side) */}
      <div className="col-span-1 lg:col-span-7 flex flex-col justify-center items-center px-6 py-12 lg:px-16">
        <div className="w-full max-w-md">
          <Outlet />
        </div>
      </div>
    </div>
  );
};
export default AuthLayout;
