import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { exchangeCodeForTokens } from '@/lib/spotify';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { getCurrentUserId } from '@/lib/identity';
import { syncSpotifyForUser } from '@/lib/spotifySync';

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  const spotifyError = url.searchParams.get('error');
  const origin = url.origin;

  const cookieStore = await cookies();
  const expectedState = cookieStore.get('spotify_oauth_state')?.value;
  cookieStore.delete('spotify_oauth_state');

  const userId = await getCurrentUserId();
  if (!userId) {
    return NextResponse.redirect(`${origin}/?spotify_error=not_registered`);
  }
  if (spotifyError) {
    return NextResponse.redirect(`${origin}/?spotify_error=${encodeURIComponent(spotifyError)}`);
  }
  if (!code || !state || !expectedState || state !== expectedState) {
    return NextResponse.redirect(`${origin}/?spotify_error=invalid_state`);
  }

  try {
    const tokens = await exchangeCodeForTokens(code);
    const admin = supabaseAdmin();

    const expiresAt = new Date(Date.now() + tokens.expires_in * 1000).toISOString();
    const { error: upsertErr } = await admin.from('connections').upsert(
      {
        user_id: userId,
        provider: 'spotify',
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        expires_at: expiresAt,
      },
      { onConflict: 'user_id,provider' }
    );
    if (upsertErr) throw upsertErr;

    // Pull recent history immediately so the connect action has visible
    // impact right away instead of waiting on a future cron sync.
    await syncSpotifyForUser(admin, userId);

    return NextResponse.redirect(`${origin}/?spotify=connected`);
  } catch (err) {
    console.error('Spotify OAuth callback failed', err);
    return NextResponse.redirect(`${origin}/?spotify_error=callback_failed`);
  }
}
