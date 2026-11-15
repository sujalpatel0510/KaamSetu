'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import { Briefcase, Store, User, Phone, Lock, MapPin, Mail, ArrowRight, AlertCircle } from 'lucide-react';
import { Language } from '@/lib/i18n';

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
  const [preferredLanguage, setPreferredLanguage] = useState<Language>('en');
  const [city, setCity] = useState('Ahmedabad');
  const [locality, setLocality] = useState('');

  // Worker specifics
  const [skills, setSkills] = useState<string>('Electrician, Wiring');
  const [experienceYears, setExperienceYears] = useState<number>(3);

  // Business specifics
  const [businessName, setBusinessName] = useState('');
  const [businessCategory, setBusinessCategory] = useState('GROCERY');
  const [businessAddress, setBusinessAddress] = useState('');

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

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
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-slate-50">
      <div className="w-full max-w-xl space-y-6 bg-white p-8 rounded-3xl border border-slate-200 shadow-md">
        <div className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-600 text-white shadow-md shadow-teal-600/30">
            <Briefcase className="h-6 w-6" />
          </div>
          <h2 className="mt-4 text-2xl font-black text-slate-900 tracking-tight">
            Create your KaamSetu Account
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            Choose your role to get started with verified local opportunities
          </p>
        </div>

        {error && (
          <div className="rounded-xl bg-red-50 p-3.5 border border-red-200 text-xs text-red-700 flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0 text-red-500" />
            <span>{error}</span>
          </div>
        )}

        {/* Role Selector Tabs */}
        <div className="grid grid-cols-2 gap-3 p-1 bg-slate-100 rounded-2xl">
          <button
            type="button"
            onClick={() => setRole('WORKER')}
            className={`flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-bold transition-all ${
              role === 'WORKER'
                ? 'bg-white text-teal-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <User className="h-4 w-4" />
            <span>Worker / Daily Wage</span>
          </button>

          <button
            type="button"
            onClick={() => setRole('BUSINESS_OWNER')}
            className={`flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-bold transition-all ${
              role === 'BUSINESS_OWNER'
                ? 'bg-white text-amber-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Store className="h-4 w-4" />
            <span>Shopkeeper / Business</span>
          </button>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Full Name *</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Ramesh Patel"
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Mobile Number (10 Digits) *</label>
              <input
                type="tel"
                required
                maxLength={10}
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="e.g. 9823456789"
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Email (Optional)</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Password *</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Min 6 characters"
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Language</label>
              <select
                value={preferredLanguage}
                onChange={(e) => setPreferredLanguage(e.target.value as Language)}
                className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="en">English</option>
                <option value="hi">हिंदी (Hindi)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">City *</label>
              <select
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="Ahmedabad">Ahmedabad</option>
                <option value="Vadodara">Vadodara</option>
                <option value="Surat">Surat</option>
                <option value="Rajkot">Rajkot</option>
                <option value="Gandhinagar">Gandhinagar</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Locality / Area *</label>
              <input
                type="text"
                required
                value={locality}
                onChange={(e) => setLocality(e.target.value)}
                placeholder="e.g. Maninagar, Alkapuri"
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>

          {/* Conditional Role Details */}
          {role === 'WORKER' ? (
            <div className="p-4 rounded-2xl bg-teal-50/70 border border-teal-200/80 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-teal-800">
                Worker Skill Profile
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Skills (Comma separated)</label>
                  <input
                    type="text"
                    value={skills}
                    onChange={(e) => setSkills(e.target.value)}
                    placeholder="Electrician, Plumbing, Mason"
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs text-slate-900 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Years of Experience</label>
                  <input
                    type="number"
                    min="0"
                    value={experienceYears}
                    onChange={(e) => setExperienceYears(Number(e.target.value))}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs text-slate-900 bg-white"
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/80 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-amber-800">
                Shop / Business Profile
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Business Name</label>
                  <input
                    type="text"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    placeholder="e.g. Patel Kirana Store"
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs text-slate-900 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Business Category</label>
                  <select
                    value={businessCategory}
                    onChange={(e) => setBusinessCategory(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs text-slate-900 bg-white"
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

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-teal-600 hover:bg-teal-700 py-3 text-sm font-bold text-white shadow-md shadow-teal-600/20 transition-all hover:scale-101 active:scale-99 disabled:opacity-50"
          >
            {loading ? 'Creating account...' : t.register}
            <ArrowRight className="h-4 w-4" />
          </button>
        </form>

        <div className="text-center pt-2">
          <p className="text-xs text-slate-500">
            Already have an account?{' '}
            <Link href="/login" className="font-bold text-teal-700 hover:underline">
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
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-xs text-slate-400">Loading...</div>}>
      <RegisterForm />
    </Suspense>
  );
}
