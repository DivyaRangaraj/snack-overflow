import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Activity as ActivityIcon, ArrowDownCircle, ArrowUpCircle, Filter } from 'lucide-react';
import { snacksApi } from '../services/api';
import { formatRelativeTime } from '../utils';
import { TableSkeleton } from '../components/Skeletons';

export function ActivityPage() {
  const [actionFilter, setActionFilter] = useState<string>('');
  const [page, setPage] = useState(1);
  const limit = 20;

  const { data, isLoading } = useQuery({
    queryKey: ['admin-activity', page, actionFilter],
    queryFn: () =>
      snacksApi.activity({
        page,
        limit,
        action: actionFilter || undefined,
      }),
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-primary-text flex items-center gap-2.5">
            <ActivityIcon className="text-primary" size={28} />
            Pantry Activity Log
          </h1>
          <p className="text-sm text-secondary mt-0.5">
            Audit trail of snack consumptions and restock events
          </p>
        </div>

        {/* Filter controls */}
        <div className="flex items-center gap-2">
          <Filter size={16} className="text-secondary" />
          <select
            value={actionFilter}
            onChange={(e) => {
              setActionFilter(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 bg-white rounded-xl border border-border text-sm text-primary-text outline-none focus:ring-2 focus:ring-primary/30"
          >
            <option value="">All Actions</option>
            <option value="CONSUMED">Consumptions Only</option>
            <option value="RESTOCKED">Restocks Only</option>
          </select>
        </div>
      </div>

      {/* Table Container */}
      <div className="bg-white rounded-2xl border border-border shadow-card overflow-hidden">
        {isLoading ? (
          <div className="p-6">
            <TableSkeleton rows={8} />
          </div>
        ) : !data?.activities || data.activities.length === 0 ? (
          <div className="text-center py-16">
            <ActivityIcon size={40} className="mx-auto text-secondary/40 mb-3" />
            <p className="text-primary-text font-medium">No activity recorded yet</p>
            <p className="text-secondary text-sm mt-1">
              Events will appear here when users consume or restock snacks.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-warm/60 border-b border-border text-secondary font-medium">
                <tr>
                  <th className="py-3.5 px-6">Timestamp</th>
                  <th className="py-3.5 px-6">Action</th>
                  <th className="py-3.5 px-6">Snack</th>
                  <th className="py-3.5 px-6">Quantity</th>
                  <th className="py-3.5 px-6">User</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {data.activities.map((item) => {
                  const isConsumed = item.action === 'CONSUMED';
                  return (
                    <tr key={item.id} className="hover:bg-warm/30 transition-colors">
                      <td className="py-4 px-6 text-secondary whitespace-nowrap">
                        {formatRelativeTime(item.createdAt)}
                      </td>
                      <td className="py-4 px-6">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                            isConsumed
                              ? 'bg-orange-50 text-orange-700 border border-orange-200'
                              : 'bg-green-50 text-green-700 border border-green-200'
                          }`}
                        >
                          {isConsumed ? (
                            <ArrowDownCircle size={14} />
                          ) : (
                            <ArrowUpCircle size={14} />
                          )}
                          {isConsumed ? 'Consumed' : 'Restocked'}
                        </span>
                      </td>
                      <td className="py-4 px-6 font-medium text-primary-text">
                        {item.snack.name}
                      </td>
                      <td className="py-4 px-6">
                        <span
                          className={`font-semibold ${
                            isConsumed ? 'text-stock-orange' : 'text-stock-green'
                          }`}
                        >
                          {isConsumed ? `-${item.amount}` : `+${item.amount}`}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-secondary">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-full bg-soft-yellow border border-primary/30 flex items-center justify-center text-xs font-bold text-primary-text">
                            {item.user.name.charAt(0)}
                          </span>
                          <span>{item.user.name}</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {data && data.pagination && data.pagination.totalPages > 1 && (
          <div className="px-6 py-4 border-t border-border flex items-center justify-between text-sm">
            <span className="text-secondary">
              Page {data.pagination.page} of {data.pagination.totalPages} ({data.pagination.total} events)
            </span>
            <div className="flex gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="px-3 py-1.5 rounded-lg border border-border disabled:opacity-40 hover:bg-soft-yellow"
              >
                Previous
              </button>
              <button
                disabled={page >= data.pagination.totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="px-3 py-1.5 rounded-lg border border-border disabled:opacity-40 hover:bg-soft-yellow"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
