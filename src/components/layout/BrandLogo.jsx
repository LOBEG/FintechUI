import Link from 'next/link';
import { BRAND_LOGO_URL, BRAND_NAME } from '@/lib/brand';

export function OakmontLogoMark({ className = 'h-9 w-9' }) {
  return (
    <span className={`${className} inline-flex items-center justify-center rounded-[1.1rem] bg-[#03121f] border border-cyan/50 shadow-[0_0_42px_rgba(6,214,196,0.34)] overflow-hidden`} aria-hidden="true">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={BRAND_LOGO_URL} alt={`${BRAND_NAME} logo`} className="h-full w-full object-cover"/>
    </span>
  );
}

export function BrandWordmark({ className = '' }) {
  const [, ...rest] = BRAND_NAME.split(' ');
  return (
      <span className={`font-display tracking-wide leading-tight whitespace-nowrap min-w-0 ${className}`}>
      <span className="text-gradient-neon">Oakmont</span>
      <span className="text-white whitespace-nowrap"> {rest.join(' ')}</span>
    </span>
  );
}

export function BrandLogo({ href = '/', compact = false, className = '', markClassName = 'h-9 w-9', textClassName = 'text-xl' }) {
  return (
    <Link href={href} className={`flex items-center gap-2 group min-w-0 ${className}`}>
      <OakmontLogoMark className={markClassName}/>
      <BrandWordmark compact={compact} className={textClassName}/>
    </Link>
  );
}
