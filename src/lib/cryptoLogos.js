const logoMap = {
    BTC: 'https://cryptologos.cc/logos/bitcoin-btc-logo.svg',
    ETH: 'https://cryptologos.cc/logos/ethereum-eth-logo.svg',
    SOL: 'https://cryptologos.cc/logos/solana-sol-logo.svg',
    BNB: 'https://cryptologos.cc/logos/bnb-bnb-logo.svg',
    XRP: 'https://cryptologos.cc/logos/xrp-xrp-logo.svg',
    ADA: 'https://cryptologos.cc/logos/cardano-ada-logo.svg',
    DOGE: 'https://cryptologos.cc/logos/dogecoin-doge-logo.svg',
    AVAX: 'https://cryptologos.cc/logos/avalanche-avax-logo.svg',
    MATIC: 'https://cryptologos.cc/logos/polygon-matic-logo.svg',
    DOT: 'https://cryptologos.cc/logos/polkadot-new-dot-logo.svg',
    LTC: 'https://cryptologos.cc/logos/litecoin-ltc-logo.svg',
    LINK: 'https://cryptologos.cc/logos/chainlink-link-logo.svg',
    USDT: 'https://cryptologos.cc/logos/tether-usdt-logo.svg',
    USDC: 'https://cryptologos.cc/logos/usd-coin-usdc-logo.svg',
    UNI: 'https://cryptologos.cc/logos/uniswap-uni-logo.svg',
    ATOM: 'https://cryptologos.cc/logos/cosmos-atom-logo.svg',
    XLM: 'https://cryptologos.cc/logos/stellar-xlm-logo.svg',
    ALGO: 'https://cryptologos.cc/logos/algorand-algo-logo.svg',
    VET: 'https://cryptologos.cc/logos/vechain-vet-logo.svg',
    FIL: 'https://cryptologos.cc/logos/filecoin-fil-logo.svg',
    TRX: 'https://cryptologos.cc/logos/tron-trx-logo.svg',
    ETC: 'https://cryptologos.cc/logos/ethereum-classic-etc-logo.svg',
    NEAR: 'https://cryptologos.cc/logos/near-protocol-near-logo.svg',
    APT: 'https://cryptologos.cc/logos/aptos-apt-logo.svg',
    ARB: 'https://cryptologos.cc/logos/arbitrum-arb-logo.svg',
    OP: 'https://cryptologos.cc/logos/optimism-ethereum-op-logo.svg',
    TON: 'https://cryptologos.cc/logos/toncoin-ton-logo.svg',
    SUI: 'https://cryptologos.cc/logos/sui-sui-logo.svg',
    INJ: 'https://cryptologos.cc/logos/injective-inj-logo.svg',
    SHIB: 'https://cryptologos.cc/logos/shiba-inu-shib-logo.svg',
    PEPE: 'https://cryptologos.cc/logos/pepe-pepe-logo.svg',
    BCH: 'https://cryptologos.cc/logos/bitcoin-cash-bch-logo.svg',
    HBAR: 'https://cryptologos.cc/logos/hedera-hbar-logo.svg',
};

// Resolve the real logo URL for a given asset symbol. Handles both pure
// symbols ("USDT", "BTC") and trading pairs ("BTCUSDT", "ETHUSDC"). The
// previous implementation stripped USDT / USDC unconditionally which
// meant `getCryptoLogo('USDT')` collapsed to an empty string and the
// stablecoin rendered as a fallback initial circle everywhere.
export function getCryptoLogo(symbol) {
    if (!symbol) return null;
    const u = String(symbol).toUpperCase();
    // Exact match first - this is what fixes USDT / USDC / BUSD showing
    // a fallback circle instead of their real logo.
    if (logoMap[u]) return logoMap[u];
    // Otherwise treat it as a pair: strip a trailing quote-currency
    // suffix (USDT / USDC / BUSD / FDUSD / TUSD / DAI) only when it
    // leaves a non-empty base symbol behind.
    const base = u.replace(/(USDT|USDC|BUSD|FDUSD|TUSD|DAI)$/, '');
    if (base && base !== u && logoMap[base]) return logoMap[base];
    return null;
}

export function cryptoLogoStyle(symbol) {
    const logo = getCryptoLogo(symbol);
    if (!logo) return null;
    return {
        backgroundImage: `url(${logo})`,
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        backgroundSize: 'cover',
    };
}
