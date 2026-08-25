import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { getCurrentUserId } from '@/lib/identity';

export async function POST(request: NextRequest) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: 'not_registered' }, { status: 401 });

  const body = await request.json().catch(() => null);
  const albumId = typeof body?.albumId === 'string' ? body.albumId : null;
  const stars = typeof body?.stars === 'number' ? body.stars : null;
  const review = typeof body?.review === 'string' && body.review.trim() ? body.review.trim() : null;
  if (!albumId || !stars || stars <= 0) {
    return NextResponse.json({ error: 'invalid_payload' }, { status: 400 });
  }

  const admin = supabaseAdmin();
  const { error } = await admin
    .from('ratings')
    .upsert({ user_id: userId, album_id: albumId, stars, review }, { onConflict: 'user_id,album_id' });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
