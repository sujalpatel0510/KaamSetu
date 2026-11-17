'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useApp } from '@/context/AppContext';
import DashboardShell from '@/components/DashboardShell';
import PageHeader from '@/components/ui/PageHeader';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import { toast } from '@/components/ui/Toast';
import EmptyState from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import {
  Users,
  Plus,
  Search,
  Phone,
  MapPin,
  ArrowRight,
  BookOpen,
} from 'lucide-react';
import { cn } from '@/lib/cn';

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
  const { t, language } = useApp();
  const isHi = language === 'hi';
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
  const [creating, setCreating] = useState(false);

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
    const timer = window.setTimeout(() => {
      fetchCustomers();
    }, 250);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
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

      const data = await res.json();
      if (res.ok) {
        toast.success(isHi ? `ग्राहक "${name}" सफलतापूर्वक जोड़ा गया!` : `Customer "${name}" saved successfully!`);
        setShowAdd(false);
        setName('');
        setPhone('');
        setAddress('');
        setNotes('');
        setInitialCredit('');
        fetchCustomers();
      } else {
        toast.error(data.error || 'Failed to save customer');
      }
    } catch {
      toast.error('Failed to add customer');
      console.error('Failed to add customer');
    } finally {
      setCreating(false);
    }
  };

  const totalOutstanding = customers.reduce((s, c) => s + c.outstandingBalance, 0);

  return (
    <DashboardShell role="BUSINESS_OWNER">
      <PageHeader
        title={isHi ? 'ग्राहक खाते व संपर्क सूची' : 'Customer Accounts & Contacts'}
        description={isHi ? 'नियमित ग्राहकों के संपर्क विवरण और उनकी बकाया उधार राशि का प्रबंधन करें।' : 'Manage regular shop patrons, contact details, and their active credit balances.'}
        actions={
          <Button onClick={() => setShowAdd(true)}>
            <Plus className="h-4 w-4" aria-hidden />
            {t.addCustomer}
          </Button>
        }
      />

      {/* Summary strip */}
      <div className="grid grid-cols-2 gap-4">
        <div className="ks-card flex items-center justify-between p-4">
          <div>
            <p className="text-[11px] font-bold tracking-wider text-muted uppercase">
              Total Customers
            </p>
            <p className="mt-1 text-2xl font-black text-ink tabular-nums">
              {loading ? '—' : customers.length}
            </p>
          </div>
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-accent ring-1 ring-brand-100 ring-inset">
            <Users className="h-5 w-5" aria-hidden />
          </div>
        </div>
        <div className="ks-card flex items-center justify-between p-4">
          <div>
            <p className="text-[11px] font-bold tracking-wider text-muted uppercase">
              Outstanding Udhaar
            </p>
            <p className="mt-1 text-2xl font-black text-amber-700 dark:text-amber-300 tabular-nums">
              {loading ? '—' : `₹${totalOutstanding.toLocaleString('en-IN')}`}
            </p>
          </div>
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 ring-1 ring-amber-500/20 ring-inset">
            <BookOpen className="h-5 w-5" aria-hidden />
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="ks-card p-4">
        <div className="relative">
          <Search
            className="pointer-events-none absolute top-3 left-3.5 h-4 w-4 text-muted"
            aria-hidden
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by customer name or phone…"
            aria-label="Search customers"
            className="ks-input pl-10"
          />
        </div>
      </div>

      {/* Customer Cards Grid */}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
        {loading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-48 rounded-2xl" />
          ))
        ) : customers.length === 0 ? (
          <div className="col-span-full">
            <EmptyState
              icon={Users}
              title="No customers found"
              description='Add your first customer to start tracking accounts and Udhaar balances.'
              action={
                <Button size="sm" onClick={() => setShowAdd(true)}>
                  <Plus className="h-4 w-4" aria-hidden />
                  Add New Customer
                </Button>
              }
              className="border-dashed"
            />
          </div>
        ) : (
          customers.map((c) => (
            <div
              key={c.id}
              className="ks-card ks-card-hover flex flex-col justify-between p-6"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-brand-700 text-xs font-bold text-white">
                      {c.name.charAt(0).toUpperCase()}
                    </div>
                    <h2 className="truncate text-base font-bold text-ink">
                      {c.name}
                    </h2>
                  </div>
                  <span
                    className={cn(
                      'ks-badge shrink-0 tabular-nums',
                      c.outstandingBalance > 0
                        ? 'bg-amber-500/15 text-amber-800 dark:text-amber-300'
                        : 'bg-green-500/15 text-green-800 dark:text-green-300'
                    )}
                  >
                    ₹{c.outstandingBalance.toFixed(2)}
                  </span>
                </div>

                <div className="mt-3 space-y-1.5 text-xs text-muted">
                  <p className="flex items-center gap-1.5">
                    <Phone className="h-3.5 w-3.5 shrink-0 text-muted" aria-hidden />
                    {c.phone || 'No phone'}
                  </p>
                  <p className="flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5 shrink-0 text-muted" aria-hidden />
                    <span className="truncate">{c.address || 'Local customer'}</span>
                  </p>
                  {c.notes && (
                    <p className="pt-1 text-[11px] text-muted italic">
                      &ldquo;{c.notes}&rdquo;
                    </p>
                  )}
                </div>
              </div>

              <div className="mt-6 flex items-center justify-between border-t border-line pt-4 text-xs">
                <span className="text-[10px] text-muted">
                  Repaid: ₹{c.totalRepayment.toFixed(0)}
                </span>
                <Link
                  href="/business/udhaar"
                  className="inline-flex items-center gap-1 font-bold text-accent-strong transition-colors hover:text-accent-strong"
                >
                  Open Ledger <ArrowRight className="h-3.5 w-3.5" aria-hidden />
                </Link>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add Modal */}
      <Modal
        open={showAdd}
        onClose={() => setShowAdd(false)}
        title="Add New Customer"
        className="max-w-sm"
      >
        <form onSubmit={handleCreate} className="space-y-3 text-xs">
          <div>
            <label htmlFor="cust-name" className="ks-label">
              Customer Full Name *
            </label>
            <input
              id="cust-name"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Ramesh Bhai"
              className="ks-input"
            />
          </div>

          <div>
            <label htmlFor="cust-phone" className="ks-label">
              Mobile Phone Number
            </label>
            <input
              id="cust-phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="e.g. 9823456789"
              className="ks-input"
            />
          </div>

          <div>
            <label htmlFor="cust-address" className="ks-label">
              Address / Society
            </label>
            <input
              id="cust-address"
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="e.g. Flat 204, Shreeji Apartments"
              className="ks-input"
            />
          </div>

          <div>
            <label htmlFor="cust-notes" className="ks-label">
              Notes (Optional)
            </label>
            <input
              id="cust-notes"
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Prefers evening deliveries"
              className="ks-input"
            />
          </div>

          <div>
            <label htmlFor="cust-credit" className="ks-label">
              Opening Credit (₹) (Optional)
            </label>
            <input
              id="cust-credit"
              type="number"
              min="0"
              value={initialCredit}
              onChange={(e) => setInitialCredit(Number(e.target.value))}
              placeholder="0"
              className="ks-input font-bold"
            />
          </div>

          <div className="flex justify-end gap-2 border-t border-line pt-4">
            <Button variant="secondary" size="sm" onClick={() => setShowAdd(false)}>
              Cancel
            </Button>
            <Button type="submit" size="sm" loading={creating} loadingText="Saving…">
              Save Customer
            </Button>
          </div>
        </form>
      </Modal>
    </DashboardShell>
  );
}
