'use client';
import { useState } from 'react';
import { Globe, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
const langs = [
    { code: 'EN', label: 'English' },
    { code: 'ES', label: 'Español' },
    { code: 'FR', label: 'Français' },
    { code: 'DE', label: 'Deutsch' },
    { code: 'ZH', label: '中文' },
    { code: 'JA', label: '日本語' },
    { code: 'KO', label: '한국어' },
    { code: 'AR', label: 'العربية' },
];
export function LanguageSelector() {
    const [open, setOpen] = useState(false);
    const [active, setActive] = useState('EN');
    return (<div className="relative">
      <button onClick={() => setOpen(!open)} className="h-9 inline-flex items-center gap-1.5 px-2.5 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition text-sm" aria-label="Select language">
        <Globe className="h-4 w-4"/>
        <span>{active}</span>
      </button>
      <AnimatePresence>
        {open && (<motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} className="absolute right-0 mt-2 w-44 glass-strong p-1 z-50">
            {langs.map((l) => (<button key={l.code} onClick={() => { setActive(l.code); setOpen(false); }} className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm hover:bg-white/10">
                <span>{l.label}</span>
                {active === l.code && <Check className="h-4 w-4 text-neon-green"/>}
              </button>))}
          </motion.div>)}
      </AnimatePresence>
    </div>);
}
