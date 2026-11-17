'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import { cn } from '@/lib/cn';
import {
  LayoutDashboard,
  Briefcase,
  FileText,
  User,
  BookOpen,
  Store,
  Package,
  Mic,
  ShieldCheck,
  Users,
  Award,
  Scale,
  Clock,
} from 'lucide-react';
import VoiceAssistantModal from '@/components/VoiceAssistantModal';

interface MobileBottomNavProps {
  role: 'WORKER' | 'BUSINESS_OWNER' | 'ADMIN';
}

export default function MobileBottomNav({ role }: MobileBottomNavProps) {
  const pathname = usePathname();
  const { language } = useApp();
  const [voiceOpen, setVoiceOpen] = useState(false);

  const isHi = language === 'hi';

  if (role === 'WORKER') {
    const items = [
      {
        href: '/worker/dashboard',
        label: isHi ? 'होम' : 'Home',
        icon: LayoutDashboard,
      },
      {
        href: '/worker/work',
        label: isHi ? 'काम' : 'Work',
        icon: Clock,
      },
      {
        href: '/jobs',
        label: isHi ? 'नौकरियां' : 'Jobs',
        icon: Briefcase,
      },
      {
        href: '/worker/applications',
        label: isHi ? 'आवेदन' : 'Applied',
        icon: FileText,
      },
      {
        href: '/worker/profile',
        label: isHi ? 'प्रोफ़ाइल' : 'Profile',
        icon: User,
      },
    ];

    return (
      <nav
        aria-label="Mobile Bottom Navigation"
        className="fixed bottom-0 left-0 right-0 z-40 block border-t border-line bg-surface/95 backdrop-blur-md lg:hidden"
        style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 6px)' }}
      >
        <div className="grid grid-cols-5 items-center px-1 pt-1.5">
          {items.map((item) => {
            const Icon = item.icon;
            const isActive =
              item.href === '/worker/dashboard'
                ? pathname === '/worker/dashboard'
                : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex min-h-[48px] flex-col items-center justify-center rounded-xl py-1 px-1 transition-all',
                  isActive
                    ? 'text-accent font-bold'
                    : 'text-muted hover:text-ink'
                )}
              >
                <div className="relative">
                  <Icon
                    className={cn(
                      'h-5 w-5 transition-transform',
                      isActive ? 'scale-110 stroke-[2.25]' : 'stroke-[1.75]'
                    )}
                  />
                  {isActive && (
                    <span className="absolute -bottom-1 left-1/2 h-1 w-3 -translate-x-1/2 rounded-full bg-accent" />
                  )}
                </div>
                <span className="mt-1 text-[11px] leading-tight tracking-tight">
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    );
  }

  if (role === 'BUSINESS_OWNER') {
    const items = [
      {
        href: '/business/dashboard',
        label: isHi ? 'होम' : 'Home',
        icon: LayoutDashboard,
      },
      {
        href: '/business/udhaar',
        label: isHi ? 'उधार' : 'Udhaar',
        icon: BookOpen,
      },
      {
        href: 'VOICE_ACTION',
        label: isHi ? 'बोलें' : 'Voice',
        icon: Mic,
        isAction: true,
      },
      {
        href: '/business/sales',
        label: isHi ? 'बिलिंग' : 'Sales',
        icon: Store,
      },
      {
        href: '/business/inventory',
        label: isHi ? 'स्टॉक' : 'Stock',
        icon: Package,
      },
    ];

    return (
      <>
        <nav
          aria-label="Mobile Bottom Navigation"
          className="fixed bottom-0 left-0 right-0 z-40 block border-t border-line bg-surface/95 backdrop-blur-md lg:hidden"
          style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 6px)' }}
        >
          <div className="grid grid-cols-5 items-center px-1 pt-1.5">
            {items.map((item) => {
              const Icon = item.icon;

              if (item.isAction) {
                return (
                  <button
                    key="voice-btn"
                    type="button"
                    onClick={() => setVoiceOpen(true)}
                    className="flex min-h-[48px] -translate-y-3 flex-col items-center justify-center"
                    aria-label="Voice Assistant"
                  >
                    <div className="flex h-11 w-11 items-center justify-center rounded-full bg-accent text-accent-fg shadow-lg shadow-accent/40 ring-4 ring-surface active:scale-95 transition-transform">
                      <Mic className="h-5 w-5" />
                    </div>
                    <span className="mt-0.5 text-[10px] font-bold text-ink">
                      {item.label}
                    </span>
                  </button>
                );
              }

              const isActive =
                item.href === '/business/dashboard'
                  ? pathname === '/business/dashboard'
                  : pathname.startsWith(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex min-h-[48px] flex-col items-center justify-center rounded-xl py-1 px-1 transition-all',
                    isActive
                      ? 'text-accent font-bold'
                      : 'text-muted hover:text-ink'
                  )}
                >
                  <div className="relative">
                    <Icon
                      className={cn(
                        'h-5 w-5 transition-transform',
                        isActive ? 'scale-110 stroke-[2.25]' : 'stroke-[1.75]'
                      )}
                    />
                    {isActive && (
                      <span className="absolute -bottom-1 left-1/2 h-1 w-3 -translate-x-1/2 rounded-full bg-accent" />
                    )}
                  </div>
                  <span className="mt-1 text-[11px] leading-tight tracking-tight">
                    {item.label}
                  </span>
                </Link>
              );
            })}
          </div>
        </nav>

        {voiceOpen && (
          <VoiceAssistantModal
            isOpen={voiceOpen}
            onClose={() => setVoiceOpen(false)}
          />
        )}
      </>
    );
  }

  // Admin Bottom Nav - distinct destinations and active indicators
  const [currentTab, setCurrentTab] = useState('overview');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      setCurrentTab(params.get('tab') || 'overview');
    }
  }, [pathname]);

  const adminItems: { href: string; label: string; icon: any; tab?: string }[] = [
    { href: '/admin/dashboard', label: isHi ? 'डैशबोर्ड' : 'Overview', icon: LayoutDashboard, tab: 'overview' },
    { href: '/admin/verification', label: isHi ? 'सत्यापन' : 'Verify', icon: Award },
    { href: '/admin/disputes', label: isHi ? 'विवाद' : 'Disputes', icon: Scale },
    { href: '/admin/dashboard?tab=users', label: isHi ? 'यूज़र्स' : 'Users', icon: Users, tab: 'users' },
    { href: '/admin/dashboard?tab=jobs', label: isHi ? 'जॉब्स' : 'Jobs', icon: Briefcase, tab: 'jobs' },
  ];

  if (role === 'ADMIN') {
    return (
      <nav
        aria-label="Mobile Bottom Navigation"
        className="fixed bottom-0 left-0 right-0 z-40 block border-t border-line bg-surface/95 backdrop-blur-md lg:hidden"
        style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 6px)' }}
      >
        <div className="grid grid-cols-5 items-center px-1 pt-1.5">
          {adminItems.map((item) => {
            const Icon = item.icon;
            const isActive = item.tab
              ? pathname === '/admin/dashboard' && currentTab === item.tab
              : pathname === item.href;

            return (
              <Link
                key={item.label}
                href={item.href}
                className={cn(
                  'flex min-h-[48px] flex-col items-center justify-center rounded-xl py-1 px-0.5 transition-all',
                  isActive
                    ? 'text-accent font-bold'
                    : 'text-muted hover:text-ink'
                )}
              >
                <div className="relative">
                  <Icon
                    className={cn(
                      'h-5 w-5 transition-transform',
                      isActive ? 'scale-110 stroke-[2.25]' : 'stroke-[1.75]'
                    )}
                  />
                  {isActive && (
                    <span className="absolute -bottom-1 left-1/2 h-1 w-3 -translate-x-1/2 rounded-full bg-accent" />
                  )}
                </div>
                <span className="mt-1 text-[10px] leading-tight tracking-tight truncate max-w-full text-center">
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    );
  }

  return null;
}
