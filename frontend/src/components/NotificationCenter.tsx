import { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Bell, CheckCircle2, XCircle, Inbox, Check, CheckCheck, Loader2
} from 'lucide-react';
import { notificationsApi } from '../services/api';
import type { Notification } from '../types';
import { formatRelativeTime } from '../utils';
import toast from 'react-hot-toast';

export function NotificationCenter() {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  // Poll for notifications every 3 seconds for fast real-time updates
  const { data, isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => notificationsApi.list({ limit: 15 }),
    refetchInterval: 3000,
  });

  const unreadCount = data?.unreadCount ?? 0;
  const notifications = data?.notifications ?? [];

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const markReadMutation = useMutation({
    mutationFn: (id: string) => notificationsApi.markAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const markAllMutation = useMutation({
    mutationFn: () => notificationsApi.markAllAsRead(),
    onSuccess: () => {
      toast.success('All notifications marked as read');
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const getNotificationIcon = (notif: Notification) => {
    switch (notif.type) {
      case 'REQUEST_APPROVED':
        return <CheckCircle2 size={16} className="text-green-600 flex-shrink-0" />;
      case 'REQUEST_DECLINED':
        return <XCircle size={16} className="text-red-500 flex-shrink-0" />;
      case 'REQUEST_SUBMITTED':
      default:
        return <Inbox size={16} className="text-primary flex-shrink-0" />;
    }
  };

  return (
    <div className="relative" ref={containerRef}>
      {/* Bell Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2.5 rounded-xl border border-border bg-white text-secondary hover:text-primary-text hover:bg-soft-yellow transition-colors shadow-xs"
        title="Notifications"
        aria-label="Open notifications"
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center border-2 border-white shadow-xs animate-in zoom-in-50">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div className="absolute right-0 top-12 z-50 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-border overflow-hidden animate-in fade-in zoom-in-95">
          {/* Header */}
          <div className="px-4 py-3 border-b border-border bg-warm/50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-primary-text">Notifications</span>
              {unreadCount > 0 && (
                <span className="bg-primary/20 text-primary-text text-[11px] font-bold px-2 py-0.5 rounded-full">
                  {unreadCount} unread
                </span>
              )}
            </div>

            {unreadCount > 0 && (
              <button
                onClick={() => markAllMutation.mutate()}
                disabled={markAllMutation.isPending}
                className="text-xs font-semibold text-secondary hover:text-primary flex items-center gap-1 transition-colors"
                title="Mark all as read"
              >
                {markAllMutation.isPending ? (
                  <Loader2 size={12} className="animate-spin" />
                ) : (
                  <CheckCheck size={14} />
                )}
                <span>Mark all read</span>
              </button>
            )}
          </div>

          {/* Body */}
          <div className="max-h-96 overflow-y-auto divide-y divide-border">
            {isLoading ? (
              <div className="py-8 text-center">
                <Loader2 size={20} className="animate-spin mx-auto text-primary" />
                <p className="text-xs text-secondary mt-2">Loading updates...</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="py-10 text-center px-4">
                <Bell size={28} className="mx-auto text-gray-300 mb-2" />
                <p className="text-sm font-bold text-primary-text">No notifications yet</p>
                <p className="text-xs text-secondary mt-0.5">
                  You'll be notified here when your snack requests are reviewed.
                </p>
              </div>
            ) : (
              notifications.map((notif) => {
                const isUnread = !notif.isRead;
                return (
                  <div
                    key={notif.id}
                    onClick={() => {
                      if (isUnread) markReadMutation.mutate(notif.id);
                    }}
                    className={`p-3.5 flex gap-3 transition-colors cursor-pointer ${
                      isUnread
                        ? 'bg-amber-50/40 hover:bg-amber-50/70'
                        : 'bg-white hover:bg-slate-50/80'
                    }`}
                  >
                    <div className="pt-0.5">{getNotificationIcon(notif)}</div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline justify-between gap-2">
                        <p className={`text-xs font-bold truncate ${isUnread ? 'text-primary-text' : 'text-secondary'}`}>
                          {notif.title}
                        </p>
                        <span className="text-[10px] text-secondary flex-shrink-0">
                          {formatRelativeTime(notif.createdAt)}
                        </span>
                      </div>
                      <p className="text-xs text-secondary mt-1 leading-relaxed">
                        {notif.message}
                      </p>
                    </div>

                    {isUnread && (
                      <div className="flex items-center">
                        <span
                          className="w-2 h-2 rounded-full bg-primary"
                          title="Unread notification"
                        />
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
