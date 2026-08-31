'use client';

import { useEffect, useState } from 'react';
import { useApp } from '@/lib/AppContext';
import type { Device } from '@/lib/types';
import { CoverArt } from '../ui/CoverArt';
import { StarPicker } from '../ui/StarPicker';
import { REVIEW_TAG_ORDER, REVIEW_TAG_LABEL_KEY, MAX_REVIEW_TAGS } from '@/lib/reviewTags';

export function RateScreen({ device }: { device: Device }) {
  const { state, t, albums, liveAlbums, failedAlbumIds, myRatings, spotifyCovers, goBack, setRatingValue, publishRating, showToast, ensureLiveAlbum } = useApp();
  const staticMatch = albums.find((x) => x.id === state.currentAlbumId);
  const enriched = liveAlbums[state.currentAlbumId];
  // No `|| albums[0]` fallback: rating whichever album happens to be first
  // in the catalog because this one failed to load is worse than a blank
  // screen — it silently writes a real rating onto the wrong album.
  const a = enriched || staticMatch;

  useEffect(() => {
    if (state.activeScreen === 'rate' && !enriched) ensureLiveAlbum(state.currentAlbumId, staticMatch?.spotifyId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.activeScreen, state.currentAlbumId, enriched]);

  const [text, setText] = useState(state.ratingDraftText);
  useEffect(() => setText(state.ratingDraftText), [state.currentAlbumId, state.ratingDraftText]);

  const existing = myRatings.find((r) => r.albumId === state.currentAlbumId);
  // Every screen stays mounted for the whole session (dual-mount shells),
  // so this effect can't just depend on currentAlbumId — that value is
  // often already set (from the album screen) by the time this screen
  // becomes active, so it never "changes" again even once myRatings
  // finishes its async load. Depending on the tag content itself (as a
  // stable joined string, not the array reference, which is a fresh object
  // on every myRatings refresh) makes it react to the data actually
  // arriving instead of only to currentAlbumId changing.
  const existingTagsKey = (existing?.tags ?? []).join(',');
  const [tags, setTags] = useState<string[]>(existing?.tags ?? []);
  useEffect(() => setTags(existing?.tags ?? []), [state.currentAlbumId, existingTagsKey]); // eslint-disable-line react-hooks/exhaustive-deps
  const toggleTag = (id: string) => {
    setTags((cur) => {
      if (cur.includes(id)) return cur.filter((x) => x !== id);
      if (cur.length >= MAX_REVIEW_TAGS) return cur;
      return [...cur, id];
    });
  };

  const back = (
    <button className="back-btn" onClick={() => goBack(state.rateOrigin === 'history' ? 'history' : 'album')}>
      {t('rate.back')}
    </button>
  );

  if (!a) {
    const failed = !!failedAlbumIds[state.currentAlbumId];
    return <>{back}<div className="empty-state">{failed ? t('album.loadError') : t('album.loading')}</div></>;
  }

  const cover = spotifyCovers[a.id] || a.cover;
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

      <div className="rate-card">
        <div className="rate-card-label">{t('rate.yourRating')}</div>
        <div className="rate-score-row">
          <StarPicker value={val} onChange={setRatingValue} />
          {val > 0 && <span className="rate-score-num">{val.toFixed(1)}</span>}
        </div>
        <div className="rate-hint">{label}</div>
      </div>

      <div className="review-compose-card">
        <div className="review-compose-head">
          <span className="review-compose-label">{t('rate.tagsLabel')}</span>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 14 }}>
          {REVIEW_TAG_ORDER.map((id) => (
            <button key={id} className={`chip ${tags.includes(id) ? 'on' : ''}`} onClick={() => toggleTag(id)}>
              {t(REVIEW_TAG_LABEL_KEY[id])}
            </button>
          ))}
        </div>
        <div className="review-compose-head">
          <span className="review-compose-label">{t('rate.reviewLabel')}</span>
          <span className="review-compose-count">{text.length} / 2000</span>
        </div>
        <textarea
          className="review-textarea"
          placeholder={t('rate.reviewPlaceholder')}
          value={text}
          maxLength={2000}
          onChange={(e) => setText(e.target.value)}
        />
      </div>

      <button
        className="btn-primary"
        style={device === 'desktop' ? { width: '100%' } : undefined}
        onClick={() => {
          if (val <= 0) { showToast(t('rate.needStars')); return; }
          publishRating(a.id, val, text.trim(), tags);
        }}
      >
        {isEditing ? t('rate.save') : t('rate.publish')}
      </button>
    </>
  );

  if (device === 'mobile') return <>{back}<div className="rate-wrap">{inner}</div></>;
  return <>{back}<div className="d-rate-panel">{inner}</div></>;
}
