// Cost-basis and P&L engine.
//
// Walks `transactions.json` chronologically and maintains a per-symbol
// weighted-average cost basis. Every inflow (buy / credit) increases
// qty and total cost. Every outflow (sell / withdraw) reduces qty
// pro-rata and books realised P&L = (price - avgCost) * qty − fee.
//
// Why weighted-average instead of FIFO/LIFO?
//   * It is the same model HMRC's Section 104 pool and most retail
//     brokers use.
//   * It is path-independent — `recomputePosition` can be re-run any
//     time against the immutable tx log and gets the same answer.
//   * It needs only two numbers per symbol (qty, totalCost).
//
// USDT is the quote asset; its cost basis is by definition $1, so we
// short-circuit it. The output keeps it in the listing for the UI but
// flags `isQuote: true`.

import { listTransactions } from './store.js';

// Tx types that ADD to a position. Their `amount` is positive and the
// crypto enters the user's balance.
const INFLOW = new Set(['invest', 'admin_credit', 'credit', 'deposit']);
// Tx types that REMOVE from a position. Their `amount` is positive in
// the tx record but represents an outflow from the balance.
const OUTFLOW = new Set(['sell', 'withdraw']);
// Tx types whose `amount` is already signed (positive = inflow,
// negative = outflow). `set` writes the delta, `adjust` writes the
// signed delta, `reversal` writes the negated original amount.
const SIGNED = new Set(['adjust', 'set', 'reversal']);

/**
 * Compute the per-symbol position state for a user given the full
 * transaction list. Returns:
 *   { positions: { [symbol]: { qty, totalCost, avgCost, realised } } }
 *
 * `realised` is summed across the symbol's lifetime (cannot decrease).
 */
export function computePositions(userId, transactions = listTransactions()) {
  const positions = {};
  const ordered = transactions
    .filter((t) => t.userId === userId && t.status !== 'cancelled' && t.status !== 'rejected')
    .slice()
    .sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));

  for (const t of ordered) {
    const sym = t.symbol;
    if (!sym) continue;
    const price = Number(t.price) || 0;
    const fee = Number(t.fee) || 0;
    // Resolve the signed delta in terms of CRYPTO units.
    let delta = 0;
    if (INFLOW.has(t.type)) delta = Number(t.amount) || 0;
    else if (OUTFLOW.has(t.type)) delta = -(Number(t.amount) || 0);
    else if (SIGNED.has(t.type)) delta = Number(t.amount) || 0;
    else continue; // unknown type — ignore for cost basis
    if (!delta) continue;

    const pos = positions[sym] || { qty: 0, totalCost: 0, realised: 0 };
    if (delta > 0) {
      // Inflow — extend the pool. A zero-price inflow (rare, only if
      // priceFor failed at write time) is recorded but does not move
      // avgCost.
      pos.qty += delta;
      pos.totalCost += delta * price;
    } else {
      // Outflow — reduce the pool pro-rata. We clamp the outflow to
      // the current qty so a buggy/over-withdraw tx can't drive qty
      // negative or invent realised P&L from nothing.
      const out = Math.min(-delta, pos.qty);
      if (out > 0 && pos.qty > 0) {
        const avg = pos.totalCost / pos.qty;
        pos.realised += out * (price - avg);
        pos.totalCost -= out * avg;
        pos.qty -= out;
        // Numerical guard.
        if (pos.qty < 1e-12) { pos.qty = 0; pos.totalCost = 0; }
      }
      // Fee always reduces realised, even if the outflow itself was
      // clamped to zero (the user still paid the fee).
      pos.realised -= fee;
    }
    positions[sym] = pos;
  }

  // Finalise avgCost.
  for (const sym of Object.keys(positions)) {
    const p = positions[sym];
    p.avgCost = p.qty > 0 ? p.totalCost / p.qty : 0;
  }
  return positions;
}

/**
 * Build a UI-friendly snapshot. `marks` is `{ symbol: usdPrice }`.
 *
 * Returns:
 *   {
 *     positions: [{ symbol, qty, avgCost, costBasis, mark, marketValue,
 *                   unrealised, unrealisedPct, realised, isQuote }],
 *     realisedTotal, costBasisTotal, marketValueTotal, unrealisedTotal,
 *     totalEquityUsd  // marketValueTotal + USDT balance
 *   }
 */
export function buildPortfolio({ userId, balances = {}, marks = {}, transactions }) {
  const pos = computePositions(userId, transactions);
  const positions = [];
  let realisedTotal = 0;
  let costBasisTotal = 0;
  let marketValueTotal = 0;
  let unrealisedTotal = 0;

  const symbols = new Set([
    ...Object.keys(balances || {}),
    ...Object.keys(pos),
  ]);
  for (const symbol of symbols) {
    const p = pos[symbol] || { qty: 0, totalCost: 0, avgCost: 0, realised: 0 };
    const qty = Number(balances[symbol] ?? p.qty) || 0;
    if (qty === 0 && !p.realised) continue;
    const isQuote = symbol === 'USDT';
    const avgCost = isQuote ? 1 : p.avgCost;
    const costBasis = isQuote ? qty : avgCost * qty;
    const mark = isQuote ? 1 : (Number(marks[symbol]) || avgCost || 0);
    const marketValue = mark * qty;
    const unrealised = isQuote ? 0 : marketValue - costBasis;
    const unrealisedPct = costBasis > 0 ? (unrealised / costBasis) * 100 : 0;
    positions.push({
      symbol,
      qty,
      avgCost,
      costBasis,
      mark,
      marketValue,
      unrealised,
      unrealisedPct,
      realised: p.realised || 0,
      isQuote,
    });
    realisedTotal += p.realised || 0;
    costBasisTotal += costBasis;
    marketValueTotal += marketValue;
    unrealisedTotal += unrealised;
  }
  positions.sort((a, b) => b.marketValue - a.marketValue);
  return {
    positions,
    realisedTotal,
    costBasisTotal,
    marketValueTotal,
    unrealisedTotal,
    totalEquityUsd: marketValueTotal,
  };
}
