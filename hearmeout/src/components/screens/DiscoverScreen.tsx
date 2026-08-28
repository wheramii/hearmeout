'use client';

import { useEffect, useMemo, useState } from 'react';
import { useApp } from '@/lib/AppContext';
import type { Device } from '@/lib/types';
import { supabase } from '@/lib/supabaseClient';
import { userAvatarStyle, starsText, formatRelative } from '@/lib/format';
import { CoverArt } from '../ui/CoverArt';
import { AlbumCard } from '../ui/AlbumCard';
import { LiveLibrarySearch } from '../LiveLibrarySearch';
import { PopularNowSection } from '../PopularNowSection';
import { SearchIcon } from './CatalogScreen';
import { accentMix } from '@/lib/accentGradient';

type Filter = 'all' | 'albums' | 'artists' | 'people';

type PersonResult = { id: string; name: string; handle: string; avatarUrl: string | null };

function PersonRow({ person }: { person: PersonResult }) {
  const { t, me, friendRequests, addFriend, viewFriend } = useApp();
  if (!me) return null;
  const isMe = person.id === me.id;
  const isFriend = me.friends.some((f) => f.id === person.id);
  const isPending = friendRequests.outgoing.some((r) => r.user.id === person.id);
  return (
    <div className="friend-row">
      <div className="avatar-sm" style={userAvatarStyle(person)} />
      <div className="info" onClick={() => viewFriend(person.id)}>
        <div className="n">{person.name}</div>
        <div className="h">{person.handle}</div>
      </div>
      {isMe ? null : isFriend ? (
        <span className="chip" style={{ opacity: 0.6 }}>{t('friend.alreadyFriend')}</span>
      ) : isPending ? (
        <span className="chip" style={{ opacity: 0.6 }}>{t('friend.requestSent')}</span>
      ) : (
        <button onClick={() => addFriend(person.handle)}>{t('friend.addThem')}</button>
      )}
    </div>
  );
}

type SiteReview = { stars: number; review: string; createdAt: string; albumId: string; user: { name: string; handle: string; avatarUrl: string | null } };

function SiteReviewsBlock() {
  const { t, language, albums, liveAlbums, openAlbum } = useApp();
  const [reviews, setReviews] = useState<SiteReview[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    supabase
      .from('ratings')
      .select('stars, review, created_at, album_id, users(name, handle, avatar_url)')
      .not('review', 'is', null)
      .order('created_at', { ascending: false })
      .limit(8)
      .then(({ data }) => {
        if (cancelled) return;
        type Row = { stars: number; review: string | null; created_at: string; album_id: string; users: { name: string; handle: string; avatar_url: string | null } | null };
        const rows = (data || []) as unknown as Row[];
        setReviews(rows.filter((r) => r.review).map((r) => ({
          stars: r.stars, review: r.review as string, createdAt: r.created_at, albumId: r.album_id,
          user: { name: r.users?.name ?? '', handle: r.users?.handle ?? '', avatarUrl: r.users?.avatar_url ?? null },
        })));
      });
    return () => { cancelled = true; };
  }, []);

  if (reviews === null) return <div className="archive-loading">{t('reviews.loading')}</div>;
  const resolved = reviews
    .map((r) => ({ r, a: liveAlbums[r.albumId] || albums.find((x) => x.id === r.albumId) }))
    .filter((x): x is { r: SiteReview; a: NonNullable<typeof x.a> } => !!x.a)
    .slice(0, 5);
  if (!resolved.length) return <div className="empty-state">{t('reviews.empty')}</div>;

  return (
    <>
      {resolved.map(({ r, a }, i) => (
        <div className="review-card" key={i} onClick={() => openAlbum(a.id)} style={{ cursor: 'pointer' }}>
          <div className="head">
            <div className="user">
              <div className="avatar" style={userAvatarStyle(r.user)} />
              <div className="uname">{r.user.handle}</div>
            </div>
            <div className="review-card-meta">
              <span className="stars-dot" style={{ color: accentMix(r.stars / 5) }}>{starsText(r.stars)}</span>
              <span className="review-card-time">{formatRelative(r.createdAt, language)}</span>
            </div>
          </div>
          <p style={{ marginBottom: 4 }}>{r.review}</p>
          <div className="review-card-album">{a.title} — {a.artist}</div>
        </div>
      ))}
    </>
  );
}

export function DiscoverScreen({ device }: { device: Device }) {
  const { t, me, albums } = useApp();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const [people, setPeople] = useState<PersonResult[] | null>(null);
  const rowClass = device === 'mobile' ? 'row-scroll' : 'd-grid';
  const gridClass = device === 'mobile' ? 'grid-cards' : 'd-grid';

  const q = query.trim().toLowerCase();
  const showLive = q.length >= 2;

  useEffect(() => {
    if (!showLive || filter === 'albums' || filter === 'artists') { setPeople(null); return; }
    let cancelled = false;
    const timer = setTimeout(() => {
      fetch(`/api/users/search?q=${encodeURIComponent(query.trim())}`)
        .then((r) => (r.ok ? r.json() : []))
        .then((d) => { if (!cancelled) setPeople(d); });
    }, 350);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [query, showLive, filter]);

  const albumResults = useMemo(() => {
    if (!q) return [];
    return albums.filter((a) => a.title.toLowerCase().includes(q) || a.artist.toLowerCase().includes(q));
  }, [albums, q]);

  if (!me) return null;

  const FILTERS: { key: Filter; label: string }[] = [
    { key: 'all', label: t('discover.filterAll') },
    { key: 'albums', label: t('discover.filterAlbums') },
    { key: 'artists', label: t('discover.filterArtists') },
    { key: 'people', label: t('discover.filterPeople') },
  ];

  return (
    <>
      <div className="eyebrow">{t('discover.eyebrow')}</div>
      <h1 className="page-title">{t('discover.title')}</h1>
      <div className="search-bar">
        <SearchIcon />
        <input type="text" placeholder={t('search.placeholder')} value={query} onChange={(e) => setQuery(e.target.value)} />
      </div>
      <div className="chips">
        {FILTERS.map((f) => (
          <button key={f.key} className={`chip ${filter === f.key ? 'on' : ''}`} onClick={() => setFilter(f.key)}>{f.label}</button>
        ))}
      </div>

      {showLive ? (
        <>
          {filter !== 'people' && albumResults.length > 0 && (
            <>
              <div className="section-head"><h2>{t('catalog.inCatalog')}</h2><span>{albumResults.length}</span></div>
              <div className={gridClass}>{albumResults.map((a) => <AlbumCard key={a.id} album={a} />)}</div>
            </>
          )}
          {(filter === 'people') && (
            <>
              <div className="section-head" style={{ marginTop: 22 }}><h2>{t('discover.people')}</h2></div>
              {people === null ? <div className="archive-loading">{t('discover.searching')}</div> :
                people.length ? people.map((p) => <PersonRow key={p.id} person={p} />) : <div className="empty-state">{t('discover.noPeople')}</div>}
            </>
          )}
          {filter !== 'people' && filter !== 'albums' && (
            <>
              <div className="section-head" style={{ marginTop: 22 }}><h2>{t('catalog.openLibrary')}</h2><span>MusicBrainz</span></div>
              <LiveLibrarySearch query={query.trim()} />
            </>
          )}
        </>
      ) : (
        <>
          <div className="section-head"><h2>{t('catalog.popularNow')}</h2><span>{t('catalog.popularNowSubtitle')}</span></div>
          <PopularNowSection rowClass={rowClass} />
          <div className="section-head" style={{ marginTop: 26 }}><h2>{t('discover.reviewsWorthReading')}</h2></div>
          <SiteReviewsBlock />
        </>
      )}
    </>
  );
}
