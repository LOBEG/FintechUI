'use client';
import { motion } from 'framer-motion';
import { Users, BarChart3, Coins, Globe2 } from 'lucide-react';
const stats = [
    { label: '24h Trading Volume', value: '$8.42B', icon: BarChart3, accent: 'text-neon-green' },
    { label: 'Active Users', value: '4.1M+', icon: Users, accent: 'text-gold-400' },
    { label: 'Assets Under Custody', value: '$14.2B', icon: Coins, accent: 'text-neon-orange' },
    { label: 'Supported Markets', value: '650+', icon: Globe2, accent: 'text-white' },
];
export function Stats() {
    return (<section className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s, i) => {
            const Icon = s.icon;
            return (<motion.div key={s.label} initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-80px' }} transition={{ duration: 0.5, delay: i * 0.05 }} className="glass p-6">
              <div className="flex items-center justify-between">
                <Icon className={`h-5 w-5 ${s.accent}`}/>
                <span className="text-xs text-white/40">Live</span>
              </div>
              <p className="mt-6 text-3xl font-display tracking-tight">{s.value}</p>
              <p className="text-sm text-white/55 mt-1">{s.label}</p>
            </motion.div>);
        })}
      </div>
    </section>);
}
