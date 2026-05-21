'use client';
import { useState } from 'react';
import { Wallet } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
const wallets = [
    { name: 'MetaMask', logo: 'https://upload.wikimedia.org/wikipedia/commons/3/36/MetaMask_Fox.svg' },
    { name: 'WalletConnect', logo: 'https://avatars.githubusercontent.com/u/37784886' },
    { name: 'Coinbase Wallet', logo: 'https://avatars.githubusercontent.com/u/1885080?s=200&v=4' },
    { name: 'Trust Wallet', logo: 'https://trustwallet.com/assets/images/favicon.png' },
    { name: 'Phantom', logo: 'https://phantom.app/img/phantom-logo.svg' },
    { name: 'Ledger', logo: 'https://www.ledger.com/favicon.ico' },
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
            <motion.div initial={{ scale: 0.95, y: 10 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 10 }} onClick={(e) => e.stopPropagation()} className="glass-strong w-full max-w-md p-6">
               <h3 className="text-lg font-semibold text-white">Wallet connection coming soon</h3>
               <p className="text-sm text-white/60 mt-1">Wallet integration is coming soon.</p>
              {notice && <p className="mt-3 text-xs text-cyan bg-neon-green/10 border border-neon-green/30 rounded-lg px-3 py-2">{notice}</p>}
              <div className="mt-5 grid grid-cols-2 gap-3">
                {wallets.map((w) => (<button key={w.name} onClick={() => chooseWallet(w.name)} className="flex items-center gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-left">
                    <span className="h-9 w-9 rounded-full bg-white bg-center bg-contain bg-no-repeat border border-white/10" style={{ backgroundImage: `url(${w.logo})` }} aria-hidden/>
                    <span className="text-sm font-medium">{w.name}</span>
                  </button>))}
              </div>
               <p className="mt-4 text-xs text-white/40">No wallet will be connected from this preview until production-grade wallet integration is enabled.</p>
            </motion.div>
          </motion.div>)}
      </AnimatePresence>
    </>);
}
