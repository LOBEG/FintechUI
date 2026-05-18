# AurumX — Luxury Digital Asset & Crypto Investment Platform

> **Platform name:** **AurumX** — registerable as `aurumx.io`, `aurumx.app`, `aurumx.finance`, `aurumx.trade`, `aurumxcapital.com`.
>
> *“BlackRock meets Binance.”* AurumX is a luxury, institutional-grade digital asset investment & trading platform for high-net-worth investors, family offices, corporate treasuries, and active traders.

A production-grade Next.js 15 (App Router) frontend with Tailwind CSS, Framer Motion, and a curated dark-luxury fintech aesthetic — black + deep navy with **neon green / orange** trading accents and **gold** institutional accents, glassmorphism cards, soft shadows, smooth animations, and a mobile-first responsive layout.

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

- **Next.js 15** (App Router, React 18) — **pure JavaScript (no TypeScript)**
- **Tailwind CSS** (custom theme: ink/gold/neon, glass utilities, marquee + float animations)
- **Framer Motion** (page & micro animations)
- **lucide-react** (icons)
- **next-themes** (dark/light)
- Custom **SVG charts** (candlestick, sparkline, donut, bar) — no runtime canvas dependency, swap-in compatible with ApexCharts or TradingView widgets later
- **Real-time data** via Binance public REST + WebSocket (no API key required) — see `src/lib/useLiveData.js`

> The chart components are intentionally implemented with pure SVG so the bundle is small and the design is fully customizable. They are drop-in replaceable with ApexCharts (`react-apexcharts`) or the TradingView Advanced Charts widget when API keys / licenses are configured.

---

## 📡 Real-time market data

Everything price-related on AurumX is **live, not mocked**. We use the public Binance Spot APIs (no API key required):

| Source | Endpoint | Used by |
| --- | --- | --- |
| REST snapshot | `GET https://api.binance.com/api/v3/ticker/24hr?symbols=[...]` | Market ticker, watchlist, asset cards, wallet valuations, positions (on load) |
| Live WebSocket | `wss://stream.binance.com:9443/stream?streams=<sym>@ticker/...` | Continuous 24h ticker updates (price, %, high, low, vol) |
| Klines REST | `GET /api/v3/klines?symbol=BTCUSDT&interval=5m&limit=80` | Candlestick chart history (hero + dashboard) |
| Klines WebSocket | `wss://stream.binance.com:9443/ws/<sym>@kline_<interval>` | Live candle updates (current candle ticks, new candle on close) |

The hooks live in `src/lib/useLiveData.js`:

```js
import { useLivePrices, useLiveKlines, DEFAULT_TICKER_SYMBOLS } from '@/lib/useLiveData';

const prices  = useLivePrices(['BTCUSDT', 'ETHUSDT', 'SOLUSDT']);
const candles = useLiveKlines('BTCUSDT', '5m', 80);
```

Both hooks ship with seed values so the UI renders instantly during SSR / first paint and then upgrades to live data once the WebSocket connects. If the connection ever drops the seed values keep the screen usable.

---

## 🚀 Getting started

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # production build
npm run start    # serve production build (honours $PORT)
npm run lint     # eslint
```

### Routes

| Route        | Description                          |
| ------------ | ------------------------------------ |
| `/`          | Landing page                         |
| `/dashboard` | Trading dashboard (live BTC/USDT)    |
| `/admin`     | Admin console                        |
| `/investor`  | Institutional investor portal        |
| `/insights`  | Market insights & research           |
| `/login`     | Sign-in                              |
| `/signup`    | Account creation                     |

---

## 🚂 Deploy to Railway

This repository is configured for **Railway** out of the box:

- `railway.json` — Nixpacks builder, health-check on `/`, auto-restart on failure
- `nixpacks.toml` — pins Node 20, runs `npm ci && npm run build`
- `Procfile` — `web: npm run start`
- `package.json` `start` script binds to `0.0.0.0:$PORT` (Railway sets `$PORT` automatically)

### One-time setup

1. Create a new project on [railway.app](https://railway.app) and connect this GitHub repo.
2. Railway will auto-detect Node + Next.js via Nixpacks.
3. **Attach a Railway Volume** mounted at `/data` (this is where AurumX stores users, transactions, withdrawal tokens, and the email outbox — without a volume the data is lost on every redeploy). Then set `DATA_DIR=/data` in **Variables**.
4. Set the rest of the env vars below.
5. Click **Deploy** — Railway will run `npm ci && npm run build`, then `npm run start`.

### Environment variables

| Variable | Required | Purpose |
| --- | --- | --- |
| `DATA_DIR` | yes (prod) | Path to the writable volume (e.g. `/data`). Defaults to `./data` in dev. |
| `SESSION_SECRET` | yes (prod) | 32+ char random string used to HMAC-sign session cookies. |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | yes | Auto-bootstraps an admin account on first login. |
| `APP_URL` | recommended | Public URL used in email CTAs (e.g. `https://aurumx.app`). |
| `SMTP_HOST` `SMTP_PORT` `SMTP_USER` `SMTP_PASS` `SMTP_SECURE` `EMAIL_FROM` | optional | If set, deposit / withdrawal / token / invest emails are delivered via SMTP. If unset, every email is still written to the **outbox** at `data/outbox.json` so you can verify what was sent. |
| `TELEGRAM_BOT_TOKEN` | optional | BotFather token for the admin Telegram bot. |
| `TELEGRAM_WEBHOOK_SECRET` | optional | Random string Telegram echoes back in the `X-Telegram-Bot-Api-Secret-Token` header. |
| `TELEGRAM_ADMIN_CHAT_IDS` | optional | Comma-separated Telegram chat IDs that are allowed to send admin commands. |

### CLI alternative

```bash
npm i -g @railway/cli
railway login
railway init
railway up
```

The first build takes ~2-3 minutes. After it goes live, attach a custom domain (e.g. `aurumx.app`) from the Railway dashboard.

---

## 💵 How users invest, deposit & withdraw

AurumX persists real account state on the server — users, balances, transactions, and admin-issued withdrawal tokens — all stored as JSON in `$DATA_DIR` (Railway volume in production).

### Invest in any crypto

1. User signs in and clicks **Invest** on `/dashboard`.
2. They pick an asset (BTC, ETH, SOL, XRP, BNB, ADA, DOGE, AVAX, LINK, LTC, TRX, DOT, MATIC) and a USD amount.
3. AurumX fetches the **live Binance price** server-side, debits the user's USDT balance, credits the crypto, records a `tx` entry, and emails the user a branded confirmation showing the exact crypto amount + USD value + fill price.

### Deposit (admin-credited)

1. Off-ramp / wire is received externally.
2. An admin signs in to `/admin` and uses **Live admin operations → Credit deposit**, *or* sends `/credit alice@example.com BTC 0.05 "wire #4421"` to the Telegram bot.
3. AurumX credits the user, records a `tx`, and emails the user with the asset, crypto amount, indicative USD value, and timestamp.

### Withdraw (token-gated)

Every withdrawal must be authorised by a one-time token that **only admins can issue**:

1. User requests a withdrawal in-app or via the Telegram support button.
2. An admin opens `/admin` → **Issue token** (or runs `/issue_token alice@example.com BTC 0.5` in Telegram). The token can be unrestricted or scoped to a specific symbol and max amount.
3. AurumX emails the token to the user.
4. The user opens **Withdraw** on `/dashboard`, fills in symbol / amount / destination address, pastes the token, and submits.
5. AurumX validates the token (status, owner, symbol scope, max amount), debits the crypto, marks the token `used`, records a `tx`, and emails the user a branded withdrawal confirmation.

The same token can never be reused. Admins can revoke active tokens at any time from `/admin` or via `/revoke <code>` in Telegram.

---

## 🤖 Telegram admin bot

The bot lets admins run the platform end-to-end from Telegram — no need to open the dashboard for routine operations.

### Setup

1. Create a bot with [@BotFather](https://t.me/BotFather) → copy the token into `TELEGRAM_BOT_TOKEN`.
2. Generate a random string and put it in `TELEGRAM_WEBHOOK_SECRET`.
3. Get your Telegram chat ID (DM [@userinfobot](https://t.me/userinfobot)). Put it in `TELEGRAM_ADMIN_CHAT_IDS` (comma-separated for multiple admins).
4. After deploy, register the webhook with Telegram:

```bash
curl -X POST "https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/setWebhook" \
  -d "url=https://<your-railway-domain>/api/telegram/webhook" \
  -d "secret_token=$TELEGRAM_WEBHOOK_SECRET"
```

5. Send `/start` to your bot. The webhook verifies the secret header and that your chat ID is in `TELEGRAM_ADMIN_CHAT_IDS` before executing any command.

### Available commands

| Command | What it does |
| --- | --- |
| `/start` `/help` | Show this command list |
| `/status` | Site stats: users, transactions, active tokens, toggles, banner |
| `/users` | List registered users |
| `/balance <email>` | Show a user's crypto balances |
| `/credit <email> <SYM> <amount> [note]` | Credit a user with a deposit (real-time live price snapshot stored; email sent to user) |
| `/issue_token <email> [SYM] [maxAmount]` | Issue a single-use withdrawal authorisation token (emails the user) |
| `/tokens` | List all currently active withdrawal tokens |
| `/revoke <code>` | Revoke an active token |
| `/tx [n]` | Show the last *n* transactions across the platform |
| `/maintenance on\|off` | Toggle site-wide maintenance banner |
| `/withdrawals on\|off` | Globally enable / disable withdrawals |
| `/signups on\|off` | Globally enable / disable new signups |
| `/banner <text>` (or `clear`) | Set a gold notice banner on every page |
| `/broadcast <text>` | Push a real-time notice to the site (read via `/api/settings`) |

Toggles take effect within seconds — the `<SiteBanner />` component polls `/api/settings` every 15s and the API routes themselves read settings on every request, so `/maintenance on` instantly blocks withdrawals across the platform.

---

## 🔌 API reference

All endpoints are JSON. Auth is via HMAC-signed `aurumx_session` cookie (scrypt-hashed passwords on the server).

### Public

- `POST /api/auth/signup` — `{ email, password, name? }`
- `POST /api/auth/login` — `{ email, password }`
- `POST /api/auth/logout`
- `GET  /api/auth/me`
- `GET  /api/settings` — `{ maintenanceMode, banner, withdrawalsEnabled, signupsEnabled, broadcasts }`

### Authenticated user

- `GET  /api/wallet` — balances + breakdown (with live USD values) + recent transactions
- `GET  /api/transactions`
- `POST /api/invest` — `{ symbol, usdAmount }` — debits USDT, credits crypto at live price, emails user
- `POST /api/withdraw` — `{ symbol, amount, token, address? }` — requires admin-issued token, debits crypto, marks token used, emails user

### Admin only

- `GET  /api/admin/users`
- `GET  /api/admin/transactions`
- `POST /api/admin/credit` — `{ email, symbol, amount, note? }` — credits a user (= deposit) and emails them
- `GET  /api/admin/tokens` — list all withdrawal tokens
- `POST /api/admin/tokens` — `{ email?, symbol?, maxAmount? }` — issue a token (emails the user if email is bound)
- `DELETE /api/admin/tokens` — `{ id }` — revoke a token

### Telegram

- `POST /api/telegram/webhook` — Telegram webhook (secret-token guarded)
- `GET  /api/telegram/webhook` — health (returns whether the bot is configured)

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
- Floating action button on the trading dashboard for quick invest.
- Floating Telegram + WhatsApp support buttons collapse to icons on small screens.

---

## 🔒 Telegram & WhatsApp support CTA

Floating CTA buttons on every page link to `https://t.me/AurumXSupport` and `https://wa.me/15555550123` (replace with your real handles in `src/components/widgets/TelegramWhatsAppCTA.jsx`).

---

## 📸 About screenshots

This repository delivers the full **production-ready frontend & backend code** for AurumX. Live screenshots can be generated locally by running `npm run dev` and capturing each route (`/`, `/dashboard`, `/admin`, `/investor`, `/insights`, `/login`, `/signup`) on desktop and mobile widths — or by deploying to Railway for a live preview.

---

## 📄 License

Proprietary © AurumX Capital Ltd. — UI scaffolding provided as-is for demonstration purposes.
