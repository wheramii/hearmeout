'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { ALBUMS } from './data';
import { supabase } from './supabaseClient';
import { translate, type Language, type TranslationKey } from './i18n';
import type {
  Album, AlbumRatingInfo, ArtistState, Device, FriendRequest, LovedItem, LovedItemType, Me, RatingRecord, RecapData, RecapPeriod, ScreenName, SeasonOption,
} from './types';
import type { AlbumDetail, CatalogAlbum, CatalogArtist } from './spotifyCatalog';
import { THEME_PAIRS, isThemeId, isToxicity, onAccentFor, type Toxicity } from './themes';

const GENRE_BUCKETS = ['Rock', 'Hip-Hop', 'Electronic', 'R&B', 'Pop', 'Latin'];

// Home-screen sections built from live Spotify search results aren't part
// of the curated ALBUMS catalog, but they should still open like any other
// album (rate them, read/write reviews — ratings.album_id has no FK, so a
// Spotify search result id works there exactly like a curated one).
function catalogAlbumToAlbum(c: CatalogAlbum): Album {
  return {
    id: c.id,
    spotifyId: c.id,
    title: c.title,
    artist: c.artist,
    artistId: c.artistId,
    year: c.year ?? 0,
    genre: '',
    genreBucket: '',
    cover: c.cover ?? undefined,
    tracklist: [],
  };
}

// Full detail (real tracklist + primary artist id) for an on-demand album —
// one recap track, a friend's top-4 pick, an artist's discography entry —
// that isn't already sitting in the local catalog or a loaded home section.
function albumDetailToAlbum(d: AlbumDetail, overrideId?: string): Album {
  return {
    id: overrideId ?? d.id,
    spotifyId: d.id,
    title: d.title,
    artist: d.artist,
    artistId: d.artistId,
    year: d.year ?? 0,
    genre: '',
    genreBucket: '',
    cover: d.cover ?? undefined,
    tracklist: d.tracklist.map((t) => t.title),
  };
}

type SortBy = 'year' | 'genre' | 'artist';
type RateOrigin = 'album' | 'history';
type AuthStatus = 'loading' | 'anonymous' | 'ready';

type AppState = {
  authStatus: AuthStatus;
  language: Language;
  view: Device;
  activeScreen: ScreenName;
  // 'push' (nav tabs, forward links, opening an album/artist/friend/etc.)
  // always opens the destination at its top. 'pop' (an explicit "← Назад"
  // button) restores whatever scroll position the destination was left at.
  // AppShell reads this once per activeScreen change to decide which.
  navAction: 'push' | 'pop';
  currentAlbumId: string;
  viewingUserId: string;
  recapPeriod: RecapPeriod;
  recapSeasonKey: string | null;
  recapViewUserId: string;
  recapOrigin: ScreenName;
  searchQuery: string;
  activeGenre: string;
  sortBy: SortBy;
  ratingValue: number;
  ratingDraftText: string;
  historyQuery: string;
  rateOrigin: RateOrigin;
  currentArtist: ArtistState | null;
  toast: string | null;
  // True for the rest of this session right after a fresh signup, so
  // AppGate can show the onboarding wizard once instead of dropping the
  // new account straight into an empty catalog. Never persisted.
  justRegistered: boolean;
};

type AppContextValue = {
  state: AppState;
  language: Language;
  t: (key: TranslationKey, vars?: Record<string, string | number>) => string;
  albums: Album[];
  me: Me | null;
  albumRatings: Record<string, AlbumRatingInfo>;
  spotifyCovers: Record<string, string>;
  liveAlbums: Record<string, Album>;
  failedAlbumIds: Record<string, true>;
  spotifyObscure: Record<string, CatalogAlbum[] | 'error'>;
  spotifyGenreArtists: Record<string, CatalogArtist[] | 'error'>;
  myRatings: RatingRecord[];
  lovedItems: LovedItem[];
  toggleLoved: (type: LovedItemType, title: string, artist?: string | null, itemId?: string | null, cover?: string | null) => Promise<void>;
  friendRequests: { incoming: FriendRequest[]; outgoing: FriendRequest[] };
  recapCache: Record<string, RecapData>;
  reviewsVersion: number;
  showScreen: (name: ScreenName) => void;
  goBack: (name: ScreenName) => void;
  openAlbum: (id: string) => void;
  openRateFor: (id: string, origin: RateOrigin) => void;
  viewFriend: (id: string) => void;
  openRecap: (userId: string) => void;
  closeRecap: () => void;
  setSearchQuery: (q: string) => void;
  setActiveGenre: (g: string) => void;
  setSortBy: (s: SortBy) => void;
  setHistoryQuery: (q: string) => void;
  setRecapPeriod: (p: RecapPeriod) => void;
  setRecapSeasonKey: (key: string | null) => void;
  recapSeasons: SeasonOption[] | null;
  setRatingValue: (v: number) => void;
  setRatingDraftText: (t: string) => void;
  publishRating: (albumId: string, stars: number, review: string, tags?: string[]) => Promise<void>;
  ensureRecap: (userId: string, period: RecapPeriod, seasonKey?: string | null) => void;
  registerWithPassword: (name: string, email: string, password: string) => Promise<void>;
  dismissOnboarding: () => void;
  loginWithPassword: (email: string, password: string) => Promise<void>;
  claimAccount: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  deleteAccount: () => Promise<boolean>;
  updateProfileName: (name: string) => Promise<void>;
  updateProfileHandle: (handle: string) => Promise<void>;
  updateAvatar: (dataUrl: string) => Promise<void>;
  updateBanner: (dataUrl: string) => Promise<void>;
  updateAccentTheme: (theme: string) => Promise<void>;
  updateAccentToxicity: (toxicity: string) => Promise<void>;
  updateLanguage: (language: Language) => Promise<void>;
  updateRegion: (region: string | null) => Promise<void>;
  addFriend: (handle: string) => Promise<void>;
  respondToFriendRequest: (requestId: number, action: 'accept' | 'decline') => Promise<void>;
  syncSpotify: () => Promise<void>;
  onSpotifyConnected: () => Promise<void>;
  importStreamingHistory: (files: File[]) => Promise<{ imported: number; skipped: number; errors: string[] } | null>;
  openArtist: (mbid: string, name: string) => Promise<void>;
  openSpotifyArtist: (id: string) => Promise<void>;
  ensureLiveAlbum: (id: string, spotifyId?: string) => void;
  showToast: (msg: string) => void;
};

const AppContext = createContext<AppContextValue | null>(null);

const initialState: AppState = {
  authStatus: 'loading',
  language: 'ru',
  view: 'mobile',
  activeScreen: 'catalog',
  navAction: 'push',
  currentAlbumId: ALBUMS[0]?.id ?? '',
  viewingUserId: '',
  recapPeriod: 'day',
  recapSeasonKey: null,
  recapViewUserId: 'me',
  recapOrigin: 'catalog',
  searchQuery: '',
  activeGenre: 'Всё',
  sortBy: 'year',
  ratingValue: 0,
  ratingDraftText: '',
  historyQuery: '',
  rateOrigin: 'album',
  currentArtist: null,
  toast: null,
  justRegistered: false,
};

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(initialState);
  const [me, setMe] = useState<Me | null>(null);
  const [albumRatings, setAlbumRatings] = useState<Record<string, AlbumRatingInfo>>({});
  const [spotifyCovers, setSpotifyCovers] = useState<Record<string, string>>({});
  const [spotifyObscure, setSpotifyObscure] = useState<Record<string, CatalogAlbum[] | 'error'>>({});
  const [spotifyGenreArtists, setSpotifyGenreArtists] = useState<Record<string, CatalogArtist[] | 'error'>>({});
  const [myRatings, setMyRatings] = useState<RatingRecord[]>([]);
  const [lovedItems, setLovedItems] = useState<LovedItem[]>([]);
  const [friendRequests, setFriendRequests] = useState<{ incoming: FriendRequest[]; outgoing: FriendRequest[] }>({ incoming: [], outgoing: [] });
  const [recapCache, setRecapCache] = useState<Record<string, RecapData>>({});
  const [reviewsVersion, setReviewsVersion] = useState(0);
  const [fetchedAlbums, setFetchedAlbums] = useState<Record<string, Album>>({});
  const [failedAlbumIds, setFailedAlbumIds] = useState<Record<string, true>>({});
  const requestedAlbumIds = useRef<Set<string>>(new Set());
  const requestedRecapKeys = useRef<Set<string>>(new Set());
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastRegionFetched = useRef<string | null | undefined>(undefined);

  const patch = useCallback((p: Partial<AppState>) => setState((s) => ({ ...s, ...p })), []);
  const t = useCallback((key: TranslationKey, vars?: Record<string, string | number>) => translate(state.language, key, vars), [state.language]);

  const showToast = useCallback((msg: string) => {
    patch({ toast: msg });
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => patch({ toast: null }), 1700);
  }, [patch]);

  const refreshMe = useCallback(async () => {
    const res = await fetch('/api/me');
    if (res.status === 401 || res.status === 404) {
      setMe(null);
      // No account yet — guess a starting language from the browser so the
      // registration screen itself isn't stuck in Russian for everyone.
      const browserLang = typeof navigator !== 'undefined' ? navigator.language.slice(0, 2) : 'ru';
      const guessed = (['ru', 'en', 'fr', 'es', 'de'] as const).includes(browserLang as never) ? (browserLang as Language) : 'en';
      patch({ authStatus: 'anonymous', language: guessed });
      return;
    }
    if (!res.ok) return;
    const data: Me = await res.json();
    setMe(data);
    patch({ authStatus: 'ready', language: data.language || 'ru' });
  }, [patch]);

  const refreshAlbumRatings = useCallback(async () => {
    const { data } = await supabase.from('album_ratings').select('album_id, avg_stars, ratings_count');
    const map: Record<string, AlbumRatingInfo> = {};
    for (const row of data || []) {
      map[row.album_id as string] = { avg: Number(row.avg_stars), count: Number(row.ratings_count) };
    }
    setAlbumRatings(map);
  }, []);

  const refreshMyRatings = useCallback(async () => {
    const res = await fetch('/api/ratings/mine');
    if (!res.ok) return;
    setMyRatings(await res.json());
  }, []);

  const refreshLovedItems = useCallback(async () => {
    const res = await fetch('/api/loved');
    if (!res.ok) return;
    const data = await res.json();
    setLovedItems(data.items || []);
  }, []);

  const toggleLoved = useCallback(async (type: LovedItemType, title: string, artist?: string | null, itemId?: string | null, cover?: string | null) => {
    const res = await fetch('/api/loved', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, title, artist: artist ?? null, itemId: itemId ?? null, cover: cover ?? null }),
    });
    if (!res.ok) return;
    await refreshLovedItems();
  }, [refreshLovedItems]);

  const refreshFriendRequests = useCallback(async () => {
    const res = await fetch('/api/friends/requests');
    if (!res.ok) return;
    setFriendRequests(await res.json());
  }, []);

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 768px)');
    const update = () => patch({ view: mq.matches ? 'mobile' : 'desktop' });
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, [patch]);

  useEffect(() => { refreshMe(); }, [refreshMe]);
  useEffect(() => { refreshAlbumRatings(); }, [refreshAlbumRatings]);
  useEffect(() => {
    fetch('/api/spotify/covers')
      .then((res) => (res.ok ? res.json() : {}))
      .then(setSpotifyCovers)
      .catch(() => {});
  }, []);

  // Region-aware sections: refetched whenever the profile's region setting
  // changes (including the very first time it becomes known after login).
  useEffect(() => {
    if (state.authStatus !== 'ready') return;
    const region = me?.region ?? null;
    if (lastRegionFetched.current === region) return;
    lastRegionFetched.current = region;

    const marketQS = region ? `&market=${encodeURIComponent(region)}` : '';

    fetch(`/api/spotify/obscure?genre=Electronic${marketQS}`)
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((data) => setSpotifyObscure((s) => ({ ...s, Electronic: data })))
      .catch(() => setSpotifyObscure((s) => ({ ...s, Electronic: 'error' })));

    GENRE_BUCKETS.forEach((genre) => {
      fetch(`/api/spotify/genre-artists?genre=${encodeURIComponent(genre)}${marketQS}`)
        .then((res) => (res.ok ? res.json() : Promise.reject()))
        .then((data) => setSpotifyGenreArtists((s) => ({ ...s, [genre]: data })))
        .catch(() => setSpotifyGenreArtists((s) => ({ ...s, [genre]: 'error' })));
    });
  }, [state.authStatus, me?.region]);

  useEffect(() => { if (state.authStatus === 'ready') refreshMyRatings(); }, [state.authStatus, refreshMyRatings]);
  useEffect(() => { if (state.authStatus === 'ready') refreshLovedItems(); }, [state.authStatus, refreshLovedItems]);

  // Only a premium account's theme choice is ever applied — a non-premium
  // account can't reach the picker (server-gated too), but this is a second
  // real check, not just relying on the UI having stayed locked. An account
  // that's never touched the picker (accentTheme unset) gets no override at
  // all, so the base [data-theme="dark"|"light"] default — including the
  // light/dark distinction — stands exactly as it does for a free account.
  useEffect(() => {
    const root = document.documentElement;
    if (me?.isPremium && isThemeId(me.accentTheme)) {
      const toxicity: Toxicity = isToxicity(me.accentToxicity) ? me.accentToxicity : 'bright';
      const pair = THEME_PAIRS[me.accentTheme][toxicity];
      root.dataset.accent = me.accentTheme;
      root.dataset.toxicity = toxicity;
      root.style.setProperty('--lime', pair.lime);
      root.style.setProperty('--coral', pair.coral);
      root.style.setProperty('--on-accent', onAccentFor(pair.lime));
    } else {
      delete root.dataset.accent;
      delete root.dataset.toxicity;
      root.style.removeProperty('--lime');
      root.style.removeProperty('--coral');
      root.style.removeProperty('--on-accent');
    }
  }, [me?.isPremium, me?.accentTheme, me?.accentToxicity]);
  useEffect(() => { if (state.authStatus === 'ready') refreshFriendRequests(); }, [state.authStatus, refreshFriendRequests]);

  const registerWithPassword = useCallback(async (name: string, email: string, password: string) => {
    const res = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: null }));
      throw new Error(err.error || 'signup_failed');
    }
    await refreshMe();
    patch({ justRegistered: true });
  }, [refreshMe, patch]);

  const dismissOnboarding = useCallback(() => patch({ justRegistered: false }), [patch]);

  const loginWithPassword = useCallback(async (email: string, password: string) => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: null }));
      throw new Error(err.error || 'login_failed');
    }
    await refreshMe();
  }, [refreshMe]);

  const claimAccount = useCallback(async (email: string, password: string) => {
    const res = await fetch('/api/auth/claim', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: null }));
      throw new Error(err.error || 'claim_failed');
    }
    await refreshMe();
  }, [refreshMe]);

  const logout = useCallback(async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setMe(null);
    patch({ authStatus: 'anonymous' });
  }, [patch]);

  const deleteAccount = useCallback(async (): Promise<boolean> => {
    const res = await fetch('/api/me', { method: 'DELETE' });
    if (!res.ok) return false;
    setMe(null);
    patch({ authStatus: 'anonymous' });
    return true;
  }, [patch]);

  const showScreen = useCallback((name: ScreenName) => patch({ activeScreen: name, navAction: 'push' }), [patch]);
  const goBack = useCallback((name: ScreenName) => patch({ activeScreen: name, navAction: 'pop' }), [patch]);
  const openAlbum = useCallback((id: string) => patch({ currentAlbumId: id, activeScreen: 'album', navAction: 'push' }), [patch]);

  const openRateFor = useCallback((id: string, origin: RateOrigin) => {
    setState((s) => {
      const existing = myRatings.find((r) => r.albumId === id);
      return {
        ...s,
        currentAlbumId: id,
        rateOrigin: origin,
        ratingValue: existing ? existing.stars : 0,
        ratingDraftText: existing ? existing.review || '' : '',
        activeScreen: 'rate',
        navAction: 'push',
      };
    });
  }, [myRatings]);

  const viewFriend = useCallback((id: string) => patch({ viewingUserId: id, activeScreen: 'friend', navAction: 'push' }), [patch]);
  const openRecap = useCallback((userId: string) => {
    setState((s) => ({ ...s, recapViewUserId: userId, recapOrigin: s.activeScreen, activeScreen: 'recap', navAction: 'push' }));
  }, []);
  const closeRecap = useCallback(() => {
    setState((s) => ({ ...s, activeScreen: s.recapOrigin || 'catalog', navAction: 'pop' }));
  }, []);

  const setSearchQuery = useCallback((q: string) => patch({ searchQuery: q }), [patch]);
  const setActiveGenre = useCallback((g: string) => patch({ activeGenre: g }), [patch]);
  const setSortBy = useCallback((sVal: SortBy) => patch({ sortBy: sVal }), [patch]);
  const setHistoryQuery = useCallback((q: string) => patch({ historyQuery: q }), [patch]);
  const setRecapPeriod = useCallback((p: RecapPeriod) => patch({ recapPeriod: p, recapSeasonKey: null }), [patch]);
  const setRecapSeasonKey = useCallback((key: string | null) => patch({ recapSeasonKey: key }), [patch]);
  const setRatingValue = useCallback((v: number) => patch({ ratingValue: v }), [patch]);
  const setRatingDraftText = useCallback((t: string) => patch({ ratingDraftText: t }), [patch]);

  const ensureRecap = useCallback((userId: string, period: RecapPeriod, seasonKey?: string | null) => {
    const targetId = userId === 'me' ? me?.id : userId;
    if (!targetId) return;
    const key = `${targetId}:${period}${seasonKey ? ':' + seasonKey : ''}`;
    if (requestedRecapKeys.current.has(key)) return;
    requestedRecapKeys.current.add(key);
    const seasonQS = seasonKey ? `&season=${encodeURIComponent(seasonKey)}` : '';
    fetch(`/api/recap?period=${period}&userId=${targetId}${seasonQS}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data: RecapData | null) => {
        if (data) setRecapCache((s) => ({ ...s, [key]: data }));
        else requestedRecapKeys.current.delete(key);
      })
      .catch(() => requestedRecapKeys.current.delete(key));
  }, [me]);

  const [recapSeasons, setRecapSeasons] = useState<SeasonOption[] | null>(null);
  useEffect(() => {
    if (state.activeScreen !== 'recap' || state.recapPeriod !== 'season') return;
    const targetId = state.recapViewUserId === 'me' ? me?.id : state.recapViewUserId;
    if (!targetId) return;
    let cancelled = false;
    setRecapSeasons(null);
    fetch(`/api/recap/seasons?userId=${targetId}`)
      .then((res) => (res.ok ? res.json() : { seasons: [] }))
      .then((data: { seasons: SeasonOption[] }) => { if (!cancelled) setRecapSeasons(data.seasons); })
      .catch(() => { if (!cancelled) setRecapSeasons([]); });
    return () => { cancelled = true; };
  }, [state.activeScreen, state.recapPeriod, state.recapViewUserId, me]);

  const publishRating = useCallback(async (albumId: string, stars: number, review: string, tags: string[] = []) => {
    const isEditing = myRatings.some((r) => r.albumId === albumId);
    const res = await fetch('/api/ratings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ albumId, stars, review, tags }),
    });
    if (!res.ok) {
      showToast(t('toast.ratingSaveFailed'));
      return;
    }
    await Promise.all([refreshMyRatings(), refreshAlbumRatings(), refreshMe()]);
    setReviewsVersion((v) => v + 1);
    setState((s) => ({
      ...s,
      ratingValue: 0,
      ratingDraftText: '',
      activeScreen: s.rateOrigin === 'history' ? 'history' : 'album',
      navAction: 'pop',
    }));
    showToast(isEditing ? t('toast.ratingUpdated') : t('toast.published'));
  }, [myRatings, refreshMyRatings, refreshAlbumRatings, refreshMe, showToast, t]);

  const updateProfileName = useCallback(async (name: string) => {
    await fetch('/api/me', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name }) });
    await refreshMe();
  }, [refreshMe]);

  const updateProfileHandle = useCallback(async (handle: string) => {
    await fetch('/api/me', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ handle }) });
    await refreshMe();
  }, [refreshMe]);

  const updateAvatar = useCallback(async (dataUrl: string) => {
    await fetch('/api/me', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ avatarUrl: dataUrl }) });
    await refreshMe();
  }, [refreshMe]);

  const updateBanner = useCallback(async (dataUrl: string) => {
    await fetch('/api/me', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ bannerUrl: dataUrl }) });
    await refreshMe();
  }, [refreshMe]);

  const updateAccentTheme = useCallback(async (theme: string) => {
    await fetch('/api/me', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ accentTheme: theme }) });
    await refreshMe();
  }, [refreshMe]);

  const updateAccentToxicity = useCallback(async (toxicity: string) => {
    await fetch('/api/me', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ accentToxicity: toxicity }) });
    await refreshMe();
  }, [refreshMe]);

  const updateLanguage = useCallback(async (language: Language) => {
    patch({ language });
    setMe((prev) => (prev ? { ...prev, language } : prev));
    await fetch('/api/me', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ language }) });
  }, [patch]);

  const updateRegion = useCallback(async (region: string | null) => {
    setMe((prev) => (prev ? { ...prev, region } : prev));
    await fetch('/api/me', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ region }) });
  }, []);

  const addFriend = useCallback(async (handle: string) => {
    const res = await fetch('/api/friends', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ handle }) });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      if (data.error === 'already_friends') showToast(t('toast.friendAlreadyAdded'));
      else if (data.error === 'not_found') showToast(t('toast.friendNotFound'));
      else showToast(t('toast.friendAddFailed'));
      return;
    }
    if (data.status === 'accepted') {
      await refreshMe();
      showToast(t('toast.friendAdded'));
    } else {
      await refreshFriendRequests();
      showToast(t('toast.friendRequestSent'));
    }
  }, [refreshMe, refreshFriendRequests, showToast, t]);

  const respondToFriendRequest = useCallback(async (requestId: number, action: 'accept' | 'decline') => {
    const res = await fetch('/api/friends/respond', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ requestId, action }),
    });
    if (!res.ok) {
      showToast(t('toast.friendRequestFailed'));
      return;
    }
    await Promise.all([refreshFriendRequests(), action === 'accept' ? refreshMe() : Promise.resolve()]);
    showToast(action === 'accept' ? t('toast.friendAdded') : t('toast.friendRequestDeclined'));
  }, [refreshFriendRequests, refreshMe, showToast, t]);

  const syncSpotify = useCallback(async () => {
    const res = await fetch('/api/sync', { method: 'POST' });
    if (!res.ok) {
      showToast(t('toast.syncFailed'));
      return;
    }
    const { imported } = await res.json();
    showToast(imported > 0 ? t('toast.syncedTracks', { count: imported }) : t('toast.syncNoNew'));
    requestedRecapKeys.current.clear();
    setRecapCache({});
  }, [showToast, t]);

  const onSpotifyConnected = useCallback(async () => {
    requestedRecapKeys.current.clear();
    setRecapCache({});
    await refreshMe();
  }, [refreshMe]);

  const importStreamingHistory = useCallback(async (files: File[]) => {
    const form = new FormData();
    for (const f of files) form.append('files', f);
    const res = await fetch('/api/spotify/import', { method: 'POST', body: form });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      if (data.error === 'file_too_large') showToast(t('toast.importFileTooLarge', { file: data.file || '' }));
      else if (data.error === 'too_many_files') showToast(t('toast.importTooManyFiles'));
      else showToast(t('toast.importFailed'));
      return null;
    }
    const result = await res.json();
    requestedRecapKeys.current.clear();
    setRecapCache({});
    await refreshMe();
    showToast(result.imported > 0 ? t('toast.importedTracks', { count: result.imported }) : t('toast.importNoNew'));
    return result;
  }, [showToast, t, refreshMe]);

  // `id` is what the rest of the app looks the album up by (a catalog slug
  // like "ok-computer", or a raw Spotify id for anything sourced live).
  // `spotifyId` is what to actually fetch — for catalog albums that's a
  // different value than `id`; for everything else they're the same.
  const ensureLiveAlbum = useCallback((id: string, spotifyId?: string) => {
    if (!id || requestedAlbumIds.current.has(id)) return;
    requestedAlbumIds.current.add(id);
    fetch(`/api/spotify/album/${spotifyId || id}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((detail: AlbumDetail | null) => {
        requestedAlbumIds.current.delete(id);
        if (detail) {
          setFetchedAlbums((s) => ({ ...s, [id]: albumDetailToAlbum(detail, id) }));
          setFailedAlbumIds((s) => { if (!(id in s)) return s; const n = { ...s }; delete n[id]; return n; });
        } else {
          setFailedAlbumIds((s) => ({ ...s, [id]: true }));
        }
      })
      .catch(() => {
        requestedAlbumIds.current.delete(id);
        setFailedAlbumIds((s) => ({ ...s, [id]: true }));
      });
  }, []);

  const openSpotifyArtist = useCallback(async (id: string) => {
    setState((s) => ({
      ...s,
      currentArtist: { id, name: s.currentArtist?.id === id ? s.currentArtist.name : '', source: 'spotify', albums: null, loading: true, error: null },
      activeScreen: 'artist',
      navAction: 'push',
    }));
    try {
      const res = await fetch(`/api/spotify/artist/${id}`);
      if (!res.ok) throw new Error(String(res.status));
      const data = await res.json();
      setState((s) => ({
        ...s,
        currentArtist: s.currentArtist && s.currentArtist.id === id
          ? {
            ...s.currentArtist,
            name: data.name,
            photo: data.photo,
            genres: data.genres,
            followers: data.followers,
            popularity: data.popularity,
            releasedAlbums: data.releasedAlbums,
            upcomingAlbums: data.upcomingAlbums,
            loading: false,
          }
          : s.currentArtist,
      }));
    } catch {
      const message = t('artist.loadError');
      setState((s) => ({
        ...s,
        currentArtist: s.currentArtist && s.currentArtist.id === id
          ? { ...s.currentArtist, loading: false, error: message }
          : s.currentArtist,
      }));
    }
  }, [t]);

  const openArtist = useCallback(async (mbid: string, name: string) => {
    setState((s) => ({
      ...s,
      currentArtist: { id: mbid, name, source: 'musicbrainz', albums: null, loading: true, error: null },
      activeScreen: 'artist',
      navAction: 'push',
    }));
    try {
      const { fetchArtistReleaseGroups } = await import('./musicbrainz');
      const releaseGroups = await fetchArtistReleaseGroups(mbid);
      setState((s) => ({
        ...s,
        currentArtist: s.currentArtist && s.currentArtist.id === mbid
          ? { ...s.currentArtist, albums: releaseGroups, loading: false }
          : s.currentArtist,
      }));
    } catch {
      const isFileProtocol = typeof location !== 'undefined' && location.protocol === 'file:';
      const message = isFileProtocol ? t('artist.fileProtocolError') : t('artist.loadError');
      setState((s) => ({
        ...s,
        currentArtist: s.currentArtist && s.currentArtist.id === mbid
          ? { ...s.currentArtist, loading: false, error: message }
          : s.currentArtist,
      }));
    }
  }, [t]);

  const liveAlbums = useMemo(() => {
    const map: Record<string, Album> = {};
    for (const list of Object.values(spotifyObscure)) {
      if (Array.isArray(list)) for (const a of list) map[a.id] = catalogAlbumToAlbum(a);
    }
    for (const [id, a] of Object.entries(fetchedAlbums)) map[id] = a;
    return map;
  }, [spotifyObscure, fetchedAlbums]);

  const value = useMemo<AppContextValue>(() => ({
    state, language: state.language, t, albums: ALBUMS, me, albumRatings, spotifyCovers, liveAlbums, failedAlbumIds,
    spotifyObscure, spotifyGenreArtists, myRatings, lovedItems, toggleLoved, friendRequests, recapCache, reviewsVersion,
    showScreen, goBack, openAlbum, openRateFor, viewFriend, openRecap, closeRecap,
    setSearchQuery, setActiveGenre, setSortBy, setHistoryQuery, setRecapPeriod, setRecapSeasonKey, recapSeasons,
    setRatingValue, setRatingDraftText, publishRating, ensureRecap,
    registerWithPassword, dismissOnboarding, loginWithPassword, claimAccount, logout, deleteAccount,
    updateProfileName, updateProfileHandle, updateAvatar, updateBanner, updateAccentTheme, updateAccentToxicity, updateLanguage, updateRegion,
    addFriend, respondToFriendRequest, syncSpotify, onSpotifyConnected, importStreamingHistory, openArtist, openSpotifyArtist, ensureLiveAlbum, showToast,
  }), [state, t, me, albumRatings, spotifyCovers, liveAlbums, failedAlbumIds, spotifyObscure,
    spotifyGenreArtists, myRatings, lovedItems, toggleLoved, friendRequests, recapCache, reviewsVersion, showScreen, goBack, openAlbum, openRateFor,
    setRecapSeasonKey, recapSeasons,
    viewFriend, openRecap, closeRecap, setSearchQuery, setActiveGenre, setSortBy, setHistoryQuery,
    setRecapPeriod, setRatingValue, setRatingDraftText, publishRating, ensureRecap,
    registerWithPassword, dismissOnboarding, loginWithPassword, claimAccount, logout, deleteAccount,
    updateProfileName, updateProfileHandle, updateAvatar, updateBanner, updateAccentTheme, updateAccentToxicity, updateLanguage, updateRegion,
    addFriend, respondToFriendRequest, syncSpotify, onSpotifyConnected, importStreamingHistory, openArtist, openSpotifyArtist, ensureLiveAlbum, showToast]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
