'use client';

import React, { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import {
  Store,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Receipt,
  User,
  CreditCard,
  Banknote,
  Smartphone,
  BookOpen,
} from 'lucide-react';

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

export default function BusinessSalesPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [salesHistory, setSalesHistory] = useState<CompletedSale[]>([]);
  const [loading, setLoading] = useState(true);

  // Cart / Register state
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [selectedQuantity, setSelectedQuantity] = useState<number>(1);
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'UPI' | 'CREDIT'>('CASH');
  const [selectedCustomerId, setSelectedCustomerId] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

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

  return (
    <div className="flex flex-col lg:flex-row min-h-[calc(100vh-4rem)] bg-slate-50">
      <Sidebar role="BUSINESS_OWNER" />

      <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl">
        <div>
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
            <Store className="h-6 w-6 text-teal-600" />
            Counter Sales & POS Billing
          </h1>
          <p className="text-xs text-slate-500">
            Generate instant bills with automatic inventory stock deduction and Udhaar linking.
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

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Billing Register (7 cols) */}
          <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-200 shadow-xs p-6 space-y-6">
            <h2 className="text-base font-bold text-slate-900">Current Order & Item Selection</h2>

            {/* Product selection inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 text-xs">
              <div className="sm:col-span-7">
                <label className="block font-bold text-slate-700 mb-1">Select Item from Inventory</label>
                <select
                  value={selectedProductId}
                  onChange={(e) => setSelectedProductId(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-900 bg-white"
                >
                  <option value="">-- Choose Product --</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id} disabled={p.stockQuantity <= 0}>
                      {p.name} — ₹{Number(p.sellingPrice).toFixed(0)} ({p.stockQuantity} in stock)
                    </option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-3">
                <label className="block font-bold text-slate-700 mb-1">Qty</label>
                <input
                  type="number"
                  min="1"
                  value={selectedQuantity}
                  onChange={(e) => setSelectedQuantity(Math.max(1, Number(e.target.value)))}
                  className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-900 font-bold"
                />
              </div>

              <div className="sm:col-span-2 flex items-end">
                <button
                  type="button"
                  onClick={handleAddToCart}
                  disabled={!selectedProductId}
                  className="w-full py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white font-bold text-xs"
                >
                  Add
                </button>
              </div>
            </div>

            {/* Cart Table */}
            <div className="border border-slate-200 rounded-2xl overflow-hidden text-xs">
              <table className="w-full text-left">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase">
                  <tr>
                    <th className="px-4 py-2.5">Item</th>
                    <th className="px-4 py-2.5">Rate</th>
                    <th className="px-4 py-2.5">Qty</th>
                    <th className="px-4 py-2.5">Subtotal</th>
                    <th className="px-4 py-2.5 text-right"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {cart.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-6 text-center text-slate-400">
                        No items added yet. Select a product above to start billing.
                      </td>
                    </tr>
                  ) : (
                    cart.map((item, idx) => (
                      <tr key={idx}>
                        <td className="px-4 py-3 font-bold text-slate-900">{item.name}</td>
                        <td className="px-4 py-3">₹{item.unitPrice.toFixed(2)}</td>
                        <td className="px-4 py-3 font-bold">{item.quantity}</td>
                        <td className="px-4 py-3 font-black text-slate-900">
                          ₹{(item.unitPrice * item.quantity).toFixed(2)}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() => handleRemoveFromCart(idx)}
                            className="text-red-500 hover:text-red-700 p-1"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Payment & Confirmation Box */}
            <form onSubmit={handleCheckout} className="space-y-4 pt-4 border-t border-slate-100">
              <div className="flex items-center justify-between text-base">
                <span className="font-bold text-slate-700">Calculated Bill Total:</span>
                <span className="text-3xl font-black text-teal-700">
                  ₹{cartTotal.toFixed(2)}
                </span>
              </div>

              {/* Payment Method selector */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">
                  Select Payment Method:
                </label>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('CASH')}
                    className={`p-3 rounded-xl border font-bold flex flex-col items-center gap-1 transition-all ${
                      paymentMethod === 'CASH'
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-400 shadow-xs'
                        : 'bg-white text-slate-600 border-slate-200'
                    }`}
                  >
                    <Banknote className="h-4 w-4" />
                    <span>Cash (રોકડ)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('UPI')}
                    className={`p-3 rounded-xl border font-bold flex flex-col items-center gap-1 transition-all ${
                      paymentMethod === 'UPI'
                        ? 'bg-blue-50 text-blue-800 border-blue-400 shadow-xs'
                        : 'bg-white text-slate-600 border-slate-200'
                    }`}
                  >
                    <Smartphone className="h-4 w-4" />
                    <span>UPI / QR</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('CREDIT')}
                    className={`p-3 rounded-xl border font-bold flex flex-col items-center gap-1 transition-all ${
                      paymentMethod === 'CREDIT'
                        ? 'bg-amber-50 text-amber-800 border-amber-400 shadow-xs'
                        : 'bg-white text-slate-600 border-slate-200'
                    }`}
                  >
                    <BookOpen className="h-4 w-4" />
                    <span>Udhaar (ઉધાર)</span>
                  </button>
                </div>
              </div>

              {/* Customer selection (Mandatory for Udhaar, optional for cash/upi) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Customer {paymentMethod === 'CREDIT' ? '(Required for Udhaar)' : '(Optional)'}
                </label>
                <select
                  required={paymentMethod === 'CREDIT'}
                  value={selectedCustomerId}
                  onChange={(e) => setSelectedCustomerId(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-900 bg-white"
                >
                  <option value="">-- Select Customer --</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} {c.phone ? `(${c.phone})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                disabled={submitting || cart.length === 0}
                className="w-full py-3.5 rounded-xl bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white font-bold text-sm shadow-md transition-all active:scale-98"
              >
                {submitting ? 'Generating Bill...' : `Confirm Sale (₹${cartTotal.toFixed(2)})`}
              </button>
            </form>
          </div>

          {/* Sales History Log (5 cols) */}
          <div className="lg:col-span-5 bg-white rounded-3xl border border-slate-200 shadow-xs p-6 space-y-4">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-1.5">
              <Receipt className="h-4 w-4 text-teal-600" />
              Recent Completed Bills
            </h2>

            {salesHistory.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">No sales history yet.</p>
            ) : (
              <div className="divide-y divide-slate-100 max-h-[600px] overflow-y-auto">
                {salesHistory.map((s) => (
                  <div key={s.id} className="py-3 text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900">
                        {s.customer?.name || 'Walk-in Customer'}
                      </span>
                      <span className="font-black text-slate-900">
                        ₹{Number(s.totalAmount).toFixed(2)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                      <span>
                        {new Date(s.createdAt).toLocaleDateString()} at{' '}
                        {new Date(s.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <span
                        className={`font-bold px-1.5 py-0.5 rounded-md ${
                          s.paymentMethod === 'CREDIT'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {s.paymentMethod}
                      </span>
                    </div>

                    <div className="text-[11px] text-slate-500 pt-0.5">
                      {s.items.map((it, idx) => (
                        <span key={idx} className="mr-2">
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
      </main>
    </div>
  );
}
