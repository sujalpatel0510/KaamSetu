'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import PageHeader from '@/components/ui/PageHeader';
import Button from '@/components/ui/Button';
import { toast } from '@/components/ui/Toast';
import {
  ShieldCheck,
  Radio,
  Send,
  Database,
  Lock,
  Layers,
  AlertTriangle,
  Server,
  Activity,
  Cpu,
} from 'lucide-react';
import { cn } from '@/lib/cn';

export default function AdminModerationPage() {
  const { language } = useApp();
  const isHi = language === 'hi';

  const [broadcastTarget, setBroadcastTarget] = useState<'ALL' | 'WORKER' | 'BUSINESS_OWNER'>('ALL');
  const [broadcastTitle, setBroadcastTitle] = useState('');
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [sendingBroadcast, setSendingBroadcast] = useState(false);

  const handleSendBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastTitle.trim() || !broadcastMessage.trim()) {
      toast.error(isHi ? 'कृपया शीर्षक और संदेश दोनों भरें।' : 'Please enter both title and message.');
      return;
    }
    try {
      setSendingBroadcast(true);
      const res = await fetch('/api/admin/broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetRole: broadcastTarget === 'ALL' ? undefined : broadcastTarget,
          title: broadcastTitle,
          message: broadcastMessage,
        }),
      });
      if (!res.ok) throw new Error('Failed to send broadcast');
      const data = await res.json();
      toast.success(
        isHi
          ? `प्रसारण संदेश सफलतापूर्वक भेजा गया (${data.recipientCount || 'सभी'} उपयोगकर्ताओं को)`
          : `Broadcast alert sent to ${data.recipientCount || 'all'} platform users!`
      );
      setBroadcastTitle('');
      setBroadcastMessage('');
    } catch (err: any) {
      toast.error(err.message || 'Broadcast failed');
    } finally {
      setSendingBroadcast(false);
    }
  };

  return (
    <div className="space-y-6 pb-12 w-full max-w-full">
      <PageHeader
        title={isHi ? 'प्रसारण व सुरक्षा नियंत्रण' : 'Broadcast & Platform Moderation'}
        description={
          isHi
            ? 'मंच-व्यापी सूचनाएं जारी करें, सुरक्षा मापदंडों की निगरानी करें और सिस्टम स्वास्थ्य की समीक्षा करें।'
            : 'Publish instant platform notifications, inspect security integrity, and monitor server vitals.'
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Broadcast Announcement Form */}
        <div className="ks-card p-6">
          <div className="flex items-center gap-2 mb-4">
            <Radio className="h-5 w-5 text-[#163A35] dark:text-[#B7D86B]" />
            <h2 className="text-base font-black text-ink">
              {isHi ? 'मंच-व्यापी संदेश प्रसारण (Broadcast)' : 'Send Platform Broadcast'}
            </h2>
          </div>
          <p className="text-xs text-muted mb-5 leading-relaxed">
            {isHi
              ? 'यहाँ से भेजा गया संदेश सीधे चयनित उपयोगकर्ताओं के इनबॉक्स में उच्च प्राथमिकता के साथ दिखाई देगा।'
              : 'Broadcast urgent advisories, wage compliance notices, or holiday schedules directly to user inboxes.'}
          </p>

          <form onSubmit={handleSendBroadcast} className="space-y-4">
            <div>
              <label className="ks-label">{isHi ? 'लक्षित उपयोगकर्ता समूह' : 'Recipient Target Audience'}</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  ['ALL', isHi ? 'सभी उपयोगकर्ता' : 'All Users'],
                  ['WORKER', isHi ? 'केवल कारीगर' : 'Workers Only'],
                  ['BUSINESS_OWNER', isHi ? 'केवल दुकानदार' : 'Merchants Only'],
                ].map(([val, label]) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setBroadcastTarget(val as any)}
                    className={cn(
                      'rounded-xl border p-2.5 text-xs font-bold transition-all text-center',
                      broadcastTarget === val
                        ? 'border-[#163A35] bg-[#E8EFEA] text-[#163A35] dark:border-[#B7D86B] dark:bg-[#1A2D28] dark:text-[#B7D86B]'
                        : 'border-line text-muted hover:border-line-strong hover:text-ink'
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="ks-label">{isHi ? 'संदेश शीर्षक' : 'Notification Title'}</label>
              <input
                type="text"
                value={broadcastTitle}
                onChange={(e) => setBroadcastTitle(e.target.value)}
                placeholder={isHi ? 'जैसे: न्यूनतम दैनिक मजदूरी नियम संशोधन...' : 'e.g. Weather Alert & Fair Wage Policy Update'}
                className="ks-input text-xs"
                required
              />
            </div>

            <div>
              <label className="ks-label">{isHi ? 'संदेश का विवरण' : 'Message Body'}</label>
              <textarea
                value={broadcastMessage}
                onChange={(e) => setBroadcastMessage(e.target.value)}
                placeholder={isHi ? 'विस्तृत संदेश लिखें...' : 'Provide complete operational details, instructions, or advisories...'}
                rows={4}
                className="ks-textarea text-xs resize-none"
                required
              />
            </div>

            <Button
              type="submit"
              variant="primary"
              disabled={sendingBroadcast}
              className="w-full justify-center"
            >
              {sendingBroadcast ? (
                <span>{isHi ? 'संदेश भेजा जा रहा है...' : 'Broadcasting message...'}</span>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-1.5" />
                  <span>{isHi ? 'संदेश प्रसारित करें' : 'Publish Broadcast'}</span>
                </>
              )}
            </Button>
          </form>
        </div>

        {/* System & Security Status */}
        <div className="space-y-6">
          <div className="ks-card p-6">
            <div className="flex items-center gap-2 mb-4">
              <ShieldCheck className="h-5 w-5 text-green-700 dark:text-green-400" />
              <h2 className="text-base font-black text-ink">
                {isHi ? 'सिस्टम सुरक्षा व डेटाबेस स्वास्थ्य' : 'Security & Database Health'}
              </h2>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-xl border border-line bg-subtle/50">
                <div className="flex items-center gap-3">
                  <Database className="h-5 w-5 text-accent" />
                  <div>
                    <p className="font-bold text-xs text-ink">PostgreSQL 17 (Neon Serverless)</p>
                    <p className="text-[10px] text-muted">Primary Transactional Store</p>
                  </div>
                </div>
                <span className="inline-flex items-center gap-1 rounded-full bg-green-500/10 px-2 py-0.5 text-[10px] font-bold text-green-700 dark:text-green-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
                  HEALTHY
                </span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl border border-line bg-subtle/50">
                <div className="flex items-center gap-3">
                  <Lock className="h-5 w-5 text-accent" />
                  <div>
                    <p className="font-bold text-xs text-ink">JWT & Role-Based Access Control</p>
                    <p className="text-[10px] text-muted">HTTP-only Secure Cookies · Strict RBAC</p>
                  </div>
                </div>
                <span className="inline-flex items-center gap-1 rounded-full bg-green-500/10 px-2 py-0.5 text-[10px] font-bold text-green-700 dark:text-green-400">
                  ACTIVE
                </span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl border border-line bg-subtle/50">
                <div className="flex items-center gap-3">
                  <Server className="h-5 w-5 text-accent" />
                  <div>
                    <p className="font-bold text-xs text-ink">Next.js 16 App Router & Turbopack</p>
                    <p className="text-[10px] text-muted">SSR & Edge-ready API Routing</p>
                  </div>
                </div>
                <span className="inline-flex items-center gap-1 rounded-full bg-green-500/10 px-2 py-0.5 text-[10px] font-bold text-green-700 dark:text-green-400">
                  ONLINE
                </span>
              </div>
            </div>
          </div>

          <div className="ks-card p-6 border-l-4 border-l-[#C66A45]">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-[#C66A45] shrink-0 mt-0.5" />
              <div>
                <h3 className="font-bold text-sm text-ink">
                  {isHi ? 'प्लेटफ़ॉर्म मॉडरेशन दिशानिर्देश' : 'Platform Moderation Guidelines'}
                </h3>
                <p className="text-xs text-muted mt-1 leading-relaxed">
                  {isHi
                    ? 'सभी नौकरियां स्थानीय श्रम नियमों और तयशुदा मजदूरी दरों के अनुरूप होनी चाहिए। भ्रामक, कमीशन-आधारित या बिना पते की लिस्टिंग को तुरंत बंद करें।'
                    : 'Ensure all listings adhere to fair-wage practices. Unverified listings with wage disputes should be referred to the Trust & Verification or Disputes queue.'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
