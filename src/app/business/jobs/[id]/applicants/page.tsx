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
  Briefcase,
  Calendar,
  X,
  Clock,
  Star,
  MessageSquare,
} from 'lucide-react';

interface ApplicantItem {
  id: string;
  message?: string | null;
  status: string;
  appliedAt: string;
  workAssignment?: {
    id: string;
    status: string;
    agreedWage: number;
    wageType: string;
    startDate: string;
    description?: string | null;
  } | null;
  worker: {
    id: string;
    city: string;
    locality: string;
    skills: string[];
    experienceYears: number;
    description?: string | null;
    workVideoUrl?: string | null;
    verifiedSkillBadge?: boolean;
    averageRating?: number;
    totalReviews?: number;
    completedJobsCount?: number;
    recentReviews?: Array<{
      id: string;
      rating: number;
      feedback: string;
      createdAt: string;
      reviewer: { name: string };
    }>;
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

  // Assign Work Modal state
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [targetApp, setTargetApp] = useState<ApplicantItem | null>(null);
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState('');
  const [agreedWage, setAgreedWage] = useState(500);
  const [wageType, setWageType] = useState('DAILY');
  const [workDescription, setWorkDescription] = useState('');
  const [assigning, setAssigning] = useState(false);

  const openAssignModal = (app: ApplicantItem) => {
    setTargetApp(app);
    setAgreedWage(Number(job?.wageAmount || 500));
    setWageType(job?.wageType || 'DAILY');
    setStartDate(new Date().toISOString().split('T')[0]);
    setEndDate('');
    setWorkDescription('');
    setAssignModalOpen(true);
  };

  const handleAssignSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetApp) return;
    setAssigning(true);
    setFeedback(null);
    try {
      const res = await fetch('/api/assignments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          applicationId: targetApp.id,
          startDate,
          endDate: endDate ? endDate : null,
          agreedWage: Number(agreedWage),
          wageType,
          description: workDescription.trim() || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || 'Failed to assign work');
        setFeedback({ type: 'error', msg: data.error || 'Failed to assign work' });
      } else {
        toast.success(isHi ? 'काम सफलतापूर्वक सौंपा गया!' : 'Work assigned successfully!');
        setFeedback({
          type: 'success',
          msg: isHi
            ? `${targetApp.worker.user.name} को काम सफलतापूर्वक सौंपा गया! कार्य आवंटन में विवरण देखें।`
            : `Work assigned to ${targetApp.worker.user.name}! Notification dispatched.`,
        });
        setAssignModalOpen(false);
        setWorkDescription('');
        fetchApplicants();
      }
    } catch {
      toast.error('Network error assigning work');
      setFeedback({ type: 'error', msg: 'Network error assigning work' });
    } finally {
      setAssigning(false);
    }
  };

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
                    <div className="flex items-center gap-2">
                      <h2 className="text-base font-bold text-ink">
                        {app.worker.user.name}
                      </h2>
                      {/* Rating Badge */}
                      {app.worker.averageRating && app.worker.averageRating > 0 ? (
                        <span className="inline-flex items-center gap-1 rounded-md bg-amber-500/15 px-2 py-0.5 text-xs font-bold text-amber-700 dark:text-amber-400">
                          <Star className="h-3 w-3 fill-amber-500 text-amber-500" />
                          <span>{app.worker.averageRating}</span>
                          <span className="text-[10px] font-normal text-muted">
                            ({app.worker.totalReviews} {isHi ? 'समीक्षाएं' : 'reviews'})
                          </span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-md bg-subtle px-2 py-0.5 text-[10px] font-medium text-muted">
                          <Star className="h-2.5 w-2.5 text-muted" />
                          <span>{isHi ? 'नया कारीगर' : 'New Worker'}</span>
                        </span>
                      )}
                      {app.worker.completedJobsCount && app.worker.completedJobsCount > 0 ? (
                        <span className="inline-flex items-center gap-1 rounded-md bg-green-500/10 px-2 py-0.5 text-[10px] font-bold text-green-700 dark:text-green-400">
                          <CheckCircle2 className="h-2.5 w-2.5" />
                          <span>{app.worker.completedJobsCount} {isHi ? 'काम पूर्ण' : 'Done'}</span>
                        </span>
                      ) : null}
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-muted mt-1">
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

                {/* Recent Employer Feedback */}
                {app.worker.recentReviews && app.worker.recentReviews.length > 0 && (
                  <div className="rounded-xl border border-line bg-subtle/50 p-3 text-xs space-y-2">
                    <span className="flex items-center gap-1.5 font-bold text-ink text-[11px] uppercase tracking-wider text-muted">
                      <Star className="h-3 w-3 text-amber-500 fill-amber-500" />
                      {isHi ? 'पिछले नियोक्ताओं की समीक्षाएं व रेटिंग:' : 'Past Employer Reviews & Ratings:'}
                    </span>
                    <div className="space-y-1.5">
                      {app.worker.recentReviews.map((rev) => (
                        <div key={rev.id} className="rounded-lg bg-surface border border-line p-2 text-[11px] space-y-0.5">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-ink-soft">{rev.reviewer?.name || 'Local Employer'}</span>
                            <span className="flex items-center gap-0.5 font-bold text-amber-600">
                              <Star className="h-2.5 w-2.5 fill-amber-500 text-amber-500" />
                              {rev.rating}/5
                            </span>
                          </div>
                          <p className="text-muted italic">&ldquo;{rev.feedback}&rdquo;</p>
                        </div>
                      ))}
                    </div>
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
                  <div className="flex flex-col sm:items-end gap-2">
                    {app.workAssignment ? (
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="rounded-md bg-green-500/15 px-2 py-0.5 text-xs font-bold text-green-700 dark:text-green-300">
                          ✓ {isHi ? 'काम सौंपा गया' : 'Work Assigned'} ({app.workAssignment.status})
                        </span>
                        <Link
                          href="/business/work"
                          className="ks-btn ks-btn-outline ks-btn-xs text-accent"
                        >
                          {isHi ? 'कार्य हब देखें' : 'View in Work'}
                        </Link>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => openAssignModal(app)}
                        className="ks-btn ks-btn-primary ks-btn-sm flex items-center gap-1.5"
                      >
                        <Briefcase className="h-3.5 w-3.5" aria-hidden />
                        <span>{isHi ? 'काम सौंपें' : 'Assign Work'}</span>
                      </button>
                    )}

                    <a
                      href={`tel:${app.worker.user.phone}`}
                      className="ks-btn ks-btn-outline ks-btn-sm"
                    >
                      <Phone className="h-3.5 w-3.5" aria-hidden />
                      {isHi ? 'कॉल करें' : 'Call'} ({app.worker.user.phone})
                    </a>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Assign Work Modal */}
      {assignModalOpen && targetApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="ks-card w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-line pb-3">
              <div>
                <h3 className="text-base font-bold text-ink">
                  {isHi ? 'कार्य आवंटन शेड्यूल करें' : 'Assign Work to Worker'}
                </h3>
                <p className="text-xs text-muted mt-0.5">
                  {targetApp.worker.user.name} • {job?.title}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setAssignModalOpen(false)}
                className="text-muted hover:text-ink"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleAssignSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-ink-soft mb-1.5">
                  {isHi ? 'काम शुरू होने की तारीख' : 'Work Start Date'}
                </label>
                <input
                  type="date"
                  required
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="ks-input"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-ink-soft mb-1.5">
                  {isHi ? 'समाप्ति की संभावित तारीख (वैकल्पिक)' : 'Expected End Date (Optional)'}
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="ks-input"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-ink-soft mb-1.5">
                    {isHi ? 'तय मजदूरी (₹)' : 'Agreed Wage (₹)'}
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={agreedWage}
                    onChange={(e) => setAgreedWage(Number(e.target.value))}
                    className="ks-input"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-ink-soft mb-1.5">
                    {isHi ? 'मजदूरी प्रकार' : 'Wage Type'}
                  </label>
                  <select
                    value={wageType}
                    onChange={(e) => setWageType(e.target.value)}
                    className="ks-input"
                  >
                    <option value="DAILY">{isHi ? 'दैनिक मजदूरी' : 'Daily Wage'}</option>
                    <option value="FIXED">{isHi ? 'निश्चित कुल' : 'Fixed Total'}</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-ink-soft mb-1.5">
                  {isHi ? 'काम का विवरण व निर्देश (कारीगर के लिए)' : 'Work Description & Task Instructions'}
                </label>
                <textarea
                  rows={3}
                  value={workDescription}
                  onChange={(e) => setWorkDescription(e.target.value)}
                  placeholder={
                    isHi
                      ? 'कारीगर को क्या काम करना है विस्तार से लिखें (उदा. 4 पंखे लगाएं, मुख्य बिजली स्विचबोर्ड चेक करें, खराब तार बदलें)...'
                      : 'Describe what the worker needs to do (e.g. Install 4 ceiling fans, check shop switchboard wiring, replace faulty switches)...'
                  }
                  className="ks-input resize-none text-xs"
                />
                <span className="block text-[11px] text-muted mt-1">
                  {isHi
                    ? 'यह विवरण सीधे कारीगर के डैशबोर्ड पर दिखेगा ताकि उसे स्पष्ट पता रहे कि क्या काम करना है।'
                    : 'The assigned worker will clearly see these instructions directly on their work dashboard.'}
                </span>
              </div>

              <div className="rounded-xl border border-brand-200 bg-brand-50/50 p-3 text-xs text-ink-soft flex items-start gap-2">
                <Clock className="h-4 w-4 text-accent shrink-0 mt-0.5" />
                <p>
                  {isHi
                    ? 'असाइनमेंट बनने के बाद कारीगर डिजिटल हाजिरी दर्ज कर सकेगा और आप सीधे उपस्थिति व भुगतान प्रबंधित कर सकेंगे।'
                    : 'Once assigned, the worker will be notified and can record digital daily attendance, which you can verify and pay.'}
                </p>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setAssignModalOpen(false)}
                  className="ks-btn ks-btn-outline ks-btn-sm"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  disabled={assigning}
                  className="ks-btn ks-btn-primary ks-btn-sm"
                >
                  {assigning ? (isHi ? 'आवंटित किया जा रहा है...' : 'Assigning...') : (isHi ? 'काम सौंपें' : 'Confirm Assignment')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardShell>
  );
}
