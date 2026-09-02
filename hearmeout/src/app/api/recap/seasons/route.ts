import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { getCurrentUserId } from '@/lib/identity';
import { canViewProfileData } from '@/lib/userProfile';
import { seasonsInRange } from '@/lib/seasons';

export async function GET(request: NextRequest) {
  const viewerId = await getCurrentUserId();
  if (!viewerId) return NextResponse.json({ error: 'not_registered' }, { status: 401 });

  const url = new URL(request.url);
  const targetUserId = url.searchParams.get('userId') || viewerId;

  const admin = supabaseAdmin();
  if (!(await canViewProfileData(admin, targetUserId, viewerId))) {
    return NextResponse.json({ error: 'not_friends' }, { status: 403 });
  }
  const [{ data: oldest }, { data: newest }] = await Promise.all([
    admin.from('listening_events').select('played_at').eq('user_id', targetUserId).order('played_at', { ascending: true }).limit(1),
    admin.from('listening_events').select('played_at').eq('user_id', targetUserId).order('played_at', { ascending: false }).limit(1),
  ]);
  if (!oldest?.length || !newest?.length) return NextResponse.json({ seasons: [] });

  const seasons = seasonsInRange(new Date(oldest[0].played_at), new Date(newest[0].played_at));
  return NextResponse.json({ seasons });
}
