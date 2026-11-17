'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import DashboardShell from '@/components/DashboardShell';
import PageHeader from '@/components/ui/PageHeader';
import StatCard from '@/components/ui/StatCard';
import EmptyState from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import { formatDate } from '@/lib/date';
import {
  Banknote,
  Clock,
  CheckCircle2,
  AlertCircle,
  Building2,
  Calendar,
  CreditCard,
  TrendingUp,
} from 'lucide-react';

interface EarningsStats {
  totalEarned: number;
  totalPaid: number;
  pendingWages: number;
  totalAssignments: number;
}

interface AssignmentWage {
  id: string;
  jobTitle: string;
  businessName: string;
  agreedWage: number;
  wageType: string;
  earned: number;
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
  business: { name: string };
  assignment: { job: { title: string } };
}

export default function WorkerEarningsPage() {
  const { user, t, language } = useApp();
  const [stats, setStats] = useState<EarningsStats | null>(null);
  const [assignments, setAssignments] = useState<AssignmentWage[]>([]);
  const [recentPayments, setRecentPayments] = useState<PaymentRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.role === 'WORKER') {
      fetch('/api/wages')
        .then((res) => res.json())
        .then((data) => {
          if (data.stats) setStats(data.stats);
          if (data.assignments) setAssignments(data.assignments);
          if (data.recentPayments) setRecentPayments(data.recentPayments);
        })
        .catch(() => {})
        .finally(() => setLoading(false));
    }
  }, [user]);

  return (
    <DashboardShell role="WORKER">
      <PageHeader
        title={t.wagesAndEarnings}
        subtitle={
          language === 'hi'
            ? 'अपनी कुल कमाई, प्राप्त मजदूरी और बाकी भुगतान का पारदर्शी विवरण'
            : 'Track earned wages, verified payments, and pending dues across all work assignments'
        }
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          icon={TrendingUp}
          label={t.totalEarned}
          value={`₹${(stats?.totalEarned || 0).toLocaleString('en-IN')}`}
          tone="emerald"
        />
        <StatCard
          icon={CheckCircle2}
          label={t.paidWages}
          value={`₹${(stats?.totalPaid || 0).toLocaleString('en-IN')}`}
          tone="brand"
        />
        <StatCard
          icon={AlertCircle}
          label={t.pendingWages}
          value={`₹${(stats?.pendingWages || 0).toLocaleString('en-IN')}`}
          tone="amber"
        />
      </div>

      {/* Assignment Earnings Breakdown Table */}
      <div className="ks-card p-6 space-y-4">
        <h3 className="text-base font-bold text-ink border-b border-line pb-3">
          {language === 'hi' ? 'कार्य अनुसार मजदूरी विवरण' : 'Work Assignment Wage Breakdown'}
        </h3>

        {loading ? (
          <Skeleton className="h-32 rounded-xl" />
        ) : assignments.length === 0 ? (
          <EmptyState
            icon={Banknote}
            title={language === 'hi' ? 'कोई कमाई रिकॉर्ड नहीं है' : 'No Earnings Recorded Yet'}
            description={
              language === 'hi'
                ? 'जब आप हाजिरी दर्ज करेंगे, तो आपकी मजदूरी यहाँ स्वतः गणना होगी।'
                : 'As you check in and complete assigned work, your wage balances will calculate here.'
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-line bg-subtle text-[11px] font-bold uppercase text-muted">
                <tr>
                  <th className="p-3">Job & Employer</th>
                  <th className="p-3">Agreed Rate</th>
                  <th className="p-3">Total Earned</th>
                  <th className="p-3">Paid Amount</th>
                  <th className="p-3">Pending Due</th>
                  <th className="p-3">Payment Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {assignments.map((a) => (
                  <tr key={a.id} className="hover:bg-subtle/50 transition-colors">
                    <td className="p-3">
                      <div className="font-bold text-ink">{a.jobTitle}</div>
                      <div className="text-[11px] text-muted">{a.businessName}</div>
                    </td>
                    <td className="p-3 font-semibold text-ink-soft">
                      ₹{a.agreedWage.toLocaleString('en-IN')} {a.wageType === 'DAILY' ? '/ day' : 'fixed'}
                    </td>
                    <td className="p-3 font-bold text-green-700 dark:text-green-400">
                      ₹{a.earned.toLocaleString('en-IN')}
                    </td>
                    <td className="p-3 font-bold text-ink">
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
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Recent Payment Receipts */}
      <div className="ks-card p-6 space-y-4">
        <h3 className="text-base font-bold text-ink border-b border-line pb-3">
          {language === 'hi' ? 'हालिया भुगतान रसीदें' : 'Confirmed Payment Receipts'}
        </h3>

        {loading ? (
          <Skeleton className="h-24 rounded-xl" />
        ) : recentPayments.length === 0 ? (
          <p className="text-xs text-muted">
            {language === 'hi' ? 'अभी तक कोई भुगतान दर्ज नहीं हुआ है।' : 'No payment transactions recorded yet.'}
          </p>
        ) : (
          <div className="divide-y divide-line">
            {recentPayments.map((p) => (
              <div key={p.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                <div>
                  <div className="font-bold text-ink">{p.assignment.job.title}</div>
                  <div className="text-[11px] text-muted">
                    Paid by {p.business.name} • Method: <strong>{p.paymentMethod}</strong> • {formatDate(p.paidAt)}
                    {p.transactionReference && ` (Ref: ${p.transactionReference})`}
                  </div>
                </div>
                <div className="text-sm font-black text-green-700 dark:text-green-400">
                  + ₹{Number(p.amount).toLocaleString('en-IN')}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
