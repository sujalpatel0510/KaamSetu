'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useApp } from '@/context/AppContext';
import {
  Briefcase,
  Store,
  Users,
  ArrowRight,
  CheckCircle2,
  MapPin,
  Sparkles,
  Mic,
  BookOpen,
  Package,
  Bell,
  ShieldCheck,
  Clock,
} from 'lucide-react';
import Reveal from '@/components/ui/Reveal';

interface SampleJob {
  id: string;
  title: string;
  business: { name: string; city: string; locality: string };
  wageAmount: number;
  wageType: string;
  jobType: string;
  requiredSkills: string[];
}

export default function HomePage() {
  const { t, language } = useApp();
  const [featuredJobs, setFeaturedJobs] = useState<SampleJob[]>([]);

  const isHi = language === 'hi';

  useEffect(() => {
    fetch('/api/jobs?status=OPEN')
      .then((res) => res.json())
      .then((data) => {
        if (data.jobs) {
          setFeaturedJobs(data.jobs.slice(0, 3));
        }
      })
      .catch(() => {});
  }, []);

  return (
    <div className="flex flex-col w-full">
      {/* ═══════════ Hero Section ═══════════ */}
      <section className="relative overflow-hidden bg-brand-950 px-4 py-20 text-white sm:px-6 lg:px-8 lg:py-28">
        {/* Layered ambient gradient mesh backdrop */}
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div className="absolute -top-40 left-1/2 h-[560px] w-[900px] -translate-x-1/2 rounded-full bg-accent/20 blur-[140px]" />
          <div className="absolute top-1/3 -left-32 h-96 w-96 rounded-full bg-brand-500/25 blur-[120px]" />
          <div className="absolute -right-24 bottom-0 h-96 w-96 rounded-full bg-teal-500/15 blur-[120px]" />
        </div>

        <div className="relative mx-auto max-w-5xl space-y-7 text-center">
          <div className="animate-fade-up inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-semibold text-teal-200 backdrop-blur-sm">
            <Sparkles className="h-4 w-4 text-teal-300" aria-hidden />
            <span>{t.heroBadge}</span>
          </div>

          <h1
            className="animate-fade-up mx-auto max-w-4xl text-4xl leading-[1.08] font-black tracking-tight sm:text-5xl lg:text-6xl"
            style={{ animationDelay: '80ms' }}
          >
            {t.heroTitle}
          </h1>

          <p
            className="animate-fade-up mx-auto max-w-2xl text-base leading-relaxed text-slate-300 sm:text-lg"
            style={{ animationDelay: '160ms' }}
          >
            {t.heroSubtitle}
          </p>

          <div
            className="animate-fade-up flex flex-col items-center justify-center gap-3 pt-3 sm:flex-row"
            style={{ animationDelay: '240ms' }}
          >
            <Link
              href="/jobs"
              className="ks-btn ks-btn-lg bg-accent text-accent-fg hover:bg-accent-strong group w-full sm:w-auto shadow-md"
            >
              <Briefcase className="h-4 w-4" aria-hidden />
              <span>{t.findWork}</span>
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
            </Link>

            <Link
              href="/register?role=BUSINESS_OWNER"
              className="ks-btn ks-btn-lg w-full border border-white/20 bg-white/5 text-white backdrop-blur-sm transition-colors hover:bg-white/10 sm:w-auto"
            >
              <Store className="h-4 w-4 text-teal-300" aria-hidden />
              <span>{t.manageBusiness}</span>
            </Link>
          </div>

          {/* Metric Highlights Strip */}
          <Reveal delay={120}>
            <div className="mx-auto grid max-w-4xl grid-cols-2 gap-3 border-t border-white/10 pt-10 text-left md:grid-cols-4">
              {[
                {
                  value: '100%',
                  label: isHi ? 'सत्यापित स्थानीय काम' : 'Verified Local Jobs',
                  color: 'text-white',
                },
                {
                  value: '0%',
                  label: isHi ? 'हिसाब में शून्य गलती' : 'Zero Ledger Loss',
                  color: 'text-teal-300',
                },
                {
                  value: '2',
                  label: isHi ? 'भाषाएं (EN और हिन्दी)' : 'Languages (EN & Hindi)',
                  color: 'text-brand-300',
                },
                {
                  value: '10 Sec',
                  label: isHi ? 'आवाज से तेज एंट्री' : 'Voice Quick Entry',
                  color: 'text-green-400',
                },
              ].map((m) => (
                <div
                  key={m.label}
                  className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 backdrop-blur-sm"
                >
                  <p className={`text-2xl font-black tracking-tight ${m.color}`}>
                    {m.value}
                  </p>
                  <p className="mt-0.5 text-xs text-slate-400">{m.label}</p>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* ═══════════ Featured Jobs (Live Database Feed) ═══════════ */}
      <section className="border-b border-line bg-surface px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <Reveal>
            <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
              <div>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-accent-soft px-3 py-1 text-xs font-bold text-accent-strong mb-2 uppercase">
                  <Sparkles className="h-3 w-3" />
                  {isHi ? 'लाइव रोज़गार मंच' : 'Active Marketplace'}
                </span>
                <h2 className="text-2xl font-black tracking-tight text-ink sm:text-3xl">
                  {isHi ? 'हाल में उपलब्ध रोज़गार अवसर' : 'Latest Employment Opportunities'}
                </h2>
                <p className="mt-1 text-sm text-muted">
                  {isHi ? 'स्थानीय व्यापारियों और ठेकेदारों द्वारा पोस्ट किए गए काम' : 'Directly posted by local shops, contractors, and businesses.'}
                </p>
              </div>
              <Link
                href="/jobs"
                className="group inline-flex items-center gap-1.5 text-sm font-bold text-accent hover:underline"
              >
                <span>{t.exploreJobs}</span>
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
              </Link>
            </div>
          </Reveal>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
            {featuredJobs.map((job, i) => (
              <Reveal key={job.id} delay={i * 90}>
                <Link
                  href={`/jobs/${job.id}`}
                  className="ks-card ks-card-hover group flex h-full flex-col justify-between p-6"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <span className="rounded-md bg-subtle px-2 py-0.5 text-[10px] font-bold text-ink uppercase">
                        {job.jobType.replace('_', ' ')}
                      </span>
                      <span className="rounded-md bg-green-500/10 px-2.5 py-0.5 text-xs font-black text-green-700 dark:text-green-400">
                        ₹{Number(job.wageAmount).toLocaleString('en-IN')}{' '}
                        {job.wageType === 'DAILY' ? t.perDay : t.fixedWage}
                      </span>
                    </div>

                    <h3 className="mt-3 line-clamp-1 text-lg font-bold text-ink transition-colors group-hover:text-accent">
                      {job.title}
                    </h3>
                    <p className="mt-1 text-xs font-medium text-muted">
                      {job.business.name}
                    </p>

                    <div className="mt-3 flex items-center gap-1.5 text-xs text-ink-soft">
                      <MapPin className="h-3.5 w-3.5 shrink-0 text-accent" aria-hidden />
                      <span>
                        {job.business.locality}, {job.business.city}
                      </span>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-1">
                      {job.requiredSkills.slice(0, 3).map((skill, j) => (
                        <span
                          key={j}
                          className="rounded-md bg-subtle px-2 py-0.5 text-[11px] text-ink-soft"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="mt-6 flex items-center justify-between border-t border-line pt-4">
                    <span className="text-xs font-semibold text-muted group-hover:text-accent">
                      {t.viewDetails} →
                    </span>
                    <span className="ks-btn ks-btn-primary ks-btn-sm">{t.applyNow}</span>
                  </div>
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ Two Pillars Section ═══════════ */}
      <section className="bg-canvas px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl space-y-12">
          <Reveal>
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-2xl font-black tracking-tight text-ink sm:text-3xl">
                {isHi ? 'एक ही मंच पर दो परस्पर जुड़े समाधान' : 'Two Interconnected Solutions in One Platform'}
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-muted">
                {isHi
                  ? 'भारतीय बाज़ारों की ज़मीनी ज़रूरतों के अनुसार निर्मित — जहाँ कारीगरों को डिजिटल पहचान मिलती है और दुकानदारों का रोज़मर्रा का काम आसान होता है।'
                  : 'Tailored for local markets: workers get a digital skill identity and employers manage operations with zero paperwork.'}
              </p>
            </div>
          </Reveal>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Worker Pillar */}
            <Reveal delay={80}>
              <div className="ks-card relative h-full overflow-hidden p-8">
                <div className="relative">
                  <div className="mb-6 flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent text-accent-fg shadow-sm font-bold">
                      <Users className="h-6 w-6" aria-hidden />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-ink">
                        {isHi ? 'कुशल कारीगरों व दैनिक श्रमिकों के लिए' : 'For Skilled Daily Workers'}
                      </h3>
                      <p className="text-xs font-semibold text-accent">
                        {isHi ? 'इलेक्ट्रीशियन, प्लंबर, राजमिस्त्री, वेल्डर, कारपेंटर' : 'Electricians, Plumbers, Masons, Carpenters & Welders'}
                      </p>
                    </div>
                  </div>

                  <ul className="space-y-3.5 text-sm text-ink-soft">
                    {[
                      [
                        isHi ? 'अंग्रेजी या बायोडाटा की ज़रूरत नहीं' : 'No English Resume Needed',
                        isHi ? 'मोबाइल नंबर और सत्यापित हुनर वाला डिजिटल कारीगर कार्ड।' : 'Simple digital skill card with verified trades and experience.',
                      ],
                      [
                        isHi ? 'नज़दीक काम की खोज' : 'Nearby Work Discovery',
                        isHi ? 'इलाके और दिन की पक्की मजदूरी के अनुसार काम खोजें।' : 'Filter jobs by locality, daily wage rate, and specific trade.',
                      ],
                      [
                        isHi ? '1-क्लिक में आसान आवेदन' : '1-Click Applications',
                        isHi ? 'सीधे फोन से आवेदन करें और चयन होते ही मालिक को कॉल करें।' : 'Apply instantly and track acceptance directly on your phone.',
                      ],
                      [
                        isHi ? '15-सेकंड काम का वीडियो प्रमाण' : '15-Sec Craftsmanship Video',
                        isHi ? 'अपने काम का वीडियो लिंक जोड़ें जिससे मालिक तुरंत हुनर देख सकें।' : 'Showcase your real work via video link to build employer trust.',
                      ],
                    ].map(([title, desc]) => (
                      <li key={title} className="flex items-start gap-2.5">
                        <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-accent" aria-hidden />
                        <span>
                          <strong className="text-ink">{title}:</strong> {desc}
                        </span>
                      </li>
                    ))}
                  </ul>

                  <div className="mt-8 border-t border-line pt-6">
                    <Link
                      href="/register?role=WORKER"
                      className="ks-btn ks-btn-primary group"
                    >
                      <span>{isHi ? 'कारीगर प्रोफ़ाइल बनाएं' : 'Create Worker Profile'}</span>
                      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
                    </Link>
                  </div>
                </div>
              </div>
            </Reveal>

            {/* Shopkeeper Pillar */}
            <Reveal delay={180}>
              <div className="ks-card relative h-full overflow-hidden p-8">
                <div className="relative">
                  <div className="mb-6 flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent text-accent-fg shadow-sm font-bold">
                      <Store className="h-6 w-6" aria-hidden />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-ink">
                        {isHi ? 'दुकानदारों व व्यापारियों के लिए' : 'For Small Shopkeepers & Merchants'}
                      </h3>
                      <p className="text-xs font-semibold text-teal-700 dark:text-teal-400">
                        {isHi ? 'किराना, हार्डवेयर, मेडिकल व स्थानीय रिटेल व्यापार' : 'Kirana, Hardware, Retail Stores & Contractors'}
                      </p>
                    </div>
                  </div>

                  <ul className="space-y-3.5 text-sm text-ink-soft">
                    {[
                      [
                        BookOpen,
                        isHi ? 'डिजिटल उधार बहीखाता' : 'Digital Udhaar Book',
                        isHi ? 'ग्राहकों का उधार व जमा 100% गणितीय सटीकता के साथ रिकॉर्ड करें।' : 'Never lose track of credit. 100% mathematical audit accuracy.',
                      ],
                      [
                        Mic,
                        isHi ? 'बोलकर लिखने की सुविधा' : 'Voice Quick Assistant',
                        isHi ? 'व्यस्त समय में बोलकर बिक्री या उधार की प्रविष्टि करें।' : 'Speak in Hindi or English to log sales or credit hands-free.',
                      ],
                      [
                        Package,
                        isHi ? 'कम स्टॉक की पूर्व चेतावनी' : 'Inventory & Low Stock Alerts',
                        isHi ? 'सामान खत्म होने से पहले स्वचालित रूप से अलर्ट पाएं।' : 'Know exactly when products are running low before stockouts.',
                      ],
                      [
                        Bell,
                        isHi ? 'स्थानीय कारीगरों की त्वरित भर्ती' : 'Hire Helpers & Workers',
                        isHi ? '30 सेकंड में नौकरी पोस्ट करें और आसपास के कारीगरों से संपर्क करें।' : 'Post a job in 30 seconds and receive local applications instantly.',
                      ],
                    ].map(([Icon, title, desc]) => {
                      const I = Icon as typeof BookOpen;
                      return (
                        <li key={title as string} className="flex items-start gap-2.5">
                          <I className="mt-0.5 h-5 w-5 shrink-0 text-teal-600 dark:text-teal-400" aria-hidden />
                          <span>
                            <strong className="text-ink">{title as string}:</strong> {desc as string}
                          </span>
                        </li>
                      );
                    })}
                  </ul>

                  <div className="mt-8 border-t border-line pt-6">
                    <Link
                      href="/register?role=BUSINESS_OWNER"
                      className="ks-btn ks-btn-primary group"
                    >
                      <span>{isHi ? 'दुकान का खाता खोलें' : 'Register Shop / Business'}</span>
                      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
                    </Link>
                  </div>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ═══════════ How It Works (3 Steps) ═══════════ */}
      <section className="border-y border-line bg-surface px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <Reveal>
            <div className="text-center">
              <h2 className="text-2xl font-black tracking-tight text-ink sm:text-3xl">
                {t.howItWorks}
              </h2>
            </div>
          </Reveal>

          <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-3">
            {[
              ['01', t.step1Title, t.step1Desc, ShieldCheck],
              ['02', t.step2Title, t.step2Desc, Briefcase],
              ['03', t.step3Title, t.step3Desc, Clock],
            ].map(([step, title, desc, Icon], i) => {
              const I = Icon as typeof ShieldCheck;
              return (
                <Reveal key={step as string} delay={i * 110}>
                  <div className="ks-card ks-card-hover relative h-full p-6">
                    <div className="flex items-center justify-between">
                      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent-soft text-sm font-black text-accent-strong">
                        {step as string}
                      </span>
                      <I className="h-5 w-5 text-faint" aria-hidden />
                    </div>
                    <h3 className="mt-4 text-base font-bold text-ink">
                      {title as string}
                    </h3>
                    <p className="mt-2 text-xs leading-relaxed text-muted">
                      {desc as string}
                    </p>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* ═══════════ Final CTA Banner ═══════════ */}
      <section className="relative overflow-hidden bg-brand-950 px-4 py-16 text-center text-white sm:px-6 lg:px-8">
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div className="absolute top-0 left-1/2 h-64 w-[700px] -translate-x-1/2 rounded-full bg-accent/20 blur-[120px]" />
        </div>
        <Reveal>
          <div className="relative mx-auto max-w-3xl space-y-4">
            <h2 className="text-2xl font-black tracking-tight sm:text-3xl">
              {t.readyToGetStarted}
            </h2>
            <p className="text-sm text-slate-300">
              {t.joinThousands}
            </p>
            <div className="flex flex-col items-center justify-center gap-3 pt-4 sm:flex-row">
              <Link
                href="/register"
                className="ks-btn ks-btn-lg bg-accent text-accent-fg hover:bg-accent-strong w-full sm:w-auto shadow-md"
              >
                <span>{t.getStarted}</span>
              </Link>
              <Link
                href="/jobs"
                className="ks-btn ks-btn-lg w-full border border-white/20 bg-white/5 text-white transition-colors hover:bg-white/10 sm:w-auto"
              >
                <span>{t.exploreJobs}</span>
              </Link>
            </div>
          </div>
        </Reveal>
      </section>
    </div>
  );
}
