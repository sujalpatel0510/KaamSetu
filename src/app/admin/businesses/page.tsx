'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useApp } from '@/context/AppContext';
import PageHeader from '@/components/ui/PageHeader';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { toast } from '@/components/ui/Toast';
import EmptyState from '@/components/ui/EmptyState';
import {
  Store,
  Search,
  Download,
  RefreshCw,
  Phone,
  Package,
  ShoppingCart,
  Users,
  Briefcase,
  MapPin,
} from 'lucide-react';
import { cn } from '@/lib/cn';
import { formatDate } from '@/lib/date';

interface BusinessRecord {
  id: string;
  name: string;
  category: string;
  city: string;
  locality: string;
  phone: string;
  createdAt: string;
  owner: {
    name: string;
    phone: string;
    email?: string | null;
  };
  _count: {
    products: number;
    sales: number;
    customers: number;
    jobs: number;
  };
}

export default function AdminBusinessesPage() {
  const { language } = useApp();
  const isHi = language === 'hi';

  const [businesses, setBusinesses] = useState<BusinessRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');

  const fetchBusinesses = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/data');
      if (!res.ok) throw new Error('Failed to fetch businesses');
      const data = await res.json();
      setBusinesses(data.businesses || []);
    } catch (err: any) {
      toast.error(err.message || 'Error fetching businesses');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBusinesses();
  }, [fetchBusinesses]);

  const categories = Array.from(new Set(businesses.map((b) => b.category).filter(Boolean)));

  const filtered = businesses.filter((b) => {
    const q = search.toLowerCase();
    const matchesSearch =
      b.name.toLowerCase().includes(q) ||
      b.city.toLowerCase().includes(q) ||
      b.locality.toLowerCase().includes(q) ||
      b.owner.name.toLowerCase().includes(q) ||
      b.owner.phone.includes(q);
    const matchesCat = categoryFilter === 'ALL' || b.category === categoryFilter;
    return matchesSearch && matchesCat;
  });

  const exportCSV = () => {
    const headers = ['Business Name', 'Category', 'City', 'Owner Name', 'Owner Phone', 'Products', 'Sales', 'Customers'];
    const rows = filtered.map((b) => [
      `"${b.name.replace(/"/g, '""')}"`,
      b.category,
      b.city,
      `"${b.owner.name.replace(/"/g, '""')}"`,
      b.owner.phone,
      b._count.products,
      b._count.sales,
      b._count.customers,
    ]);
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `kaamsetu_businesses_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success(isHi ? 'दुकानों की सूची डाउनलोड हो गई' : 'Businesses CSV exported');
  };

  return (
    <div className="space-y-6 pb-12 w-full max-w-full">
      <PageHeader
        title={isHi ? 'दुकानें व व्यापार केंद्र' : 'Businesses & Stores'}
        description={
          isHi
            ? 'प्लेटफ़ॉर्म पर पंजीकृत किराना, हार्डवेयर, सेवाएं व सभी स्थानीय प्रतिष्ठानों का डेटा और इन्वेंट्री स्वास्थ्य।'
            : 'Directory of registered local merchants, shops, product counts, and customer billing volume.'
        }
        actions={
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" onClick={fetchBusinesses} disabled={loading}>
              <RefreshCw className={cn('h-3.5 w-3.5 mr-1', loading && 'animate-spin')} />
              {isHi ? 'रीफ़्रेश' : 'Refresh'}
            </Button>
            <Button variant="secondary" size="sm" onClick={exportCSV}>
              <Download className="h-3.5 w-3.5 mr-1" />
              {isHi ? 'CSV निर्यात' : 'Export CSV'}
            </Button>
          </div>
        }
      />

      {/* KPI Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="ks-card p-4">
          <p className="text-[11px] font-bold uppercase tracking-wider text-muted">
            {isHi ? 'कुल पंजीकृत दुकानें' : 'Total Businesses'}
          </p>
          <p className="text-2xl font-black text-ink mt-1 tabular-nums">{businesses.length}</p>
        </div>
        <div className="ks-card p-4">
          <p className="text-[11px] font-bold uppercase tracking-wider text-muted">
            {isHi ? 'सक्रिय उत्पाद (SKUs)' : 'Total Products'}
          </p>
          <p className="text-2xl font-black text-[#163A35] dark:text-[#B7D86B] mt-1 tabular-nums">
            {businesses.reduce((acc, b) => acc + (b._count?.products || 0), 0)}
          </p>
        </div>
        <div className="ks-card p-4">
          <p className="text-[11px] font-bold uppercase tracking-wider text-muted">
            {isHi ? 'बिलिंग बिक्री लेनदेन' : 'Total Sales Recorded'}
          </p>
          <p className="text-2xl font-black text-green-700 dark:text-green-400 mt-1 tabular-nums">
            {businesses.reduce((acc, b) => acc + (b._count?.sales || 0), 0)}
          </p>
        </div>
        <div className="ks-card p-4">
          <p className="text-[11px] font-bold uppercase tracking-wider text-muted">
            {isHi ? 'संबद्ध ग्राहक' : 'Connected Customers'}
          </p>
          <p className="text-2xl font-black text-[#C66A45] mt-1 tabular-nums">
            {businesses.reduce((acc, b) => acc + (b._count?.customers || 0), 0)}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="ks-card p-4">
        <div className="flex flex-col md:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={
                isHi
                  ? 'दुकान का नाम, शहर, इलाका या मालिक से खोजें...'
                  : 'Search by store name, city, locality, or merchant name...'
              }
              className="ks-input pl-10"
            />
          </div>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="ks-select text-xs w-full md:w-48"
          >
            <option value="ALL">{isHi ? 'सभी श्रेणियां' : 'All Categories'}</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Businesses Table */}
      <div className="ks-card overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-muted font-bold animate-pulse">
            {isHi ? 'दुकानों का डेटा लोड हो रहा है...' : 'Loading business directory...'}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={Store}
            title={isHi ? 'कोई दुकान नहीं मिली' : 'No businesses found'}
            description={
              isHi
                ? 'अपने खोज शब्द या श्रेणी फ़िल्टर बदलकर दोबारा प्रयास करें।'
                : 'Try adjusting your search criteria.'
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="ks-table min-w-[850px]">
              <thead>
                <tr>
                  <th>{isHi ? 'दुकान व श्रेणी' : 'Business & Category'}</th>
                  <th>{isHi ? 'स्थान' : 'Location'}</th>
                  <th>{isHi ? 'दुकानदार / मालिक' : 'Owner / Merchant'}</th>
                  <th className="text-center">{isHi ? 'उत्पाद' : 'Products'}</th>
                  <th className="text-center">{isHi ? 'बिक्री' : 'Sales'}</th>
                  <th className="text-center">{isHi ? 'ग्राहक' : 'Customers'}</th>
                  <th className="text-center">{isHi ? 'नौकरियां' : 'Jobs'}</th>
                  <th>{isHi ? 'पंजीकरण दिनांक' : 'Joined'}</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((b) => (
                  <tr key={b.id}>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#E8EFEA] text-[#163A35] font-black text-xs ring-1 ring-[#163A35]/20 dark:bg-[#1A2D28] dark:text-[#B7D86B]">
                          <Store className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="font-bold text-ink">{b.name}</p>
                          <Badge tone="neutral" className="mt-0.5 text-[10px]">
                            {b.category || 'Retail'}
                          </Badge>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="flex items-center gap-1 text-xs text-ink-soft">
                        <MapPin className="h-3 w-3 text-muted shrink-0" />
                        <span>
                          {b.locality ? `${b.locality}, ` : ''}
                          {b.city}
                        </span>
                      </div>
                    </td>
                    <td>
                      <div>
                        <p className="font-semibold text-xs text-ink">{b.owner?.name}</p>
                        <a
                          href={`tel:${b.owner?.phone}`}
                          className="inline-flex items-center gap-1 text-[11px] text-muted hover:text-accent font-medium mt-0.5"
                        >
                          <Phone className="h-3 w-3" />
                          {b.owner?.phone}
                        </a>
                      </div>
                    </td>
                    <td className="text-center font-bold text-ink tabular-nums">
                      {b._count?.products || 0}
                    </td>
                    <td className="text-center font-bold text-green-700 dark:text-green-400 tabular-nums">
                      {b._count?.sales || 0}
                    </td>
                    <td className="text-center font-bold text-[#C66A45] tabular-nums">
                      {b._count?.customers || 0}
                    </td>
                    <td className="text-center font-bold text-ink tabular-nums">
                      {b._count?.jobs || 0}
                    </td>
                    <td className="text-xs text-muted">{formatDate(b.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
