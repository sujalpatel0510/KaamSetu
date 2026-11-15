'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useApp } from '@/context/AppContext';
import {
  Briefcase,
  Store,
  Users,
  ShieldCheck,
  TrendingUp,
  BookOpen,
  ArrowRight,
  CheckCircle2,
  MapPin,
  Clock,
  Sparkles,
  PhoneCall,
  Mic,
  Zap,
} from 'lucide-react';

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
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-teal-900 via-teal-950 to-slate-950 text-white py-20 lg:py-28 px-4 sm:px-6 lg:px-8">
        <div className="absolute inset-0 bg-[radial-gradient(#14b8a6_1px,transparent_1px)] [background-size:24px_24px] opacity-15"></div>

        <div className="relative mx-auto max-w-5xl text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-teal-500/20 border border-teal-400/30 text-teal-300 text-xs font-semibold backdrop-blur-xs">
            <Sparkles className="h-4 w-4 text-amber-400" />
            <span>VibeX Codes Track 1 • Local Labor & Small Business Platform</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white leading-tight">
            {t.heroTitle}
          </h1>

          <p className="mx-auto max-w-3xl text-base sm:text-lg text-teal-100/90 leading-relaxed font-normal">
            {t.heroSubtitle}
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 pt-4">
            <Link
              href="/jobs"
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-sm shadow-lg shadow-teal-500/25 transition-all hover:scale-102 active:scale-98"
            >
              <Briefcase className="h-4 w-4 text-slate-950" />
              {t.findWork}
              <ArrowRight className="h-4 w-4" />
            </Link>

            <Link
              href="/business/dashboard"
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-sm border border-white/20 backdrop-blur-xs transition-all hover:scale-102 active:scale-98"
            >
              <Store className="h-4 w-4 text-teal-400" />
              {t.manageBusiness}
            </Link>
          </div>

          {/* Key Metrics / Highlights */}
          <div className="pt-10 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto border-t border-teal-800/40 text-left">
            <div className="bg-white/5 p-4 rounded-xl border border-white/10">
              <p className="text-2xl font-black text-white">100%</p>
              <p className="text-xs text-teal-200">Local Verified Jobs</p>
            </div>
            <div className="bg-white/5 p-4 rounded-xl border border-white/10">
              <p className="text-2xl font-black text-amber-400">Zero</p>
              <p className="text-xs text-teal-200">Udhaar Calculation Loss</p>
            </div>
            <div className="bg-white/5 p-4 rounded-xl border border-white/10">
              <p className="text-2xl font-black text-teal-300">3</p>
              <p className="text-xs text-teal-200">Regional Languages</p>
            </div>
            <div className="bg-white/5 p-4 rounded-xl border border-white/10">
              <p className="text-2xl font-black text-emerald-400">10 Sec</p>
              <p className="text-xs text-teal-200">Voice Quick Entry</p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Jobs Section */}
      <section className="py-16 bg-slate-50 border-b border-slate-200 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-teal-700 bg-teal-100 px-2.5 py-1 rounded-md">
                Active Marketplace
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 mt-2">
                Latest Employment Opportunities
              </h2>
              <p className="text-sm text-slate-600 mt-1">
                Verified daily-wage & skilled roles available across Gujarat
              </p>
            </div>
            <Link
              href="/jobs"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-teal-700 hover:text-teal-800"
            >
              View all available jobs <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {featuredJobs.map((job) => (
              <div
                key={job.id}
                className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-50 text-teal-700 border border-teal-200 uppercase">
                      {job.jobType.replace('_', ' ')}
                    </span>
                    <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                      ₹{Number(job.wageAmount).toFixed(0)} {job.wageType === 'DAILY' ? '/ day' : 'fixed'}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-slate-900 mt-3 line-clamp-1">
                    {job.title}
                  </h3>
                  <p className="text-xs font-medium text-slate-500 mt-1">
                    {job.business.name}
                  </p>

                  <div className="flex items-center gap-1.5 text-xs text-slate-600 mt-3">
                    <MapPin className="h-3.5 w-3.5 text-teal-600 shrink-0" />
                    <span>{job.business.locality}, {job.business.city}</span>
                  </div>

                  <div className="flex flex-wrap gap-1 mt-4">
                    {job.requiredSkills.slice(0, 3).map((skill, i) => (
                      <span
                        key={i}
                        className="text-[11px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                  <Link
                    href={`/jobs/${job.id}`}
                    className="text-xs font-semibold text-teal-700 hover:text-teal-800"
                  >
                    {t.viewDetails} →
                  </Link>
                  <Link
                    href={`/jobs/${job.id}`}
                    className="px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-xs"
                  >
                    {t.apply}
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Two Pillars Section: Workers & Shopkeepers */}
      <section className="py-20 bg-white px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl space-y-16">
          <div className="text-center max-w-2xl mx-auto">
            <h2 className="text-3xl font-black text-slate-900">
              Two Interconnected Solutions in One Platform
            </h2>
            <p className="text-sm text-slate-600 mt-2">
              Designed specifically for local Indian ecosystems where workers lack digital resumes and shopkeepers struggle with manual registers.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Worker Column */}
            <div className="rounded-2xl bg-gradient-to-br from-teal-50/70 to-slate-50 p-8 border border-teal-200/60 shadow-xs relative overflow-hidden">
              <div className="flex items-center gap-3 mb-6">
                <div className="h-12 w-12 rounded-xl bg-teal-600 text-white flex items-center justify-center shadow-md shadow-teal-600/20">
                  <Users className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900">For Skilled Daily Workers</h3>
                  <p className="text-xs text-teal-800 font-medium">Electricians, Plumbers, Masons, Welders & Helpers</p>
                </div>
              </div>

              <ul className="space-y-3.5 text-sm text-slate-700">
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="h-5 w-5 text-teal-600 shrink-0 mt-0.5" />
                  <span><strong>Zero English or Resume Needed:</strong> Simple digital skill card with phone and verified experience.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="h-5 w-5 text-teal-600 shrink-0 mt-0.5" />
                  <span><strong>Nearby Work Discovery:</strong> Filter jobs by locality, daily wage rate, and specific trade.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="h-5 w-5 text-teal-600 shrink-0 mt-0.5" />
                  <span><strong>1-Click Applications:</strong> Apply instantly and track acceptance directly on your phone.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="h-5 w-5 text-teal-600 shrink-0 mt-0.5" />
                  <span><strong>Regional Language First:</strong> Available in ગુજરાતી, हिन्दी and English.</span>
                </li>
              </ul>

              <div className="mt-8 pt-6 border-t border-teal-200/60">
                <Link
                  href="/register?role=WORKER"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold shadow-xs"
                >
                  Create Worker Profile <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>

            {/* Shopkeeper Column */}
            <div className="rounded-2xl bg-gradient-to-br from-amber-50/70 to-slate-50 p-8 border border-amber-200/60 shadow-xs relative overflow-hidden">
              <div className="flex items-center gap-3 mb-6">
                <div className="h-12 w-12 rounded-xl bg-amber-600 text-white flex items-center justify-center shadow-md shadow-amber-600/20">
                  <Store className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900">For Small Shopkeepers & Vendors</h3>
                  <p className="text-xs text-amber-800 font-medium">Kirana, Chai Stalls, Hardware & Local Retail</p>
                </div>
              </div>

              <ul className="space-y-3.5 text-sm text-slate-700">
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                  <span><strong>Digital Udhaar Book:</strong> Never lose track of customer credit. Full ledger with zero mathematical errors.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                  <span><strong>Voice Quick Entry:</strong> Speak in Hindi or Gujarati to log credit or sales when your hands are busy.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                  <span><strong>Inventory & Low Stock Alerts:</strong> Know exactly when milk, sugar, or rice is running out.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                  <span><strong>Hire Helpers Instantly:</strong> Post a job listing in 30 seconds and receive local applications.</span>
                </li>
              </ul>

              <div className="mt-8 pt-6 border-t border-amber-200/60">
                <Link
                  href="/register?role=BUSINESS_OWNER"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-xs"
                >
                  Register Shop / Business <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-16 bg-slate-100/70 border-y border-slate-200 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl text-center">
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900">How KaamSetu Works in 3 Steps</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12 text-left">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs relative">
              <span className="text-4xl font-black text-teal-200 absolute top-4 right-5">01</span>
              <h3 className="text-base font-bold text-slate-900 mt-2">Sign Up in 30 Seconds</h3>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                Enter your mobile number and pick your role: Worker or Business Owner. Choose your preferred language.
              </p>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs relative">
              <span className="text-4xl font-black text-teal-200 absolute top-4 right-5">02</span>
              <h3 className="text-base font-bold text-slate-900 mt-2">Post or Browse Work</h3>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                Employers post requirements with daily wages; workers filter by trade and apply with one touch.
              </p>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs relative">
              <span className="text-4xl font-black text-teal-200 absolute top-4 right-5">03</span>
              <h3 className="text-base font-bold text-slate-900 mt-2">Manage & Grow</h3>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                Shopkeepers log sales, track customer Udhaar with voice, and build trust in the local community.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <section className="py-16 bg-teal-900 text-white text-center px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl space-y-4">
          <h2 className="text-3xl font-black">Ready to get started with KaamSetu?</h2>
          <p className="text-teal-200 text-sm">
            Join thousands of daily-wage workers and local businesses across Gujarat.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
            <Link
              href="/register"
              className="px-6 py-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-sm shadow-md transition-all"
            >
              Create Free Account Now
            </Link>
            <Link
              href="/jobs"
              className="px-6 py-3 rounded-xl bg-teal-800 hover:bg-teal-700 text-white font-bold text-sm border border-teal-700 transition-all"
            >
              Browse Job Marketplace
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
