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
    <span className={`inline-flex max-w-full flex-nowrap items-baseline gap-x-1 font-display tracking-tight leading-[1.05] font-semibold overflow-visible whitespace-nowrap ${className}`} aria-label={BRAND_NAME}>
      <span className="text-gradient-primary">Oakmont</span>
      <span className="text-white/95">Digital</span>
      <span className="text-white/95">Markets</span>
      <span className="text-white/95">Groups</span>
    </span>
  );
}

export function BrandLogo({ href = '/', compact = false, className = '', markClassName = 'h-11 w-11', textClassName = 'text-2xl', showMark = true }) {
  return (
    <Link href={href} className={`flex items-center gap-2 sm:gap-3 group min-w-0 overflow-visible transition-opacity hover:opacity-90 ${className}`}>
      {showMark && <OakmontLogoMark className={markClassName}/>}
      <BrandWordmark compact={compact} className={textClassName}/>
    </Link>
  );
}
