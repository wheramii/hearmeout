import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { getCurrentUserId } from '@/lib/identity';
import { acceptFriendRequest } from '@/lib/friendRequests';

export async function POST(request: NextRequest) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: 'not_registered' }, { status: 401 });

  const body = await request.json().catch(() => null);
  const requestId = typeof body?.requestId === 'number' ? body.requestId : Number(body?.requestId);
  const action = body?.action;
  if (!requestId || (action !== 'accept' && action !== 'decline')) {
    return NextResponse.json({ error: 'invalid_payload' }, { status: 400 });
  }

  const admin = supabaseAdmin();
  const { data: reqRow, error: findErr } = await admin
    .from('friend_requests')
    .select('id, from_user_id, to_user_id, status')
    .eq('id', requestId)
    .maybeSingle();
  if (findErr) return NextResponse.json({ error: findErr.message }, { status: 500 });
  if (!reqRow || reqRow.to_user_id !== userId) return NextResponse.json({ error: 'not_found' }, { status: 404 });
  if (reqRow.status !== 'pending') return NextResponse.json({ error: 'already_resolved' }, { status: 409 });

  if (action === 'accept') {
    await acceptFriendRequest(admin, reqRow.id, reqRow.from_user_id as string, reqRow.to_user_id as string);
  } else {
    await admin.from('friend_requests').update({ status: 'declined' }).eq('id', requestId);
  }

  return NextResponse.json({ ok: true });
}
