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

  const load = useCallback(async () => {
    try {
      const r = await api.get('/api/brokerage/positions');
      setPositions(Array.isArray(r?.positions) ? r.positions : []);
    } catch (_) {} finally { setLoaded(true); }
  }, []);

  useEffect(() => {
    if (!user) return;
    load();
    const id = setInterval(load, 15000);
    return () => clearInterval(id);
  }, [user, load]);

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
        <TrendingUp className="h-4 w-4 text-cyan"/>
        <h3 className="font-display text-lg">Brokerage positions</h3>
        <span className="chip bg-neon-green/15 text-neon-green border border-neon-green/30">● live</span>
      </div>
      {error && <p className="text-xs text-neon-red bg-neon-red/10 border border-neon-red/30 rounded-lg px-3 py-2 mb-2">{error}</p>}
      <div className="overflow-x-auto">
        <table className="min-w-full text-xs">
          <thead className="text-white/55">
            <tr>
              <th className="text-left py-1 pr-3">Symbol</th>
              <th className="text-left py-1 pr-3">Class</th>
              <th className="text-right py-1 pr-3">Qty</th>
              <th className="text-right py-1 pr-3">Avg Price</th>
              <th className="text-right py-1 pr-3">Live Price</th>
              <th className="text-right py-1 pr-3">P&amp;L (USD)</th>
              <th className="text-right py-1 pr-3">P&amp;L%</th>
              <th className="text-right py-1">Action</th>
            </tr>
          </thead>
          <tbody>
            {positions.map((p) => (
              <tr key={p.key} className="border-t border-white/5">
                <td className="py-1.5 pr-3 font-semibold">{p.symbol}</td>
                <td className="py-1.5 pr-3 text-white/65">{p.assetClass}</td>
                <td className="py-1.5 pr-3 text-right">{Number(p.qty).toLocaleString(undefined, { maximumFractionDigits: 6 })}</td>
                <td className="py-1.5 pr-3 text-right">${Number(p.avgPrice || 0).toFixed(4)}</td>
                <td className="py-1.5 pr-3 text-right">${Number(p.livePrice || 0).toFixed(4)}</td>
                <td className={`py-1.5 pr-3 text-right ${Number(p.pnlUsd) >= 0 ? 'text-neon-green' : 'text-neon-red'}`}>${Number(p.pnlUsd).toFixed(2)}</td>
                <td className={`py-1.5 pr-3 text-right ${Number(p.pnlPct) >= 0 ? 'text-neon-green' : 'text-neon-red'}`}>{Number(p.pnlPct).toFixed(2)}%</td>
                <td className="py-1.5 text-right">
                  {confirmKey === p.key ? (
                    <span className="inline-flex items-center gap-1">
                      <button
                        onClick={() => liquidate(p)}
                        disabled={busyKey === p.key}
                        className="px-2 py-1 rounded bg-neon-red text-ink-950 text-[11px] font-semibold disabled:opacity-60"
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
            ))}
          </tbody>
        </table>
      </div>
    </motion.section>
  );
}
