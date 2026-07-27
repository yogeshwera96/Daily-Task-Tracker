import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link } from 'react-router-dom';
import api from '../../lib/axios';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import { Mail, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';

const schema = z.object({
  email: z.string().email('Please enter a valid email address')
});

type FormData = z.infer<typeof schema>;

export const ForgotPasswordPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email: data.email });
      setSubmitted(true);
      toast.success('Reset link dispatched if user exists.');
    } catch (err) {
      toast.error('Failed to process request. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full flex flex-col gap-6">
      <div className="flex flex-col gap-1 text-center lg:text-left">
        <h2 className="text-2xl font-extrabold text-slate-100 tracking-tight">Forgot Password</h2>
        <p className="text-xs text-slate-400">Request password update link</p>
      </div>

      {!submitted ? (
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <Input
            label="Email Address"
            type="email"
            placeholder="your.email@tasktracker.com"
            icon={<Mail size={16} />}
            error={errors.email?.message}
            {...register('email')}
          />
          <Button type="submit" loading={loading} className="w-full mt-2 py-3">
            Send Reset Instructions
          </Button>
        </form>
      ) : (
        <div className="text-center py-4 bg-indigo-600/5 border border-indigo-500/10 rounded-xl p-4">
          <p className="text-sm text-slate-300">
            Check your inbox. If your email is registered, instructions to reset your password have been sent.
          </p>
        </div>
      )}

      <Link
        to="/login"
        className="flex items-center justify-center gap-2 text-xs text-slate-400 hover:text-slate-200 transition-colors font-medium mt-2"
      >
        <ArrowLeft size={14} /> Back to Sign In
      </Link>
    </div>
  );
};
export default ForgotPasswordPage;
