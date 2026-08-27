// PostgREST caps every response at its project-wide "max rows" setting
// (1000 by default) no matter what .limit() the client asks for — a
// .limit(50000) call silently comes back with 1000 rows. Confirmed live:
// an account with ~19,600 listening_events rows had every query (stats,
// recap) truncated to the oldest/first 1000, which is why "4 weeks" showed
// nothing (the real recent rows were never fetched) and "month" vs "season"
// recaps looked identical (both got the same truncated slice). This pages
// through with .range() until a page comes back short, so callers get the
// real row count instead of one page of it.
const PAGE_SIZE = 1000;

export async function fetchAllRows<T>(
  buildQuery: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: { message: string } | null }>,
  maxRows = 50000
): Promise<{ rows: T[]; error: string | null }> {
  const rows: T[] = [];
  let offset = 0;
  while (offset < maxRows) {
    const { data, error } = await buildQuery(offset, offset + PAGE_SIZE - 1);
    if (error) return { rows, error: error.message };
    const page = data || [];
    rows.push(...page);
    if (page.length < PAGE_SIZE) break;
    offset += PAGE_SIZE;
  }
  return { rows, error: null };
}
