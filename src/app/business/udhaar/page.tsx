'use client';

import React, { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import {
  BookOpen,
  Plus,
  Search,
  ArrowDownRight,
  ArrowUpRight,
  User,
  Phone,
  CheckCircle2,
  AlertCircle,
  Mic,
  Calendar,
  Sparkles,
} from 'lucide-react';
import VoiceAssistantModal from '@/components/VoiceAssistantModal';

interface CustomerKhata {
  id: string;
  name: string;
  phone?: string | null;
  address?: string | null;
  totalCredit: number;
  totalRepayment: number;
  outstandingBalance: number;
  lastTransaction?: {
    amount: number;
    type: 'CREDIT' | 'REPAYMENT';
    createdAt: string;
  } | null;
}

interface DetailedTransaction {
  id: string;
  amount: number;
  type: 'CREDIT' | 'REPAYMENT';
  description?: string | null;
  createdAt: string;
}

export default function BusinessUdhaarPage() {
  const [customers, setCustomers] = useState<CustomerKhata[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [selectedCustomerTransactions, setSelectedCustomerTransactions] = useState<DetailedTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Transaction form states
  const [txType, setTxType] = useState<'CREDIT' | 'REPAYMENT'>('CREDIT');
  const [amount, setAmount] = useState<number | ''>('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  // Add Customer modal
  const [showAddCustomer, setShowAddCustomer] = useState(false);
  const [newCustName, setNewCustName] = useState('');
  const [newCustPhone, setNewCustPhone] = useState('');
  const [newCustAddress, setNewCustAddress] = useState('');

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
    fetchCustomers();
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
      if (data.customer) {
        setShowAddCustomer(false);
        setNewCustName('');
        setNewCustPhone('');
        setNewCustAddress('');
        await fetchCustomers();
        setSelectedCustomerId(data.customer.id);
      }
    } catch {
      setFeedback({ type: 'error', msg: 'Failed to create customer' });
    }
  };

  const totalAllOutstanding = customers.reduce((sum, c) => sum + c.outstandingBalance, 0);

  return (
    <div className="flex flex-col lg:flex-row min-h-[calc(100vh-4rem)] bg-slate-50">
      <Sidebar role="BUSINESS_OWNER" />

      <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl">
        {/* Header with Quick Voice entry */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
              <BookOpen className="h-6 w-6 text-amber-600" />
              Digital Udhaar Book (ખાતાવહી / बहीखाता)
            </h1>
            <p className="text-xs text-slate-500">
              Track customer credit and repayments with 100% mathematical accuracy.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setVoiceOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-md transition-all active:scale-95"
            >
              <Mic className="h-4 w-4" />
              Voice Entry (&quot;બોલીને લખો&quot;)
            </button>
            <button
              onClick={() => setShowAddCustomer(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-md transition-colors"
            >
              <Plus className="h-4 w-4" />
              New Customer
            </button>
          </div>
        </div>

        {/* Global Outstanding Banner */}
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-amber-900">
              Total Outstanding Market Credit
            </span>
            <p className="text-xs text-amber-800">
              Total amount owed across {customers.length} registered customers
            </p>
          </div>
          <p className="text-2xl font-black text-amber-800">
            ₹{totalAllOutstanding.toLocaleString()}
          </p>
        </div>

        {feedback && (
          <div
            className={`p-4 rounded-xl text-xs flex items-center gap-2 ${
              feedback.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                : 'bg-red-50 text-red-800 border border-red-200'
            }`}
          >
            {feedback.type === 'success' ? (
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
            ) : (
              <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
            )}
            <span>{feedback.msg}</span>
          </div>
        )}

        {/* Split View: Customer List on Left, Active Ledger on Right */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Customer Directory (4 cols) */}
          <div className="lg:col-span-5 bg-white rounded-3xl border border-slate-200 shadow-xs p-4 space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search customer name or phone..."
                className="w-full rounded-xl border border-slate-300 pl-9 pr-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div className="divide-y divide-slate-100 max-h-[600px] overflow-y-auto">
              {loading ? (
                <p className="text-xs text-slate-400 py-4 text-center">Loading customers...</p>
              ) : customers.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">
                  <User className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                  <p>No customers found.</p>
                  <button
                    onClick={() => setShowAddCustomer(true)}
                    className="mt-2 text-xs font-bold text-teal-700 hover:underline"
                  >
                    + Add First Customer
                  </button>
                </div>
              ) : (
                customers.map((c) => {
                  const isSelected = c.id === selectedCustomerId;
                  return (
                    <div
                      key={c.id}
                      onClick={() => setSelectedCustomerId(c.id)}
                      className={`p-3.5 rounded-2xl cursor-pointer transition-all flex items-center justify-between gap-3 ${
                        isSelected
                          ? 'bg-amber-50/80 border border-amber-300 shadow-xs'
                          : 'hover:bg-slate-50'
                      }`}
                    >
                      <div className="space-y-0.5">
                        <p className="font-bold text-xs text-slate-900">{c.name}</p>
                        <p className="text-[11px] text-slate-400">{c.phone || 'No mobile'}</p>
                      </div>

                      <div className="text-right">
                        <p className={`text-xs font-black ${
                          c.outstandingBalance > 0 ? 'text-amber-700' : 'text-emerald-700'
                        }`}>
                          ₹{c.outstandingBalance.toFixed(2)}
                        </p>
                        <p className="text-[10px] text-slate-400">
                          {c.outstandingBalance > 0 ? 'Due Udhaar' : 'Settled'}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Right Column: Customer Ledger & Quick Transaction (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            {selectedCustomer ? (
              <>
                {/* Customer Snapshot Card */}
                <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
                    <div>
                      <h2 className="text-lg font-bold text-slate-900">{selectedCustomer.name}</h2>
                      <p className="text-xs text-slate-500">
                        {selectedCustomer.phone ? `Phone: ${selectedCustomer.phone}` : 'No phone'}{' '}
                        {selectedCustomer.address ? `• ${selectedCustomer.address}` : ''}
                      </p>
                    </div>

                    <div className="text-left sm:text-right">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                        Net Outstanding (Total Credit - Repayment)
                      </span>
                      <span className="text-2xl font-black text-amber-700">
                        ₹{selectedCustomer.outstandingBalance.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  {/* Mathematical Ledger Formula Breakdown */}
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                      <span className="text-slate-500 block">Total Credit Given (+)</span>
                      <span className="text-sm font-bold text-red-600">
                        ₹{selectedCustomer.totalCredit.toFixed(2)}
                      </span>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                      <span className="text-slate-500 block">Total Repayments Made (-)</span>
                      <span className="text-sm font-bold text-emerald-600">
                        ₹{selectedCustomer.totalRepayment.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  {/* Add New Transaction (Credit / Repayment) Form */}
                  <form onSubmit={handleRecordTransaction} className="pt-2 border-t border-slate-100 space-y-3">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setTxType('CREDIT')}
                        className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                          txType === 'CREDIT'
                            ? 'bg-red-600 text-white shadow-xs'
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        }`}
                      >
                        <ArrowDownRight className="h-4 w-4" />
                        Give Udhaar (+)
                      </button>

                      <button
                        type="button"
                        onClick={() => setTxType('REPAYMENT')}
                        className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                          txType === 'REPAYMENT'
                            ? 'bg-emerald-600 text-white shadow-xs'
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        }`}
                      >
                        <ArrowUpRight className="h-4 w-4" />
                        Receive Repayment (-)
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                          Amount (₹) *
                        </label>
                        <input
                          type="number"
                          step="0.5"
                          min="1"
                          required
                          value={amount}
                          onChange={(e) => setAmount(Number(e.target.value))}
                          placeholder="e.g. 500"
                          className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-900 font-bold"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                          Note / Bill Reference
                        </label>
                        <input
                          type="text"
                          value={description}
                          onChange={(e) => setDescription(e.target.value)}
                          placeholder="e.g. Rice & oil or Cash repayment"
                          className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-900"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={submitting}
                      className={`w-full py-2.5 rounded-xl text-white font-bold text-xs shadow-md transition-all active:scale-98 ${
                        txType === 'CREDIT'
                          ? 'bg-red-600 hover:bg-red-700'
                          : 'bg-emerald-600 hover:bg-emerald-700'
                      }`}
                    >
                      {submitting
                        ? 'Saving transaction...'
                        : txType === 'CREDIT'
                        ? `Save ₹${amount || 0} Credit for ${selectedCustomer.name}`
                        : `Record ₹${amount || 0} Repayment from ${selectedCustomer.name}`}
                    </button>
                  </form>
                </div>

                {/* Transaction History Ledger */}
                <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6 space-y-4">
                  <h3 className="text-sm font-bold text-slate-900">
                    Historical Ledger for {selectedCustomer.name}
                  </h3>

                  {selectedCustomerTransactions.length === 0 ? (
                    <p className="text-xs text-slate-400 py-4 text-center">No transaction records yet.</p>
                  ) : (
                    <div className="divide-y divide-slate-100">
                      {selectedCustomerTransactions.map((tx) => {
                        const isCredit = tx.type === 'CREDIT';
                        return (
                          <div key={tx.id} className="py-3 flex items-center justify-between text-xs">
                            <div className="flex items-start gap-2.5">
                              <div
                                className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 ${
                                  isCredit ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'
                                }`}
                              >
                                {isCredit ? <ArrowDownRight className="h-4 w-4" /> : <ArrowUpRight className="h-4 w-4" />}
                              </div>
                              <div>
                                <p className="font-bold text-slate-900">
                                  {isCredit ? 'Credit Given' : 'Repayment Received'}
                                </p>
                                <p className="text-[11px] text-slate-500">
                                  {tx.description || 'Manual entry'}
                                </p>
                              </div>
                            </div>

                            <div className="text-right">
                              <p className={`font-black ${isCredit ? 'text-red-600' : 'text-emerald-600'}`}>
                                {isCredit ? '+' : '-'}₹{Number(tx.amount).toFixed(2)}
                              </p>
                              <p className="text-[10px] text-slate-400">
                                {new Date(tx.createdAt).toLocaleDateString()}
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
              <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center text-slate-400 text-xs">
                Select a customer from the left directory to view their ledger.
              </div>
            )}
          </div>
        </div>

        {/* Add Customer Modal */}
        {showAddCustomer && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
            <div className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-xl border border-slate-200 space-y-4">
              <h3 className="text-base font-bold text-slate-900">Add New Customer</h3>
              <form onSubmit={handleCreateCustomer} className="space-y-3 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Customer Name *</label>
                  <input
                    type="text"
                    required
                    value={newCustName}
                    onChange={(e) => setNewCustName(e.target.value)}
                    placeholder="e.g. Ramesh Bhai"
                    className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-900"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Phone Number</label>
                  <input
                    type="tel"
                    value={newCustPhone}
                    onChange={(e) => setNewCustPhone(e.target.value)}
                    placeholder="e.g. 9822233441"
                    className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-900"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Address / Society</label>
                  <input
                    type="text"
                    value={newCustAddress}
                    onChange={(e) => setNewCustAddress(e.target.value)}
                    placeholder="e.g. Radha Krishna Flats"
                    className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-900"
                  />
                </div>
                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowAddCustomer(false)}
                    className="px-4 py-2 rounded-xl text-slate-600 bg-slate-100 font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl text-white bg-teal-600 hover:bg-teal-700 font-bold"
                  >
                    Create Customer
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Voice Modal */}
        <VoiceAssistantModal isOpen={voiceOpen} onClose={() => setVoiceOpen(false)} />
      </main>
    </div>
  );
}
