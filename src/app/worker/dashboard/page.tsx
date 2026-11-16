'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import DashboardShell from '@/components/DashboardShell';
import StatCard from '@/components/ui/StatCard';
import EmptyState from '@/components/ui/EmptyState';
import { ApplicationStatusBadge } from '@/components/ui/Badge';
import { Skeleton, DashboardSkeleton } from '@/components/ui/Skeleton';
import { formatDate } from '@/lib/date';
import {
  Briefcase,
  CheckCircle2,
  Clock,
  MapPin,
  ArrowRight,
  Phone,
  ShieldCheck,
  Search,
  Lock,
  Building2,
  UserCheck,
} from 'lucide-react';

interface ApplicationItem {
  id: string;
  status: string;
  appliedAt: string;
  job: {
    id: string;
    title: string;
    wageAmount: number;
    wageType: string;
    city: string;
    locality: string;
    business: { name: string; phone: string };
  };
}

interface RecommendedJob {
  id: string;
  title: string;
  wageAmount: number;
  wageType: string;
  city: string;
  locality: string;
  requiredSkills: string[];
  business: { name: string; phone: string };
}

export default function WorkerDashboardPage() {
  const router = useRouter();
  const { user, isLoading, t, language } = useApp();
  const [applications, setApplications] = useState<ApplicationItem[]>([]);
  const [recommendedJobs, setRecommendedJobs] = useState<RecommendedJob[]>([]);
  const [loadingApps, setLoadingApps] = useState(true);
  const [loadingJobs, setLoadingJobs] = useState(true);
  const [searchKeyword, setSearchKeyword] = useState('');

  const isHi = language === 'hi';

  useEffect(() => {
    if (!isLoading && (!user || user.role !== 'WORKER')) {
      if (user?.role === 'BUSINESS_OWNER') {
        router.push('/business/dashboard');
      } else if (!user) {
        router.push('/login');
      }
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    if (user?.role === 'WORKER') {
      // 1. Fetch worker applications
      fetch('/api/worker/applications')
        .then((res) => res.json())
        .then((data) => {
          if (data.applications) setApplications(data.applications);
        })
        .catch(() => {})
        .finally(() => setLoadingApps(false));

      // 2. Fetch active jobs for recommended feed
      fetch('/api/jobs?status=OPEN')
        .then((res) => res.json())
        .then((data) => {
          if (data.jobs) setRecommendedJobs(data.jobs.slice(0, 3));
        })
        .catch(() => {})
        .finally(() => setLoadingJobs(false));
    }
  }, [user]);

  if (isLoading || (user && user.role !== 'WORKER' && user.role !== undefined)) {
    return (
      <DashboardShell role="WORKER">
        <DashboardSkeleton cards={3} />
      </DashboardShell>
    );
  }

  const acceptedCount = applications.filter((a) => a.status === 'ACCEPTED').length;
  const pendingCount = applications.filter((a) => a.status === 'PENDING').length;
  const skills = user?.workerProfile?.skills || [];
  const profileCompletion = [
    Boolean(user?.name),
    skills.length > 0,
    Boolean(user?.workerProfile?.city),
    Boolean(user?.workerProfile?.locality),
  ].filter(Boolean).length;
  const completionPct = Math.round((profileCompletion / 4) * 100);

  const popularTrades = [
    'Electrician',
    'Plumbing',
    'Masonry',
    'Carpenter',
    'Welder',
    'Helper',
  ];

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchKeyword.trim()) {
      router.push(`/jobs?search=${encodeURIComponent(searchKeyword)}`);
    } else {
      router.push('/jobs');
    }
  };

  return (
    <DashboardShell role="WORKER">
      {/* ───────────────────────────────────────────────────────────
          MODULE 1: Welcome Section & Availability Status
         ─────────────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-2xl bg-brand-950 p-6 sm:p-8 text-white shadow-card">
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div className="absolute -top-24 right-16 h-64 w-96 rounded-full bg-brand-600/30 blur-[100px]" />
          <div className="absolute -bottom-16 left-10 h-52 w-72 rounded-full bg-accent/20 blur-[90px]" />
        </div>
        <div className="relative flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
          <div className="space-y-1.5 min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-md bg-white/10 px-2.5 py-0.5 text-[10px] font-bold text-accent uppercase">
                <ShieldCheck className="h-3.5 w-3.5 text-accent" />
                {t.workerSpace}
              </span>
              <span className="flex items-center gap-1 text-[11px] text-slate-300 font-medium">
                <MapPin className="h-3.5 w-3.5 text-slate-400" />
                {user?.workerProfile?.locality || 'Gujarat'}, {user?.workerProfile?.city || 'India'}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              {t.welcomeWorker}, {user?.name || 'Worker'}!
            </h1>
            <p className="text-xs sm:text-sm text-slate-300">
              {user?.workerProfile?.availability ? (
                <span className="inline-flex items-center gap-1.5 font-semibold text-green-400">
                  <span className="h-2 w-2 rounded-full bg-green-400 animate-pulse" />
                  {t.availableForWork}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 font-semibold text-amber-400">
                  <span className="h-2 w-2 rounded-full bg-amber-400" />
                  {t.currentlyBusy}
                </span>
              )}
            </p>
          </div>

          <Link
            href="/jobs"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-accent hover:bg-accent-strong text-accent-fg px-5 py-2.5 text-sm font-bold shadow-md shrink-0 group whitespace-nowrap transition-all"
          >
            <Briefcase className="h-4 w-4 shrink-0" />
            <span>{t.exploreJobs}</span>
            <ArrowRight className="h-4 w-4 shrink-0 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
      </div>

      {/* ───────────────────────────────────────────────────────────
          MODULE 2: Profile Completion Progress Bar
         ─────────────────────────────────────────────────────────── */}
      <div className="ks-card p-5 space-y-3">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <UserCheck className="h-4 w-4 text-accent" />
            <span className="font-bold text-ink">{t.profileCompleteness}</span>
          </div>
          <span className="font-black text-accent-strong tabular-nums">{completionPct}%</span>
        </div>

        <div
          className="h-2 w-full overflow-hidden rounded-full bg-subtle"
          role="progressbar"
          aria-valuenow={completionPct}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div
            className="h-full rounded-full bg-accent transition-all duration-700"
            style={{ width: `${completionPct}%` }}
          />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-muted">
          <span>
            {completionPct === 100
              ? isHi
                ? 'आपकी प्रोफ़ाइल 100% पूर्ण और सत्यापित है!'
                : 'Your profile is 100% complete and verified!'
              : isHi
              ? 'अधिक नौकरियां पाने के लिए अपनी प्रोफ़ाइल में सभी हुनर और अनुभव जोड़ें।'
              : 'Add trades and locality to increase your chances of getting hired nearby.'}
          </span>
          <Link
            href="/worker/profile"
            className="font-bold text-accent hover:underline flex items-center gap-1"
          >
            <span>{t.edit} {t.profile}</span>
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      </div>

      {/* ───────────────────────────────────────────────────────────
          MODULE 3: Interactive Job Search Bar
         ─────────────────────────────────────────────────────────── */}
      <div className="ks-card p-5 space-y-3">
        <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-2.5">
          <div className="relative flex-1 min-w-0">
            <Search className="pointer-events-none absolute top-3 left-3.5 h-4 w-4 text-muted" />
            <input
              type="text"
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              placeholder={isHi ? 'हुनर, काम या इलाका खोजें (उदा. Electrician, Maninagar)...' : 'Search trade, job title or locality (e.g. Electrician, Ahmedabad)...'}
              className="ks-input pl-10"
            />
          </div>
          <button
            type="submit"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white px-6 py-2.5 text-sm font-bold shadow-sm shrink-0 whitespace-nowrap active:scale-95 transition-all"
          >
            <Search className="h-4 w-4 shrink-0" />
            <span>{t.search}</span>
          </button>
        </form>

        <div className="flex flex-wrap items-center gap-1.5 text-xs text-muted pt-1">
          <span className="font-semibold text-ink-soft">{isHi ? 'लोकप्रिय काम:' : 'Popular Trades:'}</span>
          {popularTrades.map((trade) => (
            <Link
              key={trade}
              href={`/jobs?skill=${encodeURIComponent(trade)}`}
              className="rounded-lg border border-line bg-subtle px-2.5 py-1 text-[11px] font-bold text-ink-soft hover:border-accent hover:text-accent transition-colors"
            >
              {trade}
            </Link>
          ))}
        </div>
      </div>

      {/* ───────────────────────────────────────────────────────────
          MODULE 4: Recommended Available Jobs (Primary User Journey)
         ─────────────────────────────────────────────────────────── */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-ink">{t.recommendedJobs}</h2>
            <p className="text-xs text-muted">{t.lockedWageNotice}</p>
          </div>
          <Link
            href="/jobs"
            className="text-xs font-bold text-accent hover:underline flex items-center gap-1"
          >
            <span>{t.viewAll}</span>
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>

        {loadingJobs ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-44 rounded-2xl" />
            ))}
          </div>
        ) : recommendedJobs.length === 0 ? (
          <EmptyState
            icon={Briefcase}
            title={t.noJobsFound}
            description={t.startApplyingDesc}
            action={
              <Link href="/jobs" className="ks-btn ks-btn-primary ks-btn-sm">
                {t.exploreJobs}
              </Link>
            }
            className="border-dashed shadow-none"
          />
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {recommendedJobs.map((job) => (
              <div
                key={job.id}
                className="ks-card ks-card-hover flex flex-col justify-between p-5 space-y-4"
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-1 rounded-md bg-accent-soft px-2 py-0.5 text-[10px] font-bold text-accent-strong uppercase shrink-0">
                      <Lock className="h-3 w-3" />
                      <span>{isHi ? 'मजदूरी सुरक्षित' : 'Wage Locked'}</span>
                    </span>
                    <span className="text-sm font-black text-green-700 dark:text-green-400 tabular-nums shrink-0">
                      ₹{Number(job.wageAmount).toLocaleString('en-IN')}{' '}
                      <span className="text-[10px] font-normal text-muted">
                        {job.wageType === 'DAILY' ? t.perDay : t.fixedWage}
                      </span>
                    </span>
                  </div>

                  <Link href={`/jobs/${job.id}`}>
                    <h3 className="mt-2.5 font-bold text-ink text-base hover:text-accent transition-colors line-clamp-1">
                      {job.title}
                    </h3>
                  </Link>

                  <p className="mt-1 flex items-center gap-1.5 text-xs text-muted">
                    <Building2 className="h-3.5 w-3.5 text-faint" />
                    <span>{job.business.name}</span>
                  </p>

                  <p className="mt-0.5 flex items-center gap-1.5 text-[11px] text-faint">
                    <MapPin className="h-3 w-3 text-faint" />
                    <span>{job.locality}, {job.city}</span>
                  </p>
                </div>

                <div className="flex items-center justify-between border-t border-line pt-3">
                  <div className="flex flex-wrap gap-1">
                    {job.requiredSkills.slice(0, 2).map((sk, idx) => (
                      <span
                        key={idx}
                        className="rounded-md bg-subtle px-2 py-0.5 text-[10px] font-semibold text-ink-soft"
                      >
                        {sk}
                      </span>
                    ))}
                  </div>

                  <Link
                    href={`/jobs/${job.id}`}
                    className="ks-btn ks-btn-primary ks-btn-sm"
                  >
                    {t.applyNow}
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ───────────────────────────────────────────────────────────
          MODULE 5: Application Status Overview (Pipeline)
         ─────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          icon={Briefcase}
          label={t.totalApplied}
          value={applications.length}
          tone="brand"
        />
        <StatCard
          icon={CheckCircle2}
          label={t.acceptedHired}
          value={acceptedCount}
          tone="emerald"
        />
        <StatCard
          icon={Clock}
          label={t.pendingReview}
          value={pendingCount}
          tone="amber"
        />
      </div>

      {/* ───────────────────────────────────────────────────────────
          MODULE 6: Recent Application Activity & Status Tracker
         ─────────────────────────────────────────────────────────── */}
      <div className="ks-card p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-line pb-3">
          <div>
            <h2 className="text-base font-bold text-ink">{t.myApplications}</h2>
            <p className="text-xs text-muted">
              {applications.length} {isHi ? 'आवेदन रिकॉर्ड किए गए' : 'applications submitted'}
            </p>
          </div>
          <Link
            href="/worker/applications"
            className="text-xs font-bold text-accent hover:underline flex items-center gap-1"
          >
            <span>{t.viewAll}</span>
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>

        {loadingApps ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-14 rounded-xl" />
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
            className="border-dashed shadow-none"
          />
        ) : (
          <div className="divide-y divide-line">
            {applications.slice(0, 5).map((app) => (
              <div
                key={app.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between py-3.5 gap-2.5 text-xs"
              >
                <div>
                  <h3 className="font-bold text-ink text-sm">{app.job.title}</h3>
                  <p className="text-[11px] text-muted">
                    {app.job.business.name} • ₹
                    {Number(app.job.wageAmount).toLocaleString('en-IN')}{' '}
                    {app.job.wageType === 'DAILY' ? t.perDay : t.fixedWage} •{' '}
                    {formatDate(app.appliedAt)}
                  </p>
                </div>

                <div className="flex items-center gap-2.5">
                  <ApplicationStatusBadge status={app.status} />
                  {app.status === 'ACCEPTED' && app.job.business.phone && (
                    <a
                      href={`tel:${app.job.business.phone}`}
                      className="inline-flex items-center gap-1 rounded-xl bg-green-600 px-3 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-green-700 transition-colors"
                    >
                      <Phone className="h-3.5 w-3.5" />
                      <span>{t.callEmployer}</span>
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
