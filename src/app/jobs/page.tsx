'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useApp } from '@/context/AppContext';
import Reveal from '@/components/ui/Reveal';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import EmptyState from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import {
  Briefcase,
  MapPin,
  Search,
  Building2,
  CheckCircle,
  Clock,
  Sparkles,
  Lock,
  Edit3,
  List,
} from 'lucide-react';
import { POPULAR_CITIES } from '@/components/ui/CityInput';
import { cn } from '@/lib/cn';

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
  const { t, user, language } = useApp();
  const [jobs, setJobs] = useState<JobItem[]>([]);
  const [loading, setLoading] = useState(true);

  const isHi = language === 'hi';

  // Filter states
  const [city, setCity] = useState('All');
  const [customCityMode, setCustomCityMode] = useState(false);
  const [skill, setSkill] = useState('All');
  const [jobType, setJobType] = useState('All');
  const [search, setSearch] = useState('');
  const [appliedJobIds, setAppliedJobIds] = useState<Set<string>>(new Set());

  const availableCities = React.useMemo(() => {
    const list = [...POPULAR_CITIES];
    const customCities = jobs
      .map((j) => j.city)
      .filter((c) => c && !(list as readonly string[]).includes(c));
    return Array.from(new Set([...list, ...customCities]));
  }, [jobs]);

  const fetchJobs = async (searchOverride?: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (city !== 'All') params.append('city', city);
      if (skill !== 'All') params.append('skill', skill);
      if (jobType !== 'All') params.append('jobType', jobType);
      const term = searchOverride ?? search;
      if (term) params.append('search', term);

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
    // Honor ?search= from the global header search (and keep the input in sync)
    const urlSearch = new URLSearchParams(window.location.search).get('search') || '';
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (urlSearch) setSearch(urlSearch);
    fetchJobs(urlSearch);
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

  const resetFilters = () => {
    setCity('All');
    setCustomCityMode(false);
    setSkill('All');
    setJobType('All');
    setSearch('');
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
    <div className={cn("w-full bg-canvas", !user && "min-h-[calc(100dvh-4rem)] px-4 py-8 sm:px-6 lg:px-10 xl:px-12")}>
      <div className="w-full space-y-6">
        {/* Header Banner */}
        <div className="animate-fade-up relative overflow-hidden rounded-2xl bg-brand-950 p-6 text-white shadow-card sm:p-10">
          <div aria-hidden className="pointer-events-none absolute inset-0">
            <div className="absolute -top-24 right-16 h-64 w-96 rounded-full bg-brand-500/25 blur-[100px]" />
            <div className="absolute -bottom-16 left-10 h-52 w-72 rounded-full bg-accent/10 blur-[90px]" />
          </div>
          <div className="relative max-w-2xl space-y-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-brand-400/30 bg-brand-500/15 px-3 py-1 text-xs font-semibold text-faint">
              <Sparkles className="h-3.5 w-3.5 text-amber-400" aria-hidden />
              {isHi ? 'सत्यापित स्थानीय रोज़गार के अवसर' : 'Verified Local Employment Opportunities'}
            </span>
            <h1 className="text-3xl font-black tracking-tight sm:text-4xl">{t.jobs}</h1>
            <p className="text-xs text-faint sm:text-sm">
              {isHi ? 'स्थानीय दुकानदारों, व्यापारियों और ठेकेदारों द्वारा पोस्ट की गई रिक्तियां।' : 'Browse openings posted directly by local businesses, shopkeepers, and contractors.'}
            </p>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="ks-card space-y-4 p-4 sm:p-5">
          <form onSubmit={handleSearchSubmit} className="flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1 min-w-0">
              <Search
                className="pointer-events-none absolute top-3 left-3.5 h-4 w-4 text-muted"
                aria-hidden
              />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={isHi ? 'पद, व्यापार या इलाके से खोजें (उदा. Electrician)...' : 'Search by job title, business name, or locality…'}
                aria-label="Search jobs"
                className="ks-input pl-10"
              />
            </div>
            <Button type="submit" className="shrink-0">
              {t.search}
            </Button>
          </form>

          {/* Quick Filter dropdowns */}
          <div className="grid grid-cols-1 gap-3 border-t border-line pt-3 text-xs sm:grid-cols-3">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label htmlFor="flt-city" className="ks-label mb-0 flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5 text-accent" aria-hidden />
                  {t.city}
                </label>
                <button
                  type="button"
                  onClick={() => {
                    const next = !customCityMode;
                    setCustomCityMode(next);
                    if (!next && !availableCities.includes(city) && city !== 'All') {
                      setCity('All');
                    }
                  }}
                  className="text-[11px] font-medium text-accent hover:underline flex items-center gap-1"
                >
                  {customCityMode ? (
                    <>
                      <List className="h-3 w-3" />
                      <span>{isHi ? 'सूची' : 'List'}</span>
                    </>
                  ) : (
                    <>
                      <Edit3 className="h-3 w-3" />
                      <span>{isHi ? 'कोई भी शहर' : 'Any City'}</span>
                    </>
                  )}
                </button>
              </div>

              {customCityMode ? (
                <div className="relative">
                  <input
                    id="flt-city"
                    type="text"
                    value={city === 'All' ? '' : city}
                    onChange={(e) => setCity(e.target.value.trim() ? e.target.value : 'All')}
                    placeholder={isHi ? 'कोई भी शहर लिखें (उदा. Anand, Mumbai)...' : 'Type any city (e.g. Anand, Mumbai)...'}
                    className="ks-input py-1.5 text-xs pr-7"
                    autoFocus
                  />
                  {city !== 'All' && (
                    <button
                      type="button"
                      onClick={() => setCity('All')}
                      className="absolute right-2 top-2 text-[10px] text-muted hover:text-ink font-semibold"
                      title={isHi ? 'शहर फ़िल्टर हटाएं' : 'Clear city filter'}
                    >
                      ✕
                    </button>
                  )}
                </div>
              ) : (
                <select
                  id="flt-city"
                  value={city}
                  onChange={(e) => {
                    if (e.target.value === '__CUSTOM__') {
                      setCustomCityMode(true);
                      setCity('');
                    } else {
                      setCity(e.target.value);
                    }
                  }}
                  className="ks-select py-2 text-xs"
                >
                  <option value="All">{isHi ? 'सभी शहर (All Cities)' : 'All Cities'}</option>
                  <optgroup label={isHi ? '— उपलब्ध एवं लोकप्रिय शहर —' : '— Available & Popular Cities —'}>
                    {availableCities.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label={isHi ? '— अन्य शहर —' : '— Other City —'}>
                    <option value="__CUSTOM__">
                      {isHi ? '+ अन्य कोई शहर टाइप करें (Any Custom City)...' : '+ Type Any Other City (Custom City)...'}
                    </option>
                  </optgroup>
                </select>
              )}
            </div>

            <div>
              <label htmlFor="flt-skill" className="ks-label flex items-center gap-1">
                <Briefcase className="h-3.5 w-3.5 text-accent" aria-hidden />
                {isHi ? 'हुनर / कारीगरी' : 'Trade / Skill'}
              </label>
              <select
                id="flt-skill"
                value={skill}
                onChange={(e) => setSkill(e.target.value)}
                className="ks-select py-2 text-xs"
              >
                {skillsList.map((s) => (
                  <option key={s} value={s}>
                    {s === 'All' ? (isHi ? 'सभी हुनर' : 'All') : s}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="flt-type" className="ks-label flex items-center gap-1">
                <Clock className="h-3.5 w-3.5 text-accent" aria-hidden />
                {t.jobType}
              </label>
              <select
                id="flt-type"
                value={jobType}
                onChange={(e) => setJobType(e.target.value)}
                className="ks-select py-2 text-xs"
              >
                <option value="All">{isHi ? 'सभी प्रकार' : 'All Job Types'}</option>
                <option value="FULL_TIME">{isHi ? 'फुल टाइम' : 'Full Time'}</option>
                <option value="CONTRACT">{isHi ? 'ठेका / कॉन्ट्रैक्ट' : 'Contract'}</option>
                <option value="TEMPORARY">{isHi ? 'अस्थायी (दिहाड़ी)' : 'Temporary'}</option>
                <option value="PART_TIME">{isHi ? 'पार्ट टाइम' : 'Part Time'}</option>
              </select>
            </div>
          </div>
        </div>

        {/* Results Count */}
        <div className="flex items-center justify-between px-1 text-xs text-muted">
          <span>
            {isHi ? 'उपलब्ध नौकरियां: ' : 'Found '}
            <strong className="text-ink">{jobs.length}</strong>
            {isHi ? '' : ' available jobs'}
          </span>
          {city !== 'All' && (
            <span>
              {t.city}: <strong className="text-accent-strong">{city}</strong>
            </span>
          )}
        </div>

        {/* Jobs Grid */}
        {loading ? (
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-64 rounded-2xl" />
            ))}
          </div>
        ) : jobs.length === 0 ? (
          <EmptyState
            icon={Briefcase}
            title="No matching jobs found"
            description="Try clearing some filters or searching with a different trade or city keyword."
            action={
              <Button size="sm" variant="secondary" onClick={resetFilters}>
                Reset Filters
              </Button>
            }
            className="border-dashed"
          />
        ) : (
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
            {jobs.map((job, i) => {
              const isApplied = appliedJobIds.has(job.id);
              return (
                <Reveal key={job.id} delay={Math.min(i * 60, 300)}>
                  <div className="ks-card ks-card-hover flex h-full flex-col justify-between p-6">
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <Badge tone="neutral">{job.jobType.replace('_', ' ')}</Badge>
                          <Badge tone="brand">
                            <MapPin className="h-3 w-3" aria-hidden />
                            {job.city}
                          </Badge>
                        </div>
                        <Badge tone="emerald" className="shrink-0">
                          ₹{Number(job.wageAmount).toLocaleString('en-IN')}{' '}
                          {job.wageType === 'DAILY' ? t.perDay : 'fixed'}
                        </Badge>
                      </div>

                      <Link href={`/jobs/${job.id}`}>
                        <h2 className="mt-3 line-clamp-2 text-lg font-bold text-ink transition-colors hover:text-accent-strong">
                          {job.title}
                        </h2>
                      </Link>

                      <div className="mt-1.5 flex items-center gap-1.5 text-xs font-medium text-muted">
                        <Building2 className="h-3.5 w-3.5 shrink-0 text-accent" aria-hidden />
                        <span>{job.business.name}</span>
                      </div>

                      <div className="mt-2 flex items-center justify-between text-xs text-ink-soft">
                        <div className="flex items-center gap-1.5">
                          <MapPin className="h-3.5 w-3.5 shrink-0 text-muted" aria-hidden />
                          <span>
                            {job.locality}, {job.city}
                          </span>
                        </div>
                        <span
                          className="flex items-center gap-0.5 text-[10px] font-bold text-green-700 dark:text-green-300"
                          title="Guaranteed locked wage"
                        >
                          <Lock className="h-3 w-3" aria-hidden />
                          Locked Wage
                        </span>
                      </div>

                      <p className="mt-3 line-clamp-2 text-xs leading-relaxed text-ink-soft">
                        {job.description}
                      </p>

                      <div className="mt-4 flex flex-wrap gap-1">
                        {job.requiredSkills.map((sk, idx) => (
                          <span
                            key={idx}
                            className="rounded-md border border-brand-100 bg-brand-50 px-2 py-0.5 text-[11px] font-medium text-ink"
                          >
                            {sk}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="mt-6 flex items-center justify-between border-t border-line pt-4">
                      <span className="text-[11px] text-muted">
                        {job._count.applications}{' '}
                        {job._count.applications === 1 ? 'applicant' : 'applicants'}
                      </span>

                      <div className="flex items-center gap-2">
                        {isApplied ? (
                          <span className="ks-badge bg-green-500/15 text-green-800 dark:text-green-300">
                            <CheckCircle className="h-3.5 w-3.5" aria-hidden />
                            {t.applied}
                          </span>
                        ) : (
                          <Link
                            href={`/jobs/${job.id}`}
                            className={cn('ks-btn ks-btn-primary ks-btn-sm')}
                          >
                            {t.apply}
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                </Reveal>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
