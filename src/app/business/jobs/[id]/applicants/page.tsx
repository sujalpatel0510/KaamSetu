'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Sidebar from '@/components/Sidebar';
import {
  Users,
  Briefcase,
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Phone,
  MapPin,
  Calendar,
  AlertCircle,
  Award,
} from 'lucide-react';

interface ApplicantItem {
  id: string;
  message?: string | null;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'WITHDRAWN';
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

  const [job, setJob] = useState<JobData | null>(null);
  const [applicants, setApplicants] = useState<ApplicantItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

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

  const handleUpdateStatus = async (applicationId: string, status: 'ACCEPTED' | 'REJECTED') => {
    setFeedback(null);
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
        fetchApplicants();
      }
    } catch {
      setFeedback({ type: 'error', msg: 'Network error updating application' });
    }
  };

  return (
    <div className="flex flex-col lg:flex-row min-h-[calc(100vh-4rem)] bg-slate-50">
      <Sidebar role="BUSINESS_OWNER" />

      <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 max-w-5xl">
        <Link
          href="/business/jobs"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-teal-700 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Posted Jobs
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-4">
          <div>
            <h1 className="text-2xl font-black text-slate-900">
              Applicants for &quot;{job?.title || 'Job'}&quot;
            </h1>
            <p className="text-xs text-slate-500">
              {job ? `${job.city} • ₹${Number(job.wageAmount).toFixed(0)} ${job.wageType}` : ''}
            </p>
          </div>

          <span className="text-xs font-bold px-3 py-1 bg-teal-100 text-teal-800 rounded-full w-fit">
            {applicants.length} Total Applied
          </span>
        </div>

        {feedback && (
          <div
            className={`p-4 rounded-xl text-xs flex items-center gap-2 ${
              feedback.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                : 'bg-red-50 text-red-800 border border-red-200'
            }`}
          >
            {feedback.type === 'success' ? (
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
            ) : (
              <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
            )}
            <span>{feedback.msg}</span>
          </div>
        )}

        {/* Applicant Cards List */}
        {loading ? (
          <p className="text-xs text-slate-400 py-8 text-center">Loading applicant profiles...</p>
        ) : applicants.length === 0 ? (
          <div className="bg-white p-12 text-center rounded-3xl border border-slate-200 text-xs text-slate-400 space-y-2">
            <Users className="h-10 w-10 text-slate-300 mx-auto" />
            <p className="font-bold text-slate-700">No applicants yet.</p>
            <p>Workers looking for jobs in your area will appear here when they apply.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {applicants.map((app) => (
              <div
                key={app.id}
                className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-start justify-between gap-6"
              >
                <div className="space-y-3 flex-1">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-teal-100 text-teal-800 flex items-center justify-center font-bold text-sm">
                      {app.worker.user.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-slate-900">{app.worker.user.name}</h3>
                      <div className="flex items-center gap-3 text-xs text-slate-500">
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5 text-slate-400" />
                          {app.worker.locality}, {app.worker.city}
                        </span>
                        <span className="flex items-center gap-1 font-semibold text-teal-700">
                          <Award className="h-3.5 w-3.5" />
                          {app.worker.experienceYears} Years Experience
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Skills tags */}
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Skills & Specialization:
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800">
                        ✓ AI Skill Verified
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {app.worker.skills.map((s, idx) => (
                        <span
                          key={idx}
                          className="px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-700 text-xs font-medium"
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* 15-second work video proof (Track 1 Labor Bridge) */}
                  {app.worker.workVideoUrl && (
                    <div className="p-2.5 rounded-xl bg-teal-50 border border-teal-200 text-xs flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-sm">📹</span>
                        <div>
                          <p className="font-bold text-teal-950">15-Second Work Sample Video</p>
                          <p className="text-[10px] text-teal-700">Verified video proof of wiring/welding craftsmanship</p>
                        </div>
                      </div>
                      <a
                        href={app.worker.workVideoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-bold"
                      >
                        Watch Video
                      </a>
                    </div>
                  )}

                  {/* Worker note/message */}
                  {app.message && (
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700">
                      <span className="font-bold block text-[10px] uppercase text-slate-400 mb-0.5">
                        Worker Note:
                      </span>
                      &quot;{app.message}&quot;
                    </div>
                  )}

                  <p className="text-[11px] text-slate-400">
                    Applied on {new Date(app.appliedAt).toLocaleDateString()}
                  </p>
                </div>

                {/* Status and Action Buttons */}
                <div className="flex sm:flex-col items-center sm:items-end justify-between gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
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

                  {app.status === 'PENDING' ? (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleUpdateStatus(app.id, 'ACCEPTED')}
                        className="inline-flex items-center gap-1 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
                      >
                        <CheckCircle2 className="h-4 w-4" />
                        Accept
                      </button>
                      <button
                        onClick={() => handleUpdateStatus(app.id, 'REJECTED')}
                        className="inline-flex items-center gap-1 px-3 py-2 bg-slate-100 hover:bg-red-50 hover:text-red-700 text-slate-700 rounded-xl text-xs font-bold transition-colors"
                      >
                        <XCircle className="h-4 w-4" />
                        Reject
                      </button>
                    </div>
                  ) : (
                    <a
                      href={`tel:${app.worker.user.phone}`}
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold shadow-xs"
                    >
                      <Phone className="h-3.5 w-3.5" />
                      Call Worker ({app.worker.user.phone})
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
