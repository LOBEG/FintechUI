import './globals.css';
import { Providers } from './providers';
import { AIChatWidget } from '@/components/widgets/AIChatWidget';
import { SiteBanner } from '@/components/layout/SiteBanner';
import { AppBackground } from '@/components/layout/AppBackground';
import { I18nProvider } from '@/components/I18nProvider';
export const metadata = {
    title: 'Oakmont Digital Capital Group - Institutional Digital Asset & Crypto Investment Platform',
    description: 'Oakmont Digital Capital Group is a fintech-grade digital asset platform for live crypto market data, secure trading workflows, managed account servicing, compliance controls, and transparent client reporting.',
    keywords: [
        'crypto',
        'trading',
        'Oakmont Digital Capital Group',
        'digital assets',
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
        title: 'Oakmont Digital Capital Group - Institutional Digital Asset Platform',
        description: 'Live crypto market access, secure account operations, managed digital asset portfolios, and reporting infrastructure for verified clients.',
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
            <SiteBanner />
            {children}
            <AIChatWidget />
          </I18nProvider>
        </Providers>
      </body>
    </html>);
}
