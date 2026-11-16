'use client';

import { toast } from '@/components/ui/Toast';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useApp } from '@/context/AppContext';
import DashboardShell from '@/components/DashboardShell';
import PageHeader from '@/components/ui/PageHeader';
import Button from '@/components/ui/Button';
import Alert from '@/components/ui/Alert';
import { CityInput } from '@/components/ui/CityInput';
import { ArrowLeft, Briefcase } from 'lucide-react';

export default function CreateJobPage() {
  const router = useRouter();
  const { t, language } = useApp();
  const isHi = language === 'hi';

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
        toast.success('Job posting published! Workers nearby can now apply.');
        router.push('/business/jobs');
      }
    } catch {
      setError('An error occurred while creating job posting');
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardShell role="BUSINESS_OWNER">
      <Link
        href="/business/jobs"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted transition-colors hover:text-accent-strong"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden />
        {isHi ? 'नौकरियों पर वापस जाएं' : 'Back to My Jobs'}
      </Link>

      <PageHeader
        title={isHi ? 'नई भर्ती निकालें (नौकरी पोस्ट करें)' : 'Post a New Job Opportunity'}
        description={isHi ? 'अपनी आवश्यकता पोस्ट करें ताकि स्थानीय कारीगर इसे देख सकें और आवेदन कर सकें।' : 'Publish your requirement so local daily workers and tradesmen can discover and apply.'}
        icon={<Briefcase className="h-6 w-6 text-accent" aria-hidden />}
      />

      {error && <Alert tone="error">{error}</Alert>}

      <form onSubmit={handleSubmit} className="ks-card animate-fade-up space-y-5 p-6 sm:p-8">
        <div>
          <label htmlFor="job-title" className="ks-label">
            Job Title *
          </label>
          <input
            id="job-title"
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Electrician for Wiring & Fitting, Delivery Boy, Shop Assistant"
            className="ks-input"
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="job-city" className="ks-label">
              {t.city} *
            </label>
            <CityInput
              id="job-city"
              value={city}
              onChange={setCity}
              required
            />
          </div>

          <div>
            <label htmlFor="job-locality" className="ks-label">
              Locality / Area *
            </label>
            <input
              id="job-locality"
              type="text"
              required
              value={locality}
              onChange={(e) => setLocality(e.target.value)}
              placeholder="e.g. Maninagar, Alkapuri, SG Highway"
              className="ks-input"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <label htmlFor="job-wage" className="ks-label">
              Wage Amount (₹) *
            </label>
            <input
              id="job-wage"
              type="number"
              min="50"
              required
              value={wageAmount}
              onChange={(e) => setWageAmount(Number(e.target.value))}
              placeholder="600"
              className="ks-input font-bold"
            />
          </div>

          <div>
            <label htmlFor="job-wagetype" className="ks-label">
              Wage Rate *
            </label>
            <select
              id="job-wagetype"
              value={wageType}
              onChange={(e) => setWageType(e.target.value as 'DAILY' | 'FIXED')}
              className="ks-select"
            >
              <option value="DAILY">Daily Wage (/ day)</option>
              <option value="FIXED">Fixed Total Contract</option>
            </select>
          </div>

          <div>
            <label htmlFor="job-type" className="ks-label">
              Job Type *
            </label>
            <select
              id="job-type"
              value={jobType}
              onChange={(e) => setJobType(e.target.value)}
              className="ks-select"
            >
              <option value="CONTRACT">Contract</option>
              <option value="TEMPORARY">Temporary</option>
              <option value="FULL_TIME">Full Time</option>
              <option value="PART_TIME">Part Time</option>
            </select>
          </div>
        </div>

        <div>
          <label htmlFor="job-skills" className="ks-label">
            Required Skills (Comma separated) *
          </label>
          <input
            id="job-skills"
            type="text"
            required
            value={skills}
            onChange={(e) => setSkills(e.target.value)}
            placeholder="Electrician, Wiring, Appliance Repair"
            className="ks-input"
          />
          {skills.trim().length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {skills.split(',').map((s, i) =>
                s.trim() ? (
                  <span
                    key={i}
                    className="rounded-md border border-brand-200/70 bg-brand-50 px-2 py-0.5 text-[11px] font-semibold text-ink"
                  >
                    {s.trim()}
                  </span>
                ) : null
              )}
            </div>
          )}
        </div>

        <div>
          <label htmlFor="job-desc" className="ks-label">
            Detailed Job Description *
          </label>
          <textarea
            id="job-desc"
            rows={4}
            required
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Explain the work required, tools expected, working hours, and any specific preferences…"
            className="ks-textarea"
          />
        </div>

        <div className="flex justify-end gap-3 border-t border-line pt-4">
          <Link href="/business/jobs" className="ks-btn ks-btn-secondary">
            Cancel
          </Link>
          <Button type="submit" loading={loading} loadingText="Publishing…">
            Publish Job Listing
          </Button>
        </div>
      </form>
    </DashboardShell>
  );
}
