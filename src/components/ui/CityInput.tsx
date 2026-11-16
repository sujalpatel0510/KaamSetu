'use client';

import React, { useState, useEffect } from 'react';
import { MapPin, Edit3, List, Check } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { cn } from '@/lib/cn';

export const POPULAR_CITIES = [
  'Ahmedabad',
  'Surat',
  'Vadodara',
  'Rajkot',
  'Gandhinagar',
  'Anand',
  'Nadiad',
  'Bhavnagar',
  'Jamnagar',
  'Junagadh',
  'Bharuch',
  'Navsari',
  'Valsad',
  'Morbi',
  'Mehsana',
  'Bhuj',
  'Mumbai',
  'Pune',
  'Nagpur',
  'Nashik',
  'Delhi',
  'Bengaluru',
  'Hyderabad',
  'Chennai',
  'Kolkata',
  'Jaipur',
  'Indore',
  'Bhopal',
  'Lucknow',
  'Kanpur',
  'Patna',
  'Chandigarh',
] as const;

const TOP_PILLS = ['Ahmedabad', 'Surat', 'Vadodara', 'Rajkot', 'Mumbai', 'Delhi', 'Anand'];

interface CityInputProps {
  id?: string;
  value: string;
  onChange: (city: string) => void;
  required?: boolean;
  className?: string;
  showPills?: boolean;
  disabled?: boolean;
  placeholder?: string;
}

export function CityInput({
  id = 'city-input',
  value,
  onChange,
  required = false,
  className,
  showPills = true,
  disabled = false,
  placeholder,
}: CityInputProps) {
  const { language } = useApp();
  const isHi = language === 'hi';

  const isValueInPopular = (POPULAR_CITIES as readonly string[]).includes(value);

  // If value is non-empty and not in popular list, start in custom mode
  const [isCustomMode, setIsCustomMode] = useState<boolean>(() => {
    return Boolean(value && !isValueInPopular);
  });

  // Keep state in sync if value changes externally
  useEffect(() => {
    if (value && !isValueInPopular) {
      setIsCustomMode(true);
    }
  }, [value, isValueInPopular]);

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    if (val === '__CUSTOM__') {
      setIsCustomMode(true);
      onChange('');
    } else {
      setIsCustomMode(false);
      onChange(val);
    }
  };

  const handlePillClick = (cityName: string) => {
    setIsCustomMode(false);
    onChange(cityName);
  };

  const switchToCustom = () => {
    setIsCustomMode(true);
  };

  const switchToList = () => {
    setIsCustomMode(false);
    if (!isValueInPopular) {
      onChange('Ahmedabad');
    }
  };

  return (
    <div className={cn('space-y-1.5', className)}>
      <div className="relative">
        {isCustomMode ? (
          <div className="space-y-1.5">
            <div className="relative">
              <MapPin
                className="pointer-events-none absolute top-3 left-3 h-4 w-4 text-accent"
                aria-hidden
              />
              <input
                id={id}
                type="text"
                list={`${id}-datalist`}
                required={required}
                disabled={disabled}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={
                  placeholder ||
                  (isHi
                    ? 'कोई भी शहर लिखें (उदा. Anand, Udaipur, Nashik, Vapi)...'
                    : 'Type any city name (e.g. Anand, Udaipur, Nashik, Vapi)...')
                }
                className="ks-input pl-9 pr-24"
                autoFocus
              />
              <button
                type="button"
                onClick={switchToList}
                className="absolute top-2 right-2 inline-flex items-center gap-1 rounded-lg border border-line bg-subtle px-2 py-1 text-[11px] font-medium text-muted transition-colors hover:bg-hover hover:text-ink"
                title={isHi ? 'लोकप्रिय सूची से चुनें' : 'Choose from popular list'}
              >
                <List className="h-3 w-3" />
                <span>{isHi ? 'सूची' : 'List'}</span>
              </button>
            </div>

            <datalist id={`${id}-datalist`}>
              {POPULAR_CITIES.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>

            <p className="text-[11px] text-muted flex items-center justify-between">
              <span>{isHi ? '✍️ आप भारत का कोई भी शहर या कस्बा दर्ज कर सकते हैं।' : '✍️ You can enter any city, town or district in India.'}</span>
              <button
                type="button"
                onClick={switchToList}
                className="font-semibold text-accent hover:underline ml-2"
              >
                {isHi ? 'लोकप्रिय शहरों की सूची देखें' : 'View popular city list'}
              </button>
            </p>
          </div>
        ) : (
          <div className="space-y-1.5">
            <div className="relative">
              <select
                id={id}
                required={required}
                disabled={disabled}
                value={value}
                onChange={handleSelectChange}
                className="ks-select pr-10"
              >
                <optgroup label={isHi ? '— लोकप्रिय शहर —' : '— Popular Cities —'}>
                  {POPULAR_CITIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </optgroup>
                <optgroup label={isHi ? '— अन्य शहर —' : '— Other City —'}>
                  <option value="__CUSTOM__">
                    {isHi ? '+ अन्य कोई भी शहर लिखें (Custom City)...' : '+ Type Any Other City (Custom City)...'}
                  </option>
                </optgroup>
              </select>
              <button
                type="button"
                onClick={switchToCustom}
                className="absolute top-2.5 right-8 rounded p-1 text-muted transition-colors hover:text-accent"
                title={isHi ? 'कोई भी शहर टाइप करें' : 'Type custom city'}
              >
                <Edit3 className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Quick Access City Chips */}
      {showPills && (
        <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
          <span className="text-[10px] font-semibold text-faint uppercase tracking-wider mr-0.5">
            {isHi ? 'त्वरित चयन:' : 'Quick:'}
          </span>
          {TOP_PILLS.map((p) => {
            const active = value.toLowerCase() === p.toLowerCase();
            return (
              <button
                key={p}
                type="button"
                onClick={() => handlePillClick(p)}
                className={cn(
                  'inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-medium transition-all',
                  active
                    ? 'bg-accent text-accent-fg shadow-xs'
                    : 'bg-subtle text-muted hover:bg-hover hover:text-ink border border-line/60'
                )}
              >
                {active && <Check className="h-2.5 w-2.5" />}
                {p}
              </button>
            );
          })}
          <button
            type="button"
            onClick={switchToCustom}
            className={cn(
              'inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-semibold transition-all border border-dashed',
              isCustomMode
                ? 'border-accent bg-accent-soft text-accent-strong'
                : 'border-line text-accent hover:bg-accent-soft/50'
            )}
          >
            <Edit3 className="h-2.5 w-2.5" />
            <span>{isHi ? '+ कोई भी शहर' : '+ Any City'}</span>
          </button>
        </div>
      )}
    </div>
  );
}
