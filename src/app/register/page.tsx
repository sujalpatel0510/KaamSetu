'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import {
  Briefcase,
  Store,
  User,
  ArrowRight,
  Eye,
  EyeOff,
  ShieldCheck,
} from 'lucide-react';
import { Language } from '@/lib/i18n';
import Button from '@/components/ui/Button';
import Alert from '@/components/ui/Alert';
import { CityInput } from '@/components/ui/CityInput';
import { cn } from '@/lib/cn';

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t, setLanguage, refreshUser } = useApp();

  const roleParam = searchParams.get('role');
  const [role, setRole] = useState<'WORKER' | 'BUSINESS_OWNER'>(
    roleParam === 'BUSINESS_OWNER' ? 'BUSINESS_OWNER' : 'WORKER'
  );

  useEffect(() => {
    if (roleParam === 'BUSINESS_OWNER' || roleParam === 'WORKER') {
      setRole(roleParam);
    }
  }, [roleParam]);

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [preferredLanguage, setPreferredLanguage] = useState<Language>('en');
  const [city, setCity] = useState('Ahmedabad');
  const [locality, setLocality] = useState('');

  // Worker specifics
  const [skills, setSkills] = useState<string>('Electrician, Wiring');
  const [experienceYears, setExperienceYears] = useState<number>(3);

  // Business specifics
  const [businessName, setBusinessName] = useState('');
  const [businessCategory, setBusinessCategory] = useState('GROCERY');
  const [businessAddress] = useState('');

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  /* Client-side validation feedback */
  const phoneValid = /^[6-9]\d{9}$/.test(phone);
  const passwordValid = password.length >= 6;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const payload = {
        name,
        phone,
        email: email || undefined,
        password,
        role,
        preferredLanguage,
        city,
        locality: locality || 'Main Market',
        ...(role === 'WORKER'
          ? {
              skills: skills.split(',').map((s) => s.trim()).filter(Boolean),
              experienceYears: Number(experienceYears),
            }
          : {
              businessName: businessName || `${name}'s Store`,
              businessCategory,
              businessAddress: businessAddress || `${locality}, ${city}`,
            }),
      };

      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Registration failed');
      } else {
        setLanguage(preferredLanguage);
        await refreshUser();
        if (role === 'WORKER') {
          router.push('/worker/dashboard');
        } else {
          router.push('/business/dashboard');
        }
      }
    } catch {
      setError('An error occurred during registration');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-canvas px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-xl space-y-6">
        <div className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-md shadow-brand-600/30">
            <Briefcase className="h-6 w-6" aria-hidden />
          </div>
          <h1 className="mt-4 text-2xl font-black tracking-tight text-ink">
            Create your KaamSetu Account
          </h1>
          <p className="mt-1 text-xs text-muted">
            Choose your role to get started with verified local opportunities
          </p>
        </div>

        <div className="ks-card space-y-6 p-6 sm:p-8">
          {error && <Alert tone="error">{error}</Alert>}

          {/* Role Selector Tabs */}
          <div
            className="grid grid-cols-2 gap-2 rounded-2xl bg-subtle p-1.5"
            role="tablist"
            aria-label="Account type"
          >
            <button
              type="button"
              role="tab"
              aria-selected={role === 'WORKER'}
              onClick={() => setRole('WORKER')}
              className={cn(
                'flex items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-bold transition-all',
                role === 'WORKER'
                  ? 'bg-surface text-accent-strong shadow-card'
                  : 'text-muted hover:text-ink'
              )}
            >
              <User className="h-4 w-4" aria-hidden />
              <span>Worker / Daily Wage</span>
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={role === 'BUSINESS_OWNER'}
              onClick={() => setRole('BUSINESS_OWNER')}
              className={cn(
                'flex items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-bold transition-all',
                role === 'BUSINESS_OWNER'
                  ? 'bg-surface text-amber-700 dark:text-amber-300 shadow-card'
                  : 'text-muted hover:text-ink'
              )}
            >
              <Store className="h-4 w-4" aria-hidden />
              <span>Shopkeeper / Business</span>
            </button>
          </div>

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="reg-name" className="ks-label">
                  Full Name *
                </label>
                <input
                  id="reg-name"
                  type="text"
                  required
                  autoComplete="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Ramesh Patel"
                  className="ks-input"
                />
              </div>

              <div>
                <label htmlFor="reg-phone" className="ks-label">
                  Mobile Number (10 Digits) *
                </label>
                <input
                  id="reg-phone"
                  type="tel"
                  required
                  autoComplete="tel"
                  maxLength={10}
                  inputMode="numeric"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                  placeholder="e.g. 9823456789"
                  aria-invalid={phone.length > 0 && !phoneValid}
                  className={cn('ks-input', phone.length > 0 && !phoneValid && 'border-red-400 focus:border-red-500 focus:ring-red-500/12')}
                />
                {phone.length > 0 && !phoneValid && (
                  <p className="mt-1 text-[11px] font-medium text-red-600 dark:text-red-400">
                    Enter a valid 10-digit Indian mobile number
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="reg-email" className="ks-label">
                  Email (Optional)
                </label>
                <input
                  id="reg-email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="ks-input"
                />
              </div>

              <div>
                <label htmlFor="reg-password" className="ks-label">
                  Password *
                </label>
                <div className="relative">
                  <input
                    id="reg-password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    autoComplete="new-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min 6 characters"
                    aria-invalid={password.length > 0 && !passwordValid}
                    className={cn('ks-input pr-10', password.length > 0 && !passwordValid && 'border-red-400 focus:border-red-500 focus:ring-red-500/12')}
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
                {password.length > 0 && !passwordValid && (
                  <p className="mt-1 text-[11px] font-medium text-red-600 dark:text-red-400">
                    Password must be at least 6 characters
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label htmlFor="reg-lang" className="ks-label">
                  Language / भाषा
                </label>
                <select
                  id="reg-lang"
                  value={preferredLanguage}
                  onChange={(e) => setPreferredLanguage(e.target.value as Language)}
                  className="ks-select"
                >
                  <option value="en">English</option>
                  <option value="hi">हिंदी (Hindi)</option>
                </select>
              </div>

              <div>
                <label htmlFor="reg-locality" className="ks-label">
                  Locality / Area *
                </label>
                <input
                  id="reg-locality"
                  type="text"
                  required
                  value={locality}
                  onChange={(e) => setLocality(e.target.value)}
                  placeholder="e.g. Maninagar, Alkapuri, Andheri"
                  className="ks-input"
                />
              </div>
            </div>

            <div>
              <label htmlFor="reg-city" className="ks-label">
                City / शहर *
              </label>
              <CityInput
                id="reg-city"
                value={city}
                onChange={setCity}
                required
              />
            </div>

            {/* Conditional Role Details */}
            {role === 'WORKER' ? (
              <div className="animate-fade-in space-y-3 rounded-2xl border border-brand-200/70 bg-brand-50/50 p-4">
                <h3 className="flex items-center gap-1.5 text-xs font-bold tracking-wider text-ink uppercase">
                  <ShieldCheck className="h-4 w-4" aria-hidden />
                  Worker Skill Profile
                </h3>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <label htmlFor="reg-skills" className="ks-label">
                      Skills (Comma separated)
                    </label>
                    <input
                      id="reg-skills"
                      type="text"
                      value={skills}
                      onChange={(e) => setSkills(e.target.value)}
                      placeholder="Electrician, Plumbing, Mason"
                      className="ks-input"
                    />
                  </div>
                  <div>
                    <label htmlFor="reg-exp" className="ks-label">
                      Years of Experience
                    </label>
                    <input
                      id="reg-exp"
                      type="number"
                      min="0"
                      value={experienceYears}
                      onChange={(e) => setExperienceYears(Number(e.target.value))}
                      className="ks-input"
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="animate-fade-in space-y-3 rounded-2xl border border-amber-500/30 bg-amber-500/10/60 p-4">
                <h3 className="flex items-center gap-1.5 text-xs font-bold tracking-wider text-amber-800 dark:text-amber-300 uppercase">
                  <Store className="h-4 w-4" aria-hidden />
                  Shop / Business Profile
                </h3>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <label htmlFor="reg-bname" className="ks-label">
                      Business Name
                    </label>
                    <input
                      id="reg-bname"
                      type="text"
                      value={businessName}
                      onChange={(e) => setBusinessName(e.target.value)}
                      placeholder="e.g. Patel Kirana Store"
                      className="ks-input"
                    />
                  </div>
                  <div>
                    <label htmlFor="reg-bcat" className="ks-label">
                      Business Category
                    </label>
                    <select
                      id="reg-bcat"
                      value={businessCategory}
                      onChange={(e) => setBusinessCategory(e.target.value)}
                      className="ks-select"
                    >
                      <option value="GROCERY">Grocery / Kirana</option>
                      <option value="TEA_STALL">Tea Stall & Snacks</option>
                      <option value="HARDWARE">Hardware & Sanitary</option>
                      <option value="ELECTRICAL">Electrical Supplies</option>
                      <option value="RETAIL">General Retail</option>
                      <option value="CONSTRUCTION">Construction / Contractor</option>
                      <option value="OTHER">Other Small Business</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            <Button
              type="submit"
              loading={loading}
              loadingText="Creating account…"
              size="lg"
              className="w-full"
            >
              {t.register}
              {!loading && <ArrowRight className="h-4 w-4" aria-hidden />}
            </Button>
          </form>

          <p className="border-t border-line pt-4 text-center text-xs text-muted">
            Already have an account?{' '}
            <Link href="/login" className="font-bold text-accent-strong hover:underline">
              {t.login}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center text-xs text-muted">
          Loading…
        </div>
      }
    >
      <RegisterForm />
    </Suspense>
  );
}
