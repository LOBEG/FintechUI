'use client';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Briefcase, Network, Building2, Globe, Loader2, CheckCircle2, ArrowDownLeft, ArrowUpRight } from 'lucide-react';
import { api, useSession } from '@/lib/useSession';

const BROKERS = [
  {
    id: 'prime',
    name: 'Oakmont Prime',
    description: 'Internal prime brokerage desk with cross-margined inventory.',
    classes: ['stocks', 'etfs', 'indices'],
    source: 'Oakmont Prime book',
    icon: Building2,
  },
  {
    id: 'crypto',
    name: 'Oakmont DMG Crypto Desk (Binance)',
    description: 'Spot crypto liquidity routed through Binance.',
    classes: ['crypto'],
    source: 'Binance public API',
    icon: Network,
  },
  {
    id: 'multiAsset',
    name: 'Oakmont Multi-Asset Desk (Yahoo Finance)',
    description: 'Equities, ETFs, indices, forex, commodities and futures.',
    classes: ['stocks', 'etfs', 'indices', 'forex', 'commodities', 'futures'],
    source: 'Yahoo Finance v8',
    icon: Globe,
  },
];

export default function BrokerageHubPanel({ onInvest, onWithdraw }) {
  const { user } = useSession();
  const [settings, setSettings] = useState(null);
  const [preferred, setPreferred] = useState('prime');
  const [positions, setPositions] = useState([]);
  const [savingBroker, setSavingBroker] = useState(false);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      try {
        const [s, b, p] = await Promise.all([
          api.get('/api/brokerage/settings').catch(() => null),
          api.get('/api/user/preferred-broker').catch(() => null),
          api.get('/api/brokerage/positions').catch(() => null),
        ]);
        if (cancelled) return;
        if (s?.settings) setSettings(s.settings);
        if (b?.preferredBroker) setPreferred(b.preferredBroker);
        if (Array.isArray(p?.positions)) setPositions(p.positions);
      } catch (_) {}
    })();
    return () => { cancelled = true; };
  }, [user]);

  if (!user) return null;
  if (!settings) return null;
  const integrations = settings.integrations || {};
  const anyEnabled = !!(integrations.prime || integrations.crypto || integrations.multiAsset);
  if (!anyEnabled) return null;

  const updatedLabel = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const selectBroker = async (id) => {
    setSavingBroker(true);
    try {
      const r = await api.patch('/api/user/preferred-broker', { broker: id });
      if (r?.preferredBroker) setPreferred(r.preferredBroker);
    } catch (_) {} finally { setSavingBroker(false); }
  };

  const enabledBrokers = BROKERS.filter((b) => integrations[b.id]);

  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      className="glass-strong p-5 space-y-4"
    >
      <div className="flex items-center gap-2">
        <Briefcase className="h-4 w-4 text-gold-400"/>
        <h3 className="font-display text-lg">Brokerage hub</h3>
        <span className="chip bg-neon-green/15 text-neon-green border border-neon-green/30">● live</span>
        <div className="ml-auto flex items-center gap-2">
          <button onClick={() => onInvest && onInvest('AAPL', 'stocks')} className="btn-ghost text-xs">
            <ArrowDownLeft className="h-3.5 w-3.5"/> Invest
          </button>
          <button onClick={() => onWithdraw && onWithdraw()} className="btn-ghost text-xs">
            <ArrowUpRight className="h-3.5 w-3.5"/> Withdraw
          </button>
          <a href="#wallet" className="btn-ghost text-xs">Deposit</a>
        </div>
      </div>

      <div className="grid sm:grid-cols-3 gap-3">
        {enabledBrokers.map((b) => {
          const Icon = b.icon;
          return (
            <div key={b.id} className="glass-light p-3 flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <span className="h-8 w-8 rounded-lg bg-white/5 border border-white/10 inline-flex items-center justify-center">
                  <Icon className="h-4 w-4 text-gold-300"/>
                </span>
                <span className="font-semibold text-sm flex-1">{b.name}</span>
                <span className="chip bg-neon-green/15 text-neon-green border border-neon-green/30 text-[10px]">● live</span>
              </div>
              <p className="text-[11px] text-white/55">{b.description}</p>
              <div className="flex flex-wrap gap-1">
                {b.classes.map((c) => (
                  <span key={c} className="chip bg-white/5 border border-white/10 text-white/70 text-[10px]">{c}</span>
                ))}
              </div>
              <div className="flex items-center gap-2 text-[10px] text-white/45 mt-auto">
                <span>{b.source}</span>
                <span className="ml-auto">updated {updatedLabel}</span>
              </div>
            </div>
          );
        })}
      </div>

      {enabledBrokers.length > 0 && (
        <div className="glass-light p-3">
          <p className="text-xs text-white/55 mb-2">Default broker for new orders</p>
          <div className="flex flex-wrap gap-2">
            {enabledBrokers.map((b) => (
              <button
                key={b.id}
                onClick={() => selectBroker(b.id)}
                disabled={savingBroker}
                className={`px-3 py-1.5 rounded-lg text-xs inline-flex items-center gap-1.5 border ${
                  preferred === b.id
                    ? 'bg-gold-500/15 border-gold-500/40 text-gold-200'
                    : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10'
                }`}
              >
                {preferred === b.id ? <CheckCircle2 className="h-3.5 w-3.5"/> : <span className="h-2 w-2 rounded-full bg-white/30"/>}
                {b.name}
              </button>
            ))}
            {savingBroker && <Loader2 className="h-3.5 w-3.5 animate-spin text-white/55"/>}
          </div>
        </div>
      )}

      {positions.length > 0 && (
        <div className="overflow-x-auto">
          <table className="min-w-full text-xs">
            <thead className="text-white/55">
              <tr>
                <th className="text-left py-1 pr-3">Symbol</th>
                <th className="text-left py-1 pr-3">Class</th>
                <th className="text-right py-1 pr-3">Qty</th>
                <th className="text-right py-1 pr-3">Avg</th>
                <th className="text-right py-1 pr-3">Live</th>
                <th className="text-right py-1 pr-3">P&amp;L</th>
              </tr>
            </thead>
            <tbody>
              {positions.map((p) => (
                <tr key={p.key} className="border-t border-white/5">
                  <td className="py-1 pr-3 font-semibold">{p.symbol}</td>
                  <td className="py-1 pr-3 text-white/65">{p.assetClass}</td>
                  <td className="py-1 pr-3 text-right">{Number(p.qty).toLocaleString(undefined, { maximumFractionDigits: 6 })}</td>
                  <td className="py-1 pr-3 text-right">${Number(p.avgPrice || 0).toFixed(4)}</td>
                  <td className="py-1 pr-3 text-right">${Number(p.livePrice || 0).toFixed(4)}</td>
                  <td className={`py-1 pr-3 text-right ${Number(p.pnlUsd) >= 0 ? 'text-neon-green' : 'text-neon-red'}`}>
                    ${Number(p.pnlUsd).toFixed(2)} ({Number(p.pnlPct).toFixed(2)}%)
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </motion.section>
  );
}
