import { NextResponse } from 'next/server';
import { BROKERAGE_UNIVERSE, OPTIONS_UNDERLIERS, ASSET_CLASSES } from '@/lib/server/brokerage.js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json({
    assetClasses: ASSET_CLASSES,
    universe: BROKERAGE_UNIVERSE,
    optionsUnderliers: OPTIONS_UNDERLIERS,
  });
}
