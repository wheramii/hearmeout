import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { getCurrentUserId } from '@/lib/identity';
import { isValidEmail, isStrongEnoughPassword, isDuplicateEmailError } from '@/lib/authValidation';

// Lets a pre-existing cookie-only account (created before real accounts
// existed) attach an email+password without losing its id, ratings,
// friends, or history — the browser session stays logged in exactly as
// it was, just now recoverable from any device too.
export async function POST(request: NextRequest) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: 'not_registered' }, { status: 401 });

  const body = await request.json().catch(() => null);
  const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : '';
  const password = typeof body?.password === 'string' ? body.password : '';
  if (!isValidEmail(email)) return NextResponse.json({ error: 'invalid_email' }, { status: 400 });
  if (!isStrongEnoughPassword(password)) return NextResponse.json({ error: 'weak_password' }, { status: 400 });

  const admin = supabaseAdmin();

  const { data: row } = await admin.from('users').select('auth_user_id').eq('id', userId).maybeSingle();
  if (row?.auth_user_id) return NextResponse.json({ error: 'already_linked' }, { status: 409 });

  const { data: authData, error: authErr } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (authErr || !authData.user) {
    const dup = isDuplicateEmailError(authErr?.message || '');
    return NextResponse.json({ error: dup ? 'email_taken' : authErr?.message }, { status: dup ? 409 : 500 });
  }

  const { error: updateErr } = await admin.from('users').update({ auth_user_id: authData.user.id }).eq('id', userId);
  if (updateErr) {
    await admin.auth.admin.deleteUser(authData.user.id);
    return NextResponse.json({ error: updateErr.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
