import React from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../lib/axios';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, Clock, AlertCircle, FileText, Plus } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export const DeveloperDashboard: React.FC = () => {
  const navigate = useNavigate();

  const { data: dashboardData, isLoading } = useQuery({
    queryKey: ['dashboard', 'developer'],
    queryFn: async () => {
      const res = await api.get('/dashboard/developer');
      return res.data;
    }
  });

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6 animate-pulse">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="h-28 bg-slate-900 border border-slate-800 rounded-xl" />
          ))}
        </div>
        <div className="h-64 bg-slate-900 border border-slate-800 rounded-xl" />
      </div>
    );
  }

  const { taskStats = {}, todayTasks = [], weeklyProductivity = [] } = dashboardData || {};

  const statsCards = [
    {
      title: "Today's Completion Rate",
      value: `${taskStats.completionPercent || 0}%`,
      icon: <CheckCircle size={22} className="text-emerald-500" />,
      desc: `${taskStats.completed || 0} of ${taskStats.todayTasks || 0} completed`
    },
    {
      title: 'Hours Logged Today',
      value: `${taskStats.totalHours || 0} hrs`,
      icon: <Clock size={22} className="text-indigo-400" />,
      desc: 'Standard daily limit: 8h'
    },
    {
      title: 'Blocked Tasks',
      value: taskStats.blocked || 0,
      icon: <AlertCircle size={22} className="text-red-500" />,
      desc: 'Active blockers'
    },
    {
      title: 'Pending Deliverables',
      value: taskStats.pending || 0,
      icon: <Clock size={22} className="text-amber-500" />,
      desc: 'Todo or In Progress'
    }
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* Overview stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {statsCards.map((card, idx) => (
          <Card key={idx} hoverable>
            <div className="flex items-start justify-between">
              <div>
                <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  {card.title}
                </h4>
                <p className="text-2xl font-bold text-slate-100">{card.value}</p>
              </div>
              <div className="p-2 rounded-lg bg-slate-950 border border-slate-850">{card.icon}</div>
            </div>
            <p className="text-[10px] text-slate-500 mt-4 leading-normal">{card.desc}</p>
          </Card>
        ))}
      </div>

      {/* Chart & Today's Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Productivity trend */}
        <Card className="lg:col-span-8 flex flex-col justify-between">
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-slate-200">Daily Task Completion Trend</h3>
            <p className="text-xs text-slate-500">Task metric history over the past week</p>
          </div>
          <div className="h-56 w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={weeklyProductivity}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="date" stroke="#64748b" fontSize={11} tickFormatter={(val) => new Date(val).toLocaleDateString([], { month: 'short', day: 'numeric' })} />
                <YAxis stroke="#64748b" fontSize={11} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: 8 }}
                  labelStyle={{ color: '#94a3b8', fontSize: 12 }}
                  itemStyle={{ color: '#818cf8', fontSize: 12 }}
                />
                <Line type="monotone" dataKey="completedTasks" stroke="#6366f1" strokeWidth={2.5} name="Completed Tasks" />
                <Line type="monotone" dataKey="totalHours" stroke="#10b981" strokeWidth={2.5} name="Logged Hours" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Action Panel */}
        <Card className="lg:col-span-4 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-semibold text-slate-200">Submit Daily EOD</h3>
            <p className="text-xs text-slate-500 mb-6">Aggregate tasks and push AI report to manager</p>
            <div className="flex flex-col gap-3">
              <Button
                variant="primary"
                icon={<Plus size={16} />}
                onClick={() => navigate('/tasks')}
                className="w-full text-center"
              >
                Log New Tasks
              </Button>
              <Button
                variant="secondary"
                icon={<FileText size={16} />}
                onClick={() => navigate('/eod')}
                className="w-full text-center"
              >
                Compile AI EOD Report
              </Button>
            </div>
          </div>
          <div className="p-3 bg-indigo-600/5 border border-indigo-500/10 rounded-lg mt-6">
            <p className="text-[10px] text-slate-400 leading-normal">
              <strong>Notice:</strong> Automatic compilation executes at 6:00 PM on weeknights. Submit manually to check or edit content first.
            </p>
          </div>
        </Card>
      </div>

      {/* Today's logged tasks */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-semibold text-slate-200">Today's Tasks</h3>
            <p className="text-xs text-slate-500">Tasks logged for today's review cycles</p>
          </div>
          <Badge variant={todayTasks.length > 0 ? "success" : "neutral"}>
            {todayTasks.length} Logged
          </Badge>
        </div>

        {todayTasks.length === 0 ? (
          <div className="text-center py-6 text-xs text-slate-500">No tasks logged for today.</div>
        ) : (
          <div className="flex flex-col gap-3">
            {todayTasks.map((task: any) => (
              <div
                key={task.id}
                className="flex items-center justify-between p-3.5 rounded-lg bg-slate-900/60 border border-slate-800"
              >
                <div className="flex flex-col gap-1">
                  <h4 className="text-xs font-semibold text-slate-200">{task.title}</h4>
                  <span className="text-[10px] text-slate-500 font-medium">
                    {task.project?.name || 'General Task'} • Est: {task.estimatedHours || 0}h
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant={task.priority === 'CRITICAL' ? 'danger' : 'info'}>
                    {task.priority}
                  </Badge>
                  <Badge variant={task.status === 'COMPLETED' ? 'success' : 'warning'}>
                    {task.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};
export default DeveloperDashboard;
