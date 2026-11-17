'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import DashboardShell from '@/components/DashboardShell';
import PageHeader from '@/components/ui/PageHeader';
import StatCard from '@/components/ui/StatCard';
import EmptyState from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import { toast } from '@/components/ui/Toast';
import { formatDate } from '@/lib/date';
import {
  Banknote,
  CheckCircle2,
  AlertCircle,
  Plus,
  CreditCard,
  User,
  Phone,
  X,
  TrendingDown,
} from 'lucide-react';

interface EmployerWageStats {
  totalPayable: number;
  totalPaid: number;
  pendingPayable: number;
  activeAssignmentsCount: number;
}

interface AssignmentItem {
  id: string;
  workerName: string;
  workerPhone: string;
  jobTitle: string;
  agreedWage: number;
  wageType: string;
  payable: number;
  paid: number;
  remaining: number;
  status: string;
  paymentStatus: string;
}

interface PaymentRecord {
  id: string;
  amount: number;
  paymentMethod: string;
  transactionReference?: string | null;
  notes?: string | null;
  paidAt: string;
  worker: { user: { name: string } };
  assignment: { job: { title: string } };
}

export default function BusinessWagesPage() {
  const { user, t, language } = useApp();
  const [stats, setStats] = useState<EmployerWageStats | null>(null);
  const [assignments, setAssignments] = useState<AssignmentItem[]>([]);
  const [recentPayments, setRecentPayments] = useState<PaymentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  // Payment Modal
  const [payModalOpen, setPayModalOpen] = useState(false);
  const [selectedAssignmentId, setSelectedAssignmentId] = useState('');
  const [payAmount, setPayAmount] = useState(500);
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [transactionRef, setTransactionRef] = useState('');
  const [notes, setNotes] = useState('');
  const [paying, setPaying] = useState(false);

  const fetchWages = async () => {
    try {
      const res = await fetch('/api/wages');
      const data = await res.json();
      if (data.stats) setStats(data.stats);
      if (data.assignments) setAssignments(data.assignments);
      if (data.recentPayments) setRecentPayments(data.recentPayments);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role === 'BUSINESS_OWNER') {
      fetchWages();
    }
  }, [user]);

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setPaying(true);
    setMessage('');
    try {
      const res = await fetch('/api/wages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assignmentId: selectedAssignmentId,
          amount: Number(payAmount),
          paymentMethod,
          transactionReference: transactionRef || undefined,
          notes: notes || undefined,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(language === 'hi' ? 'मजदूरी भुगतान सफलतापूर्वक दर्ज किया गया!' : 'Wage payment recorded and worker notified via in-app alert.');
        setMessage('Wage payment recorded and worker notified via in-app alert.');
        setPayModalOpen(false);
        setTransactionRef('');
        setNotes('');
        fetchWages();
      } else {
        toast.error(data.error || 'Failed to record wage payment');
        setMessage(data.error || 'Failed to record wage payment');
      }
    } catch (e: any) {
      toast.error(e.message || 'Network error');
      setMessage(e.message || 'Network error');
    } finally {
      setPaying(false);
    }
  };

  return (
    <DashboardShell role="BUSINESS_OWNER">
      <PageHeader
        title={t.wagesAndEarnings}
        subtitle={
          language === 'hi'
            ? 'कारीगरों की मजदूरी गणना, भुगतान रिकॉर्ड और बकाया राशि का प्रबंधन'
            : 'Track approved wage liabilities, issue verified payments, and maintain payment history'
        }
      />

      {message && (
        <div className="rounded-xl border border-line bg-subtle p-4 text-xs font-semibold text-ink">
          {message}
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          icon={TrendingDown}
          label="Total Wages Payable"
          value={`₹${(stats?.totalPayable || 0).toLocaleString('en-IN')}`}
          tone="brand"
        />
        <StatCard
          icon={CheckCircle2}
          label="Confirmed Wages Paid"
          value={`₹${(stats?.totalPaid || 0).toLocaleString('en-IN')}`}
          tone="emerald"
        />
        <StatCard
          icon={AlertCircle}
          label="Pending Wages Due"
          value={`₹${(stats?.pendingPayable || 0).toLocaleString('en-IN')}`}
          tone="amber"
        />
      </div>

      {/* Assignment Wages Table */}
      <div className="ks-card p-6 space-y-4">
        <h3 className="text-base font-bold text-ink border-b border-line pb-3">
          Worker Wage Balances by Assignment
        </h3>

        {loading ? (
          <Skeleton className="h-32 rounded-xl" />
        ) : assignments.length === 0 ? (
          <EmptyState
            icon={Banknote}
            title="No Active Wage Records"
            description="Once you schedule work assignments and approve attendance, wage liabilities will calculate here."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-line bg-subtle text-[11px] font-bold uppercase text-muted">
                <tr>
                  <th className="p-3">Worker & Job</th>
                  <th className="p-3">Agreed Rate</th>
                  <th className="p-3">Total Payable</th>
                  <th className="p-3">Total Paid</th>
                  <th className="p-3">Pending Due</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {assignments.map((a) => (
                  <tr key={a.id} className="hover:bg-subtle/50 transition-colors">
                    <td className="p-3">
                      <div className="font-bold text-ink">{a.workerName}</div>
                      <div className="text-[11px] text-muted">{a.jobTitle} • {a.workerPhone}</div>
                    </td>
                    <td className="p-3 font-semibold text-ink-soft">
                      ₹{a.agreedWage.toLocaleString('en-IN')} {a.wageType === 'DAILY' ? '/ day' : 'fixed'}
                    </td>
                    <td className="p-3 font-bold text-ink">
                      ₹{a.payable.toLocaleString('en-IN')}
                    </td>
                    <td className="p-3 font-bold text-green-700 dark:text-green-400">
                      ₹{a.paid.toLocaleString('en-IN')}
                    </td>
                    <td className="p-3 font-bold text-amber-600">
                      ₹{a.remaining.toLocaleString('en-IN')}
                    </td>
                    <td className="p-3">
                      <span
                        className={`inline-block rounded-md px-2 py-0.5 text-[10px] font-bold ${
                          a.paymentStatus === 'PAID'
                            ? 'bg-green-500/10 text-green-700 dark:text-green-300'
                            : a.paymentStatus === 'PARTIALLY_PAID'
                            ? 'bg-amber-500/10 text-amber-700 dark:text-amber-300'
                            : 'bg-subtle text-ink-soft'
                        }`}
                      >
                        {a.paymentStatus}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      {a.remaining > 0 && (
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedAssignmentId(a.id);
                            setPayAmount(a.remaining);
                            setPayModalOpen(true);
                          }}
                          className="ks-btn ks-btn-primary ks-btn-xs"
                        >
                          Record Payment
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Payment Receipts History */}
      <div className="ks-card p-6 space-y-4">
        <h3 className="text-base font-bold text-ink border-b border-line pb-3">
          Confirmed Wage Disbursements
        </h3>

        {loading ? (
          <Skeleton className="h-24 rounded-xl" />
        ) : recentPayments.length === 0 ? (
          <p className="text-xs text-muted">No wage payments recorded yet.</p>
        ) : (
          <div className="divide-y divide-line text-xs">
            {recentPayments.map((p) => (
              <div key={p.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <div className="font-bold text-ink">{p.worker.user.name} ({p.assignment.job.title})</div>
                  <div className="text-[11px] text-muted">
                    Method: <strong>{p.paymentMethod}</strong> • {formatDate(p.paidAt)}
                    {p.transactionReference && ` • Ref: ${p.transactionReference}`}
                    {p.notes && ` • "${p.notes}"`}
                  </div>
                </div>
                <div className="text-sm font-black text-green-700 dark:text-green-400">
                  ₹{Number(p.amount).toLocaleString('en-IN')}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Record Wage Payment Modal */}
      {payModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="ks-card w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-line pb-3">
              <h3 className="text-base font-bold text-ink">Record Wage Payment</h3>
              <button type="button" onClick={() => setPayModalOpen(false)} className="text-muted hover:text-ink">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleRecordPayment} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-ink-soft mb-1.5">Payment Amount (₹)</label>
                <input
                  type="number"
                  required
                  min={1}
                  value={payAmount}
                  onChange={(e) => setPayAmount(Number(e.target.value))}
                  className="ks-input font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-ink-soft mb-1.5">Payment Method</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="ks-input"
                >
                  <option value="CASH">Cash in Hand</option>
                  <option value="UPI">UPI / PhonePe / GPay</option>
                  <option value="CREDIT">Bank Transfer / NEFT</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-ink-soft mb-1.5">Transaction ID / Reference (Optional)</label>
                <input
                  type="text"
                  value={transactionRef}
                  onChange={(e) => setTransactionRef(e.target.value)}
                  placeholder="e.g. UPI Ref #4029104829"
                  className="ks-input"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-ink-soft mb-1.5">Remarks (Optional)</label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Paid in full for week 1 work"
                  className="ks-input"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setPayModalOpen(false)} className="ks-btn ks-btn-outline ks-btn-sm">
                  {t.cancel}
                </button>
                <button type="submit" disabled={paying} className="ks-btn ks-btn-primary ks-btn-sm">
                  {paying ? 'Recording...' : 'Confirm Payment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardShell>
  );
}
