import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { MobileBottomNav } from '@/components/layout/MobileBottomNav';
import BrokerageClient, { TABS } from '../BrokerageClient';

export const dynamic = 'force-dynamic';

export function generateStaticParams() {
  return TABS.map((tab) => ({ assetClass: tab.id }));
}

export async function generateMetadata({ params }) {
  const resolvedParams = await params;
  const tab = TABS.find((item) => item.id === resolvedParams?.assetClass);
  return {
    title: `${tab?.label || 'Brokerage'} | Oakmont Digital Markets Group`,
    description: tab?.blurb || 'Live multi-asset brokerage workspace from Oakmont Digital Markets Group.',
  };
}

export default async function BrokerageAssetClassPage({ params }) {
  const resolvedParams = await params;
  return (
    <main className="pb-24 lg:pb-0">
      <Navbar/>
      <BrokerageClient initialTab={resolvedParams?.assetClass || 'stocks'}/>
      <Footer/>
      <MobileBottomNav/>
    </main>
  );
}
