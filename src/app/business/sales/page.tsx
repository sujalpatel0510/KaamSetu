'use client';

import { toast } from '@/components/ui/Toast';
import React, { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import DashboardShell from '@/components/DashboardShell';
import PageHeader from '@/components/ui/PageHeader';
import Button from '@/components/ui/Button';
import Alert from '@/components/ui/Alert';
import EmptyState from '@/components/ui/EmptyState';
import { PaymentMethodBadge } from '@/components/ui/Badge';
import { formatDate } from '@/lib/date';
import {
  Store,
  Plus,
  Trash2,
  Receipt,
  Banknote,
  Smartphone,
  BookOpen,
} from 'lucide-react';
import { cn } from '@/lib/cn';

interface Product {
  id: string;
  name: string;
  category: string;
  sellingPrice: number;
  stockQuantity: number;
}

interface Customer {
  id: string;
  name: string;
  phone?: string | null;
}

interface CartItem {
  productId: string;
  name: string;
  unitPrice: number;
  quantity: number;
  maxStock: number;
}

interface CompletedSale {
  id: string;
  totalAmount: number;
  paymentMethod: string;
  paymentStatus: string;
  createdAt: string;
  customer?: { name: string } | null;
  items: {
    quantity: number;
    unitPrice: number;
    subtotal: number;
    product: { name: string };
  }[];
}

type PaymentMethod = 'CASH' | 'UPI' | 'CREDIT';

export default function BusinessSalesPage() {
  const { language } = useApp();
  const isHi = language === 'hi';
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [salesHistory, setSalesHistory] = useState<CompletedSale[]>([]);
  const [loading, setLoading] = useState(true);

  // Cart / Register state
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [selectedQuantity, setSelectedQuantity] = useState<number>(1);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CASH');
  const [selectedCustomerId, setSelectedCustomerId] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error';
    msg: string;
  } | null>(null);

  const fetchData = async () => {
    try {
      const [pRes, cRes, sRes] = await Promise.all([
        fetch('/api/business/inventory'),
        fetch('/api/business/customers'),
        fetch('/api/business/sales'),
      ]);

      const [pData, cData, sData] = await Promise.all([
        pRes.json(),
        cRes.json(),
        sRes.json(),
      ]);

      if (pData.products) setProducts(pData.products);
      if (cData.customers) setCustomers(cData.customers);
      if (sData.sales) setSalesHistory(sData.sales);
    } catch {
      console.error('Failed to load sales data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAddToCart = () => {
    if (!selectedProductId) return;
    const prod = products.find((p) => p.id === selectedProductId);
    if (!prod) return;

    if (prod.stockQuantity <= 0) {
      setFeedback({ type: 'error', msg: `"${prod.name}" is completely out of stock.` });
      return;
    }

    const existingIndex = cart.findIndex((item) => item.productId === selectedProductId);
    if (existingIndex > -1) {
      const existing = cart[existingIndex];
      const newQty = existing.quantity + selectedQuantity;
      if (newQty > prod.stockQuantity) {
        setFeedback({
          type: 'error',
          msg: `Cannot add more than available stock (${prod.stockQuantity}) for "${prod.name}".`,
        });
        return;
      }
      const updatedCart = [...cart];
      updatedCart[existingIndex].quantity = newQty;
      setCart(updatedCart);
    } else {
      if (selectedQuantity > prod.stockQuantity) {
        setFeedback({
          type: 'error',
          msg: `Cannot add more than available stock (${prod.stockQuantity}) for "${prod.name}".`,
        });
        return;
      }
      setCart([
        ...cart,
        {
          productId: prod.id,
          name: prod.name,
          unitPrice: Number(prod.sellingPrice),
          quantity: selectedQuantity,
          maxStock: prod.stockQuantity,
        },
      ]);
    }

    setSelectedProductId('');
    setSelectedQuantity(1);
    setFeedback(null);
  };

  const handleRemoveFromCart = (index: number) => {
    setCart(cart.filter((_, i) => i !== index));
  };

  const cartTotal = cart.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) return;

    if (paymentMethod === 'CREDIT' && !selectedCustomerId) {
      setFeedback({
        type: 'error',
        msg: 'Please select a customer for Udhaar (Credit) sales.',
      });
      return;
    }

    setSubmitting(true);
    setFeedback(null);

    try {
      const res = await fetch('/api/business/sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: selectedCustomerId || undefined,
          paymentMethod,
          items: cart.map((i) => ({ productId: i.productId, quantity: i.quantity })),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setFeedback({ type: 'error', msg: data.error || 'Sale failed' });
      } else {
        setFeedback({
          type: 'success',
          msg: `Sale #${data.sale.id.slice(0, 8)} recorded successfully! Stock deducted.`,
        });
        toast.success(`Sale of ₹${Number(data.sale.totalAmount).toLocaleString('en-IN')} recorded!`);
        setCart([]);
        setSelectedCustomerId('');
        await fetchData();
      }
    } catch {
      setFeedback({ type: 'error', msg: 'Network error completing sale' });
    } finally {
      setSubmitting(false);
    }
  };

  const paymentOptions: { value: PaymentMethod; label: string; icon: React.ElementType; activeClasses: string }[] = [
    {
      value: 'CASH',
      label: isHi ? 'नकद (Cash)' : 'Cash',
      icon: Banknote,
      activeClasses: 'border-green-500 bg-green-500/10 text-green-800 dark:text-green-300 ring-1 ring-green-500',
    },
    {
      value: 'UPI',
      label: isHi ? 'यूपीआई / ऑनलाइन' : 'UPI / QR',
      icon: Smartphone,
      activeClasses: 'border-brand-600 bg-brand-500/10 text-brand-700 dark:text-brand-300 ring-1 ring-brand-600',
    },
    {
      value: 'CREDIT',
      label: isHi ? 'उधार खाता (Udhaar)' : 'Udhaar (Credit)',
      icon: BookOpen,
      activeClasses: 'border-amber-500 bg-amber-500/10 text-amber-800 dark:text-amber-300 ring-1 ring-amber-500',
    },
  ];

  return (
    <DashboardShell role="BUSINESS_OWNER">
      <PageHeader
        title={isHi ? 'काउंटर बिक्री व पीओएस बिलिंग' : 'Counter Sales & POS Billing'}
        description={isHi ? 'स्टॉक से स्वचालित कटौती और बहीखाता लिंक के साथ त्वरित बिल बनाएं।' : 'Generate instant bills with automatic inventory stock deduction and Udhaar linking.'}
        icon={<Store className="h-6 w-6 text-accent" aria-hidden />}
      />

      {feedback && <Alert tone={feedback.type}>{feedback.msg}</Alert>}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Billing Register */}
        <div className="ks-card space-y-6 p-6 lg:col-span-7">
          <h2 className="text-base font-bold text-ink">
            Current Order & Item Selection
          </h2>

          {/* Product selection inputs */}
          <div className="grid grid-cols-1 gap-3 text-xs sm:grid-cols-12">
            <div className="sm:col-span-7">
              <label htmlFor="pos-product" className="ks-label">
                Select Item from Inventory
              </label>
              <select
                id="pos-product"
                value={selectedProductId}
                onChange={(e) => setSelectedProductId(e.target.value)}
                className="ks-select"
              >
                <option value="">-- Choose Product --</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id} disabled={p.stockQuantity <= 0}>
                    {p.name} — ₹{Number(p.sellingPrice).toFixed(0)} ({p.stockQuantity} in
                    stock)
                  </option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-3">
              <label htmlFor="pos-qty" className="ks-label">
                Qty
              </label>
              <input
                id="pos-qty"
                type="number"
                min="1"
                value={selectedQuantity}
                onChange={(e) => setSelectedQuantity(Math.max(1, Number(e.target.value)))}
                className="ks-input font-bold"
              />
            </div>

            <div className="flex items-end sm:col-span-2">
              <Button
                onClick={handleAddToCart}
                disabled={!selectedProductId}
                className="w-full"
              >
                <Plus className="h-4 w-4" aria-hidden />
                Add
              </Button>
            </div>
          </div>

          {/* Cart Table */}
          <div className="overflow-hidden rounded-2xl border border-line text-xs">
            <table className="ks-table">
              <thead>
                <tr>
                  <th scope="col">Item</th>
                  <th scope="col">Rate</th>
                  <th scope="col">Qty</th>
                  <th scope="col">Subtotal</th>
                  <th scope="col" className="text-right">
                    <span className="sr-only">Remove</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {cart.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-6 text-center text-muted">
                      No items added yet. Select a product above to start billing.
                    </td>
                  </tr>
                ) : (
                  cart.map((item, idx) => (
                    <tr key={idx}>
                      <td className="font-bold text-ink">{item.name}</td>
                      <td className="tabular-nums">₹{item.unitPrice.toFixed(2)}</td>
                      <td className="font-bold tabular-nums">{item.quantity}</td>
                      <td className="font-black text-ink tabular-nums">
                        ₹{(item.unitPrice * item.quantity).toFixed(2)}
                      </td>
                      <td className="text-right">
                        <button
                          onClick={() => handleRemoveFromCart(idx)}
                          className="rounded-lg p-1.5 text-red-500 dark:text-red-400 transition-colors hover:bg-red-500/10 hover:text-red-700 dark:text-red-300 dark:hover:text-red-300"
                          aria-label={`Remove ${item.name} from cart`}
                        >
                          <Trash2 className="h-4 w-4" aria-hidden />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Payment & Confirmation Box */}
          <form onSubmit={handleCheckout} className="space-y-4 border-t border-line pt-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-ink-soft">Calculated Bill Total</span>
              <span className="text-3xl font-black text-accent-strong tabular-nums">
                ₹{cartTotal.toFixed(2)}
              </span>
            </div>

            {/* Payment Method selector */}
            <div>
              <span className="ks-label">Select Payment Method</span>
              <div className="grid grid-cols-3 gap-2" role="group" aria-label="Payment method">
                {paymentOptions.map((opt) => {
                  const Icon = opt.icon;
                  const isActive = paymentMethod === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setPaymentMethod(opt.value)}
                      aria-pressed={isActive}
                      className={cn(
                        'flex flex-col items-center gap-1 rounded-xl border p-3 text-xs font-bold transition-all',
                        isActive
                          ? opt.activeClasses
                          : 'border-line bg-surface text-ink-soft hover:border-line-strong'
                      )}
                    >
                      <Icon className="h-4 w-4" aria-hidden />
                      <span>{opt.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Customer selection (mandatory for Udhaar) */}
            <div>
              <label htmlFor="pos-customer" className="ks-label">
                Customer {paymentMethod === 'CREDIT' ? '(Required for Udhaar)' : '(Optional)'}
              </label>
              <select
                id="pos-customer"
                required={paymentMethod === 'CREDIT'}
                value={selectedCustomerId}
                onChange={(e) => setSelectedCustomerId(e.target.value)}
                className="ks-select"
              >
                <option value="">-- Select Customer --</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} {c.phone ? `(${c.phone})` : ''}
                  </option>
                ))}
              </select>
            </div>

            <Button
              type="submit"
              loading={submitting}
              loadingText="Generating Bill…"
              disabled={cart.length === 0}
              size="lg"
              className="w-full"
            >
              Confirm Sale (₹{cartTotal.toFixed(2)})
            </Button>
          </form>
        </div>

        {/* Sales History Log */}
        <div className="ks-card space-y-4 p-6 lg:col-span-5">
          <h2 className="flex items-center gap-1.5 text-base font-bold text-ink">
            <Receipt className="h-4 w-4 text-accent" aria-hidden />
            Recent Completed Bills
          </h2>

          {loading ? (
            <p className="py-6 text-center text-xs text-muted">Loading sales history…</p>
          ) : salesHistory.length === 0 ? (
            <EmptyState
              icon={Receipt}
              title="No sales history yet"
              description="Completed bills with items and payment method will appear here."
              className="border-dashed border-line shadow-none"
            />
          ) : (
            <div className="max-h-[600px] divide-y divide-line overflow-y-auto">
              {salesHistory.map((s) => (
                <div key={s.id} className="space-y-1 py-3 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-ink">
                      {s.customer?.name || 'Walk-in Customer'}
                    </span>
                    <span className="font-black text-ink tabular-nums">
                      ₹{Number(s.totalAmount).toFixed(2)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-muted">
                    <span>
                      {formatDate(s.createdAt)} at{' '}
                      {new Date(s.createdAt).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                    <PaymentMethodBadge method={s.paymentMethod} />
                  </div>

                  <div className="flex flex-wrap gap-1.5 pt-0.5 text-[11px] text-muted">
                    {s.items.map((it, idx) => (
                      <span
                        key={idx}
                        className="rounded-md bg-subtle px-1.5 py-0.5"
                      >
                        {it.product.name} ×{it.quantity}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardShell>
  );
}
