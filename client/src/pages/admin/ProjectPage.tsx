import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../lib/axios';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Modal from '../../components/ui/Modal';
import Table from '../../components/ui/Table';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { Plus, Edit2 } from 'lucide-react';

const projectSchema = z.object({
  name: z.string().min(1, 'Project name is required'),
  description: z.string().optional().default(''),
  status: z.enum(['ACTIVE', 'COMPLETED', 'ON_HOLD', 'CANCELLED']),
  managerId: z.string().uuid().optional().or(z.literal('')),
  departmentId: z.string().uuid().optional().or(z.literal(''))
});

type ProjectFormData = z.infer<typeof projectSchema>;

export const ProjectPage: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<any>(null);

  const projectsQuery = useQuery({
    queryKey: ['admin', 'projects'],
    queryFn: async () => {
      const res = await api.get('/admin/projects');
      return res.data;
    }
  });

  const { data: departments = [] } = useQuery({
    queryKey: ['admin', 'departments'],
    queryFn: async () => {
      const res = await api.get('/admin/departments');
      return res.data;
    }
  });

  const { data: managersList = [] } = useQuery({
    queryKey: ['admin', 'managers'],
    queryFn: async () => {
      const res = await api.get('/admin/users', { params: { role: 'MANAGER' } });
      return res.data?.users || [];
    }
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm<ProjectFormData>({
    resolver: zodResolver(projectSchema)
  });

  const handleOpenCreate = () => {
    setEditingProject(null);
    reset({
      name: '',
      description: '',
      status: 'ACTIVE',
      managerId: '',
      departmentId: ''
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (project: any) => {
    setEditingProject(project);
    reset({
      name: project.name,
      description: project.description || '',
      status: project.status,
      managerId: project.managerId || '',
      departmentId: project.departmentId || ''
    });
    setIsModalOpen(true);
  };

  const onSubmit = async (data: ProjectFormData) => {
    const payload = {
      ...data,
      managerId: data.managerId === '' ? undefined : data.managerId,
      departmentId: data.departmentId === '' ? undefined : data.departmentId
    };

    try {
      if (editingProject) {
        await api.put(`/admin/projects/${editingProject.id}`, payload);
        toast.success('Project updated successfully!');
      } else {
        await api.post('/admin/projects', payload);
        toast.success('Project created successfully!');
      }
      setIsModalOpen(false);
      projectsQuery.refetch();
    } catch (err: any) {
      toast.error('Failed to submit project.');
    }
  };

  const columns = [
    {
      header: 'Project Name',
      render: (p: any) => <span className="font-semibold text-slate-200">{p.name}</span>
    },
    { header: 'Department', render: (p: any) => p.department?.name || '-' },
    {
      header: 'Manager',
      render: (p: any) =>
        p.manager ? `${p.manager.firstName} ${p.manager.lastName}` : '-'
    },
    {
      header: 'Status',
      render: (p: any) => (
        <Badge variant={p.status === 'ACTIVE' ? 'success' : p.status === 'ON_HOLD' ? 'warning' : 'neutral'}>
          {p.status}
        </Badge>
      )
    },
    {
      header: 'Action',
      render: (p: any) => (
        <Button variant="ghost" size="sm" onClick={() => handleOpenEdit(p)} className="p-1.5 cursor-pointer text-indigo-400">
          <Edit2 size={13} />
        </Button>
      )
    }
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-100">Project Management</h2>
          <p className="text-xs text-slate-400">Setup and assign team projects</p>
        </div>
        <Button variant="primary" icon={<Plus size={16} />} onClick={handleOpenCreate}>
          Create Project
        </Button>
      </div>

      <Table
        data={projectsQuery.data || []}
        columns={columns}
        keyExtractor={(item) => item.id}
        loading={projectsQuery.isLoading}
        emptyMessage="No projects currently registered."
      />

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingProject ? 'Modify Project details' : 'Register New Project'}
        size="md"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <Input label="Project Name" error={errors.name?.message} {...register('name')} />

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wide">Description</label>
            <textarea
              className="w-full bg-slate-900 border border-slate-800 text-sm text-slate-100 rounded-lg p-3 h-20 focus:outline-none focus:border-indigo-500"
              {...register('description')}
            />
          </div>

          <Select
            label="Project Status"
            options={[
              { value: 'ACTIVE', label: 'Active Delivery' },
              { value: 'COMPLETED', label: 'Completed' },
              { value: 'ON_HOLD', label: 'On Hold' },
              { value: 'CANCELLED', label: 'Cancelled' }
            ]}
            error={errors.status?.message}
            {...register('status')}
          />

          <Select
            label="Assigned Lead / Manager"
            options={[
              { value: '', label: 'Select Manager' },
              ...managersList.map((m: any) => ({ value: m.id, label: `${m.firstName} ${m.lastName}` }))
            ]}
            error={errors.managerId?.message}
            {...register('managerId')}
          />

          <Select
            label="Department"
            options={[
              { value: '', label: 'Select Department' },
              ...departments.map((d: any) => ({ value: d.id, label: d.name }))
            ]}
            error={errors.departmentId?.message}
            {...register('departmentId')}
          />

          <div className="flex justify-end gap-3 mt-4 border-t border-slate-850 pt-4">
            <Button variant="secondary" type="button" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button variant="primary" type="submit">Submit Project</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
export default ProjectPage;
