import Link from 'next/link';
import { BrandLogo } from '@/components/layout/BrandLogo';
import { BRAND_NAME } from '@/lib/brand';

export default function NotFound() {
  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-16">
      <section className="glass-strong w-full max-w-2xl p-8 sm:p-10 text-center">
        <div className="flex justify-center">
          <BrandLogo className="pointer-events-none" />
        </div>
        <p className="mt-8 text-xs uppercase tracking-[0.3em] text-white/45">404 · page not found</p>
        <h1 className="mt-3 text-3xl sm:text-4xl font-display">This Oakmont destination is unavailable.</h1>
        <p className="mt-3 text-sm sm:text-base text-white/65">
          The page may have moved, the link may be incomplete, or the route is no longer active on {BRAND_NAME}.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link href="/" className="btn-primary text-sm">Return home</Link>
          <Link href="/dashboard" className="btn-ghost text-sm">Open dashboard</Link>
        </div>
      </section>
    </main>
  );
}
