'use client';

import { useEffect, useState } from 'react';
import { useApp } from '@/lib/AppContext';
import { fetchTrackPreview } from '@/lib/deezer';

type Status = 'loading' | 'found' | 'notfound' | 'error';

export function TrackPreview({ artist, title }: { artist: string; title: string }) {
  const { t } = useApp();
  const [status, setStatus] = useState<Status>('loading');
  const [track, setTrack] = useState<{ title: string; preview: string } | null>(null);
  const [isFileProtocol, setIsFileProtocol] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setStatus('loading');
    fetchTrackPreview(artist, title)
      .then((tr) => {
        if (cancelled) return;
        if (!tr) { setStatus('notfound'); return; }
        setTrack(tr);
        setStatus('found');
      })
      .catch(() => {
        if (cancelled) return;
        setIsFileProtocol(typeof location !== 'undefined' && location.protocol === 'file:');
        setStatus('error');
      });
    return () => { cancelled = true; };
  }, [artist, title]);

  if (status === 'loading') return <div className="archive-loading">{t('preview.loading')}</div>;
  if (status === 'notfound') return <div className="empty-state">{t('preview.notFound')}</div>;
  if (status === 'error') return <div className="empty-state">{isFileProtocol ? t('preview.fileProtocol') : t('preview.failed')}</div>;
  return (
    <>
      <div className="dz-preview-label">{t('preview.label', { title: track!.title })}</div>
      <audio controls style={{ width: '100%', height: 36 }} src={track!.preview} />
    </>
  );
}
