'use client';
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2, ArrowDownLeft, ArrowUpRight, CheckCircle2, ShieldAlert } from 'lucide-react';
import { api } from '@/lib/useSession';
import { useLivePrices } from '@/lib/useLiveData';

const SUPPORTED = ['BTC', 'ETH', 'SOL', 'XRP', 'BNB', 'ADA', 'DOGE', 'AVAX', 'LINK', 'LTC', 'TRX', 'DOT', 'MATIC', 'TON', 'ATOM', 'NEAR', 'APT', 'ARB', 'OP', 'SUI', 'FIL', 'INJ', 'SHIB', 'PEPE', 'BCH', 'ETC', 'XLM', 'ALGO', 'HBAR'];

function Modal({ open, onClose, title, icon, children }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 bg-ink-950/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-4"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            initial={{ y: 24, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 24, opacity: 0 }}
            className="glass-strong w-full max-w-md p-6 relative"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2 mb-4">
              <span className="h-9 w-9 rounded-lg bg-white/5 border border-white/10 inline-flex items-center justify-center">{icon}</span>
              <h3 className="text-lg font-display flex-1">{title}</h3>
              <button onClick={onClose} aria-label="Close" className="h-8 w-8 rounded-lg hover:bg-white/10 inline-flex items-center justify-center"><X className="h-4 w-4"/></button>
            </div>
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function InvestModal({ open, onClose, onSuccess, defaultSymbol = 'BTC', usdtBalance = 0 }) {
  const [symbol, setSymbol] = useState(defaultSymbol);
  const [usdAmount, setUsdAmount] = useState('100');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const prices = useLivePrices([`${symbol}USDT`]);
  const px = prices[`${symbol}USDT`]?.price || 0;
  const estCrypto = px ? parseFloat(usdAmount || '0') / px : 0;
  useEffect(() => { if (open) { setSuccess(null); setError(null); setSymbol(defaultSymbol || 'BTC'); } }, [open, defaultSymbol]);
  const submit = async (e) => {
    e.preventDefault();
    setBusy(true); setError(null);
    try {
      const r = await api.post('/api/invest', { symbol, usdAmount: parseFloat(usdAmount) });
      setSuccess(r.transaction);
      onSuccess && onSuccess(r);
    } catch (err) {
      setError(err.message);
    } finally { setBusy(false); }
  };
  return (
    <Modal open={open} onClose={onClose} title="Invest in crypto" icon={<ArrowDownLeft className="h-4 w-4 text-neon-green"/>}>
      {success ? (
        <div className="text-center py-6">
          <CheckCircle2 className="h-10 w-10 text-neon-green mx-auto"/>
          <p className="mt-3 font-semibold">Investment confirmed</p>
          <p className="text-sm text-white/65 mt-1">
            Acquired <strong>{success.amount.toFixed(8)} {success.symbol}</strong> for ${success.usdValue.toFixed(2)} at ${success.price.toFixed(2)}.
          </p>
          <p className="text-xs text-white/45 mt-2">A confirmation email has been sent.</p>
          <button onClick={onClose} className="btn-primary mt-5 w-full justify-center">Done</button>
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-3">
          <p className="text-xs text-white/60">Spend USDT from your wallet to buy crypto at the live Binance price. Available USDT: <strong>{usdtBalance.toFixed(2)}</strong>.</p>
          <label className="block">
            <span className="text-xs text-white/55">Asset</span>
            <select value={symbol} onChange={(e) => setSymbol(e.target.value)} className="mt-1 w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm outline-none">
              {SUPPORTED.map((s) => <option key={s} value={s} className="bg-ink-900">{s}</option>)}
            </select>
          </label>
          <label className="block">
            <span className="text-xs text-white/55">USD amount</span>
            <input value={usdAmount} onChange={(e) => setUsdAmount(e.target.value)} inputMode="decimal" required className="mt-1 w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm outline-none focus:border-neon-green/40"/>
          </label>
          <div className="glass-light p-3 text-xs space-y-1">
            <div className="flex justify-between"><span className="text-white/60">Live price</span><span>${px ? px.toLocaleString(undefined, { maximumFractionDigits: 4 }) : '—'}</span></div>
            <div className="flex justify-between"><span className="text-white/60">Estimated {symbol}</span><span>{estCrypto.toFixed(8)}</span></div>
          </div>
          {error && <p className="text-xs text-neon-red bg-neon-red/10 border border-neon-red/30 rounded-lg px-3 py-2">{error}</p>}
          <button disabled={busy || !px} className="btn-primary w-full justify-center disabled:opacity-60">
            {busy ? <><Loader2 className="h-4 w-4 animate-spin"/> Investing…</> : `Invest $${usdAmount} into ${symbol}`}
          </button>
        </form>
      )}
    </Modal>
  );
}

export function WithdrawModal({ open, onClose, onSuccess, balances = {} }) {
  const symbols = Object.keys(balances).filter((s) => balances[s] > 0);
  const [symbol, setSymbol] = useState(symbols[0] || 'BTC');
  const [amount, setAmount] = useState('');
  const [address, setAddress] = useState('');
  const [tokenCode, setTokenCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  useEffect(() => {
    if (open) { setSuccess(null); setError(null); if (symbols[0] && !balances[symbol]) setSymbol(symbols[0]); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);
  const submit = async (e) => {
    e.preventDefault();
    setBusy(true); setError(null);
    try {
      const r = await api.post('/api/withdraw', { symbol, amount: parseFloat(amount), token: tokenCode.trim(), address });
      setSuccess(r.transaction);
      onSuccess && onSuccess(r);
    } catch (err) {
      setError(err.message);
    } finally { setBusy(false); }
  };
  return (
    <Modal open={open} onClose={onClose} title="Withdraw crypto" icon={<ArrowUpRight className="h-4 w-4 text-neon-orange"/>}>
      {success ? (
        <div className="text-center py-6">
          <CheckCircle2 className="h-10 w-10 text-neon-green mx-auto"/>
          <p className="mt-3 font-semibold">Withdrawal processed</p>
          <p className="text-sm text-white/65 mt-1">Sent <strong>{success.amount} {success.symbol}</strong>{success.address ? ` to ${success.address}` : ''}.</p>
          <p className="text-xs text-white/45 mt-2">A confirmation email has been sent.</p>
          <button onClick={onClose} className="btn-primary mt-5 w-full justify-center">Done</button>
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-3">
          <div className="flex gap-2 text-xs items-start bg-gold-500/10 border border-gold-500/30 text-gold-200 rounded-lg p-3">
            <ShieldAlert className="h-4 w-4 mt-0.5 shrink-0"/>
            <p>Withdrawals require a one-time authorisation token issued by an AurumX administrator. Request one in-app or via Telegram support and paste it below.</p>
          </div>
          <label className="block">
            <span className="text-xs text-white/55">Asset</span>
            <select value={symbol} onChange={(e) => setSymbol(e.target.value)} className="mt-1 w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm outline-none">
              {(symbols.length ? symbols : SUPPORTED).map((s) => (
                <option key={s} value={s} className="bg-ink-900">{s} — {(balances[s] || 0).toFixed(8)}</option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="text-xs text-white/55">Amount ({symbol})</span>
            <input value={amount} onChange={(e) => setAmount(e.target.value)} inputMode="decimal" required className="mt-1 w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm outline-none focus:border-neon-orange/40"/>
          </label>
          <label className="block">
            <span className="text-xs text-white/55">Destination address (optional)</span>
            <input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="0x… / bc1…" className="mt-1 w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm outline-none focus:border-neon-orange/40"/>
          </label>
          <label className="block">
            <span className="text-xs text-white/55">Admin authorisation token</span>
            <input value={tokenCode} onChange={(e) => setTokenCode(e.target.value.toUpperCase())} required placeholder="e.g. K3WJ9PXTV2NQ7M5BNCRA" className="mt-1 w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm font-mono outline-none focus:border-neon-orange/40 tracking-wider"/>
          </label>
          {error && <p className="text-xs text-neon-red bg-neon-red/10 border border-neon-red/30 rounded-lg px-3 py-2">{error}</p>}
          <button disabled={busy} className="btn w-full justify-center bg-neon-orange text-ink-950 hover:shadow-glow disabled:opacity-60">
            {busy ? <><Loader2 className="h-4 w-4 animate-spin"/> Processing…</> : `Withdraw ${amount || ''} ${symbol}`}
          </button>
        </form>
      )}
    </Modal>
  );
}
