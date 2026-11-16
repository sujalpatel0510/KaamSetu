'use client';

import { toast } from '@/components/ui/Toast';
import React, { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import DashboardShell from '@/components/DashboardShell';
import PageHeader from '@/components/ui/PageHeader';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import Alert from '@/components/ui/Alert';
import EmptyState from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import {
  Package,
  Plus,
  Search,
  AlertTriangle,
  Pencil,
  Trash2,
} from 'lucide-react';
import { cn } from '@/lib/cn';

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
  const { t, language } = useApp();
  const isHi = language === 'hi';
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
  const [adding, setAdding] = useState(false);

  // Edit Stock Modal
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editStockQty, setEditStockQty] = useState<number>(0);
  const [editPrice, setEditPrice] = useState<number>(0);
  const [updating, setUpdating] = useState(false);

  // Delete confirmation
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error';
    msg: string;
  } | null>(null);

  const fetchInventory = async (searchOverride?: string) => {
    try {
      const params = new URLSearchParams();
      const term = searchOverride ?? search;
      if (term) params.append('search', term);
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
    // Honor ?search= from the global header search (and keep the input in sync)
    const urlSearch = new URLSearchParams(window.location.search).get('search') || '';
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (urlSearch) setSearch(urlSearch);
    fetchInventory(urlSearch);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category, lowStockOnly]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchInventory();
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);
    setAdding(true);

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
        toast.success(`Added "${newName}" to inventory!`);
        setShowAddModal(false);
        setNewName('');
        setNewSku('');
        setNewSellingPrice('');
        setNewCostPrice('');
        fetchInventory();
      }
    } catch {
      setFeedback({ type: 'error', msg: 'Network error adding product' });
    } finally {
      setAdding(false);
    }
  };

  const handleUpdateStock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;
    setUpdating(true);

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
        toast.success(`Stock updated for ${editingProduct.name}!`);
        setEditingProduct(null);
        fetchInventory();
      }
    } catch {
      setFeedback({ type: 'error', msg: 'Network error updating stock' });
    } finally {
      setUpdating(false);
    }
  };

  const handleDeleteProduct = async () => {
    if (!deletingProduct) return;
    setDeleting(true);

    try {
      const res = await fetch(`/api/business/inventory/${deletingProduct.id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      setFeedback({ type: 'success', msg: data.message || 'Product removed.' });
      toast.success(data.message || 'Product removed.');
      fetchInventory();
    } catch {
      setFeedback({ type: 'error', msg: 'Failed to remove product' });
    } finally {
      setDeleting(false);
      setDeletingProduct(null);
    }
  };

  return (
    <DashboardShell role="BUSINESS_OWNER">
      <PageHeader
        title={isHi ? 'स्टॉक व इन्वेंट्री प्रबंधन' : 'Inventory & Stock Management'}
        description={isHi ? 'सामान की मात्रा, न्यूनतम सीमा और कीमतों को रीयल-टाइम में ट्रैक करें।' : 'Track item quantities, set low-stock thresholds, and manage prices in real time.'}
        actions={
          <Button onClick={() => setShowAddModal(true)}>
            <Plus className="h-4 w-4" aria-hidden />
            {t.addProduct}
          </Button>
        }
      />

      {feedback && <Alert tone={feedback.type}>{feedback.msg}</Alert>}

      {/* Search & Filter Bar */}
      <div className="ks-card flex flex-col items-center justify-between gap-3 p-4 sm:flex-row">
        <form onSubmit={handleSearch} className="relative w-full flex-1">
          <Search
            className="pointer-events-none absolute top-3 left-3.5 h-4 w-4 text-muted"
            aria-hidden
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search product name or SKU…"
            aria-label="Search products"
            className="ks-input pl-10"
          />
        </form>

        <div className="flex w-full items-center gap-2 sm:w-auto">
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            aria-label="Filter by category"
            className="ks-select py-2 text-xs"
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
            aria-pressed={lowStockOnly}
            className={cn(
              'ks-btn ks-btn-sm shrink-0',
              lowStockOnly ? 'ks-btn-amber' : 'ks-btn-secondary'
            )}
          >
            <AlertTriangle className="h-3.5 w-3.5" aria-hidden />
            Low Stock Only
          </button>
        </div>
      </div>

      {/* Product Table */}
      <div className="ks-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="ks-table min-w-[640px]">
            <thead>
              <tr>
                <th scope="col">Product Name</th>
                <th scope="col">Category</th>
                <th scope="col">Selling Price</th>
                <th scope="col">Stock Status</th>
                <th scope="col" className="text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i}>
                    <td colSpan={5} className="p-2">
                      <Skeleton className="h-10 w-full" />
                    </td>
                  </tr>
                ))
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={5}>
                    <EmptyState
                      icon={Package}
                      title="No products found"
                      description='Click "Add New Product" to populate your store inventory.'
                      action={
                        <Button size="sm" onClick={() => setShowAddModal(true)}>
                          <Plus className="h-4 w-4" aria-hidden />
                          Add New Product
                        </Button>
                      }
                      className="border-0 shadow-none"
                    />
                  </td>
                </tr>
              ) : (
                products.map((p) => {
                  const isLow = p.stockQuantity <= p.lowStockThreshold;
                  return (
                    <tr key={p.id}>
                      <td>
                        <p className="font-bold text-ink">{p.name}</p>
                        {p.sku && <p className="text-[10px] text-muted">SKU: {p.sku}</p>}
                      </td>
                      <td className="text-ink-soft">{p.category}</td>
                      <td className="font-black text-ink tabular-nums">
                        ₹{Number(p.sellingPrice).toFixed(2)}
                      </td>
                      <td>
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={cn(
                              'ks-badge',
                              isLow
                                ? 'border border-red-500/30 bg-red-500/15 text-red-700 dark:text-red-300'
                                : 'bg-green-500/15 text-green-800 dark:text-green-300'
                            )}
                          >
                            {p.stockQuantity} units
                          </span>
                          {isLow && (
                            <span className="flex items-center gap-0.5 text-[10px] font-medium text-amber-700 dark:text-amber-300">
                              <AlertTriangle className="h-3 w-3" aria-hidden />
                              Low Stock
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => {
                              setEditingProduct(p);
                              setEditStockQty(p.stockQuantity);
                              setEditPrice(Number(p.sellingPrice));
                            }}
                            className="rounded-lg p-2 text-accent-strong transition-colors hover:bg-brand-50"
                            title="Edit Stock & Price"
                            aria-label={`Edit ${p.name}`}
                          >
                            <Pencil className="h-4 w-4" aria-hidden />
                          </button>
                          <button
                            onClick={() => setDeletingProduct(p)}
                            className="rounded-lg p-2 text-red-600 dark:text-red-400 transition-colors hover:bg-red-500/10"
                            title="Remove Product"
                            aria-label={`Remove ${p.name}`}
                          >
                            <Trash2 className="h-4 w-4" aria-hidden />
                          </button>
                        </div>
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
      <Modal
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Add New Product"
        description="Products become available in the billing counter immediately."
      >
        <form onSubmit={handleAddProduct} className="space-y-3 text-xs">
          <div>
            <label htmlFor="inv-name" className="ks-label">
              Product Name *
            </label>
            <input
              id="inv-name"
              type="text"
              required
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="e.g. Fortune Sunflower Oil 1L"
              className="ks-input"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="inv-cat" className="ks-label">
                Category *
              </label>
              <input
                id="inv-cat"
                type="text"
                required
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                placeholder="e.g. Grains, Dairy"
                className="ks-input"
              />
            </div>
            <div>
              <label htmlFor="inv-sku" className="ks-label">
                SKU (Optional)
              </label>
              <input
                id="inv-sku"
                type="text"
                value={newSku}
                onChange={(e) => setNewSku(e.target.value)}
                placeholder="OIL-SUN-1L"
                className="ks-input"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="inv-sell" className="ks-label">
                Selling Price (₹) *
              </label>
              <input
                id="inv-sell"
                type="number"
                step="0.5"
                min="1"
                required
                value={newSellingPrice}
                onChange={(e) => setNewSellingPrice(Number(e.target.value))}
                placeholder="145"
                className="ks-input"
              />
            </div>
            <div>
              <label htmlFor="inv-cost" className="ks-label">
                Cost Price (₹)
              </label>
              <input
                id="inv-cost"
                type="number"
                step="0.5"
                min="1"
                value={newCostPrice}
                onChange={(e) => setNewCostPrice(Number(e.target.value))}
                placeholder="120"
                className="ks-input"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="inv-stock" className="ks-label">
                Initial Stock Quantity *
              </label>
              <input
                id="inv-stock"
                type="number"
                min="0"
                required
                value={newStock}
                onChange={(e) => setNewStock(Number(e.target.value))}
                className="ks-input"
              />
            </div>
            <div>
              <label htmlFor="inv-threshold" className="ks-label">
                Low-Stock Alert At *
              </label>
              <input
                id="inv-threshold"
                type="number"
                min="1"
                required
                value={newThreshold}
                onChange={(e) => setNewThreshold(Number(e.target.value))}
                className="ks-input"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 border-t border-line pt-4">
            <Button variant="secondary" size="sm" onClick={() => setShowAddModal(false)}>
              Cancel
            </Button>
            <Button type="submit" size="sm" loading={adding} loadingText="Saving…">
              Save Product
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit Stock Modal */}
      <Modal
        open={Boolean(editingProduct)}
        onClose={() => setEditingProduct(null)}
        title="Update Stock & Price"
        description={editingProduct?.name}
        className="max-w-sm"
      >
        <form onSubmit={handleUpdateStock} className="space-y-3 text-xs">
          <div>
            <label htmlFor="edit-stock" className="ks-label">
              Current Stock Quantity
            </label>
            <input
              id="edit-stock"
              type="number"
              min="0"
              required
              value={editStockQty}
              onChange={(e) => setEditStockQty(Number(e.target.value))}
              className="ks-input font-bold"
            />
          </div>

          <div>
            <label htmlFor="edit-price" className="ks-label">
              Selling Price (₹)
            </label>
            <input
              id="edit-price"
              type="number"
              step="0.5"
              min="1"
              required
              value={editPrice}
              onChange={(e) => setEditPrice(Number(e.target.value))}
              className="ks-input font-bold"
            />
          </div>

          <div className="flex justify-end gap-2 border-t border-line pt-4">
            <Button variant="secondary" size="sm" onClick={() => setEditingProduct(null)}>
              Cancel
            </Button>
            <Button type="submit" size="sm" loading={updating} loadingText="Updating…">
              Update
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete confirmation */}
      <ConfirmDialog
        open={Boolean(deletingProduct)}
        onClose={() => setDeletingProduct(null)}
        onConfirm={handleDeleteProduct}
        loading={deleting}
        title="Remove product?"
        description={`"${deletingProduct?.name}" will be permanently removed from your inventory. Past sales records are kept intact.`}
        confirmLabel="Remove Product"
      />
    </DashboardShell>
  );
}
