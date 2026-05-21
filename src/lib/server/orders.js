// Order settler - drives limit and stop orders to fills.
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
// global setInterval per worker - guarded with globalThis so HMR /
// repeated route imports don't spawn duplicates. For multi-process
// deployments this should move to a dedicated worker + lock file or
// pg_advisory_lock.
import {
  listOrders,
  updateOrder,
  findUserById,
  upsertUser,
  addTransaction,
  activePriceAlerts,
  updatePriceAlert,
  addNotification,
  activeDcas,
  updateDca,
} from './store.js';
import { priceFor, isSupportedSymbol } from './prices.js';
import { applyTakerFee } from './fees.js';
import { newId } from './auth.js';
import { sendEmail } from './email.js';
import { creditReferralRebate } from './referral.js';

const TICK_MS = 5_000;
const GUARD = Symbol.for('oakmontdc.orders.tickerStarted');

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

// True if a `gt`/`lt` alert has crossed its threshold at the given live
// price. We use `>=` / `<=` (rather than strict `>`/`<`) so a hand-set
// threshold that exactly matches the tick still fires.
export function alertShouldFire(alert, price) {
  if (!alert || !price || !isFinite(price)) return false;
  const t = Number(alert.threshold);
  if (!isFinite(t) || t <= 0) return false;
  if (alert.op === 'gt') return price >= t;
  if (alert.op === 'lt') return price <= t;
  return false;
}

async function fireAlert(alert, price) {
  const user = findUserById(alert.userId);
  if (!user) {
    updatePriceAlert(alert.id, { status: 'cancelled', cancelledAt: Date.now() });
    return;
  }
  const direction = alert.op === 'gt' ? 'above' : 'below';
  const title = `${alert.symbol} ${direction} ${alert.threshold}`;
  const body = `${alert.symbol} reached ${price} (alert set when ${direction === 'above' ? '≥' : '≤'} ${alert.threshold}).`;
  updatePriceAlert(alert.id, {
    status: 'triggered',
    triggeredAt: Date.now(),
    triggeredPrice: price,
  });
  try {
    addNotification({
      id: newId('ntf'),
      userId: user.id,
      kind: 'price_alert',
      title,
      body,
      createdAt: Date.now(),
    });
  } catch { /* notifications best-effort */ }
  try {
    await sendEmail({
      to: user.email,
      subject: `Price alert: ${title}`,
      text: body,
      html: `<p>${body}</p><p>View your dashboard to set a follow-up alert.</p>`,
    });
  } catch { /* email best-effort */ }
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
  creditReferralRebate({ refereeId: user.id, feeUsd: tx.fee, sourceTxId: tx.id, kind: 'order' });
  updateOrder(order.id, { status: 'filled', filledAt: Date.now(), txId: tx.id, fillPrice: price });
}

async function tick() {
  let pending;
  let alerts;
  let dcas;
  try {
    pending = listOrders().filter((o) => o.status === 'open');
    alerts = activePriceAlerts();
    dcas = activeDcas();
  } catch { return; }
  // Process due DCAs first - they don't depend on a price-cross condition,
  // just on wall-clock time, so we don't need a per-symbol price loop here.
  const now = Date.now();
  for (const d of dcas) {
    if (!d.nextRunAt || d.nextRunAt > now) continue;
    try { await runDca(d); } catch { /* keep going */ }
  }
  if (!pending.length && !alerts.length) return;
  // Group both orders and alerts by symbol so we fetch each asset's
  // price at most once per tick. fillOrder also calls priceFor() but
  // that result is cached upstream (prices.js), so this is cheap.
  const symbols = new Set();
  for (const o of pending) symbols.add(o.symbol);
  for (const a of alerts) symbols.add(a.symbol);
  for (const symbol of symbols) {
    let price = 0;
    try { price = await priceFor(symbol); } catch { /* keep going */ }
    if (!price || !isFinite(price)) continue;
    for (const a of alerts) {
      if (a.symbol !== symbol) continue;
      if (!alertShouldFire(a, price)) continue;
      try { await fireAlert(a, price); } catch { /* keep going */ }
    }
    for (const o of pending) {
      if (o.symbol !== symbol) continue;
      try { await fillOrder(o); } catch { /* keep going */ }
    }
  }
}

// Execute a DCA tranche: debit USDT, credit crypto at the live taker
// price (with taker fee applied), record a transaction, advance the
// schedule. If the user has insufficient USDT the schedule is paused so
// the desk / user can top up; runs counter does not advance.
async function runDca(dca) {
  const user = findUserById(dca.userId);
  if (!user) {
    updateDca(dca.id, { status: 'cancelled', cancelledAt: Date.now() });
    return;
  }
  if (!isSupportedSymbol(dca.symbol) || dca.symbol === 'USDT') {
    updateDca(dca.id, { status: 'cancelled', cancelledAt: Date.now() });
    return;
  }
  const usdAmount = Number(dca.usdAmount);
  if (!isFinite(usdAmount) || usdAmount <= 0) {
    updateDca(dca.id, { status: 'cancelled', cancelledAt: Date.now() });
    return;
  }
  const usdt = user.balances?.USDT || 0;
  if (usdt + 1e-9 < usdAmount) {
    // Pause and surface a notification so the user knows.
    updateDca(dca.id, { status: 'paused', pausedAt: Date.now(), pauseReason: 'insufficient USDT' });
    try {
      addNotification({
        id: newId('ntf'),
        userId: user.id,
        kind: 'dca',
        title: `DCA paused - top up USDT`,
        body: `Your ${dca.symbol} recurring buy ($${usdAmount}) was paused at ${new Date().toISOString()} because your USDT balance was below the tranche amount.`,
        createdAt: Date.now(),
      });
    } catch { /* notification is best-effort */ }
    return;
  }
  const price = await priceFor(dca.symbol);
  if (!price || !isFinite(price)) {
    // Don't advance - try again next tick.
    return;
  }
  const { net: netUsd, fee, bps } = applyTakerFee(usdAmount);
  const cryptoAmount = Math.floor((netUsd / price) * 1e8) / 1e8;
  if (cryptoAmount <= 0) {
    updateDca(dca.id, { status: 'paused', pausedAt: Date.now(), pauseReason: 'amount too small' });
    return;
  }
  user.balances = user.balances || {};
  user.balances.USDT = Math.max(0, usdt - usdAmount);
  user.balances[dca.symbol] = (user.balances[dca.symbol] || 0) + cryptoAmount;
  upsertUser(user);
  const dcaTxId = newId('tx');
  addTransaction({
    id: dcaTxId,
    userId: user.id,
    type: 'invest',
    symbol: dca.symbol,
    amount: cryptoAmount,
    price,
    usdValue: usdAmount,
    fee,
    feeBps: bps,
    status: 'completed',
    note: `DCA tranche - ${cryptoAmount} ${dca.symbol} for $${usdAmount} (fee ${fee.toFixed(2)} USDT)`,
    dcaId: dca.id,
    createdAt: Date.now(),
  });
  creditReferralRebate({ refereeId: user.id, feeUsd: fee, sourceTxId: dcaTxId, kind: 'dca' });
  const runs = (Number(dca.runs) || 0) + 1;
  updateDca(dca.id, {
    runs,
    lastRunAt: Date.now(),
    nextRunAt: Date.now() + Number(dca.intervalMs || 0),
  });
}

export function ensureSettlerStarted() {
  if (globalThis[GUARD]) return;
  globalThis[GUARD] = true;
  // Fire once shortly after boot, then on the interval.
  setTimeout(() => { tick().catch(() => {}); }, 1_000);
  setInterval(() => { tick().catch(() => {}); }, TICK_MS).unref?.();
}
