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
import {
  Store,
  User,
  MapPin,
  Save,
  ShieldCheck,
  QrCode,
  Phone,
  Mail,
} from 'lucide-react';
import { Language } from '@/lib/i18n';

const BUSINESS_CATEGORIES = [
  'Kirana & Grocery Store',
  'Electricals & Hardware',
  'Dairy, Milk & Bakery',
  'Tea Stall & Fast Food',
  'Textiles & Readymade Garments',
  'Building & Construction Supplies',
  'Automobile Repair & Spare Parts',
  'Stationery & Mobile Accessories',
  'Medical & Pharmacy Store',
  'General Merchant & Retail',
];

export default function BusinessSettingsPage() {
  const { user, refreshUser, t, language, setLanguage } = useApp();
  const isHi = language === 'hi';

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Business form state
  const [businessName, setBusinessName] = useState('');
  const [category, setCategory] = useState(BUSINESS_CATEGORIES[0]);
  const [customCategory, setCustomCategory] = useState('');
  const [isCustomCategory, setIsCustomCategory] = useState(false);
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('Ahmedabad');
  const [locality, setLocality] = useState('');
  const [address, setAddress] = useState('');
  const [upiId, setUpiId] = useState('');
  const [description, setDescription] = useState('');

  // Owner personal profile state
  const [ownerName, setOwnerName] = useState('');
  const [ownerEmail, setOwnerEmail] = useState('');
  const [preferredLang, setPreferredLang] = useState<Language>('en');

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/business/settings');
      const data = await res.json();
      if (data.business) {
        const b = data.business;
        setBusinessName(b.name || '');
        if (BUSINESS_CATEGORIES.includes(b.category)) {
          setCategory(b.category);
          setIsCustomCategory(false);
        } else {
          setCategory('OTHER');
          setCustomCategory(b.category || '');
          setIsCustomCategory(true);
        }
        setPhone(b.phone || user?.phone || '');
        setCity(b.city || 'Ahmedabad');
        setLocality(b.locality || '');
        setAddress(b.address || '');
        setUpiId(b.upiId || '');
        setDescription(b.description || '');
      }

      if (data.user) {
        const u = data.user;
        setOwnerName(u.name || '');
        setOwnerEmail(u.email || '');
        setPreferredLang((u.preferredLanguage as Language) || 'en');
      }
    } catch (err) {
      console.error('Error loading business settings:', err);
      setFeedback({
        type: 'error',
        message: isHi ? 'सेटिंग्स लोड करने में विफल।' : 'Failed to load settings from server.',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setFeedback(null);

    const finalCategory = isCustomCategory ? customCategory.trim() || 'General Merchant' : category;

    try {
      const res = await fetch('/api/business/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: businessName,
          category: finalCategory,
          phone,
          city,
          locality,
          address,
          upiId,
          description,
          ownerName,
          ownerEmail,
          preferredLanguage: preferredLang,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update settings');
      }

      const successMsg = isHi
        ? 'दुकानदार प्रोफ़ाइल और व्यापार सेटिंग्स सफलतापूर्वक सहेजी गईं!'
        : 'Merchant profile and business settings saved successfully!';
      setFeedback({
        type: 'success',
        message: successMsg,
      });
      toast.success(successMsg);

      // Update app language if user changed preferred language
      if (preferredLang !== language) {
        setLanguage(preferredLang);
      }

      // Sync user context
      refreshUser();
    } catch (err: unknown) {
      setFeedback({
        type: 'error',
        message: err instanceof Error ? err.message : (isHi ? 'सहेजने में त्रुटि हुई।' : 'Error saving settings.'),
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardShell role="BUSINESS_OWNER">
      <PageHeader
        title={isHi ? 'दुकानदार प्रोफ़ाइल व सेटिंग्स' : 'Merchant Profile & Business Settings'}
        description={
          isHi
            ? 'अपनी दुकान का नाम, श्रेणी, पता, संपर्क नंबर और मालिक की प्रोफ़ाइल संपादित करें।'
            : 'Edit your registered store details, pan-India location, payment ID, and owner profile.'
        }
      />

      {feedback && <Alert tone={feedback.type}>{feedback.message}</Alert>}

      {loading ? (
        <DashboardSkeleton cards={0} />
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* ───────────────────────────────────────────────────────────
              SECTION 1: BUSINESS / SHOP INFORMATION
             ─────────────────────────────────────────────────────────── */}
          <div className="ks-card p-6 sm:p-8 space-y-6">
            <div className="flex items-center gap-2.5 border-b border-line pb-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent-soft text-accent-strong">
                <Store className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-ink">
                  {isHi ? 'दुकान व व्यवसाय की जानकारी' : 'Store & Business Information'}
                </h2>
                <p className="text-xs text-muted">
                  {isHi
                    ? 'यह जानकारी आपके ग्राहकों और नौकरी के आवेदकों को दिखाई देती है।'
                    : 'Visible on customer bills, receipts, and public job postings.'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="biz-name" className="ks-label">
                  {isHi ? 'दुकान / व्यापार का नाम *' : 'Shop / Business Name *'}
                </label>
                <input
                  id="biz-name"
                  type="text"
                  required
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  placeholder="e.g. Sharma Electricals & Hardware, Patel Kirana"
                  className="ks-input"
                />
              </div>

              <div>
                <label htmlFor="biz-category" className="ks-label">
                  {isHi ? 'व्यापार श्रेणी *' : 'Business Category *'}
                </label>
                <select
                  id="biz-category"
                  value={isCustomCategory ? 'OTHER' : category}
                  onChange={(e) => {
                    if (e.target.value === 'OTHER') {
                      setIsCustomCategory(true);
                    } else {
                      setIsCustomCategory(false);
                      setCategory(e.target.value);
                    }
                  }}
                  className="ks-select"
                >
                  {BUSINESS_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                  <option value="OTHER">{isHi ? '+ अन्य श्रेणी दर्ज करें...' : '+ Other Custom Category...'}</option>
                </select>

                {isCustomCategory && (
                  <input
                    type="text"
                    required
                    value={customCategory}
                    onChange={(e) => setCustomCategory(e.target.value)}
                    placeholder={isHi ? 'अपनी व्यापार श्रेणी लिखें...' : 'Type custom business category...'}
                    className="ks-input mt-2"
                    autoFocus
                  />
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="biz-phone" className="ks-label">
                  {isHi ? 'काउंटर संपर्क फोन *' : 'Business Contact Phone *'}
                </label>
                <div className="relative">
                  <Phone className="pointer-events-none absolute top-3 left-3 h-4 w-4 text-muted" />
                  <input
                    id="biz-phone"
                    type="tel"
                    required
                    maxLength={10}
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                    placeholder="9876543210"
                    className="ks-input pl-9"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="biz-upi" className="ks-label">
                  {isHi ? 'दुकान यूपीआई आईडी (वैकल्पिक)' : 'Store UPI ID (For Digital Payments)'}
                </label>
                <div className="relative">
                  <QrCode className="pointer-events-none absolute top-3 left-3 h-4 w-4 text-accent" />
                  <input
                    id="biz-upi"
                    type="text"
                    value={upiId}
                    onChange={(e) => setUpiId(e.target.value)}
                    placeholder="shopname@okhdfcbank"
                    className="ks-input pl-9"
                  />
                </div>
                <p className="mt-1 text-[11px] text-muted">
                  {isHi
                    ? 'उधार भुगतान और काउंटर बिलिंग के लिए स्वचालित क्यूआर कोड बनाएगा।'
                    : 'Generates instant payment QR links for sales and Udhaar collections.'}
                </p>
              </div>
            </div>

            <div>
              <label htmlFor="biz-desc" className="ks-label">
                {isHi ? 'दुकान का विवरण / कार्य समय' : 'Store Description / Working Hours'}
              </label>
              <textarea
                id="biz-desc"
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={isHi ? 'उदा. प्रतिदिन प्रातः 8:00 से रात्रि 10:00 तक खुली रहती है।' : 'e.g. Open daily 8:00 AM - 10:00 PM. All construction hardware and plumbing supplies available.'}
                className="ks-textarea"
              />
            </div>
          </div>

          {/* ───────────────────────────────────────────────────────────
              SECTION 2: LOCATION & PAN-INDIA ADDRESS
             ─────────────────────────────────────────────────────────── */}
          <div className="ks-card p-6 sm:p-8 space-y-6">
            <div className="flex items-center gap-2.5 border-b border-line pb-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent-soft text-accent-strong">
                <MapPin className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-ink">
                  {isHi ? 'स्थान व दुकान का पता' : 'Store Location & Pan-India Address'}
                </h2>
                <p className="text-xs text-muted">
                  {isHi
                    ? 'भारत का कोई भी शहर चुनें ताकि स्थानीय कारीगर आपकी दुकान आसानी से खोज सकें।'
                    : 'Enables nearby skilled workers to discover jobs within your locality.'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="biz-city" className="ks-label">
                  {t.city} *
                </label>
                <CityInput
                  id="biz-city"
                  value={city}
                  onChange={setCity}
                  required
                />
              </div>

              <div>
                <label htmlFor="biz-locality" className="ks-label">
                  {isHi ? 'इलाका / क्षेत्र *' : 'Locality / Area *'}
                </label>
                <input
                  id="biz-locality"
                  type="text"
                  required
                  value={locality}
                  onChange={(e) => setLocality(e.target.value)}
                  placeholder="e.g. Maninagar, Alkapuri, SG Highway, Andheri"
                  className="ks-input"
                />
              </div>
            </div>

            <div>
              <label htmlFor="biz-addr" className="ks-label">
                {isHi ? 'दुकान का पूरा पता *' : 'Full Street / Shop Address *'}
              </label>
              <input
                id="biz-addr"
                type="text"
                required
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="e.g. Shop 4-5, Ground Floor, Shrinath Complex, Main Market Road"
                className="ks-input"
              />
            </div>
          </div>

          {/* ───────────────────────────────────────────────────────────
              SECTION 3: OWNER PERSONAL PROFILE & PREFERENCES
             ─────────────────────────────────────────────────────────── */}
          <div className="ks-card p-6 sm:p-8 space-y-6">
            <div className="flex items-center gap-2.5 border-b border-line pb-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent-soft text-accent-strong">
                <User className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-ink">
                  {isHi ? 'मालिक की प्रोफ़ाइल व खाता प्राथमिकताएं' : 'Owner Profile & Account Preferences'}
                </h2>
                <p className="text-xs text-muted">
                  {isHi ? 'व्यापार स्वामी की व्यक्तिगत साख और भाषा सेटिंग्स।' : 'Personal credentials and preferred interface language.'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="owner-name" className="ks-label">
                  {isHi ? 'मालिक का पूरा नाम *' : 'Owner Full Name *'}
                </label>
                <input
                  id="owner-name"
                  type="text"
                  required
                  value={ownerName}
                  onChange={(e) => setOwnerName(e.target.value)}
                  className="ks-input"
                />
              </div>

              <div>
                <label htmlFor="owner-phone" className="ks-label">
                  {isHi ? 'पंजीकृत मोबाइल नंबर (सत्यापित)' : 'Registered Mobile Number (Verified)'}
                </label>
                <div className="relative">
                  <input
                    id="owner-phone"
                    type="text"
                    disabled
                    value={user?.phone || phone}
                    className="ks-input bg-subtle text-muted cursor-not-allowed pr-24"
                  />
                  <span className="absolute top-2.5 right-3 inline-flex items-center gap-1 rounded bg-green-500/10 px-2 py-0.5 text-[10px] font-bold text-green-700 dark:text-green-400">
                    <ShieldCheck className="h-3 w-3" />
                    {isHi ? 'सत्यापित' : 'Verified'}
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="owner-email" className="ks-label">
                  {isHi ? 'ईमेल पता (वैकल्पिक)' : 'Email Address (Optional)'}
                </label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute top-3 left-3 h-4 w-4 text-muted" />
                  <input
                    id="owner-email"
                    type="email"
                    value={ownerEmail}
                    onChange={(e) => setOwnerEmail(e.target.value)}
                    placeholder="merchant@example.com"
                    className="ks-input pl-9"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="pref-lang" className="ks-label">
                  {isHi ? 'पसंदीदा इंटरफ़ेस भाषा' : 'Preferred Interface Language'}
                </label>
                <select
                  id="pref-lang"
                  value={preferredLang}
                  onChange={(e) => setPreferredLang(e.target.value as Language)}
                  className="ks-select"
                >
                  <option value="en">English (Default)</option>
                  <option value="hi">हिंदी (Hindi)</option>
                </select>
              </div>
            </div>
          </div>

          {/* ───────────────────────────────────────────────────────────
              BOTTOM SUBMIT ACTION
             ─────────────────────────────────────────────────────────── */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <Button
              type="submit"
              variant="primary"
              size="lg"
              disabled={saving}
              className="px-8 shadow-sm"
            >
              <Save className="h-4 w-4" />
              <span>
                {saving
                  ? isHi ? 'सहेजा जा रहा है...' : 'Saving Changes...'
                  : isHi ? 'परिवर्तन सहेजें' : 'Save Profile Changes'}
              </span>
            </Button>
          </div>
        </form>
      )}
    </DashboardShell>
  );
}
