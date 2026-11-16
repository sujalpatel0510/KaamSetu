'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useApp } from '@/context/AppContext';
import DashboardShell from '@/components/DashboardShell';
import PageHeader from '@/components/ui/PageHeader';
import Button from '@/components/ui/Button';
import Alert from '@/components/ui/Alert';
import { toast } from '@/components/ui/Toast';
import { DashboardSkeleton } from '@/components/ui/Skeleton';
import { CityInput } from '@/components/ui/CityInput';
import {
  User,
  Phone,
  Mail,
  MapPin,
  Lock,
  Globe,
  Briefcase,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Eye,
  EyeOff,
  ArrowRight,
} from 'lucide-react';
import { Language } from '@/lib/i18n';

export default function WorkerSettingsPage() {
  const { refreshUser, setLanguage, language } = useApp();
  const isHi = language === 'hi';

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [preferredLang, setPreferredLang] = useState<Language>('hi');
  const [city, setCity] = useState('Ahmedabad');
  const [locality, setLocality] = useState('');
  const [availability, setAvailability] = useState(true);
  const [experienceYears, setExperienceYears] = useState(0);
  const [description, setDescription] = useState('');
  const [workVideoUrl, setWorkVideoUrl] = useState('');
  const [skills, setSkills] = useState<string[]>([]);

  // Password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    fetch('/api/worker/settings')
      .then((res) => res.json())
      .then((data) => {
        if (data.user) {
          setName(data.user.name || '');
          setPhone(data.user.phone || '');
          setEmail(data.user.email || '');
          if (data.user.preferredLanguage) {
            setPreferredLang(data.user.preferredLanguage as Language);
          }
        }
        if (data.workerProfile) {
          const wp = data.workerProfile;
          setCity(wp.city || 'Ahmedabad');
          setLocality(wp.locality || '');
          setAvailability(wp.availability !== undefined ? wp.availability : true);
          setExperienceYears(wp.experienceYears || 0);
          setDescription(wp.description || '');
          setWorkVideoUrl(wp.workVideoUrl || '');
          setSkills(wp.skills || []);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setFeedback(null);

    if (newPassword && newPassword !== confirmPassword) {
      setFeedback({
        type: 'error',
        message: isHi ? 'नया पासवर्ड और पुष्टि पासवर्ड मेल नहीं खाते' : 'New password and confirm password do not match',
      });
      setSaving(false);
      return;
    }

    try {
      const res = await fetch('/api/worker/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          preferredLanguage: preferredLang,
          city,
          locality,
          availability,
          experienceYears: Number(experienceYears),
          description,
          workVideoUrl,
          currentPassword: currentPassword || undefined,
          newPassword: newPassword || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setFeedback({
          type: 'error',
          message: data.error || (isHi ? 'सेटिंग्स सहेजने में विफल' : 'Failed to update settings'),
        });
        toast.error(data.error || (isHi ? 'सेटिंग्स सहेजने में विफल' : 'Failed to update settings'));
      } else {
        await refreshUser();
        setLanguage(preferredLang);
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        toast.success(isHi ? 'कारीगर प्रोफ़ाइल और सेटिंग्स सफलतापूर्वक सहेजी गईं!' : 'Worker profile & settings saved successfully!');
        setFeedback({
          type: 'success',
          message: isHi ? 'कारीगर प्रोफ़ाइल और सेटिंग्स सफलतापूर्वक सहेज ली गईं!' : 'Worker profile & settings saved successfully!',
        });
      }
    } catch {
      setFeedback({
        type: 'error',
        message: isHi ? 'नेटवर्क त्रुटि हुई, कृपया पुनः प्रयास करें' : 'Network error updating settings',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardShell role="WORKER">
      <PageHeader
        title={isHi ? 'कारीगर खाता व सेटिंग्स' : 'Worker Account & Settings'}
        description={
          isHi
            ? 'अपनी प्रोफ़ाइल जानकारी, शहर, दैनिक उपलब्धता स्थिति और खाता सुरक्षा प्रबंधित करें।'
            : 'Manage your profile credentials, pan-India location, daily work availability, and security.'
        }
      />

      {feedback && <Alert tone={feedback.type}>{feedback.message}</Alert>}

      {loading ? (
        <DashboardSkeleton cards={2} />
      ) : (
        <form onSubmit={handleSave} className="space-y-6">
          {/* Quick Trade Profile Cross-Link Card */}
          <div className="ks-card p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-linear-to-r from-accent-soft/50 to-subtle border-accent/20">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent text-accent-fg font-black">
                <Briefcase className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-ink">
                  {isHi ? 'डिजिटल हुनर प्रोफ़ाइल' : 'Digital Skill & Trade Profile'}
                </h3>
                <p className="text-xs text-muted">
                  {skills.length > 0
                    ? `${isHi ? 'पंजीकृत हुनर:' : 'Registered Trades:'} ${skills.join(', ')}`
                    : isHi ? 'मालिकों को आकर्षित करने के लिए अपने हुनर और अनुभव जोड़ें' : 'Add your trades and portfolio to get hired faster'}
                </p>
              </div>
            </div>
            <Link
              href="/worker/profile"
              className="inline-flex items-center gap-1.5 rounded-xl bg-surface hover:bg-hover text-accent border border-line px-3.5 py-2 text-xs font-bold transition-colors shrink-0"
            >
              <span>{isHi ? 'हुनर व वीडियो संपादित करें' : 'Edit Skills & Trades'}</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {/* Section 1: Personal & Contact Information (Edit Profile) */}
          <div className="ks-card p-6 space-y-5">
            <div className="flex items-center gap-3 border-b border-line pb-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent-soft text-accent">
                <User className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-ink">
                  {isHi ? 'व्यक्तिगत जानकारी (Edit Profile)' : 'Personal Information (Edit Profile)'}
                </h2>
                <p className="text-xs text-muted">
                  {isHi ? 'मालिकों और आवेदन रिकॉर्ड में दिखने वाला आपका आधिकारिक नाम' : 'Your official identity shown to employers and on applications'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="worker-name" className="ks-label">
                  {isHi ? 'कारीगर का पूरा नाम *' : 'Full Legal Name *'}
                </label>
                <input
                  id="worker-name"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Ramesh Kumar, Suresh Vaghela"
                  className="ks-input"
                />
              </div>

              <div>
                <label htmlFor="worker-phone" className="ks-label">
                  {isHi ? 'पंजीकृत मोबाइल नंबर (लॉगिन आईडी)' : 'Registered Mobile Number (Login ID)'}
                </label>
                <div className="relative">
                  <Phone className="pointer-events-none absolute top-3 left-3 h-4 w-4 text-muted" />
                  <input
                    id="worker-phone"
                    type="tel"
                    disabled
                    value={phone}
                    className="ks-input pl-9 bg-subtle cursor-not-allowed text-muted"
                  />
                  <span className="absolute right-2.5 top-2.5 inline-flex items-center gap-1 text-[10px] font-bold text-green-700 bg-green-500/10 px-2 py-0.5 rounded-md">
                    <ShieldCheck className="h-3 w-3" />
                    {isHi ? 'सत्यापित' : 'Verified'}
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="worker-email" className="ks-label">
                  {isHi ? 'ईमेल पता (वैकल्पिक)' : 'Email Address (Optional)'}
                </label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute top-3 left-3 h-4 w-4 text-muted" />
                  <input
                    id="worker-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="ramesh.worker@gmail.com"
                    className="ks-input pl-9"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="worker-lang" className="ks-label">
                  {isHi ? 'पसंदीदा ऐप भाषा *' : 'Preferred App Language *'}
                </label>
                <div className="relative">
                  <Globe className="pointer-events-none absolute top-3 left-3 h-4 w-4 text-muted" />
                  <select
                    id="worker-lang"
                    value={preferredLang}
                    onChange={(e) => setPreferredLang(e.target.value as Language)}
                    className="ks-select pl-9"
                  >
                    <option value="hi">हिन्दी (Hindi)</option>
                    <option value="en">English (English)</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Pan-India Location & Working Radius */}
          <div className="ks-card p-6 space-y-5">
            <div className="flex items-center gap-3 border-b border-line pb-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600">
                <MapPin className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-ink">
                  {isHi ? 'कार्य स्थान व प्राथमिक शहर (Pan-India)' : 'Work Location & Primary City (Pan-India)'}
                </h2>
                <p className="text-xs text-muted">
                  {isHi ? 'भारत के किसी भी शहर में अपनी उपस्थिति दर्ज करें जहां आप काम करना चाहते हैं' : 'Set your home base to get jobs matched in your immediate locality across India'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="worker-city" className="ks-label">
                  {isHi ? 'प्राथमिक शहर (Any City in India) *' : 'Primary City (Any City in India) *'}
                </label>
                <CityInput
                  id="worker-city"
                  value={city}
                  onChange={(val) => setCity(val)}
                  placeholder={isHi ? 'उदा. Ahmedabad, Surat, Anand, Mumbai...' : 'e.g. Ahmedabad, Surat, Anand, Mumbai...'}
                />
              </div>

              <div>
                <label htmlFor="worker-locality" className="ks-label">
                  {isHi ? 'इलाका / मोहल्ला / क्षेत्र *' : 'Locality / Area / Ward *'}
                </label>
                <input
                  id="worker-locality"
                  type="text"
                  required
                  value={locality}
                  onChange={(e) => setLocality(e.target.value)}
                  placeholder="e.g. Maninagar, Alkapuri, Varachha"
                  className="ks-input"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Daily Availability & Work Preferences */}
          <div className="ks-card p-6 space-y-5">
            <div className="flex items-center gap-3 border-b border-line pb-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-green-500/10 text-green-600">
                <Clock className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-ink">
                  {isHi ? 'दैनिक उपलब्धता व कार्य स्थिति' : 'Daily Availability & Work Status'}
                </h2>
                <p className="text-xs text-muted">
                  {isHi ? 'जब आप उपलब्ध हों तो स्थानीय मालिक आपको सीधे कॉल और हायर कर सकते हैं' : 'Controls whether employers see you as available for immediate hiring today'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="flex items-center justify-between rounded-xl border border-line bg-subtle/50 p-4">
                <div>
                  <p className="text-xs font-bold text-ink">
                    {isHi ? 'काम के लिए उपलब्धता स्थिति' : 'Work Availability Status'}
                  </p>
                  <p className="text-[11px] text-muted">
                    {availability
                      ? isHi ? '• सक्रिय: आज नए काम के लिए उपलब्ध' : '• Active: Available for work today'
                      : isHi ? '• व्यस्त: वर्तमान में दूसरे काम पर हैं' : '• Busy: Currently engaged or on leave'}
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={availability}
                    onChange={(e) => setAvailability(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                </label>
              </div>

              <div>
                <label htmlFor="worker-exp" className="ks-label">
                  {isHi ? 'काम का कुल अनुभव (वर्ष)' : 'Total Trade Experience (Years)'}
                </label>
                <input
                  id="worker-exp"
                  type="number"
                  min="0"
                  max="50"
                  value={experienceYears}
                  onChange={(e) => setExperienceYears(Number(e.target.value))}
                  className="ks-input"
                />
              </div>
            </div>
          </div>

          {/* Section 4: Account Security & Password Change */}
          <div className="ks-card p-6 space-y-5">
            <div className="flex items-center gap-3 border-b border-line pb-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600">
                <Lock className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-ink">
                  {isHi ? 'खाता सुरक्षा व पासवर्ड बदलें' : 'Account Security & Password'}
                </h2>
                <p className="text-xs text-muted">
                  {isHi ? 'पासवर्ड तभी दर्ज करें जब आप उसे बदलना चाहते हों' : 'Leave empty if you do not want to change your password'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <label htmlFor="curr-pass" className="ks-label">
                  {isHi ? 'वर्तमान पासवर्ड' : 'Current Password'}
                </label>
                <input
                  id="curr-pass"
                  type={showPassword ? 'text' : 'password'}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="••••••••"
                  className="ks-input"
                />
              </div>

              <div>
                <label htmlFor="new-pass" className="ks-label">
                  {isHi ? 'नया पासवर्ड' : 'New Password'}
                </label>
                <input
                  id="new-pass"
                  type={showPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  className="ks-input"
                />
              </div>

              <div>
                <label htmlFor="conf-pass" className="ks-label">
                  {isHi ? 'नए पासवर्ड की पुष्टि' : 'Confirm New Password'}
                </label>
                <div className="relative">
                  <input
                    id="conf-pass"
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="ks-input pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2.5 top-2.5 text-muted hover:text-ink"
                    title={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <Link
              href="/worker/dashboard"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-line bg-surface hover:bg-hover px-5 py-2.5 text-sm font-semibold text-ink-soft transition-colors"
            >
              {isHi ? 'रद्द करें' : 'Cancel'}
            </Link>

            <Button
              type="submit"
              loading={saving}
              loadingText={isHi ? 'सहेजा जा रहा है...' : 'Saving...'}
              size="lg"
              className="px-8"
            >
              <CheckCircle2 className="h-4 w-4" />
              <span>{isHi ? 'सेटिंग्स सहेजें' : 'Save Settings'}</span>
            </Button>
          </div>
        </form>
      )}
    </DashboardShell>
  );
}
