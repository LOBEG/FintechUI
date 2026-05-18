'use client';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Mail, Lock, User, Sparkles, ShieldCheck, Check } from 'lucide-react';

export default function SignupPage() {
  return (
    <main className="min-h-screen flex">
      <section className="flex-1 flex items-center justify-center p-6 sm:p-10">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="glass-strong w-full max-w-md p-7">
          <Link href="/" className="flex items-center gap-2 lg:hidden mb-4">
            <span className="h-9 w-9 rounded-xl bg-gold-grad inline-flex items-center justify-center text-ink-950"><Sparkles className="h-4 w-4" /></span>
            <span className="text-xl font-display"><span className="text-gradient-gold">Aurum</span>X</span>
          </Link>
          <h1 className="text-2xl font-display">Create your AurumX account</h1>
          <p className="text-sm text-white/60 mt-1">Trade and invest in digital assets with institutional grade tools.</p>
          <form className="mt-6 space-y-3" onSubmit={(e) => e.preventDefault()}>
            <label className="block">
              <span className="text-xs text-white/55">Full name</span>
              <div className="mt-1 flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 focus-within:border-neon-green/40">
                <User className="h-4 w-4 text-white/40" />
                <input placeholder="Alexandra Vance" className="bg-transparent outline-none text-sm flex-1" />
              </div>
            </label>
            <label className="block">
              <span className="text-xs text-white/55">Email</span>
              <div className="mt-1 flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 focus-within:border-neon-green/40">
                <Mail className="h-4 w-4 text-white/40" />
                <input type="email" placeholder="you@firm.com" className="bg-transparent outline-none text-sm flex-1" />
              </div>
            </label>
            <label className="block">
              <span className="text-xs text-white/55">Password</span>
              <div className="mt-1 flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 focus-within:border-neon-green/40">
                <Lock className="h-4 w-4 text-white/40" />
                <input type="password" placeholder="At least 12 characters" className="bg-transparent outline-none text-sm flex-1" />
              </div>
            </label>
            <label className="flex items-start gap-2 text-xs text-white/60">
              <input type="checkbox" className="mt-0.5 accent-neon-green" />
              I agree to the AurumX Terms of Service, Privacy Policy, and Risk Disclosure.
            </label>
            <button className="btn-gold w-full">Create account</button>
          </form>
          <p className="mt-5 text-xs text-white/55 text-center">
            Already have an account? <Link href="/login" className="text-neon-green hover:underline">Sign in</Link>
          </p>
        </motion.div>
      </section>
      <section className="hidden lg:flex w-1/2 relative items-center justify-center p-12 overflow-hidden">
        <div className="absolute inset-0 bg-grid opacity-30" />
        <div className="absolute -top-20 -right-20 h-[420px] w-[420px] rounded-full bg-neon-green/10 blur-3xl" />
        <div className="absolute -bottom-40 -left-20 h-[420px] w-[420px] rounded-full bg-gold-500/10 blur-3xl" />
        <div className="relative max-w-md">
          <h2 className="text-3xl font-display leading-tight">
            Join <span className="text-gradient-gold">4.1M+ investors</span><br />on AurumX.
          </h2>
          <p className="mt-3 text-white/65">Onboard in minutes. Full KYC verification typically completes in under an hour.</p>
          <ul className="mt-6 space-y-3 text-sm text-white/75">
            {[
              'Spot, futures & OTC desk',
              'AI Trading Bot · Aurelia',
              'Managed portfolios & yield',
              'Institutional API · FIX 4.4',
              'Multi-jurisdiction compliance',
            ].map((f) => (
              <li key={f} className="flex gap-2">
                <Check className="h-5 w-5 text-neon-green" /> {f}
              </li>
            ))}
          </ul>
          <div className="mt-6 chip bg-white/5 border border-white/10 text-white/70">
            <ShieldCheck className="h-3.5 w-3.5 text-neon-green" /> Bank-grade security · SOC 2 · ISO 27001
          </div>
        </div>
      </section>
    </main>
  );
}
