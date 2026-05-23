'use client';
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2, ArrowDownLeft, ArrowUpRight, CheckCircle2, Info } from 'lucide-react';
import { api } from '@/lib/useSession';
import { useLivePrices } from '@/lib/useLiveData';
import { useNotifications } from '@/components/Notifications';
import { useAccessibleDialog } from '@/lib/useAccessibleDialog';

const SUPPORTED = ['BTC', 'ETH', 'SOL', 'XRP', 'BNB', 'ADA', 'DOGE', 'AVAX', 'LINK', 'LTC', 'TRX', 'DOT', 'MATIC', 'TON', 'ATOM', 'NEAR', 'APT', 'ARB', 'OP', 'SUI', 'FIL', 'INJ', 'SHIB', 'PEPE', 'BCH', 'ETC', 'XLM', 'ALGO', 'HBAR'];

function Modal({ open, onClose, title, icon, children }) {
  const { dialogRef, closeButtonRef, titleId, dialogProps } = useAccessibleDialog({ open, onClose });
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
            className="glass-strong w-full max-w-md card-pad-lg relative"
            ref={dialogRef}
            {...dialogProps}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2 mb-4">
              <span className="h-9 w-9 rounded-lg bg-white/5 border border-white/10 inline-flex items-center justify-center">{icon}</span>
              <h3 id={titleId} className="text-lg font-display flex-1">{title}</h3>
              <button ref={closeButtonRef} onClick={onClose} aria-label={`Close ${title}`} className="h-8 w-8 rounded-lg hover:bg-white/10 inline-flex items-center justify-center"><X className="h-4 w-4"/></button>
            </div>
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// List of crypto assets a user may choose to spend FROM. The picker
// defaults to whichever asset has the largest USD balance, falling back
// to USDT for new accounts.
const FUNDING_OPTIONS = ['USDT', 'USDC', 'BTC', 'ETH', 'SOL', 'BNB', 'XRP', 'ADA', 'DOGE', 'AVAX', 'LINK', 'LTC', 'TRX', 'DOT', 'MATIC', 'BCH'];

function pickDefaultFunding(walletBalances = {}, prices = {}) {
  let best = null;
  let bestUsd = 0;
  for (const sym of FUNDING_OPTIONS) {
    const bal = Number(walletBalances[sym]) || 0;
    if (bal <= 0) continue;
    const px = sym === 'USDT' || sym === 'USDC' ? 1 : (prices[`${sym}USDT`]?.price || 0);
    const usd = bal * px;
    if (usd > bestUsd) { bestUsd = usd; best = sym; }
  }
  return best || 'BTC';
}

export function InvestModal({ open, onClose, onSuccess, defaultSymbol = 'BTC', walletBalances = {} }) {
  const [symbol, setSymbol] = useState(defaultSymbol);
  const [fundingSymbol, setFundingSymbol] = useState('USDT');
  const [usdAmount, setUsdAmount] = useState('100');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const { notify } = useNotifications();
  const tradingPair = `${symbol}USDT`;
  const fundingPair = fundingSymbol === 'USDT' || fundingSymbol === 'USDC' ? null : `${fundingSymbol}USDT`;
  const watchPairs = [tradingPair, ...(fundingPair ? [fundingPair] : [])];
  const prices = useLivePrices(watchPairs);
  const px = prices[tradingPair]?.price || 0;
  const fundingPx = fundingSymbol === 'USDT' || fundingSymbol === 'USDC' ? 1 : (prices[fundingPair]?.price || 0);
  const estCrypto = px ? parseFloat(usdAmount || '0') / px : 0;
  const fundingBal = walletBalances[fundingSymbol] || 0;
  const fundingUsd = fundingBal * fundingPx;
  const fundingNeeded = fundingPx ? parseFloat(usdAmount || '0') / fundingPx : 0;
  // Reset all modal state when opening to prevent stale state leakage
  useEffect(() => {
    if (open) {
      setSuccess(null);
      setError(null);
      setUsdAmount('100');
      setSymbol(defaultSymbol || 'BTC');
      setFundingSymbol(pickDefaultFunding(walletBalances, prices));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, defaultSymbol]);
  const submit = async (e) => {
    e.preventDefault();
    // Client-side validation with toast notifications
    const amt = parseFloat(usdAmount || '0');
    if (!amt || amt <= 0) {
      notify({ level: 'warn', title: 'Invalid amount', message: 'Enter a positive USD amount to invest.' });
      return;
    }
    if (!px) {
      notify({ level: 'warn', title: 'Price unavailable', message: 'Live price not yet loaded. Please wait a moment.' });
      return;
    }
    if (fundingUsd < amt) {
      notify({ level: 'error', title: 'Insufficient funds', message: `You need $${amt.toFixed(2)} but only have $${fundingUsd.toFixed(2)} in ${fundingSymbol}.` });
      return;
    }
    setBusy(true); setError(null);
    try {
      const r = await api.post('/api/invest', { symbol, usdAmount: amt, fundingSymbol });
      setSuccess(r.transaction);
      notify({ level: 'success', title: 'Investment confirmed', message: `Acquired ${r.transaction?.amount?.toFixed(6)} ${r.transaction?.symbol} for $${r.transaction?.usdValue?.toFixed(2)}.` });
      onSuccess && onSuccess(r);
    } catch (err) {
      setError(err.message);
      notify({ level: 'error', title: 'Investment failed', message: err.message });
    } finally { setBusy(false); }
  };
  return (
    <Modal open={open} onClose={onClose} title="Invest in crypto" icon={<ArrowDownLeft className="h-4 w-4 text-accent-success"/>}>
      {success ? (
        <div className="text-center py-6">
          <CheckCircle2 className="h-10 w-10 text-accent-success mx-auto"/>
          <p className="mt-3 font-semibold">Investment confirmed</p>
          <p className="text-sm text-white/65 mt-1">
            Acquired <strong>{success.amount.toFixed(8)} {success.symbol}</strong> for ${success.usdValue.toFixed(2)} at ${success.price.toFixed(2)}.
          </p>
          <p className="text-xs text-white/45 mt-2">A confirmation email has been sent.</p>
          <button onClick={onClose} className="btn-dashboard mt-5 w-full justify-center">Done</button>
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-3">
          <p className="text-xs text-white/60">
            Spend any crypto from your wallet to buy another at the live Binance price.
          </p>
          <div className="grid grid-cols-2 gap-2">
            <label className="block">
              <span className="text-xs text-white/55">Buy (target)</span>
              <select value={symbol} onChange={(e) => setSymbol(e.target.value)} className="mt-1 w-full field-control">
                {SUPPORTED.filter((s) => s !== fundingSymbol).map((s) => <option key={s} value={s} className="bg-ink-900">{s}</option>)}
              </select>
            </label>
            <label className="block">
              <span className="text-xs text-white/55">Spend (funding)</span>
              <select value={fundingSymbol} onChange={(e) => setFundingSymbol(e.target.value)} className="mt-1 w-full field-control">
                {FUNDING_OPTIONS.filter((s) => s !== symbol).map((s) => (
                  <option key={s} value={s} className="bg-ink-900">{s} ({(walletBalances[s] || 0).toFixed(s === 'USDT' || s === 'USDC' ? 2 : 6)})</option>
                ))}
              </select>
            </label>
          </div>
          <p className="text-[11px] text-white/55">
            Available {fundingSymbol}: <strong>{fundingBal.toFixed(fundingSymbol === 'USDT' || fundingSymbol === 'USDC' ? 2 : 8)}</strong>
            {' '}≈ <strong>${fundingUsd.toFixed(2)}</strong>
            {fundingUsd <= 0 && <span className="text-accent-error"> (insufficient)</span>}
          </p>
          <label className="block">
            <span className="text-xs text-white/55">USD amount</span>
            <input value={usdAmount} onChange={(e) => setUsdAmount(e.target.value)} inputMode="decimal" required className="mt-1 w-full field-control"/>
          </label>
          <div className="glass-light card-pad-sm text-xs space-y-1">
            <div className="flex justify-between"><span className="text-white/60">Live price</span><span>{px ? `${px.toLocaleString(undefined, { maximumFractionDigits: 6 })} USDT` : '-'}</span></div>
            <div className="flex justify-between"><span className="text-white/60">Estimated {symbol}</span><span>{estCrypto.toFixed(8)}</span></div>
            <div className="flex justify-between"><span className="text-white/60">{fundingSymbol} debited</span><span>{fundingNeeded.toFixed(fundingSymbol === 'USDT' || fundingSymbol === 'USDC' ? 2 : 8)}</span></div>
          </div>
          {error && <p className="text-xs text-accent-error bg-accent-error/10 border border-accent-error/30 rounded-lg px-3 py-2">{error}</p>}
          <button disabled={busy || !px || fundingUsd < parseFloat(usdAmount || '0')} className="btn-dashboard w-full justify-center" title={fundingUsd < parseFloat(usdAmount || '0') ? `Insufficient ${fundingSymbol}` : ''}>
            {busy ? <><Loader2 className="h-4 w-4 animate-spin"/> Investing…</> : `Invest $${usdAmount} via ${fundingSymbol} → ${symbol}`}
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
  const [memoTouched, setMemoTouched] = useState(false);
  const { notify } = useNotifications();
  const availableNetworks = NETWORKS[symbol] || [];
  const memoRequired = MEMO_REQUIRED.has(symbol);
  // Full state reset on open to prevent stale leakage between opens
  useEffect(() => {
    if (open) {
      const ctrl = new AbortController();
      setSuccess(null); setError(null);
      setAmount(''); setAddress(''); setMemo(''); setTokenCode('');
      setBeneficiaryId(''); setMemoTouched(false);
      if (symbols[0] && !balances[symbol]) setSymbol(symbols[0]);
      // Load beneficiaries when the modal opens so the picker is current.
      api.get('/api/beneficiaries', { signal: ctrl.signal })
        .then((r) => setBeneficiaries(r.beneficiaries || []))
        .catch(() => {
          if (!ctrl.signal.aborted) setBeneficiaries([]);
        });
      return () => ctrl.abort();
    }
    return undefined;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);
  // Reset network when the asset changes so we don't submit a stale value.
  useEffect(() => { setNetwork(availableNetworks[0] || ''); setBeneficiaryId(''); setMemo(''); setMemoTouched(false); }, [symbol]); // eslint-disable-line react-hooks/exhaustive-deps
  const eligible = beneficiaries.filter((b) => b.symbol === symbol && b.status === 'active');
  const submit = async (e) => {
    e.preventDefault();
    // Validation with toast notifications
    const amt = parseFloat(amount || '0');
    if (!amt || amt <= 0) {
      notify({ level: 'warn', title: 'Invalid amount', message: `Enter a valid ${symbol} amount to withdraw.` });
      return;
    }
    if (amt > (balances[symbol] || 0)) {
      notify({ level: 'error', title: 'Insufficient balance', message: `You have ${(balances[symbol] || 0).toFixed(8)} ${symbol} available.` });
      return;
    }
    if (!tokenCode.trim()) {
      notify({ level: 'warn', title: 'Token required', message: 'Enter the admin authorisation token to proceed.' });
      return;
    }
    if (!beneficiaryId && !address.trim()) {
      notify({ level: 'warn', title: 'Address required', message: 'Select a saved beneficiary or enter a destination address.' });
      return;
    }
    // Memo validation for chains that require it
    if (!beneficiaryId && memoRequired && address.trim() && !memo.trim()) {
      notify({ level: 'error', title: `Memo required for ${symbol}`, message: `${symbol} transactions require a destination tag/memo. Without it, funds are unrecoverable.` });
      setMemoTouched(true);
      return;
    }
    setBusy(true); setError(null);
    try {
      const payload = beneficiaryId
        ? { symbol, amount: amt, token: tokenCode.trim(), beneficiaryId }
        : { symbol, amount: amt, token: tokenCode.trim(), address, memo, network };
      const r = await api.post('/api/withdraw', payload);
      setSuccess(r.transaction);
      notify({ level: 'success', title: 'Withdrawal processed', message: `Sent ${r.transaction?.amount} ${r.transaction?.symbol}.` });
      onSuccess && onSuccess(r);
    } catch (err) {
      setError(err.message);
      notify({ level: 'error', title: 'Withdrawal failed', message: err.message });
    } finally { setBusy(false); }
  };
  return (
    <Modal open={open} onClose={onClose} title="Withdraw crypto" icon={<ArrowUpRight className="h-4 w-4 text-slate-400"/>}>
      {success ? (
        <div className="text-center py-6">
          <CheckCircle2 className="h-10 w-10 text-accent-success mx-auto"/>
          <p className="mt-3 font-semibold">Withdrawal processed</p>
          <p className="text-sm text-white/65 mt-1">Sent <strong>{success.amount} {success.symbol}</strong>{success.address ? ` to ${success.address}` : ''}.</p>
          <p className="text-xs text-white/45 mt-2">A confirmation email has been sent.</p>
          <button onClick={onClose} className="btn-dashboard mt-5 w-full justify-center">Done</button>
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-3">
          <div className="flex gap-2 text-xs items-start bg-accent-success/10 border border-accent-success/30 text-slate-300 rounded-lg p-3">
            <Info className="h-4 w-4 mt-0.5 shrink-0"/>
            <p>Withdrawals require a one-time authorisation token issued by an Oakmont Digital Markets Groups administrator.</p>
          </div>
          <label className="block">
            <span className="text-xs text-white/55">Asset</span>
            <select value={symbol} onChange={(e) => setSymbol(e.target.value)} className="mt-1 w-full field-control">
              {(symbols.length ? symbols : SUPPORTED).map((s) => (
                <option key={s} value={s} className="bg-ink-900">{s} - {(balances[s] || 0).toFixed(8)}</option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="text-xs text-white/55">Amount ({symbol})</span>
            <input value={amount} onChange={(e) => setAmount(e.target.value)} inputMode="decimal" required className="mt-1 w-full field-control"/>
          </label>
          <label className="block">
            <span className="text-xs text-white/55">Saved beneficiary</span>
            <select
              value={beneficiaryId}
              onChange={(e) => setBeneficiaryId(e.target.value)}
              className="mt-1 w-full field-control"
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
              <input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="0x… / bc1…" className="mt-1 w-full field-control"/>
            </label>
          )}
          {!beneficiaryId && availableNetworks.length > 1 && (
            <label className="block">
              <span className="text-xs text-white/55">Network</span>
              <select value={network} onChange={(e) => setNetwork(e.target.value)} className="mt-1 w-full field-control">
                {availableNetworks.map((n) => (
                  <option key={n} value={n} className="bg-ink-900">{n}</option>
                ))}
              </select>
              <span className="text-[11px] text-accent-error/80 mt-1 block">Sending on the wrong chain will result in permanent loss of funds. Double-check before submitting.</span>
            </label>
          )}
          {!beneficiaryId && memoRequired && (
            <label className="block">
              <span className="text-xs text-white/55">Destination tag / memo <span className="text-accent-error">(required for {symbol})</span></span>
              <input
                value={memo}
                onChange={(e) => { setMemo(e.target.value); setMemoTouched(true); }}
                required={!!address}
                placeholder="e.g. 12345"
                aria-invalid={memoTouched && !memo.trim()}
                aria-describedby="withdraw-memo-error"
                className={`mt-1 w-full field-control font-mono ${memoTouched && !memo.trim() ? 'border-accent-error ring-1 ring-accent-error/30' : ''}`}
              />
              <span className="text-[11px] text-accent-error mt-1 block">Without a memo, {symbol} sent to an exchange is unrecoverable.</span>
              {memoTouched && !memo.trim() && (
                <span id="withdraw-memo-error" className="text-[11px] text-accent-error mt-0.5 block font-semibold">⚠ You must enter a memo/tag before submitting.</span>
              )}
            </label>
          )}
          <label className="block">
            <span className="text-xs text-white/55">Admin authorisation token</span>
            <input value={tokenCode} onChange={(e) => setTokenCode(e.target.value.toUpperCase())} required placeholder="e.g. K3WJ9PXTV2NQ7M5BNCRA" className="mt-1 w-full field-control font-mono tracking-wider"/>
          </label>
          {error && <p className="text-xs text-accent-error bg-accent-error/10 border border-accent-error/30 rounded-lg px-3 py-2">{error}</p>}
          <button disabled={busy} className="btn-dashboard w-full justify-center">
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
  const { notify } = useNotifications();
  useEffect(() => {
    if (open) {
      const ctrl = new AbortController();
      setSuccess(null);
      setError(null);
      setAmount('');
      setSymbol(initial);
      // Pull the live fee schedule so the modal can show "Fee 0.20%".
      // Falls back to the displayed default on error.
      fetch('/api/sell', { signal: ctrl.signal }).then((r) => r.json()).then((j) => {
        if (j?.fees?.takerBps) setFeeBps(j.fees.takerBps);
      }).catch(() => {});
      return () => ctrl.abort();
    }
    return undefined;
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
    // Client-side validation with toast notifications
    if (!cryptoAmt || cryptoAmt <= 0) {
      notify({ level: 'warn', title: 'Invalid amount', message: `Enter a positive ${symbol} amount to sell.` });
      return;
    }
    if (cryptoAmt > held) {
      notify({ level: 'error', title: 'Insufficient balance', message: `You have ${held.toFixed(8)} ${symbol} available but tried to sell ${cryptoAmt}.` });
      return;
    }
    if (!px) {
      notify({ level: 'warn', title: 'Price unavailable', message: 'Live price not yet loaded. Please wait a moment.' });
      return;
    }
    setBusy(true); setError(null);
    try {
      const r = await api.post('/api/sell', { symbol, amount: cryptoAmt });
      setSuccess(r);
      notify({ level: 'success', title: 'Sale complete', message: `Sold ${cryptoAmt} ${symbol} for ~$${r.transaction?.usdValue?.toFixed(2) || '—'}.` });
      onSuccess && onSuccess(r);
    } catch (err) {
      setError(err.message);
      notify({ level: 'error', title: 'Sale failed', message: err.message });
    } finally { setBusy(false); }
  };

  return (
    <Modal open={open} onClose={onClose} title="Sell crypto" icon={<ArrowUpRight className="h-4 w-4 text-accent-success"/>}>
      {success ? (
        <div className="text-center py-6">
          <CheckCircle2 className="h-10 w-10 text-accent-success mx-auto"/>
          <p className="mt-3 font-semibold">Sell filled</p>
          <p className="text-sm text-white/65 mt-1">
            Sold <strong>{success.transaction.amount} {success.transaction.symbol}</strong> for{' '}
            <strong>{Number(success.proceeds).toFixed(2)} USDT</strong>{' '}
            (fee {Number(success.fee).toFixed(2)} USDT).
          </p>
          <button onClick={onClose} className="btn-dashboard mt-5 w-full justify-center">Done</button>
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-3">
          <p className="text-xs text-white/60">
            Sell crypto from your wallet back to USDT at the live Binance price.
          </p>
          <label className="block">
            <span className="text-xs text-white/55">Asset</span>
            <select value={symbol} onChange={(e) => setSymbol(e.target.value)} className="mt-1 w-full field-control">
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
                className="field-control pr-16"
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
          <div className="glass-light card-pad-sm text-xs space-y-1">
            <div className="flex justify-between"><span className="text-white/60">Live price</span><span>${px ? px.toLocaleString(undefined, { maximumFractionDigits: 4 }) : '-'}</span></div>
            <div className="flex justify-between"><span className="text-white/60">Gross</span><span>${grossUsd.toFixed(2)}</span></div>
            <div className="flex justify-between"><span className="text-white/60">Fee ({(feeBps / 100).toFixed(2)}%)</span><span>−${feeUsd.toFixed(2)}</span></div>
            <div className="flex justify-between font-semibold pt-1 border-t border-white/10"><span>You receive</span><span>${netUsd.toFixed(2)} USDT</span></div>
          </div>
          {error && <p className="text-xs text-accent-error bg-accent-error/10 border border-accent-error/30 rounded-lg px-3 py-2">{error}</p>}
          <button disabled={busy || !px || cryptoAmt <= 0 || cryptoAmt > held} className="btn-dashboard w-full justify-center">
            {busy ? <><Loader2 className="h-4 w-4 animate-spin"/> Selling…</> : `Sell ${cryptoAmt || ''} ${symbol}`}
          </button>
        </form>
      )}
    </Modal>
  );
}

// =============================================================
// Brokerage invest modal - multi-asset (stocks, ETFs, indices, forex,
// commodities, futures) bought with USDT and routed through one of the
// three Oakmont broker integrations.
// =============================================================
const BROKERAGE_CLASSES = ['stocks', 'etfs', 'indices', 'forex', 'commodities', 'futures'];
const BROKER_OPTIONS = [
  { id: 'prime', label: 'Oakmont Prime' },
  { id: 'crypto', label: 'Oakmont Digital Markets Groups Crypto Desk (Binance)' },
  { id: 'multiAsset', label: 'Oakmont Multi-Asset Desk (Yahoo Finance)' },
];

export function BrokerageInvestModal({
  open,
  onClose,
  onSuccess,
  defaultSymbol = 'AAPL',
  defaultClass = 'stocks',
  walletBalances = {},
  preferredBroker = 'prime',
}) {
  const [assetClass, setAssetClass] = useState(defaultClass);
  const [universe, setUniverse] = useState({});
  const [symbol, setSymbol] = useState(defaultSymbol);
  const [broker, setBroker] = useState(preferredBroker);
  const [usdAmount, setUsdAmount] = useState('100');
  const [quote, setQuote] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const { notify } = useNotifications();

  const [fundingSymbol, setFundingSymbol] = useState('USDT');
  const fundingPair = fundingSymbol === 'USDT' || fundingSymbol === 'USDC' ? null : `${fundingSymbol}USDT`;
  const fundingPrices = useLivePrices(fundingPair ? [fundingPair] : []);
  const fundingPx = fundingSymbol === 'USDT' || fundingSymbol === 'USDC' ? 1 : (fundingPrices[fundingPair]?.price || 0);
  const fundingBal = walletBalances[fundingSymbol] || 0;
  const fundingUsd = fundingBal * fundingPx;
  const px = quote?.price || 0;
  const estQty = px ? parseFloat(usdAmount || '0') / px : 0;
  const fundingNeeded = fundingPx ? parseFloat(usdAmount || '0') / fundingPx : 0;

  useEffect(() => {
    if (!open) return;
    setSuccess(null); setError(null);
    setAssetClass(defaultClass || 'stocks');
    setSymbol(defaultSymbol || 'AAPL');
    setBroker(preferredBroker || 'prime');
    setFundingSymbol(pickDefaultFunding(walletBalances, fundingPrices));
    let cancelled = false;
    const ctrl = new AbortController();
    api.get('/api/brokerage/universe', { signal: ctrl.signal }).then((r) => {
      if (!cancelled && r?.universe) setUniverse(r.universe);
    }).catch(() => {});
    return () => { cancelled = true; ctrl.abort(); };
    // Reset only when the modal is opened or defaults change; live funding
    // prices should not overwrite a user's in-progress funding selection.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, defaultClass, defaultSymbol, preferredBroker]);

  useEffect(() => {
    if (!open || !symbol) { setQuote(null); return; }
    let cancelled = false;
    let ctrl = null;
    const fetchQuote = () => {
      ctrl?.abort();
      ctrl = new AbortController();
      api.get(`/api/brokerage/quotes?symbols=${encodeURIComponent(symbol)}`, { signal: ctrl.signal })
        .then((r) => { if (!cancelled) setQuote(r?.quotes?.[0] || null); })
        .catch(() => {});
    };
    fetchQuote();
    const id = setInterval(fetchQuote, 10000);
    return () => { cancelled = true; clearInterval(id); ctrl?.abort(); };
  }, [open, symbol]);

  useEffect(() => {
    const rows = universe[assetClass] || [];
    if (rows.length && !rows.find((r) => r.symbol === symbol)) {
      setSymbol(rows[0].symbol);
    }
  }, [assetClass, universe, symbol]);

  const submit = async (e) => {
    e.preventDefault();
    const amt = parseFloat(usdAmount || '0');
    if (!amt || amt <= 0) {
      notify({ level: 'warn', title: 'Invalid amount', message: 'Enter a positive USD amount to invest.' });
      return;
    }
    if (!px) {
      notify({ level: 'warn', title: 'Quote unavailable', message: 'Live quote not yet loaded. Please wait a moment.' });
      return;
    }
    if (fundingUsd < amt) {
      notify({ level: 'error', title: 'Insufficient funds', message: `You need $${amt.toFixed(2)} but only have $${fundingUsd.toFixed(2)} in ${fundingSymbol}.` });
      return;
    }
    setBusy(true); setError(null);
    try {
      const r = await api.post('/api/brokerage/invest', {
        symbol,
        assetClass,
        broker,
        fundingSymbol,
        usdAmount: amt,
      });
      setSuccess(r);
      notify({ level: 'success', title: 'Order filled', message: `Invested $${usdAmount} in ${symbol}.` });
      onSuccess && onSuccess(r);
    } catch (err) {
      setError(err.message);
    } finally { setBusy(false); }
  };

  const rows = universe[assetClass] || [];

  return (
    <Modal open={open} onClose={onClose} title="Invest via brokerage" icon={<ArrowDownLeft className="h-4 w-4 text-accent-success"/>}>
      {success ? (
        <div className="text-center py-6">
          <CheckCircle2 className="h-10 w-10 text-accent-success mx-auto"/>
          <p className="mt-3 font-semibold">Order filled</p>
          <p className="text-sm text-white/65 mt-1">
            Acquired <strong>{Number(success.transaction.amount).toLocaleString(undefined, { maximumFractionDigits: 6 })} {success.transaction.symbol}</strong>{' '}
            for ${Number(success.transaction.usdValue).toFixed(2)} at ${Number(success.transaction.price).toFixed(4)}.
          </p>
          <p className="text-xs text-white/45 mt-2">Fee {Number(success.fee).toFixed(2)} USDT.</p>
          <button onClick={onClose} className="btn-dashboard mt-5 w-full justify-center">Done</button>
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-3">
          <p className="text-xs text-white/60">
            Spend any crypto from your wallet to buy a brokerage instrument at the live price.
          </p>
          <label className="block">
            <span className="text-xs text-white/55">Spend (funding)</span>
            <select value={fundingSymbol} onChange={(e) => setFundingSymbol(e.target.value)} className="mt-1 w-full field-control">
              {FUNDING_OPTIONS.map((s) => (
                <option key={s} value={s} className="bg-ink-900">{s} ({(walletBalances[s] || 0).toFixed(s === 'USDT' || s === 'USDC' ? 2 : 6)})</option>
              ))}
            </select>
            <span className="block text-[11px] text-white/55 mt-1">
              Available: <strong>{fundingBal.toFixed(fundingSymbol === 'USDT' || fundingSymbol === 'USDC' ? 2 : 8)} {fundingSymbol}</strong>
              {' '}≈ <strong>${fundingUsd.toFixed(2)}</strong>
              {fundingUsd <= 0 && <span className="text-accent-error"> (insufficient)</span>}
            </span>
          </label>
          <label className="block">
            <span className="text-xs text-white/55">Broker</span>
            <select value={broker} onChange={(e) => setBroker(e.target.value)} className="mt-1 w-full field-control">
              {BROKER_OPTIONS.map((o) => <option key={o.id} value={o.id} className="bg-ink-900">{o.label}</option>)}
            </select>
          </label>
          <label className="block">
            <span className="text-xs text-white/55">Asset class</span>
            <select value={assetClass} onChange={(e) => setAssetClass(e.target.value)} className="mt-1 w-full field-control">
              {BROKERAGE_CLASSES.map((c) => <option key={c} value={c} className="bg-ink-900">{c}</option>)}
            </select>
          </label>
          <label className="block">
            <span className="text-xs text-white/55">Symbol</span>
            <select value={symbol} onChange={(e) => setSymbol(e.target.value)} className="mt-1 w-full field-control">
              {rows.map((r) => <option key={r.symbol} value={r.symbol} className="bg-ink-900">{r.symbol} - {r.name}</option>)}
            </select>
          </label>
          <label className="block">
            <span className="text-xs text-white/55">USD amount</span>
            <input value={usdAmount} onChange={(e) => setUsdAmount(e.target.value)} inputMode="decimal" required className="mt-1 w-full field-control"/>
          </label>
          <div className="glass-light card-pad-sm text-xs space-y-1">
            <div className="flex justify-between"><span className="text-white/60">Live price</span><span>{px ? `$${px.toLocaleString(undefined, { maximumFractionDigits: 6 })}` : '-'}</span></div>
            <div className="flex justify-between"><span className="text-white/60">Estimated qty</span><span>{estQty ? estQty.toFixed(6) : '-'}</span></div>
            <div className="flex justify-between"><span className="text-white/60">{fundingSymbol} debited</span><span>{fundingNeeded.toFixed(fundingSymbol === 'USDT' || fundingSymbol === 'USDC' ? 2 : 8)}</span></div>
          </div>
          {error && <p className="text-xs text-accent-error bg-accent-error/10 border border-accent-error/30 rounded-lg px-3 py-2">{error}</p>}
          <button disabled={busy || !px || fundingUsd < parseFloat(usdAmount || '0')} className="btn-dashboard w-full justify-center">
            {busy ? <><Loader2 className="h-4 w-4 animate-spin"/> Investing…</> : `Invest $${usdAmount} via ${fundingSymbol} → ${symbol}`}
          </button>
        </form>
      )}
    </Modal>
  );
}
