'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import { Language } from '@/lib/i18n';
import { cn } from '@/lib/cn';
import {
  Briefcase,
  Bell,
  Menu,
  X,
  LogOut,
  User as UserIcon,
  LayoutDashboard,
  FileText,
  Package,
  BookOpen,
  Mic,
  Clock,
} from 'lucide-react';
import VoiceAssistantModal from './VoiceAssistantModal';
import ThemeToggle from '@/components/ui/ThemeToggle';
import { formatDate } from '@/lib/date';

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export default function Navbar() {
  const { language, setLanguage, t, user, logout } = useApp();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [latestNotifications, setLatestNotifications] = useState<
    NotificationItem[]
  >([]);
  const [notifOpen, setNotifOpen] = useState(false);
  const [voiceModalOpen, setVoiceModalOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user) {
      fetch('/api/notifications')
        .then((res) => res.json())
        .then((data) => {
          if (data.unreadCount !== undefined) {
            setUnreadNotifications(data.unreadCount);
            setLatestNotifications((data.notifications || []).slice(0, 5));
          }
        })
        .catch(() => {});
    }
  }, [user, pathname]);

  /* Scroll-linked elevation: the glass bar solidifies and lifts once the page moves. */
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Close the notifications dropdown on outside click / Escape.
  useEffect(() => {
    if (!notifOpen) return;
    const onClick = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setNotifOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [notifOpen]);

  // Lock body scroll while the mobile drawer is open.
  useEffect(() => {
    document.body.style.overflow = mobileMenuOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen]);

  const notificationsHref =
    user?.role === 'WORKER'
      ? '/worker/notifications'
      : '/business/notifications';

  const navLinks = [
    { href: '/jobs', label: t.jobs, icon: Briefcase },
    ...(user?.role === 'WORKER'
      ? [
          { href: '/worker/dashboard', label: t.dashboard, icon: LayoutDashboard },
          { href: '/worker/profile', label: t.profile, icon: UserIcon },
          { href: '/worker/applications', label: t.applications, icon: FileText },
        ]
      : []),
    ...(user?.role === 'BUSINESS_OWNER'
      ? [
          { href: '/business/dashboard', label: t.dashboard, icon: LayoutDashboard },
          { href: '/business/inventory', label: t.inventory, icon: Package },
          { href: '/business/udhaar', label: t.udhaar, icon: BookOpen },
          { href: '/business/sales', label: t.sales, icon: BookOpen },
        ]
      : []),
    ...(user?.role === 'ADMIN'
      ? [{ href: '/admin/dashboard', label: t.adminPanel, icon: LayoutDashboard }]
      : []),
  ];

  const profileHref =
    user?.role === 'WORKER' ? '/worker/profile' : '/business/dashboard';

  /* Stable per-path active check (shared by desktop & mobile) */
  const isLinkActive = useCallback(
    (href: string) =>
      href === '/jobs'
        ? pathname === '/jobs' || pathname.startsWith('/jobs/')
        : pathname === href || pathname.startsWith(href + '/'),
    [pathname]
  );

  return (
    <>
      {/* Floating glass bar — detached from the viewport edge, solidifies on scroll */}
      <header className="sticky top-0 z-50 w-full px-3 pt-3 sm:px-5 sm:pt-4 pointer-events-none">
        <div
          className={cn(
            'pointer-events-auto mx-auto flex h-14 max-w-7xl items-center justify-between gap-3 rounded-2xl border px-3 sm:h-16 sm:px-4',
            'bg-surface/70 backdrop-blur-xl supports-[backdrop-filter]:bg-surface/60',
            'transition-[background-color,box-shadow,border-color,margin] duration-300 ease-out',
            scrolled
              ? 'border-line bg-surface/85 shadow-pop'
              : 'border-line/70 shadow-card'
          )}
        >
          {/* Logo & Brand */}
          <Link
            href="/"
            className="flex shrink-0 items-center gap-2.5 transition-transform active:scale-95"
          >
            <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-xl shadow-xs shadow-brand-600/30 ring-1 ring-line">
              <img
                src="/logo.svg"
                alt="KaamSetu Logo"
                className="h-full w-full object-contain"
              />
            </div>
            <div className="leading-tight">
              <span className="text-lg font-black tracking-tight text-ink">
                Kaam<span className="text-accent">Setu</span>
              </span>
              <span className="hidden text-[10px] font-medium tracking-wide text-muted uppercase sm:block">
                {language === 'hi' ? 'कामसेतु मंच' : 'Work & Business Platform'}
              </span>
            </div>
          </Link>

          {/* Desktop Nav Links — animated pill indicator */}
          <nav
            className="hidden items-center gap-0.5 rounded-xl bg-subtle/60 p-1 lg:flex"
            aria-label="Primary"
          >
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = isLinkActive(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  aria-current={isActive ? 'page' : undefined}
                  className={cn(
                    'relative flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[13px] font-medium transition-colors duration-150',
                    isActive
                      ? 'bg-surface text-accent-strong font-semibold shadow-card'
                      : 'text-ink-soft hover:bg-hover/80 hover:text-ink'
                  )}
                >
                  <Icon className="h-4 w-4" aria-hidden />
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* Actions & Utilities */}
          <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
            {/* Voice Assistant Shortcut */}
            {user?.role === 'BUSINESS_OWNER' && (
              <button
                onClick={() => setVoiceModalOpen(true)}
                title="Voice Quick Entry"
                className="ks-btn ks-btn-amber ks-btn-sm hidden sm:inline-flex"
              >
                <Mic className="h-3.5 w-3.5" aria-hidden />
                <span className="hidden xl:inline">{t.quickVoiceEntry}</span>
                <span className="xl:hidden">Voice</span>
              </button>
            )}

            {/* Theme Switch */}
            <ThemeToggle className="h-8 w-8 sm:h-9 sm:w-9 rounded-xl border border-line bg-surface/80 text-ink-soft hover:bg-hover hover:text-ink" />

            {/* Language Switcher */}
            <div
              className="hidden items-center rounded-xl border border-line bg-subtle p-0.5 text-xs sm:flex"
              role="group"
              aria-label="Language"
            >
              {(['en', 'hi'] as Language[]).map((lang) => (
                <button
                  key={lang}
                  onClick={() => setLanguage(lang)}
                  aria-pressed={language === lang}
                  className={cn(
                    'rounded-lg px-2 py-1 font-medium transition-all text-xs',
                    language === lang
                      ? 'bg-surface font-bold text-accent-strong shadow-card'
                      : 'text-muted hover:text-ink'
                  )}
                >
                  {lang === 'en' ? 'EN' : 'हिंदी'}
                </button>
              ))}
            </div>

            {/* Notifications dropdown */}
            {user && (
              <div className="relative" ref={notifRef}>
                <button
                  onClick={() => setNotifOpen((v) => !v)}
                  aria-label={t.notifications}
                  aria-expanded={notifOpen}
                  className="relative flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-xl border border-line bg-surface/80 text-ink-soft transition-colors hover:bg-hover hover:text-ink"
                >
                  <Bell className="h-4 w-4" aria-hidden />
                  {unreadNotifications > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-600 px-0.5 text-[9px] leading-none font-bold text-white ring-2 ring-surface">
                      {unreadNotifications > 9 ? '9+' : unreadNotifications}
                    </span>
                  )}
                </button>

                {notifOpen && (
                  <div className="animate-slide-down absolute right-0 z-50 mt-2 w-80 max-w-[calc(100vw-1.5rem)] overflow-hidden rounded-2xl border border-line bg-surface/95 shadow-pop backdrop-blur-xl">
                    <div className="flex items-center justify-between border-b border-line px-4 py-3">
                      <p className="text-xs font-bold text-ink">
                        {t.notifications}
                      </p>
                      {unreadNotifications > 0 && (
                        <span className="ks-badge bg-red-500/10 text-red-600 dark:text-red-400">
                          {unreadNotifications} new
                        </span>
                      )}
                    </div>
                    <div className="max-h-72 overflow-y-auto">
                      {latestNotifications.length === 0 ? (
                        <p className="px-4 py-6 text-center text-xs text-muted">
                          No notifications yet.
                        </p>
                      ) : (
                        latestNotifications.map((n) => (
                          <div
                            key={n.id}
                            className={cn(
                              'border-b border-line px-4 py-3 last:border-0 transition-colors hover:bg-hover/50',
                              !n.isRead && 'bg-accent-soft/40'
                            )}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <p className="flex items-center gap-1.5 text-xs font-bold text-ink">
                                {!n.isRead && (
                                  <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                                )}
                                {n.title}
                              </p>
                              <span className="flex shrink-0 items-center gap-1 text-[10px] text-muted">
                                <Clock className="h-3 w-3" aria-hidden />
                                {formatDate(n.createdAt)}
                              </span>
                            </div>
                            <p className="mt-0.5 pl-3 text-[11px] leading-relaxed text-muted">
                              {n.message}
                            </p>
                          </div>
                        ))
                      )}
                    </div>
                    <Link
                      href={notificationsHref}
                      onClick={() => setNotifOpen(false)}
                      className="block border-t border-line bg-subtle/60 px-4 py-2.5 text-center text-xs font-bold text-accent-strong transition-colors hover:bg-hover"
                    >
                      View all notifications
                    </Link>
                  </div>
                )}
              </div>
            )}

            {/* User Profile / Auth buttons */}
            {user ? (
              <div className="hidden items-center gap-2 border-l border-line pl-2 sm:flex">
                <Link
                  href={profileHref}
                  className="flex items-center gap-2 text-left transition-opacity hover:opacity-80"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-brand-700 text-xs font-bold text-white ring-2 ring-brand-100 dark:ring-brand-800">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="hidden xl:block">
                    <p className="text-xs leading-tight font-semibold text-ink">
                      {user.name}
                    </p>
                    <p className="text-[10px] text-muted capitalize">
                      {user.role === 'WORKER' ? 'Worker' : 'Business'}
                    </p>
                  </div>
                </Link>
                <button
                  onClick={logout}
                  className="rounded-lg p-1.5 text-muted transition-colors hover:bg-red-500/10 hover:text-red-600 dark:text-red-400 dark:hover:text-red-400"
                  title={t.logout}
                  aria-label={t.logout}
                >
                  <LogOut className="h-4 w-4" aria-hidden />
                </button>
              </div>
            ) : (
              <div className="hidden items-center gap-2 sm:flex">
                <Link
                  href="/login"
                  className="rounded-lg px-3 py-1.5 text-sm font-medium text-ink-soft transition-colors hover:bg-hover hover:text-ink"
                >
                  {t.login}
                </Link>
                <Link
                  href="/register"
                  className="ks-btn ks-btn-primary ks-btn-sm"
                >
                  {t.register}
                </Link>
              </div>
            )}

            {/* Mobile Hamburger Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-xl border border-line bg-surface/80 text-ink-soft transition-colors hover:bg-hover hover:text-ink md:hidden"
              aria-expanded={mobileMenuOpen}
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? (
                <X className="h-5 w-5" aria-hidden />
              ) : (
                <Menu className="h-5 w-5" aria-hidden />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu — glass sheet */}
        {mobileMenuOpen && (
          <>
            <div
              className="animate-fade-in fixed inset-0 top-[4.5rem] z-[-1] bg-black/40 backdrop-blur-xs md:hidden"
              onClick={() => setMobileMenuOpen(false)}
              aria-hidden="true"
            />
            <div className="animate-slide-down mx-auto mt-2 max-w-7xl rounded-2xl border border-line bg-surface/95 px-4 pt-2 pb-6 shadow-pop backdrop-blur-xl md:hidden">
              <div className="flex flex-col space-y-1">
                {navLinks.map((link) => {
                  const Icon = link.icon;
                  const isActive = isLinkActive(link.href);
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setMobileMenuOpen(false)}
                      aria-current={isActive ? 'page' : undefined}
                      className={cn(
                        'flex items-center gap-3 rounded-xl px-3 py-2.5 text-base font-medium transition-colors',
                        isActive
                          ? 'bg-accent-soft font-semibold text-accent-strong'
                          : 'text-ink-soft hover:bg-hover'
                      )}
                    >
                      <Icon
                        className={cn(
                          'h-5 w-5',
                          isActive ? 'text-accent' : 'text-muted'
                        )}
                        aria-hidden
                      />
                      {link.label}
                    </Link>
                  );
                })}
              </div>

              <div className="mt-3 border-t border-line pt-3">
                {user ? (
                  <div className="flex items-center justify-between py-2">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-brand-700 text-sm font-bold text-white">
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-ink">
                          {user.name}
                        </p>
                        <p className="text-xs text-muted">{user.phone}</p>
                      </div>
                    </div>
                    <button
                      onClick={logout}
                      className="ks-btn ks-btn-danger-soft ks-btn-sm"
                    >
                      <LogOut className="h-3.5 w-3.5" aria-hidden />
                      {t.logout}
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2 pt-2">
                    <Link
                      href="/login"
                      onClick={() => setMobileMenuOpen(false)}
                      className="ks-btn ks-btn-secondary"
                    >
                      {t.login}
                    </Link>
                    <Link
                      href="/register"
                      onClick={() => setMobileMenuOpen(false)}
                      className="ks-btn ks-btn-primary"
                    >
                      {t.register}
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </header>

      {/* Voice Assistant Modal */}
      <VoiceAssistantModal isOpen={voiceModalOpen} onClose={() => setVoiceModalOpen(false)} />
    </>
  );
}
