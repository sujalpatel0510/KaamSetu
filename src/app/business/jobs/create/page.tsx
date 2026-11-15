'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Sidebar from '@/components/Sidebar';
import { Briefcase, ArrowLeft, Plus, CheckCircle2, AlertCircle } from 'lucide-react';

export default function CreateJobPage() {
  const router = useRouter();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [skills, setSkills] = useState('Electrician, Wiring');
  const [city, setCity] = useState('Ahmedabad');
  const [locality, setLocality] = useState('Maninagar');
  const [wageAmount, setWageAmount] = useState<number | ''>(600);
  const [wageType, setWageType] = useState<'DAILY' | 'FIXED'>('DAILY');
  const [jobType, setJobType] = useState('CONTRACT');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description,
          requiredSkills: skills.split(',').map((s) => s.trim()).filter(Boolean),
          city,
          locality,
          wageAmount: Number(wageAmount),
          wageType,
          jobType,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to post job');
      } else {
        router.push('/business/jobs');
      }
    } catch {
      setError('An error occurred while creating job posting');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row min-h-[calc(100vh-4rem)] bg-slate-50">
      <Sidebar role="BUSINESS_OWNER" />

      <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-4xl space-y-6">
        <Link
          href="/business/jobs"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-teal-700 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to My Jobs
        </Link>

        <div>
          <h1 className="text-2xl font-black text-slate-900">Post a New Job Opportunity</h1>
          <p className="text-xs text-slate-500">
            Publish your requirement so local daily workers and tradesmen can discover and apply.
          </p>
        </div>

        {error && (
          <div className="rounded-xl bg-red-50 p-4 border border-red-200 text-xs text-red-700 flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-red-500 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs space-y-5 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1">Job Title *</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Electrician for Wiring & Fitting, Delivery Boy, Shop Assistant"
              className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-slate-700 mb-1">City *</label>
              <select
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-900 bg-white"
              >
                <option value="Ahmedabad">Ahmedabad</option>
                <option value="Vadodara">Vadodara</option>
                <option value="Surat">Surat</option>
                <option value="Rajkot">Rajkot</option>
                <option value="Gandhinagar">Gandhinagar</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Locality / Area *</label>
              <input
                type="text"
                required
                value={locality}
                onChange={(e) => setLocality(e.target.value)}
                placeholder="e.g. Maninagar, Alkapuri, SG Highway"
                className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-900"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Wage Amount (₹) *</label>
              <input
                type="number"
                min="50"
                required
                value={wageAmount}
                onChange={(e) => setWageAmount(Number(e.target.value))}
                placeholder="600"
                className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-900 font-bold"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Wage Rate *</label>
              <select
                value={wageType}
                onChange={(e) => setWageType(e.target.value as 'DAILY' | 'FIXED')}
                className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-900 bg-white"
              >
                <option value="DAILY">Daily Wage (/ day)</option>
                <option value="FIXED">Fixed Total Contract</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Job Type *</label>
              <select
                value={jobType}
                onChange={(e) => setJobType(e.target.value)}
                className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-900 bg-white"
              >
                <option value="CONTRACT">Contract</option>
                <option value="TEMPORARY">Temporary</option>
                <option value="FULL_TIME">Full Time</option>
                <option value="PART_TIME">Part Time</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Required Skills (Comma separated) *
            </label>
            <input
              type="text"
              required
              value={skills}
              onChange={(e) => setSkills(e.target.value)}
              placeholder="Electrician, Wiring, Appliance Repair"
              className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-900"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Detailed Job Description *</label>
            <textarea
              rows={4}
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Explain the work required, tools expected, working hours, and any specific preferences..."
              className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-900"
            />
          </div>

          <div className="pt-2 flex justify-end gap-3">
            <Link
              href="/business/jobs"
              className="px-5 py-2.5 rounded-xl text-slate-600 bg-slate-100 font-bold"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white font-bold shadow-md transition-all active:scale-98"
            >
              {loading ? 'Publishing...' : 'Publish Job Listing'}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
