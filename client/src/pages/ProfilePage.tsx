import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  User as UserIcon, Shield, Phone,
  Lock, Save, Loader2, Briefcase
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../lib/auth-context';
import { authService } from '../services/auth.service';
import { handleApiError } from '../lib/api';
import { Role } from '../types';

const profileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  phone: z.string().optional(),
  department: z.string().optional(),
  bio: z.string().optional(),
  currentPassword: z.string().optional(),
  newPassword: z.string().optional(),
  confirmPassword: z.string().optional(),
}).refine((data) => {
  if (data.newPassword && data.newPassword.length < 8) {
    return false;
  }
  return true;
}, {
  message: 'New password must be at least 8 characters',
  path: ['newPassword'],
}).refine((data) => {
  if (data.newPassword && data.newPassword !== data.confirmPassword) {
    return false;
  }
  return true;
}, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

type ProfileFormData = z.infer<typeof profileSchema>;

const ROLE_META: Record<Role, { title: string; badge: string; color: string; desc: string; deptLabel: string; deptPlaceholder: string }> = {
  ADMIN: {
    title: 'System Administrator',
    badge: 'badge-purple',
    color: 'from-purple-500 to-indigo-600',
    desc: 'Full administrative authority across all modules, users, security audits, and financial settings.',
    deptLabel: 'Executive Division / Office',
    deptPlaceholder: 'e.g. Headquarters & Operations Leadership',
  },
  SALES: {
    title: 'Sales & Field CRM Officer',
    badge: 'badge-blue',
    color: 'from-blue-500 to-cyan-600',
    desc: 'Manages customer relationships, follow-up schedules, lead conversions, and sales challan creation.',
    deptLabel: 'Assigned Territory / Region',
    deptPlaceholder: 'e.g. Western Maharashtra - Mumbai, Thane & Pune',
  },
  WAREHOUSE: {
    title: 'Warehouse & Logistics Manager',
    badge: 'badge-yellow',
    color: 'from-amber-500 to-orange-600',
    desc: 'Oversees inbound/outbound product movements, inventory threshold alerts, and challan physical dispatches.',
    deptLabel: 'Assigned Warehouse Hub / Station',
    deptPlaceholder: 'e.g. Bhiwandi Central Logistics Hub - Dock B',
  },
  ACCOUNTS: {
    title: 'Accounts & GST Officer',
    badge: 'badge-green',
    color: 'from-emerald-500 to-teal-600',
    desc: 'Monitors financial revenue, confirmed sales challans, invoice reconciliation, and monthly GSTR-1 exports.',
    deptLabel: 'Accounting Desk / Specialization',
    deptPlaceholder: 'e.g. GSTR-1 Invoicing & Settlement Desk',
  },
};

export function ProfilePage() {
  const { user, updateUser } = useAuth();
  const [isSaving, setIsSaving] = useState(false);

  const roleInfo = user?.role ? ROLE_META[user.role as Role] : ROLE_META.SALES;

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user?.name ?? '',
      phone: user?.phone ?? '',
      department: user?.department ?? '',
      bio: user?.bio ?? '',
    },
  });

  const watchedName = watch('name') || user?.name || 'User';
  const watchedDept = watch('department') || user?.department || 'Operations Team';
  const watchedBio = watch('bio') || user?.bio || 'No bio specified yet.';

  const onSubmit = async (data: ProfileFormData) => {
    setIsSaving(true);
    try {
      const payload: any = {
        name: data.name,
        phone: data.phone || null,
        department: data.department || null,
        bio: data.bio || null,
      };

      if (data.newPassword) {
        payload.currentPassword = data.currentPassword;
        payload.newPassword = data.newPassword;
      }

      const updated = await authService.updateProfile(payload);
      updateUser(updated);
      toast.success('Profile and bio updated successfully!');
      reset({
        name: updated.name,
        phone: updated.phone || '',
        department: updated.department || '',
        bio: updated.bio || '',
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    } catch (err) {
      handleApiError(err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-5xl">
      <div className="page-header">
        <div>
          <h1 className="page-title">My Profile & Role Bio</h1>
          <p className="page-subtitle">Manage your personal details, role-specific territory, and bio</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left: Role Profile Card */}
        <div className="space-y-6 md:col-span-1">
          <div className="card p-6 text-center space-y-4">
            <div className="relative mx-auto w-24 h-24 rounded-2xl bg-gradient-to-br from-blue-500 via-indigo-600 to-purple-600 flex items-center justify-center shadow-xl shadow-blue-500/20">
              <span className="text-3xl font-extrabold text-white">
                {watchedName[0]?.toUpperCase() ?? 'U'}
              </span>
              <div className="absolute -bottom-2 -right-2 w-7 h-7 rounded-full bg-emerald-500 border-2 border-slate-900 flex items-center justify-center text-white text-xs">
                ✓
              </div>
            </div>

            <div>
              <h2 className="text-lg font-bold text-slate-100">{watchedName}</h2>
              <p className="text-xs text-slate-400 font-mono mt-0.5">{user?.email}</p>
              <div className="mt-2 flex justify-center">
                <span className={roleInfo.badge}>{roleInfo.title}</span>
              </div>
            </div>

            <div className="border-t border-slate-700/60 pt-3 text-left space-y-2 text-xs text-slate-400">
              <div className="flex items-center gap-2">
                <Briefcase className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
                <span className="truncate">{watchedDept}</span>
              </div>
              {user?.phone && (
                <div className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                  <span>{user.phone}</span>
                </div>
              )}
            </div>

            <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-3 text-left">
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">About / Bio</p>
              <p className="text-xs text-slate-300 italic leading-relaxed">{watchedBio}</p>
            </div>
          </div>

          {/* Role permissions overview */}
          <div className="card p-5 space-y-2.5">
            <div className="flex items-center gap-2 text-slate-200 font-semibold text-sm">
              <Shield className="w-4 h-4 text-purple-400" />
              <span>Role Permissions</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">{roleInfo.desc}</p>
          </div>
        </div>

        {/* Right: Edit Form */}
        <div className="md:col-span-2 space-y-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Personal Details */}
            <div className="card p-6 space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-700/60 pb-3">
                <UserIcon className="w-5 h-5 text-blue-400" />
                <h3 className="font-semibold text-slate-200">Personal & Role Details</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="form-label">Full Name *</label>
                  <input
                    {...register('name')}
                    className={errors.name ? 'form-input-error' : 'form-input'}
                    placeholder="Your Name"
                  />
                  {errors.name && <p className="form-error">{errors.name.message}</p>}
                </div>

                <div>
                  <label className="form-label">Email Address (Account ID)</label>
                  <input
                    disabled
                    value={user?.email ?? ''}
                    className="form-input opacity-60 cursor-not-allowed bg-slate-800/40"
                  />
                </div>

                <div>
                  <label className="form-label flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5 text-slate-400" /> Contact Phone
                  </label>
                  <input
                    {...register('phone')}
                    className="form-input"
                    placeholder="+91 98765 43210"
                  />
                </div>

                <div>
                  <label className="form-label">{roleInfo.deptLabel}</label>
                  <input
                    {...register('department')}
                    className="form-input"
                    placeholder={roleInfo.deptPlaceholder}
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="form-label">Personal Bio / Role Description</label>
                  <textarea
                    {...register('bio')}
                    rows={3}
                    className="form-input text-sm"
                    placeholder="Brief description of your role, territory, specialization, or background..."
                  />
                </div>
              </div>
            </div>

            {/* Security / Password Change */}
            <div className="card p-6 space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-700/60 pb-3">
                <Lock className="w-5 h-5 text-purple-400" />
                <h3 className="font-semibold text-slate-200">Change Password (Optional)</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="form-label">Current Password</label>
                  <input
                    type="password"
                    {...register('currentPassword')}
                    className="form-input"
                    placeholder="••••••••"
                  />
                </div>

                <div>
                  <label className="form-label">New Password</label>
                  <input
                    type="password"
                    {...register('newPassword')}
                    className={errors.newPassword ? 'form-input-error' : 'form-input'}
                    placeholder="Min. 8 characters"
                  />
                  {errors.newPassword && <p className="form-error">{errors.newPassword.message}</p>}
                </div>

                <div>
                  <label className="form-label">Confirm New Password</label>
                  <input
                    type="password"
                    {...register('confirmPassword')}
                    className={errors.confirmPassword ? 'form-input-error' : 'form-input'}
                    placeholder="Repeat new password"
                  />
                  {errors.confirmPassword && <p className="form-error">{errors.confirmPassword.message}</p>}
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={isSaving}
                className="btn-primary flex items-center gap-1.5"
              >
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {isSaving ? 'Saving Profile...' : 'Save Profile Changes'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
