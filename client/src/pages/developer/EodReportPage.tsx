import React, { useState } from 'react';
import { useReports } from '../../hooks/useReports';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import EmptyState from '../../components/ui/EmptyState';
import { FileSpreadsheet, Sparkles, Send, Check } from 'lucide-react';
import toast from 'react-hot-toast';

export const EodReportPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'today' | 'history'>('today');
  const [reportContent, setReportContent] = useState('');
  const [tomorrowPlan, setTomorrowPlan] = useState('');

  const { todayReportQuery, myReportsQuery, generateReport, submitReport, updateReportContent, isGenerating, isSubmitting } = useReports();
  const historyQuery = myReportsQuery(1, 20);

  const handleGenerate = async () => {
    try {
      const report = await generateReport();
      setReportContent(report.content);
      setTomorrowPlan(report.tomorrowPlan || '');
      toast.success('AI compiled today\'s tasks successfully!');
      todayReportQuery.refetch();
    } catch (err: any) {
      const msg = err.response?.data?.error || 'Failed to compile tasks.';
      toast.error(msg);
    }
  };

  const handleSaveDraft = async () => {
    const report = todayReportQuery.data;
    if (!report) return;

    try {
      await updateReportContent({ id: report.id, content: reportContent, tomorrowPlan });
      toast.success('Draft saved successfully!');
      todayReportQuery.refetch();
    } catch (err) {
      toast.error('Failed to save draft.');
    }
  };

  const handleSubmit = async () => {
    const report = todayReportQuery.data;
    if (!report) return;

    try {
      // First save changes
      await updateReportContent({ id: report.id, content: reportContent, tomorrowPlan });
      // Then submit
      await submitReport(report.id);
      toast.success('EOD Report submitted to your manager!');
      todayReportQuery.refetch();
      historyQuery.refetch();
    } catch (err) {
      toast.error('Failed to submit EOD report.');
    }
  };

  // Sync state if report is loaded
  React.useEffect(() => {
    if (todayReportQuery.data) {
      setReportContent(todayReportQuery.data.content);
      setTomorrowPlan(todayReportQuery.data.tomorrowPlan || '');
    }
  }, [todayReportQuery.data]);

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-slate-100">End of Day Reporting</h2>
        <p className="text-xs text-slate-400">Compile AI-based EOD updates and submit to manager</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 border-b border-slate-800 pb-px">
        <button
          onClick={() => setActiveTab('today')}
          className={`pb-3 text-sm font-semibold border-b-2 transition-all cursor-pointer ${
            activeTab === 'today'
              ? 'border-indigo-500 text-indigo-400 font-bold'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Today's Compilation
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`pb-3 text-sm font-semibold border-b-2 transition-all cursor-pointer ${
            activeTab === 'history'
              ? 'border-indigo-500 text-indigo-400 font-bold'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Submission History
        </button>
      </div>

      {activeTab === 'today' && (
        <div className="flex flex-col gap-5">
          {todayReportQuery.isLoading ? (
            <div className="h-64 bg-slate-900 border border-slate-800 rounded-xl animate-pulse" />
          ) : !todayReportQuery.data ? (
            <EmptyState
              title="No EOD compiled for today"
              description="Compile today's tasks using AI. You can edit the results before submitting."
              icon={<FileSpreadsheet size={42} className="text-slate-500" />}
              action={
                <Button
                  variant="primary"
                  icon={<Sparkles size={16} />}
                  onClick={handleGenerate}
                  loading={isGenerating}
                >
                  Compile EOD with AI
                </Button>
              }
            />
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
              {/* Compiler Area */}
              <div className="lg:col-span-8 flex flex-col gap-4">
                <Card className="flex flex-col gap-4">
                  <div className="flex items-center justify-between border-b border-slate-850 pb-3">
                    <h3 className="text-sm font-semibold text-slate-200">EOD Report Output</h3>
                    <Badge variant={todayReportQuery.data.status === 'SUBMITTED' ? 'success' : 'neutral'}>
                      {todayReportQuery.data.status}
                    </Badge>
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Report Body (Markdown)</label>
                    <textarea
                      value={reportContent}
                      onChange={(e) => setReportContent(e.target.value)}
                      disabled={todayReportQuery.data.status === 'SUBMITTED'}
                      className="w-full bg-slate-900 border border-slate-800 text-sm text-slate-100 rounded-lg p-4 h-[350px] focus:outline-none focus:border-indigo-500 disabled:opacity-60"
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Tomorrow's Plan (Optional)</label>
                    <textarea
                      value={tomorrowPlan}
                      onChange={(e) => setTomorrowPlan(e.target.value)}
                      disabled={todayReportQuery.data.status === 'SUBMITTED'}
                      placeholder="List focus items for tomorrow..."
                      className="w-full bg-slate-900 border border-slate-800 text-sm text-slate-100 rounded-lg p-3 h-20 focus:outline-none focus:border-indigo-500 disabled:opacity-60"
                    />
                  </div>

                  {todayReportQuery.data.status !== 'SUBMITTED' && (
                    <div className="flex justify-end gap-3 border-t border-slate-850 pt-4">
                      <Button variant="secondary" onClick={handleSaveDraft} className="cursor-pointer">
                        Save Draft
                      </Button>
                      <Button
                        variant="primary"
                        icon={<Send size={16} />}
                        onClick={handleSubmit}
                        loading={isSubmitting}
                        className="cursor-pointer"
                      >
                        Submit EOD Report
                      </Button>
                    </div>
                  )}
                </Card>
              </div>

              {/* Status details panel */}
              <div className="lg:col-span-4 flex flex-col gap-4">
                <Card>
                  <h3 className="text-sm font-semibold text-slate-200 mb-4">Report Details</h3>
                  <div className="flex flex-col gap-3.5 text-xs">
                    <div className="flex justify-between py-1 border-b border-slate-850">
                      <span className="text-slate-400">Date</span>
                      <span className="font-semibold text-slate-200">{new Date(todayReportQuery.data.date).toLocaleDateString()}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-850">
                      <span className="text-slate-400">Total Hours Logged</span>
                      <span className="font-semibold text-indigo-400">{todayReportQuery.data.totalHours} hrs</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-850">
                      <span className="text-slate-400">Tasks Completed</span>
                      <span className="font-semibold text-emerald-400">{todayReportQuery.data.completedTasks}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-850">
                      <span className="text-slate-400">Tasks Pending</span>
                      <span className="font-semibold text-amber-400">{todayReportQuery.data.pendingTasks}</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-slate-400">Blocked Tasks</span>
                      <span className="font-semibold text-red-400">{todayReportQuery.data.blockedTasks}</span>
                    </div>
                  </div>
                </Card>

                {todayReportQuery.data.managerComment && (
                  <Card className="border-indigo-500/20 bg-indigo-600/5">
                    <h4 className="text-xs font-semibold text-indigo-400 uppercase tracking-wider mb-2">Manager Review Note</h4>
                    <p className="text-xs text-slate-300 leading-normal">{todayReportQuery.data.managerComment}</p>
                  </Card>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'history' && (
        <div className="flex flex-col gap-4">
          {historyQuery.isLoading ? (
            <div className="h-64 bg-slate-900 border border-slate-800 rounded-xl animate-pulse" />
          ) : !historyQuery.data?.reports || historyQuery.data.reports.length === 0 ? (
            <div className="text-center py-10 text-slate-500 text-xs">No reports submitted yet.</div>
          ) : (
            <div className="flex flex-col gap-4">
              {historyQuery.data.reports.map((report: any) => (
                <Card key={report.id} className="flex flex-col gap-3">
                  <div className="flex items-center justify-between border-b border-slate-850 pb-2">
                    <span className="text-xs font-bold text-slate-200">
                      {new Date(report.date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                    </span>
                    <Badge variant={report.status === 'APPROVED' ? 'success' : report.status === 'REJECTED' ? 'danger' : 'info'}>
                      {report.status}
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-400 whitespace-pre-line leading-relaxed">{report.content}</p>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
export default EodReportPage;
