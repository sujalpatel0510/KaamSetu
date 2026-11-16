'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import DashboardShell from '@/components/DashboardShell';
import PageHeader from '@/components/ui/PageHeader';
import Button from '@/components/ui/Button';
import Alert from '@/components/ui/Alert';
import { toast } from '@/components/ui/Toast';
import { DashboardSkeleton } from '@/components/ui/Skeleton';
import { CityInput } from '@/components/ui/CityInput';
import { Save, ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/cn';

export default function WorkerProfilePage() {
  const { user, refreshUser, t, language } = useApp();
  const isHi = language === 'hi';

  const [name, setName] = useState('');
  const [city, setCity] = useState('Ahmedabad');
  const [locality, setLocality] = useState('');
  const [skills, setSkills] = useState('');
  const [experienceYears, setExperienceYears] = useState(0);
  const [description, setDescription] = useState('');
  const [workVideoUrl, setWorkVideoUrl] = useState('');
  const [availability, setAvailability] = useState(true);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  useEffect(() => {
    fetch('/api/worker/profile')
      .then((res) => res.json())
      .then((data) => {
        if (data.profile) {
          const p = data.profile;
          setName(p.user?.name || '');
          setCity(p.city || 'Ahmedabad');
          setLocality(p.locality || '');
          setSkills((p.skills || []).join(', '));
          setExperienceYears(p.experienceYears || 0);
          setDescription(p.description || '');
          setWorkVideoUrl(p.workVideoUrl || '');
          setAvailability(p.availability !== undefined ? p.availability : true);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setFeedback(null);

    try {
      const res = await fetch('/api/worker/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          city,
          locality,
          skills: skills.split(',').map((s) => s.trim()).filter(Boolean),
          experienceYears: Number(experienceYears),
          description,
          workVideoUrl,
          availability,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setFeedback({ type: 'error', message: data.error || 'Failed to update profile' });
        toast.error(data.error || 'Failed to update profile');
      } else {
        await refreshUser();
        const successMsg = isHi ? 'कारीगर प्रोफ़ाइल सफलतापूर्वक सहेजी गई!' : 'Profile saved successfully!';
        setFeedback({ type: 'success', message: successMsg });
        toast.success(successMsg);
      }
    } catch {
      setFeedback({ type: 'error', message: 'Network error updating profile' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardShell role="WORKER">
      <PageHeader
        title={isHi ? 'कारीगर डिजिटल हुनर प्रोफ़ाइल' : 'Worker Skill Profile'}
        description={isHi ? 'अपने हुनर, स्थान और उपलब्धता को अद्यतन रखें ताकि स्थानीय मालिक आपको काम दे सकें।' : 'Keep your skills, location, and availability up to date so local employers can find you.'}
      />

      {feedback && <Alert tone={feedback.type}>{feedback.message}</Alert>}

      {loading ? (
        <DashboardSkeleton cards={0} />
      ) : (
        <form onSubmit={handleSubmit} className="ks-card animate-fade-up space-y-6 p-6 sm:p-8">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="wp-name" className="ks-label">
                Full Name
              </label>
              <input
                id="wp-name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="ks-input"
              />
            </div>

            <div>
              <label htmlFor="wp-phone" className="ks-label">
                Mobile Phone (Verified)
              </label>
              <input
                id="wp-phone"
                type="text"
                disabled
                value={user?.phone || ''}
                className="ks-input"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="wp-city" className="ks-label">
                {t.city}
              </label>
              <CityInput
                id="wp-city"
                value={city}
                onChange={setCity}
                required
              />
            </div>

            <div>
              <label htmlFor="wp-locality" className="ks-label">
                Locality / Area
              </label>
              <input
                id="wp-locality"
                type="text"
                required
                value={locality}
                onChange={(e) => setLocality(e.target.value)}
                placeholder="e.g. Maninagar, Vastrapur"
                className="ks-input"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="wp-skills" className="ks-label">
                Skills & Trades (Comma separated)
              </label>
              <input
                id="wp-skills"
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
              <label htmlFor="wp-exp" className="ks-label">
                Experience in Years
              </label>
              <input
                id="wp-exp"
                type="number"
                min="0"
                value={experienceYears}
                onChange={(e) => setExperienceYears(Number(e.target.value))}
                className="ks-input"
              />
            </div>
          </div>

          <div>
            <label htmlFor="wp-video" className="ks-label">
              15-Second Work Craftsmanship Video Link (Labor Verification)
            </label>
            <input
              id="wp-video"
              type="url"
              value={workVideoUrl}
              onChange={(e) => setWorkVideoUrl(e.target.value)}
              placeholder="e.g. https://youtu.be/... or Google Drive video link of welding/wiring"
              className="ks-input"
            />
            <p className="mt-1 flex items-center gap-1 text-[11px] text-accent-strong">
              <ShieldCheck className="h-3 w-3" aria-hidden />
              Employers can verify your skill directly from this video — no English resume needed.
            </p>
          </div>

          <div>
            <label htmlFor="wp-desc" className="ks-label">
              Short Description / Past Work
            </label>
            <textarea
              id="wp-desc"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Briefly describe your specialization, tools you carry, etc."
              className="ks-textarea"
            />
          </div>

          {/* Availability toggle */}
          <div className="flex items-center justify-between rounded-2xl border border-brand-200/70 bg-brand-50/60 p-4">
            <div>
              <p className="text-xs font-bold text-ink">
                Current Availability for Work
              </p>
              <p className="text-[11px] text-accent-strong">
                {availability
                  ? 'Available for new daily or contract jobs'
                  : 'Currently busy / unavailable'}
              </p>
            </div>
            <label className="relative inline-flex cursor-pointer items-center">
              <input
                type="checkbox"
                checked={availability}
                onChange={(e) => setAvailability(e.target.checked)}
                className="sr-only peer"
                aria-label="Available for work"
              />
              <div
                className={cn(
                  'peer h-6 w-11 rounded-full bg-line-strong transition-all',
                  'after:absolute after:top-[2px] after:left-[2px] after:h-5 after:w-5 after:rounded-full after:bg-surface after:shadow-sm after:transition-all',
                  'peer-checked:bg-accent peer-checked:after:translate-x-full',
                  'peer-focus-visible:ring-4 peer-focus-visible:ring-accent/30'
                )}
              />
            </label>
          </div>

          <div className="flex justify-end border-t border-line pt-4">
            <Button
              type="submit"
              loading={saving}
              loadingText="Saving…"
            >
              <Save className="h-4 w-4" aria-hidden />
              Save Profile Changes
            </Button>
          </div>
        </form>
      )}
    </DashboardShell>
  );
}
