import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { getCurrentUserId } from '@/lib/identity';
import { isDemoAccountId } from '@/lib/demoAccounts';

// Visiting someone's invite link (/invite/[id]) and accepting it creates a
// mutual friendship immediately — no pending-request step, since generating
// and sharing that link is itself the inviter's consent, and clicking
// "add" on it is the visitor's.
export async function POST(request: NextRequest) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: 'not_registered' }, { status: 401 });

  const body = await request.json().catch(() => null);
  const fromUserId = typeof body?.fromUserId === 'string' ? body.fromUserId : null;
  if (!fromUserId) return NextResponse.json({ error: 'invalid_payload' }, { status: 400 });
  if (fromUserId === userId) return NextResponse.json({ error: 'self' }, { status: 400 });
  if (isDemoAccountId(fromUserId)) return NextResponse.json({ error: 'demo_account' }, { status: 400 });

  const admin = supabaseAdmin();
  const { data: inviter, error: findErr } = await admin
    .from('users')
    .select('id, name, handle, avatar_url')
    .eq('id', fromUserId)
    .maybeSingle();
  if (findErr) return NextResponse.json({ error: findErr.message }, { status: 500 });
  if (!inviter) return NextResponse.json({ error: 'not_found' }, { status: 404 });

  const { error } = await admin.from('friendships').upsert(
    [
      { user_id: userId, friend_id: fromUserId },
      { user_id: fromUserId, friend_id: userId },
    ],
    { onConflict: 'user_id,friend_id' }
  );
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true, user: { id: inviter.id, name: inviter.name, handle: inviter.handle, avatarUrl: inviter.avatar_url } });
}
