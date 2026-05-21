import Link from 'next/link';
import { BRAND_NAME } from '@/lib/brand';

// Polished Oakmont DMG monogram. The mark layers a dark navy shield, a
// soft gold gradient frame, a stylised oak crown and a stacked "O" mark
// with a chart-baseline accent. It is fully scalable (single SVG) and
// reused in the public favicon / apple touch icon so the brand identity
// stays consistent.
export function OakmontLogoMark({ className = 'h-9 w-9' }) {
  return (
    <span className={`${className} inline-flex items-center justify-center rounded-xl bg-[#07111f] border border-gold-400/35 shadow-gold overflow-hidden`} aria-hidden="true">
      <svg viewBox="0 0 64 64" className="h-full w-full" role="img" aria-label={`${BRAND_NAME} logo`}>
        <defs>
          <linearGradient id="oakmont-shield" x1="8" y1="6" x2="56" y2="60" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#0f1b30"/>
            <stop offset="100%" stopColor="#05101f"/>
          </linearGradient>
          <linearGradient id="oakmont-gold" x1="10" y1="8" x2="54" y2="58" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#f7e7a3"/>
            <stop offset="45%" stopColor="#d4a63f"/>
            <stop offset="100%" stopColor="#8d641d"/>
          </linearGradient>
        </defs>
        {/* shield body */}
        <path d="M32 5 L55 12 V31 C55 45 45 55 32 59 C19 55 9 45 9 31 V12 Z" fill="url(#oakmont-shield)" stroke="url(#oakmont-gold)" strokeWidth="1.6"/>
        {/* oak crown - three stylised leaves */}
        <path d="M32 14 C28 18 26 21 26 25 C26 26 27 26 27.5 25.4 C28.5 27 30 28 32 28 C34 28 35.5 27 36.5 25.4 C37 26 38 26 38 25 C38 21 36 18 32 14 Z" fill="url(#oakmont-gold)"/>
        <circle cx="32" cy="30.6" r="1.4" fill="#07111f"/>
        {/* monogram O */}
        <circle cx="32" cy="40" r="7.5" fill="none" stroke="url(#oakmont-gold)" strokeWidth="2.2"/>
        {/* chart baseline accent */}
        <path d="M20 52 L26 49 L31 51 L37 46 L44 48" stroke="url(#oakmont-gold)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
        <text x="32" y="40.7" textAnchor="middle" fontFamily="ui-serif, Georgia, 'Times New Roman', serif" fontWeight="700" fontSize="9" fill="#f7e7a3" dominantBaseline="middle">O</text>
      </svg>
    </span>
  );
}

export function BrandWordmark({ compact = false, className = '' }) {
  return (
    <span className={`font-display tracking-wide leading-tight whitespace-nowrap ${className}`}>
      <span className="text-gradient-gold">Oakmont</span>
      <span className="text-white whitespace-nowrap">{compact ? ' DMG' : ' Digital Markets Group'}</span>
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
