import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ClipboardList, CheckCircle2, XCircle, Clock, Search, X,
  ShieldCheck, AlertCircle, Loader2, Sparkles, User as UserIcon
} from 'lucide-react';
import { requestsApi, ApiError } from '../services/api';
import type { SnackRequest, RequestStatus, Category } from '../types';
import { CategoryBadge } from '../components/Badges';
import { formatRelativeTime, getUserInitials } from '../utils';
import { useDebounce } from '../hooks/useDebounce';
import toast from 'react-hot-toast';

const STATUS_FILTERS: Array<{ label: string; value: RequestStatus | '' }> = [
  { label: 'All Requests', value: '' },
  { label: 'Pending Review', value: 'PENDING' },
  { label: 'Approved', value: 'APPROVED' },
  { label: 'Declined', value: 'DECLINED' },
];

export function AdminRequestsPage() {
  const [statusFilter, setStatusFilter] = useState<RequestStatus | ''>('PENDING');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const [approvingRequest, setApprovingRequest] = useState<SnackRequest | null>(null);
  const [decliningRequest, setDecliningRequest] = useState<SnackRequest | null>(null);

  const debouncedSearch = useDebounce(search, 300);
  const queryClient = useQueryClient();

  const { data, isLoading, isError } = useQuery({
    queryKey: ['admin-requests', { status: statusFilter, search: debouncedSearch, page }],
    queryFn: () =>
      requestsApi.all({
        status: statusFilter || undefined,
        search: debouncedSearch || undefined,
        page,
        limit: 15,
      }),
    refetchInterval: 4000,
  });

  const requests = data?.requests ?? [];
  const pendingCount = data?.counts?.pending ?? 0;
  const pagination = data?.pagination;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-primary-text tracking-tight flex items-center gap-2">
            <ClipboardList size={22} className="text-primary" />
            Snack Requests Management
          </h1>
          <p className="text-secondary text-sm mt-0.5">
            Review employee proposals, stock newly approved items, or provide constructive feedback.
          </p>
        </div>

        {pendingCount > 0 && (
          <div className="bg-orange-50 border border-orange-200 rounded-2xl px-4 py-2.5 flex items-center gap-2.5 self-start sm:self-auto shadow-xs">
            <Clock size={16} className="text-orange-600 animate-pulse" />
            <span className="text-xs font-bold text-orange-800">
              {pendingCount} request{pendingCount !== 1 ? 's' : ''} awaiting review
            </span>
          </div>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl border border-border p-3.5 shadow-xs flex flex-col md:flex-row gap-3">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-secondary" />
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search by snack name or requester name..."
            className="w-full pl-9 pr-8 py-2 rounded-xl border border-border text-sm outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all bg-white"
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

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          {STATUS_FILTERS.map((f) => {
            const isActive = statusFilter === f.value;
            return (
              <button
                key={f.value}
                onClick={() => { setStatusFilter(f.value); setPage(1); }}
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
                  isActive
                    ? 'bg-primary text-white shadow-xs'
                    : 'bg-slate-50 border border-border text-secondary hover:bg-soft-yellow hover:text-primary-text'
                }`}
              >
                {f.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Requests Table / Cards */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-border p-5 space-y-2 animate-pulse">
              <div className="h-4 w-40 bg-gray-200 rounded" />
              <div className="h-3 w-64 bg-gray-200 rounded" />
            </div>
          ))}
        </div>
      ) : isError ? (
        <div className="bg-white rounded-2xl border border-red-200 p-10 text-center">
          <AlertCircle size={32} className="mx-auto text-red-500 mb-2" />
          <h3 className="font-bold text-primary-text">Failed to load snack requests</h3>
          <p className="text-secondary text-sm mt-1">Please try refreshing the page.</p>
        </div>
      ) : requests.length === 0 ? (
        <div className="bg-white rounded-2xl border border-border p-14 text-center">
          <ClipboardList size={32} className="mx-auto text-gray-300 mb-2" />
          <h3 className="font-bold text-primary-text text-lg">No requests found</h3>
          <p className="text-secondary text-sm mt-1">
            {statusFilter
              ? `No requests currently marked as "${statusFilter.toLowerCase()}".`
              : 'No snack requests have been submitted by members yet.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {requests.map((request) => (
            <AdminRequestCard
              key={request.id}
              request={request}
              onApprove={() => setApprovingRequest(request)}
              onDecline={() => setDecliningRequest(request)}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between bg-white rounded-2xl border border-border px-6 py-3.5 shadow-xs">
          <p className="text-xs text-secondary font-medium">
            Page {pagination.page} of {pagination.totalPages} ({pagination.total} total requests)
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1.5 rounded-xl border border-border text-xs font-semibold text-secondary disabled:opacity-40 hover:bg-soft-yellow transition-colors"
            >
              Previous
            </button>
            <button
              onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
              disabled={page === pagination.totalPages}
              className="px-3 py-1.5 rounded-xl border border-border text-xs font-semibold text-secondary disabled:opacity-40 hover:bg-soft-yellow transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Approve Modal */}
      {approvingRequest && (
        <ApproveModal
          request={approvingRequest}
          onClose={() => setApprovingRequest(null)}
          onSuccess={() => {
            setApprovingRequest(null);
            queryClient.invalidateQueries({ queryKey: ['admin-requests'] });
            queryClient.invalidateQueries({ queryKey: ['admin-requests-count'] });
            queryClient.invalidateQueries({ queryKey: ['my-requests'] });
            queryClient.invalidateQueries({ queryKey: ['snacks'] });
            queryClient.invalidateQueries({ queryKey: ['summary'] });
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
          }}
        />
      )}

      {/* Decline Modal */}
      {decliningRequest && (
        <DeclineModal
          request={decliningRequest}
          onClose={() => setDecliningRequest(null)}
          onSuccess={() => {
            setDecliningRequest(null);
            queryClient.invalidateQueries({ queryKey: ['admin-requests'] });
            queryClient.invalidateQueries({ queryKey: ['admin-requests-count'] });
            queryClient.invalidateQueries({ queryKey: ['my-requests'] });
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
          }}
        />
      )}
    </div>
  );
}

function AdminRequestCard({
  request,
  onApprove,
  onDecline,
}: {
  request: SnackRequest;
  onApprove: () => void;
  onDecline: () => void;
}) {
  const isPending = request.status === 'PENDING';
  const isApproved = request.status === 'APPROVED';
  const isDeclined = request.status === 'DECLINED';

  return (
    <div className="bg-white rounded-2xl border border-border p-5 shadow-xs hover:border-primary/40 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4">
      {/* Left Info Column */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1.5 flex-wrap">
          <CategoryBadge category={request.category} size="sm" />
          {isPending && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-orange-50 text-orange-600 border border-orange-200">
              <Clock size={11} /> Pending
            </span>
          )}
          {isApproved && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-green-50 text-green-700 border border-green-200">
              <CheckCircle2 size={11} /> Approved
            </span>
          )}
          {isDeclined && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-50 text-red-600 border border-red-200">
              <XCircle size={11} /> Declined
            </span>
          )}
        </div>

        <h3 className="font-bold text-primary-text text-base tracking-tight">
          {request.snackName}
        </h3>

        {/* Requester Information */}
        <div className="flex items-center gap-2 mt-2 text-xs text-secondary">
          <div className="w-5 h-5 rounded-full bg-soft-yellow text-primary flex items-center justify-center font-bold text-[10px]">
            {getUserInitials(request.user.name)}
          </div>
          <span className="font-semibold text-primary-text">{request.user.name}</span>
          <span>·</span>
          <span>{request.user.email}</span>
          <span>·</span>
          <span>{formatRelativeTime(request.createdAt)}</span>
        </div>

        {/* Reason */}
        {request.reason && (
          <p className="text-xs text-secondary mt-2 bg-slate-50 p-2.5 rounded-xl border border-border/50 max-w-xl">
            <span className="font-semibold text-primary-text">Member Note: </span>
            {request.reason}
          </p>
        )}

        {/* Admin Review Note */}
        {isDeclined && request.adminResponse && (
          <div className="mt-2.5 p-2.5 bg-red-50/80 border border-red-200 rounded-xl text-xs text-red-700 max-w-xl">
            <span className="font-bold">Decline Reason: </span>
            {request.adminResponse}
            {request.admin && (
              <span className="block text-[11px] text-red-500 mt-0.5">
                Reviewed by {request.admin.name} · {formatRelativeTime(request.reviewedAt!)}
              </span>
            )}
          </div>
        )}

        {isApproved && request.admin && (
          <p className="text-[11px] text-green-700 font-semibold mt-2 flex items-center gap-1">
            <ShieldCheck size={13} />
            Approved by {request.admin.name} · {formatRelativeTime(request.reviewedAt!)}
          </p>
        )}
      </div>

      {/* Action Buttons for Pending */}
      {isPending && (
        <div className="flex items-center gap-2 pt-3 md:pt-0 border-t md:border-t-0 border-border">
          <button
            onClick={onDecline}
            className="px-3.5 py-2 rounded-xl text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 transition-colors flex items-center gap-1"
          >
            <XCircle size={13} />
            Decline
          </button>
          <button
            onClick={onApprove}
            className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-green-600 hover:bg-green-700 shadow-xs transition-colors flex items-center gap-1"
          >
            <CheckCircle2 size={13} />
            Approve & Stock
          </button>
        </div>
      )}
    </div>
  );
}

function ApproveModal({
  request,
  onClose,
  onSuccess,
}: {
  request: SnackRequest;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [quantity, setQuantity] = useState(15);
  const [threshold, setThreshold] = useState(5);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const approveMutation = useMutation({
    mutationFn: () =>
      requestsApi.approve(request.id, {
        quantity: Number(quantity),
        lowStockThreshold: Number(threshold),
      }),
    onSuccess: (data) => {
      toast.success(data.message);
      onSuccess();
    },
    onError: (err: unknown) => {
      if (err instanceof ApiError) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage('Failed to approve request. Please try again.');
      }
    },
  });

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity" onClick={onClose} />
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-border p-6 overflow-hidden animate-in fade-in zoom-in-95">
          <div className="flex items-center justify-between pb-3 border-b border-border">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-green-100 text-green-700 flex items-center justify-center">
                <CheckCircle2 size={18} />
              </div>
              <h2 className="text-base font-bold text-primary-text">Approve Snack Request</h2>
            </div>
            <button onClick={onClose} className="p-1 text-secondary hover:text-primary-text">
              <X size={16} />
            </button>
          </div>

          <div className="py-4 space-y-4">
            {errorMessage && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-start gap-2">
                <AlertCircle size={15} className="flex-shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            <div className="p-3 bg-warm/60 border border-border rounded-xl">
              <p className="text-xs text-secondary font-medium">Requested Snack</p>
              <p className="text-base font-extrabold text-primary-text mt-0.5">{request.snackName}</p>
              <div className="mt-1">
                <CategoryBadge category={request.category} size="sm" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-primary-text mb-1 uppercase tracking-wider">
                Initial Stock Quantity *
              </label>
              <input
                type="number"
                min={0}
                value={quantity}
                onChange={(e) => setQuantity(Math.max(0, parseInt(e.target.value, 10) || 0))}
                className="w-full px-3.5 py-2 rounded-xl border border-border text-sm outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              />
              <p className="text-[11px] text-secondary mt-1">
                Units physically placed into the office pantry upon approval.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-primary-text mb-1 uppercase tracking-wider">
                Low-Stock Alert Threshold *
              </label>
              <input
                type="number"
                min={1}
                value={threshold}
                onChange={(e) => setThreshold(Math.max(1, parseInt(e.target.value, 10) || 1))}
                className="w-full px-3.5 py-2 rounded-xl border border-border text-sm outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              />
              <p className="text-[11px] text-secondary mt-1">
                Triggers a 'Running Low' inventory warning when stock drops to or below this count.
              </p>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-secondary hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              onClick={() => approveMutation.mutate()}
              disabled={approveMutation.isPending}
              className="px-5 py-2 rounded-xl text-xs font-bold bg-green-600 text-white hover:bg-green-700 shadow-sm flex items-center gap-1.5 transition-colors"
            >
              {approveMutation.isPending ? (
                <>
                  <Loader2 size={13} className="animate-spin" />
                  Approving...
                </>
              ) : (
                'Confirm & Add to Pantry'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function DeclineModal({
  request,
  onClose,
  onSuccess,
}: {
  request: SnackRequest;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [reason, setReason] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const declineMutation = useMutation({
    mutationFn: () => requestsApi.decline(request.id, { reason }),
    onSuccess: (data) => {
      toast.success(data.message);
      onSuccess();
    },
    onError: (err: unknown) => {
      if (err instanceof ApiError) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage('Failed to decline request.');
      }
    },
  });

  const handleDecline = () => {
    setErrorMessage(null);
    if (!reason.trim()) {
      setErrorMessage('A non-empty decline reason is mandatory.');
      return;
    }
    declineMutation.mutate();
  };

  const QUICK_REASONS = [
    'Not included in the current pantry budget.',
    'A similar or identical snack is already stocked.',
    'Requires dedicated refrigeration which is currently full.',
    'High perishable rate / short shelf-life item.',
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity" onClick={onClose} />
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-border p-6 overflow-hidden animate-in fade-in zoom-in-95">
          <div className="flex items-center justify-between pb-3 border-b border-border">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-red-100 text-red-600 flex items-center justify-center">
                <XCircle size={18} />
              </div>
              <h2 className="text-base font-bold text-primary-text">Decline Snack Request</h2>
            </div>
            <button onClick={onClose} className="p-1 text-secondary hover:text-primary-text">
              <X size={16} />
            </button>
          </div>

          <div className="py-4 space-y-3">
            {errorMessage && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-start gap-2">
                <AlertCircle size={15} className="flex-shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            <div className="p-3 bg-warm/60 border border-border rounded-xl">
              <p className="text-xs text-secondary font-medium">Declining Request For</p>
              <p className="text-sm font-extrabold text-primary-text mt-0.5">{request.snackName}</p>
              <p className="text-xs text-secondary mt-0.5">Submitted by {request.user.name}</p>
            </div>

            <div>
              <label className="block text-xs font-bold text-primary-text mb-1 uppercase tracking-wider">
                Reason for Declining *
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
                placeholder="Explain why this snack cannot be approved..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-border text-xs outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary resize-none"
              />
              <p className="text-[11px] text-secondary mt-1">
                This exact explanation will be sent to {request.user.name} via notification.
              </p>
            </div>

            {/* Quick Reason Chips */}
            <div>
              <p className="text-[11px] font-bold text-secondary uppercase tracking-wider mb-1.5">
                Quick Preset Reasons:
              </p>
              <div className="flex flex-wrap gap-1.5">
                {QUICK_REASONS.map((r, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setReason(r)}
                    className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-50 border border-border text-secondary hover:bg-soft-yellow hover:text-primary-text transition-colors text-left"
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-secondary hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              onClick={handleDecline}
              disabled={declineMutation.isPending || !reason.trim()}
              className="px-5 py-2 rounded-xl text-xs font-bold bg-red-600 text-white hover:bg-red-700 shadow-sm flex items-center gap-1.5 transition-colors disabled:opacity-50"
            >
              {declineMutation.isPending ? (
                <>
                  <Loader2 size={13} className="animate-spin" />
                  Declining...
                </>
              ) : (
                'Confirm Decline'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
