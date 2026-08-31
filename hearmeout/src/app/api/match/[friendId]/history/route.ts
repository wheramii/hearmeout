import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { getCurrentUserId } from '@/lib/identity';

export async function GET(_request: Request, context: { params: Promise<{ friendId: string }> }) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: 'not_registered' }, { status: 401 });
  const { friendId } = await context.params;

  const admin = supabaseAdmin();
  const { data, error } = await admin
    .from('match_snapshots')
    .select('pct, snapshot_date')
    .eq('user_id', userId)
    .eq('friend_id', friendId)
    .order('snapshot_date', { ascending: true });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const history = (data || []).map((r) => ({ pct: r.pct as number, date: r.snapshot_date as string }));
  return NextResponse.json({ history });
}
