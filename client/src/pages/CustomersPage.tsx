import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Plus, Search, Edit2, Trash2, Eye, Phone, Building,
  Users, Loader2, CalendarCheck, X, Download
} from 'lucide-react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { customerService } from '../services/customer.service';
import { Customer, CustomerStatus, CustomerType } from '../types';
import { TableSkeleton } from '../components/ui/Skeleton';
import { EmptyState, Pagination, ConfirmDialog } from '../components/ui/index';
import { Modal } from '../components/ui/Modal';
import { useAuth } from '../lib/auth-context';
import { useCompany } from '../lib/company-context';
import { exportCustomersReport } from '../lib/export-utils';
import { handleApiError } from '../lib/api';

const statusColors: Record<CustomerStatus, string> = {
  LEAD: 'badge-yellow',
  ACTIVE: 'badge-green',
  INACTIVE: 'badge-gray',
};

const typeColors: Record<CustomerType, string> = {
  RETAIL: 'badge-blue',
  WHOLESALE: 'badge-purple',
  DISTRIBUTOR: 'badge-green',
};

const customerSchema = z.object({
  customerName: z.string().min(2, 'Name is required'),
  mobileNumber: z.string().min(10, 'Valid mobile number required'),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  businessName: z.string().min(2, 'Business name is required'),
  gstNumber: z.string().optional(),
  customerType: z.enum(['RETAIL', 'WHOLESALE', 'DISTRIBUTOR']),
  address: z.string().optional(),
  status: z.enum(['LEAD', 'ACTIVE', 'INACTIVE']),
  notes: z.string().optional(),
});

type CustomerFormData = z.infer<typeof customerSchema>;

function CustomerForm({
  defaultValues,
  onSubmit,
  isLoading,
}: {
  defaultValues?: Partial<CustomerFormData>;
  onSubmit: (data: CustomerFormData) => void;
  isLoading: boolean;
}) {
  const { register, handleSubmit, formState: { errors } } = useForm<CustomerFormData>({
    resolver: zodResolver(customerSchema),
    defaultValues: { status: 'LEAD', customerType: 'RETAIL', ...defaultValues },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="form-label">Customer Name *</label>
          <input {...register('customerName')} className={errors.customerName ? 'form-input-error' : 'form-input'} placeholder="Full name" />
          {errors.customerName && <p className="form-error">{errors.customerName.message}</p>}
        </div>
        <div>
          <label className="form-label">Mobile Number *</label>
          <input {...register('mobileNumber')} className={errors.mobileNumber ? 'form-input-error' : 'form-input'} placeholder="9876543210" />
          {errors.mobileNumber && <p className="form-error">{errors.mobileNumber.message}</p>}
        </div>
      </div>

      <div>
        <label className="form-label">Business Name *</label>
        <input {...register('businessName')} className={errors.businessName ? 'form-input-error' : 'form-input'} placeholder="Company or store name" />
        {errors.businessName && <p className="form-error">{errors.businessName.message}</p>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="form-label">Email</label>
          <input type="email" {...register('email')} className={errors.email ? 'form-input-error' : 'form-input'} placeholder="email@company.com" />
          {errors.email && <p className="form-error">{errors.email.message}</p>}
        </div>
        <div>
          <label className="form-label">GST Number</label>
          <input {...register('gstNumber')} className="form-input" placeholder="Optional" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="form-label">Customer Type *</label>
          <select {...register('customerType')} className="form-select">
            <option value="RETAIL">Retail</option>
            <option value="WHOLESALE">Wholesale</option>
            <option value="DISTRIBUTOR">Distributor</option>
          </select>
        </div>
        <div>
          <label className="form-label">Status *</label>
          <select {...register('status')} className="form-select">
            <option value="LEAD">Lead</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
          </select>
        </div>
      </div>

      <div>
        <label className="form-label">Address</label>
        <input {...register('address')} className="form-input" placeholder="Street, City, State" />
      </div>

      <div>
        <label className="form-label">Notes</label>
        <textarea {...register('notes')} className="form-input" rows={2} placeholder="Additional notes..." />
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <button type="submit" disabled={isLoading} className="btn-primary">
          {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
          {defaultValues?.customerName ? 'Update Customer' : 'Add Customer'}
        </button>
      </div>
    </form>
  );
}

export function CustomersPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<CustomerStatus | ''>('');
  const [typeFilter, setTypeFilter] = useState<CustomerType | ''>('');
  const [showForm, setShowForm] = useState(false);
  const [editCustomer, setEditCustomer] = useState<Customer | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const canWrite = ['ADMIN', 'SALES', 'ACCOUNTS'].includes(user?.role ?? '');

  const { data, isLoading } = useQuery({
    queryKey: ['customers', page, search, statusFilter, typeFilter],
    queryFn: () =>
      customerService.getAll({
        page,
        limit: 10,
        search: search || undefined,
        status: statusFilter || undefined,
        customerType: typeFilter || undefined,
      }),
  });

  const createMutation = useMutation({
    mutationFn: customerService.create,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['customers'] });
      toast.success('Customer added successfully!');
      setShowForm(false);
    },
    onError: handleApiError,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Customer> }) =>
      customerService.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['customers'] });
      toast.success('Customer updated!');
      setEditCustomer(null);
    },
    onError: handleApiError,
  });

  const deleteMutation = useMutation({
    mutationFn: customerService.delete,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['customers'] });
      toast.success('Customer deactivated.');
      setDeleteId(null);
    },
    onError: handleApiError,
  });

  const { company } = useCompany();

  const handleExport = () => {
    const list = data?.data ?? [];
    if (list.length === 0) {
      toast.error('No customers available to export.');
      return;
    }
    exportCustomersReport(list, company);
    toast.success(`Exported ${list.length} customer records to CSV!`);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Customers CRM</h1>
          <p className="page-subtitle">Manage your customer relationships and lead follow-ups</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleExport}
            className="btn-secondary btn-sm flex items-center gap-1.5"
            title="Export customers to CSV / Excel"
          >
            <Download className="w-4 h-4" /> Export CSV
          </button>
          {canWrite && (
            <button onClick={() => setShowForm(true)} className="btn-primary btn-sm flex items-center gap-1.5">
              <Plus className="w-4 h-4" /> Add Customer
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name, mobile, or business..."
              className="form-input pl-9"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <select
            className="form-select sm:w-40"
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value as any); setPage(1); }}
          >
            <option value="">All Status</option>
            <option value="LEAD">Lead</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
          </select>
          <select
            className="form-select sm:w-44"
            value={typeFilter}
            onChange={(e) => { setTypeFilter(e.target.value as any); setPage(1); }}
          >
            <option value="">All Types</option>
            <option value="RETAIL">Retail</option>
            <option value="WHOLESALE">Wholesale</option>
            <option value="DISTRIBUTOR">Distributor</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        {isLoading ? (
          <TableSkeleton rows={8} cols={6} />
        ) : data?.data?.length === 0 ? (
          <EmptyState
            icon={<Users className="w-12 h-12" />}
            title="No customers found"
            description="Start by adding your first customer."
            action={canWrite ? (
              <button onClick={() => setShowForm(true)} className="btn-primary">
                <Plus className="w-4 h-4" /> Add Customer
              </button>
            ) : undefined}
          />
        ) : (
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Business</th>
                  <th>Mobile</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th>Follow-up</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {data?.data?.map((c) => (
                  <tr key={c.id}>
                    <td>
                      <div>
                        <p className="font-medium text-slate-200">{c.customerName}</p>
                        {c.email && <p className="text-xs text-slate-500">{c.email}</p>}
                      </div>
                    </td>
                    <td>
                      <div className="flex items-center gap-1.5">
                        <Building className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
                        <span className="text-sm">{c.businessName}</span>
                      </div>
                    </td>
                    <td>
                      <div className="flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
                        <span className="text-sm">{c.mobileNumber}</span>
                      </div>
                    </td>
                    <td><span className={typeColors[c.customerType]}>{c.customerType}</span></td>
                    <td><span className={statusColors[c.status]}>{c.status}</span></td>
                    <td>
                      {c.followUpDate ? (
                        <div className="flex items-center gap-1.5 text-sm text-orange-400">
                          <CalendarCheck className="w-3.5 h-3.5" />
                          {format(new Date(c.followUpDate), 'd MMM yyyy')}
                        </div>
                      ) : (
                        <span className="text-slate-600">—</span>
                      )}
                    </td>
                    <td>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => navigate(`/customers/${c.id}`)}
                          className="btn-ghost p-1.5"
                          title="View details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {canWrite && (
                          <>
                            <button
                              onClick={() => setEditCustomer(c)}
                              className="btn-ghost p-1.5"
                              title="Edit"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setDeleteId(c.id)}
                              className="btn-ghost p-1.5 text-red-400 hover:text-red-300"
                              title="Deactivate"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {data?.pagination && (
          <div className="p-4">
            <Pagination
              page={data.pagination.page}
              totalPages={data.pagination.totalPages}
              total={data.pagination.total}
              limit={data.pagination.limit}
              onPageChange={setPage}
            />
          </div>
        )}
      </div>

      {/* Add Modal */}
      <Modal
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        title="Add Customer"
        size="xl"
      >
        <CustomerForm
          onSubmit={(d) => createMutation.mutate(d)}
          isLoading={createMutation.isPending}
        />
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={!!editCustomer}
        onClose={() => setEditCustomer(null)}
        title="Edit Customer"
        size="xl"
      >
        {editCustomer && (
          <CustomerForm
            defaultValues={editCustomer as any}
            onSubmit={(d) => updateMutation.mutate({ id: editCustomer.id, data: d })}
            isLoading={updateMutation.isPending}
          />
        )}
      </Modal>

      {/* Delete confirm */}
      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={() => deleteId && deleteMutation.mutate(deleteId)}
        title="Deactivate Customer"
        message="This will set the customer status to INACTIVE. Are you sure?"
        confirmText="Deactivate"
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
