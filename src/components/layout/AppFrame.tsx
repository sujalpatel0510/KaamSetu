'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import AppShell from '@/components/layout/AppShell';

interface AppFrameProps {
  children: React.ReactNode;
}

export default function AppFrame({ children }: AppFrameProps) {
  const pathname = usePathname();

  // Route-based layout branching
  const isInternalApp =
    pathname.startsWith('/worker') ||
    pathname.startsWith('/business') ||
    pathname.startsWith('/admin');

  if (isInternalApp) {
    return <AppShell>{children}</AppShell>;
  }

  // Public Marketing & Job Board Layout
  return (
    <div className="flex min-h-[100dvh] w-full flex-col bg-canvas text-ink">
      <Navbar />
      <main id="main-content" className="flex-1 w-full">
        {children}
      </main>
      <Footer />
    </div>
  );
}
