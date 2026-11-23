import { useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, SlidersHorizontal, Plus, X, ChevronLeft, ChevronRight, Package } from 'lucide-react';
import type { Snack, Category, StockStatus, SnacksResponse } from '../types';
import { snacksApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { SnackCard } from '../components/SnackCard';
import { SnackCardSkeleton } from '../components/Skeletons';
import { SnackModal } from '../components/SnackModal';
import { DeleteModal, RestockModal } from '../components/AdminModals';
import { useDebounce } from '../hooks/useDebounce';

const CATEGORIES: Array<{ label: string; value: Category | '' }> = [
  { label: 'All Categories', value: '' },
  { label: '🍬 Sweet', value: 'SWEET' },
  { label: '🥨 Savoury', value: 'SAVOURY' },
  { label: '🥤 Drink', value: 'DRINK' },
  { label: '🥗 Healthy-ish', value: 'HEALTHY_ISH' },
];

const STATUSES: Array<{ label: string; value: StockStatus | '' }> = [
  { label: 'All Status', value: '' },
  { label: '✅ In Stock', value: 'STOCKED' },
  { label: '⚠️ Running Low', value: 'RUNNING_LOW' },
  { label: '❌ Out of Stock', value: 'GONE' },
];

const SORTS = [
  { label: 'Newest First', value: '' },
  { label: 'Name A–Z', value: 'name' },
  { label: 'Qty: High → Low', value: 'quantity_desc' },
  { label: 'Qty: Low → High', value: 'quantity_asc' },
  { label: 'Most Voted', value: 'votes' },
];

export function InventoryPage() {
  const { isAdmin } = useAuth();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<Category | ''>('');
  const [status, setStatus] = useState<StockStatus | ''>('');
  const [sort, setSort] = useState('');
  const [page, setPage] = useState(1);
  const [addOpen, setAddOpen] = useState(false);
  const [editSnack, setEditSnack] = useState<Snack | null>(null);
  const [deleteSnack, setDeleteSnack] = useState<Snack | null>(null);
  const [restockSnack, setRestockSnack] = useState<Snack | null>(null);

  const debouncedSearch = useDebounce(search, 350);

  const { data, isLoading, isError } = useQuery<SnacksResponse>({
    queryKey: ['snacks', { search: debouncedSearch, category, status, sort, page }],
    queryFn: () =>
      snacksApi.list({
        search: debouncedSearch,
        category: category || undefined,
        status: status || undefined,
        sort: sort || undefined,
        page,
        limit: 12,
      }),
  });

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    setPage(1);
  }, []);

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setCategory(e.target.value as Category | '');
    setPage(1);
  };

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setStatus(e.target.value as StockStatus | '');
    setPage(1);
  };

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSort(e.target.value);
    setPage(1);
  };

  const clearFilters = () => {
    setSearch('');
    setCategory('');
    setStatus('');
    setSort('');
    setPage(1);
  };

  const hasFilters = search || category || status || sort;
  const { snacks = [], pagination } = data || {};

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-primary-text">Snack Inventory</h1>
          <p className="text-secondary text-sm mt-0.5">
            {pagination ? `${pagination.total} snack${pagination.total !== 1 ? 's' : ''} total` : 'Managing all pantry items'}
          </p>
        </div>
        {isAdmin && (
          <button
            onClick={() => setAddOpen(true)}
            className="flex items-center gap-2 bg-primary text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-primary/90 transition-colors shadow-sm"
          >
            <Plus size={16} />
            Add Snack
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-border p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary" />
            <input
              value={search}
              onChange={handleSearchChange}
              placeholder="Search snacks..."
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-border text-sm outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary bg-white"
            />
            {search && (
              <button
                onClick={() => { setSearch(''); setPage(1); }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-secondary hover:text-primary-text"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Category */}
          <select
            value={category}
            onChange={handleCategoryChange}
            className="px-3 py-2.5 rounded-xl border border-border text-sm outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary bg-white"
          >
            {CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>

          {/* Status */}
          <select
            value={status}
            onChange={handleStatusChange}
            className="px-3 py-2.5 rounded-xl border border-border text-sm outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary bg-white"
          >
            {STATUSES.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>

          {/* Sort */}
          <select
            value={sort}
            onChange={handleSortChange}
            className="px-3 py-2.5 rounded-xl border border-border text-sm outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary bg-white"
          >
            {SORTS.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>

          {hasFilters && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl border border-border text-sm text-secondary hover:bg-gray-50 transition-colors whitespace-nowrap"
            >
              <X size={14} />
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 12 }).map((_, i) => <SnackCardSkeleton key={i} />)}
        </div>
      ) : isError ? (
        <div className="bg-white rounded-2xl border border-red-200 p-12 text-center">
          <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center mx-auto mb-3">
            <X size={20} className="text-red-500" />
          </div>
          <h3 className="font-semibold text-primary-text">Failed to load snacks</h3>
          <p className="text-secondary text-sm mt-1">Please try refreshing the page.</p>
        </div>
      ) : snacks.length === 0 ? (
        <div className="bg-white rounded-2xl border border-border p-16 text-center">
          <div className="w-16 h-16 bg-soft-yellow rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Package size={28} className="text-primary/60" />
          </div>
          <h3 className="font-semibold text-primary-text">No snacks found</h3>
          <p className="text-secondary text-sm mt-1">
            {hasFilters ? 'Try adjusting your filters.' : 'The pantry is empty. Add some snacks!'}
          </p>
          {hasFilters && (
            <button
              onClick={clearFilters}
              className="mt-4 px-4 py-2 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              Clear filters
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {snacks.map((snack) => (
            <SnackCard
              key={snack.id}
              snack={snack}
              onEdit={isAdmin ? setEditSnack : undefined}
              onDelete={isAdmin ? setDeleteSnack : undefined}
              onRestock={isAdmin ? setRestockSnack : undefined}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between bg-white rounded-2xl border border-border px-6 py-4">
          <p className="text-sm text-secondary">
            Showing {((page - 1) * 12) + 1}–{Math.min(page * 12, pagination.total)} of {pagination.total}
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(page - 1)}
              disabled={page === 1}
              className="p-2 rounded-xl border border-border text-secondary hover:bg-soft-yellow disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft size={16} />
            </button>
            <div className="flex gap-1">
              {Array.from({ length: Math.min(pagination.totalPages, 7) }, (_, i) => {
                const p = i + 1;
                return (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={`w-9 h-9 rounded-xl text-sm font-medium transition-colors ${
                      p === page
                        ? 'bg-primary text-white'
                        : 'border border-border text-secondary hover:bg-soft-yellow'
                    }`}
                  >
                    {p}
                  </button>
                );
              })}
            </div>
            <button
              onClick={() => setPage(page + 1)}
              disabled={page === pagination.totalPages}
              className="p-2 rounded-xl border border-border text-secondary hover:bg-soft-yellow disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Modals */}
      {addOpen && <SnackModal onClose={() => setAddOpen(false)} />}
      {editSnack && <SnackModal snack={editSnack} onClose={() => setEditSnack(null)} />}
      {deleteSnack && <DeleteModal snack={deleteSnack} onClose={() => setDeleteSnack(null)} />}
      {restockSnack && <RestockModal snack={restockSnack} onClose={() => setRestockSnack(null)} />}
    </div>
  );
}
