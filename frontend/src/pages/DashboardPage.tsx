import { useQuery } from '@tanstack/react-query';
import {
  Package, TrendingDown, AlertCircle, CheckCircle, Heart, Activity
} from 'lucide-react';
import { snacksApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { KPICardSkeleton } from '../components/Skeletons';
import { StockBadge, CategoryBadge } from '../components/Badges';
import { SnackImage } from '../components/SnackImage';
import { formatRelativeTime } from '../utils';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { snacksApi as api } from '../services/api';
import { ApiError } from '../services/api';
import toast from 'react-hot-toast';
import { Heart as HeartIcon, Loader2 } from 'lucide-react';

interface KPICardProps {
  label: string;
  value: number | string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
}

function KPICard({ label, value, icon, color, bgColor }: KPICardProps) {
  return (
    <div className="bg-white rounded-2xl border border-border p-6 hover:shadow-card transition-shadow">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-secondary font-medium">{label}</p>
          <p className={`text-3xl font-bold mt-1 ${color}`}>{value}</p>
        </div>
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${bgColor}`}>
          {icon}
        </div>
      </div>
    </div>
  );
}

const CHART_COLORS = ['#22c55e', '#f97316', '#ef4444'];

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
      args.voted ? api.unvote(args.id) : api.vote(args.id),
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
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-primary-text">
            {greeting()}, {user?.name?.split(' ')[0]}! 👋
          </h1>
          <p className="text-secondary text-sm mt-0.5">{today}</p>
        </div>
        <div className="hidden sm:flex items-center gap-2 bg-white border border-border rounded-xl px-3 py-2">
          <div className={`w-2 h-2 rounded-full ${user?.role === 'ADMIN' ? 'bg-primary' : 'bg-green-500'}`} />
          <span className="text-xs font-medium text-secondary">{user?.role === 'ADMIN' ? 'Administrator' : 'Member'}</span>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {summaryLoading ? (
          Array.from({ length: 4 }).map((_, i) => <KPICardSkeleton key={i} />)
        ) : summary ? (
          <>
            <KPICard
              label="Snack Types"
              value={summary.totalTypes}
              icon={<Package size={22} className="text-primary" />}
              color="text-primary-text"
              bgColor="bg-soft-yellow"
            />
            <KPICard
              label="Available Units"
              value={summary.totalUnits.toLocaleString()}
              icon={<CheckCircle size={22} className="text-green-600" />}
              color="text-green-600"
              bgColor="bg-green-50"
            />
            <KPICard
              label="Running Low"
              value={summary.runningLow}
              icon={<TrendingDown size={22} className="text-orange-500" />}
              color="text-orange-500"
              bgColor="bg-orange-50"
            />
            <KPICard
              label="Out of Stock"
              value={summary.gone}
              icon={<AlertCircle size={22} className="text-red-500" />}
              color="text-red-500"
              bgColor="bg-red-50"
            />
          </>
        ) : null}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Snack of the Week */}
        <div className="lg:col-span-1">
          {summaryLoading ? (
            <div className="bg-white rounded-2xl border border-border p-6 h-64 animate-pulse">
              <div className="bg-gray-200 h-4 w-32 rounded mb-4" />
              <div className="bg-gray-200 h-32 rounded-xl" />
            </div>
          ) : summary?.snackOfTheWeek ? (
            <div className="bg-white rounded-2xl border border-primary/20 overflow-hidden">
              <div className="bg-primary px-5 py-3">
                <p className="text-white text-xs font-semibold uppercase tracking-wide">🏆 Snack of the Week</p>
              </div>
              <div className="p-5">
                <div className="flex gap-4">
                  <div className="w-20 h-20 rounded-xl overflow-hidden shadow-sm flex-shrink-0">
                    <SnackImage snack={summary.snackOfTheWeek} className="w-full h-full" size="lg" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-primary-text text-sm leading-tight">{summary.snackOfTheWeek.name}</h3>
                    <div className="mt-1.5">
                      <CategoryBadge category={summary.snackOfTheWeek.category} size="sm" />
                    </div>
                    <div className="flex items-center gap-1 mt-2">
                      <Heart size={14} className="text-red-500 fill-current" />
                      <span className="text-sm font-bold text-primary-text">{summary.snackOfTheWeek.weeklyVotes}</span>
                      <span className="text-xs text-secondary">votes this week</span>
                    </div>
                  </div>
                </div>
                <div className="mt-4 flex items-center justify-between">
                  <StockBadge status={summary.snackOfTheWeek.stockStatus} />
                  <button
                    onClick={() => voteMutation.mutate({
                      id: summary.snackOfTheWeek!.id,
                      voted: summary.snackOfTheWeek!.userVoted,
                    })}
                    disabled={voteMutation.isPending}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                      summary.snackOfTheWeek.userVoted
                        ? 'bg-red-50 text-red-500 border border-red-200 hover:bg-red-100'
                        : 'bg-soft-yellow text-primary border border-primary/20 hover:bg-primary/10'
                    }`}
                  >
                    {voteMutation.isPending ? (
                      <Loader2 size={12} className="animate-spin" />
                    ) : (
                      <HeartIcon size={12} className={summary.snackOfTheWeek.userVoted ? 'fill-current' : ''} />
                    )}
                    {summary.snackOfTheWeek.userVoted ? 'Unvote' : 'Vote'}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-border p-6 text-center">
              <Heart size={32} className="mx-auto text-gray-300 mb-2" />
              <p className="text-secondary text-sm">No votes this week yet.</p>
              <p className="text-xs text-secondary/70 mt-1">Cast your vote in the inventory!</p>
            </div>
          )}
        </div>

        {/* Inventory Overview Chart */}
        <div className="lg:col-span-1 bg-white rounded-2xl border border-border p-6">
          <h2 className="text-sm font-semibold text-primary-text mb-4">Inventory Overview</h2>
          {summaryLoading ? (
            <div className="h-40 bg-gray-100 rounded-xl animate-pulse" />
          ) : chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={160}>
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={70}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {chartData.map((_, index) => (
                    <Cell key={index} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => [value, 'Snacks']} />
                <Legend iconSize={10} iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-40 flex items-center justify-center">
              <p className="text-secondary text-sm">No data available</p>
            </div>
          )}
        </div>

        {/* Popular Snacks */}
        <div className="lg:col-span-1 bg-white rounded-2xl border border-border p-6">
          <h2 className="text-sm font-semibold text-primary-text mb-4">Most Voted Snacks</h2>
          {popularLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 animate-pulse">
                  <div className="w-9 h-9 bg-gray-200 rounded-lg" />
                  <div className="flex-1">
                    <div className="bg-gray-200 h-3 w-28 rounded mb-1" />
                    <div className="bg-gray-200 h-3 w-16 rounded" />
                  </div>
                  <div className="bg-gray-200 h-4 w-10 rounded" />
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {popularData?.snacks.map((snack, i) => (
                <div key={snack.id} className="flex items-center gap-3">
                  <span className="text-sm font-bold text-secondary w-4">{i + 1}</span>
                  <div className="w-10 h-10 rounded-xl overflow-hidden shadow-sm flex-shrink-0">
                    <SnackImage snack={snack} className="w-full h-full" size="sm" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-primary-text truncate">{snack.name}</p>
                    <CategoryBadge category={snack.category} size="sm" />
                  </div>
                  <div className="flex items-center gap-1 text-xs text-secondary">
                    <Heart size={12} className="text-red-400" />
                    <span className="font-medium">{snack.voteCount}</span>
                  </div>
                </div>
              ))}
              {!popularData?.snacks.length && (
                <p className="text-sm text-secondary text-center py-4">No votes yet</p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Recent Activity (admin only) */}
      {user?.role === 'ADMIN' && activityData && (
        <div className="bg-white rounded-2xl border border-border p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-primary-text flex items-center gap-2">
              <Activity size={16} className="text-primary" />
              Recent Pantry Activity
            </h2>
          </div>
          <div className="space-y-3">
            {activityData.activities.map((activity) => (
              <div key={activity.id} className="flex items-center gap-3 py-2 border-b border-border last:border-0">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                  activity.action === 'CONSUMED' ? 'bg-orange-100' : 'bg-green-100'
                }`}>
                  {activity.action === 'CONSUMED' ? (
                    <TrendingDown size={14} className="text-orange-600" />
                  ) : (
                    <Package size={14} className="text-green-600" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-primary-text">
                    <span className="font-medium">{activity.user.name}</span>
                    {' '}{activity.action === 'CONSUMED' ? 'consumed' : 'restocked'}{' '}
                    <span className="font-medium">{activity.amount}×</span>
                    {' '}{activity.snack.name}
                  </p>
                </div>
                <span className="text-xs text-secondary flex-shrink-0">{formatRelativeTime(activity.createdAt)}</span>
              </div>
            ))}
            {activityData.activities.length === 0 && (
              <p className="text-sm text-secondary text-center py-4">No activity yet</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
