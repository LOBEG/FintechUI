'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
const faqs = [
    { q: 'What can I trade at Oakmont Digital Markets Group?', a: 'Oakmont Digital Markets Group operates as a full multi-asset brokerage. From a single verified account you can trade stocks, ETFs, indices, cryptocurrencies (BTC, ETH and 25+ majors), forex (G10 majors and crosses), commodities (silver, oil, natural gas, copper, grains), futures (CME E-mini index, FX and Treasury futures) and listed equity / ETF options.' },
    { q: 'Is Oakmont Digital Markets Group regulated?', a: 'Yes. Oakmont Digital Markets Group operates regulated entities under MiCA (EU), FCA (UK), MSB (US FinCEN), and DIFC. We comply with AML/CFT, the Travel Rule, MiFID II suitability and applicable consumer protection rules.' },
    { q: 'How are client assets secured?', a: 'Securities are held in segregated accounts with qualified custodians and SIPC-equivalent coverage where applicable. Digital assets use Fireblocks / BitGo MPC + multi-sig with ~95% in cold storage; hot wallets are insured for up to $250M.' },
    { q: 'What is the minimum to open a brokerage account?', a: 'Retail brokerage accounts start at $50. Institutional and managed-account services start at $250,000 and include a dedicated relationship manager, OMS/EMS integration and tailored execution.' },
    { q: 'Are spreads, commissions and execution real?', a: 'Yes - quotes shown on the brokerage and dashboard pages are live primary-exchange feeds. Orders are routed via our smart execution layer to the relevant venue (NYSE, NASDAQ, CME, CBOT, COMEX, NYMEX, ICE, Binance, top-tier FX ECNs).' },
    { q: 'Do you support API access?', a: 'Yes - Oakmont Digital Markets Group offers REST and FIX 4.4 APIs, WebSocket market data, and OMS/EMS integrations covering every asset class on the brokerage.' },
    { q: 'Do you support fiat on/off-ramps?', a: 'Yes - USD, EUR, GBP, AED, SGD via SWIFT, SEPA Instant, Faster Payments, and FedNow with same-day settlement for verified institutions.' },
    { q: 'How does the AI trading bot work?', a: 'Aurelia AI combines transformer and reinforcement-learning models with order-book microstructure and on-chain analytics. Users select asset class, risk profile, strategy and capital allocation; the bot operates inside the same account that holds your other assets.' },
];
export function FAQ() {
    const [open, setOpen] = useState(0);
    return (<section className="relative mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-20">
      <div className="text-center">
        <span className="chip bg-white/5 border border-white/10 text-white/80">FAQ</span>
        <h2 className="mt-4 text-3xl sm:text-4xl font-display">Questions, answered.</h2>
      </div>
      <div className="mt-10 space-y-3">
        {faqs.map((f, i) => {
            const isOpen = open === i;
            return (<div key={f.q} className="glass overflow-hidden">
              <button onClick={() => setOpen(isOpen ? null : i)} className="w-full flex items-center justify-between p-5 text-left">
                <span className="font-medium">{f.q}</span>
                <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180 text-neon-green' : 'text-white/60'}`}/>
              </button>
              <AnimatePresence initial={false}>
                {isOpen && (<motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}>
                    <p className="px-5 pb-5 text-sm text-white/65 leading-relaxed">{f.a}</p>
                  </motion.div>)}
              </AnimatePresence>
            </div>);
        })}
      </div>
    </section>);
}
