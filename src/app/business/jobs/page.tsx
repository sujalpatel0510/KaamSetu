'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Sidebar from '@/components/Sidebar';
import { Briefcase, Plus, Users, MapPin, Calendar, CheckCircle, XCircle, ArrowRight } from 'lucide-react';

interface EmployerJob {
  id: string;
  title: string;
  description: string;
  wageAmount: number;
  wageType: string;
  jobType: string;
  status: 'OPEN' | 'FILLED' | 'CLOSED';
  city: string;
  locality: string;
  createdAt: string;
  _count: {
    applications: number;
  };
}

export default function BusinessJobsPage() {
  const [jobs, setJobs] = useState<EmployerJob[]>([]);
  const [loading, setLoading] = useState(true);

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
    try {
      const res = await fetch(`/api/jobs/${jobId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus }),
      });
      if (res.ok) fetchJobs();
    } catch {
      console.error('Failed to update job status');
    }
  };

  return (
    <div className="flex flex-col lg:flex-row min-h-[calc(100vh-4rem)] bg-slate-50">
      <Sidebar role="BUSINESS_OWNER" />

      <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-900">Manage Job Postings & Hiring</h1>
            <p className="text-xs text-slate-500">
              Publish requirements, review applicant profiles, and hire verified local workers.
            </p>
          </div>

          <Link
            href="/business/jobs/create"
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-md transition-colors shrink-0"
          >
            <Plus className="h-4 w-4" />
            Post New Job
          </Link>
        </div>

        {/* Jobs List */}
        <div className="space-y-4">
          {loading ? (
            <p className="text-xs text-slate-400 py-8 text-center">Loading posted jobs...</p>
          ) : jobs.length === 0 ? (
            <div className="bg-white p-12 text-center rounded-3xl border border-slate-200 text-xs text-slate-400 space-y-3">
              <Briefcase className="h-10 w-10 text-slate-300 mx-auto" />
              <p className="font-bold text-slate-700">No job listings yet.</p>
              <p>Hire skilled electricians, plumbers, masons, or shop helpers nearby.</p>
              <Link
                href="/business/jobs/create"
                className="inline-block mt-2 px-4 py-2 bg-teal-600 text-white rounded-xl text-xs font-bold"
              >
                + Post Your First Job
              </Link>
            </div>
          ) : (
            jobs.map((j) => (
              <div
                key={j.id}
                className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                        j.status === 'OPEN'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {j.status}
                    </span>
                    <span className="text-xs text-slate-400">
                      Posted on {new Date(j.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-slate-900">{j.title}</h3>

                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5 text-slate-400" />
                      {j.locality}, {j.city}
                    </span>
                    <span className="font-bold text-emerald-700">
                      ₹{Number(j.wageAmount).toFixed(0)} {j.wageType}
                    </span>
                    <span>Type: {j.jobType.replace('_', ' ')}</span>
                  </div>
                </div>

                <div className="flex sm:flex-col items-center sm:items-end gap-2.5 shrink-0">
                  <Link
                    href={`/business/jobs/${j.id}/applicants`}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs rounded-xl shadow-xs transition-colors"
                  >
                    <Users className="h-4 w-4" />
                    Review Applicants ({j._count.applications})
                  </Link>

                  <button
                    onClick={() => handleToggleStatus(j.id, j.status)}
                    className="text-xs font-semibold text-slate-500 hover:text-slate-800 underline"
                  >
                    {j.status === 'OPEN' ? 'Mark as Closed' : 'Reopen Listing'}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  );
}
