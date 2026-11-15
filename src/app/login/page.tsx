'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import { Briefcase, Lock, Phone, ArrowRight, AlertCircle, Sparkles } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { t, refreshUser } = useApp();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to login');
      } else {
        await refreshUser();
        if (data.user.role === 'WORKER') {
          router.push('/worker/dashboard');
        } else if (data.user.role === 'BUSINESS_OWNER') {
          router.push('/business/dashboard');
        } else if (data.user.role === 'ADMIN') {
          router.push('/admin/dashboard');
        } else {
          router.push('/');
        }
      }
    } catch {
      setError('An error occurred during login');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemo = (phone: string) => {
    setIdentifier(phone);
    setPassword('password123');
    // Immediate login
    setLoading(true);
    setError('');
    fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: phone, password: 'password123' }),
    })
      .then((res) => res.json())
      .then(async (data) => {
        if (data.user) {
          await refreshUser();
          if (data.user.role === 'WORKER') router.push('/worker/dashboard');
          else if (data.user.role === 'BUSINESS_OWNER') router.push('/business/dashboard');
          else router.push('/admin/dashboard');
        } else {
          setError(data.error || 'Demo login failed');
        }
      })
      .catch(() => setError('Demo login failed'))
      .finally(() => setLoading(false));
  };

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-slate-50">
      <div className="w-full max-w-md space-y-8 bg-white p-8 rounded-3xl border border-slate-200 shadow-md">
        <div className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-600 text-white shadow-md shadow-teal-600/30">
            <Briefcase className="h-6 w-6" />
          </div>
          <h2 className="mt-4 text-2xl font-black text-slate-900 tracking-tight">
            Sign in to KaamSetu
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            Enter your mobile number or email to access your account
          </p>
        </div>

        {error && (
          <div className="rounded-xl bg-red-50 p-3.5 border border-red-200 text-xs text-red-700 flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0 text-red-500" />
            <span>{error}</span>
          </div>
        )}

        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Mobile Number or Email
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Phone className="h-4 w-4" />
              </div>
              <input
                type="text"
                required
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="e.g. 9812345678 or email"
                className="w-full rounded-xl border border-slate-300 pl-10 pr-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Lock className="h-4 w-4" />
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-xl border border-slate-300 pl-10 pr-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-teal-600 hover:bg-teal-700 py-3 text-sm font-bold text-white shadow-md shadow-teal-600/20 transition-all hover:scale-101 active:scale-99 disabled:opacity-50"
          >
            {loading ? 'Signing in...' : t.login}
            <ArrowRight className="h-4 w-4" />
          </button>
        </form>

        {/* 1-Click Demo Profiles for Judges */}
        <div className="pt-4 border-t border-slate-100">
          <p className="text-[11px] font-bold uppercase tracking-wider text-amber-700 mb-2 flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-amber-500" />
            Quick Demo Accounts (1-Click Login):
          </p>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <button
              type="button"
              onClick={() => handleQuickDemo('9812345678')}
              className="p-2 text-left rounded-xl bg-teal-50 hover:bg-teal-100 border border-teal-200 transition-colors"
            >
              <p className="font-bold text-teal-900">Ramesh Kumar</p>
              <p className="text-[10px] text-teal-700">Worker (Electrician)</p>
            </button>

            <button
              type="button"
              onClick={() => handleQuickDemo('9876543210')}
              className="p-2 text-left rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-200 transition-colors"
            >
              <p className="font-bold text-amber-900">Rajesh Patel</p>
              <p className="text-[10px] text-amber-700">Shopkeeper (Kirana)</p>
            </button>

            <button
              type="button"
              onClick={() => handleQuickDemo('9876543211')}
              className="p-2 text-left rounded-xl bg-orange-50 hover:bg-orange-100 border border-orange-200 transition-colors"
            >
              <p className="font-bold text-orange-900">Vikram Singh</p>
              <p className="text-[10px] text-orange-700">Tea Stall (Chaiwala)</p>
            </button>

            <button
              type="button"
              onClick={() => handleQuickDemo('9999999999')}
              className="p-2 text-left rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-300 transition-colors"
            >
              <p className="font-bold text-slate-900">System Admin</p>
              <p className="text-[10px] text-slate-600">Platform Admin</p>
            </button>
          </div>
        </div>

        <div className="text-center pt-2">
          <p className="text-xs text-slate-500">
            Don&apos;t have an account?{' '}
            <Link href="/register" className="font-bold text-teal-700 hover:underline">
              {t.register}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
