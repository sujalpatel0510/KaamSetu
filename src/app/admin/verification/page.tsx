'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import DashboardShell from '@/components/DashboardShell';
import PageHeader from '@/components/ui/PageHeader';
import EmptyState from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import { formatDate } from '@/lib/date';
import { ShieldCheck, CheckCircle2, XCircle, Clock, User, Building2, ExternalLink } from 'lucide-react';

interface AdminVerificationRequest {
  id: string;
  role: string;
  documentType: string;
  documentNumber?: string | null;
  documentUrl?: string | null;
  status: string;
  adminNotes?: string | null;
  createdAt: string;
  user: {
    id: string;
    name: string;
    phone: string;
    email?: string | null;
    role: string;
    workerProfile?: { city: string; skills: string[] } | null;
    businesses?: Array<{ name: string; city: string }>;
  };
}

export default function AdminVerificationPage() {
  const { user, isLoading, t } = useApp();
  const router = useRouter();
  const [requests, setRequests] = useState<AdminVerificationRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [actionLoadingId, setActionLoadingId] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!isLoading && (!user || user.role !== 'ADMIN')) {
      if (user?.role === 'BUSINESS_OWNER') router.replace('/business/dashboard');
      else if (user?.role === 'WORKER') router.replace('/worker/dashboard');
      else router.replace('/login');
    }
  }, [user, isLoading, router]);

  const fetchRequests = async () => {
    try {
      const url = statusFilter ? `/api/admin/verification?status=${statusFilter}` : '/api/admin/verification';
      const res = await fetch(url);
      const data = await res.json();
      if (data.requests) setRequests(data.requests);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role === 'ADMIN') {
      fetchRequests();
    }
  }, [user, statusFilter]);

  const handleReview = async (requestId: string, status: 'VERIFIED' | 'REJECTED') => {
    setActionLoadingId(requestId);
    setMessage('');
    const adminNotes = status === 'REJECTED' ? prompt('Enter reason for rejection:') || 'Documentation incomplete' : 'Verified by platform admin';
    try {
      const res = await fetch('/api/admin/verification', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId, status, adminNotes }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage(`Verification marked as ${status}.`);
        fetchRequests();
      } else {
        setMessage(data.error || 'Failed to update verification status');
      }
    } catch (e: any) {
      setMessage(e.message || 'Network error');
    } finally {
      setActionLoadingId('');
    }
  };

  return (
    <DashboardShell role="ADMIN">
      <PageHeader
        title="Identity & Trade Verification Moderation"
        subtitle="Review official identity proofs, trade skill certificates, and business registration records"
      />

      {message && (
        <div className="rounded-xl border border-line bg-subtle p-4 text-xs font-semibold text-ink">
          {message}
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex gap-2 text-xs font-bold">
        {['', 'PENDING', 'VERIFIED', 'REJECTED'].map((st) => (
          <button
            key={st}
            type="button"
            onClick={() => setStatusFilter(st)}
            className={`rounded-xl px-3 py-1.5 transition-all ${
              statusFilter === st ? 'bg-accent text-accent-fg shadow-xs' : 'bg-subtle text-ink-soft hover:bg-hover'
            }`}
          >
            {st || 'All Submissions'}
          </button>
        ))}
      </div>

      {/* Request Table */}
      <div className="ks-card p-6 space-y-4">
        {loading ? (
          <Skeleton className="h-44 rounded-xl" />
        ) : requests.length === 0 ? (
          <EmptyState
            icon={ShieldCheck}
            title="No Verification Requests"
            description="There are currently no verification requests matching your selected filter."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-line bg-subtle text-[11px] font-bold uppercase text-muted">
                <tr>
                  <th className="p-3">User & Role</th>
                  <th className="p-3">Document Type</th>
                  <th className="p-3">Document ID</th>
                  <th className="p-3">Submitted</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Moderation Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {requests.map((r) => (
                  <tr key={r.id} className="hover:bg-subtle/50 transition-colors">
                    <td className="p-3">
                      <div className="font-bold text-ink">{r.user.name}</div>
                      <div className="text-[11px] text-muted">
                        {r.role} • {r.user.phone}
                        {r.user.workerProfile && ` • ${r.user.workerProfile.city}`}
                        {r.user.businesses && r.user.businesses[0] && ` • ${r.user.businesses[0].name}`}
                      </div>
                    </td>
                    <td className="p-3 font-semibold text-ink-soft">
                      {r.documentType}
                    </td>
                    <td className="p-3 font-mono text-[11px]">
                      {r.documentNumber || '—'}
                      {r.documentUrl && (
                        <a
                          href={r.documentUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="ml-2 inline-flex items-center text-accent hover:underline"
                        >
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                    </td>
                    <td className="p-3 text-muted">{formatDate(r.createdAt)}</td>
                    <td className="p-3">
                      <span
                        className={`inline-block rounded-md px-2 py-0.5 text-[10px] font-bold ${
                          r.status === 'VERIFIED'
                            ? 'bg-green-100 text-green-800'
                            : r.status === 'PENDING'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {r.status}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      {r.status === 'PENDING' && (
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            disabled={actionLoadingId === r.id}
                            onClick={() => handleReview(r.id, 'VERIFIED')}
                            className="ks-btn ks-btn-primary ks-btn-xs"
                          >
                            Approve
                          </button>
                          <button
                            type="button"
                            disabled={actionLoadingId === r.id}
                            onClick={() => handleReview(r.id, 'REJECTED')}
                            className="ks-btn ks-btn-outline ks-btn-xs text-red-600 border-red-200 hover:bg-red-50"
                          >
                            Reject
                          </button>
                        </div>
                      )}
                      {r.adminNotes && (
                        <div className="text-[10px] text-muted mt-1">Note: {r.adminNotes}</div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
