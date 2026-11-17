'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import DashboardShell from '@/components/DashboardShell';
import PageHeader from '@/components/ui/PageHeader';
import { formatDate } from '@/lib/date';
import { ShieldCheck, Award, FileText, CheckCircle2, Clock, AlertTriangle, Send } from 'lucide-react';

interface VerificationRequestItem {
  id: string;
  documentType: string;
  documentNumber?: string | null;
  status: string;
  adminNotes?: string | null;
  createdAt: string;
  reviewedAt?: string | null;
}

export default function WorkerVerificationPage() {
  const { user, t, language } = useApp();
  const [status, setStatus] = useState('NOT_SUBMITTED');
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [requests, setRequests] = useState<VerificationRequestItem[]>([]);
  const [loading, setLoading] = useState(true);

  const [documentType, setDocumentType] = useState('AADHAAR_LAST4');
  const [documentNumber, setDocumentNumber] = useState('');
  const [documentUrl, setDocumentUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');

  const fetchStatus = async () => {
    try {
      const res = await fetch('/api/verification');
      const data = await res.json();
      if (data.verification) {
        setStatus(data.verification.status);
        setPhoneVerified(data.verification.phoneVerified);
        setRequests(data.verification.requests || []);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role === 'WORKER') {
      fetchStatus();
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage('');
    try {
      const res = await fetch('/api/verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documentType, documentNumber, documentUrl }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage('Verification request submitted for admin review.');
        fetchStatus();
        setDocumentNumber('');
        setDocumentUrl('');
      } else {
        setMessage(data.error || 'Failed to submit verification request.');
      }
    } catch (e: any) {
      setMessage(e.message || 'Network error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <DashboardShell role="WORKER">
      <PageHeader
        title={t.verification}
        subtitle={
          language === 'hi'
            ? 'अपना आधार या ट्रेड प्रमाणपत्र सत्यापित कराएं और नियोक्ताओं से पक्का भरोसा हासिल करें'
            : 'Get your trade credentials and identity verified to earn verified trust badges'
        }
      />

      {/* Trust Status Overview Card */}
      <div className="ks-card p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div
            className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl ${
              status === 'VERIFIED'
                ? 'bg-green-100 text-green-700'
                : status === 'PENDING'
                ? 'bg-amber-100 text-amber-700'
                : 'bg-subtle text-muted'
            }`}
          >
            <ShieldCheck className="h-8 w-8" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-black text-ink">
                {language === 'hi' ? 'पहचान सत्यापन स्थिति' : 'Identity Verification Status'}
              </h3>
              <span
                className={`rounded-md px-2.5 py-0.5 text-xs font-bold uppercase ${
                  status === 'VERIFIED'
                    ? 'bg-green-100 text-green-800'
                    : status === 'PENDING'
                    ? 'bg-amber-500/10 text-amber-700 dark:text-amber-300'
                    : status === 'REJECTED'
                    ? 'bg-red-500/10 text-red-700 dark:text-red-300'
                    : 'bg-subtle text-ink-soft'
                }`}
              >
                {status}
              </span>
            </div>
            <p className="text-xs text-muted mt-1">
              {status === 'VERIFIED'
                ? language === 'hi'
                  ? 'आपकी प्रोफ़ाइल आधिकारिक तौर पर सत्यापित है। नियोक्ता आपको प्राथमिकता देंगे।'
                  : 'Your profile carries a certified trust badge. Employers hire verified workers faster.'
                : status === 'PENDING'
                ? language === 'hi'
                  ? 'आपका अनुरोध प्रशासनिक समीक्षा में है (24 घंटे में निर्णय होगा)।'
                  : 'Your submission is under administrative review (processed within 24 hours).'
                : language === 'hi'
                ? 'काम मिलने के अवसर दोगुने करने के लिए नीचे अपना विवरण सबमिट करें।'
                : 'Submit verification below to earn verified worker status and higher wages.'}
            </p>
          </div>
        </div>
      </div>

      {message && (
        <div className="rounded-xl border border-line bg-subtle p-4 text-xs font-semibold text-ink">
          {message}
        </div>
      )}

      {/* Submission Form */}
      {status !== 'VERIFIED' && (
        <div className="ks-card p-6 space-y-4">
          <h3 className="text-base font-bold text-ink border-b border-line pb-3">
            {language === 'hi' ? 'सत्यापन हेतु विवरण सबमिट करें' : 'Submit Verification Document'}
          </h3>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-ink-soft mb-1.5">
                  {language === 'hi' ? 'दस्तावेज़ का प्रकार' : 'Document Type'}
                </label>
                <select
                  value={documentType}
                  onChange={(e) => setDocumentType(e.target.value)}
                  className="ks-input"
                >
                  <option value="AADHAAR_LAST4">Aadhaar (Last 4 Digits & Name)</option>
                  <option value="TRADE_CERTIFICATE">Trade Skill Certificate (ITI / Govt)</option>
                  <option value="DRIVING_LICENSE">Commercial Driving License</option>
                  <option value="VOTER_ID">Voter ID Card</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-ink-soft mb-1.5">
                  {language === 'hi' ? 'दस्तावेज़ नंबर / अंतिम 4 अंक' : 'Document ID / Number'}
                </label>
                <input
                  type="text"
                  required
                  value={documentNumber}
                  onChange={(e) => setDocumentNumber(e.target.value)}
                  placeholder="e.g. XXXX-XXXX-1234"
                  className="ks-input"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-ink-soft mb-1.5">
                {language === 'hi' ? 'दस्तावेज़ फोटो / लिंक (वैकल्पिक)' : 'Proof Document URL (Optional)'}
              </label>
              <input
                type="url"
                value={documentUrl}
                onChange={(e) => setDocumentUrl(e.target.value)}
                placeholder="https://drive.google.com/your-proof-document"
                className="ks-input"
              />
              <p className="text-[11px] text-muted mt-1">
                {language === 'hi'
                  ? 'आपके दस्तावेज़ गोपनीय रखे जाते हैं और कभी सार्वजनिक नहीं किए जाते।'
                  : 'Your identity records are strictly confidential and never shared publicly.'}
              </p>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="ks-btn ks-btn-primary ks-btn-md flex items-center gap-2"
            >
              <Send className="h-4 w-4" />
              <span>{submitting ? 'Submitting...' : 'Submit for Verification'}</span>
            </button>
          </form>
        </div>
      )}

      {/* Verification History */}
      {requests.length > 0 && (
        <div className="ks-card p-6 space-y-3">
          <h3 className="text-base font-bold text-ink border-b border-line pb-3">
            {language === 'hi' ? 'पूर्व अनुरोध इतिहास' : 'Request History'}
          </h3>
          <div className="divide-y divide-line text-xs">
            {requests.map((r) => (
              <div key={r.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <div className="font-bold text-ink">{r.documentType} {r.documentNumber && `(${r.documentNumber})`}</div>
                  <div className="text-[11px] text-muted">Submitted on {formatDate(r.createdAt)}</div>
                  {r.adminNotes && <div className="text-[11px] text-red-600 mt-0.5">Admin Note: {r.adminNotes}</div>}
                </div>
                <span
                  className={`inline-block rounded-md px-2 py-0.5 text-[10px] font-bold ${
                    r.status === 'VERIFIED'
                      ? 'bg-green-100 text-green-800'
                      : r.status === 'PENDING'
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-red-100 text-red-800'
                  }`}
                >
                  {r.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </DashboardShell>
  );
}
