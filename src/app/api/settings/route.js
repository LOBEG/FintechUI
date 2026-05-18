import { NextResponse } from 'next/server';
import { getSettings } from '@/lib/server/store.js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Public, read-only — used by the UI to react to admin/telegram toggles.
export async function GET() {
  const s = getSettings();
  return NextResponse.json({
    maintenanceMode: s.maintenanceMode,
    banner: s.banner,
    withdrawalsEnabled: s.withdrawalsEnabled,
    signupsEnabled: s.signupsEnabled,
    broadcasts: (s.broadcasts || []).slice(0, 5),
  });
}
