import { useState } from 'react';
import { X, Heart, Package, AlertTriangle, ArrowDownCircle, ArrowUpCircle, Sparkles, Loader2, Edit, RefreshCw, Trash2 } from 'lucide-react';
import type { Snack } from '../types';
import { StockBadge, CategoryBadge } from './Badges';
import { SnackImage } from './SnackImage';
import { getSnackVisual } from '../utils/snackVisuals';
import { useAuth } from '../context/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { snacksApi, ApiError } from '../services/api';
import { formatRelativeTime } from '../utils';
import toast from 'react-hot-toast';

interface SnackDetailDrawerProps {
  snack: Snack | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit?: (snack: Snack) => void;
  onRestock?: (snack: Snack) => void;
  onDelete?: (snack: Snack) => void;
}

export function SnackDetailDrawer({
  snack,
  isOpen,
  onClose,
  onEdit,
  onRestock,
  onDelete,
}: SnackDetailDrawerProps) {
  const { isAdmin } = useAuth();
  const queryClient = useQueryClient();
  const [isConsuming, setIsConsuming] = useState(false);

  // Fetch recent activity specifically for this snack
  const { data: activityData, isLoading: activityLoading } = useQuery({
    queryKey: ['snack-activity', snack?.id],
    queryFn: () => snacksApi.activity({ snackId: snack?.id, limit: 5 }),
    enabled: isOpen && !!snack?.id && isAdmin,
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['snacks'] });
    queryClient.invalidateQueries({ queryKey: ['summary'] });
    queryClient.invalidateQueries({ queryKey: ['popular'] });
    if (snack?.id) {
      queryClient.invalidateQueries({ queryKey: ['snack-activity', snack.id] });
    }
  };

  const consumeMutation = useMutation({
    mutationFn: () => snacksApi.consume(snack!.id, 1),
    onMutate: () => setIsConsuming(true),
    onSuccess: (updatedSnack) => {
      toast.success(`Enjoyed ${updatedSnack.name}! 🎉`);
      invalidate();
    },
    onError: (err: unknown) => {
      if (err instanceof ApiError && err.code === 'INSUFFICIENT_STOCK') {
        toast.error("Someone beat you to the last packet! The pantry has been updated.", {
          duration: 4000,
          icon: '😅',
        });
        invalidate();
      } else if (err instanceof ApiError) {
        toast.error(err.message);
      } else {
        toast.error('Failed to consume snack.');
      }
    },
    onSettled: () => setIsConsuming(false),
  });

  const voteMutation = useMutation({
    mutationFn: () =>
      snack!.userVoted ? snacksApi.unvote(snack!.id) : snacksApi.vote(snack!.id),
    onSuccess: (data) => {
      toast.success(data.userVoted ? 'Voted for this snack! ❤️' : 'Vote removed');
      invalidate();
    },
    onError: (err: unknown) => {
      if (err instanceof ApiError) {
        toast.error(err.message);
      } else {
        toast.error('Failed to update vote.');
      }
    },
  });

  if (!isOpen || !snack) return null;

  const visual = getSnackVisual(snack.name, snack.category);
  const isGone = snack.stockStatus === 'GONE';
  const isRunningLow = snack.stockStatus === 'RUNNING_LOW';
  const maxStock = Math.max(snack.quantity, snack.lowStockThreshold * 2, 20);
  const stockPercentage = Math.min(100, Math.round((snack.quantity / maxStock) * 100));

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col">
          {/* Header */}
          <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-warm/50">
            <div className="flex items-center gap-2">
              <span className="text-xl">{visual.emoji}</span>
              <span className="text-xs font-bold uppercase tracking-wider text-secondary">
                Snack Details
              </span>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-secondary hover:text-primary-text hover:bg-white transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          {/* Scrollable Body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Product Packshot Showcase */}
            <div className="relative h-60 rounded-2xl overflow-hidden bg-gradient-to-b from-white to-slate-50 border border-border flex items-center justify-center p-4">
              <SnackImage snack={snack} className="w-full h-full" size="xl" fit="contain" />
              {isGone && (
                <div className="absolute top-3 right-3 bg-red-100 border border-red-200 text-red-600 text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1 shadow-sm">
                  <Package size={12} />
                  Out of Stock
                </div>
              )}
            </div>

            {/* Title & Badges */}
            <div>
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <CategoryBadge category={snack.category} />
                <StockBadge status={snack.stockStatus} />
              </div>
              <h2 className="text-2xl font-bold text-primary-text">{snack.name}</h2>
              <p className="text-xs font-semibold text-primary mt-0.5">{visual.tag}</p>
              <p className="text-sm text-secondary mt-2 leading-relaxed">{visual.description}</p>
            </div>

            {/* Inventory Level Meter */}
            <div className="bg-warm/60 rounded-2xl p-4 border border-border">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-secondary uppercase tracking-wider">
                  Live Pantry Stock
                </span>
                <span className="text-sm font-bold text-primary-text">
                  <span className={`text-lg ${isGone ? 'text-red-500' : isRunningLow ? 'text-orange-500' : 'text-green-600'}`}>
                    {snack.quantity}
                  </span>{' '}
                  units available
                </span>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-border rounded-full h-2.5 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    isGone
                      ? 'bg-red-500'
                      : isRunningLow
                      ? 'bg-orange-500'
                      : 'bg-green-500'
                  }`}
                  style={{ width: `${Math.max(5, stockPercentage)}%` }}
                />
              </div>

              <div className="flex justify-between items-center text-xs text-secondary mt-2">
                <span>Alert Threshold: {snack.lowStockThreshold} units</span>
                <span>{snack.voteCount} user vote{snack.voteCount !== 1 ? 's' : ''}</span>
              </div>
            </div>

            {/* Nutrition / Specs Cards */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white border border-border rounded-xl p-3 text-center shadow-sm">
                <p className="text-[11px] text-secondary font-medium">Standard Pack</p>
                <p className="text-sm font-bold text-primary-text mt-0.5">{visual.netWeight}</p>
              </div>
              <div className="bg-white border border-border rounded-xl p-3 text-center shadow-sm">
                <p className="text-[11px] text-secondary font-medium">Energy / Serving</p>
                <p className="text-sm font-bold text-primary-text mt-0.5">{visual.calories || '180 kcal'}</p>
              </div>
            </div>

            {/* Admin Management Section */}
            {isAdmin && (
              <div className="border-t border-border pt-4">
                <p className="text-xs font-bold uppercase tracking-wider text-secondary mb-3">
                  Admin Inventory Controls
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      onClose();
                      onRestock?.(snack);
                    }}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-semibold bg-green-50 text-green-700 border border-green-200 hover:bg-green-100 transition-colors"
                  >
                    <RefreshCw size={13} />
                    Restock
                  </button>
                  <button
                    onClick={() => {
                      onClose();
                      onEdit?.(snack);
                    }}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 transition-colors"
                  >
                    <Edit size={13} />
                    Edit
                  </button>
                  <button
                    onClick={() => {
                      onClose();
                      onDelete?.(snack);
                    }}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-semibold bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 transition-colors"
                  >
                    <Trash2 size={13} />
                    Delete
                  </button>
                </div>
              </div>
            )}

            {/* Recent Snack Activity (Admin) */}
            {isAdmin && (
              <div className="border-t border-border pt-4">
                <p className="text-xs font-bold uppercase tracking-wider text-secondary mb-2">
                  Recent Activity Trail
                </p>
                {activityLoading ? (
                  <p className="text-xs text-secondary py-2">Loading events...</p>
                ) : !activityData?.activities?.length ? (
                  <p className="text-xs text-secondary py-2">No recent events for this snack.</p>
                ) : (
                  <div className="space-y-2">
                    {activityData.activities.map((act) => {
                      const isConsumed = act.action === 'CONSUMED';
                      return (
                        <div
                          key={act.id}
                          className="flex items-center justify-between py-1.5 text-xs border-b border-border/50 last:border-0"
                        >
                          <div className="flex items-center gap-2">
                            {isConsumed ? (
                              <ArrowDownCircle size={14} className="text-orange-500" />
                            ) : (
                              <ArrowUpCircle size={14} className="text-green-600" />
                            )}
                            <span className="font-medium text-primary-text">{act.user.name}</span>
                          </div>
                          <div className="flex items-center gap-2 text-secondary">
                            <span className={isConsumed ? 'font-bold text-orange-600' : 'font-bold text-green-600'}>
                              {isConsumed ? `-${act.amount}` : `+${act.amount}`}
                            </span>
                            <span>{formatRelativeTime(act.createdAt)}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Action Footer */}
          <div className="p-4 bg-warm/80 border-t border-border flex items-center gap-3">
            {/* Consume button */}
            <button
              onClick={() => consumeMutation.mutate()}
              disabled={isGone || isConsuming || consumeMutation.isPending}
              className="flex-1 py-3 px-4 rounded-xl font-bold text-sm bg-primary text-white hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm transition-all flex items-center justify-center gap-2"
            >
              {isConsuming ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Consuming...
                </>
              ) : isGone ? (
                'Out of Stock'
              ) : (
                'Consume 1 Unit'
              )}
            </button>

            {/* Vote / Unvote button */}
            <button
              onClick={() => voteMutation.mutate()}
              disabled={voteMutation.isPending}
              className={`p-3 rounded-xl border font-bold text-sm transition-all flex items-center gap-1.5 ${
                snack.userVoted
                  ? 'bg-red-50 text-red-500 border-red-200 hover:bg-red-100'
                  : 'bg-white text-secondary border-border hover:bg-soft-yellow hover:text-primary-text'
              }`}
            >
              <Heart size={18} className={snack.userVoted ? 'fill-current text-red-500' : ''} />
              <span>{snack.voteCount}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
