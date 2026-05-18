// OFAC / sanctioned-address screening.
//
// This is a *sample* SDN list derived from publicly disclosed Treasury
// designations (Tornado Cash contracts, Lazarus Group clusters, the
// Garantex/Hydra cases, etc.). The full canonical list is published by
// OFAC at https://www.treasury.gov/ofac/downloads/sdnlist.txt — a
// production deployment must pull and refresh that file (or use a vendor
// such as Chainalysis / TRM Labs / Elliptic) rather than relying on this
// hard-coded subset.
//
// We deliberately keep matching case-insensitive and trim whitespace so
// a user pasting an address with stray formatting still gets screened.
// Address formats vary across chains; we compare strings literally —
// sanctioned addresses are reported in their canonical on-chain form.

// Lowercased for cheap O(1) lookup. For EVM (0x…) addresses this is the
// canonical form. For Bitcoin/Base58 the original is mixed case and
// strictly case-sensitive on-chain, but we still compare case-insensitively
// here so a user pasting a sanctioned address with stray casing (e.g.
// pulled from a web page that title-cased it) is still flagged — false
// positives are vanishingly unlikely at base58 entropy. A production
// deployment should mirror OFAC's canonical capitalisation and compare
// exactly. Comments mark provenance.
const SANCTIONED = new Set([
  // Tornado Cash (Aug 2022, OFAC SDN list — ETH mixer contracts).
  '0x8589427373d6d84e98730d7795d8f6f8731fda16',
  '0x722122df12d4e14e13ac3b6895a86e84145b6967',
  '0xdd4c48c0b24039969fc16d1cdf626eab821d3384',
  '0xd90e2f925da726b50c4ed8d0fb90ad053324f31b',
  '0xd96f2b1c14db8458374d9aca76e26c3d18364307',
  '0x4736dcf1b7a3d580672ccce6213ca176d69c8b7d',
  '0x910cbd523d972eb0a6f4cae4618ad62622b39dbf',
  '0xa160cdab225685da1d56aa342ad8841c3b53f291',
  '0xd4b88df4d29f5cedd6857912842cff3b20c8cfa3',
  '0xfd8610d20aa15b7b2e3be39b396a1bc3516c7144',
  '0xf60dd140cff0706bae9cd734ac3ae76ad9ebc32a',
  // Lazarus Group (DPRK) — sample BTC + ETH clusters from FBI advisories.
  '0xb6f5ec1a0a9cd1526536d3f0426c429529471f40',
  '0xfac583c0cf07ea434052c49115a4682172ab6b4f',
  '1np79xrunjbsxnwnkgxk1nimtcxmav8m1n',
  // Garantex (Apr 2022 designation — sample wallets).
  '0xb6c5273e79e2adfd09a25fd620fc4fe5c2a4bd16',
  // Hydra (Apr 2022) — sample BTC cluster.
  '1jzacmw7xkvvbnpktdy7yczjwgczggjvw3',
]);

/**
 * Returns true if the address is on the embedded sanctions list.
 * Comparison is case-insensitive and trims surrounding whitespace.
 *
 * @param {string} address
 * @returns {boolean}
 */
export function isSanctionedAddress(address) {
  if (!address || typeof address !== 'string') return false;
  return SANCTIONED.has(address.trim().toLowerCase());
}

/**
 * Returns the canonical "match reason" string, or null if not sanctioned.
 * Today every match returns the same generic reason; broken out so future
 * vendor integrations can return the list/programme name without breaking
 * callers.
 *
 * @param {string} address
 * @returns {string|null}
 */
export function sanctionsMatchReason(address) {
  return isSanctionedAddress(address)
    ? 'Destination address is on the OFAC SDN sanctioned list. Withdrawal blocked.'
    : null;
}
