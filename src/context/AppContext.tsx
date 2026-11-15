'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Language, translations } from '@/lib/i18n';

interface UserSession {
  id: string;
  name: string;
  phone: string;
  email?: string | null;
  role: 'WORKER' | 'BUSINESS_OWNER' | 'ADMIN';
  preferredLanguage: string;
  workerProfile?: {
    id: string;
    city: string;
    locality: string;
    skills: string[];
    experienceYears: number;
    availability: boolean;
  } | null;
  business?: {
    id: string;
    name: string;
    category: string;
    city: string;
    locality: string;
    address: string;
  } | null;
}

interface AppContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: typeof translations.en;
  user: UserSession | null;
  setUser: (user: UserSession | null) => void;
  isLoading: boolean;
  refreshUser: () => Promise<void>;
  logout: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>('en');
  const [user, setUser] = useState<UserSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    if (typeof window !== 'undefined') {
      localStorage.setItem('kaamsetu_lang', lang);
    }
  };

  const refreshUser = async () => {
    try {
      const res = await fetch('/api/auth/me');
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        if (data.user?.preferredLanguage && ['en', 'hi', 'gu'].includes(data.user.preferredLanguage)) {
          setLanguageState(data.user.preferredLanguage as Language);
        }
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedLang = localStorage.getItem('kaamsetu_lang') as Language;
      if (savedLang && ['en', 'hi', 'gu'].includes(savedLang)) {
        setLanguageState(savedLang);
      }
    }
    refreshUser();
  }, []);

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      setUser(null);
      window.location.href = '/login';
    } catch (e) {
      console.error('Logout error:', e);
    }
  };

  const t = translations[language] || translations.en;

  return (
    <AppContext.Provider
      value={{
        language,
        setLanguage,
        t,
        user,
        setUser,
        isLoading,
        refreshUser,
        logout,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
