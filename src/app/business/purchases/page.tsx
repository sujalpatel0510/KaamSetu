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
import { Package, Plus, Truck, X, ArrowUpRight, CheckCircle2, TrendingUp } from 'lucide-react';

interface ProductItem {
  id: string;
  name: string;
  category: string;
  sellingPrice: number;
  costPrice?: number | null;
  stockQuantity: number;
}

interface SupplierItem {
  id: string;
  name: string;
}

interface PurchaseItemRecord {
  id: string;
  totalAmount: number;
  paymentStatus: string;
  purchaseDate: string;
  notes?: string | null;
  supplier?: { name: string } | null;
  items: Array<{
    id: string;
    quantity: number;
    unitCost: number;
    subtotal: number;
    product: { name: string; category: string };
  }>;
}

export default function BusinessPurchasesPage() {
  const { user, t, language } = useApp();
  const [purchases, setPurchases] = useState<PurchaseItemRecord[]>([]);
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [suppliers, setSuppliers] = useState<SupplierItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  // Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [supplierId, setSupplierId] = useState('');
  const [selectedProductId, setSelectedProductId] = useState('');
  const [quantity, setQuantity] = useState(10);
  const [unitCost, setUnitCost] = useState(50);
  const [paymentStatus, setPaymentStatus] = useState('PAID');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchData = async () => {
    try {
      const [purRes, prodRes, supRes] = await Promise.all([
        fetch('/api/business/purchases'),
        fetch('/api/business/inventory'),
        fetch('/api/business/suppliers'),
      ]);
      const [purData, prodData, supData] = await Promise.all([
        purRes.json(),
        prodRes.json(),
        supRes.json(),
      ]);

      if (purData.purchases) setPurchases(purData.purchases);
      if (prodData.products) {
        setProducts(prodData.products);
        if (prodData.products.length > 0) {
          setSelectedProductId(prodData.products[0].id);
          setUnitCost(Number(prodData.products[0].costPrice || prodData.products[0].sellingPrice * 0.7));
        }
      }
      if (supData.suppliers) setSuppliers(supData.suppliers);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role === 'BUSINESS_OWNER') {
      fetchData();
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage('');
    try {
      const res = await fetch('/api/business/purchases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          supplierId: supplierId || undefined,
          paymentStatus,
          notes,
          items: [
            {
              productId: selectedProductId,
              quantity: Number(quantity),
              unitCost: Number(unitCost),
            },
          ],
        }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(language === 'hi' ? 'खरीद प्रविष्टि सफलतापूर्वक दर्ज की गई!' : 'Stock received and inventory increased atomically!');
        setMessage('Stock received and inventory increased atomically!');
        setModalOpen(false);
        setNotes('');
        fetchData();
      } else {
        toast.error(data.error || 'Failed to record purchase');
        setMessage(data.error || 'Failed to record purchase');
      }
    } catch (e: any) {
      toast.error(e.message || 'Network error');
      setMessage(e.message || 'Network error');
    } finally {
      setSubmitting(false);
    }
  };

  const totalSpent = purchases.reduce((acc, p) => acc + Number(p.totalAmount), 0);
  const totalUnitsReceived = purchases.reduce(
    (acc, p) => acc + p.items.reduce((s, item) => s + item.quantity, 0),
    0
  );

  return (
    <DashboardShell role="BUSINESS_OWNER">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <PageHeader
          title={t.purchases}
          subtitle={
            language === 'hi'
              ? 'थोक माल की खरीद दर्ज करें और स्टॉक में स्वतः सुरक्षित वृद्धि करें'
              : 'Record wholesale stock receipts, vendor invoices, and atomically increment catalog stock'
          }
        />
        {products.length > 0 && (
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="ks-btn ks-btn-primary ks-btn-md flex items-center gap-1.5 shrink-0"
          >
            <Plus className="h-4 w-4" />
            <span>Receive New Stock</span>
          </button>
        )}
      </div>

      {message && (
        <div className="rounded-xl border border-line bg-subtle p-4 text-xs font-semibold text-ink">
          {message}
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard icon={TrendingUp} label="Total Purchase Volume" value={`₹${totalSpent.toLocaleString('en-IN')}`} tone="brand" />
        <StatCard icon={Package} label="Total Units Received" value={totalUnitsReceived} tone="emerald" />
        <StatCard icon={Truck} label="Purchase Invoices" value={purchases.length} tone="amber" />
      </div>

      {/* Purchase List */}
      <div className="space-y-4">
        {loading ? (
          <Skeleton className="h-44 rounded-2xl" />
        ) : purchases.length === 0 ? (
          <EmptyState
            icon={Package}
            title="No Purchases Recorded"
            description="When you restock products from your suppliers, record the invoice here to update inventory stock atomically."
          />
        ) : (
          purchases.map((p) => (
            <div key={p.id} className="ks-card p-5 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-line pb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-ink text-sm">
                      Invoice #{p.id.slice(0, 8).toUpperCase()}
                    </span>
                    <span className="rounded-md bg-green-100 text-green-800 px-2 py-0.5 text-[10px] font-bold">
                      {p.paymentStatus}
                    </span>
                  </div>
                  <p className="text-xs text-muted mt-0.5">
                    Supplier: <strong>{p.supplier?.name || 'Local Cash Market'}</strong> • Date: {formatDate(p.purchaseDate)}
                  </p>
                </div>

                <div className="text-base font-black text-ink">
                  ₹{Number(p.totalAmount).toLocaleString('en-IN')}
                </div>
              </div>

              {/* Items List */}
              <div className="divide-y divide-line text-xs">
                {p.items.map((item) => (
                  <div key={item.id} className="py-2 flex items-center justify-between">
                    <div>
                      <span className="font-bold text-ink">{item.product.name}</span>
                      <span className="text-muted ml-2">({item.product.category})</span>
                    </div>
                    <div className="text-right">
                      <span className="font-semibold text-ink-soft">
                        {item.quantity} units @ ₹{Number(item.unitCost).toFixed(2)}
                      </span>
                      <span className="font-bold text-ink ml-3">
                        = ₹{Number(item.subtotal).toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Receive Stock Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="ks-card w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-line pb-3">
              <h3 className="text-base font-bold text-ink flex items-center gap-2">
                <Package className="h-5 w-5 text-accent" />
                <span>Receive Product Stock</span>
              </h3>
              <button type="button" onClick={() => setModalOpen(false)} className="text-muted hover:text-ink">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-ink-soft mb-1.5">Select Product to Restock</label>
                <select
                  value={selectedProductId}
                  onChange={(e) => {
                    setSelectedProductId(e.target.value);
                    const prod = products.find((p) => p.id === e.target.value);
                    if (prod) {
                      setUnitCost(Number(prod.costPrice || prod.sellingPrice * 0.7));
                    }
                  }}
                  className="ks-input"
                >
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} (Current Stock: {p.stockQuantity})
                    </option>
                  ))}
                </select>
              </div>

              {suppliers.length > 0 && (
                <div>
                  <label className="block text-xs font-bold text-ink-soft mb-1.5">Supplier / Vendor (Optional)</label>
                  <select
                    value={supplierId}
                    onChange={(e) => setSupplierId(e.target.value)}
                    className="ks-input"
                  >
                    <option value="">Direct Cash Purchase / Local Mandi</option>
                    {suppliers.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-ink-soft mb-1.5">Quantity Received</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={quantity}
                    onChange={(e) => setQuantity(Number(e.target.value))}
                    className="ks-input font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-ink-soft mb-1.5">Unit Purchase Cost (₹)</label>
                  <input
                    type="number"
                    required
                    min={0.1}
                    step="0.5"
                    value={unitCost}
                    onChange={(e) => setUnitCost(Number(e.target.value))}
                    className="ks-input font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-ink-soft mb-1.5">Payment Status</label>
                <select
                  value={paymentStatus}
                  onChange={(e) => setPaymentStatus(e.target.value)}
                  className="ks-input"
                >
                  <option value="PAID">Paid in Full</option>
                  <option value="PARTIALLY_PAID">Partially Paid</option>
                  <option value="UNPAID">Unpaid / Vendor Credit</option>
                </select>
              </div>

              <div className="rounded-lg bg-subtle p-3 text-xs flex justify-between font-bold">
                <span>Total Purchase Cost:</span>
                <span className="text-accent-strong text-sm">₹{(quantity * unitCost).toFixed(2)}</span>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setModalOpen(false)} className="ks-btn ks-btn-outline ks-btn-sm">
                  {t.cancel}
                </button>
                <button type="submit" disabled={submitting} className="ks-btn ks-btn-primary ks-btn-sm">
                  {submitting ? 'Updating...' : 'Confirm Stock Receipt'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardShell>
  );
}
