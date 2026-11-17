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
  Receipt,
  Plus,
  TrendingUp,
  TrendingDown,
  DollarSign,
  AlertCircle,
  X,
  PieChart,
} from 'lucide-react';

interface AnalyticsData {
  totalSalesRevenue: number;
  costOfGoodsSold: number;
  grossProfit: number;
  totalOperatingExpenses: number;
  netOperatingResult: number;
  accountingNote: string;
}

interface ExpenseItem {
  id: string;
  category: string;
  amount: number;
  description?: string | null;
  expenseDate: string;
}

export default function BusinessExpensesPage() {
  const { user, t, language } = useApp();
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [expenses, setExpenses] = useState<ExpenseItem[]>([]);
  const [categoryBreakdown, setCategoryBreakdown] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  // Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [category, setCategory] = useState('RENT');
  const [amount, setAmount] = useState(1000);
  const [description, setDescription] = useState('');
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().split('T')[0]);
  const [submitting, setSubmitting] = useState(false);

  const fetchExpenses = async () => {
    try {
      const res = await fetch('/api/business/expenses');
      const data = await res.json();
      if (data.analytics) setAnalytics(data.analytics);
      if (data.expenses) setExpenses(data.expenses);
      if (data.categoryBreakdown) setCategoryBreakdown(data.categoryBreakdown);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role === 'BUSINESS_OWNER') {
      fetchExpenses();
    }
  }, [user]);

  const handleRecordExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage('');
    try {
      const res = await fetch('/api/business/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category,
          amount: Number(amount),
          description,
          expenseDate,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(language === 'hi' ? 'खर्च सफलतापूर्वक दर्ज किया गया!' : 'Expense recorded successfully.');
        setMessage('Expense recorded successfully.');
        setModalOpen(false);
        setDescription('');
        fetchExpenses();
      } else {
        toast.error(data.error || 'Failed to record expense');
        setMessage(data.error || 'Failed to record expense');
      }
    } catch (e: any) {
      toast.error(e.message || 'Network error');
      setMessage(e.message || 'Network error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <DashboardShell role="BUSINESS_OWNER">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <PageHeader
          title={t.expenses}
          subtitle={
            language === 'hi'
              ? 'दुकान के वास्तविक खर्चे, लागत (COGS) और शुद्ध लाभ का पारदर्शी हिसाब'
              : 'Record business overheads, distinguish sales revenue from profit, and monitor net operating results'
          }
        />
        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="ks-btn ks-btn-primary ks-btn-md flex items-center gap-1.5 shrink-0"
        >
          <Plus className="h-4 w-4" />
          <span>Record Expense</span>
        </button>
      </div>

      {message && (
        <div className="rounded-xl border border-line bg-subtle p-4 text-xs font-semibold text-ink">
          {message}
        </div>
      )}

      {/* P&L Financial Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={TrendingUp}
          label="Total Sales Revenue"
          value={`₹${(analytics?.totalSalesRevenue || 0).toLocaleString('en-IN')}`}
          tone="brand"
        />
        <StatCard
          icon={TrendingDown}
          label="Cost of Goods Sold (COGS)"
          value={`₹${(analytics?.costOfGoodsSold || 0).toLocaleString('en-IN')}`}
          tone="amber"
        />
        <StatCard
          icon={DollarSign}
          label="Gross Profit"
          value={`₹${(analytics?.grossProfit || 0).toLocaleString('en-IN')}`}
          tone="emerald"
        />
        <StatCard
          icon={Receipt}
          label="Operating Result (Net)"
          value={`₹${(analytics?.netOperatingResult || 0).toLocaleString('en-IN')}`}
          tone={(analytics?.netOperatingResult || 0) >= 0 ? 'emerald' : 'rose'}
        />
      </div>

      {/* Accounting Clarification Note */}
      <div className="rounded-xl border border-line bg-subtle p-4 text-xs text-muted flex items-start gap-2.5">
        <AlertCircle className="h-4 w-4 text-accent shrink-0 mt-0.5" />
        <p>
          <strong>Accounting Note:</strong> Sales revenue represents gross counter receipts. 
          Gross Profit is computed after subtracting Cost of Goods Sold (COGS). 
          Net Operating Result deducts overheads (rent, electricity, staff wages, maintenance).
        </p>
      </div>

      {/* Category Breakdown & Expense List */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Category Breakdown Widget */}
        <div className="ks-card p-6 space-y-4">
          <h3 className="text-base font-bold text-ink border-b border-line pb-3 flex items-center gap-2">
            <PieChart className="h-4 w-4 text-accent" />
            <span>Overhead by Category</span>
          </h3>

          <div className="space-y-2.5 text-xs">
            {Object.entries(categoryBreakdown).length === 0 ? (
              <p className="text-muted">No operating expenses recorded yet.</p>
            ) : (
              Object.entries(categoryBreakdown).map(([cat, amt]) => (
                <div key={cat} className="flex items-center justify-between py-1.5 border-b border-line/60">
                  <span className="font-semibold text-ink-soft">{cat.replace('_', ' ')}</span>
                  <span className="font-bold text-ink tabular-nums">₹{amt.toLocaleString('en-IN')}</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Expense Transactions */}
        <div className="lg:col-span-2 ks-card p-6 space-y-4">
          <h3 className="text-base font-bold text-ink border-b border-line pb-3">
            Recorded Expense Log
          </h3>

          {loading ? (
            <Skeleton className="h-40 rounded-xl" />
          ) : expenses.length === 0 ? (
            <EmptyState
              icon={Receipt}
              title="No Expenses Logged"
              description="Record your store rent, electricity bills, transport, and maintenance costs to maintain an accurate P&L."
            />
          ) : (
            <div className="divide-y divide-line text-xs">
              {expenses.map((e) => (
                <div key={e.id} className="py-3 flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="rounded-md bg-subtle px-2 py-0.5 text-[10px] font-bold text-muted uppercase">
                        {e.category}
                      </span>
                      <span className="font-bold text-ink">{e.description || 'Operating Expense'}</span>
                    </div>
                    <div className="text-[11px] text-muted mt-0.5">{formatDate(e.expenseDate)}</div>
                  </div>
                  <div className="text-sm font-black text-rose-600">
                    - ₹{Number(e.amount).toLocaleString('en-IN')}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Record Expense Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="ks-card w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-line pb-3">
              <h3 className="text-base font-bold text-ink flex items-center gap-2">
                <Receipt className="h-5 w-5 text-accent" />
                <span>Record Store Expense</span>
              </h3>
              <button type="button" onClick={() => setModalOpen(false)} className="text-muted hover:text-ink">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleRecordExpense} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-ink-soft mb-1.5">Expense Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="ks-input"
                >
                  <option value="RENT">Store Rent</option>
                  <option value="ELECTRICITY">Electricity & Power</option>
                  <option value="STAFF_WAGES">Staff Wages & Helper Pay</option>
                  <option value="TRANSPORT">Freight & Transport</option>
                  <option value="MAINTENANCE">Repairs & Maintenance</option>
                  <option value="OTHER">Other Overhead</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-ink-soft mb-1.5">Amount (₹)</label>
                <input
                  type="number"
                  required
                  min={1}
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  className="ks-input font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-ink-soft mb-1.5">Expense Date</label>
                <input
                  type="date"
                  required
                  value={expenseDate}
                  onChange={(e) => setExpenseDate(e.target.value)}
                  className="ks-input"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-ink-soft mb-1.5">Description (Optional)</label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. October Shop Rent to Landlord"
                  className="ks-input"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setModalOpen(false)} className="ks-btn ks-btn-outline ks-btn-sm">
                  {t.cancel}
                </button>
                <button type="submit" disabled={submitting} className="ks-btn ks-btn-primary ks-btn-sm">
                  {submitting ? 'Recording...' : 'Record Expense'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardShell>
  );
}
