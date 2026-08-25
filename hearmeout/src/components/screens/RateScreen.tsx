'use client';

import { useEffect, useState } from 'react';
import { useApp } from '@/lib/AppContext';
import type { Device } from '@/lib/types';
import { CoverArt } from '../ui/CoverArt';
import { StarPicker } from '../ui/StarPicker';

export function RateScreen({ device }: { device: Device }) {
  const { state, t, albums, liveAlbums, myRatings, spotifyCovers, showScreen, setRatingValue, publishRating, showToast } = useApp();
  const a = liveAlbums[state.currentAlbumId] || albums.find((x) => x.id === state.currentAlbumId) || albums[0];
  const cover = spotifyCovers[a.id] || a.cover;
  const [text, setText] = useState(state.ratingDraftText);

  useEffect(() => setText(state.ratingDraftText), [state.currentAlbumId, state.ratingDraftText]);

  const val = state.ratingValue || 0;
  const label = val > 0 ? t('rate.hintValue', { value: val.toFixed(1) }) : t('rate.hintEmpty');
  const isEditing = myRatings.some((r) => r.albumId === a.id);

  const inner = (
    <>
      <div className="eyebrow">{isEditing ? t('rate.editTitle') : t('rate.newTitle')}</div>
      <CoverArt
        url={cover}
        fallbackLetter={a.artist[0] || '?'}
        className="rate-art"
        style={device === 'desktop' ? { marginLeft: 'auto', marginRight: 'auto' } : undefined}
      />
      <h1 className="page-title" style={{ textAlign: 'center', marginBottom: 0 }}>{a.title}</h1>
      <div className="rate-star-block">
        <StarPicker value={val} onChange={setRatingValue} />
      </div>
      <div className="vu-label">{label}</div>
      <textarea
        className="review-box"
        placeholder={t('rate.reviewPlaceholder')}
        value={text}
        onChange={(e) => setText(e.target.value)}
      />
      <button
        className="btn-primary"
        style={device === 'desktop' ? { width: '100%' } : undefined}
        onClick={() => {
          if (val <= 0) { showToast(t('rate.needStars')); return; }
          publishRating(a.id, val, text.trim());
        }}
      >
        {isEditing ? t('rate.save') : t('rate.publish')}
      </button>
    </>
  );

  const back = (
    <button className="back-btn" onClick={() => showScreen(state.rateOrigin === 'history' ? 'history' : 'album')}>
      {t('rate.back')}
    </button>
  );

  if (device === 'mobile') return <>{back}<div className="rate-wrap">{inner}</div></>;
  return <>{back}<div className="d-rate-panel">{inner}</div></>;
}
