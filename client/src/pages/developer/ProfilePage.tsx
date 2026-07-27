import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import api from '../../lib/axios';
import toast from 'react-hot-toast';
import { User, Lock, Phone, Briefcase } from 'lucide-react';

const profileSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  phone: z.string().optional(),
  designation: z.string().optional()
});

const passwordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Must contain uppercase')
    .regex(/[a-z]/, 'Must contain lowercase')
    .regex(/[0-9]/, 'Must contain numbers')
    .regex(/[@$!%*?&]/, 'Must contain special character')
}).refine(data => data.currentPassword !== data.newPassword, {
  message: 'New password cannot be same as current',
  path: ['newPassword']
});

type ProfileFormData = z.infer<typeof profileSchema>;
type PasswordFormData = z.infer<typeof passwordSchema>;

export const ProfilePage: React.FC = () => {
  const { user, checkAuth } = useAuth();
  const [profileLoading, setProfileLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);

  const {
    register: registerProfile,
    handleSubmit: handleProfileSubmit,
    formState: { errors: profileErrors }
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      phone: user?.phone || '',
      designation: user?.designation || ''
    }
  });

  const {
    register: registerPassword,
    handleSubmit: handlePasswordSubmit,
    reset: resetPassword,
    formState: { errors: passwordErrors }
  } = useForm<PasswordFormData>({ resolver: zodResolver(passwordSchema) });

  const onProfileSubmit = async (data: ProfileFormData) => {
    setProfileLoading(true);
    try {
      await api.put('/auth/profile', data);
      toast.success('Profile details updated successfully!');
      checkAuth();
    } catch (err) {
      toast.error('Failed to update profile.');
    } finally {
      setProfileLoading(false);
    }
  };

  const onPasswordSubmit = async (data: PasswordFormData) => {
    setPasswordLoading(true);
    try {
      await api.post('/auth/change-password', {
        currentPassword: data.currentPassword,
        newPassword: data.newPassword
      });
      toast.success('Password changed successfully!');
      resetPassword();
    } catch (err: any) {
      const msg = err.response?.data?.error || 'Password update failed.';
      toast.error(msg);
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Profile form */}
      <div className="lg:col-span-7">
        <Card className="flex flex-col gap-6">
          <div>
            <h3 className="text-sm font-semibold text-slate-200">Account Details</h3>
            <p className="text-xs text-slate-500">Update your primary information</p>
          </div>

          <form onSubmit={handleProfileSubmit(onProfileSubmit)} className="flex flex-col gap-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="First Name"
                icon={<User size={16} />}
                error={profileErrors.firstName?.message}
                {...registerProfile('firstName')}
              />
              <Input
                label="Last Name"
                icon={<User size={16} />}
                error={profileErrors.lastName?.message}
                {...registerProfile('lastName')}
              />
            </div>
            <Input
              label="Contact Phone"
              icon={<Phone size={16} />}
              error={profileErrors.phone?.message}
              {...registerProfile('phone')}
            />
            <Input
              label="Job Designation"
              icon={<Briefcase size={16} />}
              error={profileErrors.designation?.message}
              {...registerProfile('designation')}
            />

            <div className="flex justify-end mt-4">
              <Button type="submit" loading={profileLoading} className="cursor-pointer">
                Save Changes
              </Button>
            </div>
          </form>
        </Card>
      </div>

      {/* Password Form */}
      <div className="lg:col-span-5">
        <Card className="flex flex-col gap-6">
          <div>
            <h3 className="text-sm font-semibold text-slate-200">Security Credentials</h3>
            <p className="text-xs text-slate-500">Update your login password</p>
          </div>

          <form onSubmit={handlePasswordSubmit(onPasswordSubmit)} className="flex flex-col gap-4">
            <Input
              label="Current Password"
              type="password"
              icon={<Lock size={16} />}
              error={passwordErrors.currentPassword?.message}
              {...registerPassword('currentPassword')}
            />
            <Input
              label="New Password"
              type="password"
              icon={<Lock size={16} />}
              error={passwordErrors.newPassword?.message}
              {...registerPassword('newPassword')}
            />

            <div className="flex justify-end mt-4">
              <Button type="submit" loading={passwordLoading} className="cursor-pointer">
                Change Password
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
};
export default ProfilePage;
