import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { getCurrentUserId } from '@/lib/identity';

export async function POST(request: NextRequest) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: 'not_registered' }, { status: 401 });

  const body = await request.json().catch(() => null);
  const raw = typeof body?.handle === 'string' ? body.handle.trim() : '';
  if (!raw) return NextResponse.json({ error: 'invalid_payload' }, { status: 400 });
  const normalized = raw.startsWith('@') ? raw : `@${raw}`;

  const admin = supabaseAdmin();
  const { data: target, error: findErr } = await admin
    .from('users')
    .select('id')
    .ilike('handle', normalized)
    .maybeSingle();
  if (findErr) return NextResponse.json({ error: findErr.message }, { status: 500 });
  if (!target) return NextResponse.json({ error: 'not_found' }, { status: 404 });
  if (target.id === userId) return NextResponse.json({ error: 'self' }, { status: 400 });

  const { error: insertErr } = await admin
    .from('friendships')
    .upsert(
      [
        { user_id: userId, friend_id: target.id },
        { user_id: target.id, friend_id: userId },
      ],
      { onConflict: 'user_id,friend_id' }
    );
  if (insertErr) return NextResponse.json({ error: insertErr.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
