'use client';
import { motion } from 'framer-motion';
import { Quote, Star } from 'lucide-react';
const testimonials = [
    {
        name: 'Helena Marchetti',
        role: 'CIO, Marchetti Family Office',
        text: 'AurumX gave our family office a single, sophisticated venue to allocate to digital assets. The reporting rivals our prime broker.',
    },
    {
        name: 'Daniel Okafor',
        role: 'Treasurer, Lumen Industries',
        text: 'Treasury management on AurumX is exceptional. Yield strategies plus compliance — exactly what corporate clients need.',
    },
    {
        name: 'Priya Anand',
        role: 'Quant PM, Argentum Capital',
        text: 'Execution quality, API latency, and AI signals are best-in-class. We replaced two prime brokers with AurumX.',
    },
];
export function Testimonials() {
    return (<section className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20">
      <div className="max-w-2xl">
        <span className="chip bg-white/5 border border-white/10 text-white/80">Trusted by leaders</span>
        <h2 className="mt-4 text-3xl sm:text-4xl font-display">
          What our <span className="text-gradient-neon">institutional clients</span> say.
        </h2>
      </div>
      <div className="mt-10 grid md:grid-cols-3 gap-4">
        {testimonials.map((t, i) => (<motion.div key={t.name} initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: i * 0.06 }} className="glass p-6">
            <Quote className="h-6 w-6 text-gold-400/70"/>
            <p className="mt-3 text-white/80 leading-relaxed">{t.text}</p>
            <div className="mt-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-gold-grad text-ink-950 inline-flex items-center justify-center font-semibold">
                {t.name.split(' ').map((p) => p[0]).join('')}
              </div>
              <div>
                <p className="text-sm font-semibold">{t.name}</p>
                <p className="text-xs text-white/55">{t.role}</p>
              </div>
              <div className="ml-auto flex">
                {Array.from({ length: 5 }).map((_, k) => (<Star key={k} className="h-3.5 w-3.5 text-gold-400 fill-gold-400"/>))}
              </div>
            </div>
          </motion.div>))}
      </div>
    </section>);
}
