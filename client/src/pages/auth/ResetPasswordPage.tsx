import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../../lib/axios';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import { Lock } from 'lucide-react';
import toast from 'react-hot-toast';

const schema = z.object({
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain uppercase letters')
    .regex(/[a-z]/, 'Password must contain lowercase letters')
    .regex(/[0-9]/, 'Password must contain numbers')
    .regex(/[@$!%*?&]/, 'Password must contain special characters'),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword']
});

type FormData = z.infer<typeof schema>;

export const ResetPasswordPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    if (!token) {
      toast.error('Invalid token. Access password reset link from email.');
      return;
    }
    setLoading(true);
    try {
      await api.post('/auth/reset-password', { token, password: data.password });
      toast.success('Password updated successfully!');
      navigate('/login');
    } catch (err: any) {
      const msg = err.response?.data?.error || 'Password update failed.';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full flex flex-col gap-6">
      <div className="flex flex-col gap-1 text-center lg:text-left">
        <h2 className="text-2xl font-extrabold text-slate-100 tracking-tight">Reset Password</h2>
        <p className="text-xs text-slate-400">Configure your new credentials</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <Input
          label="New Password"
          type="password"
          placeholder="••••••••"
          icon={<Lock size={16} />}
          error={errors.password?.message}
          {...register('password')}
        />
        <Input
          label="Confirm Password"
          type="password"
          placeholder="••••••••"
          icon={<Lock size={16} />}
          error={errors.confirmPassword?.message}
          {...register('confirmPassword')}
        />
        <Button type="submit" loading={loading} className="w-full mt-2 py-3">
          Configure Password
        </Button>
      </form>
    </div>
  );
};
export default ResetPasswordPage;
