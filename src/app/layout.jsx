import './globals.css';
import { Providers } from './providers';
import { AIChatWidget } from '@/components/widgets/AIChatWidget';
import { SiteBanner } from '@/components/layout/SiteBanner';
import { AppBackground } from '@/components/layout/AppBackground';
import { I18nProvider } from '@/components/I18nProvider';
export const metadata = {
    title: 'Oakmont Digital Capital Group - Multi-Asset Brokerage & Investment Platform',
    description: 'Oakmont Digital Capital Group is a fintech-grade multi-asset brokerage for live stocks, ETFs, indices, crypto, forex, commodities, futures and options market data, secure trading workflows, managed account servicing, compliance controls, and transparent client reporting.',
    keywords: [
        'brokerage',
        'stocks',
        'ETFs',
        'crypto',
        'forex',
        'commodities',
        'futures',
        'options',
        'trading',
        'Oakmont Digital Capital Group',
        'digital assets',
        'multi-asset',
        'institutional',
        'BTC',
        'ETH',
        'investment',
        'fintech',
    ],
    authors: [{ name: 'Oakmont Digital Capital Group' }],
    manifest: '/site.webmanifest',
    icons: {
        icon: [{ url: '/icon.svg', type: 'image/svg+xml' }],
        shortcut: ['/icon.svg'],
        apple: [{ url: '/apple-icon.svg', sizes: '180x180', type: 'image/svg+xml' }],
    },
    openGraph: {
        title: 'Oakmont Digital Capital Group - Institutional Multi-Asset Brokerage',
        description: 'Live stocks, ETFs, crypto, forex, commodities, futures and options access, secure account operations, managed portfolios, and reporting infrastructure for verified clients.',
        type: 'website',
    },
};
export const viewport = {
    themeColor: '#05070d',
    width: 'device-width',
    initialScale: 1,
    maximumScale: 5,
    viewportFit: 'cover',
};
export default function RootLayout({ children }) {
    return (<html lang="en" suppressHydrationWarning>
      <body className="min-h-screen font-sans antialiased text-white">
        <Providers>
          <I18nProvider>
            <AppBackground />
            <div className="relative z-10 min-h-screen">
              <SiteBanner />
              {children}
              <AIChatWidget />
            </div>
          </I18nProvider>
        </Providers>
      </body>
    </html>);
}
