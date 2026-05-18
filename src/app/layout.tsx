import type { Metadata, Viewport } from 'next';
import './globals.css';
import { Providers } from './providers';
import { TelegramWhatsAppCTA } from '@/components/widgets/TelegramWhatsAppCTA';
import { AIChatWidget } from '@/components/widgets/AIChatWidget';

export const metadata: Metadata = {
  title: 'AurumX — Luxury Digital Asset & Crypto Investment Platform',
  description:
    'AurumX is an institutional-grade cryptocurrency trading and digital asset management platform combining BlackRock-grade sophistication with Binance-level performance.',
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
  openGraph: {
    title: 'AurumX — Luxury Digital Asset Platform',
    description:
      'Institutional digital asset investment platform for high-net-worth investors and corporate clients.',
    type: 'website',
  },
};

export const viewport: Viewport = {
  themeColor: '#05070d',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen font-sans antialiased text-white">
        <Providers>
          {children}
          <AIChatWidget />
          <TelegramWhatsAppCTA />
        </Providers>
      </body>
    </html>
  );
}
