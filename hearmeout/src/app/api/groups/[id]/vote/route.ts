import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { getCurrentUserId } from '@/lib/identity';

// One vote per member per group per calendar month — voting again just
// changes your pick (upsert on the primary key).
export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: 'not_registered' }, { status: 401 });
  const { id } = await context.params;

  const admin = supabaseAdmin();
  const { data: membership } = await admin.from('group_members').select('user_id').eq('group_id', id).eq('user_id', userId).maybeSingle();
  if (!membership) return NextResponse.json({ error: 'not_a_member' }, { status: 403 });

  const body = await request.json().catch(() => null);
  const candidateId = typeof body?.candidateId === 'string' ? body.candidateId : '';
  if (!candidateId) return NextResponse.json({ error: 'invalid_payload' }, { status: 400 });

  const { data: candidateMember } = await admin.from('group_members').select('user_id').eq('group_id', id).eq('user_id', candidateId).maybeSingle();
  if (!candidateMember) return NextResponse.json({ error: 'invalid_candidate' }, { status: 400 });

  const monthKey = new Date().toISOString().slice(0, 7);
  const { error } = await admin
    .from('group_votes')
    .upsert({ group_id: id, month_key: monthKey, voter_id: userId, candidate_id: candidateId }, { onConflict: 'group_id,month_key,voter_id' });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
