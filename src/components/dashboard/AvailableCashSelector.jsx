'use client';
import { useEffect, useState, useMemo } from 'react';
import { ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cryptoLogoStyle } from '@/lib/cryptoLogos';
import { formatUSD } from '@/lib/utils';
import { useI18n } from '@/components/I18nProvider';

export function AvailableCashSelector({ wallets, livePrices }) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  
  // Find the asset with the highest USD value, or default to USDT or first asset
  const defaultAsset = useMemo(() => {
    if (!wallets || wallets.length === 0) return null;
    
    // Filter out assets with zero balance
    const nonZero = wallets.filter(w => w.bal > 0);
    if (nonZero.length === 0) {
      // No non-zero assets, prefer USDT or first asset
      return wallets.find(w => w.sym === 'USDT') || wallets[0];
    }
    
    // Find asset with highest USD value
    const maxAsset = nonZero.reduce((max, w) => w.value > max.value ? w : max, nonZero[0]);
    return maxAsset;
  }, [wallets]);

  const [selected, setSelected] = useState(defaultAsset);

  // Keep the selected asset tied to the current live wallet data so demo
  // balances cannot remain selected after a signed-in wallet loads.
  useEffect(() => {
    const matchingAsset = wallets?.find((w) => w.sym === selected?.sym);
    if (matchingAsset) {
      setSelected(matchingAsset);
      return;
    }
    setSelected(defaultAsset);
  }, [defaultAsset, selected?.sym, wallets]);

  const currentAsset = selected || defaultAsset || { sym: 'USDT', bal: 0, value: 0, name: 'Tether', color: '#26a17b' };

  const selectAsset = (asset) => {
    setSelected(asset);
    setOpen(false);
  };

  const displayValue = currentAsset.bal > 0 
    ? `${currentAsset.bal.toLocaleString(undefined, { maximumFractionDigits: 8 })} ${currentAsset.sym}`
    : formatUSD(0);

  const usdValue = currentAsset.value > 0 
    ? formatUSD(currentAsset.value) 
    : null;

  const subtitle = currentAsset.bal > 0 
    ? (usdValue ? `${usdValue} · ${t('readyToTrade')}` : t('readyToTrade'))
    : t('fundToStartTrading');

  return (
    <div className={`glass p-5 relative overflow-visible ${open ? 'z-[80]' : 'z-0'}`}>
      <p className="text-sm text-white/60 mb-1">{t('availableCash')}</p>
      
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-2 hover:opacity-80 transition-opacity text-left"
      >
        <span
          className="h-8 w-8 rounded-full inline-flex items-center justify-center text-xs font-bold text-ink-950"
          style={cryptoLogoStyle(currentAsset.sym) || { background: currentAsset.color }}
        >
          {!cryptoLogoStyle(currentAsset.sym) && currentAsset.sym.slice(0, 1)}
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-2xl font-display text-neon-green truncate">{displayValue}</p>
          <p className="text-xs text-white/50">{subtitle}</p>
        </div>
        <ChevronDown className={`h-4 w-4 text-white/40 transition-transform ${open ? 'rotate-180' : ''}`}/>
      </button>

      <AnimatePresence>
        {open && (
          <>
            <motion.button
              type="button"
              aria-label="Close asset selector"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
              className="fixed inset-0 z-[70] bg-transparent cursor-default"
            />
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute top-full left-0 right-0 mt-2 z-[90] rounded-xl border border-cyan/20 bg-navy-900/95 p-2 shadow-xl backdrop-blur-xl max-h-[300px] overflow-y-auto"
            >
              <p className="px-3 pb-2 pt-1 text-[11px] uppercase tracking-[0.2em] text-cyan">{t('selectAsset')}</p>
              {wallets?.length ? wallets.map((w) => (
                <button
                  key={w.sym}
                  onClick={() => selectAsset(w)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm hover:bg-cyan/10 transition-colors ${
                    selected?.sym === w.sym ? 'bg-cyan/10' : ''
                  }`}
                >
                  <span
                    className="h-8 w-8 rounded-full inline-flex items-center justify-center text-xs font-bold text-ink-950"
                    style={cryptoLogoStyle(w.sym) || { background: w.color }}
                  >
                    {!cryptoLogoStyle(w.sym) && w.sym.slice(0, 1)}
                  </span>
                  <div className="flex-1 text-left min-w-0">
                    <p className="font-medium">{w.sym}</p>
                    <p className="text-[11px] text-white/50 truncate">{w.name}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{w.bal.toLocaleString(undefined, { maximumFractionDigits: 8 })}</p>
                    <p className="text-[11px] text-white/50">{formatUSD(w.value)}</p>
                  </div>
                </button>
              )) : (
                <p className="px-3 py-4 text-sm text-white/50">{t('fundToStartTrading')}</p>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
