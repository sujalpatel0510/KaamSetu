'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useApp } from '@/context/AppContext';
import DashboardShell from '@/components/DashboardShell';
import PageHeader from '@/components/ui/PageHeader';
import EmptyState from '@/components/ui/EmptyState';
import Button from '@/components/ui/Button';
import { JobStatusBadge } from '@/components/ui/Badge';
import { formatDate } from '@/lib/date';
import { DashboardSkeleton } from '@/components/ui/Skeleton';
import {
  Briefcase,
  Plus,
  Users,
  MapPin,
  Calendar,
  ArrowRight,
} from 'lucide-react';

interface EmployerJob {
  id: string;
  title: string;
  description: string;
  wageAmount: number;
  wageType: string;
  jobType: string;
  status: string;
  city: string;
  locality: string;
  createdAt: string;
  _count: {
    applications: number;
  };
}

export default function BusinessJobsPage() {
  const { t, language } = useApp();
  const isHi = language === 'hi';
  const [jobs, setJobs] = useState<EmployerJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const fetchJobs = async () => {
    try {
      const res = await fetch('/api/business/jobs');
      const data = await res.json();
      if (data.jobs) setJobs(data.jobs);
    } catch {
      console.error('Failed to load jobs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  const handleToggleStatus = async (jobId: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'OPEN' ? 'CLOSED' : 'OPEN';
    setTogglingId(jobId);
    try {
      const res = await fetch(`/api/jobs/${jobId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus }),
      });
      if (res.ok) fetchJobs();
    } catch {
      console.error('Failed to update job status');
    } finally {
      setTogglingId(null);
    }
  };

  return (
    <DashboardShell role="BUSINESS_OWNER">
      <PageHeader
        title={isHi ? 'नौकरियां व कारीगर भर्ती' : 'Manage Job Postings & Hiring'}
        description={isHi ? 'ज़रूरतें पोस्ट करें, आवेदकों के हुनर की समीक्षा करें और स्थानीय कारीगरों को काम पर रखें।' : 'Publish requirements, review applicant profiles, and hire verified local workers.'}
        actions={
          <Link href="/business/jobs/create" className="ks-btn ks-btn-primary">
            <Plus className="h-4 w-4" aria-hidden />
            {t.postJob}
          </Link>
        }
      />

      {/* Jobs List */}
      {loading ? (
        <DashboardSkeleton cards={0} />
      ) : jobs.length === 0 ? (
        <EmptyState
          icon={Briefcase}
          title="No job listings yet"
          description="Hire skilled electricians, plumbers, masons, or shop helpers nearby."
          action={
            <Link href="/business/jobs/create" className="ks-btn ks-btn-primary ks-btn-sm">
              <Plus className="h-4 w-4" aria-hidden />
              Post Your First Job
            </Link>
          }
          className="border-dashed"
        />
      ) : (
        <div className="animate-fade-in space-y-4">
          {jobs.map((j, i) => (
            <div
              key={j.id}
              style={{ animationDelay: `${Math.min(i * 60, 300)}ms` }}
              className="ks-card ks-card-hover flex animate-fade-up flex-col justify-between gap-4 p-6 sm:flex-row sm:items-center"
            >
              <div className="min-w-0 space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <JobStatusBadge status={j.status} />
                  <span className="flex items-center gap-1 text-xs text-muted">
                    <Calendar className="h-3 w-3" aria-hidden />
                    Posted on {formatDate(j.createdAt)}
                  </span>
                </div>

                <h2 className="text-base font-bold text-ink">{j.title}</h2>

                <div className="flex flex-wrap items-center gap-3 text-xs text-muted">
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5 text-muted" aria-hidden />
                    {j.locality}, {j.city}
                  </span>
                  <span className="font-bold text-green-700 dark:text-green-300">
                    ₹{Number(j.wageAmount).toLocaleString('en-IN')}{' '}
                    {j.wageType === 'DAILY' ? '/ day' : 'fixed'}
                  </span>
                  <span>Type: {j.jobType.replace('_', ' ')}</span>
                </div>
              </div>

              <div className="flex shrink-0 flex-row items-center gap-2.5 sm:flex-col sm:items-end">
                <Link
                  href={`/business/jobs/${j.id}/applicants`}
                  className="ks-btn ks-btn-amber ks-btn-sm"
                >
                  <Users className="h-4 w-4" aria-hidden />
                  Review Applicants ({j._count.applications})
                  <ArrowRight className="h-3.5 w-3.5" aria-hidden />
                </Link>

                <Button
                  variant="ghost"
                  size="sm"
                  loading={togglingId === j.id}
                  onClick={() => handleToggleStatus(j.id, j.status)}
                  className="underline-offset-2 hover:underline"
                >
                  {j.status === 'OPEN' ? 'Mark as Closed' : 'Reopen Listing'}
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </DashboardShell>
  );
}
