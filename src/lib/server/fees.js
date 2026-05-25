// Maker/taker fee model.
//
// Brokers charge a small percentage on every fill. Oakmont Digital Markets Groups bills every
// invest (buy) and sell as a "taker" fill at the market price - we never
// actually rest an order on Binance, so we always pay the taker rate.
//
// Fees are quoted in basis points (1 bp = 0.01 %) to avoid floating-point
// surprises in config. Defaults are competitive with mid-tier retail
// brokers; ops can override them with env vars.
//
//   FEE_TAKER_BPS  - applies to instant market trades (default 20 = 0.20%)
//   FEE_MAKER_BPS  - applies to resting limit orders that get filled
//                     (default 10 = 0.10%; not yet used)
//
// `applyFee(usd)` returns { net, fee, bps } where net + fee = usd. The
// fee is debited from USDT (on buy) or from the USDT credited (on sell)
// so the user only ever sees the post-fee asset amount.

const DEFAULT_TAKER_BPS = 20;
const DEFAULT_MAKER_BPS = 10;

function bpsFromEnv(name, def) {
  const v = parseFloat(process.env[name] || '');
  if (!isFinite(v) || v < 0 || v > 500) return def; // hard cap 5%
  return v;
}

export function takerBps() {
  return bpsFromEnv('FEE_TAKER_BPS', DEFAULT_TAKER_BPS);
}

export function makerBps() {
  return bpsFromEnv('FEE_MAKER_BPS', DEFAULT_MAKER_BPS);
}

/**
 * Apply the taker fee to a USD amount. Returns the net amount after the
 * fee is taken (used for the asset purchase) and the fee in USD.
 */
export function applyTakerFee(usd) {
  const bps = takerBps();
  // Fee in USD = usd × bps / 10000 (since 1 bp = 0.01% = 1/10000).
  // Round to cents because USDT is quoted to 2 decimal places.
  const feeRaw = (usd * bps) / 10000;
  const fee = Math.round(feeRaw * 100) / 100;
  const net = Math.max(0, Math.round((usd - fee) * 100) / 100);
  return { net, fee, bps };
}

export function feeRateInfo() {
  return { takerBps: takerBps(), makerBps: makerBps() };
}
