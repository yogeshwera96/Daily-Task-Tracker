import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../lib/axios';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Table from '../../components/ui/Table';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { Trash2, Calendar } from 'lucide-react';

const holidaySchema = z.object({
  name: z.string().min(1, 'Holiday name is required'),
  date: z.string().min(1, 'Holiday date is required'),
  isRecurring: z.boolean().optional().default(false)
});

type HolidayFormData = z.infer<typeof holidaySchema>;

export const HolidayPage: React.FC = () => {

  const holidaysQuery = useQuery({
    queryKey: ['admin', 'holidays'],
    queryFn: async () => {
      const res = await api.get('/admin/holidays');
      return res.data;
    }
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm<HolidayFormData>({ resolver: zodResolver(holidaySchema) });

  const onSubmit = async (data: HolidayFormData) => {
    try {
      await api.post('/admin/holidays', data);
      toast.success('Holiday added successfully!');
      reset();
      holidaysQuery.refetch();
    } catch (err) {
      toast.error('Failed to add holiday.');
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Delete this holiday?')) {
      try {
        await api.delete(`/admin/holidays/${id}`);
        toast.success('Holiday deleted successfully!');
        holidaysQuery.refetch();
      } catch (err) {
        toast.error('Failed to delete holiday.');
      }
    }
  };

  const columns = [
    {
      header: 'Holiday Name',
      render: (h: any) => <span className="font-semibold text-slate-200">{h.name}</span>
    },
    {
      header: 'Date',
      render: (h: any) => new Date(h.date).toLocaleDateString(undefined, { dateStyle: 'long' })
    },
    {
      header: 'Recurring',
      render: (h: any) => (
        <Badge variant={h.isRecurring ? 'success' : 'neutral'}>
          {h.isRecurring ? 'Every Year' : 'One Time'}
        </Badge>
      )
    },
    {
      header: 'Action',
      render: (h: any) => (
        <Button variant="ghost" size="sm" onClick={() => handleDelete(h.id)} className="p-1.5 cursor-pointer hover:text-red-400">
          <Trash2 size={13} />
        </Button>
      )
    }
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Holidays List */}
      <div className="lg:col-span-8 flex flex-col gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-100">Company Holidays</h2>
          <p className="text-xs text-slate-400">Configure annual or singular company holiday dates</p>
        </div>

        <Table
          data={holidaysQuery.data || []}
          columns={columns}
          keyExtractor={(item) => item.id}
          loading={holidaysQuery.isLoading}
          emptyMessage="No holidays scheduled."
        />
      </div>

      {/* Add Holiday Form */}
      <div className="lg:col-span-4">
        <Card className="flex flex-col gap-6">
          <div className="border-b border-slate-850 pb-2 flex items-center gap-2 text-indigo-400">
            <Calendar size={18} />
            <h3 className="text-sm font-semibold text-slate-200 font-bold">Configure Holiday</h3>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <Input label="Holiday Label" placeholder="e.g., Labor Day" error={errors.name?.message} {...register('name')} />
            
            <Input label="Holiday Date" type="date" error={errors.date?.message} {...register('date')} />

            <label className="flex items-center gap-2 text-xs text-slate-350 cursor-pointer py-1.5">
              <input
                type="checkbox"
                className="w-3.5 h-3.5 rounded border-slate-800 bg-slate-900 text-indigo-600 focus:ring-indigo-500"
                {...register('isRecurring')}
              />
              Recurring holiday (repeats annually)
            </label>

            <Button type="submit" className="w-full mt-2 cursor-pointer">
              Schedule Holiday
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
};
export default HolidayPage;
