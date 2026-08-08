import { SalesChallan, Product, Customer } from '../types';
import { CompanyProfile } from './company-context';

export function downloadCsvFile(filename: string, csvContent: string) {
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function escapeCsv(val: any): string {
  if (val === null || val === undefined) return '""';
  const str = String(val).replace(/"/g, '""');
  return `"${str}"`;
}

// ─── 1. GSTR-1 Sales Report Export ───────────────────────────────────────────
export function exportSalesGstReport(challans: SalesChallan[], company: CompanyProfile, period = 'Current Period') {
  const headers = [
    'Challan Number',
    'Date',
    'Customer Name',
    'Customer Business',
    'Customer GSTIN',
    'Customer Type',
    'State Code',
    'Items Count',
    'Total Quantity',
    'Taxable Value (INR)',
    'CGST 9% (INR)',
    'SGST 9% (INR)',
    'IGST 0% (INR)',
    'Grand Total (INR)',
    'Status',
    'Created By',
  ];

  const rows = challans.map((c) => {
    const total = Number(c.totalAmount || 0);
    // Standard 18% GST calculation (9% CGST + 9% SGST for intra-state)
    const taxable = Number((total / 1.18).toFixed(2));
    const cgst = Number(((total - taxable) / 2).toFixed(2));
    const sgst = Number(((total - taxable) / 2).toFixed(2));
    const igst = 0;

    return [
      c.challanNumber,
      new Date(c.createdAt).toLocaleDateString('en-IN'),
      c.customer?.customerName || '',
      c.customer?.businessName || '',
      c.customer?.gstNumber || 'URP (Unregistered)',
      (c.customer as any)?.customerType || 'RETAIL',
      company.stateCode,
      c._count?.items ?? c.items?.length ?? 0,
      c.totalQuantity,
      taxable,
      cgst,
      sgst,
      igst,
      total,
      c.status,
      c.createdBy?.name || '',
    ]
      .map(escapeCsv)
      .join(',');
  });

  const titleHeader = [
    escapeCsv(`COMPANY: ${company.companyName}`),
    escapeCsv(`GSTIN: ${company.gstin}`),
    escapeCsv(`PERIOD: ${period}`),
    escapeCsv(`GENERATED: ${new Date().toLocaleString('en-IN')}`),
  ].join(',');

  const csv = [titleHeader, '', headers.map(escapeCsv).join(','), ...rows].join('\r\n');
  const filename = `Sales_GST_Report_${period.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.csv`;
  downloadCsvFile(filename, csv);
}

// ─── 2. Inventory Valuation Report Export ────────────────────────────────────
export function exportInventoryReport(products: Product[], company: CompanyProfile) {
  const headers = [
    'SKU',
    'Product Name',
    'Category',
    'Unit Price (INR)',
    'Current Stock',
    'Minimum Stock',
    'Total Stock Value (INR)',
    'Warehouse Location',
    'Status',
    'Last Updated',
  ];

  const rows = products.map((p) => {
    const stock = p.currentStock;
    const price = Number(p.unitPrice);
    const value = Number((stock * price).toFixed(2));
    const status = stock === 0 ? 'Out of Stock' : stock <= p.minimumStock ? 'Low Stock' : 'Healthy';

    return [
      p.sku,
      p.productName,
      p.category,
      price,
      stock,
      p.minimumStock,
      value,
      p.warehouseLocation || 'Main Hub',
      status,
      new Date(p.updatedAt).toLocaleDateString('en-IN'),
    ]
      .map(escapeCsv)
      .join(',');
  });

  const totalValue = products.reduce((sum, p) => sum + p.currentStock * Number(p.unitPrice), 0);
  const summaryHeader = [
    escapeCsv(`COMPANY: ${company.companyName}`),
    escapeCsv(`TOTAL VALUATION: INR ${totalValue.toLocaleString('en-IN')}`),
    escapeCsv(`TOTAL ITEMS: ${products.length}`),
    escapeCsv(`GENERATED: ${new Date().toLocaleString('en-IN')}`),
  ].join(',');

  const csv = [summaryHeader, '', headers.map(escapeCsv).join(','), ...rows].join('\r\n');
  const filename = `Inventory_Valuation_${new Date().toISOString().slice(0, 10)}.csv`;
  downloadCsvFile(filename, csv);
}

// ─── 3. Customer CRM Export ──────────────────────────────────────────────────
export function exportCustomersReport(customers: Customer[], company: CompanyProfile) {
  const headers = [
    'Customer Name',
    'Business Name',
    'Mobile Number',
    'Email',
    'GSTIN',
    'Customer Type',
    'Status',
    'Total Orders/Challans',
    'Total Follow-ups',
    'Next Follow-up Date',
    'Registered Address',
    'Joined Date',
  ];

  const rows = customers.map((c) => {
    return [
      c.customerName,
      c.businessName,
      c.mobileNumber,
      c.email || '',
      c.gstNumber || 'URP',
      c.customerType,
      c.status,
      c._count?.challans ?? 0,
      c._count?.followUps ?? 0,
      c.followUpDate ? new Date(c.followUpDate).toLocaleDateString('en-IN') : 'None Scheduled',
      c.address || '',
      new Date(c.createdAt).toLocaleDateString('en-IN'),
    ]
      .map(escapeCsv)
      .join(',');
  });

  const titleHeader = [
    escapeCsv(`COMPANY: ${company.companyName}`),
    escapeCsv(`TOTAL CUSTOMERS: ${customers.length}`),
    escapeCsv(`GENERATED: ${new Date().toLocaleString('en-IN')}`),
  ].join(',');

  const csv = [titleHeader, '', headers.map(escapeCsv).join(','), ...rows].join('\r\n');
  const filename = `Customer_CRM_${new Date().toISOString().slice(0, 10)}.csv`;
  downloadCsvFile(filename, csv);
}
