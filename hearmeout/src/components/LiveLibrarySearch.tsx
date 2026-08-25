'use client';

import { useEffect, useState } from 'react';
import { useApp } from '@/lib/AppContext';
import { searchLibrary, coverArtUrl, type LibraryArtist, type LibraryReleaseGroup } from '@/lib/musicbrainz';
import { CoverArt } from './ui/CoverArt';
import { ArtistAvatar } from './ui/ArtistAvatar';

export function LiveLibrarySearch({ query }: { query: string }) {
  const { t, openArtist } = useApp();
  const [result, setResult] = useState<{ artists: LibraryArtist[]; groups: LibraryReleaseGroup[] } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    const timer = setTimeout(() => {
      searchLibrary(query)
        .then((r) => { if (!cancelled) { setResult(r); setLoading(false); } })
        .catch((err) => {
          if (cancelled) return;
          const isFileProtocol = typeof location !== 'undefined' && location.protocol === 'file:';
          setError(isFileProtocol
            ? t('liveSearch.fileProtocolError')
            : t('liveSearch.error', { error: err instanceof Error ? err.message : String(err) }));
          setLoading(false);
        });
    }, 450);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [query, t]);

  if (loading) return <div className="archive-loading">{t('liveSearch.searching', { query })}</div>;
  if (error) return <div className="empty-state">{error}</div>;
  if (!result || (!result.artists.length && !result.groups.length)) {
    return <div className="empty-state">{t('liveSearch.empty')}</div>;
  }

  return (
    <>
      {result.artists.length > 0 && (
        <>
          <div className="lib-subhead">{t('liveSearch.artists')}</div>
          <div className="row-scroll">
            {result.artists.map((ar) => (
              <div className="cover" key={ar.id} onClick={() => openArtist(ar.id, ar.name)}>
                <ArtistAvatar name={ar.name} />
                <div className="meta"><div className="t">{ar.name}</div><div className="a">{ar.type || t('liveSearch.artistType')}</div></div>
              </div>
            ))}
          </div>
        </>
      )}
      {result.groups.length > 0 && (
        <>
          <div className="lib-subhead">{t('liveSearch.albums')}</div>
          <div className="grid-cards">
            {result.groups.map((g) => {
              const artist = (g['artist-credit'] || []).map((c) => c.name).join(', ') || t('liveSearch.unknownArtist');
              const year = g['first-release-date'] ? g['first-release-date'].slice(0, 4) : '—';
              const cover = coverArtUrl(g.id);
              return (
                <div className="cover" key={g.id}>
                  <CoverArt url={cover} fallbackLetter={artist[0] || '?'} className="art" />
                  <div className="meta"><div className="t">{g.title}</div><div className="a">{artist} · {year}</div></div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </>
  );
}
