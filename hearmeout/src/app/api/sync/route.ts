import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { getCurrentUserId } from '@/lib/identity';
import { syncSpotifyForUser } from '@/lib/spotifySync';

export async function POST() {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: 'not_registered' }, { status: 401 });

  try {
    const admin = supabaseAdmin();
    const result = await syncSpotifyForUser(admin, userId);
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const status = message === 'not_connected' ? 400 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
