'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { ALBUMS } from './data';
import { supabase } from './supabaseClient';
import { translate, type Language, type TranslationKey } from './i18n';
import type {
  Album, AlbumRatingInfo, ArtistState, Device, Me, RatingRecord, RecapData, RecapPeriod, ScreenName,
} from './types';
import type { AlbumDetail, CatalogAlbum, CatalogArtist } from './spotifyCatalog';

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
  currentAlbumId: string;
  viewingUserId: string;
  recapPeriod: RecapPeriod;
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
  spotifyNew: CatalogAlbum[] | 'error' | null;
  spotifyNewRegional: CatalogAlbum[] | 'error' | null;
  spotifyObscure: Record<string, CatalogAlbum[] | 'error'>;
  spotifyGenreArtists: Record<string, CatalogArtist[] | 'error'>;
  myRatings: RatingRecord[];
  recapCache: Record<string, RecapData>;
  reviewsVersion: number;
  showScreen: (name: ScreenName) => void;
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
  setRatingValue: (v: number) => void;
  setRatingDraftText: (t: string) => void;
  publishRating: (albumId: string, stars: number, review: string) => Promise<void>;
  ensureRecap: (userId: string, period: RecapPeriod) => void;
  register: (name: string) => Promise<void>;
  updateProfileName: (name: string) => Promise<void>;
  updateProfileHandle: (handle: string) => Promise<void>;
  updateAvatar: (dataUrl: string) => Promise<void>;
  updateLanguage: (language: Language) => Promise<void>;
  updateRegion: (region: string | null) => Promise<void>;
  addFriend: (handle: string) => Promise<void>;
  syncSpotify: () => Promise<void>;
  onSpotifyConnected: () => Promise<void>;
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
  currentAlbumId: ALBUMS[0]?.id ?? '',
  viewingUserId: '',
  recapPeriod: 'day',
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
};

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(initialState);
  const [me, setMe] = useState<Me | null>(null);
  const [albumRatings, setAlbumRatings] = useState<Record<string, AlbumRatingInfo>>({});
  const [spotifyCovers, setSpotifyCovers] = useState<Record<string, string>>({});
  const [spotifyNew, setSpotifyNew] = useState<CatalogAlbum[] | 'error' | null>(null);
  const [spotifyNewRegional, setSpotifyNewRegional] = useState<CatalogAlbum[] | 'error' | null>(null);
  const [spotifyObscure, setSpotifyObscure] = useState<Record<string, CatalogAlbum[] | 'error'>>({});
  const [spotifyGenreArtists, setSpotifyGenreArtists] = useState<Record<string, CatalogArtist[] | 'error'>>({});
  const [myRatings, setMyRatings] = useState<RatingRecord[]>([]);
  const [recapCache, setRecapCache] = useState<Record<string, RecapData>>({});
  const [reviewsVersion, setReviewsVersion] = useState(0);
  const [fetchedAlbums, setFetchedAlbums] = useState<Record<string, Album>>({});
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
    if (res.status === 401) {
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

  // Fetched once here (not per-component) since both the mobile and desktop
  // shells are always mounted — fetching in each consumer would double every
  // request and reliably trip Spotify's search rate limit.
  useEffect(() => {
    fetch('/api/spotify/new')
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then(setSpotifyNew)
      .catch(() => setSpotifyNew('error'));
  }, []);

  // Region-aware sections: refetched whenever the profile's region setting
  // changes (including the very first time it becomes known after login).
  useEffect(() => {
    if (state.authStatus !== 'ready') return;
    const region = me?.region ?? null;
    if (lastRegionFetched.current === region) return;
    lastRegionFetched.current = region;

    const marketQS = region ? `&market=${encodeURIComponent(region)}` : '';

    if (region) {
      fetch(`/api/spotify/new?market=${encodeURIComponent(region)}`)
        .then((res) => (res.ok ? res.json() : Promise.reject()))
        .then(setSpotifyNewRegional)
        .catch(() => setSpotifyNewRegional('error'));
    } else {
      setSpotifyNewRegional(null);
    }

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

  const register = useCallback(async (name: string) => {
    const res = await fetch('/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: null }));
      throw new Error(err.error || t('register.failed'));
    }
    await refreshMe();
  }, [refreshMe, t]);

  const showScreen = useCallback((name: ScreenName) => patch({ activeScreen: name }), [patch]);
  const openAlbum = useCallback((id: string) => patch({ currentAlbumId: id, activeScreen: 'album' }), [patch]);

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
      };
    });
  }, [myRatings]);

  const viewFriend = useCallback((id: string) => patch({ viewingUserId: id, activeScreen: 'friend' }), [patch]);
  const openRecap = useCallback((userId: string) => {
    setState((s) => ({ ...s, recapViewUserId: userId, recapOrigin: s.activeScreen, activeScreen: 'recap' }));
  }, []);
  const closeRecap = useCallback(() => {
    setState((s) => ({ ...s, activeScreen: s.recapOrigin || 'catalog' }));
  }, []);

  const setSearchQuery = useCallback((q: string) => patch({ searchQuery: q }), [patch]);
  const setActiveGenre = useCallback((g: string) => patch({ activeGenre: g }), [patch]);
  const setSortBy = useCallback((sVal: SortBy) => patch({ sortBy: sVal }), [patch]);
  const setHistoryQuery = useCallback((q: string) => patch({ historyQuery: q }), [patch]);
  const setRecapPeriod = useCallback((p: RecapPeriod) => patch({ recapPeriod: p }), [patch]);
  const setRatingValue = useCallback((v: number) => patch({ ratingValue: v }), [patch]);
  const setRatingDraftText = useCallback((t: string) => patch({ ratingDraftText: t }), [patch]);

  const ensureRecap = useCallback((userId: string, period: RecapPeriod) => {
    const targetId = userId === 'me' ? me?.id : userId;
    if (!targetId) return;
    const key = `${targetId}:${period}`;
    if (requestedRecapKeys.current.has(key)) return;
    requestedRecapKeys.current.add(key);
    fetch(`/api/recap?period=${period}&userId=${targetId}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data: RecapData | null) => {
        if (data) setRecapCache((s) => ({ ...s, [key]: data }));
        else requestedRecapKeys.current.delete(key);
      })
      .catch(() => requestedRecapKeys.current.delete(key));
  }, [me]);

  const publishRating = useCallback(async (albumId: string, stars: number, review: string) => {
    const isEditing = myRatings.some((r) => r.albumId === albumId);
    const res = await fetch('/api/ratings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ albumId, stars, review }),
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
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: null }));
      showToast(err.error === 'not_found' ? t('toast.friendNotFound') : t('toast.friendAddFailed'));
      return;
    }
    await refreshMe();
    showToast(t('toast.friendAdded'));
  }, [refreshMe, showToast, t]);

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
        if (detail) setFetchedAlbums((s) => ({ ...s, [id]: albumDetailToAlbum(detail, id) }));
        else requestedAlbumIds.current.delete(id);
      })
      .catch(() => requestedAlbumIds.current.delete(id));
  }, []);

  const openSpotifyArtist = useCallback(async (id: string) => {
    setState((s) => ({
      ...s,
      currentArtist: { id, name: s.currentArtist?.id === id ? s.currentArtist.name : '', source: 'spotify', albums: null, loading: true, error: null },
      activeScreen: 'artist',
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
    } catch (err) {
      const message = t('artist.loadError', { error: err instanceof Error ? err.message : String(err) });
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
    } catch (err) {
      const isFileProtocol = typeof location !== 'undefined' && location.protocol === 'file:';
      const message = isFileProtocol
        ? t('artist.fileProtocolError')
        : t('artist.loadError', { error: err instanceof Error ? err.message : String(err) });
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
    if (Array.isArray(spotifyNew)) {
      for (const a of spotifyNew) map[a.id] = catalogAlbumToAlbum(a);
    }
    if (Array.isArray(spotifyNewRegional)) {
      for (const a of spotifyNewRegional) map[a.id] = catalogAlbumToAlbum(a);
    }
    for (const list of Object.values(spotifyObscure)) {
      if (Array.isArray(list)) for (const a of list) map[a.id] = catalogAlbumToAlbum(a);
    }
    for (const [id, a] of Object.entries(fetchedAlbums)) map[id] = a;
    return map;
  }, [spotifyNew, spotifyNewRegional, spotifyObscure, fetchedAlbums]);

  const value = useMemo<AppContextValue>(() => ({
    state, language: state.language, t, albums: ALBUMS, me, albumRatings, spotifyCovers, liveAlbums,
    spotifyNew, spotifyNewRegional, spotifyObscure, spotifyGenreArtists, myRatings, recapCache, reviewsVersion,
    showScreen, openAlbum, openRateFor, viewFriend, openRecap, closeRecap,
    setSearchQuery, setActiveGenre, setSortBy, setHistoryQuery, setRecapPeriod,
    setRatingValue, setRatingDraftText, publishRating, ensureRecap, register,
    updateProfileName, updateProfileHandle, updateAvatar, updateLanguage, updateRegion,
    addFriend, syncSpotify, onSpotifyConnected, openArtist, openSpotifyArtist, ensureLiveAlbum, showToast,
  }), [state, t, me, albumRatings, spotifyCovers, liveAlbums, spotifyNew, spotifyNewRegional, spotifyObscure,
    spotifyGenreArtists, myRatings, recapCache, reviewsVersion, showScreen, openAlbum, openRateFor,
    viewFriend, openRecap, closeRecap, setSearchQuery, setActiveGenre, setSortBy, setHistoryQuery,
    setRecapPeriod, setRatingValue, setRatingDraftText, publishRating, ensureRecap, register,
    updateProfileName, updateProfileHandle, updateAvatar, updateLanguage, updateRegion,
    addFriend, syncSpotify, onSpotifyConnected, openArtist, openSpotifyArtist, ensureLiveAlbum, showToast]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
