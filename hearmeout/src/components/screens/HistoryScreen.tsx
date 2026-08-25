'use client';

import { useApp } from '@/lib/AppContext';
import type { Device, RatingRecord } from '@/lib/types';
import { CoverArt } from '../ui/CoverArt';
import { starsText, formatRelative } from '@/lib/format';
import { SearchIcon } from './CatalogScreen';

function HistoryItem({ rating }: { rating: RatingRecord }) {
  const { albums, liveAlbums, spotifyCovers, language, openRateFor } = useApp();
  const a = albums.find((x) => x.id === rating.albumId) || liveAlbums[rating.albumId];
  if (!a) return null;
  const cover = spotifyCovers[a.id] || a.cover;
  return (
    <div className="activity-item" onClick={() => openRateFor(a.id, 'history')}>
      <CoverArt url={cover} fallbackLetter={a.artist[0] || '?'} className="thumb" />
      <div className="body">
        <div><b>{a.title}</b> — {a.artist}</div>
        <span className="stars-dot">{starsText(rating.stars)} {rating.stars.toFixed(1)}</span>
        {rating.review && <div style={{ color: '#CFC7C1', marginTop: 4 }}>{rating.review}</div>}
        <div className="when">{formatRelative(rating.createdAt, language)}</div>
      </div>
    </div>
  );
}

// device is unused: history looks identical on mobile/desktop, but every
// screen takes it so AppShell can mount them uniformly for both shells.
export function HistoryScreen(_props: { device: Device }) {
  const { state, t, me, albums, myRatings, setHistoryQuery } = useApp();
  if (!me) return null;
  const q = (state.historyQuery || '').trim().toLowerCase();
  let ratings = myRatings;
  if (q) {
    ratings = ratings.filter((r) => {
      const a = albums.find((x) => x.id === r.albumId);
      if (!a) return false;
      return a.title.toLowerCase().includes(q) || a.artist.toLowerCase().includes(q);
    });
  }

  return (
    <>
      <div className="eyebrow">{t('history.eyebrow')}</div>
      <h1 className="page-title">{t('history.title')}</h1>
      <div className="search-bar">
        <SearchIcon />
        <input type="text" placeholder={t('history.searchPlaceholder')} value={state.historyQuery || ''} onChange={(e) => setHistoryQuery(e.target.value)} />
      </div>
      <div className="stat-grid" style={{ marginBottom: 22 }}>
        <div className="box"><div className="v">{me.stats.ratings}</div><div className="l">{t('history.rated')}</div></div>
        <div className="box"><div className="v">{me.stats.reviews}</div><div className="l">{t('history.reviewed')}</div></div>
        <div className="box"><div className="v">{me.stats.avg || '—'}</div><div className="l">{t('history.avg')}</div></div>
      </div>
      {ratings.length ? (
        ratings.map((r) => <HistoryItem key={r.albumId} rating={r} />)
      ) : q ? (
        <div className="empty-state">{t('history.noResults')}</div>
      ) : (
        <div className="empty-state">{t('history.emptyLine1')}<br />{t('history.emptyLine2')}</div>
      )}
    </>
  );
}
