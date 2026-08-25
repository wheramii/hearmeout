export function slugifyHandle(name: string): string {
  const base = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9а-яё\s-]/gi, '')
    .replace(/\s+/g, '_')
    .slice(0, 24);
  return base || 'user';
}
