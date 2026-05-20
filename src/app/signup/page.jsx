'use client';
import Link from 'next/link';
import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { Mail, Lock, User, ShieldCheck, Check, Loader2, Gift } from 'lucide-react';
import { useSession } from '@/lib/useSession';
import { BrandLogo } from '@/components/layout/BrandLogo';
function SignupForm() {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [referralCode, setReferralCode] = useState('');
    const [agree, setAgree] = useState(false);
    const [error, setError] = useState(null);
    const [busy, setBusy] = useState(false);
    const { signup } = useSession();
    const router = useRouter();
    const searchParams = useSearchParams();
    // Pre-fill the referral code from ?ref=CODE in the share URL so
    // tap-from-Twitter signups don't have to retype anything.
    useEffect(() => {
        const fromQuery = searchParams?.get('ref');
        if (fromQuery) setReferralCode(fromQuery.toUpperCase().slice(0, 12));
    }, [searchParams]);
    const onSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        if (!agree) { setError('Please accept the terms to continue.'); return; }
        setBusy(true);
        try {
            await signup(email, password, name, referralCode.trim() || undefined);
            router.push('/dashboard');
        } catch (err) {
            setError(err.message || 'Signup failed');
        } finally {
            setBusy(false);
        }
    };
    return (<main className="min-h-screen flex">
      <section className="flex-1 flex items-center justify-center p-6 sm:p-10">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="glass-strong w-full max-w-md p-7">
          <BrandLogo compact className="lg:hidden mb-4" textClassName="text-xl" />
          <h1 className="text-2xl font-display">Create your Oakmont Digital Capital Group account</h1>
          <p className="text-sm text-white/60 mt-1">Trade and invest across stocks, ETFs, crypto, forex, commodities, futures and options with institutional-grade tools.</p>
          <form className="mt-6 space-y-3" onSubmit={onSubmit}>
            <label className="block">
              <span className="text-xs text-white/55">Full name</span>
              <div className="mt-1 flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 focus-within:border-neon-green/40">
                <User className="h-4 w-4 text-white/40"/>
                <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Alexandra Vance" className="bg-transparent outline-none text-sm flex-1"/>
              </div>
            </label>
            <label className="block">
              <span className="text-xs text-white/55">Email</span>
              <div className="mt-1 flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 focus-within:border-neon-green/40">
                <Mail className="h-4 w-4 text-white/40"/>
                <input type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@firm.com" className="bg-transparent outline-none text-sm flex-1"/>
              </div>
            </label>
            <label className="block">
              <span className="text-xs text-white/55">Password</span>
              <div className="mt-1 flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 focus-within:border-neon-green/40">
                <Lock className="h-4 w-4 text-white/40"/>
                <input type="password" required minLength={8} autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 8 characters" className="bg-transparent outline-none text-sm flex-1"/>
              </div>
            </label>
            <label className="block">
              <span className="text-xs text-white/55">Referral code <span className="text-white/35">(optional)</span></span>
              <div className="mt-1 flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 focus-within:border-neon-green/40">
                <Gift className="h-4 w-4 text-white/40"/>
                <input
                  value={referralCode}
                  onChange={(e) => setReferralCode(e.target.value.toUpperCase().slice(0, 12))}
                  placeholder="Referral code"
                  autoComplete="off"
                  spellCheck="false"
                  className="bg-transparent outline-none text-sm flex-1 tracking-wider uppercase"
                />
              </div>
            </label>
            <label className="flex items-start gap-2 text-xs text-white/60">
              <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} className="mt-0.5 accent-neon-green"/>
              I agree to the Oakmont Digital Capital Group Terms of Service, Privacy Policy, and Risk Disclosure.
            </label>
            {error && <p className="text-xs text-neon-red bg-neon-red/10 border border-neon-red/30 rounded-lg px-3 py-2">{error}</p>}
            <button disabled={busy} className="btn-gold w-full disabled:opacity-60">
              {busy ? <><Loader2 className="h-4 w-4 animate-spin"/> Creating…</> : 'Create account'}
            </button>
          </form>
          <p className="mt-5 text-xs text-white/55 text-center">
            Already have an account? <Link href="/login" className="text-neon-green hover:underline">Sign in</Link>
          </p>
        </motion.div>
      </section>
      <section className="hidden lg:flex w-1/2 relative items-center justify-center p-12 overflow-hidden">
        <div className="absolute inset-0 bg-grid opacity-30"/>
        <div className="absolute -top-20 -right-20 h-[420px] w-[420px] rounded-full bg-neon-green/10 blur-3xl"/>
        <div className="absolute -bottom-40 -left-20 h-[420px] w-[420px] rounded-full bg-gold-500/10 blur-3xl"/>
        <div className="relative max-w-md">
          <h2 className="text-3xl font-display leading-tight">
            Join <span className="text-gradient-gold">4.1M+ investors</span><br />on Oakmont Digital Capital Group.
          </h2>
          <p className="mt-3 text-white/65">Onboard in minutes. Full KYC verification typically completes in under an hour.</p>
          <ul className="mt-6 space-y-3 text-sm text-white/75">
            {[
            'Spot, futures & OTC desk',
            'AI Trading Bot · Aurelia',
            'Managed portfolios & yield',
            'Institutional API · FIX 4.4',
            'Multi-jurisdiction compliance',
        ].map((f) => (<li key={f} className="flex gap-2">
                <Check className="h-5 w-5 text-neon-green"/> {f}
              </li>))}
          </ul>
          <div className="mt-6 chip bg-white/5 border border-white/10 text-white/70">
            <ShieldCheck className="h-3.5 w-3.5 text-neon-green"/> Bank-grade security · SOC 2 · ISO 27001
          </div>
        </div>
      </section>
    </main>);
}

export default function SignupPage() {
    return (
        <Suspense fallback={null}>
            <SignupForm />
        </Suspense>
    );
}
