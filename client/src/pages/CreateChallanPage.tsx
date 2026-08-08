import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Trash2, ArrowLeft, Save, Loader2, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { challanService } from '../services/challan.service';
import { customerService } from '../services/customer.service';
import { productService } from '../services/product.service';
import { handleApiError } from '../lib/api';
import { Product } from '../types';

const challanSchema = z.object({
  customerId: z.string().min(1, 'Customer is required'),
  notes: z.string().optional(),
  items: z.array(z.object({
    productId: z.string().min(1, 'Product is required'),
    quantity: z.coerce.number().int().positive('Quantity must be a positive integer'),
  })).min(1, 'At least one product is required'),
});

type ChallanFormData = z.infer<typeof challanSchema>;

export function CreateChallanPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();

  const { data: customersData, isLoading: isCustomersLoading } = useQuery({
    queryKey: ['customers-dropdown'],
    queryFn: () => customerService.getAll({ limit: 500 }),
  });

  const { data: productsData, isLoading: isProductsLoading } = useQuery({
    queryKey: ['products-dropdown'],
    queryFn: () => productService.getAll({ limit: 500 }),
  });

  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors },
  } = useForm<ChallanFormData>({
    resolver: zodResolver(challanSchema),
    defaultValues: { items: [{ productId: '', quantity: 1 }] },
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'items' });

  const items = watch('items');
  const customers = customersData?.data || (customersData as any)?.customers || [];
  const products: Product[] = productsData?.data || (productsData as any)?.products || [];
  const productMap = new Map<string, Product>(products.map((p) => [p.id, p]));

  // Calculate totals
  const totals = items.reduce(
    (acc, item) => {
      const product = productMap.get(item.productId);
      if (product && item.quantity > 0) {
        acc.totalQty += Number(item.quantity);
        acc.totalAmount += Number(product.unitPrice) * Number(item.quantity);
      }
      return acc;
    },
    { totalQty: 0, totalAmount: 0 }
  );

  const createMutation = useMutation({
    mutationFn: challanService.create,
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['challans'] });
      toast.success(`Challan ${data.challanNumber} created as DRAFT!`);
      navigate(`/challans/${data.id}`);
    },
    onError: handleApiError,
  });

  const onSubmit = (data: ChallanFormData) => {
    createMutation.mutate(data as any);
  };

  const selectedProductIds = items.map((i) => i.productId).filter(Boolean);

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="btn-secondary btn-sm">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <div>
          <h1 className="page-title">Create Sales Challan</h1>
          <p className="page-subtitle">New challan will be created as DRAFT</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Customer Selection */}
        <div className="card p-5">
          <h3 className="font-semibold text-slate-200 mb-4">Step 1: Select Customer</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="form-label">Customer *</label>
              <select {...register('customerId')} className={errors.customerId ? 'form-input-error' : 'form-select'}>
                <option value="">
                  {isCustomersLoading
                    ? 'Loading customers...'
                    : customers.length === 0
                    ? 'No customers found'
                    : 'Select a customer...'}
                </option>
                {customers.map((c: any) => (
                  <option key={c.id} value={c.id}>
                    {c.customerName} {c.businessName ? `— ${c.businessName}` : ''} ({c.customerType})
                  </option>
                ))}
              </select>
              {errors.customerId && <p className="form-error">{errors.customerId.message}</p>}
            </div>
            <div>
              <label className="form-label">Notes (optional)</label>
              <input {...register('notes')} className="form-input" placeholder="Any remarks or special instructions" />
            </div>
          </div>
        </div>

        {/* Products */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-200">Step 2: Add Products</h3>
            <button
              type="button"
              onClick={() => append({ productId: '', quantity: 1 })}
              className="btn-secondary btn-sm"
            >
              <Plus className="w-3.5 h-3.5" /> Add Product
            </button>
          </div>

          {errors.items && !Array.isArray(errors.items) && (
            <div className="flex items-center gap-2 p-3 mb-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {errors.items.message}
            </div>
          )}

          <div className="space-y-3">
            {/* Header */}
            <div className="grid grid-cols-12 gap-3 px-1 text-xs font-semibold text-slate-500 uppercase tracking-wider">
              <div className="col-span-5">Product</div>
              <div className="col-span-2">SKU</div>
              <div className="col-span-2">Price</div>
              <div className="col-span-1">Stock</div>
              <div className="col-span-1">Qty</div>
              <div className="col-span-1 text-right">Sub</div>
            </div>

            {fields.map((field, index) => {
              const selectedProduct = productMap.get(items[index]?.productId);
              const qty = Number(items[index]?.quantity) || 0;
              const subtotal = selectedProduct ? Number(selectedProduct.unitPrice) * qty : 0;
              const isOverStock = selectedProduct && qty > selectedProduct.currentStock;

              return (
                <div
                  key={field.id}
                  className={`grid grid-cols-12 gap-3 items-center p-3 rounded-lg border transition-colors ${
                    isOverStock ? 'bg-red-500/5 border-red-500/30' : 'bg-slate-800/40 border-slate-700/60'
                  }`}
                >
                  <div className="col-span-5">
                    <select
                      {...register(`items.${index}.productId`)}
                      className="form-select text-sm py-2"
                    >
                      <option value="">
                        {isProductsLoading
                          ? 'Loading products...'
                          : products.length === 0
                          ? 'No products available'
                          : 'Select product...'}
                      </option>
                      {products
                        .filter((p) => !selectedProductIds.includes(p.id) || p.id === items[index]?.productId)
                        .map((p) => (
                          <option key={p.id} value={p.id} disabled={p.currentStock === 0}>
                            {p.productName} — ₹{Number(p.unitPrice).toLocaleString('en-IN')} [Stock: {p.currentStock}]
                            {p.currentStock === 0 ? ' (Out of stock)' : ''}
                          </option>
                        ))}
                    </select>
                  </div>
                  <div className="col-span-2">
                    <code className="text-xs text-slate-400">{selectedProduct?.sku ?? '—'}</code>
                  </div>
                  <div className="col-span-2 text-sm text-slate-300">
                    {selectedProduct ? `₹${Number(selectedProduct.unitPrice).toLocaleString('en-IN')}` : '—'}
                  </div>
                  <div className={`col-span-1 text-sm font-medium ${isOverStock ? 'text-red-400' : 'text-slate-300'}`}>
                    {selectedProduct?.currentStock ?? '—'}
                  </div>
                  <div className="col-span-1">
                    <input
                      type="number"
                      min={1}
                      {...register(`items.${index}.quantity`)}
                      className={`form-input text-sm py-2 text-center ${isOverStock ? 'border-red-500' : ''}`}
                    />
                  </div>
                  <div className="col-span-1 text-right flex items-center justify-end gap-1">
                    <span className="text-sm font-medium text-slate-200">
                      {subtotal > 0 ? `₹${subtotal.toLocaleString('en-IN')}` : '—'}
                    </span>
                    {fields.length > 1 && (
                      <button
                        type="button"
                        onClick={() => remove(index)}
                        className="btn-ghost p-1 text-red-400 hover:text-red-300"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {isOverStock && (
                    <div className="col-span-12 text-xs text-red-400 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" />
                      Quantity exceeds available stock ({selectedProduct?.currentStock})
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Totals */}
          <div className="mt-4 pt-4 border-t border-slate-700/60 flex justify-end">
            <div className="space-y-2 min-w-48">
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Total Quantity</span>
                <span className="font-semibold text-slate-200">{totals.totalQty}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Total Amount</span>
                <span className="text-xl font-bold text-slate-100">
                  ₹{totals.totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="flex items-center justify-end gap-3">
          <button type="button" onClick={() => navigate(-1)} className="btn-secondary">
            Cancel
          </button>
          <button type="submit" disabled={createMutation.isPending} className="btn-primary">
            {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save as Draft
          </button>
        </div>
      </form>
    </div>
  );
}
