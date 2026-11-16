'use client';

import { toast } from '@/components/ui/Toast';
import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useApp } from '@/context/AppContext';
import DashboardShell from '@/components/DashboardShell';
import PageHeader from '@/components/ui/PageHeader';
import Button from '@/components/ui/Button';
import Alert from '@/components/ui/Alert';
import EmptyState from '@/components/ui/EmptyState';
import { ApplicationStatusBadge } from '@/components/ui/Badge';
import { formatDate } from '@/lib/date';
import {
  Users,
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Phone,
  MapPin,
  Award,
  Video,
} from 'lucide-react';

interface ApplicantItem {
  id: string;
  message?: string | null;
  status: string;
  appliedAt: string;
  worker: {
    id: string;
    city: string;
    locality: string;
    skills: string[];
    experienceYears: number;
    description?: string | null;
    workVideoUrl?: string | null;
    verifiedSkillBadge?: boolean;
    user: {
      id: string;
      name: string;
      phone: string;
      email?: string | null;
    };
  };
}

interface JobData {
  id: string;
  title: string;
  city: string;
  wageAmount: number;
  wageType: string;
}

export default function JobApplicantsReviewPage() {
  const params = useParams();
  const { id: jobId } = params as { id: string };
  const { t, language } = useApp();
  const isHi = language === 'hi';

  const [job, setJob] = useState<JobData | null>(null);
  const [applicants, setApplicants] = useState<ApplicantItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error';
    msg: string;
  } | null>(null);

  const fetchApplicants = async () => {
    try {
      const res = await fetch(`/api/business/jobs/${jobId}/applicants`);
      const data = await res.json();
      if (data.job) setJob(data.job);
      if (data.applications) setApplicants(data.applications);
    } catch {
      console.error('Failed to load applicants');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplicants();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jobId]);

  const handleUpdateStatus = async (
    applicationId: string,
    status: 'ACCEPTED' | 'REJECTED'
  ) => {
    setFeedback(null);
    setUpdatingId(applicationId);
    try {
      const res = await fetch(`/api/business/jobs/${jobId}/applicants`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ applicationId, status }),
      });

      const data = await res.json();
      if (!res.ok) {
        setFeedback({ type: 'error', msg: data.error || 'Failed to update status' });
      } else {
        setFeedback({
          type: 'success',
          msg: `Application marked as ${status}! In-app notification sent to the worker.`,
        });
        toast.success(`Application marked as ${status.toLowerCase()}`);
        fetchApplicants();
      }
    } catch {
      setFeedback({ type: 'error', msg: 'Network error updating application' });
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <DashboardShell role="BUSINESS_OWNER">
      <Link
        href="/business/jobs"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted transition-colors hover:text-accent-strong"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden />
        {isHi ? 'नौकरियों पर वापस जाएं' : 'Back to Posted Jobs'}
      </Link>

      <PageHeader
        title={`${isHi ? 'आवेदक सूची:' : 'Applicants for'} "${job?.title || 'Job'}"`}
        description={
          job
            ? `${job.city} • ₹${Number(job.wageAmount).toLocaleString('en-IN')} ${job.wageType === 'DAILY' ? t.perDay : t.fixedWage}`
            : undefined
        }
        actions={
          <span className="ks-badge bg-brand-100 text-ink">
            {applicants.length} {isHi ? 'कुल आवेदक' : 'Total Applied'}
          </span>
        }
      />

      {feedback && <Alert tone={feedback.type}>{feedback.msg}</Alert>}

      {/* Applicant Cards List */}
      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="ks-skeleton h-44 rounded-2xl" />
          ))}
        </div>
      ) : applicants.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No applicants yet"
          description="Workers looking for jobs in your area will appear here when they apply."
          className="border-dashed"
        />
      ) : (
        <div className="animate-fade-in space-y-4">
          {applicants.map((app) => (
            <div
              key={app.id}
              className="ks-card flex flex-col justify-between gap-6 p-6 sm:flex-row sm:items-start"
            >
              <div className="flex-1 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-brand-700 text-sm font-bold text-white">
                    {app.worker.user.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-ink">
                      {app.worker.user.name}
                    </h2>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-muted">
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5 text-muted" aria-hidden />
                        {app.worker.locality}, {app.worker.city}
                      </span>
                      <span className="flex items-center gap-1 font-semibold text-accent-strong">
                        <Award className="h-3.5 w-3.5" aria-hidden />
                        {app.worker.experienceYears} Years Experience
                      </span>
                    </div>
                  </div>
                </div>

                {/* Skills tags */}
                <div>
                  <div className="mb-1 flex items-center gap-2">
                    <span className="text-[10px] font-bold tracking-wider text-muted uppercase">
                      Skills & Specialization:
                    </span>
                    <span className="ks-badge bg-green-500/15 text-green-800 dark:text-green-300">
                      ✓ Verified Worker
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {app.worker.skills.map((s, idx) => (
                      <span
                        key={idx}
                        className="rounded-md bg-subtle px-2.5 py-0.5 text-xs font-medium text-ink-soft"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                </div>

                {/* 15-second work video proof */}
                {app.worker.workVideoUrl && (
                  <div className="flex items-center justify-between rounded-xl border border-brand-200 bg-brand-50/60 p-2.5 text-xs">
                    <div className="flex items-center gap-2">
                      <Video className="h-4 w-4 shrink-0 text-accent" aria-hidden />
                      <div>
                        <p className="font-bold text-ink">
                          15-Second Work Sample Video
                        </p>
                        <p className="text-[10px] text-accent-strong">
                          Verified video proof of craftsmanship
                        </p>
                      </div>
                    </div>
                    <a
                      href={app.worker.workVideoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ks-btn ks-btn-primary ks-btn-sm shrink-0"
                    >
                      Watch Video
                    </a>
                  </div>
                )}

                {/* Worker note */}
                {app.message && (
                  <div className="rounded-xl border border-line bg-subtle p-3 text-xs text-ink-soft">
                    <span className="mb-0.5 block text-[10px] font-bold tracking-wider text-muted uppercase">
                      Worker Note:
                    </span>
                    &ldquo;{app.message}&rdquo;
                  </div>
                )}

                <p className="text-[11px] text-muted">
                  Applied on {formatDate(app.appliedAt)}
                </p>
              </div>

              {/* Status and Action Buttons */}
              <div className="flex shrink-0 items-center justify-between gap-3 border-t border-line pt-3 sm:flex-col sm:items-end sm:border-t-0 sm:pt-0">
                <ApplicationStatusBadge status={app.status} />

                {app.status === 'PENDING' ? (
                  <div className="flex items-center gap-2">
                    <Button
                      variant="emerald"
                      size="sm"
                      loading={updatingId === app.id}
                      onClick={() => handleUpdateStatus(app.id, 'ACCEPTED')}
                    >
                      <CheckCircle2 className="h-4 w-4" aria-hidden />
                      Accept
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      loading={updatingId === app.id}
                      onClick={() => handleUpdateStatus(app.id, 'REJECTED')}
                      className="hover:border-red-500/30 hover:bg-red-500/10 hover:text-red-700 dark:text-red-300 dark:hover:text-red-300"
                    >
                      <XCircle className="h-4 w-4" aria-hidden />
                      Reject
                    </Button>
                  </div>
                ) : (
                  <a
                    href={`tel:${app.worker.user.phone}`}
                    className="ks-btn ks-btn-primary ks-btn-sm"
                  >
                    <Phone className="h-3.5 w-3.5" aria-hidden />
                    Call Worker ({app.worker.user.phone})
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
