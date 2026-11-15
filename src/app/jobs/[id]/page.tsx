'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import {
  Briefcase,
  MapPin,
  Building2,
  DollarSign,
  Phone,
  Calendar,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  Clock,
  Send,
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
  const { t, user } = useApp();

  const [job, setJob] = useState<JobDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [applyMessage, setApplyMessage] = useState('');
  const [applied, setApplied] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [statusFeedback, setStatusFeedback] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

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

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      router.push('/login');
      return;
    }
    if (user.role !== 'WORKER') {
      setStatusFeedback({ type: 'error', msg: 'Only registered worker accounts can apply for jobs.' });
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
      }
    } catch {
      setStatusFeedback({ type: 'error', msg: 'Network error while submitting application' });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-teal-600 border-t-transparent"></div>
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 text-center">
        <AlertCircle className="h-12 w-12 text-red-500 mb-3" />
        <h2 className="text-xl font-bold text-slate-800">{error || 'Job not found'}</h2>
        <Link href="/jobs" className="mt-4 text-sm font-semibold text-teal-600 hover:underline">
          ← Back to Job Marketplace
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl space-y-6">
        <Link
          href="/jobs"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-teal-700 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to all jobs
        </Link>

        {/* Job Header Card */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 uppercase">
                  {job.jobType.replace('_', ' ')}
                </span>
                <span
                  className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                    job.status === 'OPEN'
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-red-100 text-red-800'
                  }`}
                >
                  {job.status}
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 mt-2">
                {job.title}
              </h1>

              <div className="flex flex-wrap items-center gap-4 text-xs sm:text-sm text-slate-600 mt-3">
                <span className="flex items-center gap-1 font-semibold text-slate-900">
                  <Building2 className="h-4 w-4 text-teal-600" />
                  {job.business.name}
                </span>
                <span className="flex items-center gap-1">
                  <MapPin className="h-4 w-4 text-slate-400" />
                  {job.locality}, {job.city}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="h-4 w-4 text-slate-400" />
                  Posted {new Date(job.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>

            <div className="sm:text-right shrink-0">
              <p className="text-xs text-slate-500 font-medium">Offered Wage</p>
              <p className="text-2xl font-black text-emerald-700">
                ₹{Number(job.wageAmount).toFixed(0)}
                <span className="text-xs text-slate-500 font-normal">
                  {' '}{job.wageType === 'DAILY' ? t.perDay : 'fixed'}
                </span>
              </p>
            </div>
          </div>

          {/* Required Skills */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
              Required Skills & Trades
            </h3>
            <div className="flex flex-wrap gap-2">
              {job.requiredSkills.map((sk, idx) => (
                <span
                  key={idx}
                  className="px-3 py-1 rounded-xl bg-teal-50 text-teal-800 font-semibold text-xs border border-teal-200/60"
                >
                  {sk}
                </span>
              ))}
            </div>
          </div>

          {/* Job Description */}
          <div className="border-t border-slate-100 pt-6">
            <h3 className="text-sm font-bold text-slate-900 mb-2">Job Description & Responsibilities</h3>
            <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">
              {job.description}
            </p>
          </div>

          {/* Employer Info */}
          <div className="border-t border-slate-100 pt-6 bg-slate-50 -mx-6 -mb-6 sm:-mx-8 sm:-mb-8 p-6 sm:p-8 rounded-b-3xl">
            <h3 className="text-sm font-bold text-slate-900 mb-2">About the Employer</h3>
            <p className="text-xs text-slate-600">{job.business.description || 'Verified local business.'}</p>
            <p className="text-xs text-slate-500 mt-2">
              <strong>Address:</strong> {job.business.address}
            </p>
          </div>
        </div>

        {/* Application Action Section */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs">
          <h2 className="text-lg font-bold text-slate-900 mb-4">Apply for this Position</h2>

          {statusFeedback && (
            <div
              className={`p-4 rounded-xl text-xs mb-4 flex items-center gap-2 ${
                statusFeedback.type === 'success'
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'bg-red-50 text-red-800 border border-red-200'
              }`}
            >
              {statusFeedback.type === 'success' ? (
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
              ) : (
                <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
              )}
              <span>{statusFeedback.msg}</span>
            </div>
          )}

          {applied ? (
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-center space-y-2">
              <CheckCircle2 className="h-8 w-8 text-emerald-600 mx-auto" />
              <h4 className="text-sm font-bold text-emerald-900">Application Submitted!</h4>
              <p className="text-xs text-emerald-700">
                You have already applied for this position. Check your applications page to monitor updates.
              </p>
              <Link
                href="/worker/applications"
                className="inline-block mt-2 px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold"
              >
                View My Applications →
              </Link>
            </div>
          ) : user?.role === 'BUSINESS_OWNER' ? (
            <div className="p-4 rounded-2xl bg-slate-100 text-slate-600 text-xs">
              You are currently logged in as a <strong>Business Owner</strong>. Only Worker accounts can apply for job postings.
            </div>
          ) : (
            <form onSubmit={handleApply} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Message to Employer (Optional)
                </label>
                <textarea
                  rows={3}
                  value={applyMessage}
                  onChange={(e) => setApplyMessage(e.target.value)}
                  placeholder="Mention your availability, relevant past work, or contact preference..."
                  className="w-full rounded-xl border border-slate-300 p-3 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <button
                type="submit"
                disabled={submitting || job.status !== 'OPEN'}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3 rounded-xl bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white font-bold text-sm shadow-md transition-all active:scale-98"
              >
                <Send className="h-4 w-4" />
                {submitting ? 'Submitting Application...' : 'Submit Application Now'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
