'use client';

import React from 'react';
import Link from 'next/link';
import { useApp } from '@/context/AppContext';
import { Briefcase, Heart, ShieldCheck, MapPin, Phone } from 'lucide-react';

export default function Footer() {
  const { t } = useApp();

  return (
    <footer className="w-full border-t border-slate-200 bg-slate-900 text-slate-300">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Col */}
          <div className="space-y-3 md:col-span-1">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-500 text-slate-900 font-bold">
                <Briefcase className="h-5 w-5" />
              </div>
              <span className="text-xl font-black text-white">
                Kaam<span className="text-teal-400">Setu</span>
              </span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              {t.tagline}
            </p>
            <div className="flex items-center gap-1.5 text-xs text-amber-400 font-semibold pt-1">
              <ShieldCheck className="h-4 w-4" />
              <span>VibeX Codes — Track 1 Project</span>
            </div>
          </div>

          {/* Quick Links: Workers */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-3">
              {t.workerRole}
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/jobs" className="hover:text-teal-400 transition-colors">
                  {t.jobs}
                </Link>
              </li>
              <li>
                <Link href="/worker/profile" className="hover:text-teal-400 transition-colors">
                  {t.profile}
                </Link>
              </li>
              <li>
                <Link href="/worker/applications" className="hover:text-teal-400 transition-colors">
                  {t.applications}
                </Link>
              </li>
            </ul>
          </div>

          {/* Quick Links: Businesses */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-3">
              {t.businessRole}
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/business/dashboard" className="hover:text-teal-400 transition-colors">
                  {t.dashboard}
                </Link>
              </li>
              <li>
                <Link href="/business/inventory" className="hover:text-teal-400 transition-colors">
                  {t.inventory}
                </Link>
              </li>
              <li>
                <Link href="/business/udhaar" className="hover:text-teal-400 transition-colors">
                  {t.udhaar}
                </Link>
              </li>
              <li>
                <Link href="/business/sales" className="hover:text-teal-400 transition-colors">
                  {t.sales}
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact & Local Focus */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-3">
              Local Support
            </h4>
            <div className="space-y-2 text-xs text-slate-400">
              <p className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-teal-400 shrink-0" />
                Gujarat (Ahmedabad, Vadodara, Surat)
              </p>
              <p className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-teal-400 shrink-0" />
                Helpline: 1800-SETU-HELP
              </p>
              <p className="text-[11px] text-slate-500 pt-1">
                Languages supported: English & हिन्दी
              </p>
            </div>
          </div>
        </div>

        {/* Bottom Credits */}
        <div className="mt-8 pt-6 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-3">
          <p>© 2026 KaamSetu. Empowering daily-wage earners & small businesses.</p>
          <p className="flex items-center gap-1">
            Built with <Heart className="h-3.5 w-3.5 text-red-500 fill-red-500" /> for VibeX Codes
          </p>
        </div>
      </div>
    </footer>
  );
}
