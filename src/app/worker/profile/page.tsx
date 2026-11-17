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
import { formatDate } from '@/lib/date';
import {
  Save,
  ShieldCheck,
  Star,
  CheckCircle2,
  MessageSquare,
  Briefcase,
  Award,
} from 'lucide-react';
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

  // Ratings & Reviews State
  const [ratingSummary, setRatingSummary] = useState<{
    averageRating: number;
    totalReviews: number;
    completedJobsCount: number;
  }>({ averageRating: 0, totalReviews: 0, completedJobsCount: 0 });

  const [reviews, setReviews] = useState<
    Array<{
      id: string;
      rating: number;
      feedback: string;
      createdAt: string;
      reviewer: { name: string; businesses?: Array<{ name: string; city: string }> };
      assignment: { job: { title: string } };
    }>
  >([]);

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
        if (data.ratingSummary) setRatingSummary(data.ratingSummary);
        if (data.reviews) setReviews(data.reviews);
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
        <div className="space-y-6">
          {/* ───────────────────────────────────────────────────────────
              PUBLIC REPUTATION, RATINGS & TRUST SHOWCASE
             ─────────────────────────────────────────────────────────── */}
          <div className="ks-card p-6 sm:p-7 space-y-5 border-accent/20 bg-gradient-to-br from-surface to-accent/5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-line pb-5">
              <div className="flex items-center gap-3.5">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-accent to-accent-strong text-xl font-black text-accent-fg shadow-md">
                  {name ? name.charAt(0).toUpperCase() : 'W'}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-black text-ink">{name || 'Your Profile'}</h2>
                    <span className="inline-flex items-center gap-1 rounded-md bg-green-500/15 px-2 py-0.5 text-xs font-bold text-green-700 dark:text-green-300">
                      <ShieldCheck className="h-3.5 w-3.5" />
                      {isHi ? 'प्रमाणित हुनर' : 'Verified Artisan'}
                    </span>
                  </div>
                  <p className="text-xs text-muted mt-0.5 flex items-center gap-2">
                    <span>{locality ? `${locality}, ` : ''}{city}</span>
                    <span>•</span>
                    <span className="font-semibold text-accent-strong">{experienceYears} {isHi ? 'वर्ष का अनुभव' : 'Years Experience'}</span>
                  </p>
                </div>
              </div>

              {/* Live Rating Score */}
              <div className="flex items-center gap-3 bg-surface rounded-2xl p-3 border border-line shadow-xs">
                <div className="text-right">
                  <div className="flex items-center gap-1 text-lg font-black text-ink">
                    <Star className="h-5 w-5 fill-amber-500 text-amber-500" />
                    <span>{ratingSummary.averageRating > 0 ? ratingSummary.averageRating.toFixed(1) : '5.0'}</span>
                    <span className="text-xs text-muted font-normal">/ 5.0</span>
                  </div>
                  <p className="text-[11px] font-semibold text-muted">
                    {ratingSummary.totalReviews} {isHi ? 'नियोक्ता समीक्षाएं' : 'Employer Reviews'}
                  </p>
                </div>
              </div>
            </div>

            {/* Quick Trust Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
              <div className="rounded-xl border border-line bg-surface p-3 space-y-0.5">
                <span className="text-muted text-[11px] font-bold uppercase tracking-wider block">
                  {isHi ? 'औसत रेटिंग' : 'Average Rating'}
                </span>
                <span className="text-base font-black text-amber-600 flex items-center gap-1">
                  <Star className="h-4 w-4 fill-amber-500 text-amber-500" />
                  {ratingSummary.averageRating > 0 ? `${ratingSummary.averageRating} / 5` : (isHi ? 'उत्कृष्ट' : '5.0 (Top)')}
                </span>
              </div>

              <div className="rounded-xl border border-line bg-surface p-3 space-y-0.5">
                <span className="text-muted text-[11px] font-bold uppercase tracking-wider block">
                  {isHi ? 'पूरे किए गए काम' : 'Completed Work'}
                </span>
                <span className="text-base font-black text-green-700 dark:text-green-400 flex items-center gap-1">
                  <CheckCircle2 className="h-4 w-4" />
                  {ratingSummary.completedJobsCount} {isHi ? 'असाइनमेंट' : 'Jobs Done'}
                </span>
              </div>

              <div className="col-span-2 sm:col-span-1 rounded-xl border border-line bg-surface p-3 space-y-0.5">
                <span className="text-muted text-[11px] font-bold uppercase tracking-wider block">
                  {isHi ? 'उपलब्धता स्थिति' : 'Work Availability'}
                </span>
                <span className={cn(
                  'text-base font-black flex items-center gap-1.5',
                  availability ? 'text-teal-600 dark:text-teal-400' : 'text-muted'
                )}>
                  <span className={cn('h-2.5 w-2.5 rounded-full', availability ? 'bg-accent animate-pulse' : 'bg-faint')} />
                  {availability ? (isHi ? 'काम के लिए उपलब्ध' : 'Available') : (isHi ? 'व्यस्त' : 'Busy')}
                </span>
              </div>
            </div>

            {/* Employer Reviews & Testimonials Section */}
            <div className="pt-2 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-black text-ink flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-accent" />
                  <span>{isHi ? 'दुकानदारों व मालिकों द्वारा दी गई समीक्षाएं व रेटिंग' : 'Ratings & Reviews from Employers'}</span>
                  <span className="rounded-full bg-accent-soft px-2 py-0.5 text-[10px] font-bold text-accent-strong">
                    {reviews.length}
                  </span>
                </h3>
              </div>

              {reviews.length === 0 ? (
                <div className="rounded-xl border border-dashed border-line bg-subtle/50 p-5 text-center text-xs text-muted space-y-1">
                  <Star className="h-6 w-6 text-amber-400/50 mx-auto" />
                  <p className="font-semibold text-ink-soft">
                    {isHi ? 'अभी तक कोई समीक्षा नहीं मिली है।' : 'No employer ratings or reviews received yet.'}
                  </p>
                  <p className="text-[11px]">
                    {isHi
                      ? 'जब कोई दुकानदार आपका सौंपा गया काम पूरा होने पर समीक्षा देगा, वह यहाँ आपकी सार्वजनिक प्रोफ़ाइल पर दिखेगी।'
                      : 'When an employer marks your assigned work as completed and rates you, their review and feedback will show up here.'}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {reviews.map((rev) => (
                    <div
                      key={rev.id}
                      className="rounded-xl border border-line bg-surface p-4 text-xs space-y-2 shadow-xs transition-all hover:border-accent/40"
                    >
                      <div className="flex items-start justify-between gap-2 border-b border-line pb-2">
                        <div>
                          <p className="font-bold text-ink">
                            {rev.reviewer?.name || 'Local Employer'}
                            {rev.reviewer?.businesses?.[0]?.name && (
                              <span className="text-[11px] font-normal text-muted">
                                {' '}({rev.reviewer.businesses[0].name})
                              </span>
                            )}
                          </p>
                          <p className="text-[10px] text-muted flex items-center gap-1 mt-0.5">
                            <Briefcase className="h-3 w-3 text-accent" />
                            <span>{rev.assignment?.job?.title || 'Work Assignment'}</span>
                          </p>
                        </div>
                        <div className="flex items-center gap-0.5 rounded-md bg-amber-500/15 px-2 py-0.5 text-xs font-bold text-amber-700 dark:text-amber-400 shrink-0">
                          <Star className="h-3 w-3 fill-amber-500 text-amber-500" />
                          <span>{rev.rating}/5</span>
                        </div>
                      </div>

                      <p className="text-ink-soft italic leading-relaxed">
                        &ldquo;{rev.feedback}&rdquo;
                      </p>

                      <p className="text-[10px] text-muted text-right">
                        {formatDate(rev.createdAt)}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ───────────────────────────────────────────────────────────
              EDIT PROFILE FORM
             ─────────────────────────────────────────────────────────── */}
          <form onSubmit={handleSubmit} className="ks-card animate-fade-up space-y-6 p-6 sm:p-8">
            <div className="border-b border-line pb-3">
              <h3 className="text-base font-bold text-ink">
                {isHi ? 'प्रोफ़ाइल व हुनर विवरण संपादित करें' : 'Edit Profile & Skill Details'}
              </h3>
              <p className="text-xs text-muted mt-0.5">
                {isHi ? 'मालिकों को आकर्षित करने के लिए अपने हुनर और अनुभव को अपडेट रखें।' : 'Keep your trades, skills, and experience fresh for local shopkeepers.'}
              </p>
            </div>
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
      </div>
      )}
    </DashboardShell>
  );
}
