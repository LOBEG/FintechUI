'use client';
import { motion } from 'framer-motion';
import { Briefcase, ShieldCheck, FileText, TrendingUp, PieChart as PieIcon, Brain, Users, Building2, Gauge, } from 'lucide-react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { MobileBottomNav } from '@/components/layout/MobileBottomNav';
import { BarChart, DonutChart, Sparkline } from '@/components/ui/Charts';
import { formatUSD } from '@/lib/utils';
const accounts = [
    { name: 'Flagship Digital Alpha', strategy: 'Long/Short · AI', aum: 248000000, ytd: 38.4, sharpe: 2.31 },
    { name: 'Stable Yield', strategy: 'Stablecoin Yield', aum: 102000000, ytd: 9.8, sharpe: 4.12 },
    { name: 'Bitcoin Core', strategy: 'BTC-only Core', aum: 412000000, ytd: 52.7, sharpe: 1.84 },
    { name: 'Tokenized RWA', strategy: 'RWA Index', aum: 86000000, ytd: 7.2, sharpe: 3.05 },
];
const allocation = [
    { label: 'BTC', value: 38, color: '#f7931a' },
    { label: 'ETH', value: 24, color: '#627eea' },
    { label: 'RWA', value: 14, color: '#e6ad26' },
    { label: 'Stables', value: 16, color: '#26a17b' },
    { label: 'Alts', value: 8, color: '#ff8a00' },
];
function buildLiveReports() {
    const now = new Date();
    const currentYear = now.getFullYear();
    const previousYear = currentYear - 1;
    // Monthly NAV statements publish on the second calendar day after month end.
    const navPublicationDay = 2;
    const previousMonth = new Date(currentYear, now.getMonth() - 1, 1);
    const currentQuarter = Math.floor(now.getMonth() / 3) + 1;
    const fmt = (date) => date.toLocaleDateString(undefined, { month: 'short', day: '2-digit', year: 'numeric' });
    const monthName = previousMonth.toLocaleDateString(undefined, { month: 'long' });
    return [
        { name: `Q${currentQuarter} ${currentYear} Performance Report`, date: fmt(now), status: 'Current quarter' },
        { name: `${monthName} ${currentYear} NAV Statement`, date: fmt(new Date(currentYear, now.getMonth(), navPublicationDay)), status: 'Monthly NAV cycle' },
        { name: `Audited Financials FY ${previousYear}`, date: fmt(new Date(currentYear, 2, 22)), status: 'Current archive' },
        { name: `Risk & Compliance Disclosure ${currentYear}`, date: fmt(now), status: 'Daily risk cycle' },
    ];
}
export default function InvestorPortalPage() {
    const reports = buildLiveReports();
    return (<main className="pb-20 lg:pb-0">
      <Navbar />
      <section className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-12 pb-6">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <span className="chip bg-gold-500/15 text-gold-400 border border-gold-500/30">
            <Building2 className="h-3.5 w-3.5"/> Institutional Investor Portal
          </span>
          <h1 className="mt-4 text-3xl sm:text-4xl font-display">
            <span className="text-gradient-gold">AurumX</span> Asset Management
          </h1>
          <p className="mt-2 text-white/65 max-w-2xl">
            Private banking for digital assets. Custom mandates, managed strategies, and institutional reporting for family offices, treasuries, and qualified investors.
          </p>
        </motion.div>

        <div className="mt-8 grid lg:grid-cols-4 gap-4">
          {[
            { k: 'Total AUM', v: '$848M', icon: Briefcase, accent: 'text-gold-400' },
            { k: 'YTD Return', v: '+38.4%', icon: TrendingUp, accent: 'text-neon-green' },
            { k: 'Sharpe Ratio', v: '2.31', icon: Gauge, accent: 'text-neon-orange' },
            { k: 'Clients', v: '412', icon: Users, accent: 'text-white' },
        ].map((s) => {
            const Icon = s.icon;
            return (<div key={s.k} className="glass p-5">
                <div className="flex items-center justify-between">
                  <Icon className={`h-5 w-5 ${s.accent}`}/>
                  <Sparkline seed={s.k.length} positive/>
                </div>
                <p className="mt-4 text-2xl font-display">{s.v}</p>
                <p className="text-xs text-white/55">{s.k}</p>
              </div>);
        })}
        </div>
      </section>

      {/* Performance + Allocation */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 grid xl:grid-cols-3 gap-4">
        <div className="xl:col-span-2 glass-strong p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold">Portfolio performance</p>
              <p className="text-xs text-white/55">Cumulative monthly returns · last 15 months</p>
            </div>
            <span className="chip bg-neon-green/15 text-neon-green border border-neon-green/30">+38.4% YTD</span>
          </div>
          <BarChart data={[5, 9, 4, 12, 8, 15, 11, 18, 14, 22, 17, 26, 21, 29, 34]} color="#e6ad26" height={180}/>
        </div>
        <div className="glass-strong p-5">
          <p className="font-semibold">Strategic allocation</p>
          <div className="flex flex-col items-center mt-2">
            <DonutChart data={allocation} size={200}/>
            <div className="mt-4 grid grid-cols-2 gap-x-6 gap-y-1.5 w-full text-xs">
              {allocation.map((a) => (<div key={a.label} className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ background: a.color }}/>
                  {a.label}
                  <span className="ml-auto">{a.value}%</span>
                </div>))}
            </div>
          </div>
        </div>
      </section>

      {/* Managed accounts */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mt-6">
        <div className="glass-strong p-5 overflow-hidden">
          <div className="flex items-center justify-between">
            <p className="font-semibold">Managed accounts & strategies</p>
            <button className="btn-outline text-sm">Request mandate</button>
          </div>
          <div className="mt-3 overflow-x-auto -mx-4 px-4">
            <table className="min-w-full text-sm">
              <thead className="text-xs text-white/50 text-left">
                <tr>
                  <th className="py-2 font-medium">Strategy</th>
                  <th className="py-2 font-medium">Type</th>
                  <th className="py-2 font-medium">AUM</th>
                  <th className="py-2 font-medium">YTD</th>
                  <th className="py-2 font-medium">Sharpe</th>
                  <th className="py-2"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {accounts.map((a) => (<tr key={a.name}>
                    <td className="py-2.5 font-medium">{a.name}</td>
                    <td className="text-white/70">{a.strategy}</td>
                    <td>{formatUSD(a.aum, 0)}</td>
                    <td className="text-neon-green">+{a.ytd}%</td>
                    <td>{a.sharpe}</td>
                    <td className="text-right">
                      <button className="text-xs px-2 py-1 rounded bg-white/5 border border-white/10 hover:bg-white/10">Allocate</button>
                    </td>
                  </tr>))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* AI intelligence + Risk + KYC */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mt-6 grid lg:grid-cols-3 gap-4">
        <div className="glass-strong p-5">
          <Brain className="h-6 w-6 text-neon-green"/>
          <p className="font-semibold mt-3">AI Trading Intelligence</p>
          <p className="text-sm text-white/65 mt-1">
            Aurelia AI delivers proprietary signals, regime detection, and adaptive risk overlays sourced from 200+ on-chain & off-chain datasets.
          </p>
          <ul className="mt-3 text-sm text-white/70 space-y-1.5">
            <li>• Regime detection: <span className="text-neon-green">Risk-On</span></li>
            <li>• Macro signal: <span className="text-gold-400">Constructive</span></li>
            <li>• Liquidity score: <span className="text-white">8.2 / 10</span></li>
          </ul>
        </div>
        <div className="glass-strong p-5">
          <PieIcon className="h-6 w-6 text-gold-400"/>
          <p className="font-semibold mt-3">Risk management</p>
          <p className="text-sm text-white/65 mt-1">
            Stress tests, VaR (95%), drawdown analytics, scenario simulation, and concentration limits — reviewed daily by the risk committee.
          </p>
          <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
            <div className="glass-light p-2 text-center"><p className="text-white/50">VaR (1d)</p><p className="font-semibold">-2.1%</p></div>
            <div className="glass-light p-2 text-center"><p className="text-white/50">Beta · BTC</p><p className="font-semibold">0.62</p></div>
            <div className="glass-light p-2 text-center"><p className="text-white/50">Drawdown</p><p className="font-semibold">-7.4%</p></div>
          </div>
        </div>
        <div className="glass-strong p-5">
          <ShieldCheck className="h-6 w-6 text-neon-orange"/>
          <p className="font-semibold mt-3">Secure onboarding · KYC/AML</p>
          <p className="text-sm text-white/65 mt-1">
            White-glove onboarding for institutions. Document collection, UBO verification, source-of-funds, and Chainalysis screening — done in 48 hours.
          </p>
          <div className="mt-3 space-y-2">
            {[
            'Entity verification & UBO',
            'Source of wealth/funds review',
            'Sanctions & PEP screening',
            'Travel Rule compliance',
        ].map((s) => (<p key={s} className="text-xs text-white/70 flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-neon-green"/> {s}
              </p>))}
          </div>
        </div>
      </section>

      {/* Client reporting */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mt-6 mb-12">
        <div className="glass-strong p-5">
          <div className="flex items-center justify-between">
            <p className="font-semibold flex items-center gap-2"><FileText className="h-4 w-4"/> Client reporting center</p>
            <button className="text-xs text-neon-green hover:underline">Subscribe to monthly NAV</button>
          </div>
          <div className="mt-3 divide-y divide-white/5">
            {reports.map((r) => (<div key={r.name} className="py-2.5 flex items-center gap-3">
                <FileText className="h-4 w-4 text-gold-400"/>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{r.name}</p>
                  <p className="text-[11px] text-white/55">{r.date} · {r.status}</p>
                </div>
              </div>))}
          </div>
        </div>
      </section>

      <Footer />
      <MobileBottomNav />
    </main>);
}
