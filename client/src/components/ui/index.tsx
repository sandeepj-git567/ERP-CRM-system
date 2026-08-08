import { ReactNode } from 'react';
import { Loader2 } from 'lucide-react';

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center px-4">
      {icon && <div className="mb-4 text-slate-500">{icon}</div>}
      <h3 className="text-lg font-medium text-slate-300 mb-2">{title}</h3>
      {description && <p className="text-sm text-slate-500 mb-6 max-w-sm">{description}</p>}
      {action}
    </div>
  );
}

interface LoadingProps {
  text?: string;
}

export function LoadingSpinner({ text = 'Loading...' }: LoadingProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3">
      <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      <span className="text-sm text-slate-400">{text}</span>
    </div>
  );
}

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  confirmVariant?: 'danger' | 'primary' | 'success';
  isLoading?: boolean;
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  confirmVariant = 'danger',
  isLoading,
}: ConfirmDialogProps) {
  if (!isOpen) return null;

  const variantClass = {
    danger: 'btn-danger',
    primary: 'btn-primary',
    success: 'btn-success',
  }[confirmVariant];

  return (
    <div className="modal-overlay">
      <div className="modal-content max-w-sm animate-slide-in">
        <div className="modal-header">
          <h3 className="text-lg font-semibold text-slate-100">{title}</h3>
        </div>
        <div className="modal-body">
          <p className="text-slate-400 text-sm">{message}</p>
        </div>
        <div className="modal-footer">
          <button onClick={onClose} className="btn-secondary btn-sm" disabled={isLoading}>Cancel</button>
          <button onClick={onConfirm} className={`${variantClass} btn-sm`} disabled={isLoading}>
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

interface PaginationProps {
  page: number;
  totalPages: number;
  total: number;
  limit: number;
  onPageChange: (page: number) => void;
}

export function Pagination({ page, totalPages, total, limit, onPageChange }: PaginationProps) {
  if (totalPages <= 1) return null;

  const from = (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);

  return (
    <div className="flex items-center justify-between pt-4 mt-4 border-t border-slate-700/50">
      <span className="text-sm text-slate-400">
        Showing {from}–{to} of {total} results
      </span>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="btn-secondary btn-sm disabled:opacity-40"
        >
          Previous
        </button>
        <span className="px-3 py-1.5 text-xs text-slate-400">
          {page} / {totalPages}
        </span>
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          className="btn-secondary btn-sm disabled:opacity-40"
        >
          Next
        </button>
      </div>
    </div>
  );
}

interface BadgeProps {
  label: string;
  variant?: 'blue' | 'green' | 'yellow' | 'red' | 'gray' | 'purple';
}

export function Badge({ label, variant = 'gray' }: BadgeProps) {
  return <span className={`badge-${variant}`}>{label}</span>;
}
