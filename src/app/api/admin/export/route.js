// CSV export for ops & accounting. ?kind=users|transactions|tokens
import { requireAdmin } from '@/lib/server/auth.js';
import {
  listUsers,
  listTransactions,
  listTokens,
  appendAudit,
} from '@/lib/server/store.js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Minimal RFC-4180 CSV escaping. Wraps in double-quotes when the value
// contains a comma, quote, newline, or leading/trailing whitespace; doubles
// any embedded quotes.
function csvCell(v) {
  if (v === null || v === undefined) return '';
  const s = String(v);
  if (/[",\r\n]/.test(s) || s !== s.trim()) {
    return '"' + s.replace(/"/g, '""') + '"';
  }
  return s;
}

function toCsv(rows, columns) {
  const header = columns.map((c) => csvCell(c.label || c.key)).join(',');
  const body = rows
    .map((r) => columns.map((c) => csvCell(c.value ? c.value(r) : r[c.key])).join(','))
    .join('\r\n');
  return header + '\r\n' + body + (body ? '\r\n' : '');
}

const KIND_COLUMNS = {
  users: [
    { key: 'id' },
    { key: 'email' },
    { key: 'name' },
    { key: 'isAdmin' },
    { key: 'accountStatus', value: (u) => u.accountStatus || 'active' },
    { key: 'createdAt', value: (u) => u.createdAt ? new Date(u.createdAt).toISOString() : '' },
    { key: 'balances', value: (u) => JSON.stringify(u.balances || {}) },
  ],
  transactions: [
    { key: 'id' },
    { key: 'userId' },
    { key: 'type' },
    { key: 'symbol' },
    { key: 'amount' },
    { key: 'price' },
    { key: 'usdValue' },
    { key: 'status' },
    { key: 'address' },
    { key: 'memo' },
    { key: 'network' },
    { key: 'note' },
    { key: 'createdAt', value: (t) => t.createdAt ? new Date(t.createdAt).toISOString() : '' },
  ],
  tokens: [
    { key: 'id' },
    { key: 'code' },
    { key: 'userId' },
    { key: 'symbol' },
    { key: 'maxAmount' },
    { key: 'status' },
    { key: 'createdAt', value: (t) => t.createdAt ? new Date(t.createdAt).toISOString() : '' },
    { key: 'expiresAt', value: (t) => t.expiresAt ? new Date(t.expiresAt).toISOString() : '' },
    { key: 'usedAt', value: (t) => t.usedAt ? new Date(t.usedAt).toISOString() : '' },
    { key: 'usedBy' },
    { key: 'txId' },
  ],
};

export async function GET(req) {
  try {
    const admin = await requireAdmin();
    const { searchParams } = new URL(req.url);
    const kind = String(searchParams.get('kind') || '').toLowerCase();
    if (!KIND_COLUMNS[kind]) {
      return new Response(JSON.stringify({ error: 'kind must be one of: users, transactions, tokens' }), {
        status: 400, headers: { 'Content-Type': 'application/json' },
      });
    }
    let rows;
    if (kind === 'users') rows = listUsers();
    else if (kind === 'transactions') rows = listTransactions();
    else rows = listTokens();

    const csv = toCsv(rows, KIND_COLUMNS[kind]);
    appendAudit({
      actorId: admin.id,
      actorEmail: admin.email,
      action: 'export.csv',
      target: kind,
      payload: { rowCount: rows.length },
    });
    return new Response(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="aurumx-${kind}-${new Date().toISOString().slice(0,10)}.csv"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: err.status || 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
