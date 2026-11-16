'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useApp } from '@/context/AppContext';
import Button from '@/components/ui/Button';
import EmptyState from '@/components/ui/EmptyState';
import {
  Bell,
  CheckCheck,
  Trash2,
  RefreshCw,
  Briefcase,
  AlertTriangle,
  Radio,
  Clock,
  ShieldCheck,
  CheckCircle2,
  ExternalLink,
  Eye,
  EyeOff,
} from 'lucide-react';
import { cn } from '@/lib/cn';

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  relatedEntityId?: string | null;
  createdAt: string;
}

interface NotificationCenterProps {
  role: 'WORKER' | 'BUSINESS_OWNER' | 'ADMIN';
}

export function NotificationCenter({ role }: NotificationCenterProps) {
  const { user, language, t } = useApp();
  const isHi = language === 'hi';

  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<'all' | 'unread' | 'jobs' | 'shop' | 'system'>('all');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  // Reference time for relative timestamps, captured when data is fetched so
  // rendering stays pure (no Date.now() during render).
  const [fetchedAt, setFetchedAt] = useState<number>(0);

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch(`/api/notifications?filter=${activeFilter}`);
      const data = await res.json();
      if (data.notifications) {
        setFetchedAt(Date.now());
        setNotifications(data.notifications);
        if (data.unreadCount !== undefined) setUnreadCount(data.unreadCount);
      }
    } catch (err) {
      console.error('Error fetching notifications:', err);
    } finally {
      setLoading(false);
    }
  }, [activeFilter]);

  // Initial fetch and auto-refresh polling every 12 seconds
  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 12000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  const markAllAsRead = async () => {
    setActionLoading('markAll');
    try {
      await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markAllRead: true }),
      });
      await fetchNotifications();
    } finally {
      setActionLoading(null);
    }
  };

  const toggleReadStatus = async (id: string, currentStatus: boolean) => {
    setActionLoading(id);
    try {
      await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationId: id, isRead: !currentStatus }),
      });
      await fetchNotifications();
    } finally {
      setActionLoading(null);
    }
  };

  const deleteNotification = async (id: string) => {
    setActionLoading(`del-${id}`);
    try {
      await fetch(`/api/notifications?id=${id}`, {
        method: 'DELETE',
      });
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      if (unreadCount > 0) setUnreadCount((prev) => Math.max(0, prev - 1));
    } finally {
      setActionLoading(null);
    }
  };

  const clearReadNotifications = async () => {
    if (!confirm(isHi ? 'क्या आप सभी पढ़े गए नोटिफिकेशन हटाना चाहते हैं?' : 'Clear all read notifications?')) {
      return;
    }
    setActionLoading('clearRead');
    try {
      await fetch('/api/notifications?clearRead=true', {
        method: 'DELETE',
      });
      await fetchNotifications();
    } finally {
      setActionLoading(null);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'APPLICATION_ACCEPTED':
        return <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />;
      case 'JOB_APPLICATION':
      case 'APPLICATION_STATUS_UPDATE':
      case 'JOB_MATCH':
        return <Briefcase className="h-5 w-5 text-brand-600 dark:text-brand-400" />;
      case 'INVENTORY_LOW':
        return <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" />;
      case 'BROADCAST':
        return <Radio className="h-5 w-5 text-purple-600 dark:text-purple-400" />;
      default:
        return <Bell className="h-5 w-5 text-accent" />;
    }
  };

  const formatTimestamp = (dateString: string) => {
    const diff = fetchedAt - new Date(dateString).getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 1) return isHi ? 'अभी-अभी' : 'Just now';
    if (minutes < 60) return isHi ? `${minutes} मिनट पहले` : `${minutes}m ago`;
    if (hours < 24) return isHi ? `${hours} घंटे पहले` : `${hours}h ago`;
    if (days === 1) return isHi ? 'कल' : 'Yesterday';
    return new Date(dateString).toLocaleDateString(language === 'hi' ? 'hi-IN' : 'en-IN', {
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="w-full space-y-6">
      {/* Scope & Privacy Header Banner */}
      <div className="relative overflow-hidden rounded-2xl border border-line bg-surface p-5 sm:p-6 shadow-card">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-md bg-accent-soft px-2 py-0.5 text-[10px] font-bold text-accent-strong uppercase">
                <ShieldCheck className="h-3 w-3" />
                {isHi ? 'सुरक्षित और निजी' : 'Private & Scoped'}
              </span>
              <span className="text-[11px] font-semibold text-muted">
                {user?.name} ({role === 'WORKER' ? (isHi ? 'कारीगर' : 'Worker') : isHi ? 'दुकानदार' : 'Merchant'})
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-ink">
              {t.notifications}
            </h1>
            <p className="text-xs sm:text-sm text-muted">
              {isHi
                ? 'केवल आपके खाते से संबंधित महत्वपूर्ण सूचनाएं, आवेदन और अलर्ट।'
                : 'Showing exclusive real-time updates, applications, and alerts for your account only.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {unreadCount > 0 && (
              <Button
                variant="primary"
                size="sm"
                onClick={markAllAsRead}
                disabled={actionLoading === 'markAll'}
              >
                <CheckCheck className="h-4 w-4" />
                <span>{isHi ? `सभी पढ़े चिह्नित करें (${unreadCount})` : `Mark All as Read (${unreadCount})`}</span>
              </Button>
            )}

            <Button
              variant="secondary"
              size="sm"
              onClick={fetchNotifications}
              disabled={loading}
              title={isHi ? 'ताज़ा करें' : 'Refresh'}
            >
              <RefreshCw className={cn('h-3.5 w-3.5', loading && 'animate-spin')} />
              <span className="hidden sm:inline">{isHi ? 'ताज़ा करें' : 'Refresh'}</span>
            </Button>

            {notifications.some((n) => n.isRead) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearReadNotifications}
                disabled={actionLoading === 'clearRead'}
                className="text-muted hover:text-red-600"
                title={isHi ? 'पढ़े गए हटाएं' : 'Clear Read'}
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">{isHi ? 'पढ़े हटाएं' : 'Clear Read'}</span>
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-line pb-3">
        {(
          [
            ['all', isHi ? 'सभी' : 'All'],
            ['unread', isHi ? `बिना पढ़े (${unreadCount})` : `Unread (${unreadCount})`],
            ['jobs', isHi ? 'रोज़गार व आवेदन' : 'Jobs & Applications'],
            ['shop', isHi ? 'दुकान व इन्वेंट्री' : 'Shop & Inventory'],
            ['system', isHi ? 'सिस्टम व प्रसारण' : 'System & Broadcasts'],
          ] as const
        ).map(([fKey, label]) => (
          <button
            key={fKey}
            type="button"
            onClick={() => setActiveFilter(fKey)}
            className={cn(
              'rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all',
              activeFilter === fKey
                ? 'bg-accent text-accent-fg shadow-xs'
                : 'bg-subtle text-muted hover:bg-hover hover:text-ink'
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Notifications List */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="ks-skeleton h-20 rounded-2xl" />
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <EmptyState
          icon={Bell}
          title={isHi ? 'कोई सूचना नहीं है' : 'No notifications found'}
          description={
            isHi
              ? 'वर्तमान फ़िल्टर के लिए कोई सूचना मौजूद नहीं है। नई गतिविधियां होने पर यहां दिखाई देंगी।'
              : 'There are no notifications matching your active filter. New updates will arrive here automatically.'
          }
          className="border-dashed"
        />
      ) : (
        <div className="space-y-3">
          {notifications.map((n) => {
            const isUnread = !n.isRead;
            return (
              <div
                key={n.id}
                className={cn(
                  'group relative flex flex-col sm:flex-row items-start justify-between gap-4 rounded-2xl border p-4.5 transition-all shadow-xs',
                  isUnread
                    ? 'border-accent/40 bg-accent-soft/30 text-ink shadow-sm ring-1 ring-accent/20'
                    : 'border-line bg-surface text-ink-soft hover:border-line-strong'
                )}
              >
                <div className="flex items-start gap-3.5 min-w-0 flex-1">
                  <div
                    className={cn(
                      'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl',
                      isUnread
                        ? 'bg-surface shadow-xs border border-accent/30'
                        : 'bg-subtle border border-line'
                    )}
                  >
                    {getNotificationIcon(n.type)}
                  </div>

                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h3
                        className={cn(
                          'text-sm tracking-tight',
                          isUnread ? 'font-black text-ink' : 'font-bold text-ink-soft'
                        )}
                      >
                        {n.title}
                      </h3>
                      {isUnread && (
                        <span className="flex h-2 w-2 rounded-full bg-accent animate-pulse" />
                      )}
                    </div>

                    <p className="text-xs leading-relaxed text-ink-soft">
                      {n.message}
                    </p>

                    <div className="flex flex-wrap items-center gap-3 pt-1 text-[11px] text-muted">
                      <span className="flex items-center gap-1 font-medium">
                        <Clock className="h-3 w-3 text-faint" />
                        {formatTimestamp(n.createdAt)}
                      </span>

                      {/* Deep-link action button */}
                      {n.type === 'APPLICATION_ACCEPTED' && role === 'WORKER' && (
                        <Link
                          href="/worker/applications"
                          className="font-bold text-emerald-700 dark:text-emerald-400 hover:underline inline-flex items-center gap-1"
                        >
                          <span>{isHi ? 'मालिक का नंबर देखें' : 'View Employer Details'}</span>
                          <ExternalLink className="h-3 w-3" />
                        </Link>
                      )}

                      {n.type === 'JOB_APPLICATION' && role === 'BUSINESS_OWNER' && (
                        <Link
                          href="/business/jobs"
                          className="font-bold text-accent hover:underline inline-flex items-center gap-1"
                        >
                          <span>{isHi ? 'उम्मीदवार की समीक्षा करें' : 'Review Applicant'}</span>
                          <ExternalLink className="h-3 w-3" />
                        </Link>
                      )}

                      {n.type === 'INVENTORY_LOW' && role === 'BUSINESS_OWNER' && (
                        <Link
                          href="/business/inventory"
                          className="font-bold text-amber-700 dark:text-amber-400 hover:underline inline-flex items-center gap-1"
                        >
                          <span>{isHi ? 'स्टॉक फिर से भरें' : 'Restock Item'}</span>
                          <ExternalLink className="h-3 w-3" />
                        </Link>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right Quick Controls */}
                <div className="flex items-center gap-1.5 self-end sm:self-center shrink-0">
                  <button
                    type="button"
                    onClick={() => toggleReadStatus(n.id, n.isRead)}
                    disabled={actionLoading === n.id}
                    className="inline-flex items-center gap-1 rounded-lg border border-line bg-subtle px-2.5 py-1 text-[11px] font-semibold text-muted hover:bg-hover hover:text-ink transition-colors"
                    title={n.isRead ? 'Mark as Unread' : 'Mark as Read'}
                  >
                    {n.isRead ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                    <span>{n.isRead ? (isHi ? 'अपठित करें' : 'Mark unread') : (isHi ? 'पढ़ा हुआ' : 'Mark read')}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => deleteNotification(n.id)}
                    disabled={actionLoading === `del-${n.id}`}
                    className="rounded-lg p-1.5 text-faint hover:bg-red-500/10 hover:text-red-600 transition-colors"
                    title={isHi ? 'हटाएं' : 'Delete notification'}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
