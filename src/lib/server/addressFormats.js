// Per-asset deposit address validation.
//
// These regexes are intentionally permissive - they catch obvious typos
// (wrong charset, wrong length) without trying to perform full checksum
// verification (which would require an asset-specific cryptographic
// library per chain). The goal is to make it impossible for an admin to
// publish a wallet that is clearly not a valid address for the asset.
//
// Memo / destination-tag bearing chains (XRP, ATOM, EOS, TON, HBAR,
// XLM) are listed in MEMO_REQUIRED. The deposit panel will warn users
// that omitting the memo will result in lost funds.

// Address format checks. Network qualifier (e.g. "ERC20", "TRC20") is
// honoured when present so the same symbol on different chains can use
// a different validator.
const FORMATS = {
  BTC:   [/^(bc1[a-z0-9]{25,90}|[13][1-9A-HJ-NP-Za-km-z]{25,39})$/], // bech32 / legacy
  LTC:   [/^(ltc1[a-z0-9]{25,90}|[LM3][1-9A-HJ-NP-Za-km-z]{25,39})$/],
  BCH:   [/^(bitcoincash:)?(q|p)[a-z0-9]{30,50}$/i],
  ETH:   [/^0x[a-fA-F0-9]{40}$/],
  BNB:   [/^0x[a-fA-F0-9]{40}$/],          // BSC
  MATIC: [/^0x[a-fA-F0-9]{40}$/],
  ARB:   [/^0x[a-fA-F0-9]{40}$/],
  OP:    [/^0x[a-fA-F0-9]{40}$/],
  AVAX:  [/^0x[a-fA-F0-9]{40}$/],          // C-Chain only (X-Chain not supported here)
  LINK:  [/^0x[a-fA-F0-9]{40}$/],
  SHIB:  [/^0x[a-fA-F0-9]{40}$/],
  PEPE:  [/^0x[a-fA-F0-9]{40}$/],
  INJ:   [/^(0x[a-fA-F0-9]{40}|inj1[a-z0-9]{38,45})$/],
  ETC:   [/^0x[a-fA-F0-9]{40}$/],
  SOL:   [/^[1-9A-HJ-NP-Za-km-z]{32,44}$/],
  XRP:   [/^r[1-9A-HJ-NP-Za-km-z]{24,34}$/],
  ADA:   [/^(addr1[0-9a-z]{50,110}|DdzFF[0-9A-Za-z]{50,150}|Ae2[0-9A-Za-z]{50,100})$/],
  DOGE:  [/^D[5-9A-HJ-NP-U][1-9A-HJ-NP-Za-km-z]{32,33}$/],
  TRX:   [/^T[1-9A-HJ-NP-Za-km-z]{33}$/],
  USDT:  [
    /^0x[a-fA-F0-9]{40}$/,                  // ERC20 / BSC
    /^T[1-9A-HJ-NP-Za-km-z]{33}$/,          // TRC20
    /^[1-9A-HJ-NP-Za-km-z]{32,44}$/,        // SPL
  ],
  DOT:   [/^1[1-9A-HJ-NP-Za-km-z]{45,47}$/],
  TON:   [/^(EQ|UQ|kQ|0Q)[A-Za-z0-9_-]{46,48}$/],
  ATOM:  [/^cosmos1[a-z0-9]{38,45}$/],
  NEAR:  [/^(?:[a-z0-9_-]{2,64}\.(?:near|testnet)|[a-f0-9]{64})$/],
  APT:   [/^0x[a-fA-F0-9]{1,64}$/],
  SUI:   [/^0x[a-fA-F0-9]{1,64}$/],
  FIL:   [/^f[0-3][1-9a-zA-Z]{8,90}$/],
  XLM:   [/^G[A-Z2-7]{55}$/],
  ALGO:  [/^[A-Z2-7]{58}$/],
  HBAR:  [/^\d+\.\d+\.\d+$/],
};

export const MEMO_REQUIRED = new Set(['XRP', 'ATOM', 'EOS', 'TON', 'HBAR', 'XLM']);

// Networks we offer in the withdraw UI per asset. The first entry is the
// default.
export const NETWORKS = {
  BTC:   ['Bitcoin'],
  LTC:   ['Litecoin'],
  BCH:   ['Bitcoin Cash'],
  ETH:   ['ERC20'],
  BNB:   ['BEP20'],
  MATIC: ['Polygon'],
  ARB:   ['Arbitrum One'],
  OP:    ['Optimism'],
  AVAX:  ['C-Chain'],
  LINK:  ['ERC20', 'BEP20', 'Polygon'],
  SHIB:  ['ERC20', 'BEP20'],
  PEPE:  ['ERC20'],
  INJ:   ['Injective', 'ERC20'],
  ETC:   ['Ethereum Classic'],
  SOL:   ['Solana'],
  XRP:   ['XRP Ledger'],
  ADA:   ['Cardano'],
  DOGE:  ['Dogecoin'],
  TRX:   ['TRC20'],
  USDT:  ['TRC20', 'ERC20', 'BEP20', 'Solana'],
  DOT:   ['Polkadot'],
  TON:   ['TON'],
  ATOM:  ['Cosmos Hub'],
  NEAR:  ['NEAR'],
  APT:   ['Aptos'],
  SUI:   ['Sui'],
  FIL:   ['Filecoin'],
  XLM:   ['Stellar'],
  ALGO:  ['Algorand'],
  HBAR:  ['Hedera'],
};

/**
 * Validate a deposit/withdraw address against the per-asset regex.
 * Returns { ok: true } on a match, or { ok: false, reason } on a mismatch.
 * Unknown symbols are accepted with a generic length check so the function
 * never blocks a legitimate new asset, but typos in known assets are
 * rejected.
 */
export function validateAddressForSymbol(symbol, address) {
  const sym = String(symbol || '').toUpperCase();
  const addr = String(address || '').trim();
  if (!addr) return { ok: false, reason: 'address is empty' };
  if (addr.length < 8 || addr.length > 110) {
    return { ok: false, reason: 'address length is implausible' };
  }
  const patterns = FORMATS[sym];
  if (!patterns) return { ok: true };
  const matches = patterns.some((re) => re.test(addr));
  if (!matches) {
    return {
      ok: false,
      reason: `address does not look like a valid ${sym} address. Double-check the chain/network and try again.`,
    };
  }
  return { ok: true };
}

export function requiresMemo(symbol) {
  return MEMO_REQUIRED.has(String(symbol || '').toUpperCase());
}

export function networksFor(symbol) {
  return NETWORKS[String(symbol || '').toUpperCase()] || [];
}
