'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import DashboardShell from '@/components/DashboardShell';
import StatCard from '@/components/ui/StatCard';
import EmptyState from '@/components/ui/EmptyState';
import { ApplicationStatusBadge, PaymentMethodBadge } from '@/components/ui/Badge';
import { DashboardSkeleton } from '@/components/ui/Skeleton';
import { formatTime } from '@/lib/date';
import { cn } from '@/lib/cn';
import {
  DollarSign,
  Package,
  AlertTriangle,
  BookOpen,
  Store,
  ArrowRight,
  Users,
  TrendingUp,
  Briefcase,
  Phone,
  MapPin,
  CheckCircle2,
  Settings,
  UserCheck,
} from 'lucide-react';

interface DashboardData {
  business?: {
    id: string;
    name: string;
    category: string;
    city: string;
    locality: string;
  };
  stats: {
    todaysSalesAmount: number;
    todaysSalesCount: number;
    totalSalesAmount: number;
    totalSalesCount: number;
    monthlySalesAmount?: number;
    totalPurchasesAmount?: number;
    totalPurchasesCount?: number;
    totalProducts: number;
    lowStockCount: number;
    totalCustomers: number;
    totalOutstandingCredit: number;
    totalOutstandingUdhaar?: number;
    activeJobsCount: number;
  };
  lowStockProducts: {
    id: string;
    name: string;
    category: string;
    stockQuantity: number;
    lowStockThreshold: number;
  }[];
  recentSales: {
    id: string;
    totalAmount: number;
    paymentMethod: string;
    paymentStatus: string;
    createdAt: string;
    customer?: { name: string; phone?: string | null } | null;
  }[];
  recentApplications: {
    id: string;
    status: string;
    appliedAt: string;
    job: { title: string };
    worker: {
      user: { name: string; phone: string };
    };
  }[];
  last7DaysSales?: {
    totalAmount: number;
    createdAt: string;
  }[];
}

export default function BusinessDashboardPage() {
  const router = useRouter();
  const { user, isLoading, t, language } = useApp();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  const isHi = language === 'hi';

  useEffect(() => {
    if (!isLoading && (!user || user.role !== 'BUSINESS_OWNER')) {
      if (user?.role === 'WORKER') {
        router.push('/worker/dashboard');
      } else if (!user) {
        router.push('/login');
      }
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    if (user?.role === 'BUSINESS_OWNER') {
      fetch('/api/business/dashboard')
        .then((res) => res.json())
        .then((resData) => {
          if (resData.stats) setData(resData);
        })
        .catch(() => {})
        .finally(() => setLoading(false));
    }
  }, [user]);

  if (isLoading || loading) {
    return (
      <DashboardShell role="BUSINESS_OWNER">
        <DashboardSkeleton cards={4} />
      </DashboardShell>
    );
  }

  const stats = data?.stats;

  /* Payment-method breakdown derived from real recent sales */
  const methodCounts = (data?.recentSales || []).reduce<Record<string, number>>(
    (acc, s) => {
      acc[s.paymentMethod] = (acc[s.paymentMethod] || 0) + 1;
      return acc;
    },
    {}
  );
  const totalRecent = data?.recentSales?.length || 1;

  return (
    <DashboardShell role="BUSINESS_OWNER">
      {/* ───────────────────────────────────────────────────────────
          MODULE 1: Welcome Header with Business Name & Info
         ─────────────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-2xl border border-line bg-surface p-5 sm:p-7 shadow-card">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div className="space-y-1 min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-md bg-accent-soft px-2 py-0.5 text-[10px] font-bold text-accent-strong uppercase">
                <Store className="h-3 w-3" />
                {data?.business?.category || user?.business?.category || 'Retail'}
              </span>
              <span className="flex items-center gap-1 text-[11px] text-muted font-medium">
                <MapPin className="h-3 w-3 text-faint" />
                {data?.business?.locality || user?.business?.locality || 'Gujarat'}, {data?.business?.city || user?.business?.city || 'India'}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-ink">
              {data?.business?.name || user?.business?.name || t.appName}
            </h1>
            <p className="text-xs sm:text-sm text-muted">
              {t.welcomeBack}, <strong className="text-ink">{user?.name}</strong>. {t.tagline}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-green-500/10 px-3 py-1 text-xs font-bold text-green-700 dark:text-green-400 ring-1 ring-green-500/20">
              <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
              {isHi ? 'दुकान सक्रिय है' : 'Store Active & Open'}
            </span>
            <Link
              href="/business/settings"
              className="inline-flex items-center gap-1.5 rounded-xl border border-line bg-subtle px-3 py-1 text-xs font-bold text-ink-soft hover:bg-hover hover:text-ink transition-colors"
            >
              <Settings className="h-3.5 w-3.5 text-accent" />
              <span>{isHi ? 'प्रोफ़ाइल संपादित करें' : 'Edit Profile'}</span>
            </Link>
          </div>
        </div>
      </div>

      {/* ───────────────────────────────────────────────────────────
          MODULE 2: Quick Action Buttons
         ─────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
        <Link
          href="/business/sales"
          className="group flex items-center justify-between rounded-xl border border-line bg-surface p-3 sm:p-4 shadow-xs hover:border-accent hover:bg-hover transition-all min-w-0"
        >
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl bg-accent text-accent-fg shadow-xs group-hover:scale-105 transition-transform shrink-0">
              <Store className="h-4.5 w-4.5 sm:h-5 sm:w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-ink group-hover:text-accent transition-colors leading-snug break-words">
                {t.addSale}
              </p>
              <p className="text-[10px] text-muted truncate">{isHi ? 'नया बिल बनाएं' : 'Generate POS Bill'}</p>
            </div>
          </div>
          <ArrowRight className="h-4 w-4 text-muted group-hover:text-accent group-hover:translate-x-0.5 transition-all shrink-0 hidden 2xl:block" />
        </Link>

        <Link
          href="/business/inventory"
          className="group flex items-center justify-between rounded-xl border border-line bg-surface p-3 sm:p-4 shadow-xs hover:border-accent hover:bg-hover transition-all min-w-0"
        >
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl bg-green-600 text-white shadow-xs group-hover:scale-105 transition-transform shrink-0">
              <Package className="h-4.5 w-4.5 sm:h-5 sm:w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-ink group-hover:text-green-600 transition-colors leading-snug break-words">
                {t.addProduct}
              </p>
              <p className="text-[10px] text-muted truncate">{isHi ? 'स्टॉक जोड़ें' : 'Update Stock'}</p>
            </div>
          </div>
          <ArrowRight className="h-4 w-4 text-muted group-hover:text-green-600 group-hover:translate-x-0.5 transition-all shrink-0 hidden 2xl:block" />
        </Link>

        <Link
          href="/business/customers"
          className="group flex items-center justify-between rounded-xl border border-line bg-surface p-3 sm:p-4 shadow-xs hover:border-accent hover:bg-hover transition-all min-w-0"
        >
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl bg-brand-600 text-white shadow-xs group-hover:scale-105 transition-transform shrink-0">
              <Users className="h-4.5 w-4.5 sm:h-5 sm:w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-ink group-hover:text-accent transition-colors leading-snug break-words">
                {t.addCustomer}
              </p>
              <p className="text-[10px] text-muted truncate">{isHi ? 'खाता खोलें' : 'Open Account'}</p>
            </div>
          </div>
          <ArrowRight className="h-4 w-4 text-muted group-hover:text-accent group-hover:translate-x-0.5 transition-all shrink-0 hidden 2xl:block" />
        </Link>

        <Link
          href="/business/jobs/create"
          className="group flex items-center justify-between rounded-xl border border-line bg-surface p-3 sm:p-4 shadow-xs hover:border-accent hover:bg-hover transition-all min-w-0"
        >
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl bg-brand-700 text-white shadow-xs group-hover:scale-105 transition-transform shrink-0">
              <Briefcase className="h-4.5 w-4.5 sm:h-5 sm:w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-ink group-hover:text-accent transition-colors leading-snug break-words">
                {t.postJob}
              </p>
              <p className="text-[10px] text-muted truncate">{isHi ? 'कारीगर भर्ती' : 'Hire Workers'}</p>
            </div>
          </div>
          <ArrowRight className="h-4 w-4 text-muted group-hover:text-accent group-hover:translate-x-0.5 transition-all shrink-0 hidden 2xl:block" />
        </Link>

        <Link
          href="/business/work?action=assign"
          className="group flex items-center justify-between rounded-xl border border-line bg-surface p-3 sm:p-4 shadow-xs hover:border-purple-600 hover:bg-hover transition-all min-w-0 col-span-2 sm:col-span-1"
        >
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl bg-purple-600 text-white shadow-xs group-hover:scale-105 transition-transform shrink-0">
              <UserCheck className="h-4.5 w-4.5 sm:h-5 sm:w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-ink group-hover:text-purple-600 transition-colors leading-snug break-words">
                {t.assignWork}
              </p>
              <p className="text-[10px] text-muted truncate">{isHi ? 'काम सौंपें' : 'Assign Work'}</p>
            </div>
          </div>
          <ArrowRight className="h-4 w-4 text-muted group-hover:text-purple-600 group-hover:translate-x-0.5 transition-all shrink-0 hidden 2xl:block" />
        </Link>
      </div>

      {/* ───────────────────────────────────────────────────────────
          MODULE 3: Important Business Metrics (6 Meaningful Cards)
         ─────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6 sm:gap-4">
        <StatCard
          icon={DollarSign}
          label={t.todaysSales}
          value={stats?.todaysSalesAmount || 0}
          currency
          tone="emerald"
          hint={`${stats?.todaysSalesCount || 0} ${t.billsToday}`}
        />
        <StatCard
          icon={TrendingUp}
          label={isHi ? 'मासिक बिक्री' : 'Monthly Sales'}
          value={stats?.monthlySalesAmount ?? stats?.totalSalesAmount ?? 0}
          currency
          tone="brand"
          hint={`${stats?.totalSalesCount || 0} ${t.totalRecordedSales}`}
        />
        <StatCard
          icon={BookOpen}
          label={t.outstandingUdhaar}
          value={stats?.totalOutstandingCredit ?? stats?.totalOutstandingUdhaar ?? 0}
          currency
          tone="amber"
          hint={`${stats?.totalCustomers || 0} ${t.acrossCustomers}`}
        />
        <StatCard
          icon={Users}
          label={t.totalCustomers}
          value={stats?.totalCustomers || 0}
          tone="brand"
          hint={isHi ? 'संबद्ध ग्राहक' : 'Active Client Directory'}
        />
        <StatCard
          icon={Package}
          label={t.lowStockItems}
          value={stats?.lowStockCount || 0}
          tone="red"
          hint={
            stats?.lowStockCount && stats.lowStockCount > 0 ? (
              <span className="font-bold text-red-600 dark:text-red-400">
                {stats.lowStockCount} {t.itemsNeedRestock}
              </span>
            ) : (
              <span className="text-muted">{isHi ? 'स्टॉक सामान्य है' : 'Inventory Healthy'}</span>
            )
          }
        />
        <StatCard
          icon={Store}
          label={isHi ? 'हालिया खरीदारी' : 'Recent Purchases'}
          value={stats?.totalPurchasesCount || 0}
          tone="brand"
          hint={
            stats?.totalPurchasesAmount && stats.totalPurchasesAmount > 0
              ? `₹${stats.totalPurchasesAmount.toLocaleString()} ${isHi ? 'स्टॉक मूल्य' : 'restock'}`
              : (isHi ? 'सप्लायर बिल' : 'Supplier bills')
          }
        />
      </div>

      {/* ───────────────────────────────────────────────────────────
          MODULE 4 & 5: Sales Performance Chart & Inventory Alerts
         ─────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Module 4: Sales Performance & 7-Day Trend Chart (7 cols on lg) */}
        <div className="ks-card p-6 lg:col-span-7 space-y-5">
          <div className="flex items-center justify-between border-b border-line pb-3">
            <div>
              <h2 className="text-sm font-bold text-ink">
                {isHi ? 'बिक्री रुझान व भुगतान विश्लेषण' : 'Sales Trends & Payment Analysis'}
              </h2>
              <p className="text-[11px] text-muted">
                {isHi ? 'पिछले 7 दिनों की वास्तविक बिक्री व भुगतान माध्यम' : 'Past 7 days revenue flow and tender methods'}
              </p>
            </div>
            <Link
              href="/business/sales"
              className="text-xs font-bold text-accent hover:underline flex items-center gap-1"
            >
              <span>{t.viewAll}</span>
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          {/* 7-Day Visual Sales Bars (100% Real DB Data) */}
          <div className="pt-2">
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted mb-2">
              {isHi ? '7-दिवसीय दैनिक बिक्री (रु.)' : '7-Day Revenue Velocity (₹)'}
            </p>
            {(() => {
              // Group last 7 days
              const days = Array.from({ length: 7 }, (_, i) => {
                const d = new Date();
                d.setDate(d.getDate() - (6 - i));
                const key = d.toISOString().slice(0, 10);
                const dayLabel = d.toLocaleDateString(language === 'hi' ? 'hi-IN' : 'en-US', {
                  weekday: 'short',
                });
                return { key, dayLabel, total: 0 };
              });

              (data?.last7DaysSales || []).forEach((s) => {
                const k = s.createdAt.slice(0, 10);
                const match = days.find((d) => d.key === k);
                if (match) match.total += Number(s.totalAmount || 0);
              });

              const maxVal = Math.max(...days.map((d) => d.total), 1);

              return (
                <div className="flex items-end justify-between gap-2 h-28 pt-4 pb-1 border-b border-line">
                  {days.map((d, i) => {
                    const heightPercent = Math.max(10, Math.round((d.total / maxVal) * 100));
                    const isToday = i === 6;
                    return (
                      <div key={d.key} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end group">
                        <span className="text-[9px] font-bold text-muted group-hover:text-accent transition-colors opacity-0 group-hover:opacity-100">
                          ₹{d.total > 1000 ? `${(d.total / 1000).toFixed(1)}k` : d.total}
                        </span>
                        <div
                          style={{ height: `${heightPercent}%` }}
                          className={cn(
                            'w-full max-w-[28px] rounded-t-lg transition-all duration-300',
                            isToday
                              ? 'bg-[#163A35] dark:bg-[#B7D86B]'
                              : 'bg-[#B7D86B] dark:bg-[#294139] group-hover:bg-[#163A35] dark:group-hover:bg-[#B7D86B]'
                          )}
                          title={`${d.dayLabel} (${d.key}): ₹${d.total.toLocaleString()}`}
                        />
                        <span className={cn('text-[10px] font-bold', isToday ? 'text-accent' : 'text-muted')}>
                          {d.dayLabel}
                        </span>
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </div>

          {/* Visual Percentage Distribution Bar */}
          <div className="space-y-2 pt-1">
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted">
              {t.salesByPaymentMethod}
            </p>
            <div
              className="flex h-3.5 w-full overflow-hidden rounded-full bg-subtle"
              role="img"
              aria-label="Payment method breakdown"
            >
              <div
                style={{ width: `${((methodCounts.CASH || 0) / totalRecent) * 100}%` }}
                className="bg-green-600 transition-all duration-500"
                title={`Cash: ${methodCounts.CASH || 0}`}
              />
              <div
                style={{ width: `${((methodCounts.UPI || 0) / totalRecent) * 100}%` }}
                className="bg-[#163A35] dark:bg-[#B7D86B] transition-all duration-500"
                title={`UPI: ${methodCounts.UPI || 0}`}
              />
              <div
                style={{ width: `${((methodCounts.CREDIT || 0) / totalRecent) * 100}%` }}
                className="bg-[#C66A45] transition-all duration-500"
                title={`Credit: ${methodCounts.CREDIT || 0}`}
              />
            </div>
          </div>

          {/* Legend Strip with Real Counts & Percentages */}
          <div className="grid grid-cols-3 gap-2 sm:gap-3 pt-2 text-xs">
            <div className="rounded-xl border border-line bg-subtle/50 p-2 sm:p-3 min-w-0">
              <div className="flex items-center gap-1.5 text-green-700 dark:text-green-400 font-bold text-[11px] truncate">
                <span className="h-2 w-2 rounded-full bg-green-600 shrink-0" />
                <span className="truncate">{t.cashSales}</span>
              </div>
              <p className="mt-1 text-base font-black text-ink tabular-nums">{methodCounts.CASH || 0}</p>
              <p className="text-[10px] text-muted truncate">
                {Math.round(((methodCounts.CASH || 0) / totalRecent) * 100)}% {isHi ? 'कुल बिल' : 'of bills'}
              </p>
            </div>

            <div className="rounded-xl border border-line bg-subtle/50 p-2 sm:p-3 min-w-0">
              <div className="flex items-center gap-1.5 text-[#163A35] dark:text-[#B7D86B] font-bold text-[11px] truncate">
                <span className="h-2 w-2 rounded-full bg-[#163A35] dark:bg-[#B7D86B] shrink-0" />
                <span className="truncate">{t.upiSales}</span>
              </div>
              <p className="mt-1 text-base font-black text-ink tabular-nums">{methodCounts.UPI || 0}</p>
              <p className="text-[10px] text-muted truncate">
                {Math.round(((methodCounts.UPI || 0) / totalRecent) * 100)}% {isHi ? 'कुल बिल' : 'of bills'}
              </p>
            </div>

            <div className="rounded-xl border border-line bg-subtle/50 p-2 sm:p-3 min-w-0">
              <div className="flex items-center gap-1.5 text-[#C66A45] font-bold text-[11px] truncate">
                <span className="h-2 w-2 rounded-full bg-[#C66A45] shrink-0" />
                <span className="truncate">{t.creditSales}</span>
              </div>
              <p className="mt-1 text-base font-black text-ink tabular-nums">{methodCounts.CREDIT || 0}</p>
              <p className="text-[10px] text-muted truncate">
                {Math.round(((methodCounts.CREDIT || 0) / totalRecent) * 100)}% {isHi ? 'कुल बिल' : 'of bills'}
              </p>
            </div>
          </div>
        </div>

        {/* Module 5: Inventory Alerts (5 cols on lg) */}
        <div className="ks-card p-6 lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between border-b border-line pb-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />
              <h2 className="text-sm font-bold text-ink">{t.inventoryAlerts}</h2>
            </div>
            <Link
              href="/business/inventory"
              className="text-xs font-bold text-accent hover:underline flex items-center gap-1"
            >
              <span>{t.viewAll}</span>
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          {(!data?.lowStockProducts || data.lowStockProducts.length === 0) ? (
            <div className="flex flex-col items-center justify-center p-6 text-center text-xs text-muted">
              <CheckCircle2 className="h-8 w-8 text-green-500 mb-2" />
              <p className="font-bold text-ink">{isHi ? 'स्टॉक सुरक्षित है' : 'Inventory Healthy'}</p>
              <p className="text-[11px] text-muted mt-1">{t.noInventoryAlerts}</p>
            </div>
          ) : (
            <div className="divide-y divide-line max-h-60 overflow-y-auto [scrollbar-width:thin]">
              {data.lowStockProducts.slice(0, 4).map((p) => (
                <div key={p.id} className="flex items-center justify-between py-2.5 text-xs">
                  <div>
                    <p className="font-bold text-ink">{p.name}</p>
                    <p className="text-[10px] text-muted">
                      {p.category} • {t.threshold}: {p.lowStockThreshold}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="rounded-md bg-red-500/10 px-2 py-0.5 text-[10px] font-black text-red-700 dark:text-red-400 ring-1 ring-red-500/20">
                      {p.stockQuantity} {t.inStockCount}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ───────────────────────────────────────────────────────────
          MODULE 6 & 7: Recent Transactions & Outstanding Udhaar
         ─────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Module 6: Recent Transactions (7 cols on lg) */}
        <div className="ks-card p-6 lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between border-b border-line pb-3">
            <h2 className="text-sm font-bold text-ink">{t.recentTransactions}</h2>
            <Link
              href="/business/sales"
              className="text-xs font-bold text-accent hover:underline flex items-center gap-1"
            >
              <span>{t.viewAll}</span>
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          {(!data?.recentSales || data.recentSales.length === 0) ? (
            <EmptyState
              icon={Store}
              title={t.noSalesYet}
              description={t.noSalesDesc}
              action={
                <Link href="/business/sales" className="ks-btn ks-btn-primary ks-btn-sm">
                  {t.addSale}
                </Link>
              }
              className="border-dashed shadow-none"
            />
          ) : (
            <div className="divide-y divide-line">
              {data.recentSales.slice(0, 5).map((sale) => (
                <div key={sale.id} className="flex items-center justify-between py-3 text-xs">
                  <div className="min-w-0">
                    <p className="font-bold text-ink truncate">
                      {sale.customer?.name || t.counterWalkIn}
                    </p>
                    <p className="text-[10px] text-muted">
                      {formatTime(sale.createdAt)}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <p className="font-black text-ink tabular-nums text-sm">
                      ₹{Number(sale.totalAmount).toLocaleString('en-IN')}
                    </p>
                    <PaymentMethodBadge method={sale.paymentMethod} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Module 7: Outstanding Udhaar Summary (5 cols on lg) */}
        <div className="ks-card p-6 lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between border-b border-line pb-3">
            <h2 className="text-sm font-bold text-ink">{t.outstandingUdhaarSummary}</h2>
            <Link
              href="/business/udhaar"
              className="text-xs font-bold text-accent hover:underline flex items-center gap-1"
            >
              <span>{t.viewAll}</span>
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          <div className="rounded-2xl border border-line bg-subtle/70 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted">{t.totalMarketCredit}</span>
              <span className="text-lg font-black text-amber-700 dark:text-amber-400 tabular-nums">
                ₹{Number(stats?.totalOutstandingCredit ?? stats?.totalOutstandingUdhaar ?? 0).toLocaleString('en-IN')}
              </span>
            </div>
            <div className="flex items-center justify-between border-t border-line pt-2 text-[11px] text-muted">
              <span>{isHi ? 'पंजीकृत ग्राहक संख्या' : 'Registered Khata Accounts'}</span>
              <span className="font-bold text-ink">{stats?.totalCustomers || 0}</span>
            </div>
          </div>

          <div className="flex flex-col gap-2 pt-1">
            <Link
              href="/business/udhaar"
              className="ks-btn ks-btn-primary w-full justify-center"
            >
              <BookOpen className="h-4 w-4" />
              <span>{isHi ? 'बहीखाता खोलें' : 'Open Udhaar Book'}</span>
            </Link>
            <Link
              href="/business/customers"
              className="ks-btn ks-btn-secondary w-full justify-center text-xs"
            >
              <Users className="h-3.5 w-3.5" />
              <span>{t.customers}</span>
            </Link>
          </div>
        </div>
      </div>

      {/* ───────────────────────────────────────────────────────────
          MODULE 8: Recent Job Applications
         ─────────────────────────────────────────────────────────── */}
      <div className="ks-card p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-line pb-3">
          <div>
            <h2 className="text-sm font-bold text-ink">{t.recentApplications}</h2>
            <p className="text-[11px] text-muted">
              {stats?.activeJobsCount || 0} {isHi ? 'सक्रिय नौकरियां लाइव हैं' : 'Active job postings live'}
            </p>
          </div>
          <Link
            href="/business/jobs"
            className="text-xs font-bold text-accent hover:underline flex items-center gap-1"
          >
            <span>{t.viewAll}</span>
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>

        {(!data?.recentApplications || data.recentApplications.length === 0) ? (
          <EmptyState
            icon={Users}
            title={t.noApplicationsYet}
            description={t.noApplicationsDesc}
            action={
              <Link href="/business/jobs/create" className="ks-btn ks-btn-primary ks-btn-sm">
                + {t.postJob}
              </Link>
            }
            className="border-dashed shadow-none"
          />
        ) : (
          <div className="divide-y divide-line">
            {data.recentApplications.map((app) => (
              <div
                key={app.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between py-3 gap-2 text-xs"
              >
                <div>
                  <p className="font-bold text-ink text-sm">{app.worker.user.name}</p>
                  <p className="text-[11px] text-muted">
                    {t.appliedFor}: <strong className="text-accent">{app.job.title}</strong>
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <ApplicationStatusBadge status={app.status} />
                  {app.worker.user.phone && (
                    <a
                      href={`tel:${app.worker.user.phone}`}
                      className="inline-flex items-center gap-1 rounded-lg border border-line bg-subtle px-2.5 py-1 text-xs font-bold text-ink hover:bg-hover"
                    >
                      <Phone className="h-3 w-3 text-green-600" />
                      <span>{isHi ? 'कॉल करें' : 'Call'}</span>
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
