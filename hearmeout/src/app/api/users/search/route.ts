import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { getCurrentUserId } from '@/lib/identity';

export async function GET(request: NextRequest) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: 'not_registered' }, { status: 401 });

  const q = new URL(request.url).searchParams.get('q')?.trim() ?? '';
  if (q.length < 2) return NextResponse.json([]);

  const admin = supabaseAdmin();
  const { data, error } = await admin
    .from('users')
    .select('id, name, handle, avatar_url')
    .or(`name.ilike.%${q}%,handle.ilike.%${q}%`)
    .neq('id', userId)
    .limit(10);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json((data || []).map((u) => ({ id: u.id, name: u.name, handle: u.handle, avatarUrl: u.avatar_url })));
}
