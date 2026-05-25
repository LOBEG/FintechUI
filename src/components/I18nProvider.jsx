'use client';
import { createContext, useContext, useState, useEffect } from 'react';
import { getTranslation } from '@/lib/i18n';

const I18nContext = createContext({
  lang: 'en',
  setLang: () => {},
  t: (key) => key,
});

export function I18nProvider({ children }) {
  const [lang, setLangState] = useState('en');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const stored = localStorage.getItem('oakmontdc_lang');
    if (stored) {
      setLangState(stored);
    }
  }, []);

  const setLang = (code) => {
    setLangState(code);
    if (typeof window !== 'undefined') {
      localStorage.setItem('oakmontdc_lang', code);
      document.documentElement.lang = code;
    }
  };

  const t = (key) => {
    return getTranslation(lang, key);
  };

  return (
    <I18nContext.Provider value={{ lang, setLang, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  return useContext(I18nContext);
}
