import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, Plus, AlertTriangle, TrendingUp, TrendingDown, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { productService } from '../services/product.service';
import { Modal } from '../components/ui/Modal';
import { LoadingSpinner, EmptyState, Pagination } from '../components/ui/index';
import { useAuth } from '../lib/auth-context';
import { handleApiError } from '../lib/api';

const stockSchema = z.object({
  movementType: z.enum(['IN', 'OUT']),
  quantity: z.coerce.number().int().positive('Quantity must be a positive integer'),
  reason: z.string().min(1, 'Reason is required'),
});

type StockFormData = z.infer<typeof stockSchema>;

function getStockStatus(currentStock: number, minimumStock: number) {
  if (currentStock === 0) return { label: 'Out of Stock', cls: 'badge-red' };
  if (currentStock <= minimumStock) return { label: 'Low Stock', cls: 'badge-yellow' };
  return { label: 'Healthy', cls: 'badge-green' };
}

export function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [showStock, setShowStock] = useState(false);
  const [movPage, setMovPage] = useState(1);

  const canManage = ['ADMIN', 'WAREHOUSE'].includes(user?.role ?? '');

  const { data: product, isLoading } = useQuery({
    queryKey: ['product', id],
    queryFn: () => productService.getById(id!),
    enabled: !!id,
  });

  const { data: movData } = useQuery({
    queryKey: ['movements', id, movPage],
    queryFn: () => productService.getMovements(id!, movPage),
    enabled: !!id,
  });

  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm<StockFormData>({
    resolver: zodResolver(stockSchema),
    defaultValues: { movementType: 'IN' },
  });

  const movementType = watch('movementType');

  const stockMutation = useMutation({
    mutationFn: (data: StockFormData) => productService.addStock(id!, {
      quantity: Number(data.quantity),
      movementType: data.movementType,
      reason: data.reason,
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['product', id] });
      qc.invalidateQueries({ queryKey: ['movements', id] });
      toast.success('Stock updated successfully!');
      setShowStock(false);
      reset();
    },
    onError: handleApiError,
  });

  if (isLoading) return <LoadingSpinner />;
  if (!product) return <div className="text-slate-400">Product not found.</div>;

  const stockStatus = getStockStatus(product.currentStock, product.minimumStock);

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="btn-secondary btn-sm">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <div>
          <h1 className="page-title">{product.productName}</h1>
          <code className="text-sm text-slate-400">{product.sku}</code>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Product Info */}
        <div className="card p-5 space-y-4">
          <h3 className="font-semibold text-slate-200">Product Details</h3>

          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-500">Category</span>
              <span className="badge-blue">{product.category}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Unit Price</span>
              <span className="font-semibold text-slate-200">₹{Number(product.unitPrice).toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Location</span>
              <span className="text-slate-300">{product.warehouseLocation || '—'}</span>
            </div>
            <div className="divider" />
            <div className="flex justify-between">
              <span className="text-slate-500">Current Stock</span>
              <span className={`text-xl font-bold ${product.currentStock === 0 ? 'text-red-400' : product.currentStock <= product.minimumStock ? 'text-yellow-400' : 'text-emerald-400'}`}>
                {product.currentStock}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Min Stock</span>
              <span className="text-slate-300">{product.minimumStock}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Status</span>
              <span className={stockStatus.cls}>{stockStatus.label}</span>
            </div>
          </div>

          {stockStatus.label !== 'Healthy' && (
            <div className="flex items-center gap-2 p-2.5 bg-yellow-500/10 border border-yellow-500/20 rounded-lg text-xs text-yellow-400">
              <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
              {stockStatus.label === 'Out of Stock' ? 'Needs immediate restock' : 'Stock running low'}
            </div>
          )}

          {canManage && (
            <button onClick={() => setShowStock(true)} className="btn-primary w-full justify-center">
              <Plus className="w-4 h-4" /> Update Stock
            </button>
          )}
        </div>

        {/* Movement History */}
        <div className="card md:col-span-2">
          <div className="flex items-center justify-between p-5 border-b border-slate-700/60">
            <h3 className="font-semibold text-slate-200">Stock Movement History</h3>
          </div>
          <div>
            {!movData?.data?.length ? (
              <EmptyState title="No movements yet" description="Stock movements will appear here." />
            ) : (
              <div className="divide-y divide-slate-700/40">
                {movData.data.map((m) => (
                  <div key={m.id} className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${m.movementType === 'IN' ? 'bg-emerald-500/10' : 'bg-red-500/10'}`}>
                        {m.movementType === 'IN' ? (
                          <TrendingUp className="w-4 h-4 text-emerald-400" />
                        ) : (
                          <TrendingDown className="w-4 h-4 text-red-400" />
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-200">{m.reason}</p>
                        <p className="text-xs text-slate-500">by {m.createdBy.name}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-semibold ${m.movementType === 'IN' ? 'text-emerald-400' : 'text-red-400'}`}>
                        {m.movementType === 'IN' ? '+' : '-'}{m.quantity}
                      </p>
                      <p className="text-xs text-slate-500">{format(new Date(m.createdAt), 'd MMM, HH:mm')}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {movData?.pagination && (
              <div className="p-4">
                <Pagination
                  page={movData.pagination.page}
                  totalPages={movData.pagination.totalPages}
                  total={movData.pagination.total}
                  limit={movData.pagination.limit}
                  onPageChange={setMovPage}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Stock Modal */}
      <Modal isOpen={showStock} onClose={() => setShowStock(false)} title="Update Stock">
        <form onSubmit={handleSubmit((d) => stockMutation.mutate(d))} className="space-y-4">
          <div>
            <label className="form-label">Movement Type</label>
            <div className="grid grid-cols-2 gap-3">
              {(['IN', 'OUT'] as const).map((type) => (
                <label key={type} className={`flex items-center justify-center gap-2 p-3 rounded-lg border cursor-pointer transition-all ${movementType === type ? 'border-blue-500 bg-blue-500/10 text-blue-400' : 'border-slate-600 text-slate-400 hover:border-slate-500'}`}>
                  <input type="radio" {...register('movementType')} value={type} className="hidden" />
                  {type === 'IN' ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                  {type === 'IN' ? 'Stock In' : 'Stock Out'}
                </label>
              ))}
            </div>
          </div>
          <div>
            <label className="form-label">Quantity *</label>
            <input type="number" {...register('quantity')} className={errors.quantity ? 'form-input-error' : 'form-input'} placeholder="Enter quantity" min={1} />
            {errors.quantity && <p className="form-error">{errors.quantity.message}</p>}
          </div>
          <div>
            <label className="form-label">Reason *</label>
            <input {...register('reason')} className={errors.reason ? 'form-input-error' : 'form-input'} placeholder="e.g. Supplier delivery, damaged goods..." />
            {errors.reason && <p className="form-error">{errors.reason.message}</p>}
          </div>
          <div className="bg-slate-800/50 rounded-lg p-3 text-sm">
            <span className="text-slate-400">Current stock: </span>
            <span className="font-semibold text-slate-200">{product.currentStock}</span>
          </div>
          <div className="flex justify-end gap-3">
            <button type="button" onClick={() => setShowStock(false)} className="btn-secondary btn-sm">Cancel</button>
            <button type="submit" disabled={stockMutation.isPending} className="btn-primary btn-sm">
              {stockMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
              Update Stock
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
