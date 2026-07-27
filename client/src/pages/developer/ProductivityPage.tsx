import React from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../lib/axios';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import { BarChart, Bar, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Award, Briefcase, Zap, ShieldAlert } from 'lucide-react';

export const ProductivityPage: React.FC = () => {
  const { data: dashboardData, isLoading } = useQuery({
    queryKey: ['dashboard', 'developer'],
    queryFn: async () => {
      const res = await api.get('/dashboard/developer');
      return res.data;
    }
  });

  if (isLoading) {
    return <div className="h-64 bg-slate-900 border border-slate-800 rounded-xl animate-pulse" />;
  }

  const { taskStats = {}, weeklyProductivity = [] } = dashboardData || {};

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-slate-100">My Productivity Metrics</h2>
        <p className="text-xs text-slate-400">Weekly breakdown of task status deliverables and time logs</p>
      </div>

      {/* Grid of highlight badges */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <Card hoverable className="flex items-center gap-4">
          <div className="p-3 bg-indigo-600/10 rounded-xl text-indigo-400 border border-indigo-500/10">
            <Award size={22} />
          </div>
          <div>
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Developer Level</h4>
            <p className="text-base font-bold text-slate-200">Senior Contributor</p>
          </div>
        </Card>
        <Card hoverable className="flex items-center gap-4">
          <div className="p-3 bg-emerald-600/10 rounded-xl text-emerald-400 border border-emerald-500/10">
            <Zap size={22} />
          </div>
          <div>
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Task Completion Ratio</h4>
            <p className="text-base font-bold text-slate-200">{taskStats.completionPercent || 0}% Completed</p>
          </div>
        </Card>
        <Card hoverable className="flex items-center gap-4">
          <div className="p-3 bg-red-600/10 rounded-xl text-red-400 border border-red-500/10">
            <ShieldAlert size={22} />
          </div>
          <div>
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Blockers Hit</h4>
            <p className="text-base font-bold text-slate-200">{taskStats.blocked || 0} active</p>
          </div>
        </Card>
      </div>

      {/* Charts section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Card>
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-slate-200">Hours Logged vs Target</h3>
            <p className="text-xs text-slate-500">Daily actual logged hours compared to 8-hour target</p>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={weeklyProductivity}>
                <defs>
                  <linearGradient id="colorHours" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="date" stroke="#64748b" fontSize={10} tickFormatter={(val) => new Date(val).toLocaleDateString([], { weekday: 'short' })} />
                <YAxis stroke="#64748b" fontSize={10} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155' }} />
                <Area type="monotone" dataKey="totalHours" stroke="#6366f1" fillOpacity={1} fill="url(#colorHours)" strokeWidth={2} name="Logged Hours" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-slate-200">Completed Tasks Breakdown</h3>
            <p className="text-xs text-slate-500">Quantity of task entries finished per day</p>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyProductivity}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="date" stroke="#64748b" fontSize={10} tickFormatter={(val) => new Date(val).toLocaleDateString([], { weekday: 'short' })} />
                <YAxis stroke="#64748b" fontSize={10} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155' }} />
                <Bar dataKey="completedTasks" fill="#10b981" radius={[4, 4, 0, 0]} name="Completed Tasks" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    </div>
  );
};
export default ProductivityPage;
