import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { getCurrentUserId } from '@/lib/identity';
import type { ApiUser, FriendRequest } from '@/lib/types';

type Row = { id: number; created_at: string; other: unknown };

function toFriendRequests(rows: Row[] | null): FriendRequest[] {
  return (rows || [])
    .map((row) => {
      const u = row.other as { id: string; name: string; handle: string; avatar_url: string | null } | null;
      if (!u) return null;
      const user: ApiUser = { id: u.id, name: u.name, handle: u.handle, avatarUrl: u.avatar_url };
      return { id: row.id, user, createdAt: row.created_at };
    })
    .filter((r): r is FriendRequest => r !== null);
}

export async function GET() {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: 'not_registered' }, { status: 401 });

  const admin = supabaseAdmin();
  const [{ data: incoming }, { data: outgoing }] = await Promise.all([
    admin
      .from('friend_requests')
      .select('id, created_at, other:from_user_id(id, name, handle, avatar_url)')
      .eq('to_user_id', userId)
      .eq('status', 'pending')
      .order('created_at', { ascending: false }),
    admin
      .from('friend_requests')
      .select('id, created_at, other:to_user_id(id, name, handle, avatar_url)')
      .eq('from_user_id', userId)
      .eq('status', 'pending')
      .order('created_at', { ascending: false }),
  ]);

  return NextResponse.json({
    incoming: toFriendRequests(incoming as Row[] | null),
    outgoing: toFriendRequests(outgoing as Row[] | null),
  });
}
