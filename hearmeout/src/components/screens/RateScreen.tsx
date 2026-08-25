'use client';

import { useEffect, useState } from 'react';
import { useApp } from '@/lib/AppContext';
import type { Device } from '@/lib/types';
import { CoverArt } from '../ui/CoverArt';
import { StarPicker } from '../ui/StarPicker';

export function RateScreen({ device }: { device: Device }) {
  const { state, albums, liveAlbums, myRatings, spotifyCovers, showScreen, setRatingValue, publishRating, showToast } = useApp();
  const a = albums.find((x) => x.id === state.currentAlbumId) || liveAlbums[state.currentAlbumId] || albums[0];
  const cover = spotifyCovers[a.id] || a.cover;
  const [text, setText] = useState(state.ratingDraftText);

  useEffect(() => setText(state.ratingDraftText), [state.currentAlbumId, state.ratingDraftText]);

  const val = state.ratingValue || 0;
  const label = val > 0 ? `Оценка — ${val.toFixed(1)} / 5` : 'Проведите по звёздам — 0.0 / 5';
  const isEditing = myRatings.some((r) => r.albumId === a.id);

  const inner = (
    <>
      <div className="eyebrow">{isEditing ? 'Изменить оценку' : 'Оценка'}</div>
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
        placeholder="Напишите рецензию (необязательно)…"
        value={text}
        onChange={(e) => setText(e.target.value)}
      />
      <button
        className="btn-primary"
        style={device === 'desktop' ? { width: '100%' } : undefined}
        onClick={() => {
          if (val <= 0) { showToast('Сначала выберите оценку'); return; }
          publishRating(a.id, val, text.trim());
        }}
      >
        {isEditing ? 'Сохранить изменения' : 'Опубликовать'}
      </button>
    </>
  );

  const back = (
    <button className="back-btn" onClick={() => showScreen(state.rateOrigin === 'history' ? 'history' : 'album')}>
      ← Назад
    </button>
  );

  if (device === 'mobile') return <>{back}<div className="rate-wrap">{inner}</div></>;
  return <>{back}<div className="d-rate-panel">{inner}</div></>;
}
