import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { getCurrentUserId } from '@/lib/identity';

// Opportunistic — no cron/background job exists in this app, so a match %
// history has to build up from real visits: called once whenever a friend's
// profile is actually viewed and a live match score gets computed. Upserts
// on (user_id, friend_id, snapshot_date) so repeat visits the same day just
// update today's row instead of piling up duplicates.
export async function POST(request: NextRequest) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: 'not_registered' }, { status: 401 });

  const body = await request.json().catch(() => null);
  const friendId = typeof body?.friendId === 'string' ? body.friendId : null;
  const pct = typeof body?.pct === 'number' ? Math.round(body.pct) : null;
  if (!friendId || pct === null || pct < 0 || pct > 100) {
    return NextResponse.json({ error: 'invalid_payload' }, { status: 400 });
  }

  const admin = supabaseAdmin();
  const { error } = await admin
    .from('match_snapshots')
    .upsert({ user_id: userId, friend_id: friendId, pct, snapshot_date: new Date().toISOString().slice(0, 10) }, { onConflict: 'user_id,friend_id,snapshot_date' });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
