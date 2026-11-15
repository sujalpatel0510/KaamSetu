'use client';

import React, { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import {
  Package,
  Plus,
  Search,
  Filter,
  AlertTriangle,
  Edit2,
  Trash2,
  X,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

interface Product {
  id: string;
  name: string;
  category: string;
  sku?: string | null;
  sellingPrice: number;
  costPrice?: number | null;
  stockQuantity: number;
  lowStockThreshold: number;
}

export default function BusinessInventoryPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [lowStockOnly, setLowStockOnly] = useState(false);

  // Add Product Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newCategory, setNewCategory] = useState('Grocery');
  const [newSku, setNewSku] = useState('');
  const [newSellingPrice, setNewSellingPrice] = useState<number | ''>('');
  const [newCostPrice, setNewCostPrice] = useState<number | ''>('');
  const [newStock, setNewStock] = useState<number | ''>(10);
  const [newThreshold, setNewThreshold] = useState<number | ''>(5);

  // Edit Stock Modal
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editStockQty, setEditStockQty] = useState<number>(0);
  const [editPrice, setEditPrice] = useState<number>(0);

  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  const fetchInventory = async () => {
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (category !== 'All') params.append('category', category);
      if (lowStockOnly) params.append('lowStockOnly', 'true');

      const res = await fetch(`/api/business/inventory?${params.toString()}`);
      const data = await res.json();
      if (data.products) setProducts(data.products);
    } catch {
      console.error('Failed to load inventory');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category, lowStockOnly]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchInventory();
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    try {
      const res = await fetch('/api/business/inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newName,
          category: newCategory,
          sku: newSku || undefined,
          sellingPrice: Number(newSellingPrice),
          costPrice: newCostPrice ? Number(newCostPrice) : undefined,
          stockQuantity: Number(newStock),
          lowStockThreshold: Number(newThreshold),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setFeedback({ type: 'error', msg: data.error || 'Failed to add product' });
      } else {
        setFeedback({ type: 'success', msg: `Added "${newName}" to inventory!` });
        setShowAddModal(false);
        setNewName('');
        setNewSku('');
        setNewSellingPrice('');
        setNewCostPrice('');
        fetchInventory();
      }
    } catch {
      setFeedback({ type: 'error', msg: 'Network error adding product' });
    }
  };

  const handleUpdateStock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;

    try {
      const res = await fetch(`/api/business/inventory/${editingProduct.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stockQuantity: editStockQty,
          sellingPrice: editPrice,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setFeedback({ type: 'error', msg: data.error || 'Failed to update stock' });
      } else {
        setFeedback({ type: 'success', msg: `Stock updated for ${editingProduct.name}!` });
        setEditingProduct(null);
        fetchInventory();
      }
    } catch {
      setFeedback({ type: 'error', msg: 'Network error updating stock' });
    }
  };

  const handleDeleteProduct = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to remove "${name}" from inventory?`)) return;

    try {
      const res = await fetch(`/api/business/inventory/${id}`, { method: 'DELETE' });
      const data = await res.json();
      setFeedback({ type: 'success', msg: data.message || 'Product removed.' });
      fetchInventory();
    } catch {
      setFeedback({ type: 'error', msg: 'Failed to remove product' });
    }
  };

  return (
    <div className="flex flex-col lg:flex-row min-h-[calc(100vh-4rem)] bg-slate-50">
      <Sidebar role="BUSINESS_OWNER" />

      <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-900">Inventory & Stock Management</h1>
            <p className="text-xs text-slate-500">
              Track item quantities, set low-stock thresholds, and manage prices in real time.
            </p>
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-md transition-colors shrink-0"
          >
            <Plus className="h-4 w-4" />
            Add New Product
          </button>
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

        {/* Search & Filter Bar */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
          <form onSubmit={handleSearch} className="relative flex-1 w-full">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search product name or SKU..."
              className="w-full rounded-xl border border-slate-300 pl-9 pr-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </form>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="rounded-xl border border-slate-300 p-2 text-xs text-slate-800 bg-white"
            >
              <option value="All">All Categories</option>
              <option value="Grains & Rice">Grains & Rice</option>
              <option value="Edible Oils">Edible Oils</option>
              <option value="Dairy">Dairy</option>
              <option value="Beverages">Beverages</option>
              <option value="Hot Drinks">Hot Drinks</option>
              <option value="Snacks">Snacks</option>
              <option value="Hardware">Hardware</option>
            </select>

            <button
              onClick={() => setLowStockOnly(!lowStockOnly)}
              className={`px-3 py-2 rounded-xl text-xs font-bold border transition-colors shrink-0 ${
                lowStockOnly
                  ? 'bg-amber-100 text-amber-800 border-amber-300'
                  : 'bg-slate-100 text-slate-600 border-slate-200'
              }`}
            >
              Low Stock Only
            </button>
          </div>
        </div>

        {/* Product Table */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-3.5">Product Name</th>
                  <th className="px-6 py-3.5">Category</th>
                  <th className="px-6 py-3.5">Selling Price</th>
                  <th className="px-6 py-3.5">Stock Status</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-slate-400">
                      Loading inventory items...
                    </td>
                  </tr>
                ) : products.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-slate-400">
                      No products found. Click &quot;Add New Product&quot; to populate your store.
                    </td>
                  </tr>
                ) : (
                  products.map((p) => {
                    const isLow = p.stockQuantity <= p.lowStockThreshold;
                    return (
                      <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="px-6 py-4">
                          <p className="font-bold text-slate-900">{p.name}</p>
                          {p.sku && <p className="text-[10px] text-slate-400">SKU: {p.sku}</p>}
                        </td>
                        <td className="px-6 py-4 text-slate-600">{p.category}</td>
                        <td className="px-6 py-4 font-black text-slate-900">
                          ₹{Number(p.sellingPrice).toFixed(2)}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <span
                              className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${
                                isLow
                                  ? 'bg-red-100 text-red-800 border border-red-200'
                                  : 'bg-emerald-100 text-emerald-800'
                              }`}
                            >
                              {p.stockQuantity} units left
                            </span>
                            {isLow && (
                              <span className="text-[10px] text-amber-700 font-medium flex items-center gap-0.5">
                                <AlertTriangle className="h-3 w-3" />
                                Low Stock
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right space-x-2">
                          <button
                            onClick={() => {
                              setEditingProduct(p);
                              setEditStockQty(p.stockQuantity);
                              setEditPrice(Number(p.sellingPrice));
                            }}
                            className="p-1.5 rounded-lg text-teal-700 hover:bg-teal-50 transition-colors"
                            title="Edit Stock"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteProduct(p.id, p.name)}
                            className="p-1.5 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
                            title="Remove Product"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Add Product Modal */}
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
            <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-xl border border-slate-200 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-slate-900">Add New Product</h3>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded-full"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleAddProduct} className="space-y-3 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Product Name *</label>
                  <input
                    type="text"
                    required
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="e.g. Fortune Sunflower Oil 1L"
                    className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-900"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Category *</label>
                    <input
                      type="text"
                      required
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value)}
                      placeholder="e.g. Grains, Dairy"
                      className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">SKU (Optional)</label>
                    <input
                      type="text"
                      value={newSku}
                      onChange={(e) => setNewSku(e.target.value)}
                      placeholder="OIL-SUN-1L"
                      className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-900"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Selling Price (₹) *</label>
                    <input
                      type="number"
                      step="0.5"
                      min="1"
                      required
                      value={newSellingPrice}
                      onChange={(e) => setNewSellingPrice(Number(e.target.value))}
                      placeholder="145"
                      className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Cost Price (₹)</label>
                    <input
                      type="number"
                      step="0.5"
                      min="1"
                      value={newCostPrice}
                      onChange={(e) => setNewCostPrice(Number(e.target.value))}
                      placeholder="120"
                      className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-900"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Initial Stock Quantity *</label>
                    <input
                      type="number"
                      min="0"
                      required
                      value={newStock}
                      onChange={(e) => setNewStock(Number(e.target.value))}
                      className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Low-Stock Alert Threshold *</label>
                    <input
                      type="number"
                      min="1"
                      required
                      value={newThreshold}
                      onChange={(e) => setNewThreshold(Number(e.target.value))}
                      className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-900"
                    />
                  </div>
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 rounded-xl text-slate-600 bg-slate-100 font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl text-white bg-teal-600 hover:bg-teal-700 font-bold shadow-xs"
                  >
                    Save Product
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Edit Stock Modal */}
        {editingProduct && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
            <div className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-xl border border-slate-200 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-slate-900">Update Stock & Price</h3>
                <button onClick={() => setEditingProduct(null)} className="p-1 text-slate-400">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleUpdateStock} className="space-y-3 text-xs">
                <p className="font-bold text-teal-800 text-sm">{editingProduct.name}</p>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Current Stock Quantity</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={editStockQty}
                    onChange={(e) => setEditStockQty(Number(e.target.value))}
                    className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-900 font-bold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Selling Price (₹)</label>
                  <input
                    type="number"
                    step="0.5"
                    min="1"
                    required
                    value={editPrice}
                    onChange={(e) => setEditPrice(Number(e.target.value))}
                    className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-900 font-bold"
                  />
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingProduct(null)}
                    className="px-4 py-2 rounded-xl text-slate-600 bg-slate-100 font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl text-white bg-teal-600 font-bold shadow-xs"
                  >
                    Update
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
