import React, { useState } from 'react';
import {
  MessageSquare, Mail, PhoneCall, Copy, Check, ExternalLink,
  Printer
} from 'lucide-react';
import toast from 'react-hot-toast';
import { SalesChallan } from '../../types';
import { useCompany } from '../../lib/company-context';
import {
  formatWhatsAppMessage,
  formatSmsMessage,
  formatEmailBody,
  openWhatsAppDirect,
  openEmailClient,
} from '../../lib/notifications';
import { Modal } from '../ui/Modal';

interface DispatchNotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  challan: SalesChallan;
}

export const DispatchNotificationModal: React.FC<DispatchNotificationModalProps> = ({
  isOpen,
  onClose,
  challan,
}) => {
  const { company } = useCompany();
  const [activeTab, setActiveTab] = useState<'whatsapp' | 'email' | 'sms'>('whatsapp');
  const [copied, setCopied] = useState(false);

  const customerMobile = challan.customer?.mobileNumber ?? '';
  const customerEmail = (challan.customer as any)?.email ?? '';
  const customerName = challan.customer?.customerName ?? 'Customer';

  const waText = formatWhatsAppMessage(challan, company);
  const smsText = formatSmsMessage(challan, company);
  const { subject: emailSubject, body: emailBody } = formatEmailBody(challan, company);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success('Copied to clipboard!');
    setTimeout(() => setCopied(false), 2500);
  };

  const handleSendWhatsApp = () => {
    if (!customerMobile) {
      toast.error('Customer mobile number is missing.');
      return;
    }
    openWhatsAppDirect(customerMobile, waText);
    toast.success('Opened WhatsApp chat with pre-filled dispatch message.');
  };

  const handleSendEmail = () => {
    openEmailClient(customerEmail, emailSubject, emailBody);
    toast.success('Opened default email client with dispatch invoice.');
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Dispatch & Customer Notifications" size="lg">
      <div className="space-y-5">
        {/* Recipient summary banner */}
        <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Recipient</p>
            <p className="font-semibold text-slate-200 text-base">{customerName}</p>
            <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-2">
              <span>📞 {customerMobile || 'No mobile added'}</span>
              {customerEmail && <span>• ✉️ {customerEmail}</span>}
            </p>
          </div>
          <div className="text-right">
            <span className="badge-green font-mono">#{challan.challanNumber}</span>
            <p className="text-xs text-slate-400 mt-1">₹{Number(challan.totalAmount).toLocaleString('en-IN')}</p>
          </div>
        </div>

        {/* Tab triggers */}
        <div className="flex gap-2 border-b border-slate-700/60 pb-3">
          <button
            onClick={() => setActiveTab('whatsapp')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'whatsapp'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <MessageSquare className="w-4 h-4 text-emerald-400" /> WhatsApp
          </button>

          <button
            onClick={() => setActiveTab('email')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'email'
                ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <Mail className="w-4 h-4 text-blue-400" /> Email Invoice
          </button>

          <button
            onClick={() => setActiveTab('sms')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'sms'
                ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <PhoneCall className="w-4 h-4 text-purple-400" /> DLT SMS
          </button>
        </div>

        {/* Tab 1: WhatsApp */}
        {activeTab === 'whatsapp' && (
          <div className="space-y-4">
            <div className="relative">
              <label className="form-label flex justify-between">
                <span>Formatted WhatsApp Dispatch Summary</span>
                <span className="text-xs text-slate-500">Auto-generated with item breakdown</span>
              </label>
              <textarea
                readOnly
                rows={8}
                value={waText}
                className="form-input font-mono text-xs text-slate-300 bg-slate-900/60 leading-relaxed"
              />
            </div>

            <div className="flex justify-between items-center pt-2">
              <button
                type="button"
                onClick={() => handleCopy(waText)}
                className="btn-secondary btn-sm flex items-center gap-1.5"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                {copied ? 'Copied' : 'Copy Message'}
              </button>

              <button
                type="button"
                onClick={handleSendWhatsApp}
                className="btn-primary btn-sm bg-emerald-600 hover:bg-emerald-500 flex items-center gap-1.5"
              >
                <MessageSquare className="w-4 h-4" /> Send via WhatsApp
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* Tab 2: Email */}
        {activeTab === 'email' && (
          <div className="space-y-4">
            <div>
              <label className="form-label">Subject</label>
              <input readOnly value={emailSubject} className="form-input text-xs font-mono" />
            </div>

            <div>
              <label className="form-label">Email Body (Plain text / HTML ready)</label>
              <textarea
                readOnly
                rows={8}
                value={emailBody}
                className="form-input font-mono text-xs text-slate-300 bg-slate-900/60"
              />
            </div>

            <div className="flex justify-between items-center pt-2">
              <button
                type="button"
                onClick={() => handleCopy(emailBody)}
                className="btn-secondary btn-sm flex items-center gap-1.5"
              >
                {copied ? <Check className="w-4 h-4 text-blue-400" /> : <Copy className="w-4 h-4" />}
                {copied ? 'Copied' : 'Copy Email Text'}
              </button>

              <button
                type="button"
                onClick={handleSendEmail}
                className="btn-primary btn-sm flex items-center gap-1.5"
              >
                <Mail className="w-4 h-4" /> Open Email Client
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* Tab 3: SMS */}
        {activeTab === 'sms' && (
          <div className="space-y-4">
            <div>
              <label className="form-label">DLT Approved SMS Template</label>
              <textarea
                readOnly
                rows={4}
                value={smsText}
                className="form-input font-mono text-xs text-slate-300 bg-slate-900/60"
              />
              <p className="text-xs text-slate-500 mt-1.5">Length: {smsText.length} characters (1 SMS segment)</p>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => handleCopy(smsText)}
                className="btn-primary btn-sm flex items-center gap-1.5"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                {copied ? 'Copied' : 'Copy SMS Alert'}
              </button>
            </div>
          </div>
        )}

        {/* Quick Print Shortcut */}
        <div className="border-t border-slate-700/60 pt-4 flex justify-between items-center">
          <p className="text-xs text-slate-400">Need paper/PDF dispatch note for delivery driver?</p>
          <button
            onClick={() => {
              onClose();
              window.print();
            }}
            className="btn-secondary btn-sm flex items-center gap-1.5"
          >
            <Printer className="w-3.5 h-3.5" /> Print Delivery Challan
          </button>
        </div>
      </div>
    </Modal>
  );
};
