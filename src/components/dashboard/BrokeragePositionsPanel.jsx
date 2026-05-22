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
      initial={{ opacity: 0, y: 8 }} 
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="glass-strong p-6 relative overflow-hidden"
    >
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500/20 via-teal-500/20 to-emerald-500/20" />
      
      <div className="flex items-center gap-3 mb-4">
        <TrendingUp className="h-5 w-5 text-blue-400"/>
        <h3 className="font-display text-xl tracking-tight">Brokerage positions</h3>
        <motion.span 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="chip bg-accent-success/15 text-accent-success border border-accent-success/30 flex items-center gap-1.5 text-[11px] font-medium"
        >
          <span className="inline-block h-2 w-2 rounded-full bg-accent-success animate-pulse" />
          live
        </motion.span>
      </div>
      
      {error && (
        <motion.p 
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          className="text-xs text-accent-error bg-accent-error/10 border border-accent-error/30 rounded-xl px-4 py-2.5 mb-4"
        >
          {error}
        </motion.p>
      )}
      
      <div className="overflow-x-auto -mx-6 px-6">
        <table className="min-w-full text-xs">
          <thead className="text-white/50 border-b border-white/10">
            <tr>
              <th className="text-left py-3 pr-4 font-medium">Symbol</th>
              <th className="text-left py-3 pr-4 font-medium">Class</th>
              <th className="text-right py-3 pr-4 font-medium">Qty</th>
              <th className="text-right py-3 pr-4 font-medium">Avg Price</th>
              <th className="text-right py-3 pr-4 font-medium">Live Price</th>
              <th className="text-right py-3 pr-4 font-medium">Market Value</th>
              <th className="text-right py-3 pr-4 font-medium">Day %</th>
              <th className="text-right py-3 pr-4 font-medium">P&amp;L (USD)</th>
              <th className="text-right py-3 pr-4 font-medium">P&amp;L%</th>
              <th className="text-right py-3 font-medium">Action</th>
            </tr>
          </thead>
          <tbody>
            {positions.map((p, idx) => {
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
              <motion.tr 
                key={p.key} 
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="border-t border-white/5 hover:bg-white/[0.02] transition-colors duration-200"
              >
                <td className="py-3 pr-4 font-semibold font-mono tracking-wide">{p.symbol}</td>
                <td className="py-3 pr-4 text-white/60 capitalize">{p.assetClass}</td>
                <td className="py-3 pr-4 text-right font-mono">{qty.toLocaleString(undefined, { maximumFractionDigits: 6 })}</td>
                <td className="py-3 pr-4 text-right font-mono text-white/75">${avgPrice.toFixed(4)}</td>
                <td className="py-3 pr-4 text-right font-mono">
                  {q ? (
                    <span className="inline-flex items-center gap-1.5">
                      <span className="inline-block h-1.5 w-1.5 rounded-full bg-accent-success animate-pulse" />
                      ${livePrice.toFixed(4)}
                    </span>
                  ) : (
                    <span className="text-white/60">${livePrice.toFixed(4)}</span>
                  )}
                </td>
                <td className="py-3 pr-4 text-right font-mono font-semibold">${marketValue.toFixed(2)}</td>
                <td className={`py-3 pr-4 text-right font-mono font-medium ${dayPct === null ? 'text-white/35' : isUp ? 'text-accent-success' : 'text-accent-error'}`}>
                  {dayPct !== null ? (
                    <span className="inline-flex items-center gap-1">
                      {isUp ? '▲' : '▼'}{Math.abs(dayPct).toFixed(2)}%
                    </span>
                  ) : '—'}
                </td>
                <td className={`py-3 pr-4 text-right font-mono font-semibold ${pnlUsd >= 0 ? 'text-accent-success' : 'text-accent-error'}`}>
                  {pnlUsd >= 0 ? '+' : ''}${pnlUsd.toFixed(2)}
                </td>
                <td className={`py-3 pr-4 text-right font-mono font-semibold ${pnlPct >= 0 ? 'text-accent-success' : 'text-accent-error'}`}>
                  {pnlPct >= 0 ? '+' : ''}{pnlPct.toFixed(2)}%
                </td>
                <td className="py-3 text-right">
                  {confirmKey === p.key ? (
                    <span className="inline-flex items-center gap-1.5">
                      <button
                        onClick={() => liquidate(p)}
                        disabled={busyKey === p.key}
                        className="px-3 py-1.5 rounded-lg bg-accent-error hover:bg-accent-error/90 text-white text-[11px] font-semibold disabled:opacity-60 transition-all duration-200 shadow-lg shadow-accent-error/20"
                      >
                        {busyKey === p.key ? <Loader2 className="h-3 w-3 animate-spin inline"/> : 'Confirm'}
                      </button>
                      <button
                        onClick={() => setConfirmKey(null)}
                        disabled={busyKey === p.key}
                        className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-[11px] transition-colors duration-200"
                      >
                        Cancel
                      </button>
                    </span>
                  ) : (
                    <button
                      onClick={() => setConfirmKey(p.key)}
                      className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-[11px] font-medium transition-all duration-200 hover:shadow-lg"
                    >
                      Liquidate
                    </button>
                  )}
                </td>
              </motion.tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </motion.section>
  );
}
