'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { BrandLogo } from '@/components/layout/BrandLogo';
import { BRAND_NAME } from '@/lib/brand';

export default function Error({ error, reset }) {
  useEffect(() => {
    console.error('[app:error]', error);
  }, [error]);

  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-16">
      <section className="glass-strong w-full max-w-2xl p-8 sm:p-10 text-center">
        <div className="flex justify-center">
          <BrandLogo className="pointer-events-none" />
        </div>
        <p className="mt-8 text-xs uppercase tracking-[0.3em] text-white/45">Platform recovery</p>
        <h1 className="mt-3 text-3xl sm:text-4xl font-display">Oakmont hit a temporary problem.</h1>
        <p className="mt-3 text-sm sm:text-base text-white/65">
          We could not complete that request just now. Live services are still protected and you can safely retry.
        </p>
        <p className="mt-4 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-left text-xs text-white/55">
          {process.env.NODE_ENV === 'production'
            ? `${BRAND_NAME} could not render this view.`
            : (error?.message || `${BRAND_NAME} could not render this view.`)}
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <button type="button" onClick={reset} className="btn-primary text-sm">Try again</button>
          <Link href="/dashboard" className="btn-ghost text-sm">Go to dashboard</Link>
        </div>
      </section>
    </main>
  );
}
