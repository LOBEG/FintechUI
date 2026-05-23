'use client';
import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff, ShieldCheck, Loader2 } from 'lucide-react';
import { useSession } from '@/lib/useSession';
import { useNotifications } from '@/components/Notifications';
import { BrandLogo } from '@/components/layout/BrandLogo';
export default function LoginPage() {
    const [show, setShow] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState(null);
    const [busy, setBusy] = useState(false);
    const { login } = useSession();
    const { notify } = useNotifications();
    const router = useRouter();
    const onSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setBusy(true);
        try {
            const u = await login(email, password);
            notify({ level: 'success', title: 'Signed in', message: `Welcome back, ${u.name || u.email}.` });
            router.push(u.isAdmin ? '/admin' : '/dashboard');
        } catch (err) {
            setError(err.message || 'Login failed');
            notify({ level: 'error', title: 'Sign-in failed', message: err.message || 'Please check your credentials.' });
        } finally {
            setBusy(false);
        }
    };
    return (<main className="min-h-screen flex relative bg-gradient-to-br from-stone-950 via-zinc-900 to-neutral-950">
      <section className="hidden lg:flex w-1/2 relative items-center justify-center p-12 overflow-hidden">
        <div className="absolute inset-0 bg-grid opacity-30"/>
        <div className="absolute -top-40 -left-20 h-[420px] w-[420px] rounded-full bg-accent-success/10 blur-3xl"/>
        <div className="absolute -bottom-40 -right-20 h-[420px] w-[420px] rounded-full bg-accent-success/10 blur-3xl"/>
        <div className="relative max-w-md">
          <BrandLogo textClassName="text-2xl" />
          <h2 className="mt-10 text-3xl font-display leading-tight">
            Welcome back to the<br /><span className="text-gradient-primary">professional management of digital wealth</span>.
          </h2>
          <p className="mt-3 text-white/65">Sign in to manage portfolios, execute trades, and monitor your Oakmont Digital Markets Groups investments.</p>
          <ul className="mt-6 space-y-3 text-sm text-white/70">
            <li className="flex gap-2"><ShieldCheck className="h-5 w-5 text-accent-success"/> Hardware MFA + passkeys</li>
            <li className="flex gap-2"><ShieldCheck className="h-5 w-5 text-slate-400"/> SOC 2 · ISO 27001 · MiCA</li>
            <li className="flex gap-2"><ShieldCheck className="h-5 w-5 text-slate-400"/> 95% cold storage custody</li>
          </ul>
        </div>
      </section>
      <section className="flex-1 flex items-center justify-center p-6 sm:p-10">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="glass-strong w-full max-w-md p-7">
          <h1 className="text-2xl font-display">Sign in to Oakmont Digital Markets Groups</h1>
          <p className="text-sm text-white/60 mt-1">Welcome back. Please enter your details.</p>
          <form className="mt-6 space-y-3" onSubmit={onSubmit}>
            <label className="block">
              <span className="text-xs text-white/55">Email</span>
              <div className="mt-1 flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 focus-within:border-accent-success/40">
                <Mail className="h-4 w-4 text-white/40"/>
                <input type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@firm.com" className="bg-transparent outline-none text-sm flex-1"/>
              </div>
            </label>
            <label className="block">
              <span className="text-xs text-white/55">Password</span>
              <div className="mt-1 flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 focus-within:border-accent-success/40">
                <Lock className="h-4 w-4 text-white/40"/>
                <input type={show ? 'text' : 'password'} autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="bg-transparent outline-none text-sm flex-1"/>
                <button type="button" onClick={() => setShow(!show)} aria-label="Toggle password visibility">
                  {show ? <EyeOff className="h-4 w-4 text-white/40"/> : <Eye className="h-4 w-4 text-white/40"/>}
                </button>
              </div>
            </label>
            <div className="flex items-center justify-between text-xs text-white/60">
              <label className="inline-flex items-center gap-2"><input type="checkbox" className="accent-neon-green"/> Remember me</label>
              <Link href="/forgot-password" className="hover:text-white">Forgot password?</Link>
            </div>
            {error && <p className="text-xs text-accent-error bg-accent-error/10 border border-accent-error/30 rounded-lg px-3 py-2">{error}</p>}
            <button disabled={busy} className="btn-primary w-full mt-2 disabled:opacity-60">
              {busy ? <><Loader2 className="h-4 w-4 animate-spin"/> Signing in…</> : 'Sign in'}
            </button>
          </form>
          <div className="my-5 flex items-center gap-3 text-[11px] text-white/40">
            <span className="flex-1 h-px bg-white/10"/> sign in to continue <span className="flex-1 h-px bg-white/10"/>
          </div>
          <p className="mt-5 text-xs text-white/55 text-center">
            New to Oakmont Digital Markets Groups? <Link href="/signup" className="text-accent-success hover:underline">Create an account</Link>
          </p>
        </motion.div>
      </section>
    </main>);
}
