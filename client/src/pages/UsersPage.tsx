import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { authService } from '../services/auth.service';
import { Modal } from '../components/ui/Modal';
import { TableSkeleton } from '../components/ui/Skeleton';
import { handleApiError } from '../lib/api';
import { User } from '../types';

const ROLE_COLORS: Record<string, string> = {
  ADMIN: 'badge-purple',
  SALES: 'badge-blue',
  WAREHOUSE: 'badge-yellow',
  ACCOUNTS: 'badge-green',
};

const userSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  email: z.string().email('Valid email required'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  role: z.enum(['ADMIN', 'SALES', 'WAREHOUSE', 'ACCOUNTS']),
});

type UserFormData = z.infer<typeof userSchema>;

export function UsersPage() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);

  const { data: users, isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: authService.getUsers,
  });

  const createMutation = useMutation({
    mutationFn: authService.createUser,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['users'] });
      toast.success('User created successfully!');
      setShowForm(false);
    },
    onError: handleApiError,
  });

  const { register, handleSubmit, reset, formState: { errors } } = useForm<UserFormData>({
    resolver: zodResolver(userSchema),
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">User Management</h1>
          <p className="page-subtitle">Manage system users and their roles</p>
        </div>
        <button onClick={() => setShowForm(true)} className="btn-primary">
          <Plus className="w-4 h-4" /> Add User
        </button>
      </div>

      <div className="card overflow-hidden">
        {isLoading ? (
          <TableSkeleton rows={5} cols={5} />
        ) : (
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Joined</th>
                </tr>
              </thead>
              <tbody>
                {users?.map((u: User) => (
                  <tr key={u.id}>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                          <span className="text-xs font-bold text-white">{u.name[0].toUpperCase()}</span>
                        </div>
                        <span className="font-medium text-slate-200">{u.name}</span>
                      </div>
                    </td>
                    <td className="text-slate-400">{u.email}</td>
                    <td><span className={ROLE_COLORS[u.role] ?? 'badge-gray'}>{u.role}</span></td>
                    <td>
                      <span className={u.isActive ? 'badge-green' : 'badge-red'}>
                        {u.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="text-slate-500 text-sm">
                      {u.createdAt ? format(new Date(u.createdAt), 'd MMM yyyy') : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal isOpen={showForm} onClose={() => { setShowForm(false); reset(); }} title="Add New User">
        <form
          onSubmit={handleSubmit((d) => createMutation.mutate(d as any))}
          className="space-y-4"
        >
          <div>
            <label className="form-label">Full Name *</label>
            <input {...register('name')} className={errors.name ? 'form-input-error' : 'form-input'} placeholder="John Doe" />
            {errors.name && <p className="form-error">{errors.name.message}</p>}
          </div>
          <div>
            <label className="form-label">Email *</label>
            <input type="email" {...register('email')} className={errors.email ? 'form-input-error' : 'form-input'} placeholder="john@company.com" />
            {errors.email && <p className="form-error">{errors.email.message}</p>}
          </div>
          <div>
            <label className="form-label">Password *</label>
            <input type="password" {...register('password')} className={errors.password ? 'form-input-error' : 'form-input'} placeholder="Min. 8 characters" />
            {errors.password && <p className="form-error">{errors.password.message}</p>}
          </div>
          <div>
            <label className="form-label">Role *</label>
            <select {...register('role')} className="form-select">
              <option value="ADMIN">Admin</option>
              <option value="SALES">Sales</option>
              <option value="WAREHOUSE">Warehouse</option>
              <option value="ACCOUNTS">Accounts</option>
            </select>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setShowForm(false)} className="btn-secondary btn-sm">Cancel</button>
            <button type="submit" disabled={createMutation.isPending} className="btn-primary btn-sm">
              {createMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
              Create User
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
