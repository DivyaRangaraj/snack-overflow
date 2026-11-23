import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X, Loader2 } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { Snack } from '../types';
import { snacksApi, ApiError } from '../services/api';
import toast from 'react-hot-toast';

const snackSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  category: z.enum(['SWEET', 'SAVOURY', 'DRINK', 'HEALTHY_ISH']),
  quantity: z.coerce.number().int().min(0, 'Quantity cannot be negative'),
  lowStockThreshold: z.coerce.number().int().min(1, 'Threshold must be at least 1'),
  imageUrl: z.string().url('Please enter a valid URL').or(z.literal('')).optional(),
});

type SnackForm = z.infer<typeof snackSchema>;

interface SnackModalProps {
  snack?: Snack | null;
  onClose: () => void;
}

export function SnackModal({ snack, onClose }: SnackModalProps) {
  const isEditing = !!snack;
  const queryClient = useQueryClient();

  const { register, handleSubmit, formState: { errors }, reset } = useForm<SnackForm>({
    resolver: zodResolver(snackSchema),
    defaultValues: {
      name: snack?.name || '',
      category: snack?.category || 'SWEET',
      quantity: snack?.quantity ?? 0,
      lowStockThreshold: snack?.lowStockThreshold ?? 5,
      imageUrl: snack?.imageUrl || '',
    },
  });

  useEffect(() => {
    if (snack) {
      reset({
        name: snack.name,
        category: snack.category,
        quantity: snack.quantity,
        lowStockThreshold: snack.lowStockThreshold,
        imageUrl: snack.imageUrl || '',
      });
    }
  }, [snack, reset]);

  const mutation = useMutation({
    mutationFn: (data: SnackForm) => {
      const payload = { ...data, imageUrl: data.imageUrl || undefined };
      return isEditing
        ? snacksApi.update(snack!.id, payload)
        : snacksApi.create({ ...payload, quantity: payload.quantity, category: payload.category });
    },
    onSuccess: () => {
      toast.success(isEditing ? 'Snack updated!' : 'Snack created! 🎉');
      queryClient.invalidateQueries({ queryKey: ['snacks'] });
      queryClient.invalidateQueries({ queryKey: ['summary'] });
      onClose();
    },
    onError: (err: unknown) => {
      if (err instanceof ApiError) {
        toast.error(err.message);
      } else {
        toast.error('Failed to save snack.');
      }
    },
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="text-lg font-semibold text-primary-text">
            {isEditing ? 'Edit Snack' : 'Add New Snack'}
          </h2>
          <button onClick={onClose} className="p-2 text-secondary hover:bg-gray-100 rounded-lg transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit((data) => mutation.mutate(data))} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-primary-text mb-1.5">Snack name *</label>
            <input
              {...register('name')}
              placeholder="e.g. Oreo Original Biscuits"
              className={`w-full px-3 py-2.5 rounded-xl border text-sm outline-none focus:ring-2 focus:ring-primary/30 ${errors.name ? 'border-red-400' : 'border-border focus:border-primary'}`}
            />
            {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-primary-text mb-1.5">Category *</label>
            <select
              {...register('category')}
              className="w-full px-3 py-2.5 rounded-xl border border-border text-sm outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary bg-white"
            >
              <option value="SWEET">🍬 Sweet</option>
              <option value="SAVOURY">🥨 Savoury</option>
              <option value="DRINK">🥤 Drink</option>
              <option value="HEALTHY_ISH">🥗 Healthy-ish</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-primary-text mb-1.5">
                {isEditing ? 'Current Quantity' : 'Initial Quantity'} *
              </label>
              <input
                {...register('quantity')}
                type="number"
                min={0}
                className={`w-full px-3 py-2.5 rounded-xl border text-sm outline-none focus:ring-2 focus:ring-primary/30 ${errors.quantity ? 'border-red-400' : 'border-border focus:border-primary'}`}
              />
              {errors.quantity && <p className="text-red-500 text-xs mt-1">{errors.quantity.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-primary-text mb-1.5">Low Stock Alert *</label>
              <input
                {...register('lowStockThreshold')}
                type="number"
                min={1}
                className={`w-full px-3 py-2.5 rounded-xl border text-sm outline-none focus:ring-2 focus:ring-primary/30 ${errors.lowStockThreshold ? 'border-red-400' : 'border-border focus:border-primary'}`}
              />
              {errors.lowStockThreshold && <p className="text-red-500 text-xs mt-1">{errors.lowStockThreshold.message}</p>}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-primary-text mb-1.5">Image URL (optional)</label>
            <input
              {...register('imageUrl')}
              placeholder="https://..."
              className={`w-full px-3 py-2.5 rounded-xl border text-sm outline-none focus:ring-2 focus:ring-primary/30 ${errors.imageUrl ? 'border-red-400' : 'border-border focus:border-primary'}`}
            />
            {errors.imageUrl && <p className="text-red-500 text-xs mt-1">{errors.imageUrl.message}</p>}
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-border text-sm font-medium text-secondary hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={mutation.isPending}
              className="flex-1 py-2.5 rounded-xl bg-primary text-white text-sm font-medium hover:bg-primary/90 disabled:opacity-60 transition-colors flex items-center justify-center gap-2"
            >
              {mutation.isPending ? (
                <><Loader2 size={16} className="animate-spin" /> Saving...</>
              ) : (
                isEditing ? 'Save Changes' : 'Add Snack'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
