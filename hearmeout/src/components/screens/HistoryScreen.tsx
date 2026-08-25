'use client';

import { useApp } from '@/lib/AppContext';
import type { Device, RatingRecord } from '@/lib/types';
import { CoverArt } from '../ui/CoverArt';
import { starsText, formatRelativeRu } from '@/lib/format';
import { SearchIcon } from './CatalogScreen';

function HistoryItem({ rating }: { rating: RatingRecord }) {
  const { albums, liveAlbums, spotifyCovers, openRateFor } = useApp();
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
        <div className="when">{formatRelativeRu(rating.createdAt)}</div>
      </div>
    </div>
  );
}

// device is unused: history looks identical on mobile/desktop, but every
// screen takes it so AppShell can mount them uniformly for both shells.
export function HistoryScreen(_props: { device: Device }) {
  const { state, me, albums, myRatings, setHistoryQuery } = useApp();
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
      <div className="eyebrow">История оценок</div>
      <h1 className="page-title">Ваши оценки</h1>
      <div className="search-bar">
        <SearchIcon />
        <input type="text" placeholder="Искать среди оценённых…" value={state.historyQuery || ''} onChange={(e) => setHistoryQuery(e.target.value)} />
      </div>
      <div className="stat-grid" style={{ marginBottom: 22 }}>
        <div className="box"><div className="v">{me.stats.ratings}</div><div className="l">ОЦЕНЕНО</div></div>
        <div className="box"><div className="v">{me.stats.reviews}</div><div className="l">С РЕЦЕНЗИЕЙ</div></div>
        <div className="box"><div className="v">{me.stats.avg || '—'}</div><div className="l">СР. БАЛЛ</div></div>
      </div>
      {ratings.length ? (
        ratings.map((r) => <HistoryItem key={r.albumId} rating={r} />)
      ) : q ? (
        <div className="empty-state">Ничего не найдено среди ваших оценок</div>
      ) : (
        <div className="empty-state">Вы ещё не оценили ни один альбом.<br />Откройте каталог и поставьте первую оценку.</div>
      )}
    </>
  );
}
