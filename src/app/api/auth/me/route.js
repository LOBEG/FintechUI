import { NextResponse } from 'next/server';
import { currentUser, publicUser } from '@/lib/server/auth.js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const u = await currentUser();
  return NextResponse.json({ user: publicUser(u) });
}
