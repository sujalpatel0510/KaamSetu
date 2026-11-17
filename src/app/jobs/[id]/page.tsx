'use client';

import { toast } from '@/components/ui/Toast';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import Button from '@/components/ui/Button';
import Badge, { JobStatusBadge } from '@/components/ui/Badge';
import Alert from '@/components/ui/Alert';
import { Skeleton } from '@/components/ui/Skeleton';
import { formatDate } from '@/lib/date';
import {
  MapPin,
  Building2,
  Calendar,
  CheckCircle2,
  ArrowLeft,
  Volume2,
  Send,
  Info,
} from 'lucide-react';

interface JobDetail {
  id: string;
  title: string;
  description: string;
  requiredSkills: string[];
  city: string;
  locality: string;
  wageAmount: number;
  wageType: 'DAILY' | 'FIXED';
  jobType: string;
  status: string;
  createdAt: string;
  business: {
    id: string;
    name: string;
    category: string;
    phone: string;
    city: string;
    locality: string;
    address: string;
    description?: string;
  };
  _count: {
    applications: number;
  };
}

export default function JobDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { id } = params as { id: string };
  const { t, user, language } = useApp();
  const isHi = language === 'hi';

  const [job, setJob] = useState<JobDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [applyMessage, setApplyMessage] = useState('');
  const [applied, setApplied] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [statusFeedback, setStatusFeedback] = useState<{
    type: 'success' | 'error';
    msg: string;
  } | null>(null);

  useEffect(() => {
    fetch(`/api/jobs/${id}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.job) setJob(data.job);
        else setError(data.error || 'Job not found');
      })
      .catch(() => setError('Error loading job details'))
      .finally(() => setLoading(false));

    if (user?.role === 'WORKER') {
      fetch('/api/worker/applications')
        .then((res) => res.json())
        .then((data) => {
          if (data.applications) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const found = data.applications.some((a: any) => a.jobId === id);
            if (found) setApplied(true);
          }
        })
        .catch(() => {});
    }
  }, [id, user]);

  /** Read the job out loud in Hindi for low-literacy accessibility. */
  const speakJobDetails = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window && job) {
      const speechText = `${job.title}. ${job.business.name}, ${job.locality}, ${job.city}. Daily wage ${job.wageAmount} rupees. Required skills: ${job.requiredSkills.join(', ')}.`;
      const utterance = new SpeechSynthesisUtterance(speechText);
      utterance.lang = 'hi-IN';
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      router.push('/login');
      return;
    }
    if (user.role !== 'WORKER') {
      setStatusFeedback({
        type: 'error',
        msg: 'Only registered worker accounts can apply for jobs.',
      });
      return;
    }

    setSubmitting(true);
    setStatusFeedback(null);

    try {
      const res = await fetch(`/api/jobs/${id}/apply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: applyMessage }),
      });

      const data = await res.json();
      if (!res.ok) {
        setStatusFeedback({ type: 'error', msg: data.error || 'Failed to submit application' });
      } else {
        setApplied(true);
        setStatusFeedback({
          type: 'success',
          msg: 'Application submitted successfully! The employer has been notified.',
        });
        toast.success('Application submitted successfully!');
      }
    } catch {
      setStatusFeedback({ type: 'error', msg: 'Network error while submitting application' });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] bg-canvas px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl space-y-5">
          <Skeleton className="h-4 w-32" />
          <div className="ks-card space-y-5 p-8">
            <Skeleton className="h-6 w-2/3" />
            <Skeleton className="h-4 w-1/2" />
            <div className="flex gap-2">
              <Skeleton className="h-7 w-24 rounded-full" />
              <Skeleton className="h-7 w-24 rounded-full" />
              <Skeleton className="h-7 w-24 rounded-full" />
            </div>
            <Skeleton className="h-28 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center gap-4 p-4 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-500/10 text-red-500 dark:text-red-400">
          <Info className="h-7 w-7" aria-hidden />
        </div>
        <h1 className="text-xl font-bold text-ink">{error || 'Job not found'}</h1>
        <p className="text-xs text-muted">
          This listing may have been closed or removed by the employer.
        </p>
        <Link href="/jobs" className="ks-btn ks-btn-primary ks-btn-sm">
          <ArrowLeft className="h-4 w-4" aria-hidden />
          Back to Job Marketplace
        </Link>
      </div>
    );
  }

  return (
    <div className={user ? "w-full bg-canvas" : "min-h-[calc(100dvh-4rem)] w-full bg-canvas px-4 py-8 sm:px-6 lg:px-10 xl:px-12"}>
      <div className="w-full space-y-6">
        <Link
          href="/jobs"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted transition-colors hover:text-accent-strong"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          {isHi ? 'सभी नौकरियों पर वापस जाएं' : 'Back to all jobs'}
        </Link>

        {/* 2-Column Responsive Layout */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Main Job Details (8 cols on lg) */}
          <div className="space-y-6 lg:col-span-8">
            <div className="ks-card animate-fade-up space-y-6 p-6 sm:p-8">
              <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                <div>
                  <div className="flex items-center gap-2">
                    <Badge tone="neutral">{job.jobType.replace('_', ' ')}</Badge>
                    <JobStatusBadge status={job.status} />
                  </div>

                  <h1 className="mt-2 text-2xl font-black tracking-tight text-ink sm:text-3xl">
                    {job.title}
                  </h1>

                  <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-ink-soft sm:text-sm">
                    <span className="flex items-center gap-1 font-semibold text-ink">
                      <Building2 className="h-4 w-4 text-accent" aria-hidden />
                      {job.business.name}
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin className="h-4 w-4 text-muted" aria-hidden />
                      {job.locality}, {job.city}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="h-4 w-4 text-muted" aria-hidden />
                      {isHi ? 'पोस्ट किया: ' : 'Posted '}
                      {formatDate(job.createdAt)}
                    </span>
                  </div>
                </div>

                <div className="flex shrink-0 flex-col gap-2 sm:items-end">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={speakJobDetails}
                    title="Read out loud in Hindi"
                    className="w-fit"
                  >
                    <Volume2 className="h-4 w-4 text-accent" aria-hidden />
                    {isHi ? 'विवरण सुनें' : 'Listen in Hindi (सुनें)'}
                  </Button>
                  <div className="sm:text-right">
                    <p className="text-xs font-medium text-muted">
                      {isHi ? 'प्रस्तावित मजदूरी (सुरक्षित व पक्की)' : 'Offered Wage (Locked & Safe)'}
                    </p>
                    <p className="text-2xl font-black text-green-700 dark:text-green-300">
                      ₹{Number(job.wageAmount).toLocaleString('en-IN')}
                      <span className="text-xs font-normal text-muted">
                        {' '}
                        {job.wageType === 'DAILY' ? t.perDay : t.fixedWage}
                      </span>
                    </p>
                  </div>
                </div>
              </div>

              {/* Required Skills */}
              <div>
                <h2 className="mb-2 text-xs font-bold tracking-wider text-muted uppercase">
                  {isHi ? 'आवश्यक हुनर व कारीगरी' : 'Required Skills & Trades'}
                </h2>
                <div className="flex flex-wrap gap-2">
                  {job.requiredSkills.map((sk, idx) => (
                    <span
                      key={idx}
                      className="rounded-xl border border-brand-200/70 bg-brand-50 px-3 py-1 text-xs font-semibold text-ink"
                    >
                      {sk}
                    </span>
                  ))}
                </div>
              </div>

              {/* Job Description */}
              <div className="border-t border-line pt-6">
                <h2 className="mb-2 text-sm font-bold text-ink">
                  {isHi ? 'काम का विवरण व जिम्मेदारियां' : 'Job Description & Responsibilities'}
                </h2>
                <p className="text-sm leading-relaxed whitespace-pre-line text-ink-soft">
                  {job.description}
                </p>
              </div>
            </div>
          </div>

          {/* Right Rail: Employer Info & Application Form (4 cols on lg) */}
          <div className="space-y-6 lg:col-span-4">
            {/* Application Action Section */}
            <div className="ks-card p-6">
              <h2 className="mb-4 text-base font-bold text-ink">
                {isHi ? 'इस नौकरी के लिए आवेदन करें' : 'Apply for this Position'}
              </h2>

              {statusFeedback && <Alert tone={statusFeedback.type}>{statusFeedback.msg}</Alert>}

              {applied ? (
                <div className="mt-2 space-y-2 rounded-2xl border border-green-500/25 bg-green-500/10/70 p-5 text-center">
                  <CheckCircle2 className="mx-auto h-9 w-9 text-green-600 dark:text-green-400" aria-hidden />
                  <h3 className="text-sm font-bold text-green-900 dark:text-green-300">
                    {isHi ? 'आवेदन सफलतापूर्वक जमा हुआ!' : 'Application Submitted!'}
                  </h3>
                  <p className="text-xs text-green-700 dark:text-green-300">
                    {isHi
                      ? 'आप पहले ही इस नौकरी के लिए आवेदन कर चुके हैं। अपने आवेदनों में स्थिति देखें।'
                      : 'You have already applied for this position. Check your applications page to monitor updates.'}
                  </p>
                  <Link
                    href="/worker/applications"
                    className="ks-btn ks-btn-emerald ks-btn-sm mt-2 inline-flex"
                  >
                    {isHi ? 'मेरे आवेदन देखें →' : 'View My Applications →'}
                  </Link>
                </div>
              ) : user?.role === 'BUSINESS_OWNER' ? (
                <Alert tone="info">
                  {isHi
                    ? 'आप दुकानदार खाते से लॉग इन हैं। केवल कारीगर ही नौकरी के लिए आवेदन कर सकते हैं।'
                    : 'You are currently logged in as a Business Owner. Only Worker accounts can apply for job postings.'}
                </Alert>
              ) : (
                <form onSubmit={handleApply} className="space-y-4">
                  <div>
                    <label htmlFor="apply-msg" className="ks-label">
                      {isHi ? 'मालिक के लिए संदेश (वैकल्पिक)' : 'Message to Employer (Optional)'}
                    </label>
                    <textarea
                      id="apply-msg"
                      rows={3}
                      value={applyMessage}
                      onChange={(e) => setApplyMessage(e.target.value)}
                      placeholder={isHi ? 'अपनी उपलब्धता, अनुभव या संपर्क प्राथमिकता लिखें...' : 'Mention your availability, experience, or contact preference…'}
                      className="ks-textarea"
                    />
                  </div>

                  <Button
                    type="submit"
                    loading={submitting}
                    loadingText={isHi ? 'जमा हो रहा है...' : 'Submitting…'}
                    disabled={job.status !== 'OPEN'}
                    className="w-full"
                  >
                    <Send className="h-4 w-4" aria-hidden />
                    {job.status !== 'OPEN'
                      ? (isHi ? 'यह भर्ती बंद हो चुकी है' : 'This Job is Closed')
                      : (isHi ? 'आवेदन अभी भेजें' : 'Submit Application Now')}
                  </Button>
                </form>
              )}
            </div>

            {/* Employer Info Card */}
            <div className="ks-card p-6">
              <h2 className="mb-2 text-sm font-bold text-ink">
                {isHi ? 'नियोक्ता / दुकान के बारे में' : 'About the Employer'}
              </h2>
              <div className="space-y-2 text-xs text-ink-soft">
                <p className="font-semibold text-ink">{job.business.name}</p>
                <p className="text-muted">
                  {job.business.description || (isHi ? 'सत्यापित स्थानीय पंजीकृत नियोक्ता।' : 'Verified local registered employer.')}
                </p>
                <div className="mt-3 border-t border-line pt-3 text-[11px] text-muted space-y-1">
                  <p><strong>{t.businessCategory}:</strong> {job.business.category}</p>
                  <p><strong>{t.businessLocation}:</strong> {job.business.address}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
