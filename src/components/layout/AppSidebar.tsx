'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import { cn } from '@/lib/cn';
import {
  LayoutDashboard,
  Briefcase,
  Package,
  Users,
  BookOpen,
  Store,
  Bell,
  Settings,
  User,
  FileText,
  ShieldCheck,
  LogOut,
  ChevronRight,
  X,
} from 'lucide-react';

interface AppSidebarProps {
  role: 'WORKER' | 'BUSINESS_OWNER' | 'ADMIN';
  isOpen: boolean;
  onClose: () => void;
}

export default function AppSidebar({ role, isOpen, onClose }: AppSidebarProps) {
  const pathname = usePathname();
  const { user, t, language, logout } = useApp();

  const businessItems = [
    { href: '/business/dashboard', label: t.overview, icon: LayoutDashboard },
    { href: '/business/jobs', label: t.jobsAndApplicants, icon: Briefcase },
    { href: '/business/inventory', label: t.inventory, icon: Package },
    { href: '/business/customers', label: t.customers, icon: Users },
    { href: '/business/udhaar', label: t.udhaar, icon: BookOpen },
    { href: '/business/sales', label: t.sales, icon: Store },
    { href: '/business/notifications', label: t.notifications, icon: Bell },
    { href: '/business/settings', label: t.settings, icon: Settings },
  ];

  const workerItems = [
    { href: '/worker/dashboard', label: t.overview, icon: LayoutDashboard },
    { href: '/jobs', label: t.findWork, icon: Briefcase },
    { href: '/worker/applications', label: t.myApplications, icon: FileText },
    { href: '/worker/profile', label: t.profile, icon: User },
    { href: '/worker/notifications', label: t.notifications, icon: Bell },
    { href: '/worker/settings', label: t.settings, icon: Settings },
  ];

  const adminItems = [
    { href: '/admin/dashboard', label: t.overview, icon: LayoutDashboard },
    { href: '/admin/dashboard', label: t.users, icon: Users },
    { href: '/admin/dashboard', label: t.businesses, icon: Store },
    { href: '/admin/dashboard', label: t.jobs, icon: Briefcase },
    { href: '/admin/dashboard', label: t.moderation, icon: ShieldCheck },
    { href: '/admin/dashboard', label: t.settings, icon: Settings },
  ];

  const currentNav =
    role === 'BUSINESS_OWNER'
      ? businessItems
      : role === 'WORKER'
      ? workerItems
      : adminItems;

  const roleTitle =
    role === 'BUSINESS_OWNER'
      ? t.merchantHub
      : role === 'WORKER'
      ? t.workerSpace
      : t.adminControl;

  return (
    <>
      {/* Mobile Drawer Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs lg:hidden transition-opacity"
          aria-hidden="true"
        />
      )}

      {/* Persistent Full-Height Left Sidebar (Linear/Stripe SaaS Style) */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex h-full w-64 xl:w-72 flex-col border-r border-line bg-sidebar transition-transform duration-200 ease-in-out',
          isOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full lg:translate-x-0'
        )}
      >
        {/* Brand & Workspace Header */}
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-line px-5 bg-sidebar">
          <Link href="/" onClick={() => onClose()} className="flex items-center gap-2.5 group">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent text-accent-fg shadow-sm font-black group-hover:scale-105 transition-transform">
              <Briefcase className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-base font-black tracking-tight text-ink">
                  Kaam<span className="text-accent">Setu</span>
                </span>
                <span className="rounded-md bg-accent-soft px-1.5 py-0.2 text-[9px] font-bold text-accent-strong uppercase">
                  SaaS
                </span>
              </div>
              <span className="block text-[10px] font-bold uppercase tracking-wider text-muted">
                {roleTitle}
              </span>
            </div>
          </Link>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-ink-soft hover:bg-hover lg:hidden"
            aria-label="Close sidebar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* User Identity Card */}
        <div className="border-b border-line bg-subtle/60 p-3.5">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-accent-soft text-accent-strong text-xs font-black ring-1 ring-accent/20">
              {user?.name?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-bold text-ink">{user?.name || 'User'}</p>
              <p className="truncate text-[10px] text-muted">
                {role === 'BUSINESS_OWNER'
                  ? user?.business?.name || (language === 'hi' ? 'दुकानदार' : 'Local Merchant')
                  : user?.workerProfile?.skills?.[0] || (language === 'hi' ? 'कारीगर' : 'Skilled Craftsman')}
              </p>
            </div>
          </div>
        </div>

        {/* Navigation Destination Items */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1 [scrollbar-width:thin]">
          <nav className="space-y-1">
            {currentNav.map((item, idx) => {
              const Icon = item.icon;
              const isActive =
                item.href === '/worker/dashboard' || item.href === '/business/dashboard'
                  ? pathname === item.href
                  : pathname === item.href || (pathname.startsWith(item.href) && item.href !== '/jobs');

              return (
                <Link
                  key={`${item.href}-${idx}`}
                  href={item.href}
                  onClick={() => onClose()}
                  className={cn(
                    'group flex items-center justify-between rounded-xl px-3 py-2.5 text-xs font-semibold transition-all',
                    isActive
                      ? 'bg-accent text-accent-fg shadow-xs font-bold'
                      : 'text-ink-soft hover:bg-hover hover:text-ink'
                  )}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon
                      className={cn(
                        'h-4 w-4 shrink-0 transition-colors',
                        isActive ? 'text-white' : 'text-muted group-hover:text-ink'
                      )}
                    />
                    <span>{item.label}</span>
                  </div>
                  {isActive ? (
                    <ChevronRight className="h-3.5 w-3.5 text-white/90" />
                  ) : null}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Pinned Bottom Actions: Settings & Logout */}
        <div className="shrink-0 border-t border-line bg-sidebar p-3 mt-auto space-y-1">
          <button
            onClick={() => {
              onClose();
              logout();
            }}
            className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-bold text-red-600 dark:text-red-400 hover:bg-red-500/10 transition-colors"
          >
            <LogOut className="h-4 w-4" />
            <span>{t.logout}</span>
          </button>
        </div>
      </aside>
    </>
  );
}
