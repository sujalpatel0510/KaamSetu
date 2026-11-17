'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import DashboardShell from '@/components/DashboardShell';
import PageHeader from '@/components/ui/PageHeader';
import EmptyState from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import { toast } from '@/components/ui/Toast';
import { formatDate } from '@/lib/date';
import { Scale, CheckCircle2, AlertTriangle, X, ShieldAlert } from 'lucide-react';

interface AdminDisputeItem {
  id: string;
  category: string;
  title: string;
  description: string;
  status: string;
  resolution?: string | null;
  adminNotes?: string | null;
  createdAt: string;
  raisedByUser: { id: string; name: string; role: string };
  againstUser?: { id: string; name: string; role: string } | null;
  job?: { id: string; title: string } | null;
}

export default function AdminDisputesPage() {
  const { user, isLoading, t } = useApp();
  const router = useRouter();
  const [disputes, setDisputes] = useState<AdminDisputeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!isLoading && (!user || user.role !== 'ADMIN')) {
      if (user?.role === 'BUSINESS_OWNER') router.replace('/business/dashboard');
      else if (user?.role === 'WORKER') router.replace('/worker/dashboard');
      else router.replace('/login');
    }
  }, [user, isLoading, router]);

  // Resolution modal
  const [resolveModalOpen, setResolveModalOpen] = useState(false);
  const [selectedDisputeId, setSelectedDisputeId] = useState('');
  const [newStatus, setNewStatus] = useState('RESOLVED');
  const [resolution, setResolution] = useState('');
  const [adminNotes, setAdminNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchDisputes = async () => {
    try {
      const res = await fetch('/api/disputes');
      const data = await res.json();
      if (data.disputes) setDisputes(data.disputes);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role === 'ADMIN') {
      fetchDisputes();
    }
  }, [user]);

  const handleResolve = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage('');
    try {
      const res = await fetch('/api/admin/disputes', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          disputeId: selectedDisputeId,
          status: newStatus,
          resolution,
          adminNotes,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success('Dispute status and resolution updated successfully.');
        setMessage('Dispute status and resolution updated successfully.');
        setResolveModalOpen(false);
        fetchDisputes();
      } else {
        toast.error(data.error || 'Failed to update dispute');
        setMessage(data.error || 'Failed to update dispute');
      }
    } catch (e: any) {
      toast.error(e.message || 'Network error');
      setMessage(e.message || 'Network error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <DashboardShell role="ADMIN">
      <PageHeader
        title="Dispute & Safety Resolution Center"
        subtitle="Mediate wage disagreements, safety complaints, and misconduct reports filed across the platform"
      />

      {message && (
        <div className="rounded-xl border border-line bg-subtle p-4 text-xs font-semibold text-ink">
          {message}
        </div>
      )}

      {/* Disputes Table */}
      <div className="ks-card p-6 space-y-4">
        {loading ? (
          <Skeleton className="h-44 rounded-xl" />
        ) : disputes.length === 0 ? (
          <EmptyState
            icon={Scale}
            title="Zero Unresolved Grievances"
            description="There are currently no active disputes filed on KaamSetu."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-line bg-subtle text-[11px] font-bold uppercase text-muted">
                <tr>
                  <th className="p-3">Grievance & Category</th>
                  <th className="p-3">Complainant</th>
                  <th className="p-3">Target Entity</th>
                  <th className="p-3">Filed Date</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Resolution</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {disputes.map((d) => (
                  <tr key={d.id} className="hover:bg-subtle/50 transition-colors">
                    <td className="p-3">
                      <div className="font-bold text-ink">{d.title}</div>
                      <div className="text-[11px] text-muted">Category: {d.category}</div>
                      <div className="text-[11px] text-ink-soft line-clamp-1 mt-0.5">{d.description}</div>
                    </td>
                    <td className="p-3 font-semibold text-ink">
                      {d.raisedByUser.name} ({d.raisedByUser.role})
                    </td>
                    <td className="p-3 text-muted">
                      {d.againstUser ? `${d.againstUser.name} (${d.againstUser.role})` : d.job ? d.job.title : 'Platform Listing'}
                    </td>
                    <td className="p-3 text-muted">{formatDate(d.createdAt)}</td>
                    <td className="p-3">
                      <span
                        className={`inline-block rounded-md px-2 py-0.5 text-[10px] font-bold ${
                          d.status === 'RESOLVED'
                            ? 'bg-green-500/10 text-green-700 dark:text-green-300'
                            : d.status === 'UNDER_REVIEW'
                            ? 'bg-amber-500/10 text-amber-700 dark:text-amber-300'
                            : 'bg-blue-500/10 text-blue-700 dark:text-blue-300'
                        }`}
                      >
                        {d.status}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedDisputeId(d.id);
                          setNewStatus(d.status === 'OPEN' ? 'UNDER_REVIEW' : 'RESOLVED');
                          setResolution(d.resolution || '');
                          setAdminNotes(d.adminNotes || '');
                          setResolveModalOpen(true);
                        }}
                        className="ks-btn ks-btn-outline ks-btn-xs"
                      >
                        Resolve / Update
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Resolution Modal */}
      {resolveModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="ks-card w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-line pb-3">
              <h3 className="text-base font-bold text-ink">Resolve Grievance</h3>
              <button type="button" onClick={() => setResolveModalOpen(false)} className="text-muted hover:text-ink">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleResolve} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-ink-soft mb-1.5">Dispute Status</label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="ks-input"
                >
                  <option value="UNDER_REVIEW">Under Review / Investigation</option>
                  <option value="RESOLVED">Resolved (Grievance Settled)</option>
                  <option value="REJECTED">Rejected (Unsubstantiated)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-ink-soft mb-1.5">Official Resolution Finding</label>
                <textarea
                  rows={3}
                  required
                  value={resolution}
                  onChange={(e) => setResolution(e.target.value)}
                  placeholder="State the resolution and actions taken (visible to user)..."
                  className="ks-input"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-ink-soft mb-1.5">Internal Admin Notes (Optional)</label>
                <input
                  type="text"
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Internal audit remarks"
                  className="ks-input"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setResolveModalOpen(false)} className="ks-btn ks-btn-outline ks-btn-sm">
                  {t.cancel}
                </button>
                <button type="submit" disabled={submitting} className="ks-btn ks-btn-primary ks-btn-sm">
                  {submitting ? 'Saving...' : 'Save Resolution'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardShell>
  );
}
