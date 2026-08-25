import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { setCurrentUserId } from '@/lib/identity';
import { slugifyHandle } from '@/lib/slug';

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const name = typeof body?.name === 'string' ? body.name.trim() : '';
  if (!name) return NextResponse.json({ error: 'Name is required' }, { status: 400 });

  const admin = supabaseAdmin();
  const base = slugifyHandle(name);
  let handle = `@${base}`;
  let suffix = 0;
  while (suffix < 50) {
    const { data: existing, error } = await admin.from('users').select('id').eq('handle', handle).maybeSingle();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    if (!existing) break;
    suffix += 1;
    handle = `@${base}${suffix}`;
  }

  const { data: created, error: insertErr } = await admin
    .from('users')
    .insert({ name, handle })
    .select('id, name, handle, avatar_url')
    .single();
  if (insertErr) return NextResponse.json({ error: insertErr.message }, { status: 500 });

  await setCurrentUserId(created.id);
  return NextResponse.json({ id: created.id, name: created.name, handle: created.handle, avatarUrl: created.avatar_url });
}
