# AurumX — Luxury Digital Asset & Crypto Investment Platform

> **Platform name:** **AurumX** — registerable as `aurumx.io`, `aurumx.app`, `aurumx.finance`, `aurumx.trade`, `aurumxcapital.com`.
>
> *“BlackRock meets Binance.”* AurumX is a luxury, institutional-grade digital asset investment & trading platform for high-net-worth investors, family offices, corporate treasuries, and active traders.

A production-grade Next.js 14 (App Router) frontend with Tailwind CSS, Framer Motion, and a curated dark-luxury fintech aesthetic — black + deep navy with **neon green / orange** trading accents and **gold** institutional accents, glassmorphism cards, soft shadows, smooth animations, and a mobile-first responsive layout.

---

## ✨ What’s included

### 1. Landing page (`/`)
1. Hero with **animated SVG candlestick chart** & “Start Trading” / “Create Account” CTAs
2. **Live market ticker** marquee (BTC, ETH, SOL, XRP, BNB, ADA, DOGE, AVAX, DOT, MATIC)
3. **Statistics**: 24h volume, active users, AUC, supported markets
4. **AI Trading Bot** section (Aurelia AI) with live strategy cards
5. **Portfolio growth** section with donut allocation chart + performance KPIs
6. **Security & Compliance** (SOC 2, ISO 27001, MiCA, cold storage, MFA…)
7. **Testimonials** from institutional clients
8. **FAQ** with smooth expand/collapse
9. **Footer** with full social icons (Twitter, GitHub, LinkedIn, YouTube, Telegram, WhatsApp) and legal links

### 2. Trading dashboard (`/dashboard`)
- Sidebar navigation
- Wallet overview + total portfolio balance cards
- **TradingView-style animated candlestick chart**
- Buy / Sell trading panel (Market / Limit / Stop)
- Market watchlist with live sparklines
- **Open positions** table with side / size / entry / mark / PnL / ROE
- Transaction history
- Profit/loss analytics (bar chart + win rate + avg ROE)
- **Asset cards for BTC, ETH, SOL, XRP, USDT** with sparklines
- AI Bot strategies card
- Mobile floating action button + bottom nav

### 3. Admin panel (`/admin`)
- KPI cards
- **User management table** (id, name, email, tier, KYC, balance, status)
- **KYC verification queue** with approve / reject
- **Deposits & withdrawals** monitoring table
- **Support ticket system**
- **Analytics charts** (revenue, wallet hot/cold split)
- **Revenue statistics** breakdown
- **Wallet management** (hot vs cold custody)
- **Fraud alerts system** with risk scores

### 4. Institutional investor portal (`/investor`)
- AUM & performance KPIs
- Portfolio performance chart
- Strategic allocation (donut)
- **Managed accounts** & strategies table
- **AI Trading Intelligence**, **Risk Management**, **Secure KYC/AML onboarding** panels
- **Client reporting center** with downloadable reports

### 5. Market Insights (`/insights`)
- Research feed (Macro · On-chain · Equities · DeFi)
- AI signals, daily briefings, macro calendar

### 6. Auth (`/login`, `/signup`)
- Email + password forms with Google / Apple + Web3 wallet connect

### 7. Global widgets (every page)
- **Aurelia AI chat widget** (floating, bottom-left)
- **Telegram + WhatsApp support CTA buttons** (floating, bottom-right)
- Multi-language selector (8 languages)
- Dark / light mode toggle
- **Web3 wallet connect modal** (MetaMask, WalletConnect, Coinbase, Trust, Phantom, Ledger)
- Sticky responsive Navbar
- Mobile bottom navigation

---

## 🧱 Tech stack

- **Next.js 14** (App Router, React 18)
- **TypeScript** (strict)
- **Tailwind CSS** (custom theme: ink/gold/neon, glass utilities, marquee + float animations)
- **Framer Motion** (page & micro animations)
- **lucide-react** (icons)
- **next-themes** (dark/light)
- Custom **SVG charts** (candlestick, sparkline, donut, bar) — no runtime canvas dependency, swap-in compatible with ApexCharts or TradingView widgets later

> The chart components are intentionally implemented with pure SVG so the bundle is small and the design is fully customizable. They are drop-in replaceable with ApexCharts (`react-apexcharts`) or the TradingView Advanced Charts widget when API keys / licenses are configured.

---

## 🚀 Getting started

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # production build
npm run start    # serve production build
npm run lint     # eslint
```

### Routes

| Route        | Description                          |
| ------------ | ------------------------------------ |
| `/`          | Landing page                         |
| `/dashboard` | Trading dashboard                    |
| `/admin`     | Admin console                        |
| `/investor`  | Institutional investor portal        |
| `/insights`  | Market insights & research           |
| `/login`     | Sign-in                              |
| `/signup`    | Account creation                     |

---

## 🎨 Design system (Tailwind tokens)

- `ink-950 … ink-600` — black / deep navy backgrounds
- `gold-50 … gold-700` — institutional gold accents
- `neon.green`, `neon.orange`, `neon.red` — trading accents
- Helpers: `.glass`, `.glass-strong`, `.glass-light`, `.btn-primary`, `.btn-gold`, `.btn-ghost`, `.btn-outline`, `.text-gradient-gold`, `.text-gradient-neon`, `.bg-grid`, `.marquee-track`

---

## 📱 Mobile

- Mobile-first layout, responsive at all breakpoints.
- Bottom navigation on mobile (Home / Trade / Wallet / Invest / Admin).
- Floating action button on the trading dashboard for quick trade.
- Floating Telegram + WhatsApp support buttons collapse to icons on small screens.

---

## 🔒 Telegram & WhatsApp support

Floating CTA buttons on every page link to `https://t.me/AurumXSupport` and `https://wa.me/15555550123` (replace with your real handles in `src/components/widgets/TelegramWhatsAppCTA.tsx`).

---

## 📸 About screenshots

This repository delivers the full **production-ready frontend code** for AurumX. Live screenshots can be generated locally by running `npm run dev` and capturing each route (`/`, `/dashboard`, `/admin`, `/investor`, `/insights`, `/login`, `/signup`) on desktop and mobile widths — or by deploying to Vercel for live previews.

---

## 📄 License

Proprietary © AurumX Capital Ltd. — UI scaffolding provided as-is for demonstration purposes.
