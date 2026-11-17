'use client';

import { toast } from '@/components/ui/Toast';
import React, { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import DashboardShell from '@/components/DashboardShell';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import Alert from '@/components/ui/Alert';
import EmptyState from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import {
  BookOpen,
  Plus,
  Search,
  ArrowDownRight,
  ArrowUpRight,
  User,
  Mic,
  Phone,
} from 'lucide-react';
import VoiceAssistantModal from '@/components/VoiceAssistantModal';
import { cn } from '@/lib/cn';
import { formatDate } from '@/lib/date';

interface CustomerKhata {
  id: string;
  name: string;
  phone?: string | null;
  address?: string | null;
  totalCredit: number;
  totalRepayment: number;
  outstandingBalance: number;
}

interface DetailedTransaction {
  id: string;
  amount: number;
  type: 'CREDIT' | 'REPAYMENT';
  description?: string | null;
  createdAt: string;
}

export default function BusinessUdhaarPage() {
  const { t, language } = useApp();
  const isHi = language === 'hi';
  const [customers, setCustomers] = useState<CustomerKhata[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [selectedCustomerTransactions, setSelectedCustomerTransactions] = useState<
    DetailedTransaction[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Transaction form states
  const [txType, setTxType] = useState<'CREDIT' | 'REPAYMENT'>('CREDIT');
  const [amount, setAmount] = useState<number | ''>('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error';
    msg: string;
  } | null>(null);

  // Add Customer modal
  const [showAddCustomer, setShowAddCustomer] = useState(false);
  const [newCustName, setNewCustName] = useState('');
  const [newCustPhone, setNewCustPhone] = useState('');
  const [newCustAddress, setNewCustAddress] = useState('');
  const [creatingCustomer, setCreatingCustomer] = useState(false);

  // Voice Assistant Modal
  const [voiceOpen, setVoiceOpen] = useState(false);

  const fetchCustomers = async () => {
    try {
      const res = await fetch(`/api/business/customers${search ? `?search=${search}` : ''}`);
      const data = await res.json();
      if (data.customers) {
        setCustomers(data.customers);
        // Default to first customer if none selected
        if (!selectedCustomerId && data.customers.length > 0) {
          setSelectedCustomerId(data.customers[0].id);
        }
      }
    } catch {
      console.error('Failed to load customers');
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomerDetails = async (id: string) => {
    if (!id) return;
    try {
      const res = await fetch(`/api/business/customers/${id}`);
      const data = await res.json();
      if (data.customer) {
        setSelectedCustomerTransactions(data.customer.transactions || []);
      }
    } catch {
      console.error('Failed to load customer transactions');
    }
  };

  useEffect(() => {
    const timer = window.setTimeout(() => {
      fetchCustomers();
    }, 250);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  useEffect(() => {
    if (selectedCustomerId) {
      fetchCustomerDetails(selectedCustomerId);
    }
  }, [selectedCustomerId]);

  const selectedCustomer = customers.find((c) => c.id === selectedCustomerId);

  const handleRecordTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomerId || !amount) return;

    setSubmitting(true);
    setFeedback(null);

    try {
      const res = await fetch('/api/business/udhaar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: selectedCustomerId,
          amount: Number(amount),
          type: txType,
          description: description || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setFeedback({ type: 'error', msg: data.error || 'Failed to record transaction' });
      } else {
        setFeedback({ type: 'success', msg: data.message });
        toast.success(data.message);
        setAmount('');
        setDescription('');
        await fetchCustomers();
        await fetchCustomerDetails(selectedCustomerId);
      }
    } catch {
      setFeedback({ type: 'error', msg: 'Network error recording transaction' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreatingCustomer(true);
    try {
      const res = await fetch('/api/business/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newCustName,
          phone: newCustPhone || undefined,
          address: newCustAddress || undefined,
        }),
      });

      const data = await res.json();
      if (res.ok && data.customer) {
        setShowAddCustomer(false);
        setNewCustName('');
        setNewCustPhone('');
        setNewCustAddress('');
        toast.success(isHi ? 'ग्राहक खाता सफलतापूर्वक खोला गया!' : 'Customer ledger opened successfully!');
        await fetchCustomers();
        setSelectedCustomerId(data.customer.id);
      } else {
        toast.error(data.error || 'Failed to create customer');
        setFeedback({ type: 'error', msg: data.error || 'Failed to create customer' });
      }
    } catch {
      toast.error('Failed to create customer');
      setFeedback({ type: 'error', msg: 'Failed to create customer' });
    } finally {
      setCreatingCustomer(false);
    }
  };

  const totalAllOutstanding = customers.reduce((sum, c) => sum + c.outstandingBalance, 0);

  return (
    <DashboardShell role="BUSINESS_OWNER">
      {/* Header with Quick Voice entry */}
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h1 className="flex items-center gap-2.5 text-xl font-black tracking-tight text-ink sm:text-2xl">
            <BookOpen className="h-6 w-6 text-amber-600 dark:text-amber-400" aria-hidden />
            {isHi ? 'डिजिटल उधार बहीखाता' : 'Digital Udhaar Ledger'}
          </h1>
          <p className="mt-1 text-xs text-muted sm:text-sm">
            {isHi ? '100% गणितीय सटीकता के साथ ग्राहक उधार और जमा ट्रैक करें।' : 'Track customer credit and repayments with 100% mathematical accuracy.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="amber" onClick={() => setVoiceOpen(true)}>
            <Mic className="h-4 w-4" aria-hidden />
            {t.voiceEntry}
          </Button>
          <Button variant="secondary" onClick={() => setShowAddCustomer(true)}>
            <Plus className="h-4 w-4" aria-hidden />
            {t.addCustomer}
          </Button>
        </div>
      </div>

      {/* Global Outstanding Banner */}
      <div className="flex flex-col justify-between gap-2 rounded-2xl border border-amber-500/30 bg-amber-500/15 p-5 sm:flex-row sm:items-center">
        <div>
          <span className="text-[11px] font-bold tracking-wider text-amber-900 dark:text-amber-200 uppercase">
            {t.totalMarketCredit}
          </span>
          <p className="text-xs text-amber-800 dark:text-amber-300/80">
            {isHi ? `कुल ${customers.length} पंजीकृत ग्राहकों पर बकाया राशि` : `Total amount owed across ${customers.length} registered customers`}
          </p>
        </div>
        <p className="text-2xl font-black text-amber-800 dark:text-amber-300 tabular-nums">
          ₹{totalAllOutstanding.toLocaleString('en-IN')}
        </p>
      </div>

      {feedback && <Alert tone={feedback.type}>{feedback.msg}</Alert>}

      {/* Split View: Customer List on Left, Active Ledger on Right */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left Column: Customer Directory (5 cols) */}
        <div className="ks-card space-y-3 p-4 lg:col-span-5">
          <div className="relative">
            <Search
              className="pointer-events-none absolute top-3 left-3.5 h-4 w-4 text-muted"
              aria-hidden
            />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search customer name or phone…"
              aria-label="Search customers"
              className="ks-input pl-10"
            />
          </div>

          <div className="max-h-[600px] divide-y divide-line overflow-y-auto">
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="m-2 h-14 rounded-xl" />
              ))
            ) : customers.length === 0 ? (
              <EmptyState
                icon={User}
                title="No customers found"
                description="Add a customer to start recording Udhaar entries."
                action={
                  <Button size="sm" onClick={() => setShowAddCustomer(true)}>
                    <Plus className="h-4 w-4" aria-hidden />
                    Add First Customer
                  </Button>
                }
                className="border-0 shadow-none"
              />
            ) : (
              customers.map((c) => {
                const isSelected = c.id === selectedCustomerId;
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setSelectedCustomerId(c.id)}
                    aria-pressed={isSelected}
                    className={cn(
                      'flex w-full items-center justify-between gap-3 rounded-2xl p-3.5 text-left transition-all',
                      isSelected
                        ? 'border border-amber-300 bg-amber-500/15 shadow-card'
                        : 'border border-transparent hover:bg-hover'
                    )}
                  >
                    <div className="min-w-0 space-y-0.5">
                      <p className="truncate text-xs font-bold text-ink">
                        {c.name}
                      </p>
                      <p className="text-[11px] text-muted">
                        {c.phone || 'No mobile'}
                      </p>
                    </div>

                    <div className="shrink-0 text-right">
                      <p
                        className={cn(
                          'text-xs font-black tabular-nums',
                          c.outstandingBalance > 0 ? 'text-amber-700 dark:text-amber-300' : 'text-green-700 dark:text-green-300'
                        )}
                      >
                        ₹{c.outstandingBalance.toFixed(2)}
                      </p>
                      <p className="text-[10px] text-muted">
                        {c.outstandingBalance > 0 ? 'Due Udhaar' : 'Settled'}
                      </p>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Customer Ledger & Quick Transaction (7 cols) */}
        <div className="space-y-6 lg:col-span-7">
          {selectedCustomer ? (
            <>
              {/* Customer Snapshot Card */}
              <div className="ks-card animate-fade-up space-y-4 p-6">
                <div className="flex flex-col justify-between gap-2 border-b border-line pb-4 sm:flex-row sm:items-center">
                  <div>
                    <h2 className="text-lg font-bold text-ink">
                      {selectedCustomer.name}
                    </h2>
                    <p className="flex items-center gap-1.5 text-xs text-muted">
                      <Phone className="h-3 w-3" aria-hidden />
                      {selectedCustomer.phone || 'No phone'}
                      {selectedCustomer.address ? ` • ${selectedCustomer.address}` : ''}
                    </p>
                  </div>

                  <div className="text-left sm:text-right">
                    <span className="block text-[10px] font-bold tracking-wider text-muted uppercase">
                      Net Outstanding (Credit − Repayment)
                    </span>
                    <span className="text-2xl font-black text-amber-700 dark:text-amber-300 tabular-nums">
                      ₹{selectedCustomer.outstandingBalance.toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Ledger formula breakdown */}
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="rounded-xl border border-line bg-subtle p-3">
                    <span className="block text-muted">Total Credit Given (+)</span>
                    <span className="mt-0.5 block text-sm font-bold text-red-600 dark:text-red-400 tabular-nums">
                      ₹{selectedCustomer.totalCredit.toFixed(2)}
                    </span>
                  </div>
                  <div className="rounded-xl border border-line bg-subtle p-3">
                    <span className="block text-muted">Total Repayments (−)</span>
                    <span className="mt-0.5 block text-sm font-bold text-green-600 dark:text-green-400 tabular-nums">
                      ₹{selectedCustomer.totalRepayment.toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Transaction form */}
                <form
                  onSubmit={handleRecordTransaction}
                  className="space-y-3 border-t border-line pt-4"
                >
                  <div
                    className="flex items-center gap-2"
                    role="group"
                    aria-label="Transaction type"
                  >
                    <button
                      type="button"
                      onClick={() => setTxType('CREDIT')}
                      aria-pressed={txType === 'CREDIT'}
                      className={cn(
                        'ks-btn ks-btn-sm flex-1',
                        txType === 'CREDIT'
                          ? 'bg-red-600 text-white shadow-sm shadow-red-600/25 hover:bg-red-700'
                          : 'ks-btn-secondary'
                      )}
                    >
                      <ArrowDownRight className="h-4 w-4" aria-hidden />
                      Give Udhaar (+)
                    </button>

                    <button
                      type="button"
                      onClick={() => setTxType('REPAYMENT')}
                      aria-pressed={txType === 'REPAYMENT'}
                      className={cn(
                        'ks-btn ks-btn-sm flex-1',
                        txType === 'REPAYMENT'
                          ? 'ks-btn-emerald'
                          : 'ks-btn-secondary'
                      )}
                    >
                      <ArrowUpRight className="h-4 w-4" aria-hidden />
                      Receive Repayment (−)
                    </button>
                  </div>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div>
                      <label htmlFor="udhaar-amount" className="ks-label">
                        Amount (₹) *
                      </label>
                      <input
                        id="udhaar-amount"
                        type="number"
                        step="0.5"
                        min="1"
                        required
                        value={amount}
                        onChange={(e) => setAmount(Number(e.target.value))}
                        placeholder="e.g. 500"
                        className="ks-input font-bold"
                      />
                    </div>

                    <div>
                      <label htmlFor="udhaar-note" className="ks-label">
                        Note / Bill Reference
                      </label>
                      <input
                        id="udhaar-note"
                        type="text"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="e.g. Rice & oil or Cash repayment"
                        className="ks-input"
                      />
                    </div>
                  </div>

                  <Button
                    type="submit"
                    loading={submitting}
                    loadingText="Saving…"
                    className={cn(
                      'w-full',
                      txType === 'CREDIT' ? 'bg-red-600 hover:bg-red-700 shadow-red-600/25' : 'ks-btn-emerald'
                    )}
                  >
                    {txType === 'CREDIT' ? 'Save' : 'Record'} ₹
                    {amount || 0}{' '}
                    {txType === 'CREDIT'
                      ? `Credit for ${selectedCustomer.name}`
                      : `Repayment from ${selectedCustomer.name}`}
                  </Button>
                </form>
              </div>

              {/* Transaction History Ledger */}
              <div className="ks-card p-6">
                <h3 className="text-sm font-bold text-ink">
                  Historical Ledger for {selectedCustomer.name}
                </h3>

                {selectedCustomerTransactions.length === 0 ? (
                  <p className="py-6 text-center text-xs text-muted">
                    No transaction records yet.
                  </p>
                ) : (
                  <div className="mt-3 divide-y divide-line">
                    {selectedCustomerTransactions.map((tx) => {
                      const isCredit = tx.type === 'CREDIT';
                      return (
                        <div
                          key={tx.id}
                          className="flex items-center justify-between py-3 text-xs"
                        >
                          <div className="flex items-start gap-2.5">
                            <div
                              className={cn(
                                'flex h-8 w-8 shrink-0 items-center justify-center rounded-full',
                                isCredit
                                  ? 'bg-red-500/15 text-red-700 dark:text-red-300'
                                  : 'bg-green-500/15 text-green-700 dark:text-green-300'
                              )}
                              aria-hidden
                            >
                              {isCredit ? (
                                <ArrowDownRight className="h-4 w-4" />
                              ) : (
                                <ArrowUpRight className="h-4 w-4" />
                              )}
                            </div>
                            <div>
                              <p className="font-bold text-ink">
                                {isCredit ? 'Credit Given' : 'Repayment Received'}
                              </p>
                              <p className="text-[11px] text-muted">
                                {tx.description || 'Manual entry'}
                              </p>
                            </div>
                          </div>

                          <div className="text-right">
                            <p
                              className={cn(
                                'font-black tabular-nums',
                                isCredit ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'
                              )}
                            >
                              {isCredit ? '+' : '−'}₹{Number(tx.amount).toFixed(2)}
                            </p>
                            <p className="text-[10px] text-muted">
                              {formatDate(tx.createdAt)}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="ks-card p-12 text-center text-xs text-muted">
              Select a customer from the left directory to view their ledger.
            </div>
          )}
        </div>
      </div>

      {/* Add Customer Modal */}
      <Modal
        open={showAddCustomer}
        onClose={() => setShowAddCustomer(false)}
        title="Add New Customer"
        className="max-w-sm"
      >
        <form onSubmit={handleCreateCustomer} className="space-y-3 text-xs">
          <div>
            <label htmlFor="uc-name" className="ks-label">
              Customer Name *
            </label>
            <input
              id="uc-name"
              type="text"
              required
              value={newCustName}
              onChange={(e) => setNewCustName(e.target.value)}
              placeholder="e.g. Ramesh Bhai"
              className="ks-input"
            />
          </div>
          <div>
            <label htmlFor="uc-phone" className="ks-label">
              Phone Number
            </label>
            <input
              id="uc-phone"
              type="tel"
              value={newCustPhone}
              onChange={(e) => setNewCustPhone(e.target.value)}
              placeholder="e.g. 9822233441"
              className="ks-input"
            />
          </div>
          <div>
            <label htmlFor="uc-address" className="ks-label">
              Address / Society
            </label>
            <input
              id="uc-address"
              type="text"
              value={newCustAddress}
              onChange={(e) => setNewCustAddress(e.target.value)}
              placeholder="e.g. Radha Krishna Flats"
              className="ks-input"
            />
          </div>
          <div className="flex justify-end gap-2 border-t border-line pt-4">
            <Button variant="secondary" size="sm" onClick={() => setShowAddCustomer(false)}>
              Cancel
            </Button>
            <Button type="submit" size="sm" loading={creatingCustomer} loadingText="Creating…">
              Create Customer
            </Button>
          </div>
        </form>
      </Modal>

      {/* Voice Modal */}
      <VoiceAssistantModal isOpen={voiceOpen} onClose={() => setVoiceOpen(false)} />
    </DashboardShell>
  );
}
