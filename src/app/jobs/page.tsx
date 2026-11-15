'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useApp } from '@/context/AppContext';
import {
  Briefcase,
  MapPin,
  Search,
  Filter,
  DollarSign,
  Clock,
  ArrowRight,
  CheckCircle,
  Building2,
  Sparkles,
} from 'lucide-react';

interface JobItem {
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
    city: string;
    locality: string;
    phone: string;
  };
  _count: {
    applications: number;
  };
}

export default function JobsMarketplacePage() {
  const { t, user } = useApp();
  const [jobs, setJobs] = useState<JobItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter states
  const [city, setCity] = useState('All');
  const [skill, setSkill] = useState('All');
  const [jobType, setJobType] = useState('All');
  const [search, setSearch] = useState('');
  const [appliedJobIds, setAppliedJobIds] = useState<Set<string>>(new Set());

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (city !== 'All') params.append('city', city);
      if (skill !== 'All') params.append('skill', skill);
      if (jobType !== 'All') params.append('jobType', jobType);
      if (search) params.append('search', search);

      const res = await fetch(`/api/jobs?${params.toString()}`);
      const data = await res.json();
      if (data.jobs) {
        setJobs(data.jobs);
      }
    } catch (err) {
      console.error('Error fetching jobs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
    // Fetch worker's applications to highlight jobs already applied to
    if (user?.role === 'WORKER') {
      fetch('/api/worker/applications')
        .then((res) => res.json())
        .then((data) => {
          if (data.applications) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const ids = new Set<string>(data.applications.map((a: any) => a.jobId));
            setAppliedJobIds(ids);
          }
        })
        .catch(() => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [city, skill, jobType, user]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchJobs();
  };

  const skillsList = [
    'All',
    'Electrician',
    'Plumbing',
    'Masonry',
    'Carpenter',
    'Welder',
    'Delivery worker',
    'Wiring',
    'Tile Laying',
  ];

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header Banner */}
        <div className="rounded-3xl bg-gradient-to-r from-teal-800 to-teal-950 p-6 sm:p-10 text-white shadow-md relative overflow-hidden">
          <div className="relative z-10 max-w-2xl space-y-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-600/50 border border-teal-400/30 text-teal-200 text-xs font-semibold">
              <Sparkles className="h-3.5 w-3.5 text-amber-400" />
              Verified Local Employment Opportunities
            </span>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight">
              {t.jobs}
            </h1>
            <p className="text-xs sm:text-sm text-teal-100">
              Browse openings posted directly by local businesses, shopkeepers, and contractors.
            </p>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by job title, business name, or locality..."
                className="w-full rounded-xl border border-slate-300 pl-10 pr-4 py-2.5 text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs sm:text-sm shadow-xs transition-colors shrink-0"
            >
              {t.search}
            </button>
          </form>

          {/* Quick Filter dropdowns */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-100 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1 flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5 text-teal-600" />
                City
              </label>
              <select
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full rounded-lg border border-slate-300 p-2 text-slate-800 bg-white"
              >
                <option value="All">All Cities</option>
                <option value="Ahmedabad">Ahmedabad</option>
                <option value="Vadodara">Vadodara</option>
                <option value="Surat">Surat</option>
                <option value="Rajkot">Rajkot</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1 flex items-center gap-1">
                <Briefcase className="h-3.5 w-3.5 text-teal-600" />
                Trade / Skill
              </label>
              <select
                value={skill}
                onChange={(e) => setSkill(e.target.value)}
                className="w-full rounded-lg border border-slate-300 p-2 text-slate-800 bg-white"
              >
                {skillsList.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1 flex items-center gap-1">
                <Clock className="h-3.5 w-3.5 text-teal-600" />
                Job Type
              </label>
              <select
                value={jobType}
                onChange={(e) => setJobType(e.target.value)}
                className="w-full rounded-lg border border-slate-300 p-2 text-slate-800 bg-white"
              >
                <option value="All">All Job Types</option>
                <option value="FULL_TIME">Full Time</option>
                <option value="CONTRACT">Contract</option>
                <option value="TEMPORARY">Temporary</option>
                <option value="PART_TIME">Part Time</option>
              </select>
            </div>
          </div>
        </div>

        {/* Results Count */}
        <div className="flex items-center justify-between text-xs text-slate-500 px-1">
          <span>Found <strong>{jobs.length}</strong> available jobs</span>
          {city !== 'All' && <span>City: <strong className="text-teal-700">{city}</strong></span>}
        </div>

        {/* Jobs Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-56 rounded-2xl bg-white border border-slate-200 animate-pulse p-6"></div>
            ))}
          </div>
        ) : jobs.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 space-y-3">
            <Briefcase className="h-12 w-12 text-slate-300 mx-auto" />
            <h3 className="text-lg font-bold text-slate-800">No matching jobs found</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Try clearing some filters or searching with a different trade or city keyword.
            </p>
            <button
              onClick={() => {
                setCity('All');
                setSkill('All');
                setJobType('All');
                setSearch('');
              }}
              className="px-4 py-2 bg-teal-600 text-white rounded-lg text-xs font-bold"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {jobs.map((job) => {
              const isApplied = appliedJobIds.has(job.id);
              return (
                <div
                  key={job.id}
                  className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 uppercase">
                        {job.jobType.replace('_', ' ')}
                      </span>
                      <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                        ₹{Number(job.wageAmount).toFixed(0)} {job.wageType === 'DAILY' ? t.perDay : 'fixed'}
                      </span>
                    </div>

                    <h2 className="text-lg font-bold text-slate-900 mt-3 line-clamp-2">
                      {job.title}
                    </h2>

                    <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium mt-1.5">
                      <Building2 className="h-3.5 w-3.5 text-teal-600 shrink-0" />
                      <span>{job.business.name}</span>
                    </div>

                    <div className="flex items-center gap-1.5 text-xs text-slate-600 mt-2">
                      <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                      <span>{job.locality}, {job.city}</span>
                    </div>

                    <p className="text-xs text-slate-600 mt-3 line-clamp-2 leading-relaxed">
                      {job.description}
                    </p>

                    <div className="flex flex-wrap gap-1 mt-4">
                      {job.requiredSkills.map((sk, idx) => (
                        <span
                          key={idx}
                          className="text-[11px] font-medium bg-teal-50 text-teal-800 px-2 py-0.5 rounded-md border border-teal-100"
                        >
                          {sk}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[11px] text-slate-400">
                      {job._count.applications} {job._count.applications === 1 ? 'applicant' : 'applicants'}
                    </span>

                    <div className="flex items-center gap-2">
                      <Link
                        href={`/jobs/${job.id}`}
                        className="text-xs font-bold text-teal-700 hover:text-teal-800"
                      >
                        {t.viewDetails}
                      </Link>
                      {isApplied ? (
                        <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-100 text-emerald-800 text-xs font-bold">
                          <CheckCircle className="h-3.5 w-3.5" />
                          {t.applied}
                        </span>
                      ) : (
                        <Link
                          href={`/jobs/${job.id}`}
                          className="px-3.5 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-xs transition-colors"
                        >
                          {t.apply}
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
