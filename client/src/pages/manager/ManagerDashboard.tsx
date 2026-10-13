import React from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../lib/axios';
import Card from '../../components/ui/Card';
import { Users, FileCheck, AlertTriangle, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const ManagerDashboard: React.FC = () => {
  const navigate = useNavigate();

  const { data: dashboardData, isLoading } = useQuery({
    queryKey: ['dashboard', 'manager'],
    queryFn: async () => {
      const res = await api.get('/dashboard/manager');
      return res.data;
    }
  });

  if (isLoading) {
    return <div className="h-64 bg-slate-900 border border-slate-800 rounded-xl animate-pulse" />;
  }

  const {
    totalEmployees = 0,
    projects = 0,
    todaySubmitted = 0,
    todayPending = 0,
    developers = [],
    recentReports = []
  } = dashboardData || {};

  const stats = [
    { title: 'Managed Developers', value: totalEmployees, icon: <Users className="text-indigo-400" /> },
    { title: 'Active Projects', value: projects, icon: <FileCheck className="text-emerald-400" /> },
    { title: 'Reports Submitted Today', value: todaySubmitted, icon: <FileCheck className="text-indigo-400" /> },
    { title: 'Reports Pending Today', value: todayPending, icon: <AlertTriangle className="text-amber-400" /> }
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {stats.map((stat, idx) => (
          <Card key={idx} hoverable>
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  {stat.title}
                </h4>
                <p className="text-2xl font-bold text-slate-100">{stat.value}</p>
              </div>
              <div className="p-2 rounded-lg bg-slate-950 border border-slate-850">{stat.icon}</div>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Managed Developers */}
        <Card className="lg:col-span-4">
          <h3 className="text-sm font-semibold text-slate-200 mb-4">Managed Team members</h3>
          <div className="flex flex-col gap-3">
            {developers.map((dev: any) => (
              <div
                key={dev.id}
                className="flex items-center gap-3 p-3 rounded-lg bg-slate-900 border border-slate-800"
              >
                <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-slate-300 text-xs">
                  {dev.firstName[0]}
                  {dev.lastName[0]}
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-slate-200">
                    {dev.firstName} {dev.lastName}
                  </h4>
                  <span className="text-[10px] text-slate-500 font-medium">{dev.designation || 'Developer'}</span>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Recent EOD Submissions */}
        <Card className="lg:col-span-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-slate-200">Recent Team reports</h3>
              <p className="text-xs text-slate-500">Latest End of Day updates submitted by developers</p>
            </div>
            <button
              onClick={() => navigate('/team-reports')}
              className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1 cursor-pointer"
            >
              See All <ChevronRight size={14} />
            </button>
          </div>

          <div className="flex flex-col gap-4">
            {recentReports.length === 0 ? (
              <div className="text-center py-6 text-xs text-slate-500">No reports submitted recently.</div>
            ) : (
              recentReports.map((report: any) => (
                <div
                  key={report.id}
                  className="p-4 rounded-xl bg-slate-900/40 border border-slate-800 hover:border-slate-700 transition-all flex flex-col gap-2"
                >
                  <div className="flex items-center justify-between border-b border-slate-850 pb-2">
                    <span className="text-xs font-semibold text-slate-200">
                      {report.user?.firstName} {report.user?.lastName}
                    </span>
                    <span className="text-[10px] text-slate-500 font-medium">
                      {new Date(report.date).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">{report.content}</p>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};
export default ManagerDashboard;
