import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Search, Package } from 'lucide-react';
import { productService } from '../services/product.service';
import { TableSkeleton } from '../components/ui/Skeleton';
import { EmptyState, Pagination } from '../components/ui/index';

export function InventoryPage() {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [stockStatus, setStockStatus] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['inventory-movements', page, search, stockStatus],
    queryFn: () =>
      productService.getAll({
        page,
        limit: 15,
        search: search || undefined,
        stockStatus: stockStatus as any || undefined,
      }),
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Inventory</h1>
          <p className="page-subtitle">Monitor stock levels across all products</p>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Healthy Stock', filter: 'healthy', cls: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' },
          { label: 'Low Stock', filter: 'low', cls: 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400' },
          { label: 'Out of Stock', filter: 'out', cls: 'bg-red-500/10 border-red-500/30 text-red-400' },
        ].map((s) => (
          <button
            key={s.filter}
            onClick={() => setStockStatus(stockStatus === s.filter ? '' : s.filter)}
            className={`card p-4 text-center border transition-all hover:-translate-y-0.5 ${stockStatus === s.filter ? s.cls : 'border-slate-700/60 text-slate-400 hover:border-slate-600'}`}
          >
            <p className="text-sm font-medium">{s.label}</p>
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            className="form-input pl-9"
            placeholder="Search product name or SKU..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        {isLoading ? (
          <TableSkeleton rows={10} cols={6} />
        ) : data?.data?.length === 0 ? (
          <EmptyState icon={<Package className="w-12 h-12" />} title="No products found" />
        ) : (
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>SKU</th>
                  <th>Category</th>
                  <th>Current Stock</th>
                  <th>Min Stock</th>
                  <th>Unit Price</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {data?.data?.map((p) => {
                  const isOut = p.currentStock === 0;
                  const isLow = !isOut && p.currentStock <= p.minimumStock;
                  const statusCls = isOut ? 'badge-red' : isLow ? 'badge-yellow' : 'badge-green';
                  const statusLabel = isOut ? 'Out of Stock' : isLow ? 'Low Stock' : 'Healthy';

                  return (
                    <tr key={p.id} className="cursor-pointer" onClick={() => navigate(`/products/${p.id}`)}>
                      <td className="font-medium text-slate-200">{p.productName}</td>
                      <td><code className="text-xs bg-slate-800 px-1.5 py-0.5 rounded text-slate-400">{p.sku}</code></td>
                      <td><span className="badge-blue">{p.category}</span></td>
                      <td>
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${isOut ? 'bg-red-400' : isLow ? 'bg-yellow-400' : 'bg-emerald-400'}`} />
                          <span className={`font-semibold ${isOut ? 'text-red-400' : isLow ? 'text-yellow-400' : 'text-emerald-400'}`}>
                            {p.currentStock}
                          </span>
                        </div>
                      </td>
                      <td className="text-slate-400">{p.minimumStock}</td>
                      <td className="text-slate-200">₹{Number(p.unitPrice).toLocaleString('en-IN')}</td>
                      <td><span className={statusCls}>{statusLabel}</span></td>
                    </tr>
                  );
                })}
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
