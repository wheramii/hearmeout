'use client';

import { usePlayer } from '@/lib/PlayerContext';
import { useApp } from '@/lib/AppContext';
import { LogoMark, PlayIcon } from './ui/Icons';

const RADIUS = 17;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

function formatTime(sec: number) {
  if (!Number.isFinite(sec) || sec < 0) sec = 0;
  return `0:${Math.floor(sec).toString().padStart(2, '0')}`;
}

export function TransportRing({ size = 38 }: { size?: number }) {
  const { playing, progress, status, toggle } = usePlayer();
  const offset = CIRCUMFERENCE * (1 - progress);
  return (
    <div className="transport-ring" style={{ width: size, height: size }} onClick={toggle}>
      <svg viewBox="0 0 40 40" className="transport-ring-svg">
        <circle className="cp-track" cx="20" cy="20" r={RADIUS} />
        {status === 'ready' && (
          <circle className="cp-progress" cx="20" cy="20" r={RADIUS} style={{ strokeDasharray: CIRCUMFERENCE, strokeDashoffset: offset }} />
        )}
      </svg>
      <div className="transport-ring-center">
        {playing ? <LogoMark animate size={Math.round(size * 0.42)} /> : <PlayIcon size={Math.round(size * 0.4)} />}
      </div>
    </div>
  );
}

export function DockedPlayerDesktop() {
  const { t } = useApp();
  const { currentTrack, status, progress } = usePlayer();

  if (!currentTrack) return null;
  const openSpotifyUrl = currentTrack.spotifyId ? `https://open.spotify.com/album/${currentTrack.spotifyId}` : null;
  const elapsed = formatTime(progress * 30);

  return (
    <div className="docked-player">
      <div className="dp-art" style={currentTrack.cover ? { backgroundImage: `url('${currentTrack.cover}')` } : undefined} />
      <div className="dp-info">
        <div className="dp-title">{currentTrack.title}</div>
        <div className="dp-artist">{currentTrack.artist}</div>
      </div>
      <TransportRing size={38} />
      <div className="dp-time">{status === 'unavailable' ? t('player.unavailable') : `${elapsed} / 0:30`}</div>
      <div className="dp-spacer" />
      <span className="dp-chip">{t('player.previewChip')}</span>
      {openSpotifyUrl && <a className="action-chip" href={openSpotifyUrl} target="_blank" rel="noreferrer">{t('album.openInSpotify')}</a>}
    </div>
  );
}

export function DockedPlayerMobile() {
  const { currentTrack, progress } = usePlayer();
  if (!currentTrack) return null;
  const elapsed = formatTime(progress * 30);

  return (
    <div className="docked-player-mobile">
      <div className="dp-art" style={currentTrack.cover ? { backgroundImage: `url('${currentTrack.cover}')` } : undefined} />
      <div className="dp-info">
        <div className="dp-title">{currentTrack.title}</div>
        <div className="dp-artist">{currentTrack.artist}</div>
      </div>
      <div className="dp-time">{elapsed}</div>
      <TransportRing size={36} />
    </div>
  );
}
