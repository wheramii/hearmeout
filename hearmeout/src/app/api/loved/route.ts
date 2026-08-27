import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { getCurrentUserId } from '@/lib/identity';

const ITEM_TYPES = new Set(['track', 'album', 'artist']);

export async function GET() {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: 'not_registered' }, { status: 401 });
  const admin = supabaseAdmin();
  const { data, error } = await admin
    .from('loved_items')
    .select('id, item_type, item_id, title, artist, cover_url, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  const items = (data || []).map((r) => ({
    id: r.id, type: r.item_type, itemId: r.item_id, title: r.title, artist: r.artist, cover: r.cover_url, createdAt: r.created_at,
  }));
  return NextResponse.json({ items });
}

// Toggle — loving an already-loved item un-loves it. Identified by
// (type, itemId, title, artist) rather than itemId alone since not every
// source (CSV-imported tracks, MusicBrainz artists) has a real Spotify id.
export async function POST(request: NextRequest) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: 'not_registered' }, { status: 401 });
  const body = await request.json().catch(() => null);
  const type = typeof body?.type === 'string' ? body.type : null;
  const title = typeof body?.title === 'string' ? body.title : null;
  if (!type || !ITEM_TYPES.has(type) || !title) return NextResponse.json({ error: 'missing_fields' }, { status: 400 });
  const artist = typeof body?.artist === 'string' ? body.artist : null;
  const itemId = typeof body?.itemId === 'string' ? body.itemId : null;
  const cover = typeof body?.cover === 'string' ? body.cover : null;

  const admin = supabaseAdmin();
  let existingQuery = admin.from('loved_items').select('id').eq('user_id', userId).eq('item_type', type).eq('title', title);
  existingQuery = itemId ? existingQuery.eq('item_id', itemId) : existingQuery.is('item_id', null);
  existingQuery = artist ? existingQuery.eq('artist', artist) : existingQuery.is('artist', null);
  const { data: existing, error: lookupErr } = await existingQuery.maybeSingle();
  if (lookupErr) return NextResponse.json({ error: lookupErr.message }, { status: 500 });

  if (existing) {
    const { error } = await admin.from('loved_items').delete().eq('id', existing.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ loved: false });
  }
  const { error } = await admin.from('loved_items').insert({ user_id: userId, item_type: type, item_id: itemId, title, artist, cover_url: cover });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ loved: true });
}
