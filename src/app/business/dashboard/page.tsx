'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import Sidebar from '@/components/Sidebar';
import {
  DollarSign,
  Package,
  AlertTriangle,
  Users,
  BookOpen,
  Briefcase,
  Store,
  Plus,
  ArrowRight,
  TrendingUp,
  Mic,
  Clock,
} from 'lucide-react';

interface DashboardData {
  business: {
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
    totalProducts: number;
    lowStockCount: number;
    totalCustomers: number;
    totalOutstandingCredit: number;
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
    customer?: { name: string } | null;
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
}

export default function BusinessDashboardPage() {
  const router = useRouter();
  const { user, t, isLoading } = useApp();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

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

  if (loading) {
    return (
      <div className="flex flex-col lg:flex-row min-h-[calc(100vh-4rem)] bg-slate-50">
        <Sidebar role="BUSINESS_OWNER" />
        <main className="flex-1 p-8 text-center text-slate-400">Loading business dashboard...</main>
      </div>
    );
  }

  const stats = data?.stats;

  return (
    <div className="flex flex-col lg:flex-row min-h-[calc(100vh-4rem)] bg-slate-50">
      <Sidebar role="BUSINESS_OWNER" />

      <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl">
        {/* Welcome Banner */}
        <div className="rounded-3xl bg-gradient-to-r from-amber-700 via-amber-800 to-amber-950 p-6 sm:p-8 text-white shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-amber-200">
              Shop & Business Hub
            </span>
            <h1 className="text-2xl sm:text-3xl font-black mt-1">
              {data?.business.name || 'My Business'}
            </h1>
            <p className="text-xs sm:text-sm text-amber-100 mt-1">
              {data?.business.locality}, {data?.business.city} • Category: {data?.business.category}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <Link
              href="/business/sales"
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white text-slate-900 font-bold text-xs shadow-md hover:bg-amber-50 transition-colors"
            >
              <Store className="h-4 w-4 text-amber-600" />
              New Sale (Bill)
            </Link>
            <Link
              href="/business/udhaar"
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md transition-colors"
            >
              <BookOpen className="h-4 w-4" />
              Udhaar Book
            </Link>
          </div>
        </div>

        {/* Real KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <span className="text-xs font-bold text-slate-500 uppercase">{t.todaysSales}</span>
            <p className="text-2xl font-black text-emerald-700 mt-1">
              ₹{(stats?.todaysSalesAmount || 0).toLocaleString()}
            </p>
            <p className="text-[11px] text-slate-400 mt-1">
              {stats?.todaysSalesCount || 0} bills today
            </p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <span className="text-xs font-bold text-slate-500 uppercase">{t.totalSales}</span>
            <p className="text-2xl font-black text-slate-900 mt-1">
              ₹{(stats?.totalSalesAmount || 0).toLocaleString()}
            </p>
            <p className="text-[11px] text-slate-400 mt-1">
              {stats?.totalSalesCount || 0} total sales recorded
            </p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-amber-200 bg-amber-50/40 shadow-xs">
            <span className="text-xs font-bold text-amber-900 uppercase">
              {t.outstandingCredit}
            </span>
            <p className="text-2xl font-black text-amber-700 mt-1">
              ₹{(stats?.totalOutstandingCredit || 0).toLocaleString()}
            </p>
            <p className="text-[11px] text-amber-800/80 mt-1">
              Across {stats?.totalCustomers || 0} customers
            </p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <span className="text-xs font-bold text-slate-500 uppercase">{t.totalProducts}</span>
            <p className="text-2xl font-black text-slate-900 mt-1">
              {stats?.totalProducts || 0}
            </p>
            <p className="text-[11px] text-red-600 font-semibold mt-1">
              {stats?.lowStockCount || 0} low stock items
            </p>
          </div>
        </div>

        {/* Low-Stock Warning Section */}
        {(data?.lowStockProducts?.length || 0) > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-3xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold text-amber-900 flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-600" />
                Low Stock Warnings ({data?.lowStockProducts.length})
              </h2>
              <Link href="/business/inventory" className="text-xs font-bold text-amber-800 hover:underline">
                Manage Inventory →
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {data?.lowStockProducts.map((p) => (
                <div key={p.id} className="bg-white p-3.5 rounded-xl border border-amber-200 flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">{p.name}</h4>
                    <p className="text-[11px] text-slate-400">{p.category}</p>
                  </div>
                  <div className="text-right">
                    <span className="px-2 py-0.5 rounded-md bg-red-100 text-red-700 text-xs font-bold">
                      {p.stockQuantity} left
                    </span>
                    <p className="text-[10px] text-slate-400 mt-0.5">Threshold: {p.lowStockThreshold}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Two-column layout: Recent Sales & Recent Job Applicants */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Sales Table */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900">Recent Sales & Bills</h3>
              <Link href="/business/sales" className="text-xs font-bold text-teal-700 hover:underline">
                View All Sales →
              </Link>
            </div>

            {(!data?.recentSales || data.recentSales.length === 0) ? (
              <p className="text-xs text-slate-400 py-4">No sales recorded yet.</p>
            ) : (
              <div className="divide-y divide-slate-100">
                {data.recentSales.map((s) => (
                  <div key={s.id} className="py-3 flex items-center justify-between text-xs">
                    <div>
                      <p className="font-bold text-slate-900">
                        {s.customer?.name ? s.customer.name : 'Counter Walk-in'}
                      </p>
                      <p className="text-[11px] text-slate-400">
                        {new Date(s.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • Method: {s.paymentMethod}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-black text-slate-900">₹{Number(s.totalAmount).toFixed(2)}</p>
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
                        s.paymentMethod === 'CREDIT' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        {s.paymentMethod === 'CREDIT' ? 'Udhaar' : 'Paid'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Job Applicants */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900">Worker Applications</h3>
              <Link href="/business/jobs" className="text-xs font-bold text-teal-700 hover:underline">
                Manage Jobs ({stats?.activeJobsCount || 0}) →
              </Link>
            </div>

            {(!data?.recentApplications || data.recentApplications.length === 0) ? (
              <div className="py-6 text-center text-slate-400 text-xs">
                <Briefcase className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                <p>No recent worker applications.</p>
                <Link
                  href="/business/jobs/create"
                  className="inline-block mt-2 text-xs font-bold text-teal-700 hover:underline"
                >
                  + Post a Job Listing
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {data.recentApplications.map((app) => (
                  <div key={app.id} className="py-3 flex items-center justify-between text-xs">
                    <div>
                      <p className="font-bold text-slate-900">{app.worker.user.name}</p>
                      <p className="text-[11px] text-slate-400">
                        Applied for: <span className="text-teal-700 font-medium">{app.job.title}</span>
                      </p>
                    </div>
                    <div className="text-right">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        app.status === 'ACCEPTED'
                          ? 'bg-emerald-100 text-emerald-800'
                          : app.status === 'REJECTED'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}>
                        {app.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
