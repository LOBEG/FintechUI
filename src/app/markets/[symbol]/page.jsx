import AssetDetailClient from '../AssetDetailClient';

export const dynamic = 'force-dynamic';

export default async function MarketDetailPage({ params }) {
  const { symbol } = await params;
  return <AssetDetailClient symbol={symbol} />;
}
