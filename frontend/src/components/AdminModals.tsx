import { useState } from 'react';
import { X, Loader2, AlertTriangle } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { Snack } from '../types';
import { snacksApi, ApiError } from '../services/api';
import toast from 'react-hot-toast';

interface DeleteModalProps {
  snack: Snack;
  onClose: () => void;
}

export function DeleteModal({ snack, onClose }: DeleteModalProps) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: () => snacksApi.delete(snack.id),
    onSuccess: () => {
      toast.success(`"${snack.name}" deleted successfully.`);
      queryClient.invalidateQueries({ queryKey: ['snacks'] });
      queryClient.invalidateQueries({ queryKey: ['summary'] });
      onClose();
    },
    onError: (err: unknown) => {
      if (err instanceof ApiError) toast.error(err.message);
      else toast.error('Failed to delete snack.');
    },
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-2xl w-full max-w-sm shadow-xl">
        <div className="p-6">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <AlertTriangle size={20} className="text-red-600" />
            </div>
            <div>
              <h3 className="font-semibold text-primary-text">Delete Snack</h3>
              <p className="text-sm text-secondary mt-1">
                Are you sure you want to delete <span className="font-medium text-primary-text">"{snack.name}"</span>?
                This will also remove all votes and activity records. This action cannot be undone.
              </p>
            </div>
          </div>
          <div className="flex gap-3 mt-6">
            <button
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-border text-sm font-medium text-secondary hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => mutation.mutate()}
              disabled={mutation.isPending}
              className="flex-1 py-2.5 rounded-xl bg-red-600 text-white text-sm font-medium hover:bg-red-700 disabled:opacity-60 transition-colors flex items-center justify-center gap-2"
            >
              {mutation.isPending ? (
                <><Loader2 size={16} className="animate-spin" /> Deleting...</>
              ) : (
                'Delete'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

interface RestockModalProps {
  snack: Snack;
  onClose: () => void;
}

export function RestockModal({ snack, onClose }: RestockModalProps) {
  const [amount, setAmount] = useState(10);
  const [error, setError] = useState('');
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: () => snacksApi.restock(snack.id, amount),
    onSuccess: (data) => {
      toast.success(`Restocked! New quantity: ${data.quantity} 📦`);
      queryClient.invalidateQueries({ queryKey: ['snacks'] });
      queryClient.invalidateQueries({ queryKey: ['summary'] });
      onClose();
    },
    onError: (err: unknown) => {
      if (err instanceof ApiError) toast.error(err.message);
      else toast.error('Failed to restock.');
    },
  });

  const handleSubmit = () => {
    if (!amount || amount < 1) {
      setError('Amount must be at least 1');
      return;
    }
    if (!Number.isInteger(amount)) {
      setError('Amount must be a whole number');
      return;
    }
    setError('');
    mutation.mutate();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-2xl w-full max-w-sm shadow-xl">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="text-lg font-semibold text-primary-text">Restock Snack</h2>
          <button onClick={onClose} className="p-2 text-secondary hover:bg-gray-100 rounded-lg transition-colors">
            <X size={18} />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div className="bg-soft-yellow rounded-xl p-4">
            <p className="font-medium text-primary-text text-sm">{snack.name}</p>
            <p className="text-xs text-secondary mt-0.5">Current quantity: <span className="font-semibold text-primary-text">{snack.quantity}</span></p>
          </div>

          <div>
            <label className="block text-sm font-medium text-primary-text mb-1.5">Amount to add</label>
            <input
              type="number"
              min={1}
              value={amount}
              onChange={(e) => setAmount(parseInt(e.target.value, 10) || 0)}
              className={`w-full px-3 py-2.5 rounded-xl border text-sm outline-none focus:ring-2 focus:ring-primary/30 ${error ? 'border-red-400' : 'border-border focus:border-primary'}`}
            />
            {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
          </div>

          <div className="bg-green-50 rounded-xl px-4 py-3">
            <p className="text-xs text-secondary">New quantity after restock:</p>
            <p className="text-lg font-bold text-green-600">{snack.quantity + (amount || 0)}</p>
          </div>

          <div className="flex gap-3">
            <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-border text-sm font-medium text-secondary hover:bg-gray-50 transition-colors">
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={mutation.isPending}
              className="flex-1 py-2.5 rounded-xl bg-primary text-white text-sm font-medium hover:bg-primary/90 disabled:opacity-60 transition-colors flex items-center justify-center gap-2"
            >
              {mutation.isPending ? <><Loader2 size={16} className="animate-spin" /> Restocking...</> : 'Confirm Restock'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
