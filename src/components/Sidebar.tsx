'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import {
  LayoutDashboard,
  User,
  Briefcase,
  FileText,
  Package,
  BookOpen,
  Store,
  Users,
  Bell,
  PlusCircle,
} from 'lucide-react';

interface SidebarProps {
  role: 'WORKER' | 'BUSINESS_OWNER' | 'ADMIN';
}

export default function Sidebar({ role }: SidebarProps) {
  const pathname = usePathname();
  const { t } = useApp();

  const workerItems = [
    { href: '/worker/dashboard', label: t.dashboard, icon: LayoutDashboard },
    { href: '/worker/profile', label: t.profile, icon: User },
    { href: '/jobs', label: t.jobs, icon: Briefcase },
    { href: '/worker/applications', label: t.applications, icon: FileText },
    { href: '/worker/notifications', label: t.notifications, icon: Bell },
  ];

  const businessItems = [
    { href: '/business/dashboard', label: t.dashboard, icon: LayoutDashboard },
    { href: '/business/inventory', label: t.inventory, icon: Package },
    { href: '/business/customers', label: t.customers, icon: Users },
    { href: '/business/udhaar', label: t.udhaar, icon: BookOpen },
    { href: '/business/sales', label: t.sales, icon: Store },
    { href: '/business/jobs', label: 'Hire Workers (Jobs)', icon: Briefcase },
    { href: '/business/jobs/create', label: 'Post New Job', icon: PlusCircle },
    { href: '/business/notifications', label: t.notifications, icon: Bell },
  ];

  const items = role === 'WORKER' ? workerItems : businessItems;

  return (
    <aside className="w-full lg:w-64 bg-white border-r border-slate-200 lg:min-h-[calc(100vh-4rem)] p-4 shrink-0">
      <div className="space-y-1">
        <p className="px-3 text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
          {role === 'WORKER' ? t.workerRole : t.businessRole}
        </p>
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                isActive
                  ? 'bg-teal-600 text-white font-semibold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
              }`}
            >
              <Icon className={`h-4 w-4 ${isActive ? 'text-white' : 'text-teal-600'}`} />
              {item.label}
            </Link>
          );
        })}
      </div>
    </aside>
  );
}
