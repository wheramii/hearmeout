import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { getUserProfile } from '@/lib/userProfile';
import { getCurrentUserId } from '@/lib/identity';

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const viewerId = await getCurrentUserId();
  const admin = supabaseAdmin();
  const profile = await getUserProfile(admin, id, viewerId);
  if (!profile) return NextResponse.json({ error: 'not_found' }, { status: 404 });
  return NextResponse.json(profile);
}
