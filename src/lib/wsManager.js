'use client';

/**
 * Centralized WebSocket Manager for Binance streaming market data.
 * 
 * Features:
 * - Connection lifecycle management
 * - Automatic reconnection with exponential backoff + jitter
 * - Heartbeat/ping monitoring
 * - Stale connection detection
 * - Stream deduplication (singleton per stream key)
 * - Graceful fallback to REST polling
 * - Memory leak prevention via reference counting
 * - Throttled state dispatching for UI performance
 */

// --- Configuration ---
const BINANCE_WS_BASE = 'wss://stream.binance.com:9443/ws';
const BINANCE_COMBINED_BASE = 'wss://stream.binance.com:9443/stream?streams=';

const RECONNECT_BASE_MS = 1000;
const RECONNECT_MAX_MS = 30000;
const MAX_RECONNECT_ATTEMPTS = 8;
const HEARTBEAT_INTERVAL_MS = 30000;
const STALE_TIMEOUT_MS = 45000;
const THROTTLE_MS = 250; // Minimum interval between dispatches to subscribers

// --- Connection States ---
export const WS_STATE = {
  CONNECTING: 'connecting',
  OPEN: 'open',
  CLOSING: 'closing',
  CLOSED: 'closed',
  RECONNECTING: 'reconnecting',
};

// --- Singleton stream registry ---
const streams = new Map();

function getBackoffDelay(attempt) {
  const delay = Math.min(RECONNECT_BASE_MS * Math.pow(2, attempt), RECONNECT_MAX_MS);
  return delay * (0.8 + Math.random() * 0.4);
}

/**
 * Managed WebSocket stream with lifecycle handling.
 */
class ManagedStream {
  constructor(key, url, options = {}) {
    this.key = key;
    this.url = url;
    this.options = options;
    this.ws = null;
    this.state = WS_STATE.CLOSED;
    this.subscribers = new Set();
    this.reconnectAttempts = 0;
    this.reconnectTimer = null;
    this.heartbeatTimer = null;
    this.staleTimer = null;
    this.lastMessageAt = 0;
    this.destroyed = false;
    this._throttleTimer = null;
    this._pendingData = null;
  }

  subscribe(callback) {
    this.subscribers.add(callback);
    if (this.state === WS_STATE.CLOSED && !this.destroyed) {
      this.connect();
    }
    return () => this.unsubscribe(callback);
  }

  unsubscribe(callback) {
    this.subscribers.delete(callback);
    if (this.subscribers.size === 0) {
      this.destroy();
    }
  }

  connect() {
    if (this.destroyed) return;
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return;
    }

    this.state = WS_STATE.CONNECTING;
    this._notifyState();

    try {
      this.ws = new WebSocket(this.url);
    } catch (err) {
      this._scheduleReconnect();
      return;
    }

    this.ws.onopen = () => {
      this.state = WS_STATE.OPEN;
      this.reconnectAttempts = 0;
      this.lastMessageAt = Date.now();
      this._startHeartbeat();
      this._startStaleCheck();
      this._notifyState();
    };

    this.ws.onmessage = (event) => {
      this.lastMessageAt = Date.now();
      this._resetStaleCheck();
      try {
        const data = JSON.parse(event.data);
        this._throttledDispatch(data);
      } catch (_) {
        // Ignore malformed messages
      }
    };

    this.ws.onerror = () => {
      // Error will be followed by onclose
    };

    this.ws.onclose = () => {
      this._stopHeartbeat();
      this._stopStaleCheck();
      if (!this.destroyed) {
        this.state = WS_STATE.RECONNECTING;
        this._notifyState();
        this._scheduleReconnect();
      } else {
        this.state = WS_STATE.CLOSED;
        this._notifyState();
      }
    };
  }

  _throttledDispatch(data) {
    this._pendingData = data;
    if (this._throttleTimer) return;
    this._throttleTimer = setTimeout(() => {
      this._throttleTimer = null;
      if (this._pendingData) {
        const d = this._pendingData;
        this._pendingData = null;
        for (const cb of this.subscribers) {
          try { cb({ type: 'data', data: d, state: this.state }); } catch (_) {}
        }
      }
    }, THROTTLE_MS);
  }

  _notifyState() {
    for (const cb of this.subscribers) {
      try { cb({ type: 'state', state: this.state }); } catch (_) {}
    }
  }

  _startHeartbeat() {
    this._stopHeartbeat();
    this.heartbeatTimer = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        try {
          this.ws.send(JSON.stringify({ method: 'ping' }));
        } catch (_) {}
      }
    }, HEARTBEAT_INTERVAL_MS);
  }

  _stopHeartbeat() {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  _startStaleCheck() {
    this._stopStaleCheck();
    this.staleTimer = setInterval(() => {
      if (Date.now() - this.lastMessageAt > STALE_TIMEOUT_MS) {
        // Connection is stale, force reconnect
        this._forceReconnect();
      }
    }, STALE_TIMEOUT_MS / 2);
  }

  _stopStaleCheck() {
    if (this.staleTimer) {
      clearInterval(this.staleTimer);
      this.staleTimer = null;
    }
  }

  _resetStaleCheck() {
    this.lastMessageAt = Date.now();
  }

  _forceReconnect() {
    if (this.ws) {
      try { this.ws.close(); } catch (_) {}
    }
  }

  _scheduleReconnect() {
    if (this.destroyed) return;
    if (this.reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
      this.state = WS_STATE.CLOSED;
      this._notifyState();
      // Notify subscribers of failure so they can fallback
      for (const cb of this.subscribers) {
        try { cb({ type: 'failed', state: this.state }); } catch (_) {}
      }
      return;
    }
    const delay = getBackoffDelay(this.reconnectAttempts);
    this.reconnectAttempts++;
    this.reconnectTimer = setTimeout(() => {
      if (!this.destroyed) this.connect();
    }, delay);
  }

  destroy() {
    this.destroyed = true;
    this.subscribers.clear();
    this._stopHeartbeat();
    this._stopStaleCheck();
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this._throttleTimer) {
      clearTimeout(this._throttleTimer);
      this._throttleTimer = null;
    }
    if (this.ws) {
      try { this.ws.close(); } catch (_) {}
      this.ws = null;
    }
    this.state = WS_STATE.CLOSED;
    streams.delete(this.key);
  }
}

// --- Public API ---

/**
 * Get or create a managed WebSocket stream.
 * Streams are deduplicated by key — multiple consumers share one connection.
 */
export function getStream(key, url, options) {
  if (streams.has(key)) {
    return streams.get(key);
  }
  const stream = new ManagedStream(key, url, options);
  streams.set(key, stream);
  return stream;
}

/**
 * Build a combined Binance stream URL for multiple ticker streams.
 * @param {string[]} symbols - e.g. ['btcusdt', 'ethusdt']
 * @param {string} streamType - e.g. 'ticker', 'miniTicker', 'kline_1m'
 */
export function buildCombinedStreamUrl(symbols, streamType = 'miniTicker') {
  const streamNames = symbols.map((s) => `${s.toLowerCase()}@${streamType}`);
  return `${BINANCE_COMBINED_BASE}${streamNames.join('/')}`;
}

/**
 * Build a single-symbol kline stream URL.
 * @param {string} symbol - e.g. 'btcusdt'
 * @param {string} interval - e.g. '1m', '5m', '1h'
 */
export function buildKlineStreamUrl(symbol, interval) {
  return `${BINANCE_WS_BASE}/${symbol.toLowerCase()}@kline_${interval}`;
}

/**
 * Build a ticker stream URL for all market tickers.
 * Uses the combined stream for a set of symbols.
 * @param {string[]} symbols
 */
export function buildTickerStreamUrl(symbols) {
  return buildCombinedStreamUrl(symbols, 'ticker');
}

/**
 * Destroy all active streams. Used for cleanup/testing.
 */
export function destroyAllStreams() {
  for (const stream of streams.values()) {
    stream.destroy();
  }
  streams.clear();
}
