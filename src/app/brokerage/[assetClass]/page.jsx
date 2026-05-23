import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { MobileBottomNav } from '@/components/layout/MobileBottomNav';
import BrokerageClient from '../BrokerageClient';
import { BROKERAGE_TABS } from '../brokerageTabs';

export const dynamic = 'force-dynamic';

export function generateStaticParams() {
  return BROKERAGE_TABS.map((tab) => ({ assetClass: tab.id }));
}

export async function generateMetadata({ params }) {
  const resolvedParams = await params;
  const tab = BROKERAGE_TABS.find((item) => item.id === resolvedParams?.assetClass);
  return {
    title: `${tab?.label || 'Brokerage'} | Oakmont Digital Markets Groups`,
    description: tab?.blurb || 'Live multi-asset brokerage workspace from Oakmont Digital Markets Groups.',
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
