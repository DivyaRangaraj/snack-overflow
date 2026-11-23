import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Heart, Minus, Plus, MoreVertical, Edit, Trash2, Package, Loader2 } from 'lucide-react';
import type { Snack } from '../types';
import { snacksApi, ApiError } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { StockBadge, CategoryBadge } from './Badges';
import { SnackImage } from './SnackImage';
import toast from 'react-hot-toast';

interface SnackCardProps {
  snack: Snack;
  onEdit?: (snack: Snack) => void;
  onDelete?: (snack: Snack) => void;
  onRestock?: (snack: Snack) => void;
}

export function SnackCard({ snack, onEdit, onDelete, onRestock }: SnackCardProps) {
  const { isAdmin } = useAuth();
  const queryClient = useQueryClient();
  const [menuOpen, setMenuOpen] = useState(false);
  const [isConsuming, setIsConsuming] = useState(false);

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['snacks'] });
    queryClient.invalidateQueries({ queryKey: ['summary'] });
  };

  const consumeMutation = useMutation({
    mutationFn: () => snacksApi.consume(snack.id, 1),
    onMutate: () => setIsConsuming(true),
    onSuccess: () => {
      toast.success(`Enjoyed ${snack.name}! 🎉`);
      invalidate();
    },
    onError: (err: unknown) => {
      if (err instanceof ApiError && err.code === 'INSUFFICIENT_STOCK') {
        toast.error("Someone beat you to the last packet! The pantry has been updated.", {
          duration: 4000,
          icon: '😅',
        });
        invalidate(); // Refresh to show current state
      } else if (err instanceof ApiError) {
        toast.error(err.message);
      } else {
        toast.error('Failed to consume snack. Please try again.');
      }
    },
    onSettled: () => setIsConsuming(false),
  });

  const voteMutation = useMutation({
    mutationFn: () =>
      snack.userVoted ? snacksApi.unvote(snack.id) : snacksApi.vote(snack.id),
    onSuccess: (data) => {
      toast.success(data.userVoted ? 'Vote added! ❤️' : 'Vote removed');
      invalidate();
    },
    onError: (err: unknown) => {
      if (err instanceof ApiError && err.code === 'DUPLICATE_VOTE') {
        toast.error('You already voted for this snack!');
        invalidate();
      } else if (err instanceof ApiError) {
        toast.error(err.message);
      }
    },
  });

  const isGone = snack.stockStatus === 'GONE';
  const isVoting = voteMutation.isPending;

  return (
    <div className="bg-white rounded-2xl border border-border overflow-hidden hover:shadow-card transition-shadow duration-200 flex flex-col group">
      {/* Image */}
      <div className="relative h-44 overflow-hidden bg-soft-yellow">
        <SnackImage snack={snack} className="w-full h-full" />
        {isGone && (
          <div className="absolute inset-0 bg-white/60 flex items-center justify-center">
            <div className="bg-red-100 border border-red-200 rounded-xl px-3 py-1.5 text-red-600 text-xs font-semibold flex items-center gap-1">
              <Package size={12} />
              Out of Stock
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col flex-1">
        {/* Badges */}
        <div className="flex items-center gap-1.5 mb-2 flex-wrap">
          <CategoryBadge category={snack.category} size="sm" />
          <StockBadge status={snack.stockStatus} size="sm" />
        </div>

        {/* Name */}
        <h3 className="font-semibold text-primary-text text-sm leading-tight mb-1 line-clamp-2">
          {snack.name}
        </h3>

        {/* Stock info */}
        <div className="flex items-center justify-between text-xs text-secondary mb-3">
          <span>
            <span className={`font-medium ${isGone ? 'text-red-500' : snack.stockStatus === 'RUNNING_LOW' ? 'text-orange-500' : 'text-green-600'}`}>
              {snack.quantity}
            </span> units left
          </span>
          <span>Threshold: {snack.lowStockThreshold}</span>
        </div>

        {/* Actions */}
        <div className="flex gap-2 mt-auto">
          {/* Consume button */}
          <button
            onClick={() => consumeMutation.mutate()}
            disabled={isGone || isConsuming || consumeMutation.isPending}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-medium bg-primary text-white hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {isConsuming ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Minus size={14} />
            )}
            Consume
          </button>

          {/* Vote button */}
          <button
            onClick={() => voteMutation.mutate()}
            disabled={isVoting}
            className={`flex items-center gap-1 py-2 px-3 rounded-xl text-xs font-medium transition-all ${
              snack.userVoted
                ? 'bg-red-50 text-red-500 border border-red-200 hover:bg-red-100'
                : 'bg-gray-50 text-secondary border border-border hover:bg-soft-yellow hover:text-primary hover:border-primary/30'
            }`}
            title={snack.userVoted ? 'Remove vote' : 'Vote for this snack'}
          >
            {isVoting ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Heart size={14} className={snack.userVoted ? 'fill-current' : ''} />
            )}
            <span>{snack.voteCount}</span>
          </button>

          {/* Admin menu */}
          {isAdmin && (
            <div className="relative">
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="p-2 rounded-xl text-secondary hover:bg-gray-50 border border-border transition-colors"
              >
                <MoreVertical size={14} />
              </button>
              {menuOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                  <div className="absolute right-0 bottom-10 z-20 bg-white border border-border rounded-xl shadow-lg py-1 min-w-36">
                    <button
                      onClick={() => { onEdit?.(snack); setMenuOpen(false); }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs text-primary-text hover:bg-soft-yellow transition-colors"
                    >
                      <Edit size={13} />
                      Edit snack
                    </button>
                    <button
                      onClick={() => { onRestock?.(snack); setMenuOpen(false); }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs text-primary-text hover:bg-soft-yellow transition-colors"
                    >
                      <Plus size={13} />
                      Restock
                    </button>
                    <div className="border-t border-border my-1" />
                    <button
                      onClick={() => { onDelete?.(snack); setMenuOpen(false); }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <Trash2 size={13} />
                      Delete
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
