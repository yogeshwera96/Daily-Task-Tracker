import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/axios';

export const useTasks = (filters: any = {}) => {
  const queryClient = useQueryClient();

  const tasksQuery = useQuery({
    queryKey: ['tasks', filters],
    queryFn: async () => {
      const response = await api.get('/tasks', { params: filters });
      return response.data;
    },
  });

  const todayTasksQuery = useQuery({
    queryKey: ['tasks', 'today'],
    queryFn: async () => {
      const response = await api.get('/tasks/today');
      return response.data;
    },
  });

  const taskStatsQuery = useQuery({
    queryKey: ['tasks', 'stats'],
    queryFn: async () => {
      const response = await api.get('/tasks/stats');
      return response.data;
    },
  });

  const createTaskMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await api.post('/tasks', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });

  const updateTaskMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const response = await api.put(`/tasks/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });

  const deleteTaskMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await api.delete(`/tasks/${id}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });

  return {
    tasksQuery,
    todayTasksQuery,
    taskStatsQuery,
    createTask: createTaskMutation.mutateAsync,
    updateTask: updateTaskMutation.mutateAsync,
    deleteTask: deleteTaskMutation.mutateAsync,
    isCreating: createTaskMutation.isPending,
    isUpdating: updateTaskMutation.isPending,
    isDeleting: deleteTaskMutation.isPending,
  };
};
