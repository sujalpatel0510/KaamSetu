'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import { Language } from '@/lib/i18n';
import {
  Briefcase,
  Store,
  Bell,
  Menu,
  X,
  LogOut,
  User as UserIcon,
  Globe,
  Mic,
  LayoutDashboard,
  FileText,
  Package,
  BookOpen,
} from 'lucide-react';
import VoiceAssistantModal from './VoiceAssistantModal';

export default function Navbar() {
  const { language, setLanguage, t, user, logout } = useApp();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [voiceModalOpen, setVoiceModalOpen] = useState(false);

  useEffect(() => {
    if (user) {
      fetch('/api/notifications')
        .then((res) => res.json())
        .then((data) => {
          if (data.unreadCount !== undefined) {
            setUnreadNotifications(data.unreadCount);
          }
        })
        .catch(() => {});
    }
  }, [user, pathname]);

  const navLinks = [
    { href: '/jobs', label: t.jobs, icon: Briefcase },
    ...(user?.role === 'WORKER'
      ? [
          { href: '/worker/dashboard', label: t.dashboard, icon: LayoutDashboard },
          { href: '/worker/profile', label: t.profile, icon: UserIcon },
          { href: '/worker/applications', label: t.applications, icon: FileText },
        ]
      : []),
    ...(user?.role === 'BUSINESS_OWNER'
      ? [
          { href: '/business/dashboard', label: t.dashboard, icon: LayoutDashboard },
          { href: '/business/inventory', label: t.inventory, icon: Package },
          { href: '/business/udhaar', label: t.udhaar, icon: BookOpen },
          { href: '/business/sales', label: t.sales, icon: Store },
        ]
      : []),
    ...(user?.role === 'ADMIN'
      ? [{ href: '/admin/dashboard', label: t.adminPanel, icon: LayoutDashboard }]
      : []),
  ];

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-teal-900/10 bg-white/95 backdrop-blur-md shadow-xs">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Logo & Brand */}
          <Link href="/" className="flex items-center gap-2.5 transition-transform active:scale-95">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-600 text-white shadow-md shadow-teal-600/30">
              <Briefcase className="h-5 w-5" />
            </div>
            <div>
              <span className="text-xl font-black tracking-tight text-slate-900 flex items-center gap-1">
                Kaam<span className="text-teal-600">Setu</span>
              </span>
              <span className="hidden sm:block text-[10px] font-medium text-slate-500 tracking-wide uppercase">
                {language === 'hi' ? 'कामसेतु मंच' : 'Work & Business Platform'}
              </span>
            </div>
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-teal-50 text-teal-700 font-semibold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* Actions & Utilities */}
          <div className="flex items-center gap-2.5">
            {/* Voice Assistant Shortcut Button */}
            {user?.role === 'BUSINESS_OWNER' && (
              <button
                onClick={() => setVoiceModalOpen(true)}
                title="Voice Quick Entry"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold shadow-xs transition-all active:scale-95 animate-pulse"
              >
                <Mic className="h-3.5 w-3.5" />
                <span className="hidden lg:inline">{t.quickVoiceEntry}</span>
                <span className="lg:hidden">Voice</span>
              </button>
            )}

            {/* Language Switcher */}
            <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs">
              {(['en', 'hi'] as Language[]).map((lang) => (
                <button
                  key={lang}
                  onClick={() => setLanguage(lang)}
                  className={`px-2 py-1 rounded-md font-medium transition-all ${
                    language === lang
                      ? 'bg-white text-teal-700 shadow-xs font-bold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {lang === 'en' ? 'EN' : 'हिंदी'}
                </button>
              ))}
            </div>

            {/* Notifications Bell */}
            {user && (
              <Link
                href={user.role === 'WORKER' ? '/worker/notifications' : '/business/notifications'}
                className="relative p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                title={t.notifications}
              >
                <Bell className="h-5 w-5" />
                {unreadNotifications > 0 && (
                  <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white ring-2 ring-white">
                    {unreadNotifications > 9 ? '9+' : unreadNotifications}
                  </span>
                )}
              </Link>
            )}

            {/* User Profile / Auth buttons */}
            {user ? (
              <div className="hidden sm:flex items-center gap-2 pl-2 border-l border-slate-200">
                <Link
                  href={user.role === 'WORKER' ? '/worker/profile' : '/business/profile'}
                  className="flex items-center gap-2 text-left hover:opacity-80 transition-opacity"
                >
                  <div className="h-8 w-8 rounded-full bg-teal-100 text-teal-800 flex items-center justify-center font-bold text-xs ring-2 ring-teal-600/20">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="hidden xl:block">
                    <p className="text-xs font-semibold text-slate-800 leading-tight">{user.name}</p>
                    <p className="text-[10px] text-slate-500 capitalize">
                      {user.role === 'WORKER' ? 'Worker' : 'Business'}
                    </p>
                  </div>
                </Link>
                <button
                  onClick={logout}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                  title={t.logout}
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <div className="hidden sm:flex items-center gap-2">
                <Link
                  href="/login"
                  className="px-3 py-1.5 text-sm font-medium text-slate-700 hover:text-teal-700 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  {t.login}
                </Link>
                <Link
                  href="/register"
                  className="px-3.5 py-1.5 text-sm font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-lg shadow-xs transition-colors"
                >
                  {t.register}
                </Link>
              </div>
            )}

            {/* Mobile Hamburger Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100"
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-slate-200 bg-white px-4 pt-2 pb-6 space-y-2 shadow-lg">
            <div className="flex flex-col space-y-1">
              {navLinks.map((link) => {
                const Icon = link.icon;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-base font-medium text-slate-700 hover:bg-slate-100 hover:text-teal-700"
                  >
                    <Icon className="h-5 w-5 text-teal-600" />
                    {link.label}
                  </Link>
                );
              })}
            </div>

            <div className="pt-3 border-t border-slate-200">
              {user ? (
                <div className="flex items-center justify-between py-2">
                  <div className="flex items-center gap-2.5">
                    <div className="h-9 w-9 rounded-full bg-teal-100 text-teal-800 flex items-center justify-center font-bold text-sm">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{user.name}</p>
                      <p className="text-xs text-slate-500">{user.phone}</p>
                    </div>
                  </div>
                  <button
                    onClick={logout}
                    className="flex items-center gap-1 text-xs font-semibold text-red-600 bg-red-50 px-3 py-1.5 rounded-lg"
                  >
                    <LogOut className="h-3.5 w-3.5" />
                    {t.logout}
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2 pt-2">
                  <Link
                    href="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full text-center py-2 text-sm font-semibold border border-slate-300 rounded-lg text-slate-700"
                  >
                    {t.login}
                  </Link>
                  <Link
                    href="/register"
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full text-center py-2 text-sm font-semibold bg-teal-600 text-white rounded-lg"
                  >
                    {t.register}
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Voice Assistant Modal */}
      <VoiceAssistantModal isOpen={voiceModalOpen} onClose={() => setVoiceModalOpen(false)} />
    </>
  );
}
