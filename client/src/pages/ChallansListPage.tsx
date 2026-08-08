import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, FileText, Eye, X, Download } from 'lucide-react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { challanService } from '../services/challan.service';
import { customerService } from '../services/customer.service';
import { ChallanStatus } from '../types';
import { TableSkeleton } from '../components/ui/Skeleton';
import { EmptyState, Pagination } from '../components/ui/index';
import { useAuth } from '../lib/auth-context';
import { useCompany } from '../lib/company-context';
import { exportSalesGstReport } from '../lib/export-utils';

const statusColors: Record<ChallanStatus, string> = {
  DRAFT: 'badge-yellow',
  CONFIRMED: 'badge-green',
  CANCELLED: 'badge-red',
};

export function ChallansListPage() {
  const { user } = useAuth();
  const { company } = useCompany();
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<ChallanStatus | ''>('');
  const [customerFilter, setCustomerFilter] = useState('');

  const canCreate = ['ADMIN', 'SALES'].includes(user?.role ?? '');

  const { data: customersData } = useQuery({
    queryKey: ['customers-dropdown'],
    queryFn: () => customerService.getAll({ limit: 500 }),
  });

  const customers = customersData?.data || (customersData as any)?.customers || [];

  const { data, isLoading } = useQuery({
    queryKey: ['challans', page, search, statusFilter, customerFilter],
    queryFn: () =>
      challanService.getAll({
        page,
        limit: 10,
        search: search || undefined,
        status: statusFilter || undefined,
        customerId: customerFilter || undefined,
      }),
  });

  const handleExport = () => {
    const list = data?.data ?? [];
    if (list.length === 0) {
      toast.error('No challan records available to export.');
      return;
    }
    exportSalesGstReport(list, company, statusFilter || 'Filtered View');
    toast.success(`Exported ${list.length} challans to CSV!`);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Sales Challans</h1>
          <p className="page-subtitle">Manage your sales orders and dispatch records</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleExport}
            className="btn-secondary btn-sm flex items-center gap-1.5"
            title="Export current list to CSV / Excel"
          >
            <Download className="w-4 h-4" /> Export CSV
          </button>
          {canCreate && (
            <button onClick={() => navigate('/challans/new')} className="btn-primary btn-sm flex items-center gap-1.5">
              <Plus className="w-4 h-4" /> Create Challan
            </button>
          )}
        </div>
      </div>

      {/* Status tabs */}
      <div className="flex gap-2 flex-wrap">
        {([['', 'All'], ['DRAFT', 'Draft'], ['CONFIRMED', 'Confirmed'], ['CANCELLED', 'Cancelled']] as const).map(([val, label]) => (
          <button
            key={val}
            onClick={() => { setStatusFilter(val as any); setPage(1); }}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${statusFilter === val ? 'bg-blue-600 text-white' : 'bg-slate-700/50 text-slate-400 hover:bg-slate-700'}`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Search and Customer Filter */}
      <div className="card p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              className="form-input pl-9"
              placeholder="Search challan number or customer..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <select
            className="form-select sm:w-64"
            value={customerFilter}
            onChange={(e) => { setCustomerFilter(e.target.value); setPage(1); }}
          >
            <option value="">All Customers</option>
            {customers.map((c: any) => (
              <option key={c.id} value={c.id}>
                {c.customerName} ({c.businessName})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        {isLoading ? (
          <TableSkeleton rows={8} cols={6} />
        ) : data?.data?.length === 0 ? (
          <EmptyState
            icon={<FileText className="w-12 h-12" />}
            title="No challans found"
            description="Create your first sales challan to get started."
            action={canCreate ? (
              <button onClick={() => navigate('/challans/new')} className="btn-primary">
                <Plus className="w-4 h-4" /> Create Challan
              </button>
            ) : undefined}
          />
        ) : (
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>Challan No.</th>
                  <th>Customer</th>
                  <th>Items</th>
                  <th>Total Qty</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {data?.data?.map((c) => (
                  <tr key={c.id}>
                    <td>
                      <code className="text-sm font-mono text-blue-400">{c.challanNumber}</code>
                    </td>
                    <td>
                      <div>
                        <p className="font-medium text-slate-200">{c.customer?.customerName}</p>
                        <p className="text-xs text-slate-500">{c.customer?.businessName}</p>
                      </div>
                    </td>
                    <td className="text-slate-400">{c._count?.items ?? '?'} item(s)</td>
                    <td className="text-slate-200 font-medium">{c.totalQuantity}</td>
                    <td className="text-slate-200 font-medium">₹{Number(c.totalAmount).toLocaleString('en-IN')}</td>
                    <td><span className={statusColors[c.status]}>{c.status}</span></td>
                    <td className="text-slate-400 text-sm">{format(new Date(c.createdAt), 'd MMM yyyy')}</td>
                    <td>
                      <button
                        onClick={() => navigate(`/challans/${c.id}`)}
                        className="btn-ghost p-1.5"
                        title="View"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
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
    </div>
  );
}
