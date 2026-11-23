import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Plus, Clock, CheckCircle2, XCircle, Send, X,
  AlertCircle, Sparkles, MessageSquare, ShieldCheck, Loader2
} from 'lucide-react';
import { requestsApi, ApiError } from '../services/api';
import type { SnackRequest, Category, RequestStatus } from '../types';
import { CategoryBadge } from '../components/Badges';
import { formatRelativeTime } from '../utils';
import toast from 'react-hot-toast';

const STATUS_FILTERS: Array<{ label: string; value: RequestStatus | '' }> = [
  { label: 'All Requests', value: '' },
  { label: 'Pending', value: 'PENDING' },
  { label: 'Approved', value: 'APPROVED' },
  { label: 'Declined', value: 'DECLINED' },
];

const CATEGORY_OPTIONS: Array<{ label: string; value: Category; emoji: string }> = [
  { label: 'Sweet', value: 'SWEET', emoji: '🍬' },
  { label: 'Savoury', value: 'SAVOURY', emoji: '🥨' },
  { label: 'Drink', value: 'DRINK', emoji: '🥤' },
  { label: 'Healthy-ish', value: 'HEALTHY_ISH', emoji: '🥗' },
];

export function MyRequestsPage() {
  const [statusFilter, setStatusFilter] = useState<RequestStatus | ''>('');
  const [modalOpen, setModalOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data, isLoading, isError } = useQuery({
    queryKey: ['my-requests', statusFilter],
    queryFn: () => requestsApi.my({ status: statusFilter || undefined, limit: 50 }),
  });

  const requests = data?.requests ?? [];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-primary-text tracking-tight flex items-center gap-2">
            <Send size={22} className="text-primary" />
            My Snack Requests
          </h1>
          <p className="text-secondary text-sm mt-0.5">
            Suggest your favourite snacks for the office pantry and track administrative approvals.
          </p>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-2 bg-primary text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-primary/90 transition-colors shadow-sm self-start sm:self-auto"
        >
          <Plus size={16} />
          Request a Snack
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {STATUS_FILTERS.map((f) => {
          const isActive = statusFilter === f.value;
          return (
            <button
              key={f.value}
              onClick={() => setStatusFilter(f.value)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
                isActive
                  ? 'bg-primary text-white shadow-sm'
                  : 'bg-white border border-border text-secondary hover:bg-soft-yellow hover:text-primary-text'
              }`}
            >
              {f.label}
            </button>
          );
        })}
      </div>

      {/* Requests List */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-border p-5 space-y-3 animate-pulse">
              <div className="h-4 w-48 bg-gray-200 rounded" />
              <div className="h-3 w-72 bg-gray-200 rounded" />
            </div>
          ))}
        </div>
      ) : isError ? (
        <div className="bg-white rounded-2xl border border-red-200 p-10 text-center">
          <AlertCircle size={32} className="mx-auto text-red-500 mb-2" />
          <h3 className="font-bold text-primary-text">Failed to load requests</h3>
          <p className="text-secondary text-sm mt-1">Please try refreshing the page.</p>
        </div>
      ) : requests.length === 0 ? (
        <div className="bg-white rounded-2xl border border-border p-14 text-center">
          <div className="w-16 h-16 rounded-2xl bg-soft-yellow flex items-center justify-center mx-auto mb-3 text-primary">
            <Send size={26} />
          </div>
          <h3 className="font-bold text-primary-text text-lg">No requests found</h3>
          <p className="text-secondary text-sm mt-1 max-w-md mx-auto">
            {statusFilter
              ? `You don't have any requests with status "${statusFilter.toLowerCase()}".`
              : 'Have a snack you love that is missing from the pantry? Submit a request and our managers will review it!'}
          </p>
          <button
            onClick={() => setModalOpen(true)}
            className="mt-4 px-4 py-2 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary/90 transition-colors inline-flex items-center gap-2"
          >
            <Plus size={16} /> Submit Your First Request
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {requests.map((req) => (
            <RequestCard key={req.id} request={req} />
          ))}
        </div>
      )}

      {/* Submission Modal */}
      {modalOpen && <SubmitRequestModal onClose={() => setModalOpen(false)} />}
    </div>
  );
}

function RequestCard({ request }: { request: SnackRequest }) {
  const isPending = request.status === 'PENDING';
  const isApproved = request.status === 'APPROVED';
  const isDeclined = request.status === 'DECLINED';

  return (
    <div className="bg-white rounded-2xl border border-border p-5 flex flex-col justify-between shadow-xs hover:border-primary/40 transition-all">
      <div>
        {/* Top Badges */}
        <div className="flex items-center justify-between gap-2 mb-2">
          <CategoryBadge category={request.category} size="sm" />

          {/* Status Badge */}
          {isPending && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-orange-50 text-orange-600 border border-orange-200">
              <Clock size={12} /> Pending Review
            </span>
          )}
          {isApproved && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-green-50 text-green-700 border border-green-200">
              <CheckCircle2 size={12} /> Approved & Added
            </span>
          )}
          {isDeclined && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-red-50 text-red-600 border border-red-200">
              <XCircle size={12} /> Declined
            </span>
          )}
        </div>

        {/* Snack Name */}
        <h3 className="font-bold text-primary-text text-lg leading-snug">
          {request.snackName}
        </h3>

        {/* Requester Explanation */}
        {request.reason ? (
          <p className="text-xs text-secondary mt-1.5 leading-relaxed bg-slate-50 p-2.5 rounded-xl border border-border/60">
            <span className="font-semibold text-primary-text">Your note: </span>
            {request.reason}
          </p>
        ) : (
          <p className="text-xs text-secondary/60 mt-1 italic">No explanation provided.</p>
        )}

        {/* Admin Review Feedback */}
        {isDeclined && request.adminResponse && (
          <div className="mt-3 p-3 bg-red-50/70 border border-red-200 rounded-xl text-xs text-red-800">
            <div className="flex items-center gap-1.5 font-bold mb-1">
              <MessageSquare size={13} className="text-red-600" />
              <span>Admin Feedback:</span>
            </div>
            <p className="leading-relaxed">{request.adminResponse}</p>
          </div>
        )}

        {isApproved && (
          <div className="mt-3 p-2.5 bg-green-50/70 border border-green-200 rounded-xl text-xs text-green-800 flex items-center gap-2">
            <Sparkles size={14} className="text-green-600 flex-shrink-0" />
            <span>This item has been approved and stocked in the pantry!</span>
          </div>
        )}
      </div>

      {/* Footer Timestamps */}
      <div className="mt-4 pt-3 border-t border-border flex items-center justify-between text-[11px] text-secondary">
        <span>Submitted {formatRelativeTime(request.createdAt)}</span>
        {request.reviewedAt && (
          <span className="flex items-center gap-1">
            <ShieldCheck size={12} className="text-secondary" />
            Reviewed {formatRelativeTime(request.reviewedAt)}
          </span>
        )}
      </div>
    </div>
  );
}

function SubmitRequestModal({ onClose }: { onClose: () => void }) {
  const [snackName, setSnackName] = useState('');
  const [category, setCategory] = useState<Category>('SWEET');
  const [reason, setReason] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const queryClient = useQueryClient();

  const submitMutation = useMutation({
    mutationFn: () => requestsApi.create({ snackName, category, reason: reason || undefined }),
    onSuccess: (data) => {
      toast.success(`Request for "${data.snackName}" submitted successfully! 🚀`);
      queryClient.invalidateQueries({ queryKey: ['my-requests'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      onClose();
    },
    onError: (err: unknown) => {
      if (err instanceof ApiError) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage('Failed to submit snack request. Please try again.');
      }
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    if (!snackName.trim()) {
      setErrorMessage('Please enter a snack name.');
      return;
    }
    submitMutation.mutate();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity" onClick={onClose} />

      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-border p-6 overflow-hidden animate-in fade-in zoom-in-95">
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-border">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-soft-yellow text-primary flex items-center justify-center font-bold">
                <Send size={18} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-primary-text">Request a Snack</h2>
                <p className="text-xs text-secondary">Submit an item for the pantry team to review</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 text-secondary hover:text-primary-text rounded-xl hover:bg-soft-yellow transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4 pt-4">
            {errorMessage && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-start gap-2">
                <AlertCircle size={15} className="flex-shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Snack Name */}
            <div>
              <label className="block text-xs font-bold text-primary-text mb-1.5 uppercase tracking-wider">
                Snack Name *
              </label>
              <input
                value={snackName}
                onChange={(e) => setSnackName(e.target.value)}
                placeholder="e.g. Pringles Sour Cream, Red Bull Sugarfree, M&Ms..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-border text-sm outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all bg-white"
                autoFocus
              />
            </div>

            {/* Category selection */}
            <div>
              <label className="block text-xs font-bold text-primary-text mb-1.5 uppercase tracking-wider">
                Category *
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {CATEGORY_OPTIONS.map((c) => (
                  <button
                    type="button"
                    key={c.value}
                    onClick={() => setCategory(c.value)}
                    className={`py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                      category === c.value
                        ? 'bg-soft-yellow border-primary text-primary-text shadow-xs ring-1 ring-primary'
                        : 'border-border bg-white text-secondary hover:bg-slate-50'
                    }`}
                  >
                    <span>{c.emoji}</span>
                    <span>{c.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Optional Reason */}
            <div>
              <label className="block text-xs font-bold text-primary-text mb-1.5 uppercase tracking-wider">
                Why would you like this snack? (Optional)
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
                placeholder="e.g. Popular request among the design team, healthy afternoon protein boost..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-border text-sm outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all bg-white resize-none"
              />
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl text-sm font-semibold text-secondary hover:bg-slate-100 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitMutation.isPending || !snackName.trim()}
                className="px-5 py-2.5 rounded-xl text-sm font-semibold bg-primary text-white hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm flex items-center gap-2"
              >
                {submitMutation.isPending ? (
                  <>
                    <Loader2 size={15} className="animate-spin" />
                    Submitting...
                  </>
                ) : (
                  'Submit Request'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
