'use client';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Quote, Star } from 'lucide-react';

const curatedTestimonials = [
    {
        id: 'curated-amara-okafor',
        name: 'Amara Okafor',
        role: 'Private investor',
        rating: 5,
        text: 'Oakmont Digital Markets Group gave me the confidence to move from scattered exchange balances into a more disciplined investment workflow. I can follow my allocation, review account activity, and understand what is happening across each strategy before making a decision.',
    },
    {
        id: 'curated-daniel-mercer',
        name: 'Daniel Mercer',
        role: 'Digital asset portfolio client',
        rating: 5,
        text: 'The trading dashboard feels built for serious investors. Market selection, account visibility, and reporting are clear enough for daily decisions without hiding the risk controls that matter when managing crypto exposure.',
    },
    {
        id: 'curated-priya-nair',
        name: 'Priya Nair',
        role: 'Growth strategy investor',
        rating: 5,
        text: 'What stood out to me was how structured the investment journey feels. I could review the market, choose the asset I wanted, and keep every action tied to my account instead of being pushed through confusing forms.',
    },
    {
        id: 'curated-luca-moretti',
        name: 'Luca Moretti',
        role: 'Managed account client',
        rating: 5,
        text: 'The platform presents crypto investing with the same clarity I expect from a fintech product: clean portfolio views, direct action points, and transparent reporting instead of inactive screens or unclear buttons.',
    },
    {
        id: 'curated-sofia-almeida',
        name: 'Sofia Almeida',
        role: 'Long-term investor',
        rating: 5,
        text: 'I use Oakmont Digital Markets Group to monitor market opportunities and keep my decisions organised. The experience makes it easy to separate browsing public market data from actual account activity once I sign in.',
    },
    {
        id: 'curated-ethan-brooks',
        name: 'Ethan Brooks',
        role: 'Active trader',
        rating: 5,
        text: 'Buy, sell, and trade actions feel intentional because they are connected to an authenticated account flow. That level of control matters when real capital and investment records are involved.',
    },
    {
        id: 'curated-noor-al-hassan',
        name: 'Noor Al-Hassan',
        role: 'Portfolio client',
        rating: 5,
        text: 'The experience is polished and practical. I can review markets first, then sign in to access the full interface, manage allocation, and continue with the asset I actually selected.',
    },
    {
        id: 'curated-hannah-weiss',
        name: 'Hannah Weiss',
        role: 'Investment account holder',
        rating: 5,
        text: 'Oakmont Digital Markets Group gives the platform a premium feel while keeping the workflow straightforward. The reporting, account controls, and market access make crypto investing feel more organised and accountable.',
    },
];

export function Testimonials() {
    const [items, setItems] = useState([]);
    const [loaded, setLoaded] = useState(false);
    const displayItems = [...items, ...curatedTestimonials.filter((c) => !items.some((t) => t.name === c.name))].slice(0, 9);
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
    return (<section className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
      <div className="max-w-2xl">
        <span className="chip bg-white/5 border border-white/10 text-white/80 inline-flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-accent-success animate-pulse"/> Client investment voices
        </span>
        <h2 className="mt-4 text-3xl sm:text-4xl font-display leading-tight">
          Trusted by investors who want a <span className="text-gradient-primary">clearer crypto journey</span>.
        </h2>
        <p className="mt-3 text-white/65 leading-relaxed">
          Read detailed client experiences around account visibility, disciplined investing, transparent reporting, and authenticated trading controls.
        </p>
      </div>
      {displayItems.length ? (
        <div className="mt-10 grid md:grid-cols-3 gap-3 sm:gap-4">
          {displayItems.map((t, i) => (<motion.div key={(t.id || t.name) + i} initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }} whileHover={{ y: -4 }} viewport={{ once: true }} transition={{ duration: 0.45, delay: i * 0.06, ease: [0.22, 1, 0.36, 1] }} className={i === 0 ? 'glass p-5 sm:p-6 md:col-span-2 bg-white/[0.04]' : 'glass p-5 sm:p-6'}>
                <Quote className="h-6 w-6 text-blue-400/70"/>
                <p className={i === 0 ? 'mt-3 text-base sm:text-lg text-white/85 leading-relaxed' : 'mt-3 text-white/80 leading-relaxed'}>{t.text}</p>
                <div className="mt-4 flex items-center gap-3">
                  {t.avatarUrl ? (
                    <div className="h-12 w-12 rounded-full bg-cover bg-center border border-white/10" style={{ backgroundImage: `url(${t.avatarUrl})` }} aria-label={`${t.name} profile photo`}/>
                ) : (
                  <div className="h-12 w-12 rounded-full bg-white/5 border border-white/10 inline-flex items-center justify-center text-blue-400 font-semibold text-sm">
                    {(t.name || 'O').split(' ').map((p) => p[0]).filter(Boolean).slice(0, 2).join('').toUpperCase()}
                  </div>
                )}
                <div>
                  <p className="text-sm font-semibold">{t.name}</p>
                  <p className="text-xs text-white/55">{t.role || 'Oakmont Digital Markets Group investor'}</p>
                </div>
                <div className="ml-auto flex">
                  {Array.from({ length: t.rating || 5 }).map((_, k) => (<Star key={k} className="h-3.5 w-3.5 text-blue-400 fill-cyan"/>))}
                </div>
              </div>
            </motion.div>))}
        </div>
      ) : (
        <div className="mt-10 glass p-6">
          <p className="text-white/80 font-semibold">{loaded ? 'Client testimonials are being prepared.' : 'Loading client testimonials...'}</p>
          <p className="mt-2 text-sm text-white/60">
            Approved user comments from signed-in account holders can still appear here through the existing moderation workflow.
          </p>
        </div>
      )}
    </section>);
}
