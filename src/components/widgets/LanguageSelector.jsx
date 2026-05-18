'use client';
import { useState, useEffect } from 'react';
import { Globe, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
const langs = [
    { code: 'en', label: 'English' },
    { code: 'es', label: 'Español' },
    { code: 'fr', label: 'Français' },
    { code: 'de', label: 'Deutsch' },
    { code: 'zh', label: '中文' },
    { code: 'ja', label: '日本語' },
    { code: 'ar', label: 'العربية' },
    { code: 'pt', label: 'Português' },
    { code: 'ru', label: 'Русский' },
    { code: 'hi', label: 'हिन्दी' },
];
export function LanguageSelector() {
    const [open, setOpen] = useState(false);
    const [active, setActive] = useState('en');
    useEffect(() => {
        const stored = localStorage.getItem('aurumx_lang');
        if (stored)
            setActive(stored);
    }, []);
    useEffect(() => {
        document.documentElement.lang = active;
    }, [active]);
    const selectLang = (code) => {
        setActive(code);
        localStorage.setItem('aurumx_lang', code);
        setOpen(false);
    };
    return (<div className="relative">
      <button onClick={() => setOpen(!open)} className="h-9 inline-flex items-center gap-1.5 px-2.5 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition text-sm" aria-label="Select language">
        <Globe className="h-4 w-4"/>
        <span>{active.toUpperCase()}</span>
      </button>
      <AnimatePresence>
        {open && (<motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} className="absolute right-0 mt-2 w-44 glass-strong p-1 z-50">
            {langs.map((l) => (<button key={l.code} onClick={() => selectLang(l.code)} className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm hover:bg-white/10">
                <span>{l.label}</span>
                {active === l.code && <Check className="h-4 w-4 text-neon-green"/>}
              </button>))}
          </motion.div>)}
      </AnimatePresence>
    </div>);
}
