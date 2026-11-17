'use client';

import React, { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import { cn } from '@/lib/cn';
import AppSidebar from '@/components/layout/AppSidebar';
import AppHeader from '@/components/layout/AppHeader';
import MobileBottomNav from '@/components/layout/MobileBottomNav';

interface AppShellProps {
  children: React.ReactNode;
  forcedRole?: 'WORKER' | 'BUSINESS_OWNER' | 'ADMIN';
}

export default function AppShell({ children, forcedRole }: AppShellProps) {
  const { user, isLoading } = useApp();
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Persist the desktop sidebar rail preference (desktop-only feature).
  useEffect(() => {
    try {
      setSidebarCollapsed(localStorage.getItem('kaamsetu_sidebar_collapsed') === '1');
    } catch {
      /* private mode */
    }
  }, []);

  const toggleSidebarCollapsed = () => {
    setSidebarCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('kaamsetu_sidebar_collapsed', next ? '1' : '0');
      } catch {
        /* private mode */
      }
      return next;
    });
  };

  // Strict Role-Based Access Control (RBAC) navigation guard
  useEffect(() => {
    if (isLoading) return;
    if (!user) {
      if (
        pathname.startsWith('/worker') ||
        pathname.startsWith('/business') ||
        pathname.startsWith('/admin')
      ) {
        router.replace('/login');
      }
      return;
    }

    if (pathname.startsWith('/admin') && user.role !== 'ADMIN') {
      router.replace(user.role === 'BUSINESS_OWNER' ? '/business/dashboard' : '/worker/dashboard');
    } else if (pathname.startsWith('/business') && user.role !== 'BUSINESS_OWNER' && user.role !== 'ADMIN') {
      router.replace('/worker/dashboard');
    } else if (pathname.startsWith('/worker') && user.role !== 'WORKER' && user.role !== 'ADMIN') {
      router.replace('/business/dashboard');
    }
  }, [user, isLoading, pathname, router]);

  // Derive role prioritizing authenticated user profile, with graceful fallback
  const role: 'WORKER' | 'BUSINESS_OWNER' | 'ADMIN' =
    forcedRole ||
    (user?.role as any) ||
    (pathname.startsWith('/admin')
      ? 'ADMIN'
      : pathname.startsWith('/business')
      ? 'BUSINESS_OWNER'
      : 'WORKER');

  return (
    <div className="min-h-[100dvh] w-full max-w-full overflow-x-hidden bg-canvas text-ink antialiased selection:bg-accent selection:text-accent-fg">
      {/* Sidebar - Permanently fixed full-height on desktop, off-canvas on mobile */}
      <AppSidebar
        role={role}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        collapsed={sidebarCollapsed}
        onToggleCollapse={toggleSidebarCollapsed}
      />

      {/* Main Content Area spanning the full remaining width */}
      <div
        className={cn(
          'flex min-h-[100dvh] w-full max-w-full min-w-0 flex-col overflow-x-hidden transition-[padding] duration-200',
          sidebarCollapsed ? 'lg:pl-[4.75rem] xl:pl-[4.75rem]' : 'lg:pl-64 xl:pl-72'
        )}
      >
        {/* Sticky App Header */}
        <AppHeader
          role={role}
          onToggleSidebar={() => setSidebarOpen((prev) => !prev)}
        />

        {/* Dynamic Edge-to-Edge Main Canvas */}
        <main
          id="main-app-content"
          className="flex-1 w-full max-w-full min-w-0 overflow-x-hidden px-4 sm:px-6 lg:px-8 py-5 pb-24 lg:pb-10"
        >
          {children}
        </main>
      </div>

      {/* Dedicated Mobile Sticky Bottom Bar */}
      <MobileBottomNav role={role} />
    </div>
  );
}
