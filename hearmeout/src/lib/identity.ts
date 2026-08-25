import { cookies } from 'next/headers';

export const IDENTITY_COOKIE = 'hmo_uid';

// Lightweight "who is this browser" identity: no password, just a name
// picked at registration. Good enough for a friends-circle MVP; swap for
// real Supabase Auth if this ever needs to survive a hostile client.
export async function getCurrentUserId(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(IDENTITY_COOKIE)?.value ?? null;
}

export async function setCurrentUserId(userId: string) {
  const cookieStore = await cookies();
  cookieStore.set(IDENTITY_COOKIE, userId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 365,
    path: '/',
  });
}
