'use client';
import { useState } from 'react';
import { Wallet } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Real official logos sourced from each project's primary CDN / asset bucket.
// We deliberately use the providers' canonical SVG/PNG so each tile shows
// the brand mark users recognise from the wallet itself.
const wallets = [
    { name: 'MetaMask',            logo: 'https://raw.githubusercontent.com/MetaMask/brand-resources/master/SVG/metamask-fox.svg' },
    { name: 'Trust Wallet',        logo: 'https://trustwallet.com/assets/images/media/assets/TWT.svg' },
    { name: 'Coinbase Wallet',     logo: 'https://avatars.githubusercontent.com/u/18060234?s=200&v=4' },
    { name: 'WalletConnect',       logo: 'https://walletconnect.com/walletconnect-logo.svg' },
    { name: 'Phantom',             logo: 'https://phantom.app/img/phantom-icon-purple.svg' },
    { name: 'Rainbow',             logo: 'https://rainbow.me/social/icon.png' },
    { name: 'Ledger',              logo: 'https://cdn.simpleicons.org/ledger/ffffff' },
    { name: 'Trezor',              logo: 'https://cdn.simpleicons.org/trezor/ffffff' },
    { name: 'Exodus',              logo: 'https://www.exodus.com/img/icons/icon-512x512.png' },
    { name: 'OKX Wallet',          logo: 'https://www.okx.com/cdn/assets/imgs/239/9D7C2BE2BB23F4A4.png' },
    { name: 'Binance Wallet',      logo: 'https://cdn.simpleicons.org/binance/F0B90B' },
    { name: 'Crypto.com DeFi',     logo: 'https://crypto.com/favicon.ico' },
    { name: 'Zerion',              logo: 'https://zerion.io/favicon.ico' },
    { name: 'SafePal',             logo: 'https://www.safepal.com/favicon.ico' },
    { name: 'TokenPocket',         logo: 'https://www.tokenpocket.pro/favicon.ico' },
    { name: 'MyEtherWallet',       logo: 'https://www.myetherwallet.com/img/icons/favicon.ico' },
];

export function Web3ConnectButton() {
    const [open, setOpen] = useState(false);
    const [notice, setNotice] = useState('Wallet integration is coming soon.');
    const chooseWallet = (walletName) => {
        setNotice(`${walletName} integration is coming soon.`);
    };
    return (<>
      <button onClick={() => { setNotice('Wallet integration is coming soon.'); setOpen(true); }} className="btn-outline text-sm">
        <Wallet className="h-4 w-4"/>
        Wallet
      </button>
      <AnimatePresence>
        {open && (<motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[60] bg-ink-950/80 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setOpen(false)}>
            <motion.div initial={{ scale: 0.95, y: 10 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 10 }} onClick={(e) => e.stopPropagation()} className="glass-strong w-full max-w-2xl p-6 max-h-[85vh] overflow-y-auto">
               <h3 className="text-lg font-semibold text-white">Connect a wallet</h3>
               <p className="text-sm text-white/60 mt-1">Wallet integration is coming soon.</p>
              {notice && <p className="mt-3 text-xs text-white/85 bg-white/5 border border-white/10 rounded-lg px-3 py-2">{notice}</p>}
              <div className="mt-5 grid grid-cols-2 sm:grid-cols-3 gap-3">
                {wallets.map((w) => (<button key={w.name} onClick={() => chooseWallet(w.name)} className="flex items-center gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-left">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={w.logo} alt={`${w.name} logo`} loading="lazy" decoding="async" referrerPolicy="no-referrer" className="h-9 w-9 rounded-lg bg-white/90 object-contain p-1 border border-white/10" onError={(e) => { e.currentTarget.style.visibility = 'hidden'; }}/>
                    <span className="text-sm font-medium">{w.name}</span>
                  </button>))}
              </div>
               <p className="mt-4 text-xs text-white/40">No wallet will be connected from this preview until production-grade wallet integration is enabled.</p>
            </motion.div>
          </motion.div>)}
      </AnimatePresence>
    </>);
}
