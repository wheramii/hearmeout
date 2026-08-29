import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { setCurrentUserId } from '@/lib/identity';
import { isStrongEnoughPassword } from '@/lib/authValidation';

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : '';
  const code = typeof body?.code === 'string' ? body.code.trim() : '';
  const newPassword = typeof body?.newPassword === 'string' ? body.newPassword : '';

  if (!email || !code) return NextResponse.json({ error: 'invalid_payload' }, { status: 400 });
  if (!isStrongEnoughPassword(newPassword)) return NextResponse.json({ error: 'weak_password' }, { status: 400 });

  const admin = supabaseAdmin();

  // verifyOtp both checks the code (right value, not expired, not already
  // used) and consumes it — Supabase's own recovery-token bookkeeping, not
  // anything this app tracks itself.
  const { data, error } = await admin.auth.verifyOtp({ email, token: code, type: 'recovery' });
  if (error || !data.user) return NextResponse.json({ error: 'invalid_code' }, { status: 400 });

  const { error: updateErr } = await admin.auth.admin.updateUserById(data.user.id, { password: newPassword });
  if (updateErr) return NextResponse.json({ error: updateErr.message }, { status: 500 });

  const { data: userRow, error: findErr } = await admin
    .from('users')
    .select('id, name, handle, avatar_url')
    .eq('auth_user_id', data.user.id)
    .maybeSingle();
  if (findErr || !userRow) return NextResponse.json({ error: 'account_not_linked' }, { status: 404 });

  await setCurrentUserId(userRow.id);
  return NextResponse.json({ id: userRow.id, name: userRow.name, handle: userRow.handle, avatarUrl: userRow.avatar_url });
}
