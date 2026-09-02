// The "no friends yet" screen shows these five real, always-seeded accounts
// (test_account1-5) as example profiles so a first-time user can try the
// friend-comparison feature before they've added anyone real. They're
// excluded from name/handle search and can't send or receive friend
// requests (see filters in api/users/search and api/friends), but their
// profile — stats, genres, match score, shared ratings — is open to
// everyone, unlike a real account's, since there's no privacy to protect
// here: it's fixture data, not a person.
export const DEMO_PROFILES: readonly { id: string; name: string; avatarUrl: null }[] = [
  { id: '546a1107-5b9d-421c-bf66-feb979e78c9f', name: 'test_account1', avatarUrl: null },
  { id: 'b9fa30ea-848d-4a4e-90f3-82cca01c9809', name: 'test_account2', avatarUrl: null },
  { id: '810af81d-38e0-4c4b-ac82-9adc1c2665f7', name: 'test_account3', avatarUrl: null },
  { id: 'd4fd8251-a76c-4d9d-bff4-1816611b40e4', name: 'test_account4', avatarUrl: null },
  { id: '0a6c4ca3-ed24-43ef-953f-de9f63923e7c', name: 'test_account5', avatarUrl: null },
];

export const DEMO_ACCOUNT_IDS: readonly string[] = DEMO_PROFILES.map((p) => p.id);

export function isDemoAccountId(id: string | null | undefined): boolean {
  return !!id && DEMO_ACCOUNT_IDS.includes(id);
}
