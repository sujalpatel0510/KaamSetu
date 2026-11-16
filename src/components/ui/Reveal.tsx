'use client';

import React, { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/cn';

interface RevealProps {
  children: React.ReactNode;
  /** Stagger delay in milliseconds. */
  delay?: number;
  className?: string;
  as?: 'div' | 'section';
}

/**
 * Scroll-triggered entrance animation using IntersectionObserver and CSS
 * transitions (no runtime animation library). Automatically disabled for
 * users who prefer reduced motion (see globals.css).
 */
export default function Reveal({
  children,
  delay = 0,
  className,
  as: Tag = 'div',
}: RevealProps) {
  const ref = useRef<HTMLElement | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisible(true);
            observer.disconnect();
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -8% 0px' }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <Tag
      ref={ref as React.Ref<never>}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
      className={cn('ks-reveal', visible && 'ks-reveal-visible', className)}
    >
      {children}
    </Tag>
  );
}
