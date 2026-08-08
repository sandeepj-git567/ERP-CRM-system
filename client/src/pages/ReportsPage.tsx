import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  FileSpreadsheet, Download, Calendar,
  Package, Users
} from 'lucide-react';
import toast from 'react-hot-toast';
import { challanService } from '../services/challan.service';
import { productService } from '../services/product.service';
import { customerService } from '../services/customer.service';
import { useCompany } from '../lib/company-context';
import {
  exportSalesGstReport,
  exportInventoryReport,
  exportCustomersReport,
} from '../lib/export-utils';

export function ReportsPage() {
  const { company } = useCompany();
  const [period, setPeriod] = useState<'this_month' | 'last_month' | 'all'>('this_month');

  const { data: challansData, isLoading: isChallansLoading } = useQuery({
    queryKey: ['challans-export', period],
    queryFn: () => challanService.getAll({ limit: 1000 }),
  });

  const { data: productsData, isLoading: isProductsLoading } = useQuery({
    queryKey: ['products-export'],
    queryFn: () => productService.getAll({ limit: 1000 }),
  });

  const { data: customersData, isLoading: isCustomersLoading } = useQuery({
    queryKey: ['customers-export'],
    queryFn: () => customerService.getAll({ limit: 1000 }),
  });

  const challans = challansData?.data || (challansData as any)?.challans || [];
  const products = productsData?.data || (productsData as any)?.products || [];
  const customers = customersData?.data || (customersData as any)?.customers || [];

  // Filter challans based on period
  const now = new Date();
  const filteredChallans = challans.filter((c) => {
    if (period === 'all') return true;
    const cDate = new Date(c.createdAt);
    if (period === 'this_month') {
      return cDate.getMonth() === now.getMonth() && cDate.getFullYear() === now.getFullYear();
    }
    if (period === 'last_month') {
      const prevMonth = now.getMonth() === 0 ? 11 : now.getMonth() - 1;
      const prevYear = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
      return cDate.getMonth() === prevMonth && cDate.getFullYear() === prevYear;
    }
    return true;
  });

  // Calculate GST summary
  const totalRevenue = filteredChallans
    .filter((c) => c.status === 'CONFIRMED')
    .reduce((sum, c) => sum + Number(c.totalAmount || 0), 0);

  const taxableRevenue = Number((totalRevenue / 1.18).toFixed(2));
  const totalCgst = Number(((totalRevenue - taxableRevenue) / 2).toFixed(2));
  const totalSgst = totalCgst;

  const totalInventoryValuation = products.reduce(
    (sum, p) => sum + p.currentStock * Number(p.unitPrice),
    0
  );

  const handleExportSales = () => {
    if (filteredChallans.length === 0) {
      toast.error('No challans found for the selected period.');
      return;
    }
    const label = period === 'this_month' ? 'This Month' : period === 'last_month' ? 'Last Month' : 'All Time';
    exportSalesGstReport(filteredChallans, company, label);
    toast.success(`Exported ${filteredChallans.length} sales records to Excel/CSV!`);
  };

  const handleExportInventory = () => {
    if (products.length === 0) {
      toast.error('No products found to export.');
      return;
    }
    exportInventoryReport(products, company);
    toast.success(`Exported ${products.length} product valuation records to Excel/CSV!`);
  };

  const handleExportCustomers = () => {
    if (customers.length === 0) {
      toast.error('No customers found to export.');
      return;
    }
    exportCustomersReport(customers, company);
    toast.success(`Exported ${customers.length} customer records to Excel/CSV!`);
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-6xl">
      <div className="page-header">
        <div>
          <h1 className="page-title">Reports & GST Export Center</h1>
          <p className="page-subtitle">
            1-click Excel and CSV exports for GSTR-1, sales dispatch, and stock valuation
          </p>
        </div>
      </div>

      {/* Period filter buttons */}
      <div className="card p-4 flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-blue-400" />
          <span className="text-sm font-semibold text-slate-300">Reporting Period:</span>
        </div>

        <div className="flex gap-2">
          {(
            [
              ['this_month', 'This Month'],
              ['last_month', 'Last Month'],
              ['all', 'All Records'],
            ] as const
          ).map(([val, label]) => (
            <button
              key={val}
              onClick={() => setPeriod(val)}
              className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all ${
                period === val
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                  : 'bg-slate-700/50 text-slate-400 hover:bg-slate-700'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* GST & Financial KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card p-5">
          <p className="text-xs text-slate-400 font-medium">Total Confirmed Sales</p>
          <p className="text-2xl font-bold text-slate-100 mt-1">
            ₹{totalRevenue.toLocaleString('en-IN')}
          </p>
          <p className="text-xs text-slate-500 mt-1">{filteredChallans.length} total orders in period</p>
        </div>

        <div className="card p-5">
          <p className="text-xs text-slate-400 font-medium">Estimated Taxable Base</p>
          <p className="text-2xl font-bold text-blue-400 mt-1">
            ₹{taxableRevenue.toLocaleString('en-IN')}
          </p>
          <p className="text-xs text-slate-500 mt-1">Excluding GST</p>
        </div>

        <div className="card p-5">
          <p className="text-xs text-slate-400 font-medium">CGST (9%) + SGST (9%)</p>
          <p className="text-2xl font-bold text-purple-400 mt-1">
            ₹{(totalCgst + totalSgst).toLocaleString('en-IN')}
          </p>
          <p className="text-xs text-slate-500 mt-1">₹{totalCgst.toLocaleString('en-IN')} each</p>
        </div>

        <div className="card p-5">
          <p className="text-xs text-slate-400 font-medium">Total Stock Valuation</p>
          <p className="text-2xl font-bold text-emerald-400 mt-1">
            ₹{totalInventoryValuation.toLocaleString('en-IN')}
          </p>
          <p className="text-xs text-slate-500 mt-1">Across {products.length} products</p>
        </div>
      </div>

      {/* 3 Main Export Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Export 1: GSTR-1 Sales */}
        <div className="card p-6 flex flex-col justify-between space-y-4 border-t-4 border-t-blue-500">
          <div>
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center mb-3">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-slate-100 text-lg">GSTR-1 Monthly Sales Report</h3>
            <p className="text-sm text-slate-400 mt-1 leading-relaxed">
              Export itemized sales challans, customer GSTIN numbers, taxable values, and 18% GST split ready for Tally / CA filing.
            </p>
          </div>

          <div className="pt-2 border-t border-slate-700/60 flex items-center justify-between">
            <span className="text-xs font-mono text-slate-400">{filteredChallans.length} records</span>
            <button
              onClick={handleExportSales}
              disabled={isChallansLoading}
              className="btn-primary btn-sm flex items-center gap-1.5"
            >
              <Download className="w-4 h-4" /> Export CSV / Excel
            </button>
          </div>
        </div>

        {/* Export 2: Inventory Valuation */}
        <div className="card p-6 flex flex-col justify-between space-y-4 border-t-4 border-t-emerald-500">
          <div>
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-3">
              <Package className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-slate-100 text-lg">Inventory & Stock Valuation</h3>
            <p className="text-sm text-slate-400 mt-1 leading-relaxed">
              Export all SKUs, categories, warehouse locations, live stock quantities, unit prices, and asset value.
            </p>
          </div>

          <div className="pt-2 border-t border-slate-700/60 flex items-center justify-between">
            <span className="text-xs font-mono text-slate-400">{products.length} products</span>
            <button
              onClick={handleExportInventory}
              disabled={isProductsLoading}
              className="btn-primary btn-sm bg-emerald-600 hover:bg-emerald-500 flex items-center gap-1.5"
            >
              <Download className="w-4 h-4" /> Export CSV / Excel
            </button>
          </div>
        </div>

        {/* Export 3: Customer CRM */}
        <div className="card p-6 flex flex-col justify-between space-y-4 border-t-4 border-t-purple-500">
          <div>
            <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center mb-3">
              <Users className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-slate-100 text-lg">Customer Master & CRM List</h3>
            <p className="text-sm text-slate-400 mt-1 leading-relaxed">
              Export all customer accounts with business names, GST numbers, phone contacts, lead statuses, and order totals.
            </p>
          </div>

          <div className="pt-2 border-t border-slate-700/60 flex items-center justify-between">
            <span className="text-xs font-mono text-slate-400">{customers.length} customers</span>
            <button
              onClick={handleExportCustomers}
              disabled={isCustomersLoading}
              className="btn-primary btn-sm bg-purple-600 hover:bg-purple-500 flex items-center gap-1.5"
            >
              <Download className="w-4 h-4" /> Export CSV / Excel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
