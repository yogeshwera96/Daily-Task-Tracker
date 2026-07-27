import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../lib/axios';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Modal from '../../components/ui/Modal';
import EmptyState from '../../components/ui/EmptyState';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Plus,
  Edit2,
  Trash2,
  Search,
  SlidersHorizontal,
  User,
  Calendar,
  Clock,
  ChevronDown
} from 'lucide-react';
import toast from 'react-hot-toast';

const taskFormSchema = z.object({
  title: z.string().min(1, 'Task title is required').max(150),
  description: z.string().optional().default(''),
  projectId: z.string().uuid('Please select a project').optional().or(z.literal('')),
  userId: z.string().uuid('Please select a team member'),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
  status: z.enum(['TODO', 'IN_PROGRESS', 'COMPLETED', 'BLOCKED', 'ON_HOLD', 'TESTING', 'REVIEW']),
  category: z.string().optional().default(''),
  module: z.string().optional().default(''),
  estimatedHours: z.number().min(0).optional().default(0),
  actualHours: z.number().min(0).optional().default(0),
  remarks: z.string().optional().default(''),
  tags: z.string().optional().default(''),
  dueDate: z.string().optional().or(z.literal('')),
});

type TaskFormData = z.infer<typeof taskFormSchema>;

const PRIORITY_COLORS: Record<string, 'danger' | 'warning' | 'info' | 'success'> = {
  CRITICAL: 'danger',
  HIGH: 'warning',
  MEDIUM: 'info',
  LOW: 'success',
};

const STATUS_COLORS: Record<string, 'danger' | 'warning' | 'info' | 'success' | 'default'> = {
  COMPLETED: 'success',
  BLOCKED: 'danger',
  IN_PROGRESS: 'info',
  REVIEW: 'warning',
  TESTING: 'warning',
  TODO: 'default',
  ON_HOLD: 'default',
};

export const ManagerTasksPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [selectedMember, setSelectedMember] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<any>(null);

  // Fetch team members
  const { data: team = [] } = useQuery({
    queryKey: ['manager', 'team'],
    queryFn: async () => {
      const res = await api.get('/manager/team');
      return res.data;
    },
  });

  // Fetch projects
  const { data: projects = [] } = useQuery({
    queryKey: ['projects', 'active'],
    queryFn: async () => {
      const res = await api.get('/admin/projects');
      return res.data.projects ?? res.data;
    },
  });

  // Fetch tasks (filter by selected team member)
  const tasksQuery = useQuery({
    queryKey: ['manager-tasks', { search, statusFilter, priorityFilter, selectedMember }],
    queryFn: async () => {
      const params: Record<string, string> = {};
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;
      if (priorityFilter) params.priority = priorityFilter;
      if (selectedMember) params.userId = selectedMember;
      const res = await api.get('/tasks', { params });
      return res.data;
    },
    enabled: selectedMember !== '', // Only query once a member is selected (or all)
  });

  // Fetch all team tasks when no specific member is selected
  const allTeamTasksQuery = useQuery({
    queryKey: ['manager-tasks', 'all', { search, statusFilter, priorityFilter }],
    queryFn: async () => {
      const allTasks: any[] = [];
      for (const member of team) {
        const params: Record<string, string> = { userId: member.id };
        if (search) params.search = search;
        if (statusFilter) params.status = statusFilter;
        if (priorityFilter) params.priority = priorityFilter;
        const res = await api.get('/tasks', { params });
        const memberTasks = (res.data.tasks ?? []).map((t: any) => ({
          ...t,
          _assignee: member,
        }));
        allTasks.push(...memberTasks);
      }
      return { tasks: allTasks };
    },
    enabled: selectedMember === '' && team.length > 0,
  });

  const displayedTasks =
    selectedMember !== ''
      ? tasksQuery.data?.tasks ?? []
      : allTeamTasksQuery.data?.tasks ?? [];

  const isLoading =
    selectedMember !== '' ? tasksQuery.isLoading : allTeamTasksQuery.isLoading;

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<TaskFormData>({
    resolver: zodResolver(taskFormSchema),
    defaultValues: {
      title: '',
      description: '',
      projectId: '',
      userId: team[0]?.id ?? '',
      priority: 'MEDIUM',
      status: 'TODO',
      category: '',
      module: '',
      estimatedHours: 0,
      actualHours: 0,
      remarks: '',
      tags: '',
      dueDate: '',
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await api.post('/tasks', data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['manager-tasks'] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const res = await api.put(`/tasks/${id}`, data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['manager-tasks'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/tasks/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['manager-tasks'] });
    },
  });

  const handleOpenCreate = () => {
    setEditingTask(null);
    reset({
      title: '',
      description: '',
      projectId: '',
      userId: selectedMember || team[0]?.id || '',
      priority: 'MEDIUM',
      status: 'TODO',
      category: '',
      module: '',
      estimatedHours: 0,
      actualHours: 0,
      remarks: '',
      tags: '',
      dueDate: '',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (task: any) => {
    setEditingTask(task);
    reset({
      title: task.title,
      description: task.description || '',
      projectId: task.projectId || '',
      userId: task.userId || task._assignee?.id || '',
      priority: task.priority,
      status: task.status,
      category: task.category || '',
      module: task.module || '',
      estimatedHours: task.estimatedHours || 0,
      actualHours: task.actualHours || 0,
      remarks: task.remarks || '',
      tags: task.tags || '',
      dueDate: task.dueDate ? task.dueDate.substring(0, 16) : '',
    });
    setIsModalOpen(true);
  };

  const onSubmit = async (data: TaskFormData) => {
    const payload = {
      ...data,
      projectId: data.projectId === '' ? undefined : data.projectId,
      dueDate: data.dueDate
        ? new Date(data.dueDate).toISOString()
        : undefined,
    };

    try {
      if (editingTask) {
        await updateMutation.mutateAsync({ id: editingTask.id, data: payload });
        toast.success('Task updated successfully!');
      } else {
        await createMutation.mutateAsync(payload);
        toast.success('Task assigned successfully!');
      }
      setIsModalOpen(false);
    } catch {
      toast.error('Failed to save task.');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this task? This action cannot be undone.')) return;
    try {
      await deleteMutation.mutateAsync(id);
      toast.success('Task removed.');
    } catch {
      toast.error('Failed to delete task.');
    }
  };

  const memberOptions = [
    { value: '', label: 'All Team Members' },
    ...team.map((m: any) => ({
      value: m.id,
      label: `${m.firstName} ${m.lastName}`,
    })),
  ];

  const assigneeOptions = team.map((m: any) => ({
    value: m.id,
    label: `${m.firstName} ${m.lastName} — ${m.designation || 'Developer'}`,
  }));

  const projectOptions = [
    { value: '', label: 'General / No Project' },
    ...projects.map((p: any) => ({ value: p.id, label: p.name })),
  ];

  const getAssigneeName = (task: any) => {
    if (task._assignee) {
      return `${task._assignee.firstName} ${task._assignee.lastName}`;
    }
    const member = team.find((m: any) => m.id === task.userId);
    return member ? `${member.firstName} ${member.lastName}` : 'Unknown';
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-100">Team Task Assignment</h2>
          <p className="text-xs text-slate-400">Create and manage tasks for your team developers</p>
        </div>
        <Button variant="primary" icon={<Plus size={16} />} onClick={handleOpenCreate}>
          Assign New Task
        </Button>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Team Members', value: team.length, color: 'text-indigo-400' },
          { label: 'Total Tasks', value: displayedTasks.length, color: 'text-slate-200' },
          {
            label: 'In Progress',
            value: displayedTasks.filter((t: any) => t.status === 'IN_PROGRESS').length,
            color: 'text-blue-400',
          },
          {
            label: 'Completed',
            value: displayedTasks.filter((t: any) => t.status === 'COMPLETED').length,
            color: 'text-emerald-400',
          },
        ].map((s) => (
          <Card key={s.label} className="text-center py-4">
            <p className={`text-2xl font-extrabold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-slate-400 mt-1">{s.label}</p>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <Card className="flex flex-col md:flex-row gap-4 items-center">
        <div className="flex-1 w-full">
          <Input
            placeholder="Search tasks..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            icon={<Search size={16} />}
          />
        </div>
        <div className="flex flex-wrap gap-3 w-full md:w-auto">
          <Select
            options={memberOptions}
            value={selectedMember}
            onChange={(e) => setSelectedMember(e.target.value)}
            icon={<User size={14} />}
          />
          <Select
            options={[
              { value: '', label: 'All Statuses' },
              { value: 'TODO', label: 'Todo' },
              { value: 'IN_PROGRESS', label: 'In Progress' },
              { value: 'COMPLETED', label: 'Completed' },
              { value: 'BLOCKED', label: 'Blocked' },
              { value: 'REVIEW', label: 'Review' },
            ]}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            icon={<SlidersHorizontal size={14} />}
          />
          <Select
            options={[
              { value: '', label: 'All Priorities' },
              { value: 'LOW', label: 'Low' },
              { value: 'MEDIUM', label: 'Medium' },
              { value: 'HIGH', label: 'High' },
              { value: 'CRITICAL', label: 'Critical' },
            ]}
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            icon={<ChevronDown size={14} />}
          />
        </div>
      </Card>

      {/* Task List */}
      {isLoading ? (
        <div className="flex flex-col gap-4">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-20 bg-slate-900 border border-slate-800 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : displayedTasks.length === 0 ? (
        <EmptyState
          title="No tasks found"
          description="No tasks match your filters. Assign a new task to get started."
          action={
            <Button variant="primary" icon={<Plus size={16} />} onClick={handleOpenCreate}>
              Assign Task
            </Button>
          }
        />
      ) : (
        <div className="flex flex-col gap-3">
          {displayedTasks.map((task: any) => (
            <Card key={task.id} hoverable className="flex items-center justify-between gap-4">
              <div className="flex flex-col gap-1.5 min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h4 className="text-sm font-semibold text-slate-100 truncate">{task.title}</h4>
                  <Badge variant={PRIORITY_COLORS[task.priority] ?? 'default'}>{task.priority}</Badge>
                  <Badge variant={STATUS_COLORS[task.status] ?? 'default'}>{task.status}</Badge>
                </div>
                {task.description && (
                  <p className="text-xs text-slate-400 truncate">{task.description}</p>
                )}
                <div className="flex flex-wrap gap-3 text-[10px] text-slate-500 font-medium">
                  <span className="flex items-center gap-1">
                    <User size={11} />
                    {getAssigneeName(task)}
                  </span>
                  {task.project && (
                    <span>{task.project.name}</span>
                  )}
                  <span className="flex items-center gap-1">
                    <Clock size={11} />
                    {task.actualHours || 0}h / {task.estimatedHours || 0}h est.
                  </span>
                  {task.dueDate && (
                    <span className="flex items-center gap-1">
                      <Calendar size={11} />
                      Due: {new Date(task.dueDate).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleOpenEdit(task)}
                  className="p-2 cursor-pointer"
                >
                  <Edit2 size={14} />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(task.id)}
                  className="p-2 cursor-pointer hover:text-red-400"
                >
                  <Trash2 size={14} />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Assign / Edit Task Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingTask ? 'Edit Task' : 'Assign New Task'}
        size="lg"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Assignee - Full width */}
          <div className="md:col-span-2">
            <Select
              label="Assign To"
              options={assigneeOptions}
              error={errors.userId?.message}
              {...register('userId')}
            />
          </div>

          {/* Title - Full width */}
          <div className="md:col-span-2">
            <Input
              label="Task Title"
              placeholder="What should the developer work on?"
              error={errors.title?.message}
              {...register('title')}
            />
          </div>

          {/* Description - Full width */}
          <div className="md:col-span-2">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Description
              </label>
              <textarea
                placeholder="Describe the task in detail — steps, context, acceptance criteria..."
                className="w-full bg-slate-900 border border-slate-800 text-sm text-slate-100 rounded-lg p-3 h-24 focus:outline-none focus:border-indigo-500 resize-none"
                {...register('description')}
              />
            </div>
          </div>

          <Select
            label="Project"
            options={projectOptions}
            error={errors.projectId?.message}
            {...register('projectId')}
          />
          <Select
            label="Priority"
            options={[
              { value: 'LOW', label: 'Low Priority' },
              { value: 'MEDIUM', label: 'Medium Priority' },
              { value: 'HIGH', label: 'High Priority' },
              { value: 'CRITICAL', label: 'Critical Alert' },
            ]}
            error={errors.priority?.message}
            {...register('priority')}
          />

          <Select
            label="Status"
            options={[
              { value: 'TODO', label: 'To Do' },
              { value: 'IN_PROGRESS', label: 'In Progress' },
              { value: 'COMPLETED', label: 'Completed' },
              { value: 'BLOCKED', label: 'Blocked' },
              { value: 'ON_HOLD', label: 'On Hold' },
              { value: 'TESTING', label: 'Testing' },
              { value: 'REVIEW', label: 'Review' },
            ]}
            error={errors.status?.message}
            {...register('status')}
          />

          <Input
            label="Due Date"
            type="datetime-local"
            error={errors.dueDate?.message}
            {...register('dueDate')}
          />

          <Input
            label="Feature Module"
            placeholder="e.g., Auth, Cart, Dashboard"
            {...register('module')}
          />
          <Input
            label="Category"
            placeholder="e.g., Backend, Bug Fix, UI"
            {...register('category')}
          />

          <Input
            label="Estimated Hours"
            type="number"
            step="0.5"
            error={errors.estimatedHours?.message}
            {...register('estimatedHours', { valueAsNumber: true })}
          />
          <Input
            label="Actual Hours"
            type="number"
            step="0.5"
            error={errors.actualHours?.message}
            {...register('actualHours', { valueAsNumber: true })}
          />

          <div className="md:col-span-2">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Remarks / Notes
              </label>
              <textarea
                placeholder="Any additional remarks or blocker details..."
                className="w-full bg-slate-900 border border-slate-800 text-sm text-slate-100 rounded-lg p-3 h-20 focus:outline-none focus:border-indigo-500 resize-none"
                {...register('remarks')}
              />
            </div>
          </div>

          <div className="md:col-span-2 flex justify-end gap-3 mt-2">
            <Button variant="secondary" type="button" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              type="submit"
              loading={createMutation.isPending || updateMutation.isPending}
            >
              {editingTask ? 'Update Task' : 'Assign Task'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default ManagerTasksPage;
