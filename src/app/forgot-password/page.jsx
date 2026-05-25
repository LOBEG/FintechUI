'use client';
import Link from 'next/link';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Loader2, ShieldCheck } from 'lucide-react';
import { api } from '@/lib/useSession';
import { BrandLogo } from '@/components/layout/BrandLogo';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState(null);
  const onSubmit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await api.post('/api/auth/forgot-password', { email });
      setDone(true);
    } catch (err) {
      setError(err.message || 'Request failed');
    } finally {
      setBusy(false);
    }
  };
  return (
    <main className="min-h-screen flex items-center justify-center p-6 sm:p-10">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="glass-strong w-full max-w-md p-7">
        <BrandLogo compact className="mb-4" textClassName="text-xl" />
        <h1 className="text-2xl font-display">Reset your password</h1>
        <p className="text-sm text-white/60 mt-1">Enter the email associated with your account and we&rsquo;ll send you a reset link.</p>
        {done ? (
          <div className="mt-6 glass-light p-4 text-sm">
            <p className="flex items-center gap-2 text-accent-success"><ShieldCheck className="h-4 w-4"/> Check your inbox.</p>
            <p className="mt-2 text-white/70">If an account exists for that email, a reset link valid for one hour has been sent. The link is single-use.</p>
            <p className="mt-3 text-xs text-white/55">Didn&rsquo;t receive it? Check your spam folder, or <button onClick={() => setDone(false)} className="text-accent-success hover:underline">try again</button>.</p>
          </div>
        ) : (
          <form className="mt-6 space-y-3" onSubmit={onSubmit}>
            <label className="block">
              <span className="text-xs text-white/55">Email</span>
              <div className="mt-1 flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 focus-within:border-accent-success/40">
                <Mail className="h-4 w-4 text-white/40"/>
                <input type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@firm.com" className="bg-transparent outline-none text-sm flex-1"/>
              </div>
            </label>
            {error && <p className="text-xs text-accent-error bg-accent-error/10 border border-accent-error/30 rounded-lg px-3 py-2">{error}</p>}
            <button disabled={busy} className="btn-primary w-full mt-2 disabled:opacity-60">
              {busy ? <><Loader2 className="h-4 w-4 animate-spin"/> Sending…</> : 'Send reset link'}
            </button>
          </form>
        )}
        <p className="mt-5 text-xs text-white/55 text-center">
          Remembered it? <Link href="/login" className="text-accent-success hover:underline">Back to sign in</Link>
        </p>
      </motion.div>
    </main>
  );
}
