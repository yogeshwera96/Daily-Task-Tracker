import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/axios';

export const useReports = () => {
  const queryClient = useQueryClient();

  const myReportsQuery = (page = 1, limit = 10) =>
    useQuery({
      queryKey: ['reports', 'my', { page, limit }],
      queryFn: async () => {
        const response = await api.get('/reports/my', { params: { page, limit } });
        return response.data;
      },
    });

  const todayReportQuery = useQuery({
    queryKey: ['reports', 'today'],
    queryFn: async () => {
      const response = await api.get('/reports/today');
      return response.data;
    },
  });

  const generateReportMutation = useMutation({
    mutationFn: async () => {
      const response = await api.post('/reports/generate');
      return response.data.report;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reports'] });
    },
  });

  const submitReportMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await api.post(`/reports/${id}/submit`);
      return response.data.report;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reports'] });
    },
  });

  const updateReportContentMutation = useMutation({
    mutationFn: async ({ id, content, tomorrowPlan }: { id: string; content: string; tomorrowPlan?: string }) => {
      const response = await api.put(`/reports/${id}`, { content, tomorrowPlan });
      return response.data.report;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reports'] });
    },
  });

  // Manager actions
  const teamReportsQuery = (filters: any = {}) =>
    useQuery({
      queryKey: ['reports', 'team', filters],
      queryFn: async () => {
        const response = await api.get('/reports/team/all', { params: filters });
        return response.data;
      },
    });

  const approveReportMutation = useMutation({
    mutationFn: async ({ id, comment }: { id: string; comment?: string }) => {
      const response = await api.post(`/reports/${id}/approve`, { comment });
      return response.data.report;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reports'] });
    },
  });

  const rejectReportMutation = useMutation({
    mutationFn: async ({ id, comment }: { id: string; comment: string }) => {
      const response = await api.post(`/reports/${id}/reject`, { comment });
      return response.data.report;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reports'] });
    },
  });

  return {
    myReportsQuery,
    todayReportQuery,
    generateReport: generateReportMutation.mutateAsync,
    submitReport: submitReportMutation.mutateAsync,
    updateReportContent: updateReportContentMutation.mutateAsync,
    teamReportsQuery,
    approveReport: approveReportMutation.mutateAsync,
    rejectReport: rejectReportMutation.mutateAsync,
    isGenerating: generateReportMutation.isPending,
    isSubmitting: submitReportMutation.isPending,
  };
};
