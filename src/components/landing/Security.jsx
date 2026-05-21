'use client';
import { motion } from 'framer-motion';
import { ShieldCheck, Lock, FileBadge, Building2, Eye, KeyRound } from 'lucide-react';
const items = [
    { icon: ShieldCheck, title: 'SOC 2 Type II & ISO 27001', desc: 'Independently audited security controls and operational resilience.' },
    { icon: Lock, title: '95% Cold Storage', desc: 'Multi-sig custody with Fireblocks & qualified custodians.' },
    { icon: FileBadge, title: 'KYC / AML Compliant', desc: 'Onfido + Chainalysis screening; FATF Travel Rule support.' },
    { icon: Building2, title: 'Regulated Entities', desc: 'Licensed across EU (MiCA), UK (FCA), US (MSB), and DIFC.' },
    { icon: Eye, title: 'Real-time Monitoring', desc: '24/7 SOC, anomaly detection and behavioral analytics.' },
    { icon: KeyRound, title: 'Hardware MFA & Passkeys', desc: 'FIDO2, YubiKey & WebAuthn. Withdrawal allowlists.' },
];
export function Security() {
    return (<section className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20">
      <div className="max-w-2xl">
        <span className="chip bg-neon-green/15 text-cyan border border-neon-green/30">Security & Compliance</span>
        <h2 className="mt-4 text-3xl sm:text-4xl font-display">
          Built like an <span className="text-gradient-neon">institutional vault</span>.
        </h2>
        <p className="mt-3 text-white/65">
          Oakmont Digital Markets Group applies traditional-finance controls to every asset class: signed-in access, KYC/AML workflows, admin-controlled account servicing, audit logs, transactional email notices, and clear reporting for every client action.
        </p>
      </div>
      <div className="mt-10 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map((it, i) => {
            const Icon = it.icon;
            return (<motion.div key={it.title} initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-60px' }} transition={{ duration: 0.45, delay: i * 0.04 }} className="glass p-6 hover:bg-white/[0.07] transition">
              <div className="h-10 w-10 rounded-xl bg-white/5 border border-white/10 inline-flex items-center justify-center">
                <Icon className="h-5 w-5 text-cyan"/>
              </div>
              <h3 className="mt-4 font-semibold">{it.title}</h3>
              <p className="text-sm text-white/60 mt-1">{it.desc}</p>
            </motion.div>);
        })}
      </div>
    </section>);
}
