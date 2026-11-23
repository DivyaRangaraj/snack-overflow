import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Heart, MoreVertical, Edit, Trash2, Package, Loader2, RefreshCw } from 'lucide-react';
import type { Snack } from '../types';
import { snacksApi, ApiError } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { StockBadge, CategoryBadge } from './Badges';
import { SnackImage } from './SnackImage';
import toast from 'react-hot-toast';

interface SnackCardProps {
  snack: Snack;
  onOpenDetail?: (snack: Snack) => void;
  onEdit?: (snack: Snack) => void;
  onDelete?: (snack: Snack) => void;
  onRestock?: (snack: Snack) => void;
}

export function SnackCard({ snack, onOpenDetail, onEdit, onDelete, onRestock }: SnackCardProps) {
  const { isAdmin } = useAuth();
  const queryClient = useQueryClient();
  const [menuOpen, setMenuOpen] = useState(false);
  const [isConsuming, setIsConsuming] = useState(false);

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['snacks'] });
    queryClient.invalidateQueries({ queryKey: ['summary'] });
    queryClient.invalidateQueries({ queryKey: ['popular'] });
  };

  const consumeMutation = useMutation({
    mutationFn: () => snacksApi.consume(snack.id, 1),
    onMutate: () => setIsConsuming(true),
    onSuccess: (data) => {
      toast.success(`Enjoyed ${data.name}! 🎉`);
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
  const isRunningLow = snack.stockStatus === 'RUNNING_LOW';

  return (
    <div className="bg-white rounded-2xl border border-border overflow-hidden hover:shadow-hover hover:border-primary/40 transition-all duration-200 flex flex-col group relative">
      {/* Product Image Area - Clickable to open Drawer */}
      <div
        onClick={() => onOpenDetail?.(snack)}
        className="relative h-48 bg-gradient-to-b from-white to-slate-50 border-b border-border/60 overflow-hidden cursor-pointer"
      >
        <SnackImage snack={snack} className="w-full h-full" size="md" fit="contain" />

        {/* Out of Stock Overlay Badge */}
        {isGone && (
          <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] flex items-center justify-center">
            <span className="bg-red-500 text-white font-bold text-xs px-3 py-1.5 rounded-full shadow-md flex items-center gap-1.5 uppercase tracking-wide">
              <Package size={13} />
              Out of Stock
            </span>
          </div>
        )}

        {/* Admin 3-dot dropdown menu */}
        {isAdmin && (
          <div className="absolute top-2.5 right-2.5 z-20">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setMenuOpen(!menuOpen);
              }}
              className="w-8 h-8 rounded-full bg-white/90 shadow-sm border border-border flex items-center justify-center text-secondary hover:text-primary-text hover:bg-white transition-colors"
            >
              <MoreVertical size={15} />
            </button>

            {menuOpen && (
              <>
                <div
                  className="fixed inset-0 z-20"
                  onClick={(e) => {
                    e.stopPropagation();
                    setMenuOpen(false);
                  }}
                />
                <div className="absolute right-0 top-9 z-30 w-36 bg-white rounded-xl shadow-lg border border-border py-1 text-xs font-medium animate-in fade-in zoom-in-95">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setMenuOpen(false);
                      onRestock?.(snack);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 hover:bg-soft-yellow text-primary-text text-left"
                  >
                    <RefreshCw size={13} className="text-green-600" />
                    Restock
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setMenuOpen(false);
                      onEdit?.(snack);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 hover:bg-soft-yellow text-primary-text text-left"
                  >
                    <Edit size={13} className="text-primary" />
                    Edit Snack
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setMenuOpen(false);
                      onDelete?.(snack);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 hover:bg-red-50 text-red-600 text-left"
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

      {/* Card Content */}
      <div className="p-4 flex flex-col flex-1">
        {/* Name (Clickable) */}
        <h3
          onClick={() => onOpenDetail?.(snack)}
          className="font-bold text-primary-text text-base leading-snug mb-1.5 line-clamp-1 hover:text-primary transition-colors cursor-pointer"
          title={snack.name}
        >
          {snack.name}
        </h3>

        {/* Status Line: Units left · Status */}
        <div className="flex items-center gap-1.5 text-xs mb-1">
          <span
            className={`font-bold ${
              isGone ? 'text-red-500' : isRunningLow ? 'text-orange-500' : 'text-green-600'
            }`}
          >
            {snack.quantity} units
          </span>
          <span className="text-secondary/40">·</span>
          <StockBadge status={snack.stockStatus} size="sm" />
        </div>

        {/* Category & Votes Line */}
        <div className="flex items-center justify-between text-xs text-secondary mt-1 mb-4">
          <CategoryBadge category={snack.category} size="sm" />
          <span className="text-[11px] font-medium text-secondary">
            Threshold: {snack.lowStockThreshold}
          </span>
        </div>

        {/* Actions Row */}
        <div className="flex items-center gap-2 mt-auto pt-2 border-t border-border/50">
          {/* Consume Button */}
          <button
            onClick={() => consumeMutation.mutate()}
            disabled={isGone || isConsuming || consumeMutation.isPending}
            className="flex-1 py-2 px-3 rounded-xl font-bold text-xs bg-primary text-white hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed shadow-sm transition-all flex items-center justify-center gap-1.5 active:scale-[0.98]"
          >
            {isConsuming ? (
              <Loader2 size={13} className="animate-spin" />
            ) : isGone ? (
              'Out of Stock'
            ) : (
              'Consume'
            )}
          </button>

          {/* Vote Heart Button */}
          <button
            onClick={() => voteMutation.mutate()}
            disabled={voteMutation.isPending}
            className={`py-2 px-2.5 rounded-xl border text-xs font-bold flex items-center gap-1 transition-all ${
              snack.userVoted
                ? 'bg-red-50 text-red-500 border-red-200 hover:bg-red-100'
                : 'bg-white text-secondary border-border hover:bg-soft-yellow hover:text-primary-text'
            }`}
            title={snack.userVoted ? 'Remove Vote' : 'Vote for this snack'}
          >
            <Heart size={14} className={snack.userVoted ? 'fill-current text-red-500' : ''} />
            <span>{snack.voteCount}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
