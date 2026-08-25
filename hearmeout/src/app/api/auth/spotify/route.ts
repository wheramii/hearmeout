import { randomBytes } from 'crypto';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { spotifyAuthUrl } from '@/lib/spotify';
import { getCurrentUserId } from '@/lib/identity';

export async function GET(request: Request) {
  const origin = new URL(request.url).origin;
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.redirect(`${origin}/`);

  const state = randomBytes(16).toString('hex');
  const cookieStore = await cookies();
  cookieStore.set('spotify_oauth_state', state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 600,
    path: '/',
  });
  return NextResponse.redirect(spotifyAuthUrl(state));
}
