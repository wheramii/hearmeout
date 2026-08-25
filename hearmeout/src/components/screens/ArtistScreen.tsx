'use client';

import { useApp } from '@/lib/AppContext';
import type { Device } from '@/lib/types';
import { coverArtUrl } from '@/lib/musicbrainz';
import { CoverArt } from '../ui/CoverArt';
import { ArtistAvatar } from '../ui/ArtistAvatar';

export function ArtistScreen({ device }: { device: Device }) {
  const { t, state, showScreen } = useApp();
  const art = state.currentArtist;
  const gridClass = device === 'mobile' ? 'grid-cards' : 'd-grid';

  if (!art) {
    return (
      <>
        <button className="back-btn" onClick={() => showScreen('catalog')}>{t('artist.back')}</button>
        <div className="empty-state">{t('artist.notSelected')}</div>
      </>
    );
  }

  let body;
  if (art.loading) {
    body = <div className="archive-loading">{t('artist.loadingAlbums')}</div>;
  } else if (art.error) {
    body = <div className="empty-state">{art.error}</div>;
  } else if (!art.albums || !art.albums.length) {
    body = <div className="empty-state">{t('artist.notFound')}</div>;
  } else {
    body = (
      <>
        <div className="section-head"><h2>{t('artist.albums')}</h2><span>{art.albums.length}</span></div>
        <div className={gridClass}>
          {art.albums.map((g) => {
            const year = g['first-release-date'] ? g['first-release-date'].slice(0, 4) : '—';
            const cover = coverArtUrl(g.id);
            return (
              <div className="cover" key={g.id}>
                <CoverArt url={cover} fallbackLetter={art.name[0] || '?'} className="art" />
                <div className="meta"><div className="t">{g.title}</div><div className="a">{year}</div></div>
              </div>
            );
          })}
        </div>
      </>
    );
  }

  return (
    <>
      <button className="back-btn" onClick={() => showScreen('catalog')}>{t('artist.back')}</button>
      <div className="album-hero">
        <ArtistAvatar name={art.name} className="art-lg cover-fallback" fallbackStyle={{ fontSize: 48 }} />
        <h1>{art.name}</h1>
        <div className="sub">{t('artist.subtitle')}</div>
      </div>
      {body}
    </>
  );
}
