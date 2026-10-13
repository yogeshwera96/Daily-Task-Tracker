import React from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../lib/axios';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import { Shield, Users, Layers, Activity } from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const { data: dashboardData, isLoading } = useQuery({
    queryKey: ['dashboard', 'admin'],
    queryFn: async () => {
      const res = await api.get('/dashboard/admin');
      return res.data;
    }
  });

  if (isLoading) {
    return <div className="h-64 bg-slate-900 border border-slate-800 rounded-xl animate-pulse" />;
  }

  const {
    totalEmployees = 0,
    totalManagers = 0,
    totalProjects = 0,
    totalDepartments = 0,
    recentLogs = []
  } = dashboardData || {};

  const cards = [
    { title: 'Registered Developers', value: totalEmployees, icon: <Users className="text-indigo-400" /> },
    { title: 'Management Users', value: totalManagers, icon: <Shield className="text-indigo-400" /> },
    { title: 'Monitored Projects', value: totalProjects, icon: <Layers className="text-emerald-400" /> },
    { title: 'Departments Active', value: totalDepartments, icon: <Activity className="text-amber-400" /> }
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {cards.map((c, idx) => (
          <Card key={idx} hoverable>
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  {c.title}
                </h4>
                <p className="text-2xl font-bold text-slate-100">{c.value}</p>
              </div>
              <div className="p-2 rounded-lg bg-slate-950 border border-slate-850">{c.icon}</div>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Audit Logs list */}
        <Card className="lg:col-span-12">
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-slate-200">System Audit Logs</h3>
            <p className="text-xs text-slate-500">Chronological history of security, task, and EOD report actions</p>
          </div>

          <div className="flex flex-col gap-3">
            {recentLogs.length === 0 ? (
              <div className="text-center py-6 text-xs text-slate-500">No logs captured recently.</div>
            ) : (
              recentLogs.map((log: any) => (
                <div
                  key={log.id}
                  className="flex items-center justify-between p-3.5 rounded-lg bg-slate-900/60 border border-slate-800 text-xs"
                >
                  <div className="flex items-center gap-4">
                    <span className="font-semibold text-slate-300">
                      {log.user?.firstName} {log.user?.lastName}
                    </span>
                    <span className="text-slate-400">{log.details}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant="neutral">{log.action}</Badge>
                    <span className="text-slate-500">
                      {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};
export default AdminDashboard;
