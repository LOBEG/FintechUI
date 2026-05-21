import Link from 'next/link';
import { BRAND_NAME } from '@/lib/brand';

// Oakmont DCG mark: a dimensional capital-ring with an oak-leaf apex and
// market pulse accent. It stays fully scalable as a single SVG.
export function OakmontLogoMark({ className = 'h-9 w-9' }) {
  return (
    <span className={`${className} inline-flex items-center justify-center rounded-2xl bg-[#040b16] border border-gold-300/40 shadow-gold overflow-hidden`} aria-hidden="true">
      <svg viewBox="0 0 64 64" className="h-full w-full" role="img" aria-label={`${BRAND_NAME} logo`}>
        <defs>
          <radialGradient id="oakmont-orb" cx="28%" cy="18%" r="78%">
            <stop offset="0%" stopColor="#1f3b5d"/>
            <stop offset="52%" stopColor="#081a2c"/>
            <stop offset="100%" stopColor="#020713"/>
          </radialGradient>
          <linearGradient id="oakmont-gold" x1="9" y1="6" x2="55" y2="58" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#fff3bd"/>
            <stop offset="48%" stopColor="#d8a742"/>
            <stop offset="100%" stopColor="#765116"/>
          </linearGradient>
          <linearGradient id="oakmont-cyan" x1="13" y1="52" x2="52" y2="24">
            <stop offset="0%" stopColor="#00ffa3"/>
            <stop offset="100%" stopColor="#38bdf8"/>
          </linearGradient>
        </defs>
        <circle cx="32" cy="32" r="27" fill="url(#oakmont-orb)" stroke="url(#oakmont-gold)" strokeWidth="1.8"/>
        <path d="M32 9 C27 15 25 20 26 26 C29 25 32 22 32 17 C32 22 35 25 38 26 C39 20 37 15 32 9Z" fill="url(#oakmont-gold)"/>
        <path d="M18 41 C21 28 43 28 46 41" fill="none" stroke="url(#oakmont-gold)" strokeWidth="4" strokeLinecap="round"/>
        <path d="M23 42 L29 37 L34 40 L42 30" fill="none" stroke="url(#oakmont-cyan)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M20 49 H45" stroke="url(#oakmont-gold)" strokeWidth="2" strokeLinecap="round"/>
        <text x="32" y="37" textAnchor="middle" fontFamily="ui-serif, Georgia, 'Times New Roman', serif" fontWeight="800" fontSize="13" fill="#fff3bd" dominantBaseline="middle">O</text>
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
