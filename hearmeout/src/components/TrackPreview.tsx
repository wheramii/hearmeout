'use client';

import { useEffect, useState } from 'react';
import { fetchTrackPreview } from '@/lib/deezer';

type Status = 'loading' | 'found' | 'notfound' | 'error';

export function TrackPreview({ artist, title }: { artist: string; title: string }) {
  const [status, setStatus] = useState<Status>('loading');
  const [track, setTrack] = useState<{ title: string; preview: string } | null>(null);
  const [errMsg, setErrMsg] = useState('');

  useEffect(() => {
    let cancelled = false;
    setStatus('loading');
    fetchTrackPreview(artist, title)
      .then((t) => {
        if (cancelled) return;
        if (!t) { setStatus('notfound'); return; }
        setTrack(t);
        setStatus('found');
      })
      .catch((err) => {
        if (cancelled) return;
        const isFileProtocol = typeof location !== 'undefined' && location.protocol === 'file:';
        setErrMsg(isFileProtocol
          ? 'Требует хостинга — не работает при открытии файла напрямую (file://).'
          : 'Не удалось получить превью с Deezer сейчас.');
        void err;
        setStatus('error');
      });
    return () => { cancelled = true; };
  }, [artist, title]);

  if (status === 'loading') return <div className="archive-loading">Ищу превью на Deezer…</div>;
  if (status === 'notfound') return <div className="empty-state">Превью не найдено на Deezer</div>;
  if (status === 'error') return <div className="empty-state">{errMsg}</div>;
  return (
    <>
      <div className="dz-preview-label">30-сек превью «{track!.title}» · Deezer</div>
      <audio controls style={{ width: '100%', height: 36 }} src={track!.preview} />
    </>
  );
}
