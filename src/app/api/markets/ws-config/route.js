// Provides WebSocket stream configuration to the client.
// Allows environment-level overrides for Binance WS endpoints
// (useful when running behind a proxy or in restricted regions).
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const DEFAULT_WS_BASE = 'wss://stream.binance.com:9443';

export async function GET() {
  const wsBase = process.env.BINANCE_WS_BASE || DEFAULT_WS_BASE;
  return NextResponse.json({
    wsBase,
    singleStreamPath: '/ws',
    combinedStreamPath: '/stream?streams=',
  }, {
    headers: { 'Cache-Control': 'public, max-age=300' },
  });
}
