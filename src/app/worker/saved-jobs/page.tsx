'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useApp } from '@/context/AppContext';
import DashboardShell from '@/components/DashboardShell';
import PageHeader from '@/components/ui/PageHeader';
import EmptyState from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import { Bookmark, Briefcase, MapPin, Building2, Trash2, ArrowRight } from 'lucide-react';

interface SavedJobItem {
  id: string;
  createdAt: string;
  job: {
    id: string;
    title: string;
    city: string;
    locality: string;
    wageAmount: number;
    wageType: string;
    requiredSkills: string[];
    business: { name: string; phone: string };
  };
}

export default function WorkerSavedJobsPage() {
  const { user, t, language } = useApp();
  const [savedJobs, setSavedJobs] = useState<SavedJobItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSaved = async () => {
    try {
      const res = await fetch('/api/worker/saved-jobs');
      const data = await res.json();
      if (data.savedJobs) setSavedJobs(data.savedJobs);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role === 'WORKER') {
      fetchSaved();
    }
  }, [user]);

  const handleRemove = async (jobId: string) => {
    try {
      await fetch(`/api/worker/saved-jobs?jobId=${jobId}`, { method: 'DELETE' });
      setSavedJobs((prev) => prev.filter((s) => s.job.id !== jobId));
    } catch {
      // ignore
    }
  };

  return (
    <DashboardShell role="WORKER">
      <PageHeader
        title={t.savedJobs}
        subtitle={
          language === 'hi'
            ? 'आपकी पसंदीदा व सुरक्षित रखी गई नौकरियां, जब चाहें 1-क्लिक में आवेदन करें'
            : 'Bookmarked job opportunities to review and apply when convenient'
        }
      />

      <div className="space-y-4">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-36 rounded-2xl" />
            ))}
          </div>
        ) : savedJobs.length === 0 ? (
          <EmptyState
            icon={Bookmark}
            title={language === 'hi' ? 'कोई सेव की गई नौकरी नहीं है' : 'No Saved Jobs Yet'}
            description={
              language === 'hi'
                ? 'मार्केटप्लेस में काम देखते समय बुकमार्क बटन दबाकर यहाँ सुरक्षित करें।'
                : 'Browse open marketplace jobs and click the bookmark icon to save them for later.'
            }
            action={
              <Link href="/jobs" className="ks-btn ks-btn-primary ks-btn-sm">
                {t.exploreJobs}
              </Link>
            }
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {savedJobs.map((item) => (
              <div key={item.id} className="ks-card p-5 space-y-3 flex flex-col justify-between">
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-bold text-ink text-base">{item.job.title}</h3>
                    <button
                      type="button"
                      onClick={() => handleRemove(item.job.id)}
                      className="text-muted hover:text-red-600 transition-colors"
                      title="Remove from saved"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                  <p className="flex items-center gap-1.5 text-xs text-muted mt-1">
                    <Building2 className="h-3.5 w-3.5 text-accent" />
                    <span>{item.job.business.name}</span>
                    <span>•</span>
                    <MapPin className="h-3.5 w-3.5" />
                    <span>{item.job.locality}, {item.job.city}</span>
                  </p>

                  <div className="flex flex-wrap gap-1.5 mt-2.5">
                    {item.job.requiredSkills.map((sk) => (
                      <span key={sk} className="rounded-md bg-subtle px-2 py-0.5 text-[10px] font-bold text-ink-soft">
                        {sk}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between border-t border-line pt-3 mt-2">
                  <span className="text-sm font-black text-green-700 dark:text-green-400">
                    ₹{Number(item.job.wageAmount).toLocaleString('en-IN')}{' '}
                    <span className="text-[10px] font-normal text-muted">
                      {item.job.wageType === 'DAILY' ? t.perDay : t.fixedWage}
                    </span>
                  </span>

                  <Link href={`/jobs/${item.job.id}`} className="ks-btn ks-btn-primary ks-btn-xs flex items-center gap-1">
                    <span>{t.applyNow}</span>
                    <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
