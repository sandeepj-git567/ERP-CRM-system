import { useState } from 'react';
import { useForm } from 'react-hook-form';
import {
  Building2, FileText, Landmark, Phone, Mail, Globe, MapPin,
  Save, RotateCcw, Check, Sparkles
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useCompany, CompanyProfile } from '../lib/company-context';
import { useAuth } from '../lib/auth-context';

export function SettingsPage() {
  const { company, updateCompany, resetCompany } = useCompany();
  const { user } = useAuth();
  const [saved, setSaved] = useState(false);

  const { register, handleSubmit, reset } = useForm<CompanyProfile>({
    defaultValues: company,
  });

  const onSubmit = (data: CompanyProfile) => {
    updateCompany(data);
    setSaved(true);
    toast.success('Company branding updated successfully! All printed receipts and headers now reflect changes.');
    setTimeout(() => setSaved(false), 3000);
  };

  const handleReset = () => {
    if (window.confirm('Reset all company settings back to default Indian GST template?')) {
      resetCompany();
      reset();
      toast.success('Settings restored to defaults.');
    }
  };

  const canEdit = ['ADMIN', 'ACCOUNTS'].includes(user?.role ?? '');

  return (
    <div className="space-y-6 animate-fade-in max-w-5xl">
      <div className="page-header">
        <div>
          <h1 className="page-title">Company Branding & GST Settings</h1>
          <p className="page-subtitle">
            Configure company name, GSTIN, PAN, bank details, and terms for printed delivery challans
          </p>
        </div>
        {canEdit && (
          <div className="flex gap-2">
            <button type="button" onClick={handleReset} className="btn-secondary btn-sm">
              <RotateCcw className="w-4 h-4" /> Reset Defaults
            </button>
            <button
              type="button"
              onClick={handleSubmit(onSubmit)}
              className="btn-primary btn-sm flex items-center gap-1.5"
            >
              {saved ? <Check className="w-4 h-4 text-emerald-300" /> : <Save className="w-4 h-4" />}
              {saved ? 'Saved!' : 'Save Changes'}
            </button>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Basic Business Details */}
        <div className="card p-6 space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-700/60 pb-3">
            <Building2 className="w-5 h-5 text-blue-400" />
            <h3 className="font-semibold text-slate-200">Legal Business Identity</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="form-label">Company Legal Name *</label>
              <input
                {...register('companyName')}
                disabled={!canEdit}
                className="form-input"
                placeholder="e.g. Apex Distributions & Logistics Pvt Ltd"
              />
            </div>

            <div>
              <label className="form-label">Brand / Trade Name (Header Pill)</label>
              <input
                {...register('tradeName')}
                disabled={!canEdit}
                className="form-input"
                placeholder="e.g. Apex ERP Operations"
              />
            </div>

            <div>
              <label className="form-label">GSTIN (15-digit GST Number) *</label>
              <input
                {...register('gstin')}
                disabled={!canEdit}
                className="form-input font-mono uppercase"
                placeholder="27AABCU9603R1ZN"
              />
            </div>

            <div>
              <label className="form-label">PAN Number</label>
              <input
                {...register('pan')}
                disabled={!canEdit}
                className="form-input font-mono uppercase"
                placeholder="AABCU9603R"
              />
            </div>

            <div>
              <label className="form-label">State & State Code</label>
              <div className="grid grid-cols-3 gap-2">
                <input
                  {...register('state')}
                  disabled={!canEdit}
                  className="form-input col-span-2"
                  placeholder="Maharashtra"
                />
                <input
                  {...register('stateCode')}
                  disabled={!canEdit}
                  className="form-input font-mono"
                  placeholder="27"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Contact & Address */}
        <div className="card p-6 space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-700/60 pb-3">
            <MapPin className="w-5 h-5 text-emerald-400" />
            <h3 className="font-semibold text-slate-200">Registered Office & Contact</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="form-label">Full Registered Address</label>
              <input
                {...register('address')}
                disabled={!canEdit}
                className="form-input"
                placeholder="Plot No. 42, Sector 18, MIDC Industrial Area"
              />
            </div>

            <div>
              <label className="form-label">City / Town</label>
              <input
                {...register('city')}
                disabled={!canEdit}
                className="form-input"
                placeholder="Navi Mumbai"
              />
            </div>

            <div>
              <label className="form-label">PIN / Postal Code</label>
              <input
                {...register('pincode')}
                disabled={!canEdit}
                className="form-input font-mono"
                placeholder="400703"
              />
            </div>

            <div>
              <label className="form-label flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-slate-400" /> Phone / Dispatch Helpline
              </label>
              <input
                {...register('phone')}
                disabled={!canEdit}
                className="form-input"
                placeholder="+91 98765 43210"
              />
            </div>

            <div>
              <label className="form-label flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-slate-400" /> Billing / Support Email
              </label>
              <input
                {...register('email')}
                disabled={!canEdit}
                className="form-input"
                placeholder="billing@apexdistributors.com"
              />
            </div>

            <div className="md:col-span-2">
              <label className="form-label flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-slate-400" /> Official Website
              </label>
              <input
                {...register('website')}
                disabled={!canEdit}
                className="form-input"
                placeholder="www.apexdistributors.com"
              />
            </div>
          </div>
        </div>

        {/* Bank & Settlement Details */}
        <div className="card p-6 space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-700/60 pb-3">
            <Landmark className="w-5 h-5 text-purple-400" />
            <h3 className="font-semibold text-slate-200">Bank Account & UPI Details (Printed on Invoices)</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="form-label">Bank Name</label>
              <input
                {...register('bankName')}
                disabled={!canEdit}
                className="form-input"
                placeholder="HDFC Bank Ltd"
              />
            </div>

            <div>
              <label className="form-label">Bank Branch</label>
              <input
                {...register('branch')}
                disabled={!canEdit}
                className="form-input"
                placeholder="Vashi Sector 17 Branch"
              />
            </div>

            <div>
              <label className="form-label">Account Number</label>
              <input
                {...register('accountNumber')}
                disabled={!canEdit}
                className="form-input font-mono"
                placeholder="50200012345678"
              />
            </div>

            <div>
              <label className="form-label">IFSC Code</label>
              <input
                {...register('ifscCode')}
                disabled={!canEdit}
                className="form-input font-mono uppercase"
                placeholder="HDFC0001234"
              />
            </div>

            <div className="md:col-span-2">
              <label className="form-label">UPI ID for Instant QR / Payments</label>
              <input
                {...register('upiId')}
                disabled={!canEdit}
                className="form-input font-mono"
                placeholder="apexdistributors@hdfcbank"
              />
            </div>
          </div>
        </div>

        {/* Invoice Terms */}
        <div className="card p-6 space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-700/60 pb-3">
            <FileText className="w-5 h-5 text-yellow-400" />
            <h3 className="font-semibold text-slate-200">Delivery Terms & Declarations</h3>
          </div>

          <div>
            <label className="form-label">Standard Delivery & Payment Terms (Printed on footer)</label>
            <textarea
              {...register('terms')}
              disabled={!canEdit}
              rows={3}
              className="form-input text-sm"
              placeholder="Terms and conditions..."
            />
          </div>
        </div>

        {/* Live Preview Banner */}
        <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Sparkles className="w-5 h-5 text-blue-400 flex-shrink-0" />
            <div>
              <p className="font-semibold text-slate-200 text-sm">{company.companyName}</p>
              <p className="text-xs text-slate-400">
                GSTIN: <span className="font-mono text-blue-300">{company.gstin}</span> • {company.city}, {company.state} ({company.stateCode})
              </p>
            </div>
          </div>
          {canEdit && (
            <button type="submit" className="btn-primary btn-sm">
              <Save className="w-3.5 h-3.5" /> Save Branding
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
