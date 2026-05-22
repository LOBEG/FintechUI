import Link from 'next/link';
import { BRAND_LOGO_URL, BRAND_NAME } from '@/lib/brand';

export function OakmontLogoMark({ className = 'h-11 w-11' }) {
  // eslint-disable-next-line @next/next/no-img-element
  return (
    <img src={BRAND_LOGO_URL} alt={`${BRAND_NAME} logo`} className={`${className} object-contain`} loading="eager" decoding="async" fetchPriority="high" aria-hidden="true"/>
  );
}

export function BrandWordmark({ className = '' }) {
  return (
      <span className={`font-display tracking-wide leading-none whitespace-nowrap min-w-0 ${className}`}>
      <span className="text-gradient-primary">Oakmont</span>
      <span className="text-white whitespace-nowrap"> DCG</span>
    </span>
  );
}

export function BrandLogo({ href = '/', compact = false, className = '', markClassName = 'h-11 w-11', textClassName = 'text-2xl' }) {
  return (
    <Link href={href} className={`flex items-center gap-2.5 group min-w-0 ${className}`}>
      <OakmontLogoMark className={markClassName}/>
      <BrandWordmark compact={compact} className={textClassName}/>
    </Link>
  );
}
