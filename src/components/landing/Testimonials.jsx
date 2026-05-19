'use client';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Quote, Star, ShieldCheck } from 'lucide-react';

export function Testimonials() {
    const [items, setItems] = useState([]);
    const [loaded, setLoaded] = useState(false);
    useEffect(() => {
        let mounted = true;
        const load = async () => {
            try {
                const res = await fetch('/api/testimonials', { credentials: 'include', cache: 'no-store' });
                if (!res.ok) throw new Error('testimonials unavailable');
                const j = await res.json();
                if (mounted) {
                    setItems(Array.isArray(j.testimonials) ? j.testimonials.slice(0, 9) : []);
                    setLoaded(true);
                }
            } catch (_) {
                if (mounted) setLoaded(true);
            }
        };
        load();
        const id = setInterval(load, 30000);
        return () => { mounted = false; clearInterval(id); };
    }, []);
    return (<section className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20">
      <div className="max-w-2xl">
        <span className="chip bg-white/5 border border-white/10 text-white/80 inline-flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-neon-green animate-pulse"/> Verified client voices
        </span>
        <h2 className="mt-4 text-3xl sm:text-4xl font-display">
          Real feedback from <span className="text-gradient-neon">approved AurumX users</span>.
        </h2>
        <p className="mt-3 text-white/65">
          Testimonials shown here come from signed-in users after a completed investment, deposit, or account adjustment and are published only after moderation.
        </p>
      </div>
      {items.length ? (
        <div className="mt-10 grid md:grid-cols-3 gap-4">
          {items.map((t, i) => (<motion.div key={(t.id || t.name) + i} initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: i * 0.06 }} className="glass p-6">
              <Quote className="h-6 w-6 text-gold-400/70"/>
              <p className="mt-3 text-white/80 leading-relaxed">{t.text}</p>
              <div className="mt-4 flex items-center gap-3">
                {t.avatarUrl ? (
                  <div className="h-12 w-12 rounded-full bg-cover bg-center border border-white/10" style={{ backgroundImage: `url(${t.avatarUrl})` }} aria-label={`${t.name} profile photo`}/>
                ) : (
                  <div className="h-12 w-12 rounded-full bg-white/5 border border-white/10 inline-flex items-center justify-center text-neon-green">
                    <ShieldCheck className="h-5 w-5"/>
                  </div>
                )}
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
      ) : (
        <div className="mt-10 glass p-6">
          <p className="text-white/80 font-semibold">{loaded ? 'Verified testimonials are awaiting publication.' : 'Loading verified testimonials...'}</p>
          <p className="mt-2 text-sm text-white/60">
            Approved user comments with optional client-submitted face photos will appear here automatically. We do not publish fake reviews or attach stock faces to client statements.
          </p>
        </div>
      )}
    </section>);
}
