'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Sidebar from '@/components/Sidebar';
import { Briefcase, MapPin, Phone, Building2, Calendar, CheckCircle2, Clock, XCircle } from 'lucide-react';

interface Application {
  id: string;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'WITHDRAWN';
  appliedAt: string;
  message?: string;
  job: {
    id: string;
    title: string;
    wageAmount: number;
    wageType: string;
    city: string;
    locality: string;
    business: {
      name: string;
      phone: string;
      address: string;
    };
  };
}

export default function WorkerApplicationsPage() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/worker/applications')
      .then((res) => res.json())
      .then((data) => {
        if (data.applications) setApplications(data.applications);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="flex flex-col lg:flex-row min-h-[calc(100vh-4rem)] bg-slate-50">
      <Sidebar role="WORKER" />

      <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-5xl space-y-6">
        <div>
          <h1 className="text-2xl font-black text-slate-900">My Job Applications</h1>
          <p className="text-xs text-slate-500">
            Track the status of all positions you have applied for and contact employers directly upon acceptance.
          </p>
        </div>

        {loading ? (
          <div className="p-8 text-center text-slate-400 text-xs">Loading applications...</div>
        ) : applications.length === 0 ? (
          <div className="p-10 text-center bg-white rounded-3xl border border-slate-200 space-y-3">
            <Briefcase className="h-10 w-10 text-slate-300 mx-auto" />
            <h3 className="text-base font-bold text-slate-800">No applications found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              You haven&apos;t applied for any jobs yet. Check the marketplace to find work matching your skills.
            </p>
            <Link
              href="/jobs"
              className="inline-block mt-2 px-5 py-2.5 bg-teal-600 text-white rounded-xl text-xs font-bold"
            >
              Browse Job Marketplace
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {applications.map((app) => {
              const statusConfig = {
                ACCEPTED: {
                  bg: 'bg-emerald-50 text-emerald-800 border-emerald-200',
                  icon: CheckCircle2,
                  badge: 'ACCEPTED / HIRED 🎉',
                },
                REJECTED: {
                  bg: 'bg-red-50 text-red-800 border-red-200',
                  icon: XCircle,
                  badge: 'NOT SELECTED',
                },
                PENDING: {
                  bg: 'bg-amber-50 text-amber-800 border-amber-200',
                  icon: Clock,
                  badge: 'UNDER REVIEW',
                },
                WITHDRAWN: {
                  bg: 'bg-slate-100 text-slate-700 border-slate-200',
                  icon: Clock,
                  badge: 'WITHDRAWN',
                },
              }[app.status] || {
                bg: 'bg-slate-100 text-slate-700 border-slate-200',
                icon: Clock,
                badge: app.status,
              };

              const StatusIcon = statusConfig.icon;

              return (
                <div
                  key={app.id}
                  className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span
                        className={`inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${statusConfig.bg}`}
                      >
                        <StatusIcon className="h-3 w-3" />
                        {statusConfig.badge}
                      </span>
                      <span className="text-xs text-slate-400">
                        Applied {new Date(app.appliedAt).toLocaleDateString()}
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-slate-900">{app.job.title}</h3>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                      <span className="flex items-center gap-1 font-semibold text-slate-800">
                        <Building2 className="h-3.5 w-3.5 text-teal-600" />
                        {app.job.business.name}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5 text-slate-400" />
                        {app.job.locality}, {app.job.city}
                      </span>
                      <span className="font-bold text-emerald-700">
                        ₹{Number(app.job.wageAmount).toFixed(0)} {app.job.wageType}
                      </span>
                    </div>

                    {app.message && (
                      <p className="text-xs text-slate-500 italic bg-slate-50 p-2 rounded-lg">
                        &quot;{app.message}&quot;
                      </p>
                    )}
                  </div>

                  <div className="flex sm:flex-col items-center sm:items-end gap-2 shrink-0">
                    <Link
                      href={`/jobs/${app.job.id}`}
                      className="text-xs font-bold text-teal-700 hover:underline"
                    >
                      View Job Details →
                    </Link>

                    {app.status === 'ACCEPTED' && (
                      <a
                        href={`tel:${app.job.business.phone}`}
                        className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
                      >
                        <Phone className="h-3.5 w-3.5" />
                        Call Employer ({app.job.business.phone})
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
