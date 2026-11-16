'use client';

import React from 'react';

interface DashboardShellProps {
  role?: 'WORKER' | 'BUSINESS_OWNER' | 'ADMIN';
  children: React.ReactNode;
  /** Kept for backwards-compatibility; layout now intelligently uses full width */
  maxWidth?: string;
  className?: string;
}

/**
 * Modern Full-Width Dashboard Content Container.
 * The outer AppShell already provides the role sidebar, top header, and mobile bottom nav.
 * This container ensures content spans the full available width with clean responsive padding and zero artificial clamping.
 */
export default function DashboardShell({
  children,
  className = '',
}: DashboardShellProps) {
  return (
    <div className={`w-full max-w-full min-w-0 overflow-x-hidden space-y-5 lg:space-y-6 ${className}`}>
      {children}
    </div>
  );
}
