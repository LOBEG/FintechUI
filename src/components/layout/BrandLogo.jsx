import Link from 'next/link';
import { BRAND_NAME } from '@/lib/brand';

// Oakmont DCG mark: a shielded capital monogram with a live-market orbit.
export function OakmontLogoMark({ className = 'h-9 w-9' }) {
  return (
    <span className={`${className} inline-flex items-center justify-center rounded-[1.1rem] bg-[#06111f] border border-cyan/25 shadow-[0_0_34px_rgba(56,189,248,0.18)] overflow-hidden`} aria-hidden="true">
      <svg viewBox="0 0 64 64" className="h-full w-full" role="img" aria-label={`${BRAND_NAME} logo`}>
        <defs>
          <radialGradient id="oakmont-orb" cx="32%" cy="18%" r="82%">
            <stop offset="0%" stopColor="#123f4f"/>
            <stop offset="58%" stopColor="#071525"/>
            <stop offset="100%" stopColor="#030713"/>
          </radialGradient>
          <linearGradient id="oakmont-gold" x1="12" y1="4" x2="52" y2="60" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#fff3bd"/>
            <stop offset="48%" stopColor="#d8a742"/>
            <stop offset="100%" stopColor="#765116"/>
          </linearGradient>
          <linearGradient id="oakmont-cyan" x1="10" y1="54" x2="54" y2="10">
            <stop offset="0%" stopColor="#00ffa3"/>
            <stop offset="100%" stopColor="#38bdf8"/>
          </linearGradient>
        </defs>
        <path d="M32 6 L52 15 V31 C52 44 43 54 32 59 C21 54 12 44 12 31 V15 L32 6Z" fill="url(#oakmont-orb)" stroke="url(#oakmont-gold)" strokeWidth="1.8"/>
        <path d="M19 35 C24 25 40 25 45 35" fill="none" stroke="url(#oakmont-cyan)" strokeWidth="2.4" strokeLinecap="round"/>
        <path d="M21 42 L28 31 L34 39 L43 22" fill="none" stroke="url(#oakmont-gold)" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round"/>
        <circle cx="45" cy="22" r="3" fill="#38bdf8"/>
        <path d="M24 49 H40" stroke="url(#oakmont-gold)" strokeWidth="2" strokeLinecap="round"/>
        <text x="31.5" y="29" textAnchor="middle" fontFamily="ui-serif, Georgia, 'Times New Roman', serif" fontWeight="900" fontSize="13" fill="#fff3bd" dominantBaseline="middle">OD</text>
      </svg>
    </span>
  );
}

export function BrandWordmark({ compact = false, className = '' }) {
  return (
      <span className={`font-display tracking-wide leading-tight whitespace-nowrap ${className}`}>
      <span className="text-gradient-gold">Oakmont</span>
      <span className="text-white whitespace-nowrap">{compact ? ' DCG' : ' Digital Capital Group'}</span>
    </span>
  );
}

export function BrandLogo({ href = '/', compact = false, className = '', markClassName = 'h-9 w-9', textClassName = 'text-xl' }) {
  return (
    <Link href={href} className={`flex items-center gap-2 group ${className}`}>
      <OakmontLogoMark className={markClassName}/>
      <BrandWordmark compact={compact} className={textClassName}/>
    </Link>
  );
}
