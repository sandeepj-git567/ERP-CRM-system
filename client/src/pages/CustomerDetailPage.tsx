import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  ArrowLeft, Phone, Mail, MapPin, CalendarCheck,
  Plus, FileText, Loader2, Tag, Clock
} from 'lucide-react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { customerService } from '../services/customer.service';
import { Modal } from '../components/ui/Modal';
import { EmptyState, LoadingSpinner } from '../components/ui/index';
import { useAuth } from '../lib/auth-context';
import { handleApiError } from '../lib/api';

const STATUS_COLORS: Record<string, string> = {
  LEAD: 'badge-yellow', ACTIVE: 'badge-green', INACTIVE: 'badge-gray',
};
const TYPE_COLORS: Record<string, string> = {
  RETAIL: 'badge-blue', WHOLESALE: 'badge-purple', DISTRIBUTOR: 'badge-green',
};

const followUpSchema = z.object({
  note: z.string().min(1, 'Note is required'),
  followUpDate: z.string().min(1, 'Date is required'),
});

type FollowUpFormData = z.infer<typeof followUpSchema>;

export function CustomerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [showFollowUp, setShowFollowUp] = useState(false);

  const canManage = ['ADMIN', 'SALES'].includes(user?.role ?? '');

  const { data: customer, isLoading } = useQuery({
    queryKey: ['customer', id],
    queryFn: () => customerService.getById(id!),
    enabled: !!id,
  });

  const { data: followUpsData } = useQuery({
    queryKey: ['follow-ups', id],
    queryFn: () => customerService.getFollowUps(id!),
    enabled: !!id,
  });

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FollowUpFormData>({
    resolver: zodResolver(followUpSchema),
  });

  const followUpMutation = useMutation({
    mutationFn: (data: FollowUpFormData) =>
      customerService.createFollowUp(id!, { note: data.note, followUpDate: new Date(data.followUpDate).toISOString() }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['follow-ups', id] });
      qc.invalidateQueries({ queryKey: ['customer', id] });
      toast.success('Follow-up added!');
      setShowFollowUp(false);
      reset();
    },
    onError: handleApiError,
  });

  if (isLoading) return <LoadingSpinner text="Loading customer details..." />;
  if (!customer) return <div className="text-slate-400">Customer not found.</div>;

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="btn-secondary btn-sm">
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
          <div>
            <h1 className="page-title">{customer.customerName}</h1>
            <p className="page-subtitle">{customer.businessName}</p>
          </div>
        </div>

        {canManage && (
          <button
            onClick={() => navigate('/challans/new')}
            className="btn-primary btn-sm"
          >
            <Plus className="w-4 h-4" /> Create Challan
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Customer Info */}
        <div className="card p-5 md:col-span-1 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-slate-200">Customer Info</h3>
            <div className="flex gap-2">
              <span className={STATUS_COLORS[customer.status]}>{customer.status}</span>
              <span className={TYPE_COLORS[customer.customerType]}>{customer.customerType}</span>
            </div>
          </div>

          <div className="space-y-3 text-sm">
            <div className="flex items-center gap-2 text-slate-300">
              <Phone className="w-4 h-4 text-slate-500 flex-shrink-0" />
              {customer.mobileNumber}
            </div>
            {customer.email && (
              <div className="flex items-center gap-2 text-slate-300">
                <Mail className="w-4 h-4 text-slate-500 flex-shrink-0" />
                {customer.email}
              </div>
            )}
            {customer.address && (
              <div className="flex items-start gap-2 text-slate-300">
                <MapPin className="w-4 h-4 text-slate-500 flex-shrink-0 mt-0.5" />
                {customer.address}
              </div>
            )}
            {customer.gstNumber && (
              <div className="flex items-center gap-2 text-slate-300">
                <Tag className="w-4 h-4 text-slate-500 flex-shrink-0" />
                GST: {customer.gstNumber}
              </div>
            )}
            {customer.followUpDate && (
              <div className="flex items-center gap-2 text-orange-400">
                <CalendarCheck className="w-4 h-4 flex-shrink-0" />
                Follow-up: {format(new Date(customer.followUpDate), 'd MMM yyyy')}
              </div>
            )}
          </div>

          {customer.notes && (
            <div className="bg-slate-800/50 rounded-lg p-3 text-sm text-slate-400">
              {customer.notes}
            </div>
          )}

          <div className="text-xs text-slate-600 border-t border-slate-700 pt-3">
            Created {format(new Date(customer.createdAt), 'd MMM yyyy')}
          </div>
        </div>

        {/* Follow-up Timeline */}
        <div className="card md:col-span-2">
          <div className="flex items-center justify-between p-5 border-b border-slate-700/60">
            <h3 className="font-semibold text-slate-200 flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-400" />
              CRM Follow-up Timeline
            </h3>
            {canManage && (
              <button onClick={() => setShowFollowUp(true)} className="btn-primary btn-sm">
                <Plus className="w-3.5 h-3.5" /> Add Note
              </button>
            )}
          </div>

          <div className="p-5">
            {!followUpsData?.data?.length ? (
              <EmptyState
                icon={<FileText className="w-10 h-10" />}
                title="No follow-ups yet"
                description="Track your customer interactions by adding follow-up notes."
                action={canManage ? (
                  <button onClick={() => setShowFollowUp(true)} className="btn-primary btn-sm">
                    <Plus className="w-3.5 h-3.5" /> Add First Note
                  </button>
                ) : undefined}
              />
            ) : (
              <div className="relative">
                <div className="absolute left-4 top-0 bottom-0 w-px bg-slate-700/60" />
                <div className="space-y-6 pl-10">
                  {followUpsData.data.map((fu) => (
                    <div key={fu.id} className="relative">
                      <div className="absolute -left-6 top-1.5 w-3 h-3 rounded-full bg-blue-500 border-2 border-slate-900 ring-2 ring-blue-500/30" />
                      <div className="bg-slate-800/40 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-medium text-blue-400">
                            {format(new Date(fu.followUpDate), 'd MMMM yyyy')}
                          </span>
                          <div className="flex items-center gap-1 text-xs text-slate-500">
                            <span>{fu.createdBy.name}</span>
                            <span>·</span>
                            <span>{format(new Date(fu.createdAt), 'HH:mm')}</span>
                          </div>
                        </div>
                        <p className="text-sm text-slate-300">{fu.note}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add Follow-up Modal */}
      <Modal isOpen={showFollowUp} onClose={() => setShowFollowUp(false)} title="Add Follow-up Note">
        <form onSubmit={handleSubmit((d) => followUpMutation.mutate(d))} className="space-y-4">
          <div>
            <label className="form-label">Follow-up Date *</label>
            <input type="datetime-local" {...register('followUpDate')} className={errors.followUpDate ? 'form-input-error' : 'form-input'} />
            {errors.followUpDate && <p className="form-error">{errors.followUpDate.message}</p>}
          </div>
          <div>
            <label className="form-label">Note *</label>
            <textarea {...register('note')} className={errors.note ? 'form-input-error' : 'form-input'} rows={4} placeholder="What happened? What's the next step?" />
            {errors.note && <p className="form-error">{errors.note.message}</p>}
          </div>
          <div className="flex justify-end gap-3">
            <button type="button" onClick={() => setShowFollowUp(false)} className="btn-secondary btn-sm">Cancel</button>
            <button type="submit" disabled={followUpMutation.isPending} className="btn-primary btn-sm">
              {followUpMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
              Save Note
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
