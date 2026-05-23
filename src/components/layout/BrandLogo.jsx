import Link from 'next/link';
import { BRAND_LOGO_URL, BRAND_NAME } from '@/lib/brand';

export function OakmontLogoMark({ className = 'h-11 w-11' }) {
  // eslint-disable-next-line @next/next/no-img-element
  return (
    <img 
      src={BRAND_LOGO_URL} 
      alt={`${BRAND_NAME} logo`} 
      className={`${className} object-contain drop-shadow-[0_2px_8px_rgba(255,255,255,0.15)]`} 
      loading="eager" 
      decoding="async" 
      fetchPriority="high" 
      aria-hidden="true"
    />
  );
}

export function BrandWordmark({ className = '' }) {
  return (
      <span className={`font-display tracking-tight leading-none whitespace-nowrap min-w-0 font-semibold ${className}`}>
      <span className="text-gradient-primary">Oakmont</span>
      <span className="text-white/95 whitespace-nowrap"> DCG</span>
    </span>
  );
}

export function BrandLogo({ href = '/', compact = false, className = '', markClassName = 'h-11 w-11', textClassName = 'text-2xl' }) {
  return (
    <Link href={href} className={`flex items-center gap-3 group min-w-0 transition-opacity hover:opacity-90 ${className}`}>
      <OakmontLogoMark className={markClassName}/>
      <BrandWordmark compact={compact} className={textClassName}/>
    </Link>
  );
}
