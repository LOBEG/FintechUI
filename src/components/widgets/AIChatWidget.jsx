'use client';
import { useState } from 'react';
import { Bot, Send, X, Sparkles } from 'lucide-react';
import { motion, AnimatePresence, useDragControls } from 'framer-motion';
const seed = [
    { role: 'ai', text: 'Hi, I’m Aurelia, AurumX’s AI trading assistant. Ask me anything about markets, your portfolio, or strategies.' },
];
const cannedReplies = [
    'Based on current momentum, BTC looks bullish above 70k. I’d watch the 72.4k resistance.',
    'Your portfolio risk score is 4/10 (moderate). Consider rebalancing 5% from SOL into stablecoins.',
    'ETH on-chain volume is up 14% week-over-week, with accumulation still visible.',
    'Try our AI Grid Bot on SOL/USDT. The latest 30-day backtest shows +6.4%.',
];
export function AIChatWidget() {
    const [open, setOpen] = useState(false);
    const [input, setInput] = useState('');
    const [msgs, setMsgs] = useState(seed);
    const dragControls = useDragControls();
    const send = () => {
        if (!input.trim())
            return;
        const user = { role: 'user', text: input };
        const ai = { role: 'ai', text: cannedReplies[Math.floor(Math.random() * cannedReplies.length)] };
        setMsgs((m) => [...m, user]);
        setInput('');
        setTimeout(() => setMsgs((m) => [...m, ai]), 600);
    };
    return (<>
      <AnimatePresence>
        {open && (<motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setOpen(false)} className="fixed inset-0 bg-ink-950/45 backdrop-blur-sm z-[55]" aria-label="Close AI Assistant"/>)}
      </AnimatePresence>
      <motion.button drag dragMomentum={false} dragElastic={0.08} onClick={() => setOpen(!open)} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} whileHover={{ scale: 1.05 }} whileDrag={{ scale: 1.08 }} className="fixed bottom-5 left-5 z-[60] h-14 w-14 rounded-full bg-neon-grad shadow-glow flex items-center justify-center text-ink-950 cursor-grab active:cursor-grabbing touch-none" aria-label="Open AI Assistant">
        {open ? <X className="h-6 w-6"/> : <Bot className="h-6 w-6"/>}
      </motion.button>
      <AnimatePresence>
        {open && (<motion.div drag dragListener={false} dragControls={dragControls} dragMomentum={false} initial={{ opacity: 0, y: 20, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 20, scale: 0.95 }} className="fixed bottom-24 left-4 right-4 lg:left-5 lg:right-auto z-[60] w-[calc(100vw-2rem)] max-w-md lg:w-96 bg-navy-900 border border-cyan/20 shadow-[0_30px_90px_rgba(0,0,0,0.55)] rounded-2xl overflow-hidden flex flex-col h-[70vh] lg:h-[480px]">
            <div onPointerDown={(event) => dragControls.start(event)} className="px-4 py-3 border-b border-white/10 flex items-center gap-2 cursor-move select-none touch-none">
              <span className="h-8 w-8 rounded-lg bg-neon-grad inline-flex items-center justify-center text-ink-950">
                <Sparkles className="h-4 w-4"/>
              </span>
              <div>
                <p className="text-sm font-semibold">Aurelia AI</p>
                <p className="text-[11px] text-white/50">Drag this panel anywhere</p>
              </div>
              <span className="ml-auto chip bg-neon-green/15 text-neon-green border border-neon-green/30">● Online</span>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-2 no-scrollbar">
              {msgs.map((m, i) => (<div key={i} className={m.role === 'user'
                    ? 'ml-auto max-w-[80%] px-3 py-2 rounded-2xl rounded-br-md bg-neon-green text-ink-950 text-sm'
                    : 'mr-auto max-w-[85%] px-3 py-2 rounded-2xl rounded-bl-md bg-white/5 border border-white/10 text-sm text-white/90'}>
                  {m.text}
                </div>))}
            </div>
            <div className="p-3 border-t border-white/10 flex gap-2">
              <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && send()} placeholder="Ask Aurelia…" className="flex-1 bg-ink-950/70 border border-cyan/20 rounded-xl px-3 py-2 text-sm text-white placeholder:text-white/45 outline-none focus:border-cyan focus:ring-2 focus:ring-cyan/15"/>
              <button onClick={send} className="btn-primary !px-3 !py-2"><Send className="h-4 w-4"/></button>
            </div>
          </motion.div>)}
      </AnimatePresence>
    </>);
}
