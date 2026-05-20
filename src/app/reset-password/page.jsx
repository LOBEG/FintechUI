'use client';
import Link from 'next/link';
import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { Lock, Eye, EyeOff, Loader2, ShieldCheck } from 'lucide-react';
import { api } from '@/lib/useSession';
import { BrandLogo } from '@/components/layout/BrandLogo';

function ResetPasswordInner() {
  const params = useSearchParams();
  const router = useRouter();
  const token = params.get('token') || '';
  const code = params.get('code') || '';
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState(null);
  const onSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    if (password.length < 8) { setError('Password must be at least 8 characters.'); return; }
    if (password !== confirm) { setError('Passwords do not match.'); return; }
    setBusy(true);
    try {
      await api.post('/api/auth/reset-password', { token, code, password });
      setDone(true);
      setTimeout(() => router.push('/login'), 2000);
    } catch (err) {
      setError(err.message || 'Reset failed');
    } finally {
      setBusy(false);
    }
  };
  return (
    <main className="min-h-screen flex items-center justify-center p-6 sm:p-10">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="glass-strong w-full max-w-md p-7">
        <BrandLogo compact className="mb-4" textClassName="text-xl" />
        <h1 className="text-2xl font-display">Choose a new password</h1>
        <p className="text-sm text-white/60 mt-1">Your new password takes effect immediately. All other sessions stay signed in &mdash; revoke them from Sessions &amp; devices.</p>
        {!token || !code ? (
          <p className="mt-6 text-xs text-neon-red bg-neon-red/10 border border-neon-red/30 rounded-lg px-3 py-2">This reset link is incomplete. Request a new one from the <Link href="/forgot-password" className="underline">Forgot password</Link> page.</p>
        ) : done ? (
          <div className="mt-6 glass-light p-4 text-sm">
            <p className="flex items-center gap-2 text-neon-green"><ShieldCheck className="h-4 w-4"/> Password updated.</p>
            <p className="mt-2 text-white/70">Redirecting you to sign in…</p>
          </div>
        ) : (
          <form className="mt-6 space-y-3" onSubmit={onSubmit}>
            <label className="block">
              <span className="text-xs text-white/55">New password</span>
              <div className="mt-1 flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 focus-within:border-neon-green/40">
                <Lock className="h-4 w-4 text-white/40"/>
                <input type={show ? 'text' : 'password'} autoComplete="new-password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 8 characters" className="bg-transparent outline-none text-sm flex-1"/>
                <button type="button" onClick={() => setShow(!show)} aria-label="Toggle password visibility">
                  {show ? <EyeOff className="h-4 w-4 text-white/40"/> : <Eye className="h-4 w-4 text-white/40"/>}
                </button>
              </div>
            </label>
            <label className="block">
              <span className="text-xs text-white/55">Confirm new password</span>
              <div className="mt-1 flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 focus-within:border-neon-green/40">
                <Lock className="h-4 w-4 text-white/40"/>
                <input type={show ? 'text' : 'password'} autoComplete="new-password" required minLength={8} value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="Re-enter password" className="bg-transparent outline-none text-sm flex-1"/>
              </div>
            </label>
            {error && <p className="text-xs text-neon-red bg-neon-red/10 border border-neon-red/30 rounded-lg px-3 py-2">{error}</p>}
            <button disabled={busy} className="btn-primary w-full mt-2 disabled:opacity-60">
              {busy ? <><Loader2 className="h-4 w-4 animate-spin"/> Updating…</> : 'Update password'}
            </button>
          </form>
        )}
        <p className="mt-5 text-xs text-white/55 text-center">
          <Link href="/login" className="text-neon-green hover:underline">Back to sign in</Link>
        </p>
      </motion.div>
    </main>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<main className="min-h-screen flex items-center justify-center p-6"><Loader2 className="h-5 w-5 animate-spin text-white/60"/></main>}>
      <ResetPasswordInner/>
    </Suspense>
  );
}
