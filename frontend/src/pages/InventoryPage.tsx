import { useState, useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Search, Plus, X, ChevronLeft, ChevronRight, Package,
  LayoutGrid, List, CheckCircle2, AlertTriangle, XCircle,
  Boxes, RefreshCw, Edit, Trash2, Heart, Loader2, MoreVertical
} from 'lucide-react';
import type { Snack, Category, StockStatus, SnacksResponse, DashboardSummary } from '../types';
import { snacksApi, ApiError } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { SnackCard } from '../components/SnackCard';
import { SnackDetailDrawer } from '../components/SnackDetailDrawer';
import { SnackCardSkeleton, Skeleton } from '../components/Skeletons';
import { SnackModal } from '../components/SnackModal';
import { DeleteModal, RestockModal } from '../components/AdminModals';
import { StockBadge, CategoryBadge } from '../components/Badges';
import { SnackImage } from '../components/SnackImage';
import { useDebounce } from '../hooks/useDebounce';
import toast from 'react-hot-toast';

const CATEGORIES: Array<{ label: string; value: Category | '' }> = [
  { label: 'All Categories', value: '' },
  { label: '🍬 Sweet', value: 'SWEET' },
  { label: '🥨 Savoury', value: 'SAVOURY' },
  { label: '🥤 Drink', value: 'DRINK' },
  { label: '🥗 Healthy-ish', value: 'HEALTHY_ISH' },
];

const STATUSES: Array<{ label: string; value: StockStatus | '' }> = [
  { label: 'All Statuses', value: '' },
  { label: '✅ Stocked', value: 'STOCKED' },
  { label: '⚠️ Running Low', value: 'RUNNING_LOW' },
  { label: '❌ Gone (Out of Stock)', value: 'GONE' },
];

const SORTS = [
  { label: 'Featured / Default', value: '' },
  { label: 'Name (A → Z)', value: 'name' },
  { label: 'Quantity (High → Low)', value: 'quantity_desc' },
  { label: 'Quantity (Low → High)', value: 'quantity_asc' },
  { label: 'Most Voted', value: 'votes' },
];

export function InventoryPage() {
  const { isAdmin } = useAuth();
  const queryClient = useQueryClient();

  // Search & Filters
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<Category | ''>('');
  const [status, setStatus] = useState<StockStatus | ''>('');
  const [sort, setSort] = useState('');
  const [page, setPage] = useState(1);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Drawer & Modals state
  const [selectedSnackId, setSelectedSnackId] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [editSnack, setEditSnack] = useState<Snack | null>(null);
  const [deleteSnack, setDeleteSnack] = useState<Snack | null>(null);
  const [restockSnack, setRestockSnack] = useState<Snack | null>(null);

  // List view menu open state
  const [listMenuOpenId, setListMenuOpenId] = useState<string | null>(null);
  const [consumingId, setConsumingId] = useState<string | null>(null);

  const debouncedSearch = useDebounce(search, 300);

  // Fetch KPI Summary
  const { data: summary } = useQuery<DashboardSummary>({
    queryKey: ['summary'],
    queryFn: snacksApi.summary,
    refetchInterval: 30000,
  });

  // Fetch Snacks list (12 per page)
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

  const snacks = data?.snacks || [];
  const pagination = data?.pagination;

  // Selected snack for Drawer (synced with latest fetched data)
  const selectedSnack = useMemo(() => {
    if (!selectedSnackId) return null;
    return snacks.find((s) => s.id === selectedSnackId) || null;
  }, [selectedSnackId, snacks]);

  const invalidateData = () => {
    queryClient.invalidateQueries({ queryKey: ['snacks'] });
    queryClient.invalidateQueries({ queryKey: ['summary'] });
    queryClient.invalidateQueries({ queryKey: ['popular'] });
  };

  // Consume mutation for List view
  const consumeMutation = useMutation({
    mutationFn: (snack: Snack) => {
      setConsumingId(snack.id);
      return snacksApi.consume(snack.id, 1);
    },
    onSuccess: (data) => {
      toast.success(`Enjoyed ${data.name}! 🎉`);
      invalidateData();
    },
    onError: (err: unknown) => {
      if (err instanceof ApiError && err.code === 'INSUFFICIENT_STOCK') {
        toast.error("Someone beat you to the last packet! The pantry has been updated.", {
          duration: 4000,
          icon: '😅',
        });
        invalidateData();
      } else if (err instanceof ApiError) {
        toast.error(err.message);
      } else {
        toast.error('Failed to consume snack.');
      }
    },
    onSettled: () => setConsumingId(null),
  });

  // Vote mutation for List view
  const voteMutation = useMutation({
    mutationFn: (snack: Snack) =>
      snack.userVoted ? snacksApi.unvote(snack.id) : snacksApi.vote(snack.id),
    onSuccess: (data) => {
      toast.success(data.userVoted ? 'Vote added! ❤️' : 'Vote removed');
      invalidateData();
    },
    onError: (err: unknown) => {
      if (err instanceof ApiError) toast.error(err.message);
    },
  });

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    setPage(1);
  }, []);

  const clearFilters = () => {
    setSearch('');
    setCategory('');
    setStatus('');
    setSort('');
    setPage(1);
  };

  const hasFilters = Boolean(search || category || status || sort);
  const totalCount = pagination?.total ?? 0;
  const overallCount = pagination?.overallTotal ?? summary?.totalTypes ?? 40;

  return (
    <div className="space-y-6">
      {/* 4 Compact Inventory KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Total Snacks KPI */}
        <button
          onClick={() => { setStatus(''); setPage(1); }}
          className={`p-4 rounded-2xl border text-left transition-all duration-200 cursor-pointer ${
            status === ''
              ? 'bg-white border-primary shadow-sm ring-2 ring-primary/20'
              : 'bg-white border-border hover:border-primary/40 hover:shadow-sm'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-secondary">
              Total Pantry
            </span>
            <div className="w-8 h-8 rounded-xl bg-soft-yellow flex items-center justify-center text-primary">
              <Boxes size={16} />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-primary-text">
              {summary ? summary.totalTypes : overallCount}
            </span>
            <span className="text-xs text-secondary">snacks</span>
          </div>
          <p className="text-[11px] text-secondary mt-0.5">
            {summary ? `${summary.totalUnits.toLocaleString()} units stocked` : 'All inventory items'}
          </p>
        </button>

        {/* Stocked KPI */}
        <button
          onClick={() => { setStatus('STOCKED'); setPage(1); }}
          className={`p-4 rounded-2xl border text-left transition-all duration-200 cursor-pointer ${
            status === 'STOCKED'
              ? 'bg-green-50/50 border-green-500 shadow-sm ring-2 ring-green-500/20'
              : 'bg-white border-border hover:border-green-300 hover:shadow-sm'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-green-700">
              Stocked
            </span>
            <div className="w-8 h-8 rounded-xl bg-green-100 flex items-center justify-center text-green-600">
              <CheckCircle2 size={16} />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-green-600">
              {summary ? summary.stocked : '—'}
            </span>
            <span className="text-xs text-secondary">healthy</span>
          </div>
          <p className="text-[11px] text-secondary mt-0.5">Above low threshold</p>
        </button>

        {/* Running Low KPI */}
        <button
          onClick={() => { setStatus('RUNNING_LOW'); setPage(1); }}
          className={`p-4 rounded-2xl border text-left transition-all duration-200 cursor-pointer ${
            status === 'RUNNING_LOW'
              ? 'bg-orange-50/50 border-orange-500 shadow-sm ring-2 ring-orange-500/20'
              : 'bg-white border-border hover:border-orange-300 hover:shadow-sm'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-orange-700">
              Running Low
            </span>
            <div className="w-8 h-8 rounded-xl bg-orange-100 flex items-center justify-center text-orange-600">
              <AlertTriangle size={16} />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-orange-500">
              {summary ? summary.runningLow : '—'}
            </span>
            <span className="text-xs text-secondary">alert</span>
          </div>
          <p className="text-[11px] text-secondary mt-0.5">Needs restock soon</p>
        </button>

        {/* Gone KPI */}
        <button
          onClick={() => { setStatus('GONE'); setPage(1); }}
          className={`p-4 rounded-2xl border text-left transition-all duration-200 cursor-pointer ${
            status === 'GONE'
              ? 'bg-red-50/50 border-red-500 shadow-sm ring-2 ring-red-500/20'
              : 'bg-white border-border hover:border-red-300 hover:shadow-sm'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-red-700">
              Gone
            </span>
            <div className="w-8 h-8 rounded-xl bg-red-100 flex items-center justify-center text-red-600">
              <XCircle size={16} />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-red-500">
              {summary ? summary.gone : '—'}
            </span>
            <span className="text-xs text-secondary">empty</span>
          </div>
          <p className="text-[11px] text-secondary mt-0.5">Zero units left</p>
        </button>
      </div>

      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-primary-text tracking-tight">Pantry Inventory</h1>
          <p className="text-secondary text-sm mt-0.5">
            {hasFilters ? (
              <span>
                Showing <strong className="text-primary-text">{totalCount}</strong> matching result{totalCount !== 1 ? 's' : ''}{' '}
                <span className="text-secondary/70">({overallCount} total snacks in pantry)</span>
              </span>
            ) : (
              <span>
                All <strong className="text-primary-text">{overallCount}</strong> snacks cataloged across 4 categories
              </span>
            )}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Grid / List View Toggle */}
          <div className="flex items-center bg-white border border-border rounded-xl p-1 shadow-sm">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                viewMode === 'grid'
                  ? 'bg-soft-yellow text-primary-text shadow-xs'
                  : 'text-secondary hover:text-primary-text'
              }`}
              title="Grid View"
            >
              <LayoutGrid size={15} />
              <span className="hidden md:inline">Grid</span>
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                viewMode === 'list'
                  ? 'bg-soft-yellow text-primary-text shadow-xs'
                  : 'text-secondary hover:text-primary-text'
              }`}
              title="List View"
            >
              <List size={15} />
              <span className="hidden md:inline">List</span>
            </button>
          </div>

          {/* Add Snack button (Admin only) */}
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
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white rounded-2xl border border-border p-3.5 shadow-sm">
        <div className="flex flex-col sm:flex-row gap-2.5">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-secondary" />
            <input
              value={search}
              onChange={handleSearchChange}
              placeholder="Search by snack name (e.g. Doritos, Dairy Milk, Diet Coke)..."
              className="w-full pl-9 pr-8 py-2 rounded-xl border border-border text-sm outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary bg-white transition-all placeholder:text-secondary/60"
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

          {/* Category Filter */}
          <select
            value={category}
            onChange={(e) => { setCategory(e.target.value as Category | ''); setPage(1); }}
            className="px-3 py-2 rounded-xl border border-border text-sm outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary bg-white text-primary-text cursor-pointer"
          >
            {CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={status}
            onChange={(e) => { setStatus(e.target.value as StockStatus | ''); setPage(1); }}
            className="px-3 py-2 rounded-xl border border-border text-sm outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary bg-white text-primary-text cursor-pointer"
          >
            {STATUSES.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>

          {/* Sort Filter */}
          <select
            value={sort}
            onChange={(e) => { setSort(e.target.value); setPage(1); }}
            className="px-3 py-2 rounded-xl border border-border text-sm outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary bg-white text-primary-text cursor-pointer"
          >
            {SORTS.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>

          {/* Clear Filters */}
          {hasFilters && (
            <button
              onClick={clearFilters}
              className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-border text-xs font-semibold text-secondary hover:bg-soft-yellow hover:text-primary-text transition-colors whitespace-nowrap"
            >
              <X size={13} />
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      {isLoading ? (
        viewMode === 'grid' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array.from({ length: 12 }).map((_, i) => <SnackCardSkeleton key={i} />)}
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-border p-4 space-y-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 py-2 border-b border-border last:border-0 animate-pulse">
                <Skeleton className="w-14 h-14 rounded-xl flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-3 w-24" />
                </div>
                <Skeleton className="h-8 w-24 rounded-xl" />
                <Skeleton className="h-8 w-16 rounded-xl" />
              </div>
            ))}
          </div>
        )
      ) : isError ? (
        <div className="bg-white rounded-2xl border border-red-200 p-12 text-center shadow-sm">
          <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center mx-auto mb-3">
            <X size={20} className="text-red-500" />
          </div>
          <h3 className="font-semibold text-primary-text">Failed to load snacks</h3>
          <p className="text-secondary text-sm mt-1">Please check your connection and try again.</p>
          <button
            onClick={() => invalidateData()}
            className="mt-4 px-4 py-2 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary/90 transition-colors inline-flex items-center gap-2"
          >
            <RefreshCw size={14} /> Retry
          </button>
        </div>
      ) : snacks.length === 0 ? (
        <div className="bg-white rounded-2xl border border-border p-16 text-center shadow-sm">
          <div className="w-16 h-16 bg-soft-yellow rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Package size={28} className="text-primary/70" />
          </div>
          <h3 className="font-bold text-primary-text text-lg">No snacks match your search</h3>
          <p className="text-secondary text-sm mt-1 max-w-sm mx-auto">
            {hasFilters
              ? 'Try adjusting your search criteria or resetting the filters.'
              : 'The pantry inventory is currently empty.'}
          </p>
          {hasFilters && (
            <button
              onClick={clearFilters}
              className="mt-4 px-4 py-2 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary/90 transition-colors"
            >
              Clear all filters
            </button>
          )}
        </div>
      ) : viewMode === 'grid' ? (
        /* Standardized 4-Col Desktop, 3-Col Medium, 2-Col Tablet, 1-Col Mobile Grid */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {snacks.map((snack) => (
            <SnackCard
              key={snack.id}
              snack={snack}
              onOpenDetail={(s) => setSelectedSnackId(s.id)}
              onEdit={isAdmin ? setEditSnack : undefined}
              onDelete={isAdmin ? setDeleteSnack : undefined}
              onRestock={isAdmin ? setRestockSnack : undefined}
            />
          ))}
        </div>
      ) : (
        /* High-Density List / Table View */
        <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-warm/70 border-b border-border text-xs uppercase tracking-wider text-secondary">
                <tr>
                  <th className="py-3 px-4 font-semibold">Product</th>
                  <th className="py-3 px-4 font-semibold">Category</th>
                  <th className="py-3 px-4 font-semibold">Status & Stock</th>
                  <th className="py-3 px-4 font-semibold text-center">Threshold</th>
                  <th className="py-3 px-4 font-semibold text-center">Votes</th>
                  <th className="py-3 px-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {snacks.map((snack) => {
                  const isGone = snack.stockStatus === 'GONE';
                  const isRunningLow = snack.stockStatus === 'RUNNING_LOW';
                  const isConsumingThis = consumingId === snack.id;

                  return (
                    <tr
                      key={snack.id}
                      className="hover:bg-warm/30 transition-colors cursor-pointer group"
                      onClick={() => setSelectedSnackId(snack.id)}
                    >
                      {/* Product Thumbnail & Name */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-xl overflow-hidden bg-slate-50 border border-border flex-shrink-0 flex items-center justify-center">
                            <SnackImage snack={snack} className="w-full h-full" size="sm" fit="contain" />
                          </div>
                          <div>
                            <span className="font-bold text-primary-text group-hover:text-primary transition-colors block">
                              {snack.name}
                            </span>
                            <span className="text-xs text-secondary">
                              Updated {new Date(snack.updatedAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="py-3 px-4">
                        <CategoryBadge category={snack.category} size="sm" />
                      </td>

                      {/* Live Stock & Badge */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <span
                            className={`font-bold text-sm ${
                              isGone ? 'text-red-500' : isRunningLow ? 'text-orange-500' : 'text-green-600'
                            }`}
                          >
                            {snack.quantity} units
                          </span>
                          <StockBadge status={snack.stockStatus} size="sm" />
                        </div>
                      </td>

                      {/* Low Stock Alert Threshold */}
                      <td className="py-3 px-4 text-center font-medium text-secondary text-xs">
                        {snack.lowStockThreshold} units
                      </td>

                      {/* Votes */}
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            voteMutation.mutate(snack);
                          }}
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-bold border transition-colors ${
                            snack.userVoted
                              ? 'bg-red-50 text-red-500 border-red-200 hover:bg-red-100'
                              : 'bg-white text-secondary border-border hover:bg-soft-yellow hover:text-primary-text'
                          }`}
                          title={snack.userVoted ? 'Remove vote' : 'Vote for this snack'}
                        >
                          <Heart size={13} className={snack.userVoted ? 'fill-current text-red-500' : ''} />
                          <span>{snack.voteCount}</span>
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="inline-flex items-center gap-2 justify-end">
                          {/* Consume button */}
                          <button
                            onClick={() => consumeMutation.mutate(snack)}
                            disabled={isGone || isConsumingThis}
                            className="py-1.5 px-3 rounded-xl font-bold text-xs bg-primary text-white hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed shadow-xs transition-all flex items-center gap-1"
                          >
                            {isConsumingThis ? (
                              <Loader2 size={12} className="animate-spin" />
                            ) : isGone ? (
                              'Out of Stock'
                            ) : (
                              'Consume'
                            )}
                          </button>

                          {/* Admin Menu */}
                          {isAdmin && (
                            <div className="relative">
                              <button
                                onClick={() => setListMenuOpenId(listMenuOpenId === snack.id ? null : snack.id)}
                                className="p-1.5 rounded-lg border border-border text-secondary hover:text-primary-text hover:bg-soft-yellow transition-colors"
                              >
                                <MoreVertical size={14} />
                              </button>

                              {listMenuOpenId === snack.id && (
                                <>
                                  <div
                                    className="fixed inset-0 z-20"
                                    onClick={() => setListMenuOpenId(null)}
                                  />
                                  <div className="absolute right-0 top-8 z-30 w-36 bg-white rounded-xl shadow-lg border border-border py-1 text-xs font-medium text-left">
                                    <button
                                      onClick={() => {
                                        setListMenuOpenId(null);
                                        setRestockSnack(snack);
                                      }}
                                      className="w-full flex items-center gap-2 px-3 py-2 hover:bg-soft-yellow text-primary-text"
                                    >
                                      <RefreshCw size={13} className="text-green-600" />
                                      Restock
                                    </button>
                                    <button
                                      onClick={() => {
                                        setListMenuOpenId(null);
                                        setEditSnack(snack);
                                      }}
                                      className="w-full flex items-center gap-2 px-3 py-2 hover:bg-soft-yellow text-primary-text"
                                    >
                                      <Edit size={13} className="text-primary" />
                                      Edit Snack
                                    </button>
                                    <button
                                      onClick={() => {
                                        setListMenuOpenId(null);
                                        setDeleteSnack(snack);
                                      }}
                                      className="w-full flex items-center gap-2 px-3 py-2 hover:bg-red-50 text-red-600"
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
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pagination Footer: 12 snacks per page -> 4 pages for 40 snacks */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white rounded-2xl border border-border px-6 py-4 shadow-sm">
          <p className="text-sm text-secondary">
            Showing <strong className="text-primary-text">{((page - 1) * 12) + 1}–{Math.min(page * 12, pagination.total)}</strong> of{' '}
            <strong className="text-primary-text">{pagination.total}</strong> snacks
            {pagination.overallTotal && pagination.overallTotal !== pagination.total && (
              <span className="text-secondary/70"> ({pagination.overallTotal} total pantry items)</span>
            )}
          </p>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setPage(page - 1)}
              disabled={page === 1}
              className="p-2 rounded-xl border border-border text-secondary hover:bg-soft-yellow hover:text-primary-text disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              title="Previous Page"
            >
              <ChevronLeft size={16} />
            </button>

            <div className="flex gap-1">
              {Array.from({ length: pagination.totalPages }, (_, i) => {
                const p = i + 1;
                return (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={`w-9 h-9 rounded-xl text-sm font-semibold transition-all ${
                      p === page
                        ? 'bg-primary text-white shadow-sm'
                        : 'border border-border text-secondary hover:bg-soft-yellow hover:text-primary-text'
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
              className="p-2 rounded-xl border border-border text-secondary hover:bg-soft-yellow hover:text-primary-text disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              title="Next Page"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Snack Detail Slide-over Drawer */}
      <SnackDetailDrawer
        snack={selectedSnack}
        isOpen={Boolean(selectedSnack)}
        onClose={() => setSelectedSnackId(null)}
        onEdit={(s) => {
          setSelectedSnackId(null);
          setEditSnack(s);
        }}
        onRestock={(s) => {
          setSelectedSnackId(null);
          setRestockSnack(s);
        }}
        onDelete={(s) => {
          setSelectedSnackId(null);
          setDeleteSnack(s);
        }}
      />

      {/* Admin Modals */}
      {addOpen && <SnackModal onClose={() => setAddOpen(false)} />}
      {editSnack && <SnackModal snack={editSnack} onClose={() => setEditSnack(null)} />}
      {deleteSnack && <DeleteModal snack={deleteSnack} onClose={() => setDeleteSnack(null)} />}
      {restockSnack && <RestockModal snack={restockSnack} onClose={() => setRestockSnack(null)} />}
    </div>
  );
}
