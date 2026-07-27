import React from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../lib/axios';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Users, FileCheck, ShieldAlert, Award } from 'lucide-react';

export const TeamAnalyticsPage: React.FC = () => {
  const { data: analytics, isLoading } = useQuery({
    queryKey: ['manager', 'analytics'],
    queryFn: async () => {
      const res = await api.get('/manager/analytics');
      return res.data;
    }
  });

  const { data: team = [] } = useQuery({
    queryKey: ['manager', 'team'],
    queryFn: async () => {
      const res = await api.get('/manager/team');
      return res.data;
    }
  });

  if (isLoading) {
    return <div className="h-64 bg-slate-900 border border-slate-800 rounded-xl animate-pulse" />;
  }

  const chartData = team.map((dev: any) => ({
    name: `${dev.firstName} ${dev.lastName}`,
    completed: dev._count?.tasks || 0
  }));

  const stats = [
    { title: 'Total Team Members', value: analytics?.teamSize || 0, icon: <Users size={20} /> },
    { title: 'Tasks Completed by Team', value: analytics?.completedTasks || 0, icon: <FileCheck size={20} className="text-emerald-400" /> },
    { title: 'Active Blockers in Team', value: analytics?.blockedTasks || 0, icon: <ShieldAlert size={20} className="text-red-400" /> }
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-slate-100">Team Performance & Analytics</h2>
        <p className="text-xs text-slate-400">View team-wide task delivery rates and blocker distribution</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {stats.map((stat, idx) => (
          <Card key={idx} hoverable className="flex items-center gap-4">
            <div className="p-3 bg-slate-950 border border-slate-850 rounded-xl text-slate-300">
              {stat.icon}
            </div>
            <div>
              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wide">{stat.title}</h4>
              <p className="text-xl font-bold text-slate-200">{stat.value}</p>
            </div>
          </Card>
        ))}
      </div>

      {/* Grid of chart & developer overview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Comparison chart */}
        <Card className="lg:col-span-8">
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-slate-200">Completed Tasks Comparison</h3>
            <p className="text-xs text-slate-500">Total completed tasks per developer</p>
          </div>
          <div className="h-64 w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="name" stroke="#64748b" fontSize={10} />
                <YAxis stroke="#64748b" fontSize={10} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155' }} />
                <Bar dataKey="completed" fill="#6366f1" radius={[4, 4, 0, 0]} name="Completed Tasks" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Top performer card */}
        <Card className="lg:col-span-4 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-semibold text-slate-200 mb-4">Team Highlights</h3>
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <Award size={24} className="text-indigo-400" />
                <div>
                  <h4 className="text-xs font-semibold text-slate-300">Highest Completion Rate</h4>
                  <p className="text-xs text-slate-500">Engineering Department leads with 88%</p>
                </div>
              </div>
            </div>
          </div>
          <div className="p-3 bg-indigo-600/5 border border-indigo-500/10 rounded-lg mt-6">
            <p className="text-[10px] text-slate-400 leading-normal">
              Productivity scores are calculated based on log consistency, completed tasks ratios, and blocker resolutions.
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
};
export default TeamAnalyticsPage;
