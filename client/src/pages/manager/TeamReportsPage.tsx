import React, { useState } from 'react';
import { useReports } from '../../hooks/useReports';
import { useQuery } from '@tanstack/react-query';
import api from '../../lib/axios';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Select from '../../components/ui/Select';
import Modal from '../../components/ui/Modal';
import Table from '../../components/ui/Table';
import toast from 'react-hot-toast';
import { Check, X } from 'lucide-react';

export const TeamReportsPage: React.FC = () => {
  const [selectedReport, setSelectedReport] = useState<any>(null);
  const [reviewComment, setReviewComment] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [employeeFilter, setEmployeeFilter] = useState('');

  const { teamReportsQuery, approveReport, rejectReport } = useReports();
  const reportsQuery = teamReportsQuery({
    status: statusFilter || undefined,
    employeeId: employeeFilter || undefined
  });

  const { data: team = [] } = useQuery({
    queryKey: ['manager', 'team'],
    queryFn: async () => {
      const res = await api.get('/manager/team');
      return res.data;
    }
  });

  const handleOpenReview = (report: any) => {
    setSelectedReport(report);
    setReviewComment(report.managerComment || '');
  };

  const handleApprove = async () => {
    if (!selectedReport) return;
    try {
      await approveReport({ id: selectedReport.id, comment: reviewComment });
      toast.success('Report approved!');
      setSelectedReport(null);
      reportsQuery.refetch();
    } catch (err) {
      toast.error('Failed to approve report.');
    }
  };

  const handleReject = async () => {
    if (!selectedReport) return;
    if (!reviewComment) {
      toast.error('Please specify a rejection comment for modification request.');
      return;
    }
    try {
      await rejectReport({ id: selectedReport.id, comment: reviewComment });
      toast.success('Report sent back for modification.');
      setSelectedReport(null);
      reportsQuery.refetch();
    } catch (err) {
      toast.error('Failed to reject report.');
    }
  };

  const employeeOptions = [
    { value: '', label: 'All Developers' },
    ...team.map((m: any) => ({ value: m.id, label: `${m.firstName} ${m.lastName}` }))
  ];

  const columns = [
    {
      header: 'Developer',
      render: (r: any) => (
        <span className="font-semibold text-slate-200">
          {r.user?.firstName} {r.user?.lastName}
        </span>
      )
    },
    {
      header: 'Date',
      render: (r: any) => new Date(r.date).toLocaleDateString()
    },
    {
      header: 'Completed Tasks',
      render: (r: any) => (
        <Badge variant="success">{r.completedTasks} completed</Badge>
      )
    },
    {
      header: 'Hours logged',
      render: (r: any) => `${r.totalHours} hrs`
    },
    {
      header: 'Status',
      render: (r: any) => (
        <Badge variant={r.status === 'APPROVED' ? 'success' : r.status === 'REJECTED' ? 'danger' : 'info'}>
          {r.status}
        </Badge>
      )
    },
    {
      header: 'Action',
      render: (r: any) => (
        <Button variant="ghost" size="sm" onClick={() => handleOpenReview(r)} className="cursor-pointer font-bold text-indigo-400">
          Review Report
        </Button>
      )
    }
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-slate-100">Team EOD Reports</h2>
        <p className="text-xs text-slate-400">Filter, review, and approve team member updates</p>
      </div>

      {/* Filters Card */}
      <Card className="flex flex-col md:flex-row gap-4 items-center">
        <div className="flex-1 w-full">
          <Select
            label="Developer"
            options={employeeOptions}
            value={employeeFilter}
            onChange={(e) => setEmployeeFilter(e.target.value)}
          />
        </div>
        <div className="flex-1 w-full">
          <Select
            label="Status"
            options={[
              { value: '', label: 'All Statuses' },
              { value: 'SUBMITTED', label: 'Submitted' },
              { value: 'APPROVED', label: 'Approved' },
              { value: 'REJECTED', label: 'Rejected / Sent Back' }
            ]}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          />
        </div>
      </Card>

      {/* Reports Table */}
      <Table
        data={reportsQuery.data?.reports || []}
        columns={columns}
        keyExtractor={(item) => item.id}
        loading={reportsQuery.isLoading}
        emptyMessage="No submitted EOD reports match current filters."
      />

      {/* Review Modal */}
      <Modal
        isOpen={selectedReport !== null}
        onClose={() => setSelectedReport(null)}
        title="Review Submitted EOD Report"
        size="lg"
      >
        {selectedReport && (
          <div className="flex flex-col gap-5">
            {/* Developer Details */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Developer</h4>
                <p className="text-sm font-bold text-slate-200">
                  {selectedReport.user?.firstName} {selectedReport.user?.lastName}
                </p>
              </div>
              <div className="text-right">
                <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Submitted Date</h4>
                <p className="text-sm font-medium text-slate-300">
                  {new Date(selectedReport.date).toLocaleDateString()}
                </p>
              </div>
            </div>

            {/* Report Content */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Submitted Report Content</label>
              <div className="p-4 bg-slate-900 border border-slate-850 rounded-xl max-h-[300px] overflow-y-auto text-xs leading-relaxed text-slate-300 whitespace-pre-line">
                {selectedReport.content}
              </div>
            </div>

            {/* Review Comment Area */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Manager Review Remarks</label>
              <textarea
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                placeholder="Add instructions, review comments, or requests for changes..."
                className="w-full bg-slate-900 border border-slate-800 text-sm text-slate-100 rounded-lg p-3 h-20 focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-3 border-t border-slate-850">
              <Button variant="danger" icon={<X size={16} />} onClick={handleReject} className="cursor-pointer">
                Send Back for Changes
              </Button>
              <Button variant="success" icon={<Check size={16} />} onClick={handleApprove} className="cursor-pointer">
                Approve Report
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
export default TeamReportsPage;
