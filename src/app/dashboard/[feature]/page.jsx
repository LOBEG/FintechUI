import DashboardPage, { DASHBOARD_FEATURES } from '../page';

export function generateStaticParams() {
  return DASHBOARD_FEATURES
    .filter((feature) => feature.id !== 'overview')
    .map((feature) => ({ feature: feature.id }));
}

export default async function DashboardFeaturePage({ params }) {
  const resolvedParams = await params;
  return <DashboardPage initialFeature={resolvedParams?.feature || 'overview'} />;
}
