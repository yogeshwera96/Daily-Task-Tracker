import React, { useState } from 'react';
import { useTasks } from '../../hooks/useTasks';
import { useQuery } from '@tanstack/react-query';
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
import { Plus, Edit2, Trash2, Search, SlidersHorizontal, Download } from 'lucide-react';
import toast from 'react-hot-toast';

const taskFormSchema = z.object({
  title: z.string().min(1, 'Task title is required').max(150),
  description: z.string().optional().default(''),
  projectId: z.string().uuid('Please select a project').optional().or(z.literal('')),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
  status: z.enum(['TODO', 'IN_PROGRESS', 'COMPLETED', 'BLOCKED', 'ON_HOLD', 'TESTING', 'REVIEW']),
  category: z.string().optional().default(''),
  module: z.string().optional().default(''),
  estimatedHours: z.number().min(0).optional().default(0),
  actualHours: z.number().min(0).optional().default(0),
  remarks: z.string().optional().default(''),
  tags: z.string().optional().default(''),
  dependencies: z.string().optional().default('')
});

type TaskFormData = z.infer<typeof taskFormSchema>;

export const TasksPage: React.FC = () => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<any>(null);

  const { tasksQuery, createTask, updateTask, deleteTask } = useTasks({
    search: search || undefined,
    status: statusFilter || undefined,
    priority: priorityFilter || undefined
  });

  const { data: projects = [] } = useQuery({
    queryKey: ['projects', 'active'],
    queryFn: async () => {
      const res = await api.get('/admin/projects'); // Fallback or direct fetch
      return res.data;
    }
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm<TaskFormData>({
    resolver: zodResolver(taskFormSchema),
    defaultValues: {
      title: '',
      description: '',
      projectId: '',
      priority: 'MEDIUM',
      status: 'TODO',
      category: '',
      module: '',
      estimatedHours: 0,
      actualHours: 0,
      remarks: '',
      tags: '',
      dependencies: ''
    }
  });

  const handleOpenCreate = () => {
    setEditingTask(null);
    reset({
      title: '',
      description: '',
      projectId: '',
      priority: 'MEDIUM',
      status: 'TODO',
      category: '',
      module: '',
      estimatedHours: 0,
      actualHours: 0,
      remarks: '',
      tags: '',
      dependencies: ''
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (task: any) => {
    setEditingTask(task);
    reset({
      title: task.title,
      description: task.description || '',
      projectId: task.projectId || '',
      priority: task.priority,
      status: task.status,
      category: task.category || '',
      module: task.module || '',
      estimatedHours: task.estimatedHours || 0,
      actualHours: task.actualHours || 0,
      remarks: task.remarks || '',
      tags: task.tags || '',
      dependencies: task.dependencies || ''
    });
    setIsModalOpen(true);
  };

  const onSubmit = async (data: TaskFormData) => {
    // Sanitize empty uuid representation
    const payload = {
      ...data,
      projectId: data.projectId === '' ? undefined : data.projectId
    };

    try {
      if (editingTask) {
        await updateTask({ id: editingTask.id, data: payload });
        toast.success('Task updated successfully!');
      } else {
        await createTask(payload);
        toast.success('Task created successfully!');
      }
      setIsModalOpen(false);
    } catch (err) {
      toast.error('Failed to submit task details.');
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      try {
        await deleteTask(id);
        toast.success('Task deleted successfully!');
      } catch (err) {
        toast.error('Failed to delete task.');
      }
    }
  };

  const handleExport = (format: string) => {
    window.open(`/api/tasks/export?format=${format}`, '_blank');
  };

  const projectOptions = [
    { value: '', label: 'General / No Project' },
    ...projects.map((p: any) => ({ value: p.id, label: p.name }))
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-100">Tasks Management</h2>
          <p className="text-xs text-slate-400">Add, track, and export daily items</p>
        </div>
        <div className="flex items-center gap-3.5">
          {/* Export Dropdown options */}
          <div className="relative group">
            <Button variant="secondary" icon={<Download size={16} />} className="cursor-pointer">
              Export Tasks
            </Button>
            <div className="absolute right-0 top-full mt-1.5 hidden group-hover:block bg-slate-900 border border-slate-800 rounded-lg shadow-2xl z-20 min-w-[120px] overflow-hidden">
              <button onClick={() => handleExport('pdf')} className="w-full text-left px-4 py-2 text-xs text-slate-300 hover:bg-slate-800 cursor-pointer">PDF Format</button>
              <button onClick={() => handleExport('excel')} className="w-full text-left px-4 py-2 text-xs text-slate-300 hover:bg-slate-800 cursor-pointer">Excel Sheet</button>
              <button onClick={() => handleExport('csv')} className="w-full text-left px-4 py-2 text-xs text-slate-300 hover:bg-slate-800 cursor-pointer">CSV Text</button>
            </div>
          </div>
          <Button variant="primary" icon={<Plus size={16} />} onClick={handleOpenCreate}>
            Create Task
          </Button>
        </div>
      </div>

      {/* Filter and search bar */}
      <Card className="flex flex-col md:flex-row gap-4 items-center">
        <div className="flex-1 w-full">
          <Input
            placeholder="Search tasks..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            icon={<Search size={16} />}
          />
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <Select
            options={[
              { value: '', label: 'All Statuses' },
              { value: 'TODO', label: 'Todo' },
              { value: 'IN_PROGRESS', label: 'In Progress' },
              { value: 'COMPLETED', label: 'Completed' },
              { value: 'BLOCKED', label: 'Blocked' },
              { value: 'REVIEW', label: 'Review' }
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
              { value: 'CRITICAL', label: 'Critical' }
            ]}
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            icon={<SlidersHorizontal size={14} />}
          />
        </div>
      </Card>

      {/* Tasks listing */}
      {tasksQuery.isLoading ? (
        <div className="flex flex-col gap-4">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-20 bg-slate-900 border border-slate-800 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : !tasksQuery.data?.tasks || tasksQuery.data.tasks.length === 0 ? (
        <EmptyState
          title="No tasks logged"
          description="Looks like you haven't logged any tasks matching current filters. Click below to add one."
          action={
            <Button variant="primary" icon={<Plus size={16} />} onClick={handleOpenCreate}>
              Create Task Now
            </Button>
          }
        />
      ) : (
        <div className="flex flex-col gap-4">
          {tasksQuery.data.tasks.map((task: any) => (
            <Card key={task.id} hoverable className="flex items-center justify-between">
              <div className="flex flex-col gap-1.5 max-w-[70%]">
                <div className="flex items-center gap-3">
                  <h4 className="text-sm font-semibold text-slate-100">{task.title}</h4>
                  <Badge variant={task.priority === 'CRITICAL' ? 'danger' : 'info'}>
                    {task.priority}
                  </Badge>
                  <Badge variant={task.status === 'COMPLETED' ? 'success' : 'warning'}>
                    {task.status}
                  </Badge>
                </div>
                {task.description && <p className="text-xs text-slate-400 truncate">{task.description}</p>}
                <span className="text-[10px] text-slate-500 font-medium">
                  {task.project?.name || 'General Task'} • Logged: {task.actualHours || 0}h / Est: {task.estimatedHours || 0}h
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={() => handleOpenEdit(task)} className="p-2 cursor-pointer">
                  <Edit2 size={14} />
                </Button>
                <Button variant="ghost" size="sm" onClick={() => handleDelete(task.id)} className="p-2 cursor-pointer hover:text-red-400">
                  <Trash2 size={14} />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Task Creation & Update Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingTask ? 'Modify Task Details' : 'Log New Task'}
        size="lg"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <Input label="Task Title" placeholder="What are you working on?" error={errors.title?.message} {...register('title')} />
          </div>

          <div className="md:col-span-2">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Description</label>
              <textarea
                placeholder="Log notes about implementation steps, context details, etc."
                className="w-full bg-slate-900 border border-slate-800 text-sm text-slate-100 rounded-lg p-3 h-24 focus:outline-none focus:border-indigo-500"
                {...register('description')}
              />
            </div>
          </div>

          <Select label="Project Link" options={projectOptions} error={errors.projectId?.message} {...register('projectId')} />
          <Select
            label="Priority Level"
            options={[
              { value: 'LOW', label: 'Low Priority' },
              { value: 'MEDIUM', label: 'Medium Priority' },
              { value: 'HIGH', label: 'High Priority' },
              { value: 'CRITICAL', label: 'Critical Alert' }
            ]}
            error={errors.priority?.message}
            {...register('priority')}
          />

          <Select
            label="Workflow Status"
            options={[
              { value: 'TODO', label: 'To Do' },
              { value: 'IN_PROGRESS', label: 'In Progress' },
              { value: 'COMPLETED', label: 'Completed' },
              { value: 'BLOCKED', label: 'Blocked' },
              { value: 'ON_HOLD', label: 'On Hold' },
              { value: 'TESTING', label: 'Testing' },
              { value: 'REVIEW', label: 'Review' }
            ]}
            error={errors.status?.message}
            {...register('status')}
          />

          <Input label="Feature Module" placeholder="e.g., Auth, Cart" {...register('module')} />
          <Input label="Category/Tag" placeholder="e.g., Backend, Bug, UI" {...register('category')} />
          <Input label="Estimated Hours" type="number" step="0.5" error={errors.estimatedHours?.message} {...register('estimatedHours', { valueAsNumber: true })} />
          <Input label="Actual Logged Hours" type="number" step="0.5" error={errors.actualHours?.message} {...register('actualHours', { valueAsNumber: true })} />

          <div className="md:col-span-2">
            <Input label="Dependencies (If any)" placeholder="Task links or notes" {...register('dependencies')} />
          </div>

          <div className="md:col-span-2">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Blocker Remarks (Optional)</label>
              <textarea
                placeholder="Log details on blocker issues or why task is on hold..."
                className="w-full bg-slate-900 border border-slate-800 text-sm text-slate-100 rounded-lg p-3 h-20 focus:outline-none focus:border-indigo-500"
                {...register('remarks')}
              />
            </div>
          </div>

          <div className="md:col-span-2 flex justify-end gap-3 mt-4">
            <Button variant="secondary" type="button" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button variant="primary" type="submit">Submit Task</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
export default TasksPage;
