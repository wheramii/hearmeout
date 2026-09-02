// The "no friends yet" screen shows these two real, always-seeded accounts
// as example profiles (their name literally reads "Демо: …") so a first-time
// user can try the friend-comparison feature before they've added anyone
// real. They're excluded from name/handle search and can't send or receive
// friend requests (see filters in api/users/search and api/friends), but
// their profile — stats, genres, match score, shared ratings — is open to
// everyone, unlike a real account's, since there's no privacy to protect
// here: it's fixture data, not a person.
export const DEMO_PROFILES: readonly { id: string; name: string; avatarUrl: null }[] = [
  { id: '546a1107-5b9d-421c-bf66-feb979e78c9f', name: 'Демо: Аня', avatarUrl: null },
  { id: 'b9fa30ea-848d-4a4e-90f3-82cca01c9809', name: 'Демо: Макс', avatarUrl: null },
];

export const DEMO_ACCOUNT_IDS: readonly string[] = DEMO_PROFILES.map((p) => p.id);

export function isDemoAccountId(id: string | null | undefined): boolean {
  return !!id && DEMO_ACCOUNT_IDS.includes(id);
}
