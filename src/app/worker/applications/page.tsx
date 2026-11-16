'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useApp } from '@/context/AppContext';
import DashboardShell from '@/components/DashboardShell';
import PageHeader from '@/components/ui/PageHeader';
import EmptyState from '@/components/ui/EmptyState';
import { ApplicationStatusBadge } from '@/components/ui/Badge';
import { formatDate } from '@/lib/date';
import {
  Briefcase,
  MapPin,
  Phone,
  Building2,
  Calendar,
  ArrowRight,
} from 'lucide-react';

interface Application {
  id: string;
  status: string;
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
  const { t, language } = useApp();
  const isHi = language === 'hi';
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
    <DashboardShell role="WORKER">
      <PageHeader
        title={t.myApplications}
        description={isHi ? 'आपके द्वारा आवेदन किए गए सभी पदों की स्थिति देखें और चयन होने पर मालिक से संपर्क करें।' : 'Track the status of all positions you have applied for and contact employers directly upon acceptance.'}
      />

      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="ks-skeleton h-36 rounded-2xl" />
          ))}
        </div>
      ) : applications.length === 0 ? (
        <EmptyState
          icon={Briefcase}
          title={t.noApplicationsSubmitted}
          description={t.startApplyingDesc}
          action={
            <Link href="/jobs" className="ks-btn ks-btn-primary ks-btn-sm">
              {t.exploreJobs}
            </Link>
          }
          className="border-dashed"
        />
      ) : (
        <div className="animate-fade-in space-y-4">
          {applications.map((app) => (
            <div
              key={app.id}
              className="ks-card ks-card-hover flex flex-col justify-between gap-4 p-6 sm:flex-row sm:items-center"
            >
              <div className="min-w-0 space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <ApplicationStatusBadge status={app.status} />
                  <span className="flex items-center gap-1 text-xs text-muted">
                    <Calendar className="h-3 w-3" aria-hidden />
                    {isHi ? 'आवेदन तिथि:' : 'Applied:'}{' '}
                    {formatDate(app.appliedAt)}
                  </span>
                </div>

                <h2 className="text-base font-bold text-ink">{app.job.title}</h2>

                <div className="flex flex-wrap items-center gap-3 text-xs text-muted">
                  <span className="flex items-center gap-1 font-semibold text-ink">
                    <Building2 className="h-3.5 w-3.5 text-accent" aria-hidden />
                    {app.job.business.name}
                  </span>
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5 text-muted" aria-hidden />
                    {app.job.locality}, {app.job.city}
                  </span>
                  <span className="font-bold text-green-700 dark:text-green-300">
                    ₹{Number(app.job.wageAmount).toLocaleString('en-IN')}{' '}
                    {app.job.wageType === 'DAILY'
                      ? isHi ? '/ दिन' : '/ day'
                      : isHi ? 'निश्चित कुल' : 'fixed'}
                  </span>
                </div>

                {app.message && (
                  <p className="rounded-lg bg-subtle p-2 text-xs text-muted italic">
                    &ldquo;{app.message}&rdquo;
                  </p>
                )}
              </div>

              <div className="flex shrink-0 flex-row items-center gap-2 sm:flex-col sm:items-end">
                <Link
                  href={`/jobs/${app.job.id}`}
                  className="text-xs font-bold text-accent-strong hover:underline"
                >
                  View Job Details
                  <ArrowRight className="ml-1 inline h-3 w-3" aria-hidden />
                </Link>

                {app.status === 'ACCEPTED' && (
                  <a
                    href={`tel:${app.job.business.phone}`}
                    className="ks-btn ks-btn-emerald ks-btn-sm"
                  >
                    <Phone className="h-3.5 w-3.5" aria-hidden />
                    Call Employer
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </DashboardShell>
  );
}
