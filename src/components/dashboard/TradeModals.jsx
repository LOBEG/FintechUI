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

export function InvestModal({ open, onClose, onSuccess, defaultSymbol = 'BTC', walletBalances = {} }) {
  const [symbol, setSymbol] = useState(defaultSymbol);
  const quoteCurrency = 'USDT';
  const [usdAmount, setUsdAmount] = useState('100');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const tradingPair = `${symbol}${quoteCurrency}`;
  const prices = useLivePrices([tradingPair]);
  const px = prices[tradingPair]?.price || 0;
  const estCrypto = px ? parseFloat(usdAmount || '0') / px : 0;
  const availableQuote = walletBalances[quoteCurrency] || 0;
  useEffect(() => { 
    if (open) { 
      setSuccess(null); 
      setError(null); 
      setSymbol(defaultSymbol || 'BTC');
    } 
  }, [open, defaultSymbol]);
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
          <p className="text-xs text-white/60">
             Spend {quoteCurrency} from your wallet to buy crypto at the live Binance price.
            Available {quoteCurrency}: <strong>{availableQuote.toFixed(quoteCurrency === 'BTC' || quoteCurrency === 'ETH' ? 8 : 2)}</strong>
            {availableQuote === 0 && <span className="text-neon-orange"> (insufficient balance)</span>}.
          </p>
          <label className="block">
            <span className="text-xs text-white/55">Trading pair</span>
             <div className="mt-1">
               <select value={symbol} onChange={(e) => setSymbol(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm outline-none">
                 {SUPPORTED.map((s) => <option key={s} value={s} className="bg-ink-900">{s}</option>)}
               </select>
             </div>
          </label>
          <label className="block">
            <span className="text-xs text-white/55">{quoteCurrency} amount</span>
            <input value={usdAmount} onChange={(e) => setUsdAmount(e.target.value)} inputMode="decimal" required className="mt-1 w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm outline-none focus:border-neon-green/40"/>
          </label>
          <div className="glass-light p-3 text-xs space-y-1">
            <div className="flex justify-between"><span className="text-white/60">Live price</span><span>{px ? `${px.toLocaleString(undefined, { maximumFractionDigits: 6 })} ${quoteCurrency}` : '-'}</span></div>
            <div className="flex justify-between"><span className="text-white/60">Estimated {symbol}</span><span>{estCrypto.toFixed(8)}</span></div>
          </div>
          {error && <p className="text-xs text-neon-red bg-neon-red/10 border border-neon-red/30 rounded-lg px-3 py-2">{error}</p>}
          <button disabled={busy || !px || availableQuote === 0} className="btn-primary w-full justify-center disabled:opacity-60" title={availableQuote === 0 ? `Insufficient ${quoteCurrency}` : ''}>
            {busy ? <><Loader2 className="h-4 w-4 animate-spin"/> Investing…</> : `Invest ${usdAmount} ${quoteCurrency} into ${symbol}`}
          </button>
        </form>
      )}
    </Modal>
  );
}

// Memo / destination-tag bearing chains. Mirrors src/lib/server/addressFormats.js
// MEMO_REQUIRED. Kept here as a small client-side constant so the dashboard
// doesn't have to import server code.
const MEMO_REQUIRED = new Set(['XRP', 'ATOM', 'EOS', 'TON', 'HBAR', 'XLM']);
const NETWORKS = {
  ETH: ['ERC20'], BNB: ['BEP20'], MATIC: ['Polygon'], ARB: ['Arbitrum One'],
  OP: ['Optimism'], AVAX: ['C-Chain'], LINK: ['ERC20', 'BEP20', 'Polygon'],
  SHIB: ['ERC20', 'BEP20'], TRX: ['TRC20'], INJ: ['Injective', 'ERC20'],
  USDT: ['TRC20', 'ERC20', 'BEP20', 'Solana'],
  BTC: ['Bitcoin'], LTC: ['Litecoin'], BCH: ['Bitcoin Cash'], SOL: ['Solana'],
  XRP: ['XRP Ledger'], ADA: ['Cardano'], DOGE: ['Dogecoin'], DOT: ['Polkadot'],
  TON: ['TON'], ATOM: ['Cosmos Hub'], NEAR: ['NEAR'], APT: ['Aptos'],
  SUI: ['Sui'], FIL: ['Filecoin'], XLM: ['Stellar'], ALGO: ['Algorand'],
  HBAR: ['Hedera'],
};

export function WithdrawModal({ open, onClose, onSuccess, balances = {} }) {
  const symbols = Object.keys(balances).filter((s) => balances[s] > 0);
  const [symbol, setSymbol] = useState(symbols[0] || 'BTC');
  const [amount, setAmount] = useState('');
  const [address, setAddress] = useState('');
  const [memo, setMemo] = useState('');
  const [network, setNetwork] = useState('');
  const [tokenCode, setTokenCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [beneficiaries, setBeneficiaries] = useState([]);
  const [beneficiaryId, setBeneficiaryId] = useState('');
  const availableNetworks = NETWORKS[symbol] || [];
  const memoRequired = MEMO_REQUIRED.has(symbol);
  useEffect(() => {
    if (open) {
      setSuccess(null); setError(null);
      if (symbols[0] && !balances[symbol]) setSymbol(symbols[0]);
      // Load beneficiaries when the modal opens so the picker is current.
      api.get('/api/beneficiaries').then((r) => setBeneficiaries(r.beneficiaries || [])).catch(() => setBeneficiaries([]));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);
  // Reset network when the asset changes so we don't submit a stale value.
  useEffect(() => { setNetwork(availableNetworks[0] || ''); setBeneficiaryId(''); }, [symbol]); // eslint-disable-line react-hooks/exhaustive-deps
  const eligible = beneficiaries.filter((b) => b.symbol === symbol && b.status === 'active');
  const submit = async (e) => {
    e.preventDefault();
    setBusy(true); setError(null);
    try {
      const payload = beneficiaryId
        ? { symbol, amount: parseFloat(amount), token: tokenCode.trim(), beneficiaryId }
        : { symbol, amount: parseFloat(amount), token: tokenCode.trim(), address, memo, network };
      const r = await api.post('/api/withdraw', payload);
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
            <p>Withdrawals require a one-time authorisation token issued by an Oakmont Digital Capital Group administrator.</p>
          </div>
          <label className="block">
            <span className="text-xs text-white/55">Asset</span>
            <select value={symbol} onChange={(e) => setSymbol(e.target.value)} className="mt-1 w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm outline-none">
              {(symbols.length ? symbols : SUPPORTED).map((s) => (
                <option key={s} value={s} className="bg-ink-900">{s} - {(balances[s] || 0).toFixed(8)}</option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="text-xs text-white/55">Amount ({symbol})</span>
            <input value={amount} onChange={(e) => setAmount(e.target.value)} inputMode="decimal" required className="mt-1 w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm outline-none focus:border-neon-orange/40"/>
          </label>
          <label className="block">
            <span className="text-xs text-white/55">Saved beneficiary</span>
            <select
              value={beneficiaryId}
              onChange={(e) => setBeneficiaryId(e.target.value)}
              className="mt-1 w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm outline-none"
            >
              <option value="" className="bg-ink-900">- Enter address manually -</option>
              {eligible.map((b) => (
                <option key={b.id} value={b.id} className="bg-ink-900">{b.label} · {b.address.slice(0, 10)}…{b.address.slice(-6)}</option>
              ))}
            </select>
            {beneficiaries.some((b) => b.symbol === symbol && b.status !== 'active') && (
              <span className="text-[11px] text-white/45 mt-1 block">Some saved {symbol} addresses are pending email confirmation or still in the 48-hour cool-down.</span>
            )}
          </label>
          {!beneficiaryId && (
            <label className="block">
              <span className="text-xs text-white/55">Destination address (optional)</span>
              <input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="0x… / bc1…" className="mt-1 w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm outline-none focus:border-neon-orange/40"/>
            </label>
          )}
          {!beneficiaryId && availableNetworks.length > 1 && (
            <label className="block">
              <span className="text-xs text-white/55">Network</span>
              <select value={network} onChange={(e) => setNetwork(e.target.value)} className="mt-1 w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm outline-none">
                {availableNetworks.map((n) => (
                  <option key={n} value={n} className="bg-ink-900">{n}</option>
                ))}
              </select>
              <span className="text-[11px] text-neon-orange/80 mt-1 block">Sending on the wrong chain will result in permanent loss of funds. Double-check before submitting.</span>
            </label>
          )}
          {!beneficiaryId && memoRequired && (
            <label className="block">
              <span className="text-xs text-white/55">Destination tag / memo <span className="text-neon-red">(required for {symbol})</span></span>
              <input value={memo} onChange={(e) => setMemo(e.target.value)} required={!!address} placeholder="e.g. 12345" className="mt-1 w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm font-mono outline-none focus:border-neon-orange/40"/>
              <span className="text-[11px] text-neon-red mt-1 block">Without a memo, {symbol} sent to an exchange is unrecoverable.</span>
            </label>
          )}
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

// SellModal - mirror of InvestModal. Converts a crypto balance back to
// USDT at the live Binance price. The taker fee (returned by the server)
// is shown alongside the estimated proceeds so the user never sees a
// surprise haircut on the next refresh.
export function SellModal({ open, onClose, onSuccess, balances = {}, defaultSymbol }) {
  const heldSymbols = Object.keys(balances).filter((s) => s !== 'USDT' && balances[s] > 0);
  const initial = defaultSymbol && balances[defaultSymbol] > 0
    ? defaultSymbol
    : heldSymbols[0] || 'BTC';
  const [symbol, setSymbol] = useState(initial);
  const [amount, setAmount] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [feeBps, setFeeBps] = useState(20);
  useEffect(() => {
    if (open) {
      setSuccess(null);
      setError(null);
      setAmount('');
      setSymbol(initial);
      // Pull the live fee schedule so the modal can show "Fee 0.20%".
      // Falls back to the displayed default on error.
      fetch('/api/sell').then((r) => r.json()).then((j) => {
        if (j?.fees?.takerBps) setFeeBps(j.fees.takerBps);
      }).catch(() => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);
  const prices = useLivePrices([`${symbol}USDT`]);
  const px = prices[`${symbol}USDT`]?.price || 0;
  const cryptoAmt = parseFloat(amount) || 0;
  const grossUsd = px * cryptoAmt;
  const feeUsd = grossUsd * (feeBps / 10000);
  const netUsd = Math.max(0, grossUsd - feeUsd);
  const held = balances[symbol] || 0;

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true); setError(null);
    try {
      const r = await api.post('/api/sell', { symbol, amount: cryptoAmt });
      setSuccess(r);
      onSuccess && onSuccess(r);
    } catch (err) {
      setError(err.message);
    } finally { setBusy(false); }
  };

  return (
    <Modal open={open} onClose={onClose} title="Sell crypto" icon={<ArrowUpRight className="h-4 w-4 text-neon-green"/>}>
      {success ? (
        <div className="text-center py-6">
          <CheckCircle2 className="h-10 w-10 text-neon-green mx-auto"/>
          <p className="mt-3 font-semibold">Sell filled</p>
          <p className="text-sm text-white/65 mt-1">
            Sold <strong>{success.transaction.amount} {success.transaction.symbol}</strong> for{' '}
            <strong>{Number(success.proceeds).toFixed(2)} USDT</strong>{' '}
            (fee {Number(success.fee).toFixed(2)} USDT).
          </p>
          <button onClick={onClose} className="btn-primary mt-5 w-full justify-center">Done</button>
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-3">
          <p className="text-xs text-white/60">
            Sell crypto from your wallet back to USDT at the live Binance price.
          </p>
          <label className="block">
            <span className="text-xs text-white/55">Asset</span>
            <select value={symbol} onChange={(e) => setSymbol(e.target.value)} className="mt-1 w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm outline-none">
              {(heldSymbols.length ? heldSymbols : SUPPORTED).map((s) => (
                <option key={s} value={s} className="bg-ink-900">{s} - {(balances[s] || 0).toFixed(8)}</option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="text-xs text-white/55">Amount ({symbol})</span>
            <div className="relative mt-1">
              <input
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                inputMode="decimal"
                required
                className="w-full bg-white/5 border border-white/10 rounded-lg pl-3 pr-16 py-2 text-sm outline-none focus:border-neon-green/40"
              />
              <button
                type="button"
                onClick={() => setAmount(String(held))}
                className="absolute right-1 top-1 px-2 py-1 rounded-md text-[11px] bg-white/10 hover:bg-white/15"
              >
                Max
              </button>
            </div>
            <span className="text-[11px] text-white/45 mt-1 block">Available: {held.toFixed(8)} {symbol}</span>
          </label>
          <div className="glass-light p-3 text-xs space-y-1">
            <div className="flex justify-between"><span className="text-white/60">Live price</span><span>${px ? px.toLocaleString(undefined, { maximumFractionDigits: 4 }) : '-'}</span></div>
            <div className="flex justify-between"><span className="text-white/60">Gross</span><span>${grossUsd.toFixed(2)}</span></div>
            <div className="flex justify-between"><span className="text-white/60">Fee ({(feeBps / 100).toFixed(2)}%)</span><span>−${feeUsd.toFixed(2)}</span></div>
            <div className="flex justify-between font-semibold pt-1 border-t border-white/10"><span>You receive</span><span>${netUsd.toFixed(2)} USDT</span></div>
          </div>
          {error && <p className="text-xs text-neon-red bg-neon-red/10 border border-neon-red/30 rounded-lg px-3 py-2">{error}</p>}
          <button disabled={busy || !px || cryptoAmt <= 0 || cryptoAmt > held} className="btn-primary w-full justify-center disabled:opacity-60">
            {busy ? <><Loader2 className="h-4 w-4 animate-spin"/> Selling…</> : `Sell ${cryptoAmt || ''} ${symbol}`}
          </button>
        </form>
      )}
    </Modal>
  );
}
