export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function isStrongEnoughPassword(password: string): boolean {
  return password.length >= 8;
}

// True for any Supabase Auth "duplicate email" error message — GoTrue's
// wording has varied across versions, so this matches loosely rather than
// pinning one exact string.
export function isDuplicateEmailError(message: string): boolean {
  return /already.*registered|already exists|already.*use/i.test(message);
}
