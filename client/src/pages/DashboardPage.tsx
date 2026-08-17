import { useQuery } from '@tanstack/react-query';
import {
  Users, Package, AlertTriangle, FileText,
  TrendingUp, ClipboardList, CalendarClock, ArrowUpRight,
  ArrowDownRight, DollarSign, CheckCircle2
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { dashboardService } from '../services/dashboard.service';
import { StatCardSkeleton } from '../components/ui/Skeleton';
import { format } from 'date-fns';

function StatCard({
  title, value, subtitle, icon: Icon, iconBg, trend, link,
}: {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ComponentType<{ className?: string }>;
  iconBg: string;
  trend?: { value: string; positive?: boolean };
  link?: string;
}) {
  const content = (
    <div className="stat-card group cursor-default hover:border-slate-600 transition-all duration-200">
      <div className={`stat-icon ${iconBg}`}>
        <Icon className="w-6 h-6" />
      </div>
      <div className="flex-1">
        <p className="text-xs text-slate-400 font-medium">{title}</p>
        <p className="text-2xl font-bold text-slate-100 mt-1">{value}</p>
        {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
        {trend && (
          <div className={`flex items-center gap-1 mt-1 text-xs ${trend.positive ? 'text-emerald-400' : 'text-red-400'}`}>
            {trend.positive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
            {trend.value}
          </div>
        )}
      </div>
    </div>
  );

  if (link) return <Link to={link}>{content}</Link>;
  return content;
}

const statusColors: Record<string, string> = {
  DRAFT: 'badge-yellow',
  CONFIRMED: 'badge-green',
  CANCELLED: 'badge-red',
  IN: 'badge-green',
  OUT: 'badge-red',
  LEAD: 'badge-yellow',
  ACTIVE: 'badge-green',
  INACTIVE: 'badge-gray',
};

export function DashboardPage() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['dashboard'],
    queryFn: dashboardService.get,
    refetchInterval: 60000,
  });

  if (isLoading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="page-header">
          <div>
            <div className="skeleton h-7 w-48 mb-2" />
            <div className="skeleton h-4 w-64" />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => <StatCardSkeleton key={i} />)}
        </div>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-400 animate-fade-in">
        <AlertTriangle className="w-12 h-12 text-red-400 mb-4" />
        <p className="text-lg">Failed to load dashboard data.</p>
        <p className="text-sm mt-2">Please check your connection and try again.</p>
      </div>
    );
  }

  const { stats, recentChallans, recentMovements, upcomingFollowUps } = data;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">Welcome back! Here's what's happening today.</p>
        </div>
        <div className="text-sm text-slate-400">{format(new Date(), 'EEEE, d MMMM yyyy')}</div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Customers"
          value={stats.totalCustomers}
          subtitle={`${stats.activeCustomers} active`}
          icon={Users}
          iconBg="bg-blue-500/20 text-blue-400"
          link="/customers"
        />
        <StatCard
          title="Active Leads"
          value={stats.leads}
          subtitle="Pending conversion"
          icon={TrendingUp}
          iconBg="bg-yellow-500/20 text-yellow-400"
          link="/customers?status=LEAD"
        />
        <StatCard
          title="Total Products"
          value={stats.totalProducts}
          subtitle={`${stats.lowStockCount} low stock`}
          icon={Package}
          iconBg="bg-purple-500/20 text-purple-400"
          link="/products"
        />
        <StatCard
          title="Out of Stock"
          value={stats.outOfStockCount}
          subtitle="Needs restock"
          icon={AlertTriangle}
          iconBg="bg-red-500/20 text-red-400"
          link="/products?stockStatus=out"
        />
        <StatCard
          title="Draft Challans"
          value={stats.draftChallans}
          subtitle="Pending confirmation"
          icon={ClipboardList}
          iconBg="bg-yellow-500/20 text-yellow-400"
          link="/challans?status=DRAFT"
        />
        <StatCard
          title="Confirmed Challans"
          value={stats.confirmedChallans}
          subtitle="Successfully processed"
          icon={CheckCircle2}
          iconBg="bg-emerald-500/20 text-emerald-400"
          link="/challans?status=CONFIRMED"
        />
        <StatCard
          title="Monthly Revenue"
          value={`₹${Number(stats.monthlyRevenue).toLocaleString('en-IN')}`}
          subtitle="Confirmed challans this month"
          icon={DollarSign}
          iconBg="bg-emerald-500/20 text-emerald-400"
        />
        <StatCard
          title="Upcoming Follow-ups"
          value={upcomingFollowUps.length}
          subtitle="Next 7 days"
          icon={CalendarClock}
          iconBg="bg-orange-500/20 text-orange-400"
          link="/follow-ups"
        />
      </div>

      {/* Content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {/* Recent Challans */}
        <div className="card xl:col-span-2">
          <div className="flex items-center justify-between p-5 border-b border-slate-700/60">
            <h3 className="font-semibold text-slate-200 flex items-center gap-2">
              <FileText className="w-4 h-4 text-blue-400" />
              Recent Challans
            </h3>
            <Link to="/challans" className="text-xs text-blue-400 hover:text-blue-300 font-medium">
              View all →
            </Link>
          </div>
          <div className="divide-y divide-slate-700/40">
            {recentChallans.length === 0 ? (
              <p className="p-5 text-sm text-slate-500 text-center">No challans yet</p>
            ) : (
              recentChallans.map((c) => (
                <Link
                  key={c.id}
                  to={`/challans/${c.id}`}
                  className="flex items-center justify-between p-4 hover:bg-slate-700/20 transition-colors"
                >
                  <div>
                    <p className="text-sm font-medium text-slate-200">{c.challanNumber}</p>
                    <p className="text-xs text-slate-500">{c.customer?.businessName}</p>
                  </div>
                  <div className="text-right">
                    <span className={statusColors[c.status]}>{c.status}</span>
                    <p className="text-xs text-slate-500 mt-1">
                      {format(new Date(c.createdAt), 'd MMM')}
                    </p>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>

        {/* Upcoming Follow-ups */}
        <div className="card">
          <div className="flex items-center justify-between p-5 border-b border-slate-700/60">
            <h3 className="font-semibold text-slate-200 flex items-center gap-2">
              <CalendarClock className="w-4 h-4 text-orange-400" />
              Upcoming Follow-ups
            </h3>
            <Link to="/follow-ups" className="text-xs text-blue-400 hover:text-blue-300 font-medium">
              View all →
            </Link>
          </div>
          <div className="divide-y divide-slate-700/40">
            {upcomingFollowUps.length === 0 ? (
              <p className="p-5 text-sm text-slate-500 text-center">No upcoming follow-ups</p>
            ) : (
              upcomingFollowUps.map((fu) => (
                <Link
                  key={fu.id}
                  to={`/customers/${fu.customerId}`}
                  className="block p-4 hover:bg-slate-700/20 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-200">{fu.customer?.customerName}</p>
                      <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{fu.note}</p>
                    </div>
                    <p className="text-xs text-orange-400 font-medium whitespace-nowrap ml-2">
                      {format(new Date(fu.followUpDate), 'd MMM')}
                    </p>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>

        {/* Recent Stock Movements */}
        <div className="card xl:col-span-2">
          <div className="flex items-center justify-between p-5 border-b border-slate-700/60">
            <h3 className="font-semibold text-slate-200 flex items-center gap-2">
              <Package className="w-4 h-4 text-purple-400" />
              Recent Stock Movements
            </h3>
            <Link to="/inventory" className="text-xs text-blue-400 hover:text-blue-300 font-medium">
              View all →
            </Link>
          </div>
          <div className="divide-y divide-slate-700/40">
            {recentMovements.length === 0 ? (
              <p className="p-5 text-sm text-slate-500 text-center">No stock movements yet</p>
            ) : (
              recentMovements.map((m) => (
                <div key={m.id} className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-3">
                    <span className={m.movementType === 'IN' ? 'badge-green' : 'badge-red'}>
                      {m.movementType}
                    </span>
                    <div>
                      <p className="text-sm font-medium text-slate-200">{m.product?.productName}</p>
                      <p className="text-xs text-slate-500">{m.reason}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-semibold ${m.movementType === 'IN' ? 'text-emerald-400' : 'text-red-400'}`}>
                      {m.movementType === 'IN' ? '+' : '-'}{m.quantity}
                    </p>
                    <p className="text-xs text-slate-500">{format(new Date(m.createdAt), 'd MMM HH:mm')}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
