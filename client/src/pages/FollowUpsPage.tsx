import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { ExternalLink } from 'lucide-react';
import { format, isToday } from 'date-fns';
import { customerService } from '../services/customer.service';

export function FollowUpsPage() {
  const { data: customersData } = useQuery({
    queryKey: ['customers-followups'],
    queryFn: () => customerService.getAll({ limit: 200 }),
  });

  const customers = customersData?.data ?? [];
  const withFollowUps = customers.filter((c) => c.followUpDate).sort((a, b) =>
    new Date(a.followUpDate!).getTime() - new Date(b.followUpDate!).getTime()
  );

  const overdue = withFollowUps.filter((c) => new Date(c.followUpDate!) < new Date() && !isToday(new Date(c.followUpDate!)));
  const todayItems = withFollowUps.filter((c) => isToday(new Date(c.followUpDate!)));
  const upcoming = withFollowUps.filter((c) => new Date(c.followUpDate!) > new Date() && !isToday(new Date(c.followUpDate!)));

  const renderSection = (title: string, items: typeof withFollowUps, badgeCls: string) => (
    <div className="card">
      <div className="flex items-center gap-3 p-5 border-b border-slate-700/60">
        <span className={`badge ${badgeCls}`}>{items.length}</span>
        <h3 className="font-semibold text-slate-200">{title}</h3>
      </div>
      {items.length === 0 ? (
        <p className="p-5 text-sm text-slate-500 text-center">None</p>
      ) : (
        <div className="divide-y divide-slate-700/40">
          {items.map((c) => (
            <div key={c.id} className="flex items-center justify-between p-4">
              <div>
                <Link
                  to={`/customers/${c.id}`}
                  className="font-medium text-slate-200 hover:text-blue-400 transition-colors flex items-center gap-1"
                >
                  {c.customerName} <ExternalLink className="w-3 h-3" />
                </Link>
                <p className="text-xs text-slate-500">{c.businessName}</p>
                {c.notes && <p className="text-xs text-slate-400 mt-1 line-clamp-1">{c.notes}</p>}
              </div>
              <div className="text-right">
                <p className={`text-sm font-medium ${badgeCls.includes('red') ? 'text-red-400' : badgeCls.includes('yellow') ? 'text-yellow-400' : 'text-blue-400'}`}>
                  {format(new Date(c.followUpDate!), 'd MMM yyyy')}
                </p>
                <p className="text-xs text-slate-500">{c.status}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Follow-ups</h1>
          <p className="page-subtitle">Manage your customer follow-up schedule</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-2">
        <div className="card p-4 text-center">
          <p className="text-2xl font-bold text-red-400">{overdue.length}</p>
          <p className="text-sm text-slate-400">Overdue</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-2xl font-bold text-yellow-400">{todayItems.length}</p>
          <p className="text-sm text-slate-400">Due Today</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-2xl font-bold text-blue-400">{upcoming.length}</p>
          <p className="text-sm text-slate-400">Upcoming</p>
        </div>
      </div>

      {renderSection('Overdue Follow-ups', overdue, 'bg-red-500/20 text-red-300')}
      {renderSection("Today's Follow-ups", todayItems, 'bg-yellow-500/20 text-yellow-300')}
      {renderSection('Upcoming Follow-ups', upcoming, 'bg-blue-500/20 text-blue-300')}
    </div>
  );
}
