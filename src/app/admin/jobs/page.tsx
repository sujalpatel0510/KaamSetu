'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useApp } from '@/context/AppContext';
import PageHeader from '@/components/ui/PageHeader';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { toast } from '@/components/ui/Toast';
import EmptyState from '@/components/ui/EmptyState';
import {
  Briefcase,
  Search,
  Download,
  RefreshCw,
  Phone,
  Trash2,
  CheckCircle2,
  XCircle,
  ExternalLink,
  MapPin,
  IndianRupee,
} from 'lucide-react';
import { cn } from '@/lib/cn';
import { formatDate } from '@/lib/date';

const formatCurrency = (amount: number) => `₹${Math.round(amount).toLocaleString('en-IN')}`;

interface JobRecord {
  id: string;
  title: string;
  description: string;
  requiredSkills: string[];
  city: string;
  locality: string;
  wageAmount: number;
  wageType: 'DAILY' | 'FIXED';
  status: 'OPEN' | 'FILLED' | 'CLOSED';
  createdAt: string;
  business: {
    name: string;
    phone: string;
    category: string;
  };
  _count: {
    applications: number;
  };
}

export default function AdminJobsPage() {
  const { language } = useApp();
  const isHi = language === 'hi';

  const [jobs, setJobs] = useState<JobRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'OPEN' | 'FILLED' | 'CLOSED'>('ALL');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchJobs = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/data');
      if (!res.ok) throw new Error('Failed to fetch jobs');
      const data = await res.json();
      setJobs(data.jobs || []);
    } catch (err: any) {
      toast.error(err.message || 'Error fetching jobs');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  const updateJobStatus = async (jobId: string, newStatus: 'OPEN' | 'CLOSED') => {
    try {
      setActionLoading(jobId);
      const res = await fetch('/api/admin/jobs', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId, status: newStatus }),
      });
      if (!res.ok) throw new Error('Failed to update job status');
      setJobs((prev) =>
        prev.map((j) => (j.id === jobId ? { ...j, status: newStatus } : j))
      );
      toast.success(
        newStatus === 'CLOSED'
          ? (isHi ? 'नौकरी बंद / मॉडरेट कर दी गई' : 'Job moderated and closed')
          : (isHi ? 'नौकरी पुनः खोल दी गई' : 'Job re-opened')
      );
    } catch (err: any) {
      toast.error(err.message || 'Action failed');
    } finally {
      setActionLoading(null);
    }
  };

  const deleteJob = async (jobId: string) => {
    if (!window.confirm(isHi ? 'क्या आप इस नौकरी को हटाना चाहते हैं?' : 'Are you sure you want to delete this job posting?')) {
      return;
    }
    try {
      setActionLoading(jobId);
      const res = await fetch(`/api/admin/jobs?id=${jobId}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete job');
      setJobs((prev) => prev.filter((j) => j.id !== jobId));
      toast.success(isHi ? 'नौकरी सफलतापूर्वक हटा दी गई' : 'Job removed from marketplace');
    } catch (err: any) {
      toast.error(err.message || 'Deletion failed');
    } finally {
      setActionLoading(null);
    }
  };

  const filtered = jobs.filter((j) => {
    const q = search.toLowerCase();
    const matchesSearch =
      j.title.toLowerCase().includes(q) ||
      j.city.toLowerCase().includes(q) ||
      j.business.name.toLowerCase().includes(q) ||
      j.requiredSkills.some((s) => s.toLowerCase().includes(q));
    const matchesStatus = statusFilter === 'ALL' || j.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const exportCSV = () => {
    const headers = ['Title', 'Business', 'City', 'Wage', 'Wage Type', 'Applications', 'Status', 'Date'];
    const rows = filtered.map((j) => [
      `"${j.title.replace(/"/g, '""')}"`,
      `"${j.business.name.replace(/"/g, '""')}"`,
      j.city,
      j.wageAmount,
      j.wageType,
      j._count.applications,
      j.status,
      j.createdAt,
    ]);
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `kaamsetu_jobs_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success(isHi ? 'नौकरियों की सूची डाउनलोड हो गई' : 'Jobs CSV exported');
  };

  return (
    <div className="space-y-6 pb-12 w-full max-w-full">
      <PageHeader
        title={isHi ? 'नौकरियां व बाज़ार मॉडरेशन' : 'Job Marketplace Moderation'}
        description={
          isHi
            ? 'दुकानदारों द्वारा पोस्ट की गई रिक्तियों की समीक्षा करें, वेतन जांचें और अनैतिक या स्पैम लिस्टिंग हटाएं।'
            : 'Review all employer postings, wage offerings, application counts, and moderate spam listings.'
        }
        actions={
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" onClick={fetchJobs} disabled={loading}>
              <RefreshCw className={cn('h-3.5 w-3.5 mr-1', loading && 'animate-spin')} />
              {isHi ? 'रीफ़्रेश' : 'Refresh'}
            </Button>
            <Button variant="secondary" size="sm" onClick={exportCSV}>
              <Download className="h-3.5 w-3.5 mr-1" />
              {isHi ? 'CSV निर्यात' : 'Export CSV'}
            </Button>
          </div>
        }
      />

      {/* KPI Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="ks-card p-4">
          <p className="text-[11px] font-bold uppercase tracking-wider text-muted">
            {isHi ? 'कुल नौकरियां' : 'Total Postings'}
          </p>
          <p className="text-2xl font-black text-ink mt-1 tabular-nums">{jobs.length}</p>
        </div>
        <div className="ks-card p-4">
          <p className="text-[11px] font-bold uppercase tracking-wider text-muted">
            {isHi ? 'सक्रिय रिक्तियां' : 'Active Openings'}
          </p>
          <p className="text-2xl font-black text-green-700 dark:text-green-400 mt-1 tabular-nums">
            {jobs.filter((j) => j.status === 'OPEN').length}
          </p>
        </div>
        <div className="ks-card p-4">
          <p className="text-[11px] font-bold uppercase tracking-wider text-muted">
            {isHi ? 'भरी गई नौकरियां' : 'Filled Jobs'}
          </p>
          <p className="text-2xl font-black text-[#163A35] dark:text-[#B7D86B] mt-1 tabular-nums">
            {jobs.filter((j) => j.status === 'FILLED').length}
          </p>
        </div>
        <div className="ks-card p-4">
          <p className="text-[11px] font-bold uppercase tracking-wider text-muted">
            {isHi ? 'कुल आवेदन' : 'Total Applications'}
          </p>
          <p className="text-2xl font-black text-[#C66A45] mt-1 tabular-nums">
            {jobs.reduce((acc, j) => acc + (j._count?.applications || 0), 0)}
          </p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="ks-card p-4">
        <div className="flex flex-col md:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={
                isHi
                  ? 'नौकरी का शीर्षक, हुनर, शहर या दुकान से खोजें...'
                  : 'Search by title, skill, city, or business...'
              }
              className="ks-input pl-10"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="ks-select text-xs w-full md:w-44"
          >
            <option value="ALL">{isHi ? 'सभी स्थितियां' : 'All Status'}</option>
            <option value="OPEN">{isHi ? 'खुली (Open)' : 'Open'}</option>
            <option value="FILLED">{isHi ? 'भर चुकी (Filled)' : 'Filled'}</option>
            <option value="CLOSED">{isHi ? 'बंद (Closed)' : 'Closed'}</option>
          </select>
        </div>
      </div>

      {/* Jobs Table */}
      <div className="ks-card overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-muted font-bold animate-pulse">
            {isHi ? 'नौकरियां लोड हो रही हैं...' : 'Loading job marketplace data...'}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={Briefcase}
            title={isHi ? 'कोई नौकरी नहीं मिली' : 'No jobs found'}
            description={
              isHi
                ? 'अपने खोज शब्द या फ़िल्टर बदलकर दोबारा प्रयास करें।'
                : 'Try adjusting your search criteria.'
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="ks-table min-w-[850px]">
              <thead>
                <tr>
                  <th>{isHi ? 'नौकरी का विवरण' : 'Job Title & Store'}</th>
                  <th>{isHi ? 'स्थान' : 'Location'}</th>
                  <th>{isHi ? 'तयशुदा वेतन' : 'Wage / Pay'}</th>
                  <th className="text-center">{isHi ? 'आवेदन' : 'Applications'}</th>
                  <th>{isHi ? 'स्थिति' : 'Status'}</th>
                  <th>{isHi ? 'दिनांक' : 'Posted'}</th>
                  <th className="text-right">{isHi ? 'मॉडरेशन कार्रवाई' : 'Moderation Actions'}</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((j) => (
                  <tr key={j.id}>
                    <td>
                      <div>
                        <Link
                          href={`/jobs/${j.id}`}
                          target="_blank"
                          className="font-bold text-ink hover:text-accent inline-flex items-center gap-1 group"
                        >
                          {j.title}
                          <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </Link>
                        <p className="text-[11px] text-muted mt-0.5">
                          {j.business.name} · {j.business.category}
                        </p>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {j.requiredSkills.slice(0, 3).map((s, idx) => (
                            <span
                              key={idx}
                              className="rounded bg-subtle px-1.5 py-0.5 text-[10px] font-bold text-muted"
                            >
                              {s}
                            </span>
                          ))}
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="flex items-center gap-1 text-xs text-ink-soft">
                        <MapPin className="h-3 w-3 text-muted shrink-0" />
                        <span>
                          {j.locality ? `${j.locality}, ` : ''}
                          {j.city}
                        </span>
                      </div>
                    </td>
                    <td>
                      <span className="font-bold text-ink tabular-nums text-xs">
                        {formatCurrency(j.wageAmount)}
                      </span>
                      <span className="block text-[10px] text-muted uppercase font-semibold">
                        {j.wageType === 'DAILY' ? (isHi ? 'प्रति दिन' : '/ Day') : (isHi ? 'एकमुश्त' : 'Fixed')}
                      </span>
                    </td>
                    <td className="text-center font-bold text-ink tabular-nums">
                      {j._count?.applications || 0}
                    </td>
                    <td>
                      <Badge
                        tone={
                          j.status === 'OPEN'
                            ? 'emerald'
                            : j.status === 'FILLED'
                            ? 'blue'
                            : 'neutral'
                        }
                      >
                        {j.status}
                      </Badge>
                    </td>
                    <td className="text-xs text-muted">{formatDate(j.createdAt)}</td>
                    <td className="text-right">
                      <div className="inline-flex items-center gap-1 justify-end">
                        {j.status === 'OPEN' ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            disabled={actionLoading === j.id}
                            onClick={() => updateJobStatus(j.id, 'CLOSED')}
                            className="text-amber-700 hover:bg-amber-500/10 text-xs"
                            title={isHi ? 'नौकरी बंद करें' : 'Close job'}
                          >
                            {actionLoading === j.id ? (
                              <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              isHi ? 'बंद करें' : 'Close'
                            )}
                          </Button>
                        ) : (
                          <Button
                            variant="ghost"
                            size="sm"
                            disabled={actionLoading === j.id}
                            onClick={() => updateJobStatus(j.id, 'OPEN')}
                            className="text-green-700 hover:bg-green-500/10 text-xs"
                            title={isHi ? 'नौकरी खोलें' : 'Re-open job'}
                          >
                            {actionLoading === j.id ? (
                              <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              isHi ? 'खोलें' : 'Reopen'
                            )}
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={actionLoading === j.id}
                          onClick={() => deleteJob(j.id)}
                          className="text-red-600 hover:bg-red-500/10 text-xs"
                          title={isHi ? 'नौकरी हटाएं' : 'Delete job'}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
