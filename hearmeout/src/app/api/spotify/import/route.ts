import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { getCurrentUserId } from '@/lib/identity';
import { importStreamingHistory } from '@/lib/streamingHistoryImport';

const MAX_FILES = 50;
const MAX_FILE_BYTES = 6 * 1024 * 1024;

export async function POST(request: NextRequest) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: 'not_registered' }, { status: 401 });

  const form = await request.formData();
  const fileEntries = form.getAll('files').filter((f): f is File => f instanceof File);
  if (!fileEntries.length) return NextResponse.json({ error: 'no_files' }, { status: 400 });
  if (fileEntries.length > MAX_FILES) return NextResponse.json({ error: 'too_many_files' }, { status: 400 });

  const files: { name: string; text: string }[] = [];
  for (const f of fileEntries) {
    if (f.size > MAX_FILE_BYTES) {
      return NextResponse.json({ error: 'file_too_large', file: f.name }, { status: 400 });
    }
    files.push({ name: f.name, text: await f.text() });
  }

  try {
    const result = await importStreamingHistory(supabaseAdmin(), userId, files);
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : String(err) }, { status: 500 });
  }
}
