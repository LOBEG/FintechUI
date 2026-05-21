import './globals.css';
import { Providers } from './providers';
import { AIChatWidget } from '@/components/widgets/AIChatWidget';
import { SiteBanner } from '@/components/layout/SiteBanner';
import { AppBackground } from '@/components/layout/AppBackground';
import { I18nProvider } from '@/components/I18nProvider';
import { NotificationsProvider } from '@/components/Notifications';
import { BRAND_DOMAIN, BRAND_NAME } from '@/lib/brand';
export const metadata = {
    metadataBase: new URL(`https://${BRAND_DOMAIN}`),
    title: `${BRAND_NAME} - Multi-Asset Brokerage & Investment Platform`,
    description: `${BRAND_NAME} is a fintech-grade multi-asset brokerage for live stocks, ETFs, indices, crypto, forex, commodities, futures and options market data, secure trading workflows, managed account servicing, compliance controls, and transparent client reporting.`,
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
        BRAND_NAME,
        'Oakmont Digital Markets Group brokerage',
        'Oakmont Digital Markets Group trading',
        'Oakmont Digital Markets Group investment platform',
        'digital assets',
        'multi-asset',
        'institutional',
        'BTC',
        'ETH',
        'investment',
        'fintech',
    ],
    authors: [{ name: BRAND_NAME }],
    alternates: { canonical: '/' },
    manifest: '/site.webmanifest',
    icons: {
        icon: [{ url: '/image.png' }],
        shortcut: ['/image.png'],
        apple: [{ url: '/image.png' }],
    },
    openGraph: {
        title: `${BRAND_NAME} - Institutional Multi-Asset Brokerage`,
        description: 'Live stocks, ETFs, crypto, forex, commodities, futures and options access, secure account operations, managed portfolios, and reporting infrastructure for verified clients.',
        type: 'website',
        url: '/',
        siteName: BRAND_NAME,
        images: [{ url: '/image.png', alt: `${BRAND_NAME} logo` }],
    },
    twitter: {
        card: 'summary_large_image',
        title: `${BRAND_NAME} - Multi-Asset Brokerage`,
        description: `Search ${BRAND_NAME} to find the official live multi-asset brokerage and investment platform.`,
        images: ['/image.png'],
    },
};
export const viewport = {
    themeColor: '#04131c',
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
    viewportFit: 'cover',
};
export default function RootLayout({ children }) {
    return (<html lang="en" suppressHydrationWarning>
      <body className="min-h-screen font-sans antialiased text-white">
        <Providers>
          <I18nProvider>
            <NotificationsProvider>
              <AppBackground />
              <div className="relative z-10 min-h-screen">
                <SiteBanner />
                {children}
                <AIChatWidget />
              </div>
            </NotificationsProvider>
          </I18nProvider>
        </Providers>
      </body>
    </html>);
}
