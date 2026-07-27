import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../lib/axios';
import Card from '../../components/ui/Card';
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
import { Plus, User, Search, Edit2, CheckCircle2, AlertCircle } from 'lucide-react';

const userSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Please enter a valid email address'),
  role: z.enum(['ADMIN', 'MANAGER', 'DEVELOPER']),
  designation: z.string().optional().default(''),
  departmentId: z.string().uuid().optional().or(z.literal('')),
  managerId: z.string().uuid().optional().or(z.literal('')),
  password: z.string().optional().default('')
});

type UserFormData = z.infer<typeof userSchema>;

export const UserManagementPage: React.FC = () => {
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);

  const usersQuery = useQuery({
    queryKey: ['admin', 'users', { search }],
    queryFn: async () => {
      const res = await api.get('/admin/users', { params: { search: search || undefined } });
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

  // Get managers list for developer manager links
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
  } = useForm<UserFormData>({
    resolver: zodResolver(userSchema)
  });

  const handleOpenCreate = () => {
    setEditingUser(null);
    reset({
      firstName: '',
      lastName: '',
      email: '',
      role: 'DEVELOPER',
      designation: '',
      departmentId: '',
      managerId: '',
      password: ''
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (user: any) => {
    setEditingUser(user);
    reset({
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
      designation: user.designation || '',
      departmentId: user.department?.id || '',
      managerId: user.manager?.id || '',
      password: ''
    });
    setIsModalOpen(true);
  };

  const onSubmit = async (data: UserFormData) => {
    const payload = {
      ...data,
      departmentId: data.departmentId === '' ? undefined : data.departmentId,
      managerId: data.managerId === '' ? undefined : data.managerId,
      password: data.password === '' ? undefined : data.password
    };

    try {
      if (editingUser) {
        await api.put(`/admin/users/${editingUser.id}`, payload);
        toast.success('User updated successfully!');
      } else {
        await api.post('/admin/users', payload);
        toast.success('User created successfully!');
      }
      setIsModalOpen(false);
      usersQuery.refetch();
    } catch (err: any) {
      const msg = err.response?.data?.error || 'Failed to submit user details.';
      toast.error(msg);
    }
  };

  const toggleActivation = async (id: string, currentStatus: boolean) => {
    try {
      await api.put(`/admin/users/${id}`, { isActive: !currentStatus });
      toast.success(currentStatus ? 'User account deactivated' : 'User account activated');
      usersQuery.refetch();
    } catch (err) {
      toast.error('Failed to change activation status.');
    }
  };

  const columns = [
    {
      header: 'Name',
      render: (u: any) => (
        <span className="font-semibold text-slate-200">
          {u.firstName} {u.lastName}
        </span>
      )
    },
    { header: 'Email', render: (u: any) => u.email },
    { header: 'Role', render: (u: any) => <Badge variant="info">{u.role}</Badge> },
    { header: 'Designation', render: (u: any) => u.designation || '-' },
    {
      header: 'Status',
      render: (u: any) => (
        <Badge variant={u.isActive ? 'success' : 'neutral'}>
          {u.isActive ? 'Active' : 'Disabled'}
        </Badge>
      )
    },
    {
      header: 'Actions',
      render: (u: any) => (
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => handleOpenEdit(u)} className="p-1.5 cursor-pointer text-indigo-400">
            <Edit2 size={13} />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => toggleActivation(u.id, u.isActive)}
            className={`p-1.5 cursor-pointer ${u.isActive ? 'text-red-400 hover:text-red-300' : 'text-emerald-400'}`}
          >
            {u.isActive ? <AlertCircle size={13} /> : <CheckCircle2 size={13} />}
          </Button>
        </div>
      )
    }
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-100">User Management</h2>
          <p className="text-xs text-slate-400">Create, review, and modify enterprise accounts</p>
        </div>
        <Button variant="primary" icon={<Plus size={16} />} onClick={handleOpenCreate}>
          Create User
        </Button>
      </div>

      {/* Search Filter */}
      <Card>
        <Input
          placeholder="Search by name or email address..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          icon={<Search size={16} />}
        />
      </Card>

      {/* Users table */}
      <Table
        data={usersQuery.data?.users || []}
        columns={columns}
        keyExtractor={(item) => item.id}
        loading={usersQuery.isLoading}
        emptyMessage="No registered users match search query."
      />

      {/* Edit/Create Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingUser ? 'Edit User Details' : 'Register New User'}
        size="lg"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label="First Name" error={errors.firstName?.message} {...register('firstName')} />
          <Input label="Last Name" error={errors.lastName?.message} {...register('lastName')} />
          <Input label="Email Address" type="email" error={errors.email?.message} {...register('email')} />
          
          {!editingUser && (
            <Input label="Password" type="password" placeholder="Defaults to Password@123" error={errors.password?.message} {...register('password')} />
          )}

          <Select
            label="Security Role"
            options={[
              { value: 'DEVELOPER', label: 'Developer (Standard Access)' },
              { value: 'MANAGER', label: 'Manager (Team Admin)' },
              { value: 'ADMIN', label: 'Admin (System Configuration)' }
            ]}
            error={errors.role?.message}
            {...register('role')}
          />

          <Input label="Job Title/Designation" placeholder="e.g. Frontend Dev" {...register('designation')} />

          <Select
            label="Department"
            options={[
              { value: '', label: 'Select Department' },
              ...departments.map((d: any) => ({ value: d.id, label: d.name }))
            ]}
            error={errors.departmentId?.message}
            {...register('departmentId')}
          />

          <Select
            label="Reporting Manager"
            options={[
              { value: '', label: 'Select Manager' },
              ...managersList.map((m: any) => ({ value: m.id, label: `${m.firstName} ${m.lastName}` }))
            ]}
            error={errors.managerId?.message}
            {...register('managerId')}
          />

          <div className="sm:col-span-2 flex justify-end gap-3 mt-4 border-t border-slate-850 pt-4">
            <Button variant="secondary" type="button" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button variant="primary" type="submit">Submit User</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
export default UserManagementPage;
