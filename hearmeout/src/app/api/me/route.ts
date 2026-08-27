import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { getCurrentUserId } from '@/lib/identity';
import { getUserProfile } from '@/lib/userProfile';
import { slugifyHandle } from '@/lib/slug';
import type { ApiUser, Me } from '@/lib/types';

const ACCENT_PALETTES = new Set(['calm-1', 'calm-2', 'bright-1', 'bright-2', 'acid-1', 'acid-2']);

export async function GET() {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: 'not_registered' }, { status: 401 });

  const admin = supabaseAdmin();
  const [profile, { data: prefs }, { data: conns }, { data: friendRows }] = await Promise.all([
    getUserProfile(admin, userId, userId),
    admin.from('users').select('language, region, auth_user_id, is_premium, banner_url, accent_palette').eq('id', userId).maybeSingle(),
    admin.from('connections').select('provider').eq('user_id', userId),
    admin.from('friendships').select('friend:friend_id(id, name, handle, avatar_url, is_premium)').eq('user_id', userId),
  ]);

  if (!profile) return NextResponse.json({ error: 'not_found' }, { status: 404 });

  const connSet = new Set((conns || []).map((c) => c.provider as string));
  const friends: ApiUser[] = (friendRows || [])
    .map((row): ApiUser | null => {
      const f = row.friend as unknown as { id: string; name: string; handle: string; avatar_url: string | null; is_premium: boolean | null } | null;
      return f ? { id: f.id, name: f.name, handle: f.handle, avatarUrl: f.avatar_url, isPremium: !!f.is_premium } : null;
    })
    .filter((f): f is ApiUser => f !== null);

  let email: string | null = null;
  if (prefs?.auth_user_id) {
    const { data: authUser } = await admin.auth.admin.getUserById(prefs.auth_user_id as string);
    email = authUser.user?.email ?? null;
  }

  const me: Me = {
    ...profile,
    connections: { spotify: connSet.has('spotify'), appleMusic: connSet.has('apple_music') },
    friends,
    language: (prefs?.language as Me['language']) || 'ru',
    region: prefs?.region ?? null,
    hasPassword: !!prefs?.auth_user_id,
    email,
    isPremium: !!prefs?.is_premium,
    bannerUrl: (prefs?.banner_url as string | null) ?? null,
    accentPalette: (prefs?.accent_palette as string | null) ?? null,
  };
  return NextResponse.json(me);
}

export async function PATCH(request: NextRequest) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: 'not_registered' }, { status: 401 });

  const admin = supabaseAdmin();
  const body = await request.json().catch(() => null);
  const patch: Record<string, string | null> = {};
  if (typeof body?.name === 'string' && body.name.trim()) patch.name = body.name.trim();
  if (typeof body?.handle === 'string' && body.handle.trim()) {
    patch.handle = `@${slugifyHandle(body.handle.replace(/^@/, ''))}`;
  }
  if (typeof body?.avatarUrl === 'string') patch.avatar_url = body.avatarUrl;
  // Banner + accent palette are premium features — real gate, not just a
  // hidden button: a direct PATCH from a non-premium account is dropped
  // silently rather than trusting the client to have hidden the UI for it.
  if (typeof body?.bannerUrl === 'string' || (typeof body?.accentPalette === 'string' && ACCENT_PALETTES.has(body.accentPalette))) {
    const { data: prefs } = await admin.from('users').select('is_premium').eq('id', userId).maybeSingle();
    if (prefs?.is_premium) {
      if (typeof body.bannerUrl === 'string') patch.banner_url = body.bannerUrl;
      if (typeof body.accentPalette === 'string' && ACCENT_PALETTES.has(body.accentPalette)) patch.accent_palette = body.accentPalette;
    }
  }
  if (typeof body?.language === 'string' && ['ru', 'en', 'fr', 'es', 'de'].includes(body.language)) patch.language = body.language;
  if ('region' in (body ?? {})) patch.region = typeof body.region === 'string' && body.region ? body.region : null;
  if (!Object.keys(patch).length) return NextResponse.json({ ok: true });

  const { error } = await admin.from('users').update(patch).eq('id', userId);
  if (error) {
    if (error.code === '23505') return NextResponse.json({ error: 'handle_taken' }, { status: 409 });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
