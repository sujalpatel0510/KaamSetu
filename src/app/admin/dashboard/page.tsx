'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import StatCard from '@/components/ui/StatCard';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { toast } from '@/components/ui/Toast';
import EmptyState from '@/components/ui/EmptyState';
import {
  ShieldCheck,
  Users,
  Store,
  Briefcase,
  DollarSign,
  Search,
  CheckCircle2,
  XCircle,
  Radio,
  Download,
  RefreshCw,
  Trash2,
  Send,
  Lock,
  Unlock,
  Phone,
  Layers,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/cn';
import { formatDate } from '@/lib/date';

interface AdminStats {
  usersCount: number;
  workersCount: number;
  businessOwnersCount: number;
  businessesCount: number;
  jobsCount: number;
  openJobsCount: number;
  applicationsCount: number;
  totalSalesVolume: number;
  totalUdhaarInMarket: number;
  productsCount: number;
}

interface UserRecord {
  id: string;
  name: string;
  phone: string;
  email?: string | null;
  role: string;
  city?: string | null;
  locality?: string | null;
  isActive: boolean;
  createdAt: string;
  workerProfile?: {
    id: string;
    skills: string[];
    city: string;
    availability: boolean;
    experienceYears: number;
  } | null;
  businesses?: {
    id: string;
    name: string;
    category: string;
    city: string;
  }[];
}

interface BusinessRecord {
  id: string;
  name: string;
  category: string;
  city: string;
  locality: string;
  phone: string;
  createdAt: string;
  owner: {
    name: string;
    phone: string;
    email?: string | null;
  };
  _count: {
    products: number;
    sales: number;
    customers: number;
    jobs: number;
  };
}

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

interface RecentActivity {
  recentApplications: {
    id: string;
    status: string;
    appliedAt: string;
    worker: {
      user: { name: string; phone: string };
    };
    job: {
      title: string;
      business: { name: string };
    };
  }[];
  recentSales: {
    id: string;
    totalAmount: number;
    paymentMethod: string;
    createdAt: string;
    business: { name: string };
    customer?: { name: string } | null;
  }[];
}

export default function AdminDashboardPage() {
  const { user, isLoading, t, language } = useApp();
  const isHi = language === 'hi';
  const router = useRouter();

  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [businesses, setBusinesses] = useState<BusinessRecord[]>([]);
  const [jobs, setJobs] = useState<JobRecord[]>([]);
  const [activity, setActivity] = useState<RecentActivity>({ recentApplications: [], recentSales: [] });
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'businesses' | 'jobs' | 'moderation'>('overview');

  // Enforce strict client-side role guard
  useEffect(() => {
    if (!isLoading && (!user || user.role !== 'ADMIN')) {
      if (user?.role === 'BUSINESS_OWNER') router.replace('/business/dashboard');
      else if (user?.role === 'WORKER') router.replace('/worker/dashboard');
      else router.replace('/login');
    }
  }, [user, isLoading, router]);

  // Sync tab state with URL query parameter on load
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const urlTab = params.get('tab');
      if (urlTab && ['overview', 'users', 'businesses', 'jobs', 'moderation'].includes(urlTab)) {
        setActiveTab(urlTab as any);
      }
    }
  }, []);

  const handleTabChange = (tab: 'overview' | 'users' | 'businesses' | 'jobs' | 'moderation') => {
    if (tab === 'overview') {
      setActiveTab('overview');
      router.replace('/admin/dashboard', { scroll: false });
    } else {
      router.push(`/admin/${tab}`);
    }
  };

  // Search & Filters
  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState<string>('ALL');
  const [businessSearch, setBusinessSearch] = useState('');
  const [jobSearch, setJobSearch] = useState('');
  const [jobStatusFilter, setJobStatusFilter] = useState<string>('ALL');

  // Broadcast Modal State
  const [broadcastOpen, setBroadcastOpen] = useState(false);
  const [broadcastTarget, setBroadcastTarget] = useState<'ALL' | 'WORKERS' | 'BUSINESSES'>('ALL');
  const [broadcastTitle, setBroadcastTitle] = useState('');
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [broadcastStatus, setBroadcastStatus] = useState<string | null>(null);

  const fetchAdminData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/data');
      const data = await res.json();
      if (data.stats) {
        setStats(data.stats);
        setUsers(data.users || []);
        setBusinesses(data.businesses || []);
        setJobs(data.jobs || []);
        setActivity({
          recentApplications: data.recentApplications || [],
          recentSales: data.recentSales || [],
        });
      }
    } catch (err) {
      console.error('Error fetching admin data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAdminData();
  }, [fetchAdminData]);

  // Toggle User Active/Suspended
  const handleToggleUserStatus = async (userRec: UserRecord) => {
    const nextStatus = !userRec.isActive;
    setActionLoading(`user-${userRec.id}`);
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: userRec.id, isActive: nextStatus }),
      });
      if (res.ok) {
        setUsers((prev) =>
          prev.map((u) => (u.id === userRec.id ? { ...u, isActive: nextStatus } : u))
        );
        toast.success(nextStatus ? (isHi ? 'उपयोगकर्ता खाता पुनः सक्रिय किया गया' : 'User account activated') : (isHi ? 'उपयोगकर्ता खाता निलंबित किया गया' : 'User account suspended'));
      }
    } finally {
      setActionLoading(null);
    }
  };

  // Toggle Job Status
  const handleToggleJobStatus = async (jobRec: JobRecord) => {
    const nextStatus = jobRec.status === 'OPEN' ? 'CLOSED' : 'OPEN';
    setActionLoading(`job-${jobRec.id}`);
    try {
      const res = await fetch('/api/admin/jobs', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId: jobRec.id, status: nextStatus }),
      });
      if (res.ok) {
        setJobs((prev) =>
          prev.map((j) => (j.id === jobRec.id ? { ...j, status: nextStatus } : j))
        );
        toast.success(nextStatus === 'OPEN' ? (isHi ? 'नौकरी पुनः खोली गई' : 'Job listing re-opened') : (isHi ? 'नौकरी बंद की गई' : 'Job listing closed'));
      }
    } finally {
      setActionLoading(null);
    }
  };

  // Delete Job
  const handleDeleteJob = async (jobId: string) => {
    if (!confirm(isHi ? 'क्या आप वाकई इस नौकरी को हटाना चाहते हैं?' : 'Are you sure you want to delete this job listing?')) {
      return;
    }
    setActionLoading(`del-job-${jobId}`);
    try {
      const res = await fetch(`/api/admin/jobs?id=${jobId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setJobs((prev) => prev.filter((j) => j.id !== jobId));
        toast.success(isHi ? 'नौकरी स्थायी रूप से हटा दी गई' : 'Job listing permanently deleted');
      }
    } finally {
      setActionLoading(null);
    }
  };

  // Submit Broadcast Notification
  const handleSendBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastTitle.trim() || !broadcastMessage.trim()) return;
    setActionLoading('broadcast');
    setBroadcastStatus(null);
    try {
      const res = await fetch('/api/admin/broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetGroup: broadcastTarget,
          title: broadcastTitle,
          message: broadcastMessage,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        const successMsg = isHi ? `प्रसारण सफलतापूर्वक ${data.recipientCount} उपयोगकर्ताओं को भेजा गया!` : `Broadcast delivered to ${data.recipientCount} users!`;
        toast.success(successMsg);
        setBroadcastOpen(false);
        setBroadcastTitle('');
        setBroadcastMessage('');
        setBroadcastStatus(null);
      } else {
        toast.error(data.error || 'Failed to send broadcast');
        setBroadcastStatus(data.error || 'Failed to send');
      }
    } finally {
      setActionLoading(null);
    }
  };

  // CSV Exporters
  const exportUsersCSV = () => {
    const headers = ['ID', 'Name', 'Phone', 'Email', 'Role', 'City', 'Locality', 'Status', 'CreatedAt'];
    const rows = users.map((u) => [
      u.id,
      `"${u.name}"`,
      u.phone,
      u.email || '',
      u.role,
      `"${u.city || ''}"`,
      `"${u.locality || ''}"`,
      u.isActive ? 'Active' : 'Suspended',
      u.createdAt,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `kaamsetu_users_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportJobsCSV = () => {
    const headers = ['ID', 'Title', 'Business', 'City', 'Locality', 'WageAmount', 'WageType', 'Status', 'Applicants'];
    const rows = jobs.map((j) => [
      j.id,
      `"${j.title}"`,
      `"${j.business.name}"`,
      `"${j.city}"`,
      `"${j.locality}"`,
      j.wageAmount,
      j.wageType,
      j.status,
      j._count.applications,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `kaamsetu_jobs_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filtered Lists
  const filteredUsers = users.filter((u) => {
    const userCity = u.workerProfile?.city || (u.businesses && u.businesses[0]?.city) || '';
    const matchSearch =
      u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.phone.includes(userSearch) ||
      (u.email && u.email.toLowerCase().includes(userSearch.toLowerCase())) ||
      userCity.toLowerCase().includes(userSearch.toLowerCase());
    const matchRole = userRoleFilter === 'ALL' || u.role === userRoleFilter;
    return matchSearch && matchRole;
  });

  const filteredBusinesses = businesses.filter((b) => {
    return (
      b.name.toLowerCase().includes(businessSearch.toLowerCase()) ||
      b.category.toLowerCase().includes(businessSearch.toLowerCase()) ||
      b.city.toLowerCase().includes(businessSearch.toLowerCase()) ||
      b.owner.name.toLowerCase().includes(businessSearch.toLowerCase())
    );
  });

  const filteredJobs = jobs.filter((j) => {
    const matchSearch =
      j.title.toLowerCase().includes(jobSearch.toLowerCase()) ||
      j.business.name.toLowerCase().includes(jobSearch.toLowerCase()) ||
      j.city.toLowerCase().includes(jobSearch.toLowerCase());
    const matchStatus = jobStatusFilter === 'ALL' || j.status === jobStatusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="w-full max-w-full min-w-0 space-y-6">
      {/* ───────────────────────────────────────────────────────────
          ADMIN TOP BAR WITH TABS & REAL-TIME ACTIONS
         ─────────────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-2xl border border-line bg-surface p-5 sm:p-7 shadow-card">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="space-y-1 min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-md bg-accent-soft px-2.5 py-0.5 text-xs font-bold text-accent-strong uppercase">
                <ShieldCheck className="h-3.5 w-3.5" />
                <span>{t.adminRole}</span>
              </span>
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-green-700 dark:text-green-400">
                <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                {isHi ? 'प्रणाली सक्रिय है' : 'System Healthy & Live'}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-ink">
              {t.adminControl}
            </h1>
            <p className="text-xs sm:text-sm text-muted">
              {isHi
                ? 'सिस्टम स्वास्थ्य, पंजीकृत उपयोगकर्ता, दुकानें, नौकरियां और सक्रिय मॉडरेशन नियंत्रण।'
                : 'Live platform administration, user management, shop oversight, and job marketplace moderation.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <Button
              variant="primary"
              size="sm"
              onClick={() => setBroadcastOpen(true)}
              className="bg-purple-600 hover:bg-purple-700"
            >
              <Radio className="h-3.5 w-3.5" />
              <span>{isHi ? '📢 प्रसारण भेजें' : '📢 Send Broadcast'}</span>
            </Button>

            <Button
              variant="secondary"
              size="sm"
              onClick={exportUsersCSV}
              title="Export Users to CSV"
            >
              <Download className="h-3.5 w-3.5" />
              <span>{isHi ? 'यूजर CSV' : 'Users CSV'}</span>
            </Button>

            <Button
              variant="secondary"
              size="sm"
              onClick={exportJobsCSV}
              title="Export Jobs to CSV"
            >
              <Download className="h-3.5 w-3.5" />
              <span>{isHi ? 'जॉब CSV' : 'Jobs CSV'}</span>
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={fetchAdminData}
              disabled={loading}
              title="Refresh"
            >
              <RefreshCw className={cn('h-3.5 w-3.5', loading && 'animate-spin')} />
            </Button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="mt-5 flex flex-wrap items-center gap-1.5 border-t border-line pt-4 text-xs font-bold">
          {(
            [
              ['overview', t.overview, Layers],
              ['users', `${t.users} (${users.length})`, Users],
              ['businesses', `${t.businesses} (${businesses.length})`, Store],
              ['jobs', `${t.jobs} (${jobs.length})`, Briefcase],
              ['moderation', isHi ? 'प्रसारण व नियंत्रण' : 'Broadcast & Moderation', Radio],
            ] as const
          ).map(([key, label, Icon]) => (
            <button
              key={key}
              onClick={() => handleTabChange(key)}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 transition-all',
                activeTab === key
                  ? 'bg-accent text-accent-fg shadow-xs font-black'
                  : 'bg-subtle text-muted hover:bg-hover hover:text-ink'
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              <span>{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ───────────────────────────────────────────────────────────
          TAB 1: OVERVIEW TAB
         ─────────────────────────────────────────────────────────── */}
      {activeTab === 'overview' && (
        <div className="space-y-6 animate-fade-in">
          {/* Key KPI Cards */}
          <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
            <StatCard
              icon={Users}
              label={t.users}
              value={stats?.usersCount || 0}
              tone="brand"
              hint={`${stats?.workersCount || 0} ${isHi ? 'कारीगर' : 'Workers'} • ${stats?.businessOwnersCount || 0} ${isHi ? 'दुकानदार' : 'Merchants'}`}
            />
            <StatCard
              icon={Store}
              label={t.businesses}
              value={stats?.businessesCount || 0}
              tone="emerald"
              hint={`${stats?.productsCount || 0} ${isHi ? 'उत्पाद सूचीबद्ध' : 'products listed'}`}
            />
            <StatCard
              icon={Briefcase}
              label={t.jobs}
              value={stats?.jobsCount || 0}
              tone="amber"
              hint={`${stats?.openJobsCount || 0} ${isHi ? 'सक्रिय रिक्तियां' : 'open listings'} • ${stats?.applicationsCount || 0} ${isHi ? 'आवेदन' : 'apps'}`}
            />
            <StatCard
              icon={DollarSign}
              label={isHi ? 'कुल बिक्री वॉल्यूम' : 'Total Sales Volume'}
              value={stats?.totalSalesVolume || 0}
              currency
              tone="slate"
              hint={`₹${(stats?.totalUdhaarInMarket || 0).toLocaleString('en-IN')} ${isHi ? 'बाजार उधार' : 'market udhaar'}`}
            />
          </div>

          {/* Platform Activity Feed (Dual Columns) */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Recent Applications Feed */}
            <div className="ks-card p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-line pb-3">
                <div className="flex items-center gap-2">
                  <Briefcase className="h-4 w-4 text-accent" />
                  <h3 className="font-bold text-sm text-ink">
                    {isHi ? 'ताज़ा नौकरी आवेदन' : 'Recent Job Applications'}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab('jobs')}
                  className="text-[11px] font-bold text-accent hover:underline flex items-center gap-0.5"
                >
                  <span>{t.viewAll}</span>
                  <ChevronRight className="h-3 w-3" />
                </button>
              </div>

              {activity.recentApplications.length === 0 ? (
                <p className="py-6 text-center text-xs text-muted">
                  {isHi ? 'कोई हालिया आवेदन नहीं' : 'No recent applications yet'}
                </p>
              ) : (
                <div className="divide-y divide-line text-xs">
                  {activity.recentApplications.map((app) => (
                    <div key={app.id} className="py-2.5 flex items-center justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="font-bold text-ink truncate">{app.worker.user.name}</p>
                        <p className="text-[11px] text-muted truncate">
                          {isHi ? 'आवेदन किया:' : 'Applied for:'} <strong className="text-ink-soft">{app.job.title}</strong> ({app.job.business.name})
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <span className={cn(
                          'inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold',
                          app.status === 'ACCEPTED'
                            ? 'bg-green-500/10 text-green-700 dark:text-green-400'
                            : 'bg-amber-500/10 text-amber-700 dark:text-amber-400'
                        )}>
                          {app.status}
                        </span>
                        <p className="text-[10px] text-faint mt-0.5">
                          {formatDate(app.appliedAt)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Recent Sales Activity Feed */}
            <div className="ks-card p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-line pb-3">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-emerald-600" />
                  <h3 className="font-bold text-sm text-ink">
                    {isHi ? 'हालिया काउंटर बिक्री लेनदेन' : 'Recent Counter Sales Logged'}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab('businesses')}
                  className="text-[11px] font-bold text-accent hover:underline flex items-center gap-0.5"
                >
                  <span>{t.viewAll}</span>
                  <ChevronRight className="h-3 w-3" />
                </button>
              </div>

              {activity.recentSales.length === 0 ? (
                <p className="py-6 text-center text-xs text-muted">
                  {isHi ? 'कोई हालिया बिक्री नहीं' : 'No recent sales logged yet'}
                </p>
              ) : (
                <div className="divide-y divide-line text-xs">
                  {activity.recentSales.map((sale) => (
                    <div key={sale.id} className="py-2.5 flex items-center justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="font-bold text-ink truncate">{sale.business.name}</p>
                        <p className="text-[11px] text-muted truncate">
                          {sale.customer ? `${sale.customer.name} • ` : ''}
                          <span className="font-medium text-ink-soft">{sale.paymentMethod}</span>
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="font-bold text-ink text-sm">
                          ₹{Number(sale.totalAmount).toLocaleString('en-IN')}
                        </span>
                        <p className="text-[10px] text-faint">
                          {formatDate(sale.createdAt)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────
          TAB 2: USERS DIRECTORY TAB (ACTIVE MANAGEMENT)
         ─────────────────────────────────────────────────────────── */}
      {activeTab === 'users' && (
        <div className="ks-card overflow-hidden animate-fade-in space-y-4 p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-line pb-4">
            <div>
              <h2 className="text-base font-bold text-ink">
                {isHi ? 'उपयोगकर्ता निर्देशिका व खाता नियंत्रण' : 'User Directory & Account Controls'}
              </h2>
              <p className="text-xs text-muted">
                {filteredUsers.length} of {users.length} {isHi ? 'उपयोगकर्ता मिले' : 'users shown'}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Role filter */}
              <select
                value={userRoleFilter}
                onChange={(e) => setUserRoleFilter(e.target.value)}
                className="ks-select py-1.5 text-xs w-36"
              >
                <option value="ALL">{isHi ? 'सभी भूमिकाएं' : 'All Roles'}</option>
                <option value="WORKER">{isHi ? 'कारीगर (Workers)' : 'Workers'}</option>
                <option value="BUSINESS_OWNER">{isHi ? 'दुकानदार (Merchants)' : 'Merchants'}</option>
                <option value="ADMIN">{isHi ? 'प्रशासक (Admins)' : 'Admins'}</option>
              </select>

              {/* Search input */}
              <div className="relative w-48 sm:w-64">
                <Search className="pointer-events-none absolute top-2.5 left-3 h-4 w-4 text-muted" />
                <input
                  type="text"
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  placeholder={isHi ? 'नाम, फोन या शहर खोजें...' : 'Search name, phone, city...'}
                  className="w-full rounded-xl border border-line bg-subtle py-1.5 pr-3 pl-9 text-xs text-ink placeholder:text-muted focus:border-accent focus:bg-surface focus:outline-none"
                />
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="ks-table min-w-[750px]">
              <thead>
                <tr>
                  <th scope="col">{t.fullName}</th>
                  <th scope="col">{t.phoneNumber}</th>
                  <th scope="col">{isHi ? 'भूमिका' : 'Role'}</th>
                  <th scope="col">{t.city}</th>
                  <th scope="col">{t.status}</th>
                  <th scope="col">{t.date}</th>
                  <th scope="col" className="text-right">{isHi ? 'नियंत्रण' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={7}>
                      <EmptyState
                        icon={Users}
                        title={isHi ? 'कोई उपयोगकर्ता नहीं मिला' : 'No users match criteria'}
                        className="border-0 shadow-none py-8"
                      />
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((u) => {
                    const isBusy = actionLoading === `user-${u.id}`;
                    return (
                      <tr key={u.id} className="hover:bg-subtle/40 transition-colors">
                        <td>
                          <div className="flex items-center gap-2">
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-accent-soft text-accent-strong font-black text-xs">
                              {u.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <p className="font-bold text-ink truncate">{u.name}</p>
                              {u.email && <p className="text-[11px] text-muted truncate">{u.email}</p>}
                            </div>
                          </div>
                        </td>
                        <td className="font-mono text-xs text-ink-soft">{u.phone}</td>
                        <td>
                          <Badge tone={u.role === 'WORKER' ? 'brand' : u.role === 'ADMIN' ? 'neutral' : 'amber'}>
                            {u.role === 'WORKER'
                              ? isHi ? 'कारीगर' : 'Worker'
                              : u.role === 'ADMIN'
                              ? 'Admin'
                              : isHi ? 'दुकानदार' : 'Merchant'}
                          </Badge>
                        </td>
                        <td className="text-xs text-muted">
                          {u.workerProfile?.city || (u.businesses && u.businesses[0]?.city) || '—'}
                        </td>
                        <td>
                          {u.isActive ? (
                            <span className="inline-flex items-center gap-1 rounded-md bg-green-500/10 px-2 py-0.5 text-[10px] font-bold text-green-700 dark:text-green-400">
                              <CheckCircle2 className="h-3 w-3" />
                              {isHi ? 'सक्रिय' : 'Active'}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-md bg-red-500/10 px-2 py-0.5 text-[10px] font-bold text-red-700 dark:text-red-400">
                              <XCircle className="h-3 w-3" />
                              {isHi ? 'निलंबित' : 'Suspended'}
                            </span>
                          )}
                        </td>
                        <td className="text-[11px] text-muted">
                          {formatDate(u.createdAt)}
                        </td>
                        <td className="text-right">
                          <button
                            type="button"
                            onClick={() => handleToggleUserStatus(u)}
                            disabled={isBusy}
                            className={cn(
                              'inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-[11px] font-bold transition-all',
                              u.isActive
                                ? 'bg-red-500/10 text-red-700 hover:bg-red-500/20'
                                : 'bg-green-500/10 text-green-700 hover:bg-green-500/20'
                            )}
                          >
                            {u.isActive ? (
                              <>
                                <Lock className="h-3 w-3" />
                                <span>{isHi ? 'रोकें' : 'Suspend'}</span>
                              </>
                            ) : (
                              <>
                                <Unlock className="h-3 w-3" />
                                <span>{isHi ? 'बहाल करें' : 'Activate'}</span>
                              </>
                            )}
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────
          TAB 3: BUSINESSES TAB
         ─────────────────────────────────────────────────────────── */}
      {activeTab === 'businesses' && (
        <div className="ks-card overflow-hidden animate-fade-in space-y-4 p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-line pb-4">
            <div>
              <h2 className="text-base font-bold text-ink">
                {isHi ? 'पंजीकृत दुकानें व व्यापार' : 'Registered Shops & Merchants'}
              </h2>
              <p className="text-xs text-muted">
                {filteredBusinesses.length} {isHi ? 'दुकानें पंजीकृत' : 'businesses operating on KaamSetu'}
              </p>
            </div>

            <div className="relative w-full sm:w-72">
              <Search className="pointer-events-none absolute top-2.5 left-3 h-4 w-4 text-muted" />
              <input
                type="text"
                value={businessSearch}
                onChange={(e) => setBusinessSearch(e.target.value)}
                placeholder={isHi ? 'दुकान, श्रेणी या मालिक खोजें...' : 'Search shop, category, owner...'}
                className="w-full rounded-xl border border-line bg-subtle py-1.5 pr-3 pl-9 text-xs text-ink placeholder:text-muted focus:border-accent focus:bg-surface focus:outline-none"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="ks-table min-w-[750px]">
              <thead>
                <tr>
                  <th scope="col">{isHi ? 'दुकान का नाम' : 'Business Name'}</th>
                  <th scope="col">{isHi ? 'श्रेणी' : 'Category'}</th>
                  <th scope="col">{isHi ? 'दुकानदार' : 'Owner'}</th>
                  <th scope="col">{t.city}</th>
                  <th scope="col">{isHi ? 'इन्वेंट्री' : 'Inventory'}</th>
                  <th scope="col">{isHi ? 'बिक्री' : 'Sales'}</th>
                  <th scope="col">{isHi ? 'ग्राहक' : 'Customers'}</th>
                  <th scope="col">{t.phoneNumber}</th>
                </tr>
              </thead>
              <tbody>
                {filteredBusinesses.length === 0 ? (
                  <tr>
                    <td colSpan={8}>
                      <EmptyState
                        icon={Store}
                        title={isHi ? 'कोई दुकान नहीं मिली' : 'No businesses found'}
                        className="border-0 shadow-none py-8"
                      />
                    </td>
                  </tr>
                ) : (
                  filteredBusinesses.map((b) => (
                    <tr key={b.id} className="hover:bg-subtle/40 transition-colors">
                      <td>
                        <div className="font-bold text-ink">{b.name}</div>
                        <div className="text-[11px] text-muted">{b.locality}</div>
                      </td>
                      <td>
                        <span className="inline-flex items-center rounded-md bg-subtle px-2 py-0.5 text-[10px] font-bold text-ink-soft">
                          {b.category}
                        </span>
                      </td>
                      <td className="font-medium text-ink-soft">{b.owner.name}</td>
                      <td className="text-xs text-muted">{b.city}</td>
                      <td className="font-bold text-accent tabular-nums">{b._count.products}</td>
                      <td className="font-bold text-green-700 dark:text-green-400 tabular-nums">{b._count.sales}</td>
                      <td className="font-bold text-ink tabular-nums">{b._count.customers}</td>
                      <td>
                        <a
                          href={`tel:${b.phone}`}
                          className="inline-flex items-center gap-1 font-mono text-xs text-accent hover:underline"
                        >
                          <Phone className="h-3 w-3" />
                          <span>{b.phone}</span>
                        </a>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────
          TAB 4: JOBS MARKETPLACE MODERATION TAB
         ─────────────────────────────────────────────────────────── */}
      {activeTab === 'jobs' && (
        <div className="ks-card overflow-hidden animate-fade-in space-y-4 p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-line pb-4">
            <div>
              <h2 className="text-base font-bold text-ink">
                {isHi ? 'रोज़गार बाज़ार व मॉडरेशन' : 'Job Marketplace & Moderation'}
              </h2>
              <p className="text-xs text-muted">
                {filteredJobs.length} {isHi ? 'नौकरियां मॉनीटर की जा रही हैं' : 'jobs listed across all cities'}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <select
                value={jobStatusFilter}
                onChange={(e) => setJobStatusFilter(e.target.value)}
                className="ks-select py-1.5 text-xs w-36"
              >
                <option value="ALL">{isHi ? 'सभी स्थितियां' : 'All Status'}</option>
                <option value="OPEN">{isHi ? 'सक्रिय (Open)' : 'Open'}</option>
                <option value="CLOSED">{isHi ? 'बंद (Closed)' : 'Closed'}</option>
              </select>

              <div className="relative w-48 sm:w-64">
                <Search className="pointer-events-none absolute top-2.5 left-3 h-4 w-4 text-muted" />
                <input
                  type="text"
                  value={jobSearch}
                  onChange={(e) => setJobSearch(e.target.value)}
                  placeholder={isHi ? 'पद, दुकान या शहर खोजें...' : 'Search title, shop, city...'}
                  className="w-full rounded-xl border border-line bg-subtle py-1.5 pr-3 pl-9 text-xs text-ink placeholder:text-muted focus:border-accent focus:bg-surface focus:outline-none"
                />
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="ks-table min-w-[750px]">
              <thead>
                <tr>
                  <th scope="col">{t.jobs}</th>
                  <th scope="col">{isHi ? 'दुकान' : 'Business'}</th>
                  <th scope="col">{t.city}</th>
                  <th scope="col">{isHi ? 'पारिश्रमिक' : 'Wage'}</th>
                  <th scope="col">{isHi ? 'आवेदन' : 'Applicants'}</th>
                  <th scope="col">{t.status}</th>
                  <th scope="col" className="text-right">{isHi ? 'मॉडरेशन' : 'Moderate'}</th>
                </tr>
              </thead>
              <tbody>
                {filteredJobs.length === 0 ? (
                  <tr>
                    <td colSpan={7}>
                      <EmptyState
                        icon={Briefcase}
                        title={isHi ? 'कोई नौकरी नहीं मिली' : 'No jobs found'}
                        className="border-0 shadow-none py-8"
                      />
                    </td>
                  </tr>
                ) : (
                  filteredJobs.map((j) => {
                    const isBusy = actionLoading === `job-${j.id}` || actionLoading === `del-job-${j.id}`;
                    return (
                      <tr key={j.id} className="hover:bg-subtle/40 transition-colors">
                        <td>
                          <div className="font-bold text-ink">{j.title}</div>
                          <div className="text-[11px] text-muted truncate max-w-xs">{j.requiredSkills.join(', ')}</div>
                        </td>
                        <td className="text-ink-soft text-xs font-medium">{j.business.name}</td>
                        <td className="text-xs text-muted">{j.city}</td>
                        <td className="font-bold text-green-700 dark:text-green-400 tabular-nums">
                          ₹{Number(j.wageAmount).toLocaleString('en-IN')}{' '}
                          <span className="text-[10px] text-muted font-normal">
                            {j.wageType === 'DAILY' ? t.perDay : t.fixedWage}
                          </span>
                        </td>
                        <td className="font-bold text-accent tabular-nums">
                          {j._count.applications}
                        </td>
                        <td>
                          <Badge tone={j.status === 'OPEN' ? 'emerald' : 'neutral'}>
                            {j.status}
                          </Badge>
                        </td>
                        <td className="text-right">
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleToggleJobStatus(j)}
                              disabled={isBusy}
                              className="rounded-lg border border-line bg-subtle px-2 py-1 text-[11px] font-semibold text-ink-soft hover:bg-hover hover:text-ink transition-colors"
                              title={j.status === 'OPEN' ? 'Close job' : 'Reopen job'}
                            >
                              {j.status === 'OPEN' ? (isHi ? 'बंद करें' : 'Close') : (isHi ? 'खोलें' : 'Reopen')}
                            </button>

                            <button
                              type="button"
                              onClick={() => handleDeleteJob(j.id)}
                              disabled={isBusy}
                              className="rounded-lg p-1 text-faint hover:bg-red-500/10 hover:text-red-600 transition-colors"
                              title={isHi ? 'हटाएं' : 'Delete job'}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────
          TAB 5: BROADCAST & SYSTEM MODERATION TAB
         ─────────────────────────────────────────────────────────── */}
      {activeTab === 'moderation' && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 animate-fade-in">
          {/* Direct Broadcast Composer */}
          <div className="ks-card p-6 space-y-4">
            <div className="flex items-center gap-2 border-b border-line pb-3">
              <Radio className="h-5 w-5 text-purple-600" />
              <div>
                <h3 className="font-bold text-sm text-ink">
                  {isHi ? 'प्रणालीगत प्रसारण सूचना भेजें' : 'Broadcast System Notification'}
                </h3>
                <p className="text-xs text-muted">
                  {isHi
                    ? 'सभी पंजीकृत कारीगरों या दुकानदारों को एक साथ संदेश भेजें।'
                    : 'Send announcements, regulatory notices, or emergency alerts.'}
                </p>
              </div>
            </div>

            {broadcastStatus && (
              <div className="rounded-xl bg-purple-500/10 border border-purple-500/20 p-3 text-xs text-purple-700 dark:text-purple-300 font-semibold flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" />
                <span>{broadcastStatus}</span>
              </div>
            )}

            <form onSubmit={handleSendBroadcast} className="space-y-4">
              <div>
                <label className="ks-label">{isHi ? 'लक्षित समूह' : 'Target Audience'}</label>
                <div className="grid grid-cols-3 gap-2">
                  {(
                    [
                      ['ALL', isHi ? 'सभी उपयोगकर्ता' : 'All Users'],
                      ['WORKERS', isHi ? 'केवल कारीगर' : 'Workers Only'],
                      ['BUSINESSES', isHi ? 'केवल दुकानदार' : 'Merchants Only'],
                    ] as const
                  ).map(([tgt, label]) => (
                    <button
                      key={tgt}
                      type="button"
                      onClick={() => setBroadcastTarget(tgt)}
                      className={cn(
                        'rounded-xl py-2 px-2 text-xs font-bold transition-all border',
                        broadcastTarget === tgt
                          ? 'bg-purple-600 text-white border-purple-600 shadow-xs'
                          : 'bg-subtle text-muted border-line hover:text-ink'
                      )}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label htmlFor="bc-title" className="ks-label">
                  {isHi ? 'सूचना का शीर्षक *' : 'Notification Title *'}
                </label>
                <input
                  id="bc-title"
                  type="text"
                  required
                  value={broadcastTitle}
                  onChange={(e) => setBroadcastTitle(e.target.value)}
                  placeholder={isHi ? 'उदा. सरकारी अवकाश या विशेष भर्ती अभियान' : 'e.g. Platform update: New wage guarantee feature live!'}
                  className="ks-input text-xs"
                />
              </div>

              <div>
                <label htmlFor="bc-msg" className="ks-label">
                  {isHi ? 'सूचना का विवरण *' : 'Detailed Message *'}
                </label>
                <textarea
                  id="bc-msg"
                  rows={4}
                  required
                  value={broadcastMessage}
                  onChange={(e) => setBroadcastMessage(e.target.value)}
                  placeholder={isHi ? 'पूरा संदेश लिखें जो उपयोगकर्ताओं के नोटिफिकेशन पैनल में दिखेगा...' : 'Type full announcement message visible to target users...'}
                  className="ks-textarea text-xs"
                />
              </div>

              <Button
                type="submit"
                variant="primary"
                disabled={actionLoading === 'broadcast'}
                className="w-full bg-purple-600 hover:bg-purple-700"
              >
                <Send className="h-4 w-4" />
                <span>{isHi ? 'अभी प्रसारण भेजें' : 'Deliver Broadcast Now'}</span>
              </Button>
            </form>
          </div>

          {/* System Security & Audit Status */}
          <div className="ks-card p-6 space-y-4">
            <div className="flex items-center gap-2 border-b border-line pb-3">
              <ShieldCheck className="h-5 w-5 text-accent" />
              <div>
                <h3 className="font-bold text-sm text-ink">
                  {isHi ? 'सिस्टम ऑडिट व सुरक्षा स्थिति' : 'System Audit & Platform Health'}
                </h3>
                <p className="text-xs text-muted">
                  {isHi ? 'डेटाबेस, प्रमाणीकरण और कैश स्थिति' : 'Database, authentication, and worker reliability'}
                </p>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between p-3 rounded-xl bg-subtle border border-line">
                <div>
                  <p className="font-bold text-ink">{isHi ? 'पोस्टग्रेएसक्यूएल डेटाबेस' : 'PostgreSQL Database'}</p>
                  <p className="text-[11px] text-muted">localhost:5432 / kaamsetu</p>
                </div>
                <span className="inline-flex items-center gap-1 rounded-md bg-green-500/10 px-2 py-0.5 text-[10px] font-bold text-green-700 dark:text-green-400">
                  <CheckCircle2 className="h-3 w-3" />
                  {isHi ? 'कनेक्टेड' : 'Connected'}
                </span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-subtle border border-line">
                <div>
                  <p className="font-bold text-ink">{isHi ? 'भूमिका-आधारित अभिगम नियंत्रण (RBAC)' : 'Role-Based Access Control (RBAC)'}</p>
                  <p className="text-[11px] text-muted">Worker, Business Owner, Admin</p>
                </div>
                <span className="inline-flex items-center gap-1 rounded-md bg-green-500/10 px-2 py-0.5 text-[10px] font-bold text-green-700 dark:text-green-400">
                  <CheckCircle2 className="h-3 w-3" />
                  {isHi ? 'सक्रिय' : 'Enforced'}
                </span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-subtle border border-line">
                <div>
                  <p className="font-bold text-ink">{isHi ? 'द्विभाषी अनुवाद इंजन' : 'Bilingual Localization Engine'}</p>
                  <p className="text-[11px] text-muted">English & Hindi (Zero Gujarati)</p>
                </div>
                <span className="inline-flex items-center gap-1 rounded-md bg-green-500/10 px-2 py-0.5 text-[10px] font-bold text-green-700 dark:text-green-400">
                  <CheckCircle2 className="h-3 w-3" />
                  {isHi ? '100% कवरेज' : '100% Coverage'}
                </span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-subtle border border-line">
                <div>
                  <p className="font-bold text-ink">{isHi ? 'अखिल भारतीय शहर समर्थन' : 'Pan-India City Input'}</p>
                  <p className="text-[11px] text-muted">All Indian cities and towns enabled</p>
                </div>
                <span className="inline-flex items-center gap-1 rounded-md bg-green-500/10 px-2 py-0.5 text-[10px] font-bold text-green-700 dark:text-green-400">
                  <CheckCircle2 className="h-3 w-3" />
                  {isHi ? 'सक्रिय' : 'Enabled'}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────
          MODAL: QUICK BROADCAST DIALOG
         ─────────────────────────────────────────────────────────── */}
      {broadcastOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="ks-card w-full max-w-lg p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-line pb-3">
              <div className="flex items-center gap-2">
                <Radio className="h-5 w-5 text-purple-600" />
                <h3 className="font-bold text-base text-ink">
                  {isHi ? 'प्रणालीगत प्रसारण भेजें' : 'Send System Broadcast'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setBroadcastOpen(false)}
                className="rounded-lg p-1 text-muted hover:bg-hover hover:text-ink font-bold text-sm"
              >
                ✕
              </button>
            </div>

            {broadcastStatus && (
              <div className="rounded-xl bg-purple-500/10 border border-purple-500/20 p-3 text-xs text-purple-700 dark:text-purple-300 font-semibold flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" />
                <span>{broadcastStatus}</span>
              </div>
            )}

            <form onSubmit={handleSendBroadcast} className="space-y-4">
              <div>
                <label className="ks-label">{isHi ? 'लक्षित समूह' : 'Target Audience'}</label>
                <div className="grid grid-cols-3 gap-2">
                  {(
                    [
                      ['ALL', isHi ? 'सभी' : 'All Users'],
                      ['WORKERS', isHi ? 'कारीगर' : 'Workers'],
                      ['BUSINESSES', isHi ? 'दुकानदार' : 'Merchants'],
                    ] as const
                  ).map(([tgt, label]) => (
                    <button
                      key={tgt}
                      type="button"
                      onClick={() => setBroadcastTarget(tgt)}
                      className={cn(
                        'rounded-xl py-2 px-2 text-xs font-bold transition-all border',
                        broadcastTarget === tgt
                          ? 'bg-purple-600 text-white border-purple-600 shadow-xs'
                          : 'bg-subtle text-muted border-line hover:text-ink'
                      )}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label htmlFor="modal-bc-title" className="ks-label">
                  {isHi ? 'सूचना का शीर्षक *' : 'Title *'}
                </label>
                <input
                  id="modal-bc-title"
                  type="text"
                  required
                  value={broadcastTitle}
                  onChange={(e) => setBroadcastTitle(e.target.value)}
                  placeholder="e.g. Government Diwali Wage Bonus Announcement"
                  className="ks-input text-xs"
                />
              </div>

              <div>
                <label htmlFor="modal-bc-msg" className="ks-label">
                  {isHi ? 'सूचना का विवरण *' : 'Message *'}
                </label>
                <textarea
                  id="modal-bc-msg"
                  rows={4}
                  required
                  value={broadcastMessage}
                  onChange={(e) => setBroadcastMessage(e.target.value)}
                  placeholder="Type message content..."
                  className="ks-textarea text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setBroadcastOpen(false)}
                >
                  {isHi ? 'रद्द करें' : 'Cancel'}
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  disabled={actionLoading === 'broadcast'}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  <Send className="h-3.5 w-3.5" />
                  <span>{isHi ? 'प्रसारण भेजें' : 'Send Broadcast'}</span>
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
