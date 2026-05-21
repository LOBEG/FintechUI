// Public: list approved testimonials. Authenticated: post a new one.
// Users who have at least one successful invest or admin_credit are
// eligible to post. Newly posted testimonials enter `pending` status and
// must be approved by an admin — except when AUTO_APPROVE_TESTIMONIALS is
// set to "true", in which case they show up immediately.
import { NextResponse } from 'next/server';
import { currentUser, newId } from '@/lib/server/auth.js';
import {
  listTestimonials,
  addTestimonial,
  transactionsForUser,
} from '@/lib/server/store.js';
import { rateLimitOrJson } from '@/lib/server/rateLimit.js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function publicView(t) {
  return {
    id: t.id,
    name: t.name,
    role: t.role || 'Oakmont Digital Markets Group investor',
    text: t.text,
    rating: t.rating || 5,
    avatarUrl: cleanAvatarUrl(t.avatarUrl) || null,
    createdAt: t.createdAt,
  };
}

function cleanAvatarUrl(value) {
  const raw = String(value || '').trim();
  if (!raw) return '';
  try {
    const url = new URL(raw);
    if (url.protocol !== 'https:') return '';
    return url.toString().slice(0, 500);
  } catch (_) {
    return '';
  }
}

export async function GET() {
  const all = listTestimonials();
  const approved = all.filter((t) => t.status === 'approved');
  return NextResponse.json({ testimonials: approved.slice(0, 60).map(publicView) });
}

export async function POST(req) {
  try {
    const limited = rateLimitOrJson(req, { key: 'testimonials', max: 3, windowMs: 60_000 });
    if (limited) return limited;
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: 'Please sign in to post a testimonial.' }, { status: 401 });
    }
    const body = await req.json().catch(() => ({}));
    const text = String(body.text || '').trim();
    const rating = Math.min(5, Math.max(1, parseInt(body.rating, 10) || 5));
    const role = body.role ? String(body.role).slice(0, 80).trim() : '';
    const avatarUrl = cleanAvatarUrl(body.avatarUrl);
    if (text.length < 20) {
      return NextResponse.json({ error: 'Tell us a bit more — at least 20 characters.' }, { status: 400 });
    }
    if (text.length > 600) {
      return NextResponse.json({ error: 'Please keep it under 600 characters.' }, { status: 400 });
    }
    // Eligibility: at least one completed invest or admin_credit.
    const txs = transactionsForUser(user.id);
    const eligible = txs.some(
      (t) => (t.type === 'invest' || t.type === 'admin_credit' || t.type === 'adjust') && t.status === 'completed',
    );
    if (!eligible && !user.isAdmin) {
      return NextResponse.json(
        { error: 'You can post a testimonial after your first investment or deposit clears.' },
        { status: 403 },
      );
    }
    // Default to pending moderation. Operators can opt-in to auto-approve
    // by setting AUTO_APPROVE_TESTIMONIALS=true, but the safe default for
    // a public landing-page wall is human review.
    const autoApprove = String(process.env.AUTO_APPROVE_TESTIMONIALS || 'false') === 'true';
    const status = autoApprove || user.isAdmin ? 'approved' : 'pending';
    const t = {
      id: newId('tst'),
      userId: user.id,
      name: user.name || user.email.split('@')[0],
      role,
      text,
      rating,
      avatarUrl,
      status,
      createdAt: Date.now(),
    };
    addTestimonial(t);
    return NextResponse.json({ ok: true, testimonial: status === 'approved' ? publicView(t) : { ...publicView(t), status: 'pending' } });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: err.status || 500 });
  }
}
