import React from 'react';
import Image from 'next/image';

interface LogoProps {
  size?: number;
  className?: string;
  showText?: boolean;
}

export default function Logo({ size = 36, className = '', showText = false }: LogoProps) {
  return (
    <div className={`inline-flex items-center gap-2.5 ${className}`}>
      {/* Crisp vector logo icon */}
      <div
        style={{ width: size, height: size }}
        className="relative shrink-0 overflow-hidden rounded-xl shadow-xs transition-transform hover:scale-105"
      >
        <Image
          src="/logo.svg"
          alt="KaamSetu Logo"
          width={size}
          height={size}
          priority
          className="h-full w-full object-contain"
        />
      </div>

      {showText && (
        <div className="leading-tight">
          <span className="text-base font-black tracking-tight text-ink">
            Kaam<span className="text-accent">Setu</span>
          </span>
        </div>
      )}
    </div>
  );
}
