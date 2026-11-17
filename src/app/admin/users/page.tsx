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
  Users,
  Search,
  CheckCircle2,
  XCircle,
  Download,
  RefreshCw,
  Phone,
  Briefcase,
  Store,
  ShieldAlert,
  SlidersHorizontal,
} from 'lucide-react';
import { cn } from '@/lib/cn';
import { formatDate } from '@/lib/date';

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

export default function AdminUsersPage() {
  const { language } = useApp();
  const isHi = language === 'hi';

  const [users, setUsers] = useState<UserRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<'ALL' | 'WORKER' | 'BUSINESS_OWNER' | 'ADMIN'>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'SUSPENDED'>('ALL');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/data');
      if (!res.ok) throw new Error('Failed to fetch user directory');
      const data = await res.json();
      setUsers(data.users || []);
    } catch (err: any) {
      toast.error(err.message || 'Error fetching users');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const toggleUserStatus = async (userId: string, currentStatus: boolean) => {
    try {
      setActionLoading(userId);
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, isActive: !currentStatus }),
      });
      if (!res.ok) throw new Error('Failed to update user account');
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, isActive: !currentStatus } : u))
      );
      toast.success(
        !currentStatus
          ? (isHi ? 'उपयोगकर्ता खाता सक्रिय किया गया' : 'User account activated')
          : (isHi ? 'उपयोगकर्ता खाता निलंबित किया गया' : 'User account suspended')
      );
    } catch (err: any) {
      toast.error(err.message || 'Action failed');
    } finally {
      setActionLoading(null);
    }
  };

  const filteredUsers = users.filter((u) => {
    const q = search.toLowerCase();
    const matchesSearch =
      u.name.toLowerCase().includes(q) ||
      u.phone.includes(q) ||
      (u.workerProfile?.city || '').toLowerCase().includes(q) ||
      (u.businesses?.[0]?.name || '').toLowerCase().includes(q);
    const matchesRole = roleFilter === 'ALL' || u.role === roleFilter;
    const matchesStatus =
      statusFilter === 'ALL' ||
      (statusFilter === 'ACTIVE' && u.isActive) ||
      (statusFilter === 'SUSPENDED' && !u.isActive);
    return matchesSearch && matchesRole && matchesStatus;
  });

  const exportCSV = () => {
    const headers = ['ID', 'Name', 'Phone', 'Role', 'Status', 'Registered Date'];
    const rows = filteredUsers.map((u) => [
      u.id,
      `"${u.name.replace(/"/g, '""')}"`,
      u.phone,
      u.role,
      u.isActive ? 'Active' : 'Suspended',
      u.createdAt,
    ]);
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `kaamsetu_users_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success(isHi ? 'उपयोगकर्ता सूची डाउनलोड हो गई' : 'Users CSV exported');
  };

  return (
    <div className="space-y-6 pb-12 w-full max-w-full">
      <PageHeader
        title={isHi ? 'उपयोगकर्ता प्रबंधन' : 'User Management'}
        description={
          isHi
            ? 'मंच पर पंजीकृत सभी कारीगरों और दुकानदारों का सक्रिय नियंत्रण और प्रबंधन करें।'
            : 'Inspect, search, and manage registered workers, business owners, and administrative staff.'
        }
        actions={
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" onClick={fetchUsers} disabled={loading}>
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

      {/* KPI Stats Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="ks-card p-4">
          <p className="text-[11px] font-bold uppercase tracking-wider text-muted">
            {isHi ? 'कुल उपयोगकर्ता' : 'Total Users'}
          </p>
          <p className="text-2xl font-black text-ink mt-1 tabular-nums">{users.length}</p>
        </div>
        <div className="ks-card p-4">
          <p className="text-[11px] font-bold uppercase tracking-wider text-muted">
            {isHi ? 'कारीगर (Workers)' : 'Workers'}
          </p>
          <p className="text-2xl font-black text-[#163A35] dark:text-[#B7D86B] mt-1 tabular-nums">
            {users.filter((u) => u.role === 'WORKER').length}
          </p>
        </div>
        <div className="ks-card p-4">
          <p className="text-[11px] font-bold uppercase tracking-wider text-muted">
            {isHi ? 'दुकानदार (Merchants)' : 'Business Owners'}
          </p>
          <p className="text-2xl font-black text-[#C66A45] mt-1 tabular-nums">
            {users.filter((u) => u.role === 'BUSINESS_OWNER').length}
          </p>
        </div>
        <div className="ks-card p-4">
          <p className="text-[11px] font-bold uppercase tracking-wider text-muted">
            {isHi ? 'निलंबित खाते' : 'Suspended'}
          </p>
          <p className="text-2xl font-black text-red-600 mt-1 tabular-nums">
            {users.filter((u) => !u.isActive).length}
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
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
                  ? 'नाम, फ़ोन नंबर, शहर या दुकान से खोजें...'
                  : 'Search by name, phone, city, or business name...'
              }
              className="ks-input pl-10"
            />
          </div>
          <div className="flex items-center gap-2 w-full md:w-auto">
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value as any)}
              className="ks-select text-xs w-36"
            >
              <option value="ALL">{isHi ? 'सभी भूमिकाएं' : 'All Roles'}</option>
              <option value="WORKER">{isHi ? 'कारीगर (Worker)' : 'Worker'}</option>
              <option value="BUSINESS_OWNER">{isHi ? 'दुकानदार (Merchant)' : 'Business Owner'}</option>
              <option value="ADMIN">{isHi ? 'एडमिन (Admin)' : 'Admin'}</option>
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="ks-select text-xs w-32"
            >
              <option value="ALL">{isHi ? 'सभी स्थितियां' : 'All Status'}</option>
              <option value="ACTIVE">{isHi ? 'सक्रिय' : 'Active'}</option>
              <option value="SUSPENDED">{isHi ? 'निलंबित' : 'Suspended'}</option>
            </select>
          </div>
        </div>
      </div>

      {/* Users Data Table */}
      <div className="ks-card overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-muted font-bold animate-pulse">
            {isHi ? 'उपयोगकर्ता सूची लोड हो रही है...' : 'Loading user directory...'}
          </div>
        ) : filteredUsers.length === 0 ? (
          <EmptyState
            icon={Users}
            title={isHi ? 'कोई उपयोगकर्ता नहीं मिला' : 'No users match criteria'}
            description={
              isHi
                ? 'अपने खोज शब्द या फ़िल्टर बदलकर दोबारा प्रयास करें।'
                : 'Try adjusting your search query or role filter.'
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="ks-table min-w-[800px]">
              <thead>
                <tr>
                  <th>{isHi ? 'उपयोगकर्ता' : 'User'}</th>
                  <th>{isHi ? 'भूमिका' : 'Role'}</th>
                  <th>{isHi ? 'विवरण / हुनर / दुकान' : 'Details / Skills / Store'}</th>
                  <th>{isHi ? 'पंजीकरण दिनांक' : 'Registered On'}</th>
                  <th>{isHi ? 'स्थिति' : 'Status'}</th>
                  <th className="text-right">{isHi ? 'कार्रवाई' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((u) => (
                  <tr key={u.id}>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-accent-soft text-accent font-black text-xs ring-1 ring-accent/20">
                          {u.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-bold text-ink">{u.name}</p>
                          <a
                            href={`tel:${u.phone}`}
                            className="inline-flex items-center gap-1 text-[11px] text-muted hover:text-accent font-medium mt-0.5"
                          >
                            <Phone className="h-3 w-3" />
                            {u.phone}
                          </a>
                        </div>
                      </div>
                    </td>
                    <td>
                      <Badge
                        tone={
                          u.role === 'ADMIN'
                            ? 'brand'
                            : u.role === 'BUSINESS_OWNER'
                            ? 'amber'
                            : 'emerald'
                        }
                      >
                        {u.role === 'ADMIN'
                          ? 'ADMIN'
                          : u.role === 'BUSINESS_OWNER'
                          ? 'MERCHANT'
                          : 'WORKER'}
                      </Badge>
                    </td>
                    <td>
                      {u.role === 'WORKER' ? (
                        <div>
                          <p className="text-xs font-semibold text-ink">
                            {u.workerProfile?.city || 'Locality not set'}
                          </p>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {u.workerProfile?.skills && u.workerProfile.skills.length > 0 ? (
                              u.workerProfile.skills.slice(0, 3).map((s, idx) => (
                                <span
                                  key={idx}
                                  className="rounded bg-subtle px-1.5 py-0.5 text-[10px] font-bold text-muted"
                                >
                                  {s}
                                </span>
                              ))
                            ) : (
                              <span className="text-[10px] text-faint">No skills listed</span>
                            )}
                          </div>
                        </div>
                      ) : u.role === 'BUSINESS_OWNER' ? (
                        <div>
                          <p className="text-xs font-bold text-ink">
                            {u.businesses?.[0]?.name || 'Store not created yet'}
                          </p>
                          <p className="text-[11px] text-muted">
                            {u.businesses?.[0]?.category || 'Retail'} · {u.businesses?.[0]?.city || ''}
                          </p>
                        </div>
                      ) : (
                        <span className="text-xs text-muted">System Administrator</span>
                      )}
                    </td>
                    <td className="text-xs text-muted">{formatDate(u.createdAt)}</td>
                    <td>
                      {u.isActive ? (
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-green-700 dark:text-green-400">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          {isHi ? 'सक्रिय' : 'Active'}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-red-600 dark:text-red-400">
                          <XCircle className="h-3.5 w-3.5" />
                          {isHi ? 'निलंबित' : 'Suspended'}
                        </span>
                      )}
                    </td>
                    <td className="text-right">
                      {u.role !== 'ADMIN' && (
                        <Button
                          variant={u.isActive ? 'ghost' : 'secondary'}
                          size="sm"
                          disabled={actionLoading === u.id}
                          onClick={() => toggleUserStatus(u.id, u.isActive)}
                          className={u.isActive ? 'text-red-600 hover:bg-red-500/10' : 'text-green-700'}
                        >
                          {actionLoading === u.id ? (
                            <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                          ) : u.isActive ? (
                            isHi ? 'निलंबित करें' : 'Suspend'
                          ) : (
                            isHi ? 'सक्रिय करें' : 'Activate'
                          )}
                        </Button>
                      )}
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
