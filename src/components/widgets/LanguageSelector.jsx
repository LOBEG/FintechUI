'use client';
import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Globe, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useI18n } from '@/components/I18nProvider';

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
    const [mounted, setMounted] = useState(false);
    const { lang, setLang } = useI18n();

    useEffect(() => { setMounted(true); }, []);

    const selectLang = (code) => {
        setLang(code);
        setOpen(false);
    };

    const overlay = (
      <AnimatePresence>
        {open && (<>
          <motion.button type="button" aria-label="Close language selector" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setOpen(false)} className="fixed inset-0 z-[1000] bg-ink-950/20 cursor-default"/>
          <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} className="fixed right-4 top-16 z-[1001] w-[calc(100vw-2rem)] max-w-xs max-h-[70vh] overflow-y-auto rounded-2xl border border-slate-700/30 bg-navy-900/95 p-2 shadow-[0_24px_70px_rgba(0,0,0,0.5)] backdrop-blur-xl">
              <p className="px-3 pb-2 pt-1 text-[11px] uppercase tracking-[0.2em] text-white/50">Display language</p>
              {langs.map((l) => (<button key={l.code} onClick={() => selectLang(l.code)} className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm text-white hover:bg-white/5">
                  <span>{l.label}</span>
                  {lang === l.code && <Check className="h-4 w-4 text-accent-success"/>}
                </button>))}
            </motion.div>
        </>)}
      </AnimatePresence>
    );

    return (<div className="relative">
      <button onClick={() => setOpen(!open)} className="h-9 inline-flex items-center gap-1.5 px-2.5 rounded-lg bg-white/5 border border-white/10 hover:bg-white/8 transition text-sm" aria-label="Select language">
        <Globe className="h-4 w-4"/>
        <span>{lang.toUpperCase()}</span>
      </button>
      {mounted && typeof document !== 'undefined' ? createPortal(overlay, document.body) : null}
    </div>);
}
