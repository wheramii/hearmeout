import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { getUserProfile } from '@/lib/userProfile';

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const admin = supabaseAdmin();
  const profile = await getUserProfile(admin, id);
  if (!profile) return NextResponse.json({ error: 'not_found' }, { status: 404 });
  return NextResponse.json(profile);
}
