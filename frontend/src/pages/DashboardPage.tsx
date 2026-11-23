import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Package, TrendingDown, AlertCircle, CheckCircle, Heart, Activity,
  Trophy, ArrowUpRight, Loader2, Sparkles, Flame
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { snacksApi, ApiError } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { KPICardSkeleton } from '../components/Skeletons';
import { StockBadge, CategoryBadge } from '../components/Badges';
import { SnackImage } from '../components/SnackImage';
import { formatRelativeTime } from '../utils';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import toast from 'react-hot-toast';

interface KPICardProps {
  label: string;
  value: number | string;
  sublabel: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
}

function KPICard({ label, value, sublabel, icon, color, bgColor }: KPICardProps) {
  return (
    <div className="bg-white rounded-2xl border border-border p-5 hover:shadow-card transition-shadow">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold text-secondary uppercase tracking-wider">{label}</p>
          <p className={`text-3xl font-extrabold mt-1 tracking-tight ${color}`}>{value}</p>
          <p className="text-[11px] text-secondary mt-1">{sublabel}</p>
        </div>
        <div className={`w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0 ${bgColor}`}>
          {icon}
        </div>
      </div>
    </div>
  );
}

const STATUS_COLOR_MAP: Record<string, string> = {
  Stocked: '#22c55e',
  'Running Low': '#f97316',
  'Out of Stock': '#ef4444',
};

export function DashboardPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: summary, isLoading: summaryLoading } = useQuery({
    queryKey: ['summary'],
    queryFn: snacksApi.summary,
    refetchInterval: 30000,
  });

  const { data: popularData, isLoading: popularLoading } = useQuery({
    queryKey: ['popular'],
    queryFn: snacksApi.popular,
  });

  const { data: activityData } = useQuery({
    queryKey: ['activity-recent'],
    queryFn: () => snacksApi.activity({ limit: 8 }),
    enabled: user?.role === 'ADMIN',
  });

  const voteMutation = useMutation({
    mutationFn: (args: { id: string; voted: boolean }) =>
      args.voted ? snacksApi.unvote(args.id) : snacksApi.vote(args.id),
    onSuccess: (data) => {
      toast.success(data.userVoted ? 'Voted! ❤️' : 'Vote removed');
      queryClient.invalidateQueries({ queryKey: ['summary'] });
      queryClient.invalidateQueries({ queryKey: ['popular'] });
    },
    onError: (err: unknown) => {
      if (err instanceof ApiError) toast.error(err.message);
    },
  });

  const chartData = summary
    ? [
        { name: 'Stocked', value: summary.stocked },
        { name: 'Running Low', value: summary.runningLow },
        { name: 'Out of Stock', value: summary.gone },
      ].filter((d) => d.value > 0)
    : [];

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const today = new Date().toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-primary-text tracking-tight">
            {greeting()}, {user?.name?.split(' ')[0]}! 👋
          </h1>
          <p className="text-secondary text-sm mt-0.5">{today}</p>
        </div>
        <div className="flex items-center gap-2 bg-white border border-border rounded-xl px-3.5 py-2 shadow-xs">
          <div className={`w-2.5 h-2.5 rounded-full ${user?.role === 'ADMIN' ? 'bg-primary animate-pulse' : 'bg-green-500'}`} />
          <span className="text-xs font-semibold text-primary-text">
            {user?.role === 'ADMIN' ? 'Admin Access' : 'Pantry Member'}
          </span>
          <span className="text-xs text-secondary">· {user?.email}</span>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {summaryLoading ? (
          Array.from({ length: 4 }).map((_, i) => <KPICardSkeleton key={i} />)
        ) : summary ? (
          <>
            <KPICard
              label="Snack Catalog"
              value={summary.totalTypes}
              sublabel="Unique snack varieties"
              icon={<Package size={22} className="text-primary" />}
              color="text-primary-text"
              bgColor="bg-soft-yellow"
            />
            <KPICard
              label="Available Units"
              value={summary.totalUnits.toLocaleString()}
              sublabel="Total packs on shelves"
              icon={<CheckCircle size={22} className="text-green-600" />}
              color="text-green-600"
              bgColor="bg-green-50"
            />
            <KPICard
              label="Running Low"
              value={summary.runningLow}
              sublabel="Near low-stock alert"
              icon={<TrendingDown size={22} className="text-orange-500" />}
              color="text-orange-500"
              bgColor="bg-orange-50"
            />
            <KPICard
              label="Out of Stock"
              value={summary.gone}
              sublabel="0 items remaining"
              icon={<AlertCircle size={22} className="text-red-500" />}
              color="text-red-500"
              bgColor="bg-red-50"
            />
          </>
        ) : null}
      </div>

      {/* 3 Core Highlight Cards: Snack of Week, Inventory Donut, Popular Snacks */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Snack of the Week */}
        <div className="bg-white rounded-2xl border border-border overflow-hidden flex flex-col shadow-xs">
          <div className="bg-gradient-to-r from-amber-400 to-amber-500 px-5 py-3 flex items-center justify-between text-white">
            <div className="flex items-center gap-2">
              <Trophy size={16} className="text-amber-100" />
              <p className="text-xs font-bold uppercase tracking-wider">Snack of the Week</p>
            </div>
            <span className="text-[11px] font-semibold bg-white/20 px-2 py-0.5 rounded-full">
              Weekly #1
            </span>
          </div>

          <div className="p-5 flex flex-col flex-1 justify-between">
            {summaryLoading ? (
              <div className="space-y-3 animate-pulse">
                <div className="bg-gray-200 h-24 rounded-xl" />
                <div className="bg-gray-200 h-4 w-32 rounded" />
              </div>
            ) : summary?.snackOfTheWeek ? (
              <>
                <div className="flex gap-4">
                  <div className="w-24 h-24 rounded-xl overflow-hidden bg-slate-50 border border-border shadow-xs flex-shrink-0 flex items-center justify-center p-1">
                    <SnackImage snack={summary.snackOfTheWeek} className="w-full h-full" size="md" fit="contain" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-primary-text text-base leading-snug truncate" title={summary.snackOfTheWeek.name}>
                      {summary.snackOfTheWeek.name}
                    </h3>
                    <div className="mt-1.5">
                      <CategoryBadge category={summary.snackOfTheWeek.category} size="sm" />
                    </div>
                    <div className="flex items-center gap-1.5 mt-2.5">
                      <Heart size={14} className="text-red-500 fill-current" />
                      <span className="text-sm font-bold text-primary-text">
                        {summary.snackOfTheWeek.weeklyVotes}
                      </span>
                      <span className="text-xs text-secondary">votes this week</span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-border flex items-center justify-between">
                  <StockBadge status={summary.snackOfTheWeek.stockStatus} size="sm" />
                  <button
                    onClick={() => voteMutation.mutate({
                      id: summary.snackOfTheWeek!.id,
                      voted: summary.snackOfTheWeek!.userVoted,
                    })}
                    disabled={voteMutation.isPending}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      summary.snackOfTheWeek.userVoted
                        ? 'bg-red-50 text-red-500 border border-red-200 hover:bg-red-100'
                        : 'bg-soft-yellow text-primary border border-primary/20 hover:bg-primary/20'
                    }`}
                  >
                    {voteMutation.isPending ? (
                      <Loader2 size={12} className="animate-spin" />
                    ) : (
                      <Heart size={12} className={summary.snackOfTheWeek.userVoted ? 'fill-current' : ''} />
                    )}
                    {summary.snackOfTheWeek.userVoted ? 'Voted' : 'Vote'}
                  </button>
                </div>
              </>
            ) : (
              <div className="py-8 text-center my-auto">
                <Sparkles size={28} className="mx-auto text-amber-400 mb-2" />
                <p className="text-sm font-bold text-primary-text">No weekly champion yet</p>
                <p className="text-xs text-secondary mt-1">Vote for your favourites in Inventory!</p>
                <Link
                  to="/inventory"
                  className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
                >
                  Browse snacks <ArrowUpRight size={13} />
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Inventory Overview Donut Chart (Fixed Overlap Bug) */}
        <div className="bg-white rounded-2xl border border-border p-5 flex flex-col shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm font-bold text-primary-text">Inventory Health</h2>
            <span className="text-xs text-secondary font-medium">Real-time breakdown</span>
          </div>

          {summaryLoading ? (
            <div className="h-52 bg-gray-100 rounded-xl animate-pulse" />
          ) : chartData.length > 0 ? (
            <div className="flex flex-col flex-1 justify-between">
              {/* Donut Container with clean spacing */}
              <div className="w-full h-40 relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={44}
                      outerRadius={68}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {chartData.map((entry) => (
                        <Cell
                          key={entry.name}
                          fill={STATUS_COLOR_MAP[entry.name] || '#94a3b8'}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(val: number) => [`${val} snacks`, 'Total']}
                      contentStyle={{
                        borderRadius: '12px',
                        border: '1px solid #e2e8f0',
                        fontSize: '12px',
                        fontWeight: 'bold',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Explicit Legend Metrics - Never Collides or Overlaps */}
              <div className="grid grid-cols-3 gap-2 pt-3 border-t border-border mt-1">
                <div className="text-center bg-green-50/70 border border-green-100 rounded-xl py-1.5 px-1">
                  <div className="flex items-center justify-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-green-500" />
                    <span className="text-[11px] font-semibold text-green-800">Stocked</span>
                  </div>
                  <p className="text-sm font-extrabold text-green-700 mt-0.5">{summary?.stocked ?? 0}</p>
                </div>

                <div className="text-center bg-orange-50/70 border border-orange-100 rounded-xl py-1.5 px-1">
                  <div className="flex items-center justify-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-orange-500" />
                    <span className="text-[11px] font-semibold text-orange-800">Low</span>
                  </div>
                  <p className="text-sm font-extrabold text-orange-700 mt-0.5">{summary?.runningLow ?? 0}</p>
                </div>

                <div className="text-center bg-red-50/70 border border-red-100 rounded-xl py-1.5 px-1">
                  <div className="flex items-center justify-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-red-500" />
                    <span className="text-[11px] font-semibold text-red-800">Gone</span>
                  </div>
                  <p className="text-sm font-extrabold text-red-700 mt-0.5">{summary?.gone ?? 0}</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-52 flex items-center justify-center">
              <p className="text-secondary text-sm">No inventory data available</p>
            </div>
          )}
        </div>

        {/* Most Voted Snacks */}
        <div className="bg-white rounded-2xl border border-border p-5 flex flex-col shadow-xs md:col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-primary-text flex items-center gap-1.5">
              <Flame size={16} className="text-orange-500" />
              Most Popular Snacks
            </h2>
            <Link to="/inventory" className="text-xs font-semibold text-primary hover:underline flex items-center gap-0.5">
              View all <ArrowUpRight size={13} />
            </Link>
          </div>

          {popularLoading ? (
            <div className="space-y-2.5">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 animate-pulse py-1">
                  <div className="w-10 h-10 bg-gray-200 rounded-xl flex-shrink-0" />
                  <div className="flex-1 space-y-1">
                    <div className="bg-gray-200 h-3.5 w-28 rounded" />
                    <div className="bg-gray-200 h-2.5 w-16 rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-2.5 flex-1">
              {popularData?.snacks.slice(0, 4).map((snack, i) => (
                <div
                  key={snack.id}
                  className="flex items-center gap-2.5 p-1.5 rounded-xl hover:bg-warm/60 transition-colors"
                >
                  <span className={`w-5 text-center text-xs font-extrabold ${i === 0 ? 'text-amber-500' : 'text-secondary'}`}>
                    {i + 1}
                  </span>
                  <div className="w-10 h-10 rounded-xl overflow-hidden bg-slate-50 border border-border shadow-2xs flex-shrink-0 flex items-center justify-center p-0.5">
                    <SnackImage snack={snack} className="w-full h-full" size="sm" fit="contain" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-primary-text truncate" title={snack.name}>
                      {snack.name}
                    </p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <CategoryBadge category={snack.category} size="sm" />
                      <StockBadge status={snack.stockStatus} size="sm" />
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-xs font-bold text-secondary flex-shrink-0 pl-1">
                    <Heart size={13} className="text-red-500 fill-current" />
                    <span>{snack.voteCount}</span>
                  </div>
                </div>
              ))}
              {!popularData?.snacks.length && (
                <p className="text-xs text-secondary text-center py-8">No votes recorded yet.</p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Recent Activity (admin only) */}
      {user?.role === 'ADMIN' && activityData && (
        <div className="bg-white rounded-2xl border border-border p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-primary-text flex items-center gap-2">
              <Activity size={16} className="text-primary" />
              Live Pantry Activity Stream
            </h2>
            <Link to="/activity" className="text-xs font-semibold text-primary hover:underline flex items-center gap-0.5">
              Full Activity Log <ArrowUpRight size={13} />
            </Link>
          </div>
          <div className="space-y-2">
            {activityData.activities.map((activity) => (
              <div
                key={activity.id}
                className="flex items-center gap-3 py-2.5 px-3 rounded-xl hover:bg-warm/40 transition-colors border-b border-border/50 last:border-0"
              >
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    activity.action === 'CONSUMED'
                      ? 'bg-orange-50 text-orange-600'
                      : 'bg-green-50 text-green-600'
                  }`}
                >
                  {activity.action === 'CONSUMED' ? (
                    <TrendingDown size={14} />
                  ) : (
                    <Package size={14} />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-primary-text">
                    <strong className="font-bold">{activity.user.name}</strong>{' '}
                    {activity.action === 'CONSUMED' ? 'enjoyed' : 'restocked'}{' '}
                    <span className="font-extrabold text-primary-text">{activity.amount}×</span>{' '}
                    <span className="font-semibold">{activity.snack.name}</span>
                  </p>
                </div>
                <span className="text-[11px] text-secondary flex-shrink-0 font-medium">
                  {formatRelativeTime(activity.createdAt)}
                </span>
              </div>
            ))}
            {activityData.activities.length === 0 && (
              <p className="text-sm text-secondary text-center py-6">No pantry activity logged yet.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
