import Link from 'next/link';
import { BRAND_LOGO_URL, BRAND_NAME } from '@/lib/brand';

export function OakmontLogoMark({ className = 'h-9 w-9' }) {
  return (
    <span className={`${className} inline-flex items-center justify-center rounded-[1.1rem] bg-[#06111f] border border-cyan/35 shadow-[0_0_34px_rgba(6,214,196,0.22)] overflow-hidden`} aria-hidden="true">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={BRAND_LOGO_URL} alt={`${BRAND_NAME} logo`} className="h-full w-full object-contain p-0.5"/>
    </span>
  );
}

export function BrandWordmark({ compact = false, className = '' }) {
  return (
      <span className={`font-display tracking-wide leading-tight whitespace-nowrap ${className}`}>
      <span className="text-gradient-neon">Oakmont</span>
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
