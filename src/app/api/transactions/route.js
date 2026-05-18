import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/server/auth.js';
import { transactionsForUser } from '@/lib/server/store.js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function csvCell(v) {
  if (v === null || v === undefined) return '';
  const s = String(v);
  if (/[",\r\n]/.test(s) || s !== s.trim()) {
    return '"' + s.replace(/"/g, '""') + '"';
  }
  return s;
}

export async function GET(req) {
  try {
    const user = await requireUser();
    const txs = transactionsForUser(user.id);
    const { searchParams } = new URL(req.url);
    if (searchParams.get('format') === 'csv') {
      const cols = ['id', 'createdAt', 'type', 'symbol', 'amount', 'price', 'usdValue', 'status', 'address', 'memo', 'network', 'note'];
      const header = cols.join(',');
      const body = txs.map((t) => cols.map((c) => {
        if (c === 'createdAt') return csvCell(t.createdAt ? new Date(t.createdAt).toISOString() : '');
        return csvCell(t[c]);
      }).join(',')).join('\r\n');
      const csv = header + '\r\n' + body + (body ? '\r\n' : '');
      return new Response(csv, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="aurumx-transactions-${new Date().toISOString().slice(0,10)}.csv"`,
          'Cache-Control': 'no-store',
        },
      });
    }
    return NextResponse.json({ transactions: txs });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: err.status || 500 });
  }
}
