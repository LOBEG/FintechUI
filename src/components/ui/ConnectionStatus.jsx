'use client';
import { useEffect, useState } from 'react';
import { Wifi, WifiOff, AlertTriangle, Radio } from 'lucide-react';
import { CONNECTION_STATUS, getConnectionStatusDisplay } from '@/lib/useLiveData';

/**
 * Compact connection status badge.
 * Shows a pulsing dot + label when live, amber when degraded, red when disconnected.
 */
export function ConnectionBadge({ status, lastUpdated, className = '' }) {
  const display = getConnectionStatusDisplay(status);
  const [staleSeconds, setStaleSeconds] = useState(0);

  useEffect(() => {
    if (!lastUpdated) {
      setStaleSeconds(0);
      return undefined;
    }
    setStaleSeconds(Math.floor((Date.now() - lastUpdated) / 1000));
    const id = setInterval(() => {
      setStaleSeconds(Math.floor((Date.now() - lastUpdated) / 1000));
    }, 1000);
    return () => clearInterval(id);
  }, [lastUpdated]);

  const isStale = staleSeconds > 30;

  return (
    <span className={`inline-flex items-center gap-1.5 text-[11px] font-medium ${className}`}>
      <span className={`relative h-2 w-2 rounded-full ${display.dotClass}`}>
        {status === CONNECTION_STATUS.LIVE && (
          <span className={`absolute inset-0 rounded-full ${display.dotClass} animate-ping opacity-50`} />
        )}
      </span>
      <span className={display.className}>{display.label}</span>
      {isStale && status !== CONNECTION_STATUS.DISCONNECTED && (
        <span className="text-amber-400/80 ml-1">({staleSeconds}s ago)</span>
      )}
    </span>
  );
}

/**
 * Stale data indicator overlay.
 * Wraps content and shows a subtle warning when data hasn't refreshed.
 */
export function StaleDataOverlay({ isStale, children, className = '' }) {
  if (!isStale) return <div className={className}>{children}</div>;
  return (
    <div className={`relative ${className}`}>
      <div className="opacity-75">{children}</div>
      <div className="absolute top-1 right-1 inline-flex items-center gap-1 bg-amber-900/80 text-amber-300 text-[10px] px-2 py-0.5 rounded-full border border-amber-600/30 backdrop-blur-sm">
        <AlertTriangle className="h-2.5 w-2.5" />
        Stale
      </div>
    </div>
  );
}

/**
 * Full-width connection status bar (for page headers).
 */
export function ConnectionStatusBar({ status, lastUpdated }) {
  if (status === CONNECTION_STATUS.LIVE) return null;
  const display = getConnectionStatusDisplay(status);
  const Icon = status === CONNECTION_STATUS.DISCONNECTED ? WifiOff
    : status === CONNECTION_STATUS.DEGRADED ? AlertTriangle
    : Radio;

  const messages = {
    [CONNECTION_STATUS.CONNECTING]: 'Connecting to live market feeds…',
    [CONNECTION_STATUS.DEGRADED]: 'Connection unstable – retrying with backoff. Prices shown may be delayed.',
    [CONNECTION_STATUS.DISCONNECTED]: 'Disconnected from market feeds. Will retry automatically.',
  };

  return (
    <div className={`w-full px-4 py-2 flex items-center gap-2 text-xs border-b ${
      status === CONNECTION_STATUS.DISCONNECTED
        ? 'bg-red-950/40 border-red-800/30 text-red-300'
        : status === CONNECTION_STATUS.DEGRADED
          ? 'bg-amber-950/40 border-amber-800/30 text-amber-300'
          : 'bg-slate-900/40 border-white/5 text-white/60'
    }`}>
      <Icon className="h-3.5 w-3.5 shrink-0" />
      <span>{messages[status]}</span>
      {lastUpdated && (
        <span className="ml-auto text-[10px] opacity-70">
          Last update: {new Date(lastUpdated).toLocaleTimeString()}
        </span>
      )}
    </div>
  );
}
