'use client';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Quote, Star } from 'lucide-react';
const fallback = [
    {
        name: 'Helena Marchetti',
        role: 'CIO, Marchetti Family Office',
        text: 'AurumX gave our family office a single, sophisticated venue to allocate to digital assets. The reporting rivals our prime broker.',
        rating: 5,
    },
    {
        name: 'Daniel Okafor',
        role: 'Treasurer, Lumen Industries',
        text: 'Treasury management on AurumX is exceptional. Yield strategies plus compliance — exactly what corporate clients need.',
        rating: 5,
    },
    {
        name: 'Priya Anand',
        role: 'Quant PM, Argentum Capital',
        text: 'Execution quality, API latency, and AI signals are best-in-class. We replaced two prime brokers with AurumX.',
        rating: 5,
    },
];
export function Testimonials() {
    const [items, setItems] = useState(fallback);
    const [live, setLive] = useState(false);
    useEffect(() => {
        let mounted = true;
        const load = async () => {
            try {
                const res = await fetch('/api/testimonials', { credentials: 'include' });
                if (!res.ok) return;
                const j = await res.json();
                if (mounted && Array.isArray(j.testimonials) && j.testimonials.length) {
                    setItems(j.testimonials.slice(0, 9));
                    setLive(true);
                }
            } catch (_) { /* fall back */ }
        };
        load();
        const id = setInterval(load, 30000);
        return () => { mounted = false; clearInterval(id); };
    }, []);
    return (<section className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20">
      <div className="max-w-2xl">
        <span className="chip bg-white/5 border border-white/10 text-white/80 inline-flex items-center gap-1.5">
          {live && <span className="h-1.5 w-1.5 rounded-full bg-neon-green animate-pulse"/>} {live ? 'Live from investors' : 'Trusted by leaders'}
        </span>
        <h2 className="mt-4 text-3xl sm:text-4xl font-display">
          What our <span className="text-gradient-neon">clients</span> say.
        </h2>
      </div>
      <div className="mt-10 grid md:grid-cols-3 gap-4">
        {items.map((t, i) => (<motion.div key={(t.id || t.name) + i} initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: i * 0.06 }} className="glass p-6">
            <Quote className="h-6 w-6 text-gold-400/70"/>
            <p className="mt-3 text-white/80 leading-relaxed">{t.text}</p>
            <div className="mt-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-gold-grad text-ink-950 inline-flex items-center justify-center font-semibold">
                {(t.name || 'AurumX').split(' ').map((p) => p[0]).join('').slice(0, 2)}
              </div>
              <div>
                <p className="text-sm font-semibold">{t.name}</p>
                <p className="text-xs text-white/55">{t.role || 'AurumX investor'}</p>
              </div>
              <div className="ml-auto flex">
                {Array.from({ length: t.rating || 5 }).map((_, k) => (<Star key={k} className="h-3.5 w-3.5 text-gold-400 fill-gold-400"/>))}
              </div>
            </div>
          </motion.div>))}
      </div>
    </section>);
}
