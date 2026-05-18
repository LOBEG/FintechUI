'use client';
import Link from 'next/link';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff, Sparkles, ShieldCheck } from 'lucide-react';
import { Web3ConnectButton } from '@/components/widgets/Web3ConnectButton';
export default function LoginPage() {
    const [show, setShow] = useState(false);
    return (<main className="min-h-screen flex">
      <section className="hidden lg:flex w-1/2 relative items-center justify-center p-12 overflow-hidden">
        <div className="absolute inset-0 bg-grid opacity-30"/>
        <div className="absolute -top-40 -left-20 h-[420px] w-[420px] rounded-full bg-gold-500/10 blur-3xl"/>
        <div className="absolute -bottom-40 -right-20 h-[420px] w-[420px] rounded-full bg-neon-green/10 blur-3xl"/>
        <div className="relative max-w-md">
          <Link href="/" className="flex items-center gap-2">
            <span className="h-10 w-10 rounded-xl bg-gold-grad inline-flex items-center justify-center text-ink-950"><Sparkles className="h-5 w-5"/></span>
            <span className="text-2xl font-display"><span className="text-gradient-gold">Aurum</span>X</span>
          </Link>
          <h2 className="mt-10 text-3xl font-display leading-tight">
            Welcome back to the<br /><span className="text-gradient-gold">luxury of digital wealth</span>.
          </h2>
          <p className="mt-3 text-white/65">Sign in to manage portfolios, execute trades, and monitor your AurumX investments.</p>
          <ul className="mt-6 space-y-3 text-sm text-white/70">
            <li className="flex gap-2"><ShieldCheck className="h-5 w-5 text-neon-green"/> Hardware MFA + passkeys</li>
            <li className="flex gap-2"><ShieldCheck className="h-5 w-5 text-gold-400"/> SOC 2 · ISO 27001 · MiCA</li>
            <li className="flex gap-2"><ShieldCheck className="h-5 w-5 text-neon-orange"/> 95% cold storage custody</li>
          </ul>
        </div>
      </section>
      <section className="flex-1 flex items-center justify-center p-6 sm:p-10">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="glass-strong w-full max-w-md p-7">
          <h1 className="text-2xl font-display">Sign in to AurumX</h1>
          <p className="text-sm text-white/60 mt-1">Welcome back. Please enter your details.</p>
          <form className="mt-6 space-y-3" onSubmit={(e) => e.preventDefault()}>
            <label className="block">
              <span className="text-xs text-white/55">Email</span>
              <div className="mt-1 flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 focus-within:border-neon-green/40">
                <Mail className="h-4 w-4 text-white/40"/>
                <input type="email" placeholder="you@firm.com" className="bg-transparent outline-none text-sm flex-1"/>
              </div>
            </label>
            <label className="block">
              <span className="text-xs text-white/55">Password</span>
              <div className="mt-1 flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 focus-within:border-neon-green/40">
                <Lock className="h-4 w-4 text-white/40"/>
                <input type={show ? 'text' : 'password'} placeholder="••••••••" className="bg-transparent outline-none text-sm flex-1"/>
                <button type="button" onClick={() => setShow(!show)} aria-label="Toggle password visibility">
                  {show ? <EyeOff className="h-4 w-4 text-white/40"/> : <Eye className="h-4 w-4 text-white/40"/>}
                </button>
              </div>
            </label>
            <div className="flex items-center justify-between text-xs text-white/60">
              <label className="inline-flex items-center gap-2"><input type="checkbox" className="accent-neon-green"/> Remember me</label>
              <Link href="#" className="hover:text-white">Forgot password?</Link>
            </div>
            <button className="btn-primary w-full mt-2">Sign in</button>
          </form>
          <div className="my-5 flex items-center gap-3 text-[11px] text-white/40">
            <span className="flex-1 h-px bg-white/10"/> or continue with <span className="flex-1 h-px bg-white/10"/>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button className="btn-ghost text-sm">Google</button>
            <button className="btn-ghost text-sm">Apple</button>
          </div>
          <div className="mt-3"><Web3ConnectButton /></div>
          <p className="mt-5 text-xs text-white/55 text-center">
            New to AurumX? <Link href="/signup" className="text-neon-green hover:underline">Create an account</Link>
          </p>
        </motion.div>
      </section>
    </main>);
}
