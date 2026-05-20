import './globals.css';
import { Providers } from './providers';
import { TelegramWhatsAppCTA } from '@/components/widgets/TelegramWhatsAppCTA';
import { AIChatWidget } from '@/components/widgets/AIChatWidget';
import { SiteBanner } from '@/components/layout/SiteBanner';
export const metadata = {
    title: 'AurumX - Institutional Digital Asset & Crypto Investment Platform',
    description: 'AurumX is a fintech-grade digital asset platform for live crypto market data, secure trading workflows, managed account servicing, compliance controls, and transparent client reporting.',
    keywords: [
        'crypto',
        'trading',
        'AurumX',
        'digital assets',
        'institutional',
        'BTC',
        'ETH',
        'investment',
        'fintech',
    ],
    authors: [{ name: 'AurumX' }],
    manifest: '/site.webmanifest',
    icons: {
        icon: [{ url: '/icon.svg', type: 'image/svg+xml' }],
        shortcut: ['/icon.svg'],
        apple: [{ url: '/apple-icon.svg', sizes: '180x180', type: 'image/svg+xml' }],
    },
    openGraph: {
        title: 'AurumX - Institutional Digital Asset Platform',
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
          <SiteBanner />
          {children}
          <AIChatWidget />
          <TelegramWhatsAppCTA />
        </Providers>
      </body>
    </html>);
}
