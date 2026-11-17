'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import DashboardShell from '@/components/DashboardShell';
import PageHeader from '@/components/ui/PageHeader';
import EmptyState from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import { toast } from '@/components/ui/Toast';
import { formatDate } from '@/lib/date';
import { Truck, Plus, Phone, MapPin, User, X, Package } from 'lucide-react';

interface SupplierItem {
  id: string;
  name: string;
  phone: string;
  contactPerson?: string | null;
  address?: string | null;
  notes?: string | null;
  createdAt: string;
  _count: { purchases: number };
}

export default function BusinessSuppliersPage() {
  const { user, t, language } = useApp();
  const [suppliers, setSuppliers] = useState<SupplierItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchSuppliers = async () => {
    try {
      const res = await fetch('/api/business/suppliers');
      const data = await res.json();
      if (data.suppliers) setSuppliers(data.suppliers);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role === 'BUSINESS_OWNER') {
      fetchSuppliers();
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage('');
    try {
      const res = await fetch('/api/business/suppliers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, phone, contactPerson, address, notes }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(language === 'hi' ? 'सप्लायर सफलतापूर्वक जोड़ा गया!' : 'Supplier added successfully!');
        setMessage('Supplier added successfully!');
        setModalOpen(false);
        setName('');
        setPhone('');
        setContactPerson('');
        setAddress('');
        setNotes('');
        fetchSuppliers();
      } else {
        toast.error(data.error || 'Failed to add supplier');
        setMessage(data.error || 'Failed to add supplier');
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
          title={t.suppliers}
          subtitle={
            language === 'hi'
              ? 'थोक व्यापारी, डिस्ट्रीब्यूटर और सप्लायर संपर्क डायरेक्टरी'
              : 'Maintain wholesale vendors, distributor contacts, and purchase origins'
          }
        />
        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="ks-btn ks-btn-primary ks-btn-md flex items-center gap-1.5 shrink-0"
        >
          <Plus className="h-4 w-4" />
          <span>Add New Supplier</span>
        </button>
      </div>

      {message && (
        <div className="rounded-xl border border-line bg-subtle p-4 text-xs font-semibold text-ink">
          {message}
        </div>
      )}

      {/* Supplier Grid */}
      <div className="space-y-4">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-40 rounded-2xl" />
            ))}
          </div>
        ) : suppliers.length === 0 ? (
          <EmptyState
            icon={Truck}
            title="No Suppliers Added Yet"
            description="Add your wholesale dealers and stockists to track purchases and restock inventory efficiently."
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {suppliers.map((s) => (
              <div key={s.id} className="ks-card p-5 space-y-3 flex flex-col justify-between">
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-bold text-ink text-base">{s.name}</h3>
                    <span className="rounded-md bg-subtle px-2 py-0.5 text-[10px] font-bold text-muted">
                      {s._count.purchases} Orders
                    </span>
                  </div>

                  <div className="space-y-1.5 text-xs text-muted mt-2">
                    <p className="flex items-center gap-2">
                      <Phone className="h-3.5 w-3.5 text-accent" />
                      <a href={`tel:${s.phone}`} className="font-semibold text-ink hover:underline">
                        {s.phone}
                      </a>
                    </p>
                    {s.contactPerson && (
                      <p className="flex items-center gap-2">
                        <User className="h-3.5 w-3.5" />
                        <span>Contact: {s.contactPerson}</span>
                      </p>
                    )}
                    {s.address && (
                      <p className="flex items-center gap-2">
                        <MapPin className="h-3.5 w-3.5" />
                        <span>{s.address}</span>
                      </p>
                    )}
                  </div>
                </div>

                <div className="border-t border-line pt-2.5 text-[11px] text-muted flex items-center justify-between">
                  <span>Added {formatDate(s.createdAt)}</span>
                  <a
                    href={`tel:${s.phone}`}
                    className="font-bold text-accent hover:underline flex items-center gap-1"
                  >
                    Call Vendor →
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Supplier Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="ks-card w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-line pb-3">
              <h3 className="text-base font-bold text-ink flex items-center gap-2">
                <Truck className="h-5 w-5 text-accent" />
                <span>Add Supplier / Vendor</span>
              </h3>
              <button type="button" onClick={() => setModalOpen(false)} className="text-muted hover:text-ink">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-ink-soft mb-1.5">Supplier / Company Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Mahavir Grain Traders"
                  className="ks-input"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-ink-soft mb-1.5">Phone Number</label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. 9825012345"
                  className="ks-input"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-ink-soft mb-1.5">Contact Person (Optional)</label>
                <input
                  type="text"
                  value={contactPerson}
                  onChange={(e) => setContactPerson(e.target.value)}
                  placeholder="e.g. Ramesh Bhai (Wholesaler)"
                  className="ks-input"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-ink-soft mb-1.5">Address / Market Yard (Optional)</label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="e.g. APMC Market, Yard No. 4, Ahmedabad"
                  className="ks-input"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-ink-soft mb-1.5">Notes (Optional)</label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Delivers every Tuesday"
                  className="ks-input"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setModalOpen(false)} className="ks-btn ks-btn-outline ks-btn-sm">
                  {t.cancel}
                </button>
                <button type="submit" disabled={submitting} className="ks-btn ks-btn-primary ks-btn-sm">
                  {submitting ? 'Saving...' : 'Save Supplier'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardShell>
  );
}
