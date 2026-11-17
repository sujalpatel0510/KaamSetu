'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import DashboardShell from '@/components/DashboardShell';
import PageHeader from '@/components/ui/PageHeader';
import EmptyState from '@/components/ui/EmptyState';
import { toast } from '@/components/ui/Toast';
import { formatDate } from '@/lib/date';
import { Scale, AlertTriangle, Send, CheckCircle2, Clock, X } from 'lucide-react';

interface DisputeItem {
  id: string;
  category: string;
  title: string;
  description: string;
  status: string;
  resolution?: string | null;
  adminNotes?: string | null;
  createdAt: string;
  resolvedAt?: string | null;
  job?: { title: string } | null;
}

export default function WorkerDisputesPage() {
  const { user, t, language } = useApp();
  const [disputes, setDisputes] = useState<DisputeItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [category, setCategory] = useState('WAGE_DISPUTE');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');

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
    if (user?.role === 'WORKER') {
      fetchDisputes();
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage('');
    try {
      const res = await fetch('/api/disputes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category, title, description }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(language === 'hi' ? 'विवाद रिपोर्ट सफलतापूर्वक दर्ज की गई!' : 'Dispute reported successfully. Administrators have been notified.');
        setMessage('Dispute reported successfully. Administrators have been notified.');
        setModalOpen(false);
        setTitle('');
        setDescription('');
        fetchDisputes();
      } else {
        toast.error(data.error || 'Failed to file dispute');
        setMessage(data.error || 'Failed to file dispute');
      }
    } catch (e: any) {
      toast.error(e.message || 'Network error');
      setMessage(e.message || 'Network error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <DashboardShell role="WORKER">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <PageHeader
          title={t.disputes}
          subtitle={
            language === 'hi'
              ? 'मजदूरी विवाद, असुरक्षित कार्यस्थल या अनुचित व्यवहार की आधिकारिक शिकायत दर्ज करें'
              : 'File grievances, report wage disagreements, and track administrative resolutions'
          }
        />
        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="ks-btn ks-btn-primary ks-btn-md flex items-center gap-1.5 shrink-0"
        >
          <AlertTriangle className="h-4 w-4" />
          <span>{t.fileDispute}</span>
        </button>
      </div>

      {message && (
        <div className="rounded-xl border border-line bg-subtle p-4 text-xs font-semibold text-ink">
          {message}
        </div>
      )}

      {/* Disputes List */}
      <div className="space-y-4">
        {loading ? (
          <p className="text-xs text-muted">Loading grievances...</p>
        ) : disputes.length === 0 ? (
          <EmptyState
            icon={Scale}
            title={language === 'hi' ? 'कोई विवाद दर्ज नहीं है' : 'No Open Grievances'}
            description={
              language === 'hi'
                ? 'यदि किसी कार्यस्थल पर मजदूरी का विवाद या दुर्व्यवहार हो, तो आप यहाँ गोपनीय रिपोर्ट कर सकते हैं।'
                : 'If you experience wage withholding, unsafe conditions, or employer misconduct, file a confidential report.'
            }
          />
        ) : (
          <div className="space-y-3">
            {disputes.map((d) => (
              <div key={d.id} className="ks-card p-5 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-line pb-2.5">
                  <div>
                    <span className="rounded-md bg-subtle px-2 py-0.5 text-[10px] font-bold text-muted uppercase">
                      {d.category.replace('_', ' ')}
                    </span>
                    <h3 className="font-bold text-ink text-base mt-1">{d.title}</h3>
                  </div>
                  <span
                    className={`rounded-md px-2.5 py-0.5 text-xs font-bold uppercase self-start sm:self-auto ${
                      d.status === 'RESOLVED'
                        ? 'bg-green-500/10 text-green-700 dark:text-green-300'
                        : d.status === 'UNDER_REVIEW'
                        ? 'bg-amber-500/10 text-amber-700 dark:text-amber-300'
                        : 'bg-blue-500/10 text-blue-700 dark:text-blue-300'
                    }`}
                  >
                    {d.status}
                  </span>
                </div>

                <p className="text-xs text-ink-soft">{d.description}</p>

                <div className="flex items-center justify-between text-[11px] text-muted border-t border-line pt-2">
                  <span>Filed on {formatDate(d.createdAt)}</span>
                  {d.resolution && (
                    <span className="font-semibold text-green-700 dark:text-green-400">
                      Resolution: {d.resolution}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* File Dispute Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="ks-card w-full max-w-lg p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-line pb-3">
              <h3 className="text-base font-bold text-ink flex items-center gap-2">
                <Scale className="h-5 w-5 text-accent" />
                <span>{t.fileDispute}</span>
              </h3>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="text-muted hover:text-ink"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-ink-soft mb-1.5">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="ks-input"
                >
                  <option value="WAGE_DISPUTE">Wage Disagreement / Non-Payment</option>
                  <option value="UNSAFE_CONDITIONS">Unsafe Working Conditions</option>
                  <option value="MISCONDUCT">Employer Misconduct / Abuse</option>
                  <option value="ATTENDANCE_DISPUTE">Attendance Disagreement</option>
                  <option value="FAKE_LISTING">Fake or Misleading Listing</option>
                  <option value="OTHER">Other Dispute</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-ink-soft mb-1.5">Grievance Subject</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Unpaid daily wages for commercial painting job"
                  className="ks-input"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-ink-soft mb-1.5">Factual Description</label>
                <textarea
                  rows={4}
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="State the dates, agreed wages, and specific issue accurately..."
                  className="ks-input"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="ks-btn ks-btn-outline ks-btn-sm"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="ks-btn ks-btn-primary ks-btn-sm"
                >
                  {submitting ? 'Submitting...' : 'File Grievance'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardShell>
  );
}
