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
};

export function getCryptoLogo(symbol) {
    if (!symbol) return null;
    const upper = symbol.toUpperCase().replace('USDT', '').replace('USDC', '').replace('BUSD', '');
    return logoMap[upper] || `https://via.placeholder.com/32/05070d/00ffa3?text=${upper.charAt(0)}`;
}
