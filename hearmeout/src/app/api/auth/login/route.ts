import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { setCurrentUserId } from '@/lib/identity';

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : '';
  const password = typeof body?.password === 'string' ? body.password : '';
  if (!email || !password) return NextResponse.json({ error: 'invalid_payload' }, { status: 400 });

  const admin = supabaseAdmin();
  const { data, error } = await admin.auth.signInWithPassword({ email, password });
  if (error || !data.user) return NextResponse.json({ error: 'invalid_credentials' }, { status: 401 });

  const { data: userRow, error: findErr } = await admin
    .from('users')
    .select('id, name, handle, avatar_url')
    .eq('auth_user_id', data.user.id)
    .maybeSingle();
  if (findErr || !userRow) return NextResponse.json({ error: 'account_not_linked' }, { status: 404 });

  await setCurrentUserId(userRow.id);
  return NextResponse.json({ id: userRow.id, name: userRow.name, handle: userRow.handle, avatarUrl: userRow.avatar_url });
}
