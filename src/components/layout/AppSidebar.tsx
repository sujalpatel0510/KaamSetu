'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { LucideIcon } from 'lucide-react';
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
  Clock,
  Banknote,
  Truck,
  Receipt,
  Scale,
  Bookmark,
  Award,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react';

interface AppSidebarProps {
  role: 'WORKER' | 'BUSINESS_OWNER' | 'ADMIN';
  isOpen: boolean;
  onClose: () => void;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  tab?: string;
}

export default function AppSidebar({
  role,
  isOpen,
  onClose,
  collapsed = false,
  onToggleCollapse,
}: AppSidebarProps) {
  const pathname = usePathname();
  const { user, t, language, logout } = useApp();

  const isHi = language === 'hi';

  const businessItems = [
    { href: '/business/dashboard', label: t.overview, icon: LayoutDashboard },
    { href: '/business/work', label: t.workAssignments, icon: Clock },
    { href: '/business/wages', label: t.wagesAndEarnings, icon: Banknote },
    { href: '/business/jobs', label: t.jobsAndApplicants, icon: Briefcase },
    { href: '/business/suppliers', label: t.suppliers, icon: Truck },
    { href: '/business/purchases', label: t.purchases, icon: Package },
    { href: '/business/expenses', label: t.expenses, icon: Receipt },
    { href: '/business/inventory', label: t.inventory, icon: Store },
    { href: '/business/sales', label: t.sales, icon: Store },
    { href: '/business/udhaar', label: t.udhaar, icon: BookOpen },
    { href: '/business/customers', label: t.customers, icon: Users },
    { href: '/business/disputes', label: t.disputes, icon: Scale },
    { href: '/business/notifications', label: t.notifications, icon: Bell },
    { href: '/business/settings', label: t.settings, icon: Settings },
  ];

  const workerItems = [
    { href: '/worker/dashboard', label: t.overview, icon: LayoutDashboard },
    { href: '/worker/work', label: t.workAssignments, icon: Clock },
    { href: '/worker/earnings', label: t.wagesAndEarnings, icon: Banknote },
    { href: '/jobs', label: t.findWork, icon: Briefcase },
    { href: '/worker/saved-jobs', label: t.savedJobs, icon: Bookmark },
    { href: '/worker/applications', label: t.myApplications, icon: FileText },
    { href: '/worker/verification', label: t.verification, icon: Award },
    { href: '/worker/disputes', label: t.disputes, icon: Scale },
    { href: '/worker/profile', label: t.profile, icon: User },
    { href: '/worker/notifications', label: t.notifications, icon: Bell },
    { href: '/worker/settings', label: t.settings, icon: Settings },
  ];

  const adminItems: NavItem[] = [
    { href: '/admin/dashboard', label: isHi ? 'प्लेटफ़ॉर्म अवलोकन' : 'Overview', icon: LayoutDashboard },
    { href: '/admin/users', label: isHi ? 'उपयोगकर्ता सूची' : 'Users', icon: Users },
    { href: '/admin/businesses', label: isHi ? 'दुकानें व व्यापार' : 'Businesses', icon: Store },
    { href: '/admin/jobs', label: isHi ? 'नौकरियां व मॉडरेशन' : 'Jobs', icon: Briefcase },
    { href: '/admin/verification', label: t.verification, icon: Award },
    { href: '/admin/disputes', label: t.disputes, icon: Scale },
    { href: '/admin/moderation', label: isHi ? 'प्रसारण व नियंत्रण' : 'Moderation', icon: ShieldCheck },
    { href: '/admin/settings', label: t.settings, icon: Settings },
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
          'fixed inset-y-0 left-0 z-50 flex h-full flex-col border-r border-line bg-sidebar transition-all duration-200 ease-in-out',
          collapsed ? 'lg:w-[4.75rem] xl:w-[4.75rem]' : 'lg:w-64 xl:w-72',
          'w-64',
          isOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full lg:translate-x-0'
        )}
      >
        {/* Brand & Workspace Header */}
        <div className="flex h-16 shrink-0 items-center justify-between gap-2 border-b border-line px-3 bg-sidebar">
          <Link href="/" onClick={() => onClose()} className="flex items-center gap-2.5 group min-w-0">
            <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-xl shadow-xs group-hover:scale-105 transition-transform">
              <img
                src="/logo.svg"
                alt="KaamSetu Logo"
                className="h-full w-full object-contain"
              />
            </div>
            <div className={cn('min-w-0', collapsed && 'lg:hidden')}>
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
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={onToggleCollapse}
              title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              className="hidden h-8 w-8 items-center justify-center rounded-lg text-ink-soft hover:bg-hover hover:text-ink lg:flex"
            >
              {collapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-ink-soft hover:bg-hover lg:hidden"
              aria-label="Close sidebar"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* User Identity Card */}
        <div className={cn('border-b border-line bg-subtle/60 p-3.5', collapsed && 'lg:px-2 lg:py-3')}>
          <div className="flex items-center gap-3">
            <div
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-accent-soft text-accent-strong text-xs font-black ring-1 ring-accent/20"
              title={user?.name || 'User'}
            >
              {user?.name?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div className={cn('min-w-0 flex-1', collapsed && 'lg:hidden')}>
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
        <div className={cn('flex-1 overflow-y-auto p-3 space-y-1 [scrollbar-width:thin]', collapsed && 'lg:px-2')}>
          <nav className="space-y-1">
            {currentNav.map((item: NavItem, idx) => {
              const Icon = item.icon;
              let isActive = false;
              if (
                item.href === '/admin/dashboard' ||
                item.href === '/worker/dashboard' ||
                item.href === '/business/dashboard'
              ) {
                isActive = pathname === item.href;
              } else {
                isActive = pathname === item.href || (item.href !== '/jobs' && pathname.startsWith(item.href));
              }

              return (
                <Link
                  key={`${item.href}-${idx}`}
                  href={item.href}
                  onClick={() => onClose()}
                  title={collapsed ? item.label : undefined}
                  className={cn(
                    'group relative flex items-center justify-between rounded-xl px-3 py-2.5 text-xs font-semibold transition-all',
                    collapsed && 'lg:justify-center lg:px-0',
                    isActive
                      ? 'bg-accent text-accent-fg shadow-xs font-bold'
                      : 'text-ink-soft hover:bg-hover hover:text-ink'
                  )}
                >
                  {/* Collapsed rail: active dot marker */}
                  {collapsed && (
                    <span
                      className={cn(
                        'absolute left-0 top-1/2 hidden h-5 w-1 -translate-y-1/2 rounded-r-full transition-all lg:block',
                        isActive ? 'bg-accent' : 'bg-transparent group-hover:bg-line-strong'
                      )}
                      aria-hidden
                    />
                  )}
                  <div className="flex items-center gap-2.5">
                    <Icon
                      className={cn(
                        'h-4 w-4 shrink-0 transition-colors',
                        isActive ? 'text-white' : 'text-muted group-hover:text-ink'
                      )}
                    />
                    <span className={cn('truncate', collapsed && 'lg:hidden')}>{item.label}</span>
                  </div>
                  {isActive && !collapsed ? (
                    <ChevronRight className="h-3.5 w-3.5 text-white/90" />
                  ) : null}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Pinned Bottom Actions: Settings & Logout */}
        <div className={cn('shrink-0 border-t border-line bg-sidebar p-3 mt-auto space-y-1', collapsed && 'lg:px-2')}>
          <button
            onClick={() => {
              onClose();
              logout();
            }}
            title={collapsed ? t.logout : undefined}
            className={cn(
              'flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-bold text-red-600 dark:text-red-400 hover:bg-red-500/10 transition-colors',
              collapsed && 'lg:justify-center lg:px-0'
            )}
          >
            <LogOut className="h-4 w-4 shrink-0" />
            <span className={cn(collapsed && 'lg:hidden')}>{t.logout}</span>
          </button>
        </div>
      </aside>
    </>
  );
}
