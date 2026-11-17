'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import PageHeader from '@/components/ui/PageHeader';
import Button from '@/components/ui/Button';
import { toast } from '@/components/ui/Toast';
import {
  Settings,
  Shield,
  Save,
  Sliders,
  BellRing,
  Globe,
  Database,
  CheckCircle2,
} from 'lucide-react';

export default function AdminSettingsPage() {
  const { language, user } = useApp();
  const isHi = language === 'hi';

  const [platformFee, setPlatformFee] = useState('0');
  const [allowPublicRegistrations, setAllowPublicRegistrations] = useState(true);
  const [requireIdVerification, setRequireIdVerification] = useState(true);
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      toast.success(isHi ? 'व्यवस्थापक सेटिंग्स सहेज ली गईं।' : 'Platform configurations updated successfully.');
    }, 600);
  };

  return (
    <div className="space-y-6 pb-12 w-full max-w-full">
      <PageHeader
        title={isHi ? 'प्लेटफ़ॉर्म सेटिंग्स' : 'Platform Settings & Governance'}
        description={
          isHi
            ? 'कामसेतु प्लेटफ़ॉर्म के वैश्विक पैरामीटर, सत्यापन नीतियां और सिस्टम कॉन्फ़िगरेशन प्रबंधित करें।'
            : 'Configure global platform policies, verification strictness, fee schedules, and governance toggles.'
        }
      />

      <div className="max-w-3xl">
        <form onSubmit={handleSave} className="space-y-6">
          {/* Identity & Policy */}
          <div className="ks-card p-6 space-y-4">
            <div className="flex items-center gap-2 border-b border-line pb-3">
              <Shield className="h-5 w-5 text-accent" />
              <h2 className="text-base font-black text-ink">
                {isHi ? 'सत्यापन व सुरक्षा नीतियां' : 'Trust, Safety & Verification Policies'}
              </h2>
            </div>

            <div className="flex items-center justify-between py-2 border-b border-line/60">
              <div>
                <p className="font-bold text-xs text-ink">
                  {isHi ? 'कारीगरों के लिए अनिवार्य आईडी सत्यापन' : 'Mandatory Worker ID Verification'}
                </p>
                <p className="text-[11px] text-muted">
                  {isHi
                    ? 'नौकरियों पर आवेदन करने से पहले आधार / मतदाता पहचान पत्र का सत्यापन अनिवार्य करें।'
                    : 'Require workers to submit Aadhaar/ID proof before applying to verified employer jobs.'}
                </p>
              </div>
              <input
                type="checkbox"
                checked={requireIdVerification}
                onChange={(e) => setRequireIdVerification(e.target.checked)}
                className="h-4 w-4 rounded text-accent cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between py-2 border-b border-line/60">
              <div>
                <p className="font-bold text-xs text-ink">
                  {isHi ? 'सार्वजनिक स्व-पंजीकरण खुला रखें' : 'Allow Public Self-Registration'}
                </p>
                <p className="text-[11px] text-muted">
                  {isHi
                    ? 'नये कारीगरों और दुकानदारों को मंच पर स्वतः साइन अप करने की अनुमति दें।'
                    : 'Allow new workers and shop owners to register directly without invite code.'}
                </p>
              </div>
              <input
                type="checkbox"
                checked={allowPublicRegistrations}
                onChange={(e) => setAllowPublicRegistrations(e.target.checked)}
                className="h-4 w-4 rounded text-accent cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between py-2">
              <div>
                <p className="font-bold text-xs text-ink">
                  {isHi ? 'मंच सेवा शुल्क (Platform Commission Rate %)' : 'Platform Commission Fee (%)'}
                </p>
                <p className="text-[11px] text-muted">
                  {isHi
                    ? 'मजदूरों से कोई कमीशन न लें (कामसेतु शून्य-कमीशन मॉडल पर काम करता है)।'
                    : 'Zero-fee model for unorganized daily-wage workers to preserve fair wages.'}
                </p>
              </div>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  value={platformFee}
                  onChange={(e) => setPlatformFee(e.target.value)}
                  className="ks-input w-20 text-center text-xs font-bold"
                  min="0"
                  max="10"
                />
                <span className="text-xs font-bold text-muted">%</span>
              </div>
            </div>
          </div>

          {/* System Environment */}
          <div className="ks-card p-6 space-y-4">
            <div className="flex items-center gap-2 border-b border-line pb-3">
              <Database className="h-5 w-5 text-accent" />
              <h2 className="text-base font-black text-ink">
                {isHi ? 'तकनीकी ढांचा व संस्करण' : 'Technical Stack & System Telemetry'}
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-subtle border border-line">
                <p className="text-[10px] uppercase font-bold text-muted">Frontend Framework</p>
                <p className="font-bold text-ink mt-0.5">Next.js 16 (App Router) + React 19</p>
              </div>
              <div className="p-3 rounded-xl bg-subtle border border-line">
                <p className="text-[10px] uppercase font-bold text-muted">Styling Engine</p>
                <p className="font-bold text-ink mt-0.5">Tailwind CSS v4 (Forest & Lime Theme)</p>
              </div>
              <div className="p-3 rounded-xl bg-subtle border border-line">
                <p className="text-[10px] uppercase font-bold text-muted">Primary Database</p>
                <p className="font-bold text-ink mt-0.5">PostgreSQL 17 (Prisma ORM)</p>
              </div>
              <div className="p-3 rounded-xl bg-subtle border border-line">
                <p className="text-[10px] uppercase font-bold text-muted">Current Admin Account</p>
                <p className="font-bold text-ink mt-0.5">{user?.name} ({user?.phone})</p>
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <Button type="submit" variant="primary" disabled={saving}>
              <Save className="h-4 w-4 mr-1.5" />
              {saving ? (isHi ? 'सहेजा जा रहा है...' : 'Saving...') : (isHi ? 'सेटिंग्स सहेजें' : 'Save Platform Settings')}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
