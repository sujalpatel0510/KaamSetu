'use client';

import React from 'react';
import Link from 'next/link';
import { useApp } from '@/context/AppContext';
import { Briefcase, Heart, ShieldCheck, MapPin, Phone } from 'lucide-react';

export default function Footer() {
  const { t, language } = useApp();
  const isHi = language === 'hi';

  return (
    <footer className="w-full border-t border-white/10 bg-brand-950 text-slate-400">
      <div className="w-full px-4 py-12 sm:px-6 lg:px-12">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-12">
          {/* Brand Col */}
          <div className="space-y-4 md:col-span-5">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent text-accent-fg shadow-sm font-bold">
                <Briefcase className="h-5 w-5" aria-hidden />
              </div>
              <span className="text-xl font-black text-white">
                Kaam<span className="text-accent">Setu</span>
              </span>
            </div>
            <p className="max-w-sm text-xs leading-relaxed text-slate-300">
              {t.tagline}
            </p>
            <div className="flex items-center gap-1.5 pt-1 text-xs font-semibold text-amber-200">
              <ShieldCheck className="h-4 w-4" aria-hidden />
              <span>VibeX Codes — Track 1 Project</span>
            </div>
          </div>

          {/* Quick Links: Workers */}
          <nav className="md:col-span-2" aria-label="Worker links">
            <h4 className="mb-3 text-[11px] font-bold tracking-wider text-white uppercase">
              {t.workerRole}
            </h4>
            <ul className="space-y-2.5 text-xs">
              <li>
                <Link href="/jobs" className="text-slate-400 transition-colors hover:text-white">
                  {t.jobs}
                </Link>
              </li>
              <li>
                <Link href="/worker/profile" className="text-slate-400 transition-colors hover:text-white">
                  {t.profile}
                </Link>
              </li>
              <li>
                <Link href="/worker/applications" className="text-slate-400 transition-colors hover:text-white">
                  {t.applications}
                </Link>
              </li>
            </ul>
          </nav>

          {/* Quick Links: Businesses */}
          <nav className="md:col-span-2" aria-label="Business links">
            <h4 className="mb-3 text-[11px] font-bold tracking-wider text-white uppercase">
              {t.businessRole}
            </h4>
            <ul className="space-y-2.5 text-xs">
              <li>
                <Link href="/business/dashboard" className="text-slate-400 transition-colors hover:text-white">
                  {t.dashboard}
                </Link>
              </li>
              <li>
                <Link href="/business/inventory" className="text-slate-400 transition-colors hover:text-white">
                  {t.inventory}
                </Link>
              </li>
              <li>
                <Link href="/business/udhaar" className="text-slate-400 transition-colors hover:text-white">
                  {t.udhaar}
                </Link>
              </li>
              <li>
                <Link href="/business/sales" className="text-slate-400 transition-colors hover:text-white">
                  {t.sales}
                </Link>
              </li>
            </ul>
          </nav>

          {/* Contact & Support */}
          <div className="md:col-span-3">
            <h4 className="mb-3 text-[11px] font-bold tracking-wider text-white uppercase">
              {isHi ? 'स्थानीय सहायता केंद्र' : 'Local Support'}
            </h4>
            <div className="space-y-2.5 text-xs text-slate-400">
              <p className="flex items-center gap-2">
                <MapPin className="h-4 w-4 shrink-0 text-amber-400" aria-hidden />
                <span>{isHi ? 'अखिल भारतीय सेवा (सभी शहर समर्थित)' : 'Pan-India Service (All Cities Supported)'}</span>
              </p>
              <p className="flex items-center gap-2">
                <Phone className="h-4 w-4 shrink-0 text-amber-400" aria-hidden />
                <span>{isHi ? 'हेल्पलाइन: 1800-SETU-HELP' : 'Helpline: 1800-SETU-HELP'}</span>
              </p>
              <p className="text-[11px] pt-1 text-slate-400">
                {isHi ? 'समर्थित भाषाएं: English और हिन्दी' : 'Supported Languages: English & Hindi'}
              </p>
            </div>
          </div>
        </div>

        {/* Bottom Credits */}
        <div className="mt-10 flex flex-col items-center justify-between gap-3 border-t border-white/10 pt-6 text-xs text-slate-400 sm:flex-row">
          <p>{t.copyright}</p>
          <p className="flex items-center gap-1">
            Built with <Heart className="h-3.5 w-3.5 fill-red-500 text-red-500" aria-hidden /> for VibeX Codes
          </p>
        </div>
      </div>
    </footer>
  );
}
