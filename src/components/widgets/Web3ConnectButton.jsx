'use client';
import { useState } from 'react';
import { Wallet } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
const wallets = [
    { name: 'MetaMask', icon: '🦊' },
    { name: 'WalletConnect', icon: '🔗' },
    { name: 'Coinbase Wallet', icon: '🟦' },
    { name: 'Trust Wallet', icon: '🛡️' },
    { name: 'Phantom (Solana)', icon: '👻' },
    { name: 'Ledger', icon: '🔒' },
];
export function Web3ConnectButton() {
    const [open, setOpen] = useState(false);
    const [connected, setConnected] = useState(null);
    return (<>
      <button onClick={() => setOpen(true)} className="btn-outline text-sm">
        <Wallet className="h-4 w-4"/>
        {connected ? `${connected.slice(0, 8)}…` : 'Connect Wallet'}
      </button>
      <AnimatePresence>
        {open && (<motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[60] bg-ink-950/80 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setOpen(false)}>
            <motion.div initial={{ scale: 0.95, y: 10 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 10 }} onClick={(e) => e.stopPropagation()} className="glass-strong w-full max-w-md p-6">
              <h3 className="text-lg font-semibold text-white">Connect a wallet</h3>
              <p className="text-sm text-white/60 mt-1">Choose a supported Web3 wallet to continue.</p>
              <div className="mt-5 grid grid-cols-2 gap-3">
                {wallets.map((w) => (<button key={w.name} onClick={() => {
                    setConnected('0x' + Math.random().toString(16).slice(2, 14));
                    setOpen(false);
                }} className="flex items-center gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-left">
                    <span className="text-2xl">{w.icon}</span>
                    <span className="text-sm font-medium">{w.name}</span>
                  </button>))}
              </div>
              <p className="mt-4 text-xs text-white/40">By connecting, you agree to AurumX Terms of Service & Privacy Policy.</p>
            </motion.div>
          </motion.div>)}
      </AnimatePresence>
    </>);
}
