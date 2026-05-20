import Link from 'next/link';
import { BRAND_NAME } from '@/lib/brand';

export function OakmontLogoMark({ className = 'h-9 w-9' }) {
  return (
    <span className={`${className} inline-flex items-center justify-center rounded-xl bg-[#07111f] border border-gold-400/35 shadow-gold overflow-hidden`} aria-hidden="true">
      <svg viewBox="0 0 64 64" className="h-full w-full" role="img" aria-label={`${BRAND_NAME} logo`}>
        <rect width="64" height="64" rx="14" fill="#07111f"/>
        <path d="M14 45h36" stroke="#d4a63f" strokeWidth="4" strokeLinecap="round"/>
        <path d="M18 40V25l14-8 14 8v15" fill="none" stroke="#d4a63f" strokeWidth="4" strokeLinejoin="round"/>
        <path d="M24 40V28h16v12" fill="none" stroke="#f7e7a3" strokeWidth="3" strokeLinejoin="round"/>
        <path d="M32 18v22" stroke="#d4a63f" strokeWidth="2.4" strokeLinecap="round"/>
        <circle cx="32" cy="25" r="3.5" fill="#07111f" stroke="#f7e7a3" strokeWidth="2"/>
      </svg>
    </span>
  );
}

export function BrandWordmark({ compact = false, className = '' }) {
  return (
    <span className={`font-display tracking-wide leading-tight ${className}`}>
      <span className="text-gradient-gold">Oakmont</span>
      <span className="text-white">{compact ? ' DCG' : ' Digital Capital Group'}</span>
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
