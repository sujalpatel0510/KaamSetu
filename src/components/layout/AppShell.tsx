'use client';

import React, { useState } from 'react';
import { usePathname } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import AppSidebar from '@/components/layout/AppSidebar';
import AppHeader from '@/components/layout/AppHeader';
import MobileBottomNav from '@/components/layout/MobileBottomNav';

interface AppShellProps {
  children: React.ReactNode;
  forcedRole?: 'WORKER' | 'BUSINESS_OWNER' | 'ADMIN';
}

export default function AppShell({ children, forcedRole }: AppShellProps) {
  const { user } = useApp();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Derive active role from URL or user context
  let role: 'WORKER' | 'BUSINESS_OWNER' | 'ADMIN' = 'WORKER';

  if (forcedRole) {
    role = forcedRole;
  } else if (pathname.startsWith('/business')) {
    role = 'BUSINESS_OWNER';
  } else if (pathname.startsWith('/admin')) {
    role = 'ADMIN';
  } else if (pathname.startsWith('/worker')) {
    role = 'WORKER';
  } else if (user?.role === 'BUSINESS_OWNER') {
    role = 'BUSINESS_OWNER';
  } else if (user?.role === 'ADMIN') {
    role = 'ADMIN';
  }

  return (
    <div className="min-h-[100dvh] w-full max-w-full overflow-x-hidden bg-canvas text-ink antialiased selection:bg-accent selection:text-accent-fg">
      {/* Sidebar - Permanently fixed full-height on desktop, off-canvas on mobile */}
      <AppSidebar
        role={role}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Main Content Area spanning the full remaining width */}
      <div className="flex min-h-[100dvh] w-full max-w-full min-w-0 flex-col overflow-x-hidden lg:pl-64 xl:pl-72 transition-[padding] duration-200">
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
