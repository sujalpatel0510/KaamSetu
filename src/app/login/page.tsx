'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import {
  Briefcase,
  Lock,
  Phone,
  ArrowRight,
  Sparkles,
  Eye,
  EyeOff,
  CheckCircle2,
} from 'lucide-react';
import Button from '@/components/ui/Button';
import Alert from '@/components/ui/Alert';

export default function LoginPage() {
  const router = useRouter();
  const { t, refreshUser } = useApp();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const routeByRole = (role: string) => {
    if (role === 'WORKER') return '/worker/dashboard';
    if (role === 'BUSINESS_OWNER') return '/business/dashboard';
    if (role === 'ADMIN') return '/admin/dashboard';
    return '/';
  };

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
        router.push(routeByRole(data.user.role));
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
          router.push(routeByRole(data.user.role));
        } else {
          setError(data.error || 'Demo login failed');
        }
      })
      .catch(() => setError('Demo login failed'))
      .finally(() => setLoading(false));
  };

  const demoAccounts = [
    { phone: '9812345678', name: 'Ramesh Kumar', role: 'Worker (Electrician)', tone: 'text-accent-strong' },
    { phone: '9876543210', name: 'Rajesh Patel', role: 'Shopkeeper (Kirana)', tone: 'text-amber-700 dark:text-amber-300' },
    { phone: '9876543211', name: 'Vikram Singh', role: 'Tea Stall (Chaiwala)', tone: 'text-amber-700' },
    { phone: '9999999999', name: 'System Admin', role: 'Platform Admin', tone: 'text-ink-soft' },
  ];

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-canvas px-4 py-12 sm:px-6 lg:px-8">
      <div className="grid w-full max-w-4xl overflow-hidden lg:grid-cols-2 lg:rounded-3xl lg:border lg:border-line lg:shadow-card">
        {/* Brand panel */}
        <div className="relative hidden overflow-hidden bg-brand-950 p-10 text-white lg:flex lg:flex-col lg:justify-between">
          <div aria-hidden className="pointer-events-none absolute inset-0">
            <div className="absolute -top-24 left-1/2 h-80 w-80 -translate-x-1/2 rounded-full bg-brand-500/25 blur-[100px]" />
            <div className="absolute bottom-0 -left-16 h-64 w-64 rounded-full bg-accent/10 blur-[100px]" />
          </div>
          <div className="relative">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 shadow-md shadow-brand-600/40">
              <Briefcase className="h-6 w-6" aria-hidden />
            </div>
            <h2 className="mt-6 text-2xl font-black tracking-tight">
              Welcome back to KaamSetu
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              Sign in to track applications, manage your shop, and stay on top of
              your local work ecosystem.
            </p>
          </div>
          <ul className="relative space-y-3 text-xs text-faint">
            {[
              'Verified local job marketplace',
              'Digital Udhaar book with zero math errors',
              'Voice entry in Hindi & English',
            ].map((point) => (
              <li key={point} className="flex items-center gap-2.5">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-muted" aria-hidden />
                {point}
              </li>
            ))}
          </ul>
        </div>

        {/* Form panel */}
        <div className="ks-card space-y-7 border-0 p-8 sm:p-10 lg:rounded-none lg:border-0 lg:shadow-none">
          <div className="text-center lg:text-left">
            <h1 className="text-2xl font-black tracking-tight text-ink">
              Sign in to KaamSetu
            </h1>
            <p className="mt-1 text-xs text-muted">
              Enter your mobile number or email to access your account
            </p>
          </div>

          {error && <Alert tone="error">{error}</Alert>}

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="login-identifier" className="ks-label">
                Mobile Number or Email
              </label>
              <div className="relative">
                <Phone
                  className="pointer-events-none absolute top-3 left-3.5 h-4 w-4 text-muted"
                  aria-hidden
                />
                <input
                  id="login-identifier"
                  type="text"
                  required
                  autoComplete="username"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="e.g. 9812345678 or email"
                  className="ks-input pl-10"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label htmlFor="login-password" className="ks-label">
                  Password
                </label>
                <span className="mb-1.5 text-[11px] text-muted">
                  Demo password: password123
                </span>
              </div>
              <div className="relative">
                <Lock
                  className="pointer-events-none absolute top-3 left-3.5 h-4 w-4 text-muted"
                  aria-hidden
                />
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="ks-input pr-10 pl-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute top-2.5 right-2 rounded-lg p-1.5 text-muted transition-colors hover:bg-hover hover:text-ink-soft"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" aria-hidden />
                  ) : (
                    <Eye className="h-4 w-4" aria-hidden />
                  )}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              loading={loading}
              loadingText="Signing in…"
              className="w-full"
              size="lg"
            >
              {t.login}
              {!loading && <ArrowRight className="h-4 w-4" aria-hidden />}
            </Button>
          </form>

          {/* 1-Click Demo Profiles */}
          <div className="border-t border-line pt-5">
            <p className="mb-2.5 flex items-center gap-1.5 text-[11px] font-bold tracking-wider text-amber-700 dark:text-amber-300 uppercase">
              <Sparkles className="h-3.5 w-3.5 text-amber-500" aria-hidden />
              Quick Demo Accounts (1-Click Login)
            </p>
            <div className="grid grid-cols-2 gap-2">
              {demoAccounts.map((acc) => (
                <button
                  key={acc.phone}
                  type="button"
                  disabled={loading}
                  onClick={() => handleQuickDemo(acc.phone)}
                  className="rounded-xl border border-line bg-subtle/60 p-2.5 text-left transition-all hover:border-brand-300 hover:bg-brand-50/60 disabled:opacity-50"
                >
                  <p className={`text-xs font-bold ${acc.tone}`}>{acc.name}</p>
                  <p className="text-[10px] text-muted">{acc.role}</p>
                </button>
              ))}
            </div>
          </div>

          <p className="text-center text-xs text-muted">
            Don&apos;t have an account?{' '}
            <Link
              href="/register"
              className="font-bold text-accent-strong hover:underline"
            >
              {t.register}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
