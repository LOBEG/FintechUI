// Order settler — drives limit and stop orders to fills.
//
// Lifecycle
//   open      → user just placed; settler is monitoring the trigger.
//   filled    → trigger condition crossed; a transaction has been written
//               and balances updated.
//   cancelled → user cancelled before fill.
//   rejected  → settler refused to fill (e.g. balance gone, asset delisted).
//
// Trigger semantics (all evaluated against the live Binance mid-price)
//   buy  + limit : fill when price <= triggerPrice (buy the dip)
//   sell + limit : fill when price >= triggerPrice (take profit)
//   buy  + stop  : fill when price >= triggerPrice (breakout)
//   sell + stop  : fill when price <= triggerPrice (stop loss)
//
// Settlement is "best effort, single Node process". We schedule one
// global setInterval per worker — guarded with globalThis so HMR /
// repeated route imports don't spawn duplicates. For multi-process
// deployments this should move to a dedicated worker + lock file or
// pg_advisory_lock.
import {
  listOrders,
  updateOrder,
  findUserById,
  upsertUser,
  addTransaction,
} from './store.js';
import { priceFor, isSupportedSymbol } from './prices.js';
import { applyTakerFee } from './fees.js';
import { newId } from './auth.js';

const TICK_MS = 5_000;
const GUARD = Symbol.for('aurumx.orders.tickerStarted');

export function shouldFill(order, price) {
  if (!order || !price || !isFinite(price)) return false;
  const t = Number(order.price);
  if (!isFinite(t) || t <= 0) return false;
  if (order.kind === 'limit') {
    return order.side === 'buy' ? price <= t : price >= t;
  }
  if (order.kind === 'stop') {
    return order.side === 'buy' ? price >= t : price <= t;
  }
  return false;
}

async function fillOrder(order) {
  const user = findUserById(order.userId);
  if (!user) {
    updateOrder(order.id, { status: 'rejected', rejectedReason: 'User missing', cancelledAt: Date.now() });
    return;
  }
  if (user.status === 'frozen' || user.status === 'disabled') {
    updateOrder(order.id, { status: 'rejected', rejectedReason: 'Account is not active', cancelledAt: Date.now() });
    return;
  }
  if (!isSupportedSymbol(order.symbol) || order.symbol === 'USDT') {
    updateOrder(order.id, { status: 'rejected', rejectedReason: 'Asset not tradeable', cancelledAt: Date.now() });
    return;
  }
  const price = await priceFor(order.symbol);
  if (!price || !isFinite(price)) return; // try again next tick
  if (!shouldFill(order, price)) return;

  user.balances = user.balances || {};
  let tx;
  if (order.side === 'buy') {
    const usd = Math.round(Number(order.usd) * 100) / 100;
    const have = user.balances.USDT || 0;
    if (have + 1e-9 < usd) {
      updateOrder(order.id, { status: 'rejected', rejectedReason: 'Insufficient USDT at fill', cancelledAt: Date.now() });
      return;
    }
    const { net, fee, bps } = applyTakerFee(usd);
    const qty = Math.floor((net / price) * 1e8) / 1e8;
    user.balances.USDT = Math.max(0, have - usd);
    user.balances[order.symbol] = (user.balances[order.symbol] || 0) + qty;
    upsertUser(user);
    tx = {
      id: newId('tx'),
      userId: user.id,
      type: 'invest',
      symbol: order.symbol,
      amount: qty,
      price,
      usdValue: usd,
      fee,
      feeBps: bps,
      status: 'completed',
      note: `Filled ${order.kind} buy order @ ${price}`,
      createdAt: Date.now(),
      orderId: order.id,
    };
  } else {
    const qty = Math.floor(Number(order.qty) * 1e8) / 1e8;
    const have = user.balances[order.symbol] || 0;
    if (have + 1e-12 < qty) {
      updateOrder(order.id, { status: 'rejected', rejectedReason: `Insufficient ${order.symbol} at fill`, cancelledAt: Date.now() });
      return;
    }
    const grossUsd = Math.round(qty * price * 100) / 100;
    const { net: netUsd, fee, bps } = applyTakerFee(grossUsd);
    user.balances[order.symbol] = Math.max(0, have - qty);
    user.balances.USDT = (user.balances.USDT || 0) + netUsd;
    upsertUser(user);
    tx = {
      id: newId('tx'),
      userId: user.id,
      type: 'sell',
      symbol: order.symbol,
      amount: qty,
      price,
      usdValue: grossUsd,
      fee,
      feeBps: bps,
      status: 'completed',
      note: `Filled ${order.kind} sell order @ ${price}`,
      createdAt: Date.now(),
      orderId: order.id,
    };
  }
  addTransaction(tx);
  updateOrder(order.id, { status: 'filled', filledAt: Date.now(), txId: tx.id, fillPrice: price });
}

async function tick() {
  let pending;
  try {
    pending = listOrders().filter((o) => o.status === 'open');
  } catch { return; }
  if (!pending.length) return;
  // Group by symbol so we only price each asset once per tick.
  const bySymbol = new Map();
  for (const o of pending) {
    if (!bySymbol.has(o.symbol)) bySymbol.set(o.symbol, []);
    bySymbol.get(o.symbol).push(o);
  }
  for (const [, list] of bySymbol) {
    for (const o of list) {
      try { await fillOrder(o); } catch { /* keep going */ }
    }
  }
}

export function ensureSettlerStarted() {
  if (globalThis[GUARD]) return;
  globalThis[GUARD] = true;
  // Fire once shortly after boot, then on the interval.
  setTimeout(() => { tick().catch(() => {}); }, 1_000);
  setInterval(() => { tick().catch(() => {}); }, TICK_MS).unref?.();
}
