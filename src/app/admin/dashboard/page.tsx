'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useApp } from '@/context/AppContext';
import { ShieldCheck, Users, Store, Briefcase, FileText, DollarSign, CheckCircle2 } from 'lucide-react';

interface AdminStats {
  usersCount: number;
  workersCount: number;
  businessOwnersCount: number;
  businessesCount: number;
  jobsCount: number;
  applicationsCount: number;
  totalSalesVolume: number;
}

interface RecentUser {
  id: string;
  name: string;
  phone: string;
  email?: string | null;
  role: string;
  isActive: boolean;
  createdAt: string;
}

export default function AdminDashboardPage() {
  const { user } = useApp();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [recentUsers, setRecentUsers] = useState<RecentUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/stats')
      .then((res) => res.json())
      .then((data) => {
        if (data.stats) {
          setStats(data.stats);
          setRecentUsers(data.recentUsers || []);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex items-center justify-between bg-slate-900 text-white p-6 sm:p-8 rounded-3xl shadow-md">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-500/20 text-teal-300 text-xs font-semibold mb-2">
              <ShieldCheck className="h-4 w-4" />
              Platform Administration
            </div>
            <h1 className="text-2xl sm:text-3xl font-black">KaamSetu Admin Control Panel</h1>
            <p className="text-xs text-slate-400 mt-1">
              Overall health, user counts, jobs marketplace oversight, and commerce metrics.
            </p>
          </div>
        </div>

        {/* Global Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <span className="text-xs font-bold text-slate-400 uppercase">Total Users</span>
            <p className="text-2xl font-black text-slate-900 mt-1">{stats?.usersCount || 0}</p>
            <p className="text-[11px] text-slate-400 mt-1">
              {stats?.workersCount || 0} Workers • {stats?.businessOwnersCount || 0} Businesses
            </p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <span className="text-xs font-bold text-slate-400 uppercase">Businesses</span>
            <p className="text-2xl font-black text-teal-700 mt-1">{stats?.businessesCount || 0}</p>
            <p className="text-[11px] text-slate-400 mt-1">Registered local shops</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <span className="text-xs font-bold text-slate-400 uppercase">Jobs & Applications</span>
            <p className="text-2xl font-black text-amber-700 mt-1">{stats?.jobsCount || 0}</p>
            <p className="text-[11px] text-slate-400 mt-1">{stats?.applicationsCount || 0} applications processed</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <span className="text-xs font-bold text-slate-400 uppercase">Total Sales Volume</span>
            <p className="text-2xl font-black text-emerald-700 mt-1">
              ₹{(stats?.totalSalesVolume || 0).toLocaleString()}
            </p>
            <p className="text-[11px] text-slate-400 mt-1">Local trade recorded</p>
          </div>
        </div>

        {/* User Directory */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6 space-y-4">
          <h2 className="text-base font-bold text-slate-900">Recently Registered Platform Users</h2>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase">
                <tr>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Phone</th>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Registered Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-bold text-slate-900">{u.name}</td>
                    <td className="px-4 py-3 text-slate-600">{u.phone}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-semibold text-[10px]">
                        {u.role}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-semibold text-[10px]">
                        {u.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-400">
                      {new Date(u.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
