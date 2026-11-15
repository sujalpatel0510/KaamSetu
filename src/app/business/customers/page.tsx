'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Sidebar from '@/components/Sidebar';
import { Users, Plus, Search, Phone, MapPin, BookOpen, ArrowRight, X } from 'lucide-react';

interface CustomerItem {
  id: string;
  name: string;
  phone?: string | null;
  address?: string | null;
  notes?: string | null;
  totalCredit: number;
  totalRepayment: number;
  outstandingBalance: number;
}

export default function BusinessCustomersPage() {
  const [customers, setCustomers] = useState<CustomerItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Add modal
  const [showAdd, setShowAdd] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [initialCredit, setInitialCredit] = useState<number | ''>('');

  const fetchCustomers = async () => {
    try {
      const res = await fetch(`/api/business/customers${search ? `?search=${search}` : ''}`);
      const data = await res.json();
      if (data.customers) setCustomers(data.customers);
    } catch {
      console.error('Failed to load customers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/business/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          phone: phone || undefined,
          address: address || undefined,
          notes: notes || undefined,
          initialCredit: initialCredit ? Number(initialCredit) : undefined,
        }),
      });

      if (res.ok) {
        setShowAdd(false);
        setName('');
        setPhone('');
        setAddress('');
        setNotes('');
        setInitialCredit('');
        fetchCustomers();
      }
    } catch {
      console.error('Failed to add customer');
    }
  };

  return (
    <div className="flex flex-col lg:flex-row min-h-[calc(100vh-4rem)] bg-slate-50">
      <Sidebar role="BUSINESS_OWNER" />

      <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-900">Customer Accounts & Contacts</h1>
            <p className="text-xs text-slate-500">
              Manage regular shop patrons, contact details, and their active credit balances.
            </p>
          </div>

          <button
            onClick={() => setShowAdd(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-md transition-colors"
          >
            <Plus className="h-4 w-4" />
            Add New Customer
          </button>
        </div>

        {/* Search */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by customer name or phone..."
              className="w-full rounded-xl border border-slate-300 pl-9 pr-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>
        </div>

        {/* Customer Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
            <p className="text-xs text-slate-400 col-span-3 text-center py-8">Loading customer directory...</p>
          ) : customers.length === 0 ? (
            <div className="col-span-3 bg-white p-12 text-center rounded-3xl border border-slate-200 text-xs text-slate-400">
              No customers found. Click &quot;Add New Customer&quot; to begin tracking customer accounts.
            </div>
          ) : (
            customers.map((c) => (
              <div
                key={c.id}
                className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-base font-bold text-slate-900">{c.name}</h3>
                    <span
                      className={`text-xs font-black px-2.5 py-0.5 rounded-lg ${
                        c.outstandingBalance > 0
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      ₹{c.outstandingBalance.toFixed(2)}
                    </span>
                  </div>

                  <div className="space-y-1.5 mt-3 text-xs text-slate-500">
                    <p className="flex items-center gap-1.5">
                      <Phone className="h-3.5 w-3.5 text-slate-400" />
                      {c.phone || 'No phone'}
                    </p>
                    <p className="flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5 text-slate-400" />
                      {c.address || 'Local customer'}
                    </p>
                    {c.notes && (
                      <p className="text-[11px] text-slate-400 italic pt-1">
                        &quot;{c.notes}&quot;
                      </p>
                    )}
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-[10px] text-slate-400">
                    Repaid: ₹{c.totalRepayment.toFixed(0)}
                  </span>
                  <Link
                    href={`/business/udhaar`}
                    className="inline-flex items-center gap-1 font-bold text-teal-700 hover:text-teal-800"
                  >
                    Open Ledger <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Add Modal */}
        {showAdd && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
            <div className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-xl border border-slate-200 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-slate-900">Add New Customer</h3>
                <button onClick={() => setShowAdd(false)} className="p-1 text-slate-400">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleCreate} className="space-y-3 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Customer Full Name *</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Ramesh Bhai"
                    className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-900"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Mobile Phone Number</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="e.g. 9823456789"
                    className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-900"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Address / Society</label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="e.g. Flat 204, Shreeji Apartments"
                    className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-900"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Opening Credit (₹) (Optional)</label>
                  <input
                    type="number"
                    min="0"
                    value={initialCredit}
                    onChange={(e) => setInitialCredit(Number(e.target.value))}
                    placeholder="0"
                    className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-900 font-bold"
                  />
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowAdd(false)}
                    className="px-4 py-2 rounded-xl text-slate-600 bg-slate-100 font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl text-white bg-teal-600 hover:bg-teal-700 font-bold"
                  >
                    Save Customer
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
