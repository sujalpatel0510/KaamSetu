'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import Sidebar from '@/components/Sidebar';
import {
  Briefcase,
  User,
  CheckCircle2,
  Clock,
  MapPin,
  ArrowRight,
  Sparkles,
  Phone,
  ShieldCheck,
} from 'lucide-react';

interface ApplicationItem {
  id: string;
  status: string;
  appliedAt: string;
  job: {
    id: string;
    title: string;
    wageAmount: number;
    wageType: string;
    city: string;
    business: { name: string; phone: string };
  };
}

export default function WorkerDashboardPage() {
  const router = useRouter();
  const { user, t, isLoading } = useApp();
  const [applications, setApplications] = useState<ApplicationItem[]>([]);
  const [loadingApps, setLoadingApps] = useState(true);

  useEffect(() => {
    if (!isLoading && (!user || user.role !== 'WORKER')) {
      if (user?.role === 'BUSINESS_OWNER') {
        router.push('/business/dashboard');
      } else if (!user) {
        router.push('/login');
      }
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    if (user?.role === 'WORKER') {
      fetch('/api/worker/applications')
        .then((res) => res.json())
        .then((data) => {
          if (data.applications) setApplications(data.applications);
        })
        .catch(() => {})
        .finally(() => setLoadingApps(false));
    }
  }, [user]);

  const acceptedCount = applications.filter((a) => a.status === 'ACCEPTED').length;
  const pendingCount = applications.filter((a) => a.status === 'PENDING').length;

  return (
    <div className="flex flex-col lg:flex-row min-h-[calc(100vh-4rem)] bg-slate-50">
      <Sidebar role="WORKER" />

      <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Welcome Header */}
        <div className="rounded-3xl bg-gradient-to-r from-teal-700 to-teal-900 p-6 sm:p-8 text-white shadow-md relative overflow-hidden">
          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-teal-200">
                Worker Dashboard
              </span>
              <h1 className="text-2xl sm:text-3xl font-black mt-1">
                Welcome back, {user?.name || 'Worker'}!
              </h1>
              <p className="text-xs sm:text-sm text-teal-100 mt-1">
                Your profile is live. Employers nearby can see your skills.
              </p>
            </div>

            <Link
              href="/jobs"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs shadow-md transition-all shrink-0"
            >
              <Briefcase className="h-4 w-4" />
              Browse Open Jobs
            </Link>
          </div>
        </div>

        {/* Stats Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center font-bold">
              <Briefcase className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase">Total Applied</p>
              <p className="text-2xl font-black text-slate-900">{applications.length}</p>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase">Accepted / Hired</p>
              <p className="text-2xl font-black text-emerald-700">{acceptedCount}</p>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold">
              <Clock className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase">Pending Review</p>
              <p className="text-2xl font-black text-amber-700">{pendingCount}</p>
            </div>
          </div>
        </div>

        {/* Worker Digital Skill Card */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-teal-600" />
                Digital Skill Profile (KaamSetu Identity)
              </h2>
              <p className="text-xs text-slate-500">Your verified credentials visible to employers</p>
            </div>
            <Link
              href="/worker/profile"
              className="text-xs font-bold text-teal-700 hover:underline"
            >
              Edit Profile →
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <span className="text-slate-400 font-semibold block">Full Name:</span>
              <span className="text-sm font-bold text-slate-800">{user?.name}</span>
            </div>
            <div>
              <span className="text-slate-400 font-semibold block">Mobile Number:</span>
              <span className="text-sm font-bold text-slate-800">{user?.phone}</span>
            </div>
            <div>
              <span className="text-slate-400 font-semibold block">Location:</span>
              <span className="text-sm font-bold text-slate-800">
                {user?.workerProfile?.locality || 'Maninagar'}, {user?.workerProfile?.city || 'Ahmedabad'}
              </span>
            </div>
          </div>

          <div>
            <span className="text-slate-400 text-xs font-semibold block mb-1.5">Registered Trades & Skills:</span>
            <div className="flex flex-wrap gap-1.5">
              {(user?.workerProfile?.skills || ['Electrician', 'Wiring']).map((s, idx) => (
                <span
                  key={idx}
                  className="px-3 py-1 rounded-lg bg-teal-50 text-teal-800 font-bold text-xs border border-teal-200/60"
                >
                  {s}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Applications List */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900">Recent Job Applications</h2>
            <Link href="/worker/applications" className="text-xs font-bold text-teal-700 hover:underline">
              View All ({applications.length}) →
            </Link>
          </div>

          {loadingApps ? (
            <p className="text-xs text-slate-400">Loading your applications...</p>
          ) : applications.length === 0 ? (
            <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 space-y-2">
              <Briefcase className="h-8 w-8 text-slate-300 mx-auto" />
              <p className="text-xs font-bold text-slate-700">No applications submitted yet</p>
              <p className="text-xs text-slate-500">Browse available openings and apply in 1-click.</p>
              <Link
                href="/jobs"
                className="inline-block mt-2 px-4 py-2 bg-teal-600 text-white rounded-xl text-xs font-bold"
              >
                Browse Marketplace
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {applications.slice(0, 5).map((app) => (
                <div key={app.id} className="py-3.5 flex items-center justify-between gap-4">
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">{app.job.title}</h4>
                    <p className="text-xs text-slate-500">
                      {app.job.business.name} • ₹{Number(app.job.wageAmount).toFixed(0)} {app.job.wageType}
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <span
                      className={`text-xs font-bold px-3 py-1 rounded-full ${
                        app.status === 'ACCEPTED'
                          ? 'bg-emerald-100 text-emerald-800'
                          : app.status === 'REJECTED'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {app.status}
                    </span>

                    {app.status === 'ACCEPTED' && (
                      <a
                        href={`tel:${app.job.business.phone}`}
                        className="inline-flex items-center gap-1 px-3 py-1 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-bold"
                      >
                        <Phone className="h-3 w-3" />
                        Call Boss
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
