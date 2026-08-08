import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft, CheckCircle2, XCircle, Building,
  Phone, FileText, AlertTriangle, Package, Printer,
  MessageSquare
} from 'lucide-react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { challanService } from '../services/challan.service';
import { LoadingSpinner, ConfirmDialog } from '../components/ui/index';
import { useAuth } from '../lib/auth-context';
import { useCompany } from '../lib/company-context';
import { handleApiError } from '../lib/api';
import { ChallanStatus } from '../types';
import { DispatchNotificationModal } from '../components/challan/DispatchNotificationModal';

const STATUS_CONFIG: Record<ChallanStatus, { cls: string; label: string }> = {
  DRAFT: { cls: 'badge-yellow', label: 'DRAFT' },
  CONFIRMED: { cls: 'badge-green', label: 'CONFIRMED' },
  CANCELLED: { cls: 'badge-red', label: 'CANCELLED' },
};

export function ChallanDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { company } = useCompany();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [showConfirm, setShowConfirm] = useState(false);
  const [showCancel, setShowCancel] = useState(false);
  const [showNotificationModal, setShowNotificationModal] = useState(false);

  const canManage = ['ADMIN', 'SALES'].includes(user?.role ?? '');

  const { data: challan, isLoading } = useQuery({
    queryKey: ['challan', id],
    queryFn: () => challanService.getById(id!),
    enabled: !!id,
  });

  const confirmMutation = useMutation({
    mutationFn: () => challanService.confirm(id!),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ['challan', id] });
      qc.invalidateQueries({ queryKey: ['challans'] });
      qc.invalidateQueries({ queryKey: ['products'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success(res.message ?? 'Challan confirmed! Stock deducted.');
      setShowConfirm(false);
      setShowNotificationModal(true);
    },
    onError: (err) => {
      handleApiError(err);
      setShowConfirm(false);
    },
  });

  const cancelMutation = useMutation({
    mutationFn: () => challanService.cancel(id!),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['challan', id] });
      qc.invalidateQueries({ queryKey: ['challans'] });
      qc.invalidateQueries({ queryKey: ['products'] });
      toast.success('Challan cancelled.');
      setShowCancel(false);
    },
    onError: (err) => {
      handleApiError(err);
      setShowCancel(false);
    },
  });

  if (isLoading) return <LoadingSpinner text="Loading challan..." />;
  if (!challan) return <div className="text-slate-400">Challan not found.</div>;

  const statusCfg = STATUS_CONFIG[challan.status];
  const totalAmount = Number(challan.totalAmount || 0);

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl">
      {/* ─── Screen Header (Hidden on Print) ─────────────────────────────────── */}
      <div className="flex items-center justify-between flex-wrap gap-3 print:hidden">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="btn-secondary btn-sm">
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="page-title font-mono">{challan.challanNumber}</h1>
              <span className={statusCfg.cls}>{statusCfg.label}</span>
            </div>
            <p className="page-subtitle">
              Created {format(new Date(challan.createdAt), 'd MMMM yyyy, HH:mm')} by {challan.createdBy?.name}
            </p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setShowNotificationModal(true)}
            className="btn-secondary btn-sm flex items-center gap-1.5 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/10"
            title="Send WhatsApp or Email Dispatch Alert"
          >
            <MessageSquare className="w-4 h-4 text-emerald-400" /> Notify Customer
          </button>

          <button
            onClick={() => window.print()}
            className="btn-secondary btn-sm"
            title="Print Delivery Challan Receipt"
          >
            <Printer className="w-4 h-4" /> Print / PDF
          </button>

          {canManage && challan.status === 'DRAFT' && (
            <>
              <button onClick={() => setShowCancel(true)} className="btn-danger btn-sm">
                <XCircle className="w-4 h-4" /> Cancel
              </button>
              <button onClick={() => setShowConfirm(true)} className="btn-success btn-sm">
                <CheckCircle2 className="w-4 h-4" /> Confirm Challan
              </button>
            </>
          )}

          {canManage && challan.status === 'CONFIRMED' && (
            <button onClick={() => setShowCancel(true)} className="btn-danger btn-sm">
              <XCircle className="w-4 h-4" /> Cancel & Restore Stock
            </button>
          )}
        </div>
      </div>

      {/* ─── Printable Tax Invoice / Delivery Challan Header (Visible on Print) ─── */}
      <div className="hidden print:block border border-black p-4 mb-4 text-black text-xs leading-tight">
        <div className="flex justify-between items-start border-b border-black pb-3 mb-3">
          <div>
            <h1 className="text-base font-bold uppercase tracking-wider">{company.companyName}</h1>
            <p className="text-[11px] text-gray-700">{company.address}, {company.city}, {company.state} - {company.pincode}</p>
            <p className="mt-1">
              <strong>GSTIN:</strong> {company.gstin} | <strong>PAN:</strong> {company.pan} | <strong>State:</strong> {company.state} ({company.stateCode})
            </p>
            <p><strong>Contact:</strong> {company.phone} | <strong>Email:</strong> {company.email}</p>
          </div>
          <div className="text-right">
            <h2 className="text-sm font-bold uppercase bg-gray-200 px-2 py-1 border border-black inline-block">
              DELIVERY CHALLAN
            </h2>
            <p className="mt-1 font-mono font-bold">Challan No: {challan.challanNumber}</p>
            <p>Date: {format(new Date(challan.createdAt), 'dd/MM/yyyy')}</p>
            <p>Status: <strong>{challan.status}</strong></p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 border-b border-black pb-3 mb-3">
          <div>
            <p className="font-bold uppercase text-[10px] text-gray-600">CONSIGNEE / BILLED TO:</p>
            <p className="font-bold text-sm">{challan.customer?.customerName}</p>
            <p>{challan.customer?.businessName}</p>
            <p>{challan.customer?.address || 'Address on file'}</p>
            <p><strong>Mobile:</strong> {challan.customer?.mobileNumber}</p>
            <p><strong>GSTIN:</strong> {challan.customer?.gstNumber || 'URP (Unregistered)'}</p>
          </div>
          <div className="text-right">
            <p className="font-bold uppercase text-[10px] text-gray-600">DISPATCH & BANK DETAILS:</p>
            <p><strong>Bank:</strong> {company.bankName} ({company.branch})</p>
            <p><strong>A/C No:</strong> {company.accountNumber}</p>
            <p><strong>IFSC:</strong> {company.ifscCode}</p>
            <p><strong>UPI ID:</strong> {company.upiId}</p>
          </div>
        </div>
      </div>

      {/* ─── Screen Order Info Grid ────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 print:hidden">
        {/* Customer info */}
        <div className="card p-5 space-y-3">
          <h3 className="font-semibold text-slate-200 flex items-center gap-2">
            <Building className="w-4 h-4 text-blue-400" /> Customer Details
          </h3>
          <div>
            <p className="font-medium text-slate-200">{challan.customer?.customerName}</p>
            <p className="text-sm text-slate-400">{challan.customer?.businessName}</p>
          </div>
          {challan.customer?.mobileNumber && (
            <div className="flex items-center gap-2 text-sm text-slate-400">
              <Phone className="w-3.5 h-3.5 text-slate-500" />
              {challan.customer.mobileNumber}
            </div>
          )}
          {challan.customer?.gstNumber && (
            <div className="text-xs text-slate-400">
              <span className="text-slate-500">GSTIN: </span>
              <span className="font-mono text-blue-300">{challan.customer.gstNumber}</span>
            </div>
          )}
          {challan.notes && (
            <div className="bg-slate-800/50 rounded-lg p-3 text-sm text-slate-400 mt-2">
              <p className="text-xs text-slate-500 mb-1 font-medium">Notes</p>
              {challan.notes}
            </div>
          )}
        </div>

        {/* Summary */}
        <div className="card p-5 md:col-span-2">
          <h3 className="font-semibold text-slate-200 flex items-center gap-2 mb-4">
            <FileText className="w-4 h-4 text-blue-400" /> Order Summary
          </h3>
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-slate-800/40 rounded-lg p-4 text-center">
              <p className="text-xs text-slate-500 mb-1">Total Line Items</p>
              <p className="text-2xl font-bold text-slate-200">{challan.items?.length ?? 0}</p>
            </div>
            <div className="bg-slate-800/40 rounded-lg p-4 text-center">
              <p className="text-xs text-slate-500 mb-1">Total Quantity</p>
              <p className="text-2xl font-bold text-slate-200">{challan.totalQuantity}</p>
            </div>
            <div className="bg-slate-800/40 rounded-lg p-4 text-center">
              <p className="text-xs text-slate-500 mb-1">Total Invoice Value</p>
              <p className="text-xl font-bold text-emerald-400">
                ₹{totalAmount.toLocaleString('en-IN')}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Line Items Table ──────────────────────────────────────────────── */}
      <div className="card overflow-hidden print:border-none print:shadow-none">
        <div className="p-5 border-b border-slate-700/60 print:hidden">
          <h3 className="font-semibold text-slate-200 flex items-center gap-2">
            <Package className="w-4 h-4 text-purple-400" /> Line Items
          </h3>
        </div>
        <div className="table-wrapper print:overflow-visible">
          <table className="table print:text-black print:border-collapse print:w-full">
            <thead>
              <tr className="print:border-b print:border-black">
                <th>#</th>
                <th>Product Description</th>
                <th>SKU</th>
                <th>Unit Price</th>
                <th>Qty</th>
                <th>Subtotal</th>
                {challan.status === 'DRAFT' && <th className="print:hidden">Current Stock</th>}
              </tr>
            </thead>
            <tbody>
              {challan.items?.map((item, i) => {
                const isInsufficient =
                  challan.status === 'DRAFT' &&
                  item.product &&
                  item.product.currentStock < item.quantity;

                return (
                  <tr key={item.id} className={`${isInsufficient ? 'bg-red-500/5' : ''} print:border-b print:border-gray-300`}>
                    <td className="text-slate-500 print:text-black">{i + 1}</td>
                    <td>
                      <div className="flex items-center gap-2">
                        {isInsufficient && <AlertTriangle className="w-3.5 h-3.5 text-red-400 flex-shrink-0 print:hidden" />}
                        <span className={`${isInsufficient ? 'text-red-300' : 'text-slate-200'} print:text-black font-medium`}>
                          {item.productNameSnapshot}
                        </span>
                      </div>
                    </td>
                    <td><code className="text-xs bg-slate-800 px-1.5 py-0.5 rounded text-slate-400 print:bg-transparent print:text-black">{item.skuSnapshot}</code></td>
                    <td className="text-slate-300 print:text-black">₹{Number(item.unitPriceSnapshot).toLocaleString('en-IN')}</td>
                    <td className="font-semibold text-slate-200 print:text-black">{item.quantity}</td>
                    <td className="font-semibold text-slate-200 print:text-black">₹{Number(item.subtotal).toLocaleString('en-IN')}</td>
                    {challan.status === 'DRAFT' && (
                      <td className="print:hidden">
                        <span className={`font-semibold ${isInsufficient ? 'text-red-400' : 'text-emerald-400'}`}>
                          {item.product?.currentStock ?? '?'}
                          {isInsufficient && ' ⚠️'}
                        </span>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="bg-slate-800/40 print:bg-transparent print:border-t-2 print:border-black font-bold">
                <td colSpan={4} className="font-semibold text-slate-300 print:text-black">Total Quantity & Amount</td>
                <td className="font-bold text-slate-100 print:text-black">{challan.totalQuantity} Units</td>
                <td className="font-bold text-emerald-400 print:text-black text-base">
                  ₹{totalAmount.toLocaleString('en-IN')}
                </td>
                {challan.status === 'DRAFT' && <td className="print:hidden" />}
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* ─── Printable Signatures & Legal Terms (Visible on Print) ───────────── */}
      <div className="hidden print:block text-black text-xs mt-6 pt-4 border-t border-black">
        <div className="mb-6">
          <p className="font-bold uppercase text-[10px] text-gray-600">TERMS & CONDITIONS:</p>
          <p className="text-[11px] text-gray-800">{company.terms}</p>
        </div>

        <div className="grid grid-cols-3 gap-8 text-center pt-8">
          <div>
            <div className="border-t border-black pt-1">
              <p className="font-bold">Prepared By</p>
              <p className="text-[10px] text-gray-600">{challan.createdBy?.name}</p>
            </div>
          </div>
          <div>
            <div className="border-t border-black pt-1">
              <p className="font-bold">Verified By (Warehouse)</p>
              <p className="text-[10px] text-gray-600">Goods Checked & Dispatched</p>
            </div>
          </div>
          <div>
            <div className="border-t border-black pt-1">
              <p className="font-bold">Receiver's Signature & Stamp</p>
              <p className="text-[10px] text-gray-600">Received in good condition</p>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Dispatch & Notification Modal ───────────────────────────────────── */}
      <DispatchNotificationModal
        isOpen={showNotificationModal}
        onClose={() => setShowNotificationModal(false)}
        challan={challan}
      />

      {/* Confirm dialog */}
      <ConfirmDialog
        isOpen={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={() => confirmMutation.mutate()}
        title="Confirm Challan"
        message={`This will deduct stock for all ${challan.items?.length} item(s) and mark the challan as CONFIRMED. An automated dispatch notification modal will be opened.`}
        confirmText="Confirm & Deduct Stock"
        confirmVariant="success"
        isLoading={confirmMutation.isPending}
      />

      {/* Cancel dialog */}
      <ConfirmDialog
        isOpen={showCancel}
        onClose={() => setShowCancel(false)}
        onConfirm={() => cancelMutation.mutate()}
        title="Cancel Challan"
        message={challan.status === 'CONFIRMED'
          ? 'This will cancel the confirmed challan and RESTORE stock for all items.'
          : 'This will cancel the draft challan. No stock changes will be made.'}
        confirmText="Cancel Challan"
        confirmVariant="danger"
        isLoading={cancelMutation.isPending}
      />
    </div>
  );
}
