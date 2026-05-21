'use client';
import { useState } from 'react';
import { Bot, Send, X, Sparkles } from 'lucide-react';
import { motion, AnimatePresence, useDragControls } from 'framer-motion';
const seed = [
    { role: 'ai', text: 'Hi, I’m Oakmont Intelligence, Oakmont Digital Markets Group’s markets intelligence assistant. Ask me about crypto investing, trading order types, risk management, portfolio allocation, deposits, withdrawals, or how to start safely on Oakmont Digital Markets Group.' },
];
const investmentKnowledge = [
    {
        keywords: ['start', 'begin', 'new', 'account', 'signup', 'sign up', 'login', 'create'],
        text: 'To start on Oakmont Digital Markets Group, create an account or sign in first. New users can review public live markets, but investing, selling, wallet funding, watchlists, and trading controls unlock only after secure authentication. Start small, verify your account details, and review risk before placing any order.',
    },
    {
        keywords: ['invest', 'investment', 'portfolio', 'allocate', 'allocation'],
        text: 'A sound crypto investment plan starts with clear objectives, time horizon, risk tolerance, and position sizing. Many investors use diversified allocation across core assets such as BTC/ETH, stablecoins for liquidity, and smaller satellite positions only when they understand the volatility. Oakmont Digital Markets Group keeps execution and portfolio records inside the signed-in account experience.',
    },
    {
        keywords: ['trade', 'trading', 'buy', 'sell', 'execute', 'execution'],
        text: 'Trading is different from long-term investing: define your entry, exit, invalidation level, and maximum loss before placing a buy or sell. On Oakmont Digital Markets Group, public users can study the market first, while authenticated users get the complete trade ticket, selected asset context, balances, order controls, and account records.',
    },
    {
        keywords: ['market', 'limit', 'stop', 'order type', 'order'],
        text: 'Market orders prioritise immediate execution at the best available price. Limit orders execute only at your chosen price or better. Stop orders help trigger an action after a selected price level is reached. New traders should understand slippage, liquidity, and fees before choosing an order type.',
    },
    {
        keywords: ['risk', 'loss', 'safe', 'safety', 'protect', 'volatility'],
        text: 'Crypto markets are volatile, so risk management is essential. Consider limiting risk per trade, avoiding overconcentration, keeping liquidity in stable assets, using stop levels where appropriate, and never investing funds you cannot afford to lose. I can explain concepts, but I do not provide personalised financial advice.',
    },
    {
        keywords: ['dca', 'dollar cost', 'average'],
        text: 'Dollar-cost averaging spreads purchases across time instead of investing everything at once. It can reduce timing pressure in volatile markets, but it does not remove downside risk. Oakmont Digital Markets Group presents DCA as an account-based strategy workflow so users can monitor allocation and execution history after signing in.',
    },
    {
        keywords: ['btc', 'bitcoin'],
        text: 'Bitcoin is commonly treated as the core crypto asset because of its liquidity, market depth, fixed issuance schedule, and institutional adoption. Traders still need to monitor volatility, macro catalysts, support/resistance zones, and position size before investing or trading BTC.',
    },
    {
        keywords: ['eth', 'ethereum'],
        text: 'Ethereum is widely used for smart contracts, DeFi, tokenisation, and staking ecosystems. ETH exposure can behave differently from BTC because network usage, gas fees, protocol upgrades, and application activity can influence demand.',
    },
    {
        keywords: ['stablecoin', 'usdt', 'usdc', 'cash'],
        text: 'Stablecoins such as USDT and USDC are often used as trading quote assets and liquidity buffers. They can help investors wait for opportunities, manage risk, or settle trades, but users should still understand issuer, chain, and transfer risks.',
    },
    {
        keywords: ['deposit', 'withdraw', 'wallet', 'connect'],
        text: 'Wallet and funding actions should happen only inside a secure authenticated account. When you choose a wallet from the landing page, Oakmont Digital Markets Group routes you to sign in or create an account first so deposits, withdrawals, addresses, and records stay tied to your profile.',
    },
    {
        keywords: ['fee', 'fees', 'spread', 'slippage'],
        text: 'Always account for trading fees, spread, and slippage. A quoted market price can differ from execution during fast moves or thin liquidity. Review the order value and estimated fee before confirming a trade inside your account.',
    },
    {
        keywords: ['strategy', 'strategies', 'bot', 'signal', 'intelligence'],
        text: 'Oakmont Intelligence can explain strategy concepts such as DCA, momentum monitoring, rebalancing, stop discipline, and portfolio guardrails. Treat market signals as decision support, not a guarantee. Final investment decisions should be based on your objectives, risk capacity, and verified account data.',
    },
];
const fallbackReplies = [
    'I can help with crypto investing, trading order types, asset selection, wallet funding, risk management, portfolio allocation, and how Oakmont Digital Markets Group routes account-only actions. Tell me the asset or trading concept you want to understand.',
    'For fintech-standard safety, Oakmont Digital Markets Group lets public users review markets first, then routes investing, selling, trading, and wallet actions through secure sign-in or account creation. Ask me about market, limit, stop, DCA, portfolio risk, or a specific asset.',
    'A good trading question includes the asset, time horizon, risk limit, and order type you are considering. I can explain the framework and risks, but I cannot guarantee returns or provide personalised financial advice.',
];

function getOakmontReply(input) {
    const q = input.toLowerCase();
    const topic = investmentKnowledge.find((item) => item.keywords.some((keyword) => q.includes(keyword)));
    if (topic) return topic.text;
    return fallbackReplies[Math.floor(Math.random() * fallbackReplies.length)];
}
export function AIChatWidget() {
    const [open, setOpen] = useState(false);
    const [input, setInput] = useState('');
    const [msgs, setMsgs] = useState(seed);
    const dragControls = useDragControls();
    const send = () => {
        if (!input.trim())
            return;
        const question = input.trim();
        const user = { role: 'user', text: question };
        const ai = { role: 'ai', text: getOakmontReply(question) };
        setMsgs((m) => [...m, user]);
        setInput('');
        setTimeout(() => setMsgs((m) => [...m, ai]), 600);
    };
    return (<>
      <AnimatePresence>
        {open && (<motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setOpen(false)} className="fixed inset-0 bg-ink-950/45 backdrop-blur-sm z-[55]" aria-label="Close markets assistant"/>)}
      </AnimatePresence>
      <motion.button drag dragMomentum={false} dragElastic={0.08} onClick={() => setOpen(!open)} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} whileHover={{ scale: 1.05 }} whileDrag={{ scale: 1.08 }} className="fixed bottom-5 left-5 z-[60] h-14 w-14 rounded-full bg-gradient-primary shadow-glow flex items-center justify-center text-ink-950 cursor-grab active:cursor-grabbing touch-none" aria-label="Open markets assistant">
        {open ? <X className="h-6 w-6"/> : <Bot className="h-6 w-6"/>}
      </motion.button>
      <AnimatePresence>
        {open && (<motion.div drag dragListener={false} dragControls={dragControls} dragMomentum={false} initial={{ opacity: 0, y: 20, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 20, scale: 0.95 }} className="fixed bottom-24 left-4 right-4 lg:left-5 lg:right-auto z-[60] w-[calc(100vw-2rem)] max-w-md lg:w-96 bg-navy-900 border border-blue-500/20 shadow-[0_30px_90px_rgba(0,0,0,0.55)] rounded-2xl overflow-hidden flex flex-col h-[70vh] lg:h-[480px]">
            <div onPointerDown={(event) => dragControls.start(event)} className="px-4 py-3 border-b border-white/10 flex items-center gap-2 cursor-move select-none touch-none">
              <span className="h-8 w-8 rounded-lg bg-gradient-primary inline-flex items-center justify-center text-ink-950">
                <Sparkles className="h-4 w-4"/>
              </span>
              <div>
                <p className="text-sm font-semibold">Oakmont Intelligence</p>
                <p className="text-[11px] text-white/50">Drag this panel anywhere</p>
              </div>
              <span className="ml-auto chip bg-accent-success/15 text-accent-success border border-accent-success/30">● Online</span>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-2 no-scrollbar">
              {msgs.map((m, i) => (<div key={i} className={m.role === 'user'
                    ? 'ml-auto max-w-[80%] px-3 py-2 rounded-2xl rounded-br-md bg-accent-success text-ink-950 text-sm'
                    : 'mr-auto max-w-[85%] px-3 py-2 rounded-2xl rounded-bl-md bg-white/5 border border-white/10 text-sm text-white/90'}>
                  {m.text}
                </div>))}
            </div>
            <div className="p-3 border-t border-white/10 flex gap-2">
              <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && send()} placeholder="Ask Oakmont…" className="flex-1 bg-ink-950/70 border border-blue-500/20 rounded-xl px-3 py-2 text-sm text-white placeholder:text-white/45 outline-none focus:border-cyan focus:ring-2 focus:ring-cyan/15"/>
              <button onClick={send} className="btn-primary !px-3 !py-2"><Send className="h-4 w-4"/></button>
            </div>
          </motion.div>)}
      </AnimatePresence>
    </>);
}
