'use client';
import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Loader2 } from 'lucide-react';
import { api, useSession } from '@/lib/useSession';

export default function BrokeragePositionsPanel() {
  const { user } = useSession();
  const [positions, setPositions] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [confirmKey, setConfirmKey] = useState(null);
  const [busyKey, setBusyKey] = useState(null);
  const [error, setError] = useState(null);
  const [liveQuotes, setLiveQuotes] = useState({});

  const load = useCallback(async () => {
    try {
      const r = await api.get('/api/brokerage/positions');
      setPositions(Array.isArray(r?.positions) ? r.positions : []);
    } catch (_) {} finally { setLoaded(true); }
  }, []);

  const fetchLive = useCallback(async (pos) => {
    if (!pos.length) return;
    const syms = [...new Set(pos.map((p) => p.symbol))].join(',');
    try {
      const r = await api.get(`/api/brokerage/quotes?symbols=${encodeURIComponent(syms)}`);
      const map = {};
      for (const q of (r?.quotes || [])) map[q.symbol] = q;
      setLiveQuotes(map);
    } catch (_) {}
  }, []);

  useEffect(() => {
    if (!user) return;
    load();
    const id = setInterval(load, 15000);
    return () => clearInterval(id);
  }, [user, load]);

  useEffect(() => {
    if (!positions.length) return;
    fetchLive(positions);
    const id = setInterval(() => fetchLive(positions), 12000);
    return () => clearInterval(id);
  }, [positions, fetchLive]);

  if (!user) return null;
  if (!loaded) return null;
  if (positions.length === 0) return null;

  const liquidate = async (p) => {
    setBusyKey(p.key); setError(null);
    try {
      await api.post('/api/brokerage/withdraw', { symbol: p.symbol, assetClass: p.assetClass });
      setConfirmKey(null);
      await load();
    } catch (err) {
      setError(err.message);
    } finally { setBusyKey(null); }
  };

  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      className="glass-strong p-5"
    >
      <div className="flex items-center gap-2 mb-3">
        <TrendingUp className="h-4 w-4 text-blue-400"/>
        <h3 className="font-display text-lg">Brokerage positions</h3>
        <span className="chip bg-accent-success/15 text-accent-success border border-accent-success/30 flex items-center gap-1">
          <span className="inline-block h-2 w-2 rounded-full bg-accent-success400 animate-pulse" />
          live
        </span>
      </div>
      {error && <p className="text-xs text-accent-error bg-accent-error/10 border border-accent-error/30 rounded-lg px-3 py-2 mb-2">{error}</p>}
      <div className="overflow-x-auto">
        <table className="min-w-full text-xs">
          <thead className="text-white/55">
            <tr>
              <th className="text-left py-1 pr-3">Symbol</th>
              <th className="text-left py-1 pr-3">Class</th>
              <th className="text-right py-1 pr-3">Qty</th>
              <th className="text-right py-1 pr-3">Avg Price</th>
              <th className="text-right py-1 pr-3">Live Price</th>
              <th className="text-right py-1 pr-3">Market Value</th>
              <th className="text-right py-1 pr-3">Day %</th>
              <th className="text-right py-1 pr-3">P&amp;L (USD)</th>
              <th className="text-right py-1 pr-3">P&amp;L%</th>
              <th className="text-right py-1">Action</th>
            </tr>
          </thead>
          <tbody>
            {positions.map((p) => {
              const q = liveQuotes[p.symbol];
              const dayPct = q?.pct ?? null;
              const isUp = dayPct !== null && dayPct >= 0;
              const qty = Number(p.qty) || 0;
              const avgPrice = Number(p.avgPrice) || 0;
              const livePrice = Number(q?.price ?? p.livePrice ?? 0);
              const invested = Number(p.usdInvested) || (qty * avgPrice) || 0;
              const marketValue = qty * livePrice;
              const pnlUsd = q ? (marketValue - invested) : Number(p.pnlUsd) || 0;
              const pnlPct = q
                ? (invested > 0 ? ((marketValue - invested) / invested) * 100 : 0)
                : Number(p.pnlPct) || 0;
              return (
              <tr key={p.key} className="border-t border-white/5">
                <td className="py-1.5 pr-3 font-semibold">{p.symbol}</td>
                <td className="py-1.5 pr-3 text-white/65">{p.assetClass}</td>
                <td className="py-1.5 pr-3 text-right">{qty.toLocaleString(undefined, { maximumFractionDigits: 6 })}</td>
                <td className="py-1.5 pr-3 text-right">${avgPrice.toFixed(4)}</td>
                <td className="py-1.5 pr-3 text-right">
                  {q ? (
                    <span className="inline-flex items-center gap-1">
                      <span className="inline-block h-1.5 w-1.5 rounded-full bg-accent-success400 animate-pulse" />
                      ${livePrice.toFixed(4)}
                    </span>
                  ) : `$${livePrice.toFixed(4)}`}
                </td>
                <td className="py-1.5 pr-3 text-right font-mono">${marketValue.toFixed(2)}</td>
                <td className={`py-1.5 pr-3 text-right ${dayPct === null ? 'text-white/40' : isUp ? 'text-accent-success400' : 'text-accent-error'}`}>
                  {dayPct !== null ? (
                    <span className="inline-flex items-center gap-0.5">
                      {isUp ? '▲' : '▼'}{Math.abs(dayPct).toFixed(2)}%
                    </span>
                  ) : '—'}
                </td>
                <td className={`py-1.5 pr-3 text-right ${pnlUsd >= 0 ? 'text-accent-success' : 'text-accent-error'}`}>${pnlUsd.toFixed(2)}</td>
                <td className={`py-1.5 pr-3 text-right ${pnlPct >= 0 ? 'text-accent-success' : 'text-accent-error'}`}>{pnlPct.toFixed(2)}%</td>
                <td className="py-1.5 text-right">
                  {confirmKey === p.key ? (
                    <span className="inline-flex items-center gap-1">
                      <button
                        onClick={() => liquidate(p)}
                        disabled={busyKey === p.key}
                        className="px-2 py-1 rounded bg-accent-error text-ink-950 text-[11px] font-semibold disabled:opacity-60"
                      >
                        {busyKey === p.key ? <Loader2 className="h-3 w-3 animate-spin inline"/> : 'Confirm'}
                      </button>
                      <button
                        onClick={() => setConfirmKey(null)}
                        disabled={busyKey === p.key}
                        className="px-2 py-1 rounded bg-white/10 text-[11px]"
                      >
                        Cancel
                      </button>
                    </span>
                  ) : (
                    <button
                      onClick={() => setConfirmKey(p.key)}
                      className="px-2 py-1 rounded bg-white/10 hover:bg-white/15 text-[11px]"
                    >
                      Liquidate
                    </button>
                  )}
                </td>
              </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </motion.section>
  );
}
