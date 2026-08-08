import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Search, Edit2, Eye, Package, AlertTriangle, Loader2, Download } from 'lucide-react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { productService } from '../services/product.service';
import { Product, ProductQuery } from '../types';
import { TableSkeleton } from '../components/ui/Skeleton';
import { EmptyState, Pagination } from '../components/ui/index';
import { Modal } from '../components/ui/Modal';
import { useAuth } from '../lib/auth-context';
import { useCompany } from '../lib/company-context';
import { exportInventoryReport } from '../lib/export-utils';
import { handleApiError } from '../lib/api';

const productSchema = z.object({
  productName: z.string().min(2, 'Product name is required'),
  sku: z.string().min(2, 'SKU is required'),
  category: z.string().min(1, 'Category is required'),
  unitPrice: z.coerce.number().positive('Unit price must be > 0'),
  currentStock: z.coerce.number().int().min(0, 'Stock cannot be negative'),
  minimumStock: z.coerce.number().int().min(0, 'Min stock cannot be negative'),
  warehouseLocation: z.string().optional(),
});

type ProductFormData = z.infer<typeof productSchema>;

function getStockStatus(product: Product) {
  if (product.currentStock === 0) return { label: 'Out of Stock', cls: 'badge-red' };
  if (product.currentStock <= product.minimumStock) return { label: 'Low Stock', cls: 'badge-yellow' };
  return { label: 'Healthy', cls: 'badge-green' };
}

function ProductForm({ defaultValues, onSubmit, isLoading, categories = [] }: {
  defaultValues?: Partial<ProductFormData>;
  onSubmit: (d: ProductFormData) => void;
  isLoading: boolean;
  categories?: string[];
}) {
  const { register, handleSubmit, formState: { errors } } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues,
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="form-label">Product Name *</label>
          <input {...register('productName')} className={errors.productName ? 'form-input-error' : 'form-input'} placeholder="e.g. Basmati Rice 5kg" />
          {errors.productName && <p className="form-error">{errors.productName.message}</p>}
        </div>
        <div>
          <label className="form-label">SKU *</label>
          <input {...register('sku')} className={errors.sku ? 'form-input-error' : 'form-input'} placeholder="RICE-BAS-5KG" />
          {errors.sku && <p className="form-error">{errors.sku.message}</p>}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="form-label">Category *</label>
          <input
            {...register('category')}
            list="category-suggestions"
            className={errors.category ? 'form-input-error' : 'form-input'}
            placeholder="e.g. Grains, Oils, Spices..."
          />
          <datalist id="category-suggestions">
            {categories.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
          {errors.category && <p className="form-error">{errors.category.message}</p>}
        </div>
        <div>
          <label className="form-label">Unit Price (₹) *</label>
          <input type="number" step="0.01" {...register('unitPrice')} className={errors.unitPrice ? 'form-input-error' : 'form-input'} placeholder="0.00" />
          {errors.unitPrice && <p className="form-error">{errors.unitPrice.message}</p>}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="form-label">Current Stock</label>
          <input type="number" {...register('currentStock')} className="form-input" defaultValue={0} />
        </div>
        <div>
          <label className="form-label">Minimum Stock</label>
          <input type="number" {...register('minimumStock')} className="form-input" defaultValue={0} />
        </div>
      </div>

      <div>
        <label className="form-label">Warehouse Location</label>
        <input {...register('warehouseLocation')} className="form-input" placeholder="e.g. A-01" />
      </div>

      <div className="flex justify-end pt-2">
        <button type="submit" disabled={isLoading} className="btn-primary">
          {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
          {defaultValues?.productName ? 'Update Product' : 'Add Product'}
        </button>
      </div>
    </form>
  );
}

export function ProductsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [query, setQuery] = useState<ProductQuery>({});
  const [showForm, setShowForm] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);

  const canWrite = ['ADMIN', 'WAREHOUSE'].includes(user?.role ?? '');

  const { data, isLoading } = useQuery({
    queryKey: ['products', page, query],
    queryFn: () => productService.getAll({ page, limit: 10, ...query }),
  });

  const { data: categories } = useQuery({
    queryKey: ['product-categories'],
    queryFn: productService.getCategories,
  });

  const createMutation = useMutation({
    mutationFn: productService.create,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['products'] }); toast.success('Product added!'); setShowForm(false); },
    onError: handleApiError,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Product> }) => productService.update(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['products'] }); toast.success('Product updated!'); setEditProduct(null); },
    onError: handleApiError,
  });

  const { company } = useCompany();

  const handleExport = () => {
    const list = data?.data ?? [];
    if (list.length === 0) {
      toast.error('No products available to export.');
      return;
    }
    exportInventoryReport(list, company);
    toast.success(`Exported ${list.length} products to CSV!`);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Products</h1>
          <p className="page-subtitle">Manage your product catalogue and pricing</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleExport}
            className="btn-secondary btn-sm flex items-center gap-1.5"
            title="Export products to CSV / Excel"
          >
            <Download className="w-4 h-4" /> Export CSV
          </button>
          {canWrite && (
            <button onClick={() => setShowForm(true)} className="btn-primary btn-sm flex items-center gap-1.5">
              <Plus className="w-4 h-4" /> Add Product
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
              className="form-input pl-9"
              placeholder="Search product name or SKU..."
              value={query.search ?? ''}
              onChange={(e) => { setQuery(q => ({ ...q, search: e.target.value })); setPage(1); }}
            />
          </div>
          <select
            className="form-select sm:w-40"
            value={query.category ?? ''}
            onChange={(e) => { setQuery(q => ({ ...q, category: e.target.value || undefined })); setPage(1); }}
          >
            <option value="">All Categories</option>
            {categories?.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <select
            className="form-select sm:w-44"
            value={query.stockStatus ?? ''}
            onChange={(e) => { setQuery(q => ({ ...q, stockStatus: e.target.value as any || undefined })); setPage(1); }}
          >
            <option value="">All Stock</option>
            <option value="healthy">Healthy</option>
            <option value="low">Low Stock</option>
            <option value="out">Out of Stock</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        {isLoading ? (
          <TableSkeleton rows={8} cols={7} />
        ) : data?.data?.length === 0 ? (
          <EmptyState
            icon={<Package className="w-12 h-12" />}
            title="No products found"
            description="Add your first product to start managing inventory."
            action={canWrite ? (
              <button onClick={() => setShowForm(true)} className="btn-primary">
                <Plus className="w-4 h-4" /> Add Product
              </button>
            ) : undefined}
          />
        ) : (
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>SKU</th>
                  <th>Category</th>
                  <th>Unit Price</th>
                  <th>Stock</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {data?.data?.map((p) => {
                  const stock = getStockStatus(p);
                  return (
                    <tr key={p.id}>
                      <td>
                        <div>
                          <p className="font-medium text-slate-200">{p.productName}</p>
                          {p.warehouseLocation && <p className="text-xs text-slate-500">📍 {p.warehouseLocation}</p>}
                        </div>
                      </td>
                      <td><code className="text-xs bg-slate-800 px-1.5 py-0.5 rounded text-slate-300">{p.sku}</code></td>
                      <td><span className="badge-blue">{p.category}</span></td>
                      <td className="font-medium text-slate-200">₹{Number(p.unitPrice).toLocaleString('en-IN')}</td>
                      <td>
                        <div>
                          <span className="font-semibold text-slate-200">{p.currentStock}</span>
                          <span className="text-slate-500 text-xs"> / min {p.minimumStock}</span>
                        </div>
                      </td>
                      <td>
                        <div className="flex items-center gap-1">
                          {stock.label === 'Out of Stock' && <AlertTriangle className="w-3.5 h-3.5 text-red-400" />}
                          <span className={stock.cls}>{stock.label}</span>
                        </div>
                      </td>
                      <td>
                        <div className="flex items-center gap-1">
                          <button onClick={() => navigate(`/products/${p.id}`)} className="btn-ghost p-1.5" title="View">
                            <Eye className="w-4 h-4" />
                          </button>
                          {canWrite && (
                            <button onClick={() => setEditProduct(p)} className="btn-ghost p-1.5" title="Edit">
                              <Edit2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        {data?.pagination && (
          <div className="p-4">
            <Pagination page={data.pagination.page} totalPages={data.pagination.totalPages} total={data.pagination.total} limit={data.pagination.limit} onPageChange={setPage} />
          </div>
        )}
      </div>

      <Modal isOpen={showForm} onClose={() => setShowForm(false)} title="Add Product" size="lg">
        <ProductForm
          onSubmit={(d) => createMutation.mutate(d)}
          isLoading={createMutation.isPending}
          categories={categories ?? []}
        />
      </Modal>

      <Modal isOpen={!!editProduct} onClose={() => setEditProduct(null)} title="Edit Product" size="lg">
        {editProduct && (
          <ProductForm
            defaultValues={{ ...editProduct, unitPrice: Number(editProduct.unitPrice) }}
            onSubmit={(d) => updateMutation.mutate({ id: editProduct.id, data: d })}
            isLoading={updateMutation.isPending}
            categories={categories ?? []}
          />
        )}
      </Modal>
    </div>
  );
}
