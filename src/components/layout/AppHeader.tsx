'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import { Language } from '@/lib/i18n';
import { cn } from '@/lib/cn';
import {
  Menu,
  Bell,
  Mic,
  Store,
  BookOpen,
  Search,
  LogOut,
  ChevronRight,
} from 'lucide-react';
import VoiceAssistantModal from '@/components/VoiceAssistantModal';
import ThemeToggle from '@/components/ui/ThemeToggle';

interface AppHeaderProps {
  role: 'WORKER' | 'BUSINESS_OWNER' | 'ADMIN';
  onToggleSidebar: () => void;
}

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export default function AppHeader({ role, onToggleSidebar }: AppHeaderProps) {
  const { language, setLanguage, user, t, logout } = useApp();
  const pathname = usePathname();
  const router = useRouter();

  const [voiceOpen, setVoiceOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const notifRef = useRef<HTMLDivElement>(null);

  const fetchNotifs = () => {
    fetch('/api/notifications')
      .then((res) => res.json())
      .then((data) => {
        if (data.unreadCount !== undefined) setUnreadCount(data.unreadCount);
        if (data.notifications) setNotifications(data.notifications.slice(0, 5));
      })
      .catch(() => {});
  };

  useEffect(() => {
    if (!user) return;
    fetchNotifs();
    const interval = setInterval(fetchNotifs, 12000);
    return () => clearInterval(interval);
  }, [user, pathname]);

  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    };
    if (notifOpen) document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [notifOpen]);

  // Derive dynamic breadcrumbs
  const getBreadcrumb = () => {
    const isHi = language === 'hi';
    const hub =
      role === 'BUSINESS_OWNER'
        ? isHi ? 'दुकानदार' : 'Merchant'
        : role === 'WORKER'
        ? isHi ? 'कारीगर' : 'Worker'
        : isHi ? 'प्रशासक' : 'Admin';

    let pageName: string = t.overview;
    if (pathname.includes('/jobs/create')) pageName = t.postJob;
    else if (pathname.includes('/jobs')) pageName = t.jobs;
    else if (pathname.includes('/inventory')) pageName = t.inventory;
    else if (pathname.includes('/customers')) pageName = t.customers;
    else if (pathname.includes('/udhaar')) pageName = t.udhaar;
    else if (pathname.includes('/sales')) pageName = t.sales;
    else if (pathname.includes('/applications')) pageName = t.myApplications;
    else if (pathname.includes('/profile')) pageName = t.profile;
    else if (pathname.includes('/notifications')) pageName = t.notifications;
    else if (pathname.includes('/settings')) pageName = t.settings;

    return { hub, pageName };
  };

  const { hub, pageName } = getBreadcrumb();

  const handleGlobalSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    if (role === 'WORKER') {
      router.push(`/jobs?search=${encodeURIComponent(searchQuery)}`);
    } else {
      router.push(`/business/inventory?search=${encodeURIComponent(searchQuery)}`);
    }
  };

  return (
    <>
      <header className="sticky top-0 z-30 flex h-16 w-full max-w-full min-w-0 items-center justify-between border-b border-line bg-surface/95 px-4 sm:px-6 lg:px-8 backdrop-blur-md">
        {/* Left Section: Mobile Drawer Toggle & Breadcrumbs */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0 shrink">
          <button
            type="button"
            onClick={onToggleSidebar}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-ink-soft hover:bg-hover lg:hidden"
            aria-label="Open sidebar"
          >
            <Menu className="h-5 w-5" />
          </button>

          <nav className="flex items-center gap-1.5 text-xs min-w-0" aria-label="Breadcrumb">
            <span className="font-semibold text-muted hidden sm:inline shrink-0">{hub}</span>
            <ChevronRight className="h-3.5 w-3.5 text-faint hidden sm:inline shrink-0" />
            <span className="font-bold text-ink truncate max-w-[120px] sm:max-w-xs">{pageName}</span>
          </nav>
        </div>

        {/* Center: Global Search Input */}
        <form
          onSubmit={handleGlobalSearch}
          className="hidden lg:flex relative max-w-xs xl:max-w-md w-full min-w-0 mx-4 shrink"
        >
          <Search className="pointer-events-none absolute top-2.5 left-3 h-4 w-4 text-muted" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t.searchPlaceholder}
            className="w-full rounded-xl border border-line bg-subtle/80 py-1.5 pr-8 pl-9 text-xs text-ink placeholder:text-muted focus:border-accent focus:bg-surface focus:outline-none transition-colors"
          />
          <kbd className="pointer-events-none absolute top-2 right-2.5 rounded bg-surface border border-line px-1.5 py-0.5 text-[10px] font-mono text-muted">
            ↵
          </kbd>
        </form>

        {/* Right Section: Context Actions, Voice, Language, Notifications & User Card */}
        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          {/* Business Owner Quick Actions on large screens */}
          {role === 'BUSINESS_OWNER' && (
            <div className="hidden xl:flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setVoiceOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-xl bg-accent hover:bg-accent-strong px-3 py-1.5 text-xs font-bold text-accent-fg shadow-xs transition-transform active:scale-95"
                title="Voice Quick Assistant"
              >
                <Mic className="h-3.5 w-3.5" />
                <span>{t.voiceEntry}</span>
              </button>

              <Link
                href="/business/sales"
                className="inline-flex items-center gap-1.5 rounded-xl bg-subtle hover:bg-hover text-ink border border-line px-3 py-1.5 text-xs font-bold transition-colors"
              >
                <Store className="h-3.5 w-3.5 text-accent" />
                <span>+ {t.addSale}</span>
              </Link>

              <Link
                href="/business/udhaar"
                className="inline-flex items-center gap-1.5 rounded-xl bg-subtle hover:bg-hover text-ink border border-line px-3 py-1.5 text-xs font-bold transition-colors"
              >
                <BookOpen className="h-3.5 w-3.5 text-green-600" />
                <span>+ {t.udhaar}</span>
              </Link>
            </div>
          )}

          {/* Theme Switch */}
          <ThemeToggle className="h-8 w-8 sm:h-9 sm:w-9 rounded-xl border-line bg-surface text-ink-soft hover:bg-hover" />

          {/* Bilingual Switcher (EN | हिन्दी) */}
          <div className="flex items-center rounded-xl bg-subtle p-0.5 border border-line text-[11px] sm:text-xs font-bold">
            {(['en', 'hi'] as Language[]).map((lang) => (
              <button
                key={lang}
                onClick={() => setLanguage(lang)}
                className={cn(
                  'px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-lg transition-all',
                  language === lang
                    ? 'bg-surface text-accent font-black shadow-xs'
                    : 'text-ink-soft hover:text-ink'
                )}
              >
                {lang === 'en' ? 'EN' : 'हिन्दी'}
              </button>
            ))}
          </div>

          {/* Notifications Dropdown */}
          <div className="relative" ref={notifRef}>
            <button
              type="button"
              onClick={() => setNotifOpen(!notifOpen)}
              className="relative flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-xl border border-line bg-surface text-ink-soft hover:bg-hover transition-colors"
              aria-label="View notifications"
            >
              <Bell className="h-4 w-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-600 px-1 text-[9px] font-black text-white ring-2 ring-surface">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {notifOpen && (
              <div className="absolute right-0 mt-2 w-72 sm:w-80 max-w-[calc(100vw-1.5rem)] rounded-2xl border border-line bg-surface p-3 shadow-xl z-50 text-xs">
                <div className="flex items-center justify-between border-b border-line pb-2 mb-2">
                  <span className="font-bold text-ink">
                    {t.notifications} ({unreadCount})
                  </span>
                  <Link
                    href={role === 'WORKER' ? '/worker/notifications' : '/business/notifications'}
                    onClick={() => setNotifOpen(false)}
                    className="text-[11px] font-bold text-accent hover:underline"
                  >
                    {t.viewAll} →
                  </Link>
                </div>
                {notifications.length === 0 ? (
                  <p className="py-4 text-center text-muted">
                    {language === 'hi' ? 'कोई नई सूचना नहीं है' : 'No recent notifications'}
                  </p>
                ) : (
                  <div className="divide-y divide-line max-h-64 overflow-y-auto">
                    {notifications.map((n) => (
                      <div key={n.id} className="py-2 space-y-0.5">
                        <p className="font-bold text-ink">{n.title}</p>
                        <p className="text-[11px] text-muted line-clamp-2">{n.message}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* User Profile & Direct Logout Button */}
          <div className="flex items-center gap-1 sm:gap-1.5 pl-1.5 sm:pl-2 border-l border-line">
            <Link
              href={role === 'WORKER' ? '/worker/settings' : role === 'BUSINESS_OWNER' ? '/business/settings' : '/admin/dashboard'}
              className="flex items-center rounded-xl p-0.5 hover:bg-hover"
              title={user?.name || 'User Profile & Settings'}
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-accent-soft font-bold text-accent-strong text-xs ring-1 ring-accent/20">
                {user?.name?.charAt(0).toUpperCase() || 'U'}
              </div>
            </Link>
            <button
              onClick={() => logout()}
              title={t.logout}
              className="hidden sm:flex p-1.5 text-muted hover:text-red-600 dark:hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Voice Assistant Modal */}
      <VoiceAssistantModal isOpen={voiceOpen} onClose={() => setVoiceOpen(false)} />
    </>
  );
}
